const AWS = require('aws-sdk');
const Anthropic = require('@anthropic-ai/sdk');
const { v4: uuidv4 } = require('uuid');

// AWS services
const s3 = new AWS.S3();
const cloudWatchLogs = new AWS.CloudWatchLogs();

// Environment variables
const S3_BUCKET = process.env.S3_BUCKET || 'color-code-research-reports';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const LOG_GROUP = process.env.LOG_GROUP || '/aws/lambda/report-processor';

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY
});

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
 * Process research report using Claude API
 * @param {object} requestData - Request data including team, task, formData, requestId
 * @param {object} options - Processing options
 * @returns {object} - Processing result
 */
async function processResearchReport(requestData, options = {}) {
  const { team, task, formData, requestId } = requestData;
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

    let lastError;
    let attemptCount = 0;

    // Retry logic for LLM calls
    while (attemptCount <= maxRetries) {
      try {
        // Call Claude API
        const response = await anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 8192,
          temperature: 0.3,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });

        // Validate response
        if (!response.content || response.content.length === 0) {
          return {
            success: false,
            requestId,
            error: 'LLM returned empty or invalid response',
            errorType: 'INVALID_RESPONSE'
          };
        }

        // Extract and clean content
        const rawContent = response.content[0].text;
        const processedContent = strip_think_blocks(rawContent);
        
        // Extract summary
        const contentSummary = extractContentSummary(processedContent);
        
        // Calculate metrics
        const wordCount = processedContent.split(/\s+/).length;
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
          rawContent,
          contentSummary,
          wordCount,
          processingTime,
          modelUsed: 'claude-3-5-sonnet-20241022',
          timestamp: new Date().toISOString(),
          metadata: {
            promptLength: prompt.length,
            attemptCount: attemptCount + 1
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

        return {
          success: true,
          requestId,
          s3Location: uploadResult.Location,
          s3Key: uploadResult.Key,
          contentSummary,
          wordCount,
          processingTime
        };

      } catch (error) {
        lastError = error;
        attemptCount++;

        // Check if it's a timeout error that should be retried
        if (error.code === 'TIMEOUT' && attemptCount <= maxRetries) {
          await logToCloudWatch(`report-processor-${requestId}`, `Attempt ${attemptCount} failed, retrying`, {
            requestId,
            error: error.message
          });
          continue;
        }

        // Break out of retry loop for non-retryable errors
        break;
      }
    }

    // Handle final error after retries
    if (lastError) {
      await logToCloudWatch(`report-processor-${requestId}`, 'Processing failed after retries', {
        requestId,
        error: lastError.message,
        attempts: attemptCount
      });

      if (lastError.code === 'TIMEOUT') {
        return {
          success: false,
          requestId,
          error: 'LLM request timeout - please try again',
          errorType: 'TIMEOUT'
        };
      }

      return {
        success: false,
        requestId,
        error: `Processing failed: ${lastError.message}`,
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
  
  if (!requestData.task) {
    errors.push('Missing required field: task');
  }
  
  if (!requestData.formData) {
    errors.push('Missing required field: formData');
  }
  
  if (!requestData.requestId) {
    errors.push('Missing required field: requestId');
  } else if (typeof requestData.requestId !== 'string' || requestData.requestId.trim() === '') {
    errors.push('Request ID cannot be empty');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Export functions for testing and usage
module.exports = {
  strip_think_blocks,
  formatPromptForTeam,
  processResearchReport,
  generateDownloadUrl,
  extractContentSummary,
  logToCloudWatch,
  validateRequestData
};