// Lambda function for SQS submission
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const sqsClient = new SQSClient({ region: process.env.AWS_REGION || 'us-east-1' });
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Cache secrets to avoid repeated calls
let cachedSecrets = null;

const getSecrets = async () => {
  if (cachedSecrets) return cachedSecrets;
  
  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.SECRETS_ARN || 'color-code-research-hub-secrets'
    });
    
    const response = await secretsClient.send(command);
    cachedSecrets = JSON.parse(response.SecretString);
    return cachedSecrets;
  } catch (error) {
    console.error('Failed to retrieve secrets:', error);
    throw new Error('Configuration error');
  }
};

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
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
    const body = JSON.parse(event.body);
    const { teamType, formData, repoId } = body;
    
    if (!teamType || !formData || !repoId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ 
          error: 'Missing required fields',
          required: ['teamType', 'formData', 'repoId']
        })
      };
    }
    
    // Get configuration from Secrets Manager
    const secrets = await getSecrets();
    const queueUrl = secrets.SQS_QUEUE_URL || process.env.SQS_QUEUE_URL;
    const githubOrg = secrets.GITHUB_ORG || process.env.GITHUB_ORG || 'Flying-Pig-Labs';
    const clientName = secrets.CLIENT_COMPANY_NAME || process.env.CLIENT_COMPANY_NAME || 'Unknown';
    
    const repoName = `ci-${teamType}-${repoId}`;
    const repository = `${githubOrg}/${repoName}`;
    
    const sqsPayload = {
      repository,
      teamType,
      formData,
      repoId,
      branch: 'main',
      researchConfig: {
        teamType,
        researchSpecs: formData,
        metadata: {
          timestamp: new Date().toISOString(),
          client: clientName,
          source: 'research-hub-ui-amplify'
        }
      }
    };
    
    // Send message to SQS
    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify({
        timestamp: new Date().toISOString(),
        source: 'color-code-research-hub-amplify',
        ...sqsPayload
      }),
      MessageAttributes: {
        'TeamType': {
          DataType: 'String',
          StringValue: teamType
        },
        'Repository': {
          DataType: 'String',
          StringValue: repository
        },
        'Source': {
          DataType: 'String',
          StringValue: 'research-hub-ui-amplify'
        }
      }
    });
    
    const result = await sqsClient.send(command);
    
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ 
        status: 'accepted',
        message: 'Research request submitted to queue successfully',
        repoId,
        repository,
        expectedRepoName: repoName,
        githubUrl: `https://github.com/${repository}`,
        sqsMessageId: result.MessageId,
        estimatedTime: '2-5 minutes'
      })
    };
    
  } catch (error) {
    console.error('SQS submission error:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to submit to queue',
        message: error.message 
      })
    };
  }
};