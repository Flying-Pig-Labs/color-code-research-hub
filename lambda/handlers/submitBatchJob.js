const { BatchClient, SubmitJobCommand } = require('@aws-sdk/client-batch');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { v4: uuidv4 } = require('uuid');

const batchClient = new BatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Cache for secrets
let cachedJobQueueArn = null;

const getJobQueueArn = async () => {
  if (cachedJobQueueArn) {
    return cachedJobQueueArn;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: 'arn:aws:secretsmanager:us-east-1:984906149037:secret:batch-job-queue-arn-a18jG3'
    });
    
    const response = await secretsClient.send(command);
    cachedJobQueueArn = response.SecretString;
    
    if (!cachedJobQueueArn) {
      throw new Error('Job queue ARN not found in secret');
    }
    
    return cachedJobQueueArn;
  } catch (error) {
    console.error('Failed to retrieve job queue ARN:', error);
    throw new Error('Configuration error: Unable to retrieve job queue ARN');
  }
};

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Parse request body
    const body = JSON.parse(event.body);
    const { repo } = body;

    if (!repo) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Repository name is required' })
      };
    }

    // Validate repo is from mvp-builder-app
    if (!repo.startsWith('mvp-builder-app/')) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Only mvp-builder-app repositories are supported' })
      };
    }

    // Get job queue ARN from Secrets Manager
    const jobQueueArn = await getJobQueueArn();

    // Generate unique job ID
    const customJobId = uuidv4();
    const jobName = `mvp-backlog-${repo.split('/')[1]}-${Date.now()}`;

    // Submit job to Batch
    const params = {
      jobName: jobName,
      jobQueue: jobQueueArn,
      jobDefinition: process.env.JOB_DEFINITION || 'mvp-backlog-generator:1',
      containerOverrides: {
        environment: [
          { name: 'REPO', value: repo },  // Changed from GITHUB_REPO to REPO
          { name: 'MODE', value: 'run-all' },
          { name: 'JOB_ID', value: customJobId },
          { name: 'S3_BUCKET', value: process.env.S3_BUCKET || 'mvp-builder-app-bucket' }
        ]
      },
      tags: {
        'Repository': repo,
        'CustomJobId': customJobId,
        'SubmittedAt': new Date().toISOString()
      }
    };

    const command = new SubmitJobCommand(params);
    const response = await batchClient.send(command);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        jobId: response.jobId,
        customJobId: customJobId,
        jobName: jobName,
        status: 'SUBMITTED',
        repository: repo
      })
    };
  } catch (error) {
    console.error('Error submitting job:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to submit job',
        message: error.message
      })
    };
  }
};