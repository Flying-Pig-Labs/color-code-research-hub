// Start Plan Generation Handler - Async Job Creation
// Updated to support DynamoDB table for job tracking
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { LambdaClient, InvokeCommand } = require('@aws-sdk/client-lambda');
const { v4: uuidv4 } = require('uuid');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});
const lambdaClient = new LambdaClient({});

const JOBS_TABLE_NAME = process.env.JOBS_TABLE_NAME;
const ORCHESTRATOR_FUNCTION_NAME = process.env.ORCHESTRATOR_FUNCTION_NAME;

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
    const { projectDescription, selectedTeams, teamFields, githubConfig } = body;

    // Generate unique job ID
    const jobId = uuidv4();
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
        projectDescription,
        selectedTeams,
        teamFields,
        githubConfig
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
    await lambdaClient.send(new InvokeCommand({
      FunctionName: ORCHESTRATOR_FUNCTION_NAME,
      InvocationType: 'Event', // Async invocation
      Payload: JSON.stringify({
        jobId,
        input: jobRecord.input
      })
    }));

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