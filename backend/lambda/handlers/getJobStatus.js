/**
 * @file getJobStatus.js
 * @description Job status polling endpoint for async plan generation
 * 
 * This Lambda function provides real-time status updates for plan generation jobs:
 * 1. Retrieves job record from DynamoDB by jobId
 * 2. Maps backend stage names to frontend-friendly names
 * 3. Calculates progress percentage and completion status
 * 4. Returns current stage, results, and error information
 * 
 * POLLING PATTERN:
 * Frontend polls this endpoint every 3 seconds during generation:
 * GET /api/plan/async/status/{jobId}
 * 
 * Progress tracking through job stages:
 * - parseReadme → "Form Analysis"
 * - populateForm → "Form Analysis" 
 * - generatePhases → "Phase Generation"
 * - epicGeneration → "Epic Generation"
 * - issueFormatting → "Issue Formatting"
 * - createGitHubIssues → "GitHub Creation"
 * 
 * STATUS TRANSITIONS:
 * INITIATED → PROCESSING → COMPLETED/FAILED
 * 
 * RESPONSE MAPPING:
 * Backend uses 'COMPLETED' but frontend expects 'completed' (lowercase)
 * Backend stores 'results' but frontend expects 'result' (singular)
 * 
 * ERROR SCENARIOS:
 * - 400: Missing jobId parameter
 * - 404: Job not found in DynamoDB
 * - 500: DynamoDB query errors
 * 
 * PERFORMANCE:
 * - Simple DynamoDB GetItem operation
 * - 30 second timeout sufficient
 * - Minimal memory requirements
 * 
 * @module getJobStatus
 * @requires @aws-sdk/client-dynamodb - DynamoDB client
 * @requires @aws-sdk/lib-dynamodb - Document client for simplified operations
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

const JOBS_TABLE_NAME = process.env.JOBS_TABLE_NAME;

/**
 * Lambda handler for job status polling
 * 
 * Retrieves and formats job status for frontend consumption.
 * Maps backend data structures to frontend expected format.
 * 
 * PATH PARAMETERS:
 * - jobId: The unique job identifier from startPlanGeneration
 * 
 * RESPONSE STRUCTURE (Success - 200):
 * {
 *   jobId: 'job-xyz123-abc789',
 *   status: 'processing|completed|failed', // lowercase for frontend
 *   stage: 'Current Stage Name', // human-readable stage name
 *   progress: 75, // percentage complete (0-100)
 *   completedStages: ['Form Analysis', 'Phase Generation'], // completed stages list
 *   issuesCreated: 0, // GitHub issues created count
 *   totalIssues: 45, // total issues in generated plan
 *   createdAt: '2024-01-01T00:00:00.000Z',
 *   updatedAt: '2024-01-01T00:05:30.000Z',
 *   errors: [], // array of error objects
 *   result?: { // only included when status = 'completed'
 *     phases: [...], // generated SDLC phases
 *     githubIssues: [...], // created GitHub issues
 *     metadata: { ... } // project metadata
 *   },
 *   error?: 'Error message' // only included when status = 'failed'
 * }
 * 
 * RESPONSE STRUCTURE (Not Found - 404):
 * {
 *   error: 'Not Found',
 *   message: 'Job {jobId} not found'
 * }
 * 
 * RESPONSE STRUCTURE (Bad Request - 400):
 * {
 *   error: 'Bad Request',
 *   message: 'Job ID is required'
 * }
 * 
 * STAGE NAME MAPPING:
 * Backend stages are mapped to user-friendly names:
 * - populateForm → "Form Analysis"
 * - generatePhases → "Phase Generation" 
 * - epicGeneration → "Epic Generation"
 * - issueFormatting → "Issue Formatting"
 * - createGitHubIssues → "GitHub Creation"
 * 
 * PROGRESS CALCULATION:
 * Progress = (completed + skipped stages) / total stages * 100
 * Rounds to nearest integer percentage.
 * 
 * @async
 * @function handler
 * @param {Object} event - API Gateway event
 * @param {Object} event.pathParameters - URL path parameters
 * @param {string} event.pathParameters.jobId - Job ID to query
 * @returns {Promise<Object>} Lambda response with job status
 * @throws {Error} If DynamoDB query fails
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Content-Type': 'application/json'
  };

  try {
    const jobId = event.pathParameters?.jobId;
    
    if (!jobId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Job ID is required'
        })
      };
    }

    // Get job from DynamoDB
    const { Item: job } = await docClient.send(new GetCommand({
      TableName: JOBS_TABLE_NAME,
      Key: { jobId }
    }));

    if (!job) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Not Found',
          message: `Job ${jobId} not found`
        })
      };
    }

    // Map backend stage names to frontend stage names
    const stageNameMapping = {
      'populateForm': 'Form Analysis',
      'generatePhases': 'Phase Generation',
      'epicGeneration': 'Epic Generation',
      'issueFormatting': 'Issue Formatting',
      'createGitHubIssues': 'GitHub Creation'
    };

    // Calculate progress percentage and completed stages
    const stages = Object.entries(job.stages || {});
    const completedStagesList = stages
      .filter(([_, stage]) => stage.status === 'completed' || stage.status === 'skipped')
      .map(([stageName, _]) => stageNameMapping[stageName] || stageName);
    
    const totalStages = stages.length;
    const progress = totalStages > 0 ? Math.round((completedStagesList.length / totalStages) * 100) : 0;

    // Find current stage
    let currentStageName = '';
    const currentStageEntry = stages.find(([_, stage]) => stage.status === 'in_progress');
    if (currentStageEntry) {
      currentStageName = stageNameMapping[currentStageEntry[0]] || currentStageEntry[0];
    }

    // Prepare response based on job status - map to frontend expected format
    const response = {
      jobId: job.jobId,
      status: job.status.toLowerCase(), // Frontend expects lowercase
      stage: currentStageName,
      progress,
      completedStages: completedStagesList,
      issuesCreated: 0, // Will be updated if we have this info
      totalIssues: 0, // Will be updated if we have this info
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      errors: job.errors || []
    };

    // Include results only if job is completed - note: frontend expects 'result' not 'results'
    if (job.status === 'COMPLETED' && job.results) {
      response.result = job.results;
      
      // Count total issues if available
      if (job.results.phases) {
        let totalIssues = 0;
        job.results.phases.forEach(phase => {
          if (phase.epics) {
            phase.epics.forEach(epic => {
              if (epic.issues) {
                totalIssues += epic.issues.length;
              }
            });
          } else if (phase.issues) {
            totalIssues += phase.issues.length;
          }
        });
        response.totalIssues = totalIssues;
      }
    }

    // Add error message if failed
    if (job.status === 'FAILED' && job.errors && job.errors.length > 0) {
      response.error = job.errors[job.errors.length - 1].error || 'Plan generation failed';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting job status:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};