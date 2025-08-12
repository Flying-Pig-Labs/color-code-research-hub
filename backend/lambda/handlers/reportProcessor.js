const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

// AWS services
const s3 = new S3Client({ region: 'us-east-1' });
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);

// Environment variables
const S3_BUCKET = process.env.REPORT_BUCKET || 'color-code-research-results-984906149037';

/**
 * Strip <think> blocks from LLM output to clean up the content
 * @param {string} content - Raw content from LLM
 * @returns {string} - Cleaned content without think blocks
 */
function strip_think_blocks(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }
  
  // Remove all <think>...</think> blocks including nested ones
  return content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

/**
 * Format prompt based on team type and form data
 * @param {string} team - Team type (red, white, black)
 * @param {object} formData - Form data for prompt generation
 * @returns {string} - Formatted prompt
 */
function formatPromptForTeam(team, formData) {
  // Import the existing prompt formatters from researchApi
  const { 
    formatRedTeamPrompt, 
    formatWhiteTeamPrompt, 
    formatBlackTeamPrompt 
  } = require('./services/prompt-formatters');

  switch (team.toLowerCase()) {
    case 'red':
      return formatRedTeamPrompt(formData);
    case 'white':
      return formatWhiteTeamPrompt(formData);
    case 'black':
      return formatBlackTeamPrompt(formData);
    default:
      return `RESEARCH SWARM - COMPREHENSIVE ANALYSIS

TARGET: ${formData.companyName || formData.targetCompany || 'Not specified'}

Execute comprehensive research and analysis with detailed findings and actionable insights.`;
  }
}

/**
 * Process research report using report-processing-service
 * @param {object} requestData - Request data including team, task, formData, requestId
 * @param {object} options - Processing options
 * @returns {object} - Processing result
 */
async function processResearchReport(requestData, options = {}) {
  // Import the service class
  const { ReportProcessingService } = require('./services/report-processing-service');
  const reportService = new ReportProcessingService();
  
  // Handle different field names from different invocation sources
  const team = requestData.team;
  const task = requestData.rawContent || requestData.task;
  const formData = requestData.metadata || requestData.formData || {};
  const requestId = requestData.reportId || requestData.requestId;
  const { maxRetries = 0 } = options;
  
  const startTime = Date.now();
  
  try {
    // Validate input data
    const validation = validateRequestData(requestData);
    if (!validation.isValid) {
      return {
        success: false,
        requestId,
        error: `Validation failed: ${validation.errors.join(', ')}`,
        errorType: 'VALIDATION_ERROR'
      };
    }

    // Generate formatted prompt
    const prompt = formatPromptForTeam(team, formData);
    
    // Log processing start
    console.log('Processing started', {
      requestId,
      team,
      taskLength: task.length,
      promptLength: prompt.length
    });


    // Use the report processing service instead of direct API call
    try {
      // Call the service which handles Bedrock/Claude integration
      const result = await reportService.processReport({
        reportId: requestId,
        rawContent: task,
        team: team,
        username: requestData.username || 'fprior', // Extract username or default
        objective: requestData.objective || prompt,
        metadata: formData,
        secrets: {}, // Secrets will be loaded from environment
        timeoutMs: 30000 // 30 second timeout
      });

      // Extract results from the new structure
      const summary = result.summary;
      const formattedReport = result.formattedReport;
      const s3Paths = result.s3Paths;
      const summaryWordCount = result.summaryWordCount;
      const processingTime = Date.now() - startTime;

      // Log success
      console.log('Processing completed successfully', {
        requestId,
        s3Paths,
        summaryWordCount,
        processingTime
      });

      // Update DynamoDB with the processed summary and metadata
      try {
        const tableName = process.env.RESEARCH_REPORTS_TABLE || 'ResearchReports';
        
        // Find the report by requestId and update it with the processed summary
        const scanParams = {
          TableName: tableName,
          FilterExpression: "requestId = :rid",
          ExpressionAttributeValues: { ":rid": requestData.requestId || requestId },
          Limit: 1
        };
        
        const scanCommand = new ScanCommand(scanParams);
        const scanResult = await dynamodb.send(scanCommand);
        
        if (scanResult.Items && scanResult.Items.length > 0) {
          const reportItem = scanResult.Items[0];
          
          // Update the item with the summary and S3 paths
          const updateParams = {
            TableName: tableName,
            Key: { reportId: reportItem.reportId },
            UpdateExpression: "SET processedSummary = :summary, summaryWordCount = :wc, processedAt = :pa, s3BasePath = :basePath, s3SummaryKey = :summaryKey, s3ReportKey = :reportKey, #status = :status, pipelineCompletedAt = :pca",
            ExpressionAttributeNames: {
              "#status": "status"
            },
            ExpressionAttributeValues: {
              ":summary": summary,
              ":wc": summaryWordCount,
              ":pa": new Date().toISOString(),
              ":basePath": s3Paths.basePath,
              ":summaryKey": s3Paths.summaryKey,
              ":reportKey": s3Paths.reportKey,
              ":status": "completed",
              ":pca": new Date().toISOString() // Pipeline completion timestamp
            }
          };
          
          const updateCommand = new UpdateCommand(updateParams);
          await dynamodb.send(updateCommand);
          console.log(`Updated DynamoDB report ${reportItem.reportId} with summary (${summaryWordCount} words) and S3 paths`);
        }
      } catch (dbError) {
        console.error('Failed to update DynamoDB with processed summary:', dbError);
        // Don't fail the whole operation if DB update fails
      }

      return {
        success: true,
        requestId,
        s3Paths: s3Paths,
        summary: summary,
        summaryWordCount: summaryWordCount,
        processingTime,
        processing: result.processing,
        message: 'Report processed successfully. Summary stored in DynamoDB, files saved to S3.'
      };

    } catch (error) {
      // Log the error
      console.error('Processing failed', {
        requestId,
        error: error.message
      });

      // Handle specific error types
      if (error.code && error.code.includes('S3')) {
        return {
          success: false,
          requestId,
          error: `Failed to save report to S3: ${error.message}`,
          errorType: 'S3_ERROR'
        };
      }

      // Return general error
      return {
        success: false,
        requestId,
        error: `Processing failed: ${error.message}`,
        errorType: 'PROCESSING_ERROR'
      };
    }

  } catch (error) {
    // Handle S3 upload errors
    if (error.code && error.code.includes('S3')) {
      return {
        success: false,
        requestId,
        error: `Failed to save report to S3: ${error.message}`,
        errorType: 'S3_ERROR'
      };
    }

    // Handle general errors
    return {
      success: false,
      requestId,
      error: `Unexpected error: ${error.message}`,
      errorType: 'GENERAL_ERROR'
    };
  }
}

/**
 * Generate signed URL for downloading report from S3
 * @param {string} s3Key - S3 object key
 * @returns {Promise<string>} - Signed URL
 */
async function generateDownloadUrl(s3Key) {
  try {
    const command = new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key
    });
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 }); // 1 hour
    return url;
  } catch (error) {
    throw error;
  }
}



/**
 * Validate request data
 * @param {object} requestData - Request data to validate
 * @returns {object} - Validation result
 */
function validateRequestData(requestData) {
  const errors = [];
  
  if (!requestData.team) {
    errors.push('Missing required field: team');
  } else if (!['red', 'white', 'black'].includes(requestData.team.toLowerCase())) {
    errors.push(`Invalid team type: ${requestData.team}. Must be one of: red, white, black`);
  }
  
  if (!requestData.rawContent && !requestData.task) {
    errors.push('Missing required field: rawContent or task');
  }
  
  if (!requestData.objective && !requestData.task) {
    errors.push('Missing required field: objective');
  }
  
  if (!requestData.requestId && !requestData.reportId) {
    errors.push('Missing required field: requestId or reportId');
  } else {
    const id = requestData.requestId || requestData.reportId;
    if (typeof id !== 'string' || id.trim() === '') {
      errors.push('Request/Report ID cannot be empty');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Lambda handler function
 */
exports.handler = async (event) => {
  console.log('Report Processor Lambda invoked:', JSON.stringify(event, null, 2));
  
  try {
    // Check if this is an SQS event
    if (event.Records && Array.isArray(event.Records)) {
      console.log(`Processing ${event.Records.length} SQS messages`);
      
      // Process all SQS messages
      const results = [];
      for (const record of event.Records) {
        try {
          // Parse the SQS message body
          const requestData = JSON.parse(record.body);
          console.log(`Processing report ${requestData.reportId} from SQS`);
          
          // Validate request data
          const validation = validateRequestData(requestData);
          if (!validation.isValid) {
            console.error(`Invalid SQS message for report ${requestData.reportId}:`, validation.errors);
            results.push({
              success: false,
              reportId: requestData.reportId,
              error: 'Invalid request',
              errors: validation.errors
            });
            continue;
          }
          
          // Process the report
          const result = await processResearchReport(requestData);
          results.push(result);
          
        } catch (recordError) {
          console.error('Error processing SQS record:', recordError);
          results.push({
            success: false,
            error: `Failed to process SQS record: ${recordError.message}`
          });
        }
      }
      
      // For SQS events, we return a simple response
      // Failed messages will be retried by SQS based on visibility timeout
      return {
        batchItemFailures: results
          .map((result, index) => 
            result.success ? null : { itemIdentifier: event.Records[index].messageId }
          )
          .filter(Boolean)
      };
    }
    
    // Handle direct invocation or API Gateway
    // Parse the body if it's a string (from API Gateway or direct invocation)
    let requestData;
    if (typeof event === 'string') {
      requestData = JSON.parse(event);
    } else if (event.body) {
      requestData = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    } else {
      requestData = event;
    }
    
    // Validate request data
    const validation = validateRequestData(requestData);
    if (!validation.isValid) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          success: false,
          error: 'Invalid request',
          errors: validation.errors
        })
      };
    }
    
    // Process the report
    const result = await processResearchReport(requestData);
    
    // Return appropriate response based on invocation type
    if (event.httpMethod) {
      // API Gateway invocation
      return {
        statusCode: result.success ? 200 : 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Accept',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE'
        },
        body: JSON.stringify(result)
      };
    } else {
      // Direct Lambda invocation
      return result;
    }
  } catch (error) {
    console.error('Handler error:', error);
    
    const errorResponse = {
      success: false,
      error: `Handler error: ${error.message}`,
      errorType: 'HANDLER_ERROR'
    };
    
    if (event.httpMethod) {
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(errorResponse)
      };
    }
    
    return errorResponse;
  }
};

// Export functions for testing and usage
module.exports = {
  handler: exports.handler,
  strip_think_blocks,
  formatPromptForTeam,
  processResearchReport,
  generateDownloadUrl,
  validateRequestData
};