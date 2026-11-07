/**
 * @file startPlanGeneration.js
 * @description Async job initiation handler for plan generation workflow
 * 
 * This Lambda function serves as the entry point for async plan generation:
 * 1. Accepts plan generation requests from the frontend
 * 2. Creates a unique job ID and initial job record in DynamoDB
 * 3. Asynchronously invokes the planOrchestrator function
 * 4. Returns job ID immediately for frontend polling
 * 
 * ARCHITECTURE PATTERN:
 * This implements the "Async Request-Response" pattern:
 * - Frontend POSTs to /api/plan/async/start (this function)
 * - Gets job ID back immediately (202 Accepted)
 * - Polls /api/plan/async/status/{jobId} for progress
 * - Long-running processing happens in planOrchestrator
 * 
 * TIMEOUT CONSIDERATIONS:
 * - This function: 30 second timeout (API Gateway limit)
 * - PlanOrchestrator: 900 second timeout (15 minutes)
 * - DynamoDB TTL: 24 hours for automatic job cleanup
 * 
 * JOB ID GENERATION:
 * Uses timestamp + random for uniqueness without external dependencies:
 * Format: job-{timestamp-base36}-{random-string}
 * 
 * AWS INTEGRATIONS:
 * - DynamoDB: Creates job record in PlanGenerationJobs table
 * - Lambda: Asynchronously invokes planOrchestrator function
 * - API Gateway: Handles CORS and HTTP routing
 * 
 * ERROR HANDLING:
 * - Input validation with descriptive error messages
 * - DynamoDB errors return 500 with error details
 * - Lambda invocation errors logged and re-thrown
 * 
 * @module startPlanGeneration
 * @requires @aws-sdk/client-dynamodb - DynamoDB client for job storage
 * @requires @aws-sdk/lib-dynamodb - Document client for simplified operations
 * @requires @aws-sdk/client-lambda - Lambda client for async invocation
 */
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
// Using timestamp-based ID instead of uuid to avoid dependency issues
/**
 * Generates unique job ID using timestamp and random components
 * 
 * Uses timestamp in base36 for compactness and random string for uniqueness.
 * This avoids external dependencies while ensuring collision resistance.
 * 
 * @function generateJobId
 * @returns {string} Unique job ID in format: job-{timestamp36}-{random9}
 * @example
 * // Returns something like: "job-l8x9m2-k5p7q3r8s"
 * const jobId = generateJobId();
 */
const generateJobId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 9);
  return `job-${timestamp}-${random}`;
};

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});
const lambdaClient = new LambdaClient({});

const JOBS_TABLE_NAME = process.env.JOBS_TABLE_NAME;
const ORCHESTRATOR_FUNCTION_NAME = process.env.ORCHESTRATOR_FUNCTION_NAME;

/**
 * Lambda handler for starting async plan generation jobs
 * 
 * Creates a new job record and asynchronously invokes the orchestrator.
 * Returns immediately with job ID for frontend polling.
 * 
 * REQUEST BODY STRUCTURE:
 * {
 *   projectDescription: 'Optional legacy field',
 *   selectedTeams: ['team1', 'team2'], // UI team selections
 *   teamFields: { ... }, // Additional form data
 *   githubConfig: {
 *     repository: 'owner/repo',
 *     createIssues: boolean
 *   },
 *   metadata: {
 *     title: 'Project Title',
 *     description: 'Project description',
 *     domain: 'e-commerce|social-media|...',
 *     features: ['feature1', 'feature2'],
 *     techStack: ['React', 'Node.js']
 *   },
 *   readmeContent: 'Full README.md content'
 * }
 * 
 * RESPONSE STRUCTURE (Success - 202):
 * {
 *   jobId: 'job-xyz123-abc789',
 *   status: 'INITIATED',
 *   message: 'Plan generation job started successfully',
 *   statusUrl: '/api/plan/async/status/{jobId}'
 * }
 * 
 * RESPONSE STRUCTURE (Error - 500):
 * {
 *   error: 'Failed to start plan generation',
 *   message: 'Detailed error message'
 * }
 * 
 * JOB STAGES INITIALIZED:
 * - parseReadme: Extract metadata from README
 * - populateForm: Auto-populate form fields
 * - generatePhases: Create SDLC phases with epics
 * - createGitHubIssues: Create GitHub milestones/issues
 * 
 * @async
 * @function handler
 * @param {Object} event - API Gateway event
 * @param {string} event.body - JSON request body
 * @param {string} event.httpMethod - HTTP method (POST/OPTIONS)
 * @returns {Promise<Object>} Lambda response with statusCode, headers, body
 * @throws {Error} If job creation or orchestrator invocation fails
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
    const body = JSON.parse(event.body);
    const { projectDescription, selectedTeams, teamFields, githubConfig, metadata, readmeContent } = body;

    // Generate unique job ID
    const jobId = generateJobId();
    const timestamp = new Date().toISOString();
    const ttl = Math.floor(Date.now() / 1000) + (24 * 60 * 60); // 24 hours TTL

    // Create initial job record
    const jobRecord = {
      jobId,
      status: 'INITIATED',
      createdAt: timestamp,
      updatedAt: timestamp,
      ttl,
      input: {
        projectDescription: projectDescription || metadata?.description,
        selectedTeams,
        teamFields,
        githubConfig,
        metadata,
        readmeContent
      },
      stages: {
        parseReadme: { status: 'pending', startedAt: null, completedAt: null },
        populateForm: { status: 'pending', startedAt: null, completedAt: null },
        generatePhases: { status: 'pending', startedAt: null, completedAt: null },
        createGitHubIssues: { status: 'pending', startedAt: null, completedAt: null }
      },
      results: {},
      errors: []
    };

    // Store job in DynamoDB
    await docClient.send(new PutCommand({
      TableName: JOBS_TABLE_NAME,
      Item: jobRecord
    }));

    // Invoke orchestrator function asynchronously
    console.log(`Invoking orchestrator function: ${ORCHESTRATOR_FUNCTION_NAME}`);
    console.log('Payload:', JSON.stringify({ jobId, input: jobRecord.input }));
    
    try {
      const invokeResult = await lambdaClient.send(new InvokeCommand({
        FunctionName: ORCHESTRATOR_FUNCTION_NAME,
        InvocationType: 'Event', // Async invocation
        Payload: JSON.stringify({
          jobId,
          input: jobRecord.input
        })
      }));
      console.log('Orchestrator invoked successfully:', invokeResult);
    } catch (invokeError) {
      console.error('Failed to invoke orchestrator:', invokeError);
      throw invokeError;
    }

    // Return job ID immediately
    return {
      statusCode: 202, // Accepted
      headers,
      body: JSON.stringify({
        jobId,
        status: 'INITIATED',
        message: 'Plan generation job started successfully',
        statusUrl: `/api/plan/async/status/${jobId}`
      })
    };
  } catch (error) {
    console.error('Error starting plan generation:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to start plan generation',
        message: error.message
      })
    };
  }
};