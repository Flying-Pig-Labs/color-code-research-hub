const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// AWS services
const s3 = new AWS.S3();
const cloudWatchLogs = new AWS.CloudWatchLogs();

// Environment variables
const S3_BUCKET = process.env.REPORT_BUCKET || 'color-code-research-results-984906149037';
const LOG_GROUP = process.env.LOG_GROUP || '/aws/lambda/report-processor';

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
  // Import the service function
  const { processResearchReport: processWithBedrock } = require('./services/report-processing-service');
  
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
    await logToCloudWatch(`report-processor-${requestId}`, 'Processing started', {
      requestId,
      team,
      taskLength: task.length,
      promptLength: prompt.length
    });


    // Use the report processing service instead of direct API call
    try {
      // Call the service which handles Bedrock/Claude integration
      const result = await processWithBedrock({
        reportId: requestId,
        rawContent: task,
        team: team,
        objective: requestData.objective || prompt,
        metadata: formData
      });

      if (!result.success) {
        return {
          success: false,
          requestId,
          error: result.error || 'Report processing failed',
          errorType: 'PROCESSING_ERROR'
        };
      }

      // Extract processed content from result
      const processedContent = result.result.cleanedContent || result.result.summary;
        
      // Extract summary and sections from result
      const contentSummary = result.result.summary;
      const sections = result.result.sections;
      
      // Calculate metrics
      const wordCount = result.result.wordCount || processedContent.split(/\s+/).length;
      const processingTime = Date.now() - startTime;

      // Generate S3 key with timestamp
      const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
      const s3Key = `reports/${team}_${timestamp}_${requestId}.json`;

      // Prepare report data
      const reportData = {
        requestId,
        team,
        originalTask: task,
        formData,
        processedContent,
        rawContent: task,
        contentSummary,
        sections,
        wordCount,
        processingTime,
        modelUsed: 'anthropic.claude-3-5-sonnet-20241022-v2:0',
        timestamp: new Date().toISOString(),
        metadata: {
          promptLength: prompt.length,
          apiCallsUsed: result.processing?.apiCallsUsed || 1,
          thinkBlocksRemoved: result.processing?.thinkBlocksRemoved || 0
        }
      };

        // Upload to S3
        const uploadResult = await s3.upload({
          Bucket: S3_BUCKET,
          Key: s3Key,
          Body: JSON.stringify(reportData, null, 2),
          ContentType: 'application/json',
          Metadata: {
            team,
            requestId,
            originalTask: task
          }
        }).promise();

        // Log success
        await logToCloudWatch(`report-processor-${requestId}`, 'Processing completed successfully', {
          requestId,
          s3Key,
          wordCount,
          processingTime
        });

      // Update DynamoDB with the processed summary
      try {
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const tableName = process.env.RESEARCH_REPORTS_TABLE || 'ResearchReports';
        
        // Find the report by requestId and update it with the processed summary
        const scanParams = {
          TableName: tableName,
          FilterExpression: "requestId = :rid",
          ExpressionAttributeValues: { ":rid": requestData.requestId || requestId },
          Limit: 1
        };
        
        const scanResult = await dynamodb.scan(scanParams).promise();
        
        if (scanResult.Items && scanResult.Items.length > 0) {
          const reportItem = scanResult.Items[0];
          
          // Update the item with processed summary
          const updateParams = {
            TableName: tableName,
            Key: { reportId: reportItem.reportId },
            UpdateExpression: "SET processedSummary = :summary, summaryWordCount = :wc, processedAt = :pa, processedS3Key = :s3key",
            ExpressionAttributeValues: {
              ":summary": contentSummary,
              ":wc": wordCount,
              ":pa": new Date().toISOString(),
              ":s3key": s3Key
            }
          };
          
          await dynamodb.update(updateParams).promise();
          console.log(`Updated DynamoDB report ${reportItem.reportId} with processed summary`);
        }
      } catch (dbError) {
        console.error('Failed to update DynamoDB with processed summary:', dbError);
        // Don't fail the whole operation if DB update fails
      }

      return {
        success: true,
        requestId,
        s3Location: uploadResult.Location,
        s3Key: uploadResult.Key,
        contentSummary,
        sections,
        wordCount,
        processingTime,
        processing: result.processing
      };

    } catch (error) {
      // Log the error
      await logToCloudWatch(`report-processor-${requestId}`, 'Processing failed', {
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
function generateDownloadUrl(s3Key) {
  return new Promise((resolve, reject) => {
    s3.getSignedUrl('getObject', {
      Bucket: S3_BUCKET,
      Key: s3Key,
      Expires: 3600 // 1 hour
    }, (err, url) => {
      if (err) {
        reject(err);
      } else {
        resolve(url);
      }
    });
  });
}

/**
 * Extract content summary from processed content
 * @param {string} content - Processed content
 * @returns {string} - Content summary
 */
function extractContentSummary(content) {
  if (!content || typeof content !== 'string') {
    return 'No summary available';
  }

  // Remove markdown headers and get first substantial paragraph
  const cleanContent = content.replace(/^#+\s*/gm, '').trim();
  const paragraphs = cleanContent.split('\n\n').filter(p => p.trim().length > 0);
  
  if (paragraphs.length === 0) {
    return 'No summary available';
  }

  let summary = paragraphs[0].trim();
  
  // Find first meaningful paragraph (skip empty or very short ones)
  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (trimmed.length > 50) {
      summary = trimmed;
      break;
    }
  }

  // Truncate if too long
  if (summary.length > 250) {
    summary = summary.substring(0, 247) + '...';
  }

  return summary;
}

/**
 * Log events to CloudWatch
 * @param {string} logStreamName - Log stream name
 * @param {string} message - Log message
 * @param {object} metadata - Additional metadata
 */
async function logToCloudWatch(logStreamName, message, metadata = {}) {
  try {
    const logEvent = {
      timestamp: Date.now(),
      message: JSON.stringify({
        level: 'INFO',
        message,
        ...metadata,
        timestamp: new Date().toISOString()
      })
    };

    await cloudWatchLogs.putLogEvents({
      logGroupName: LOG_GROUP,
      logStreamName,
      logEvents: [logEvent]
    }).promise();
  } catch (error) {
    // Don't throw on logging errors
    console.error('CloudWatch logging failed:', error);
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
  extractContentSummary,
  logToCloudWatch,
  validateRequestData
};