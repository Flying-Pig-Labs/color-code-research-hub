# PLAN Tab Lambda Functions Specification

## Overview

This document specifies the Lambda functions required to support the PLAN tab functionality, including GitHub repository management, agent-team-composer execution, and real-time progress tracking.

## Lambda Functions

### 1. GitHubRepoFunction

**Purpose**: Handle GitHub repository operations including listing, fetching details, and README content.

```javascript
// lambda/handlers/githubRepo.js

const { Octokit } = require('@octokit/rest');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

/**
 * Main handler for GitHub repository operations
 */
exports.handler = async (event) => {
  const { httpMethod, path, headers, queryStringParameters } = event;
  
  try {
    // Get GitHub token from Secrets Manager
    const token = await getGitHubToken();
    const octokit = new Octokit({ auth: token });
    
    // Route to appropriate handler
    if (path === '/api/github/repos' && httpMethod === 'GET') {
      return await listRepositories(octokit, queryStringParameters);
    } else if (path.match(/\/api\/github\/repos\/([^\/]+)\/([^\/]+)$/) && httpMethod === 'GET') {
      const [, owner, repo] = path.match(/\/api\/github\/repos\/([^\/]+)\/([^\/]+)$/);
      return await getRepository(octokit, owner, repo);
    } else if (path.match(/\/api\/github\/repos\/([^\/]+)\/([^\/]+)\/readme$/) && httpMethod === 'GET') {
      const [, owner, repo] = path.match(/\/api\/github\/repos\/([^\/]+)\/([^\/]+)\/readme$/);
      return await getReadme(octokit, owner, repo);
    }
    
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Not Found' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: error.status || 500,
      body: JSON.stringify({ 
        message: error.message || 'Internal Server Error' 
      })
    };
  }
};

/**
 * List user repositories with pagination
 */
async function listRepositories(octokit, params = {}) {
  const { page = 1, per_page = 30, sort = 'updated', direction = 'desc' } = params;
  
  const response = await octokit.repos.listForAuthenticatedUser({
    page: parseInt(page),
    per_page: parseInt(per_page),
    sort,
    direction
  });
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Total-Count': response.headers['x-ratelimit-remaining']
    },
    body: JSON.stringify({
      repositories: response.data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        updated_at: repo.updated_at,
        language: repo.language,
        private: repo.private
      })),
      pagination: {
        page: parseInt(page),
        per_page: parseInt(per_page),
        total: parseInt(response.headers['x-total-count'] || '0')
      }
    })
  };
}
```

### 2. AgentComposerFunction

**Purpose**: Execute agent-team-composer operations including plan generation and job management.

```javascript
// lambda/handlers/agentComposer.js

const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { v4: uuidv4 } = require('uuid');
const Anthropic = require('@anthropic-ai/sdk');

/**
 * Main handler for agent composer operations
 */
exports.handler = async (event) => {
  const { httpMethod, path, body } = event;
  
  try {
    if (path === '/api/agent-composer/generate' && httpMethod === 'POST') {
      return await startGeneration(JSON.parse(body));
    } else if (path.match(/\/api\/agent-composer\/status\/(.+)$/) && httpMethod === 'GET') {
      const [, jobId] = path.match(/\/api\/agent-composer\/status\/(.+)$/);
      return await getJobStatus(jobId);
    } else if (path.match(/\/api\/agent-composer\/results\/(.+)$/) && httpMethod === 'GET') {
      const [, jobId] = path.match(/\/api\/agent-composer\/results\/(.+)$/);
      return await getJobResults(jobId);
    }
    
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Not Found' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error.message })
    };
  }
};

/**
 * Start a new generation job
 */
async function startGeneration(request) {
  const { repo, readmeContent, options = {} } = request;
  const jobId = uuidv4();
  
  // Store job in DynamoDB
  const dynamodb = new DynamoDBClient();
  await dynamodb.send(new PutItemCommand({
    TableName: process.env.JOBS_TABLE,
    Item: {
      jobId: { S: jobId },
      status: { S: 'pending' },
      repo: { S: JSON.stringify(repo) },
      createdAt: { N: Date.now().toString() },
      progress: { N: '0' }
    }
  }));
  
  // Queue job for processing
  const sqs = new SQSClient();
  await sqs.send(new SendMessageCommand({
    QueueUrl: process.env.GENERATION_QUEUE_URL,
    MessageBody: JSON.stringify({
      jobId,
      repo,
      readmeContent,
      options
    })
  }));
  
  return {
    statusCode: 202,
    body: JSON.stringify({
      jobId,
      status: 'pending',
      message: 'Generation job started'
    })
  };
}

/**
 * Process generation job (called by SQS)
 */
async function processGenerationJob(jobData) {
  const { jobId, repo, readmeContent, options } = jobData;
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  
  try {
    // Update status to processing
    await updateJobStatus(jobId, 'processing', 10, 'Analyzing README...');
    
    // Phase 1: Parse README
    const parsedData = await parseReadme(readmeContent);
    await updateJobStatus(jobId, 'processing', 20, 'Generating project phases...');
    
    // Phase 2: Generate phases
    const phases = await generatePhases(anthropic, parsedData, readmeContent);
    await updateJobStatus(jobId, 'processing', 40, 'Creating epics...');
    
    // Phase 3: Generate epics
    const epics = await generateEpics(anthropic, phases, parsedData);
    await updateJobStatus(jobId, 'processing', 60, 'Formatting issues...');
    
    // Phase 4: Format issues
    const issues = await formatIssues(anthropic, epics, phases);
    await updateJobStatus(jobId, 'processing', 80, 'Finalizing plan...');
    
    // Store results
    const results = {
      summary: parsedData,
      phases,
      epics,
      issues,
      metadata: {
        generatedAt: new Date().toISOString(),
        repoName: repo.full_name,
        aiModel: 'claude-3-sonnet-20240229'
      }
    };
    
    await storeResults(jobId, results);
    await updateJobStatus(jobId, 'completed', 100, 'Generation complete!');
    
  } catch (error) {
    console.error('Generation error:', error);
    await updateJobStatus(jobId, 'failed', 0, error.message);
  }
}
```

### 3. ProgressWebSocketFunction

**Purpose**: Handle WebSocket connections for real-time progress updates.

```javascript
// lambda/handlers/progressWebSocket.js

const { DynamoDBClient, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

/**
 * WebSocket connection handler
 */
exports.handler = async (event) => {
  const { routeKey, connectionId, domainName, stage } = event.requestContext;
  
  switch (routeKey) {
    case '$connect':
      return await handleConnect(connectionId, event.queryStringParameters);
    case '$disconnect':
      return await handleDisconnect(connectionId);
    case 'sendProgress':
      return await handleProgress(event);
    default:
      return { statusCode: 404 };
  }
};

/**
 * Handle new WebSocket connection
 */
async function handleConnect(connectionId, params) {
  const { jobId } = params || {};
  
  if (!jobId) {
    return { statusCode: 400, body: 'Missing jobId parameter' };
  }
  
  // Store connection mapping
  const dynamodb = new DynamoDBClient();
  await dynamodb.send(new PutItemCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    Item: {
      connectionId: { S: connectionId },
      jobId: { S: jobId },
      connectedAt: { N: Date.now().toString() }
    }
  }));
  
  // Send initial status
  const jobStatus = await getJobStatus(jobId);
  await sendToConnection(connectionId, jobStatus);
  
  return { statusCode: 200 };
}

/**
 * Send progress update to connected clients
 */
async function broadcastProgress(jobId, update) {
  const dynamodb = new DynamoDBClient();
  
  // Get all connections for this job
  const connections = await dynamodb.send(new QueryCommand({
    TableName: process.env.CONNECTIONS_TABLE,
    IndexName: 'jobId-index',
    KeyConditionExpression: 'jobId = :jobId',
    ExpressionAttributeValues: {
      ':jobId': { S: jobId }
    }
  }));
  
  // Send update to each connection
  const api = new ApiGatewayManagementApiClient({
    endpoint: `https://${domainName}/${stage}`
  });
  
  const promises = connections.Items.map(async (item) => {
    try {
      await api.send(new PostToConnectionCommand({
        ConnectionId: item.connectionId.S,
        Data: JSON.stringify(update)
      }));
    } catch (error) {
      if (error.statusCode === 410) {
        // Connection no longer exists, remove it
        await removeConnection(item.connectionId.S);
      }
    }
  });
  
  await Promise.all(promises);
}
```

### 4. GitHubIntegrationFunction

**Purpose**: Handle GitHub issue and milestone creation.

```javascript
// lambda/handlers/githubIntegration.js

const { Octokit } = require('@octokit/rest');

/**
 * Create milestones and issues in GitHub
 */
exports.handler = async (event) => {
  const { httpMethod, path, body } = event;
  
  if (path === '/api/github/create-issues' && httpMethod === 'POST') {
    const request = JSON.parse(body);
    return await createIssuesAndMilestones(request);
  }
  
  return { statusCode: 404 };
};

async function createIssuesAndMilestones(request) {
  const { repo, phases, issues, options = {} } = request;
  const octokit = new Octokit({ auth: await getGitHubToken() });
  
  const results = {
    milestones: [],
    issues: [],
    errors: []
  };
  
  try {
    // Create milestones for each phase
    for (const phase of phases) {
      try {
        const milestone = await octokit.issues.createMilestone({
          owner: repo.owner,
          repo: repo.name,
          title: phase.title,
          description: phase.description,
          due_on: calculateDueDate(phase.estimatedDays)
        });
        results.milestones.push(milestone.data);
      } catch (error) {
        results.errors.push({ phase: phase.id, error: error.message });
      }
    }
    
    // Create issues with rate limiting
    const BATCH_SIZE = 3;
    const DELAY_MS = 1000;
    
    for (let i = 0; i < issues.length; i += BATCH_SIZE) {
      const batch = issues.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (issue) => {
        try {
          const milestone = results.milestones.find(m => 
            m.title === phases.find(p => p.id === issue.phaseId)?.title
          );
          
          const createdIssue = await octokit.issues.create({
            owner: repo.owner,
            repo: repo.name,
            title: issue.title,
            body: issue.body,
            labels: issue.labels,
            milestone: milestone?.number
          });
          
          results.issues.push(createdIssue.data);
        } catch (error) {
          results.errors.push({ issue: issue.title, error: error.message });
        }
      }));
      
      // Rate limiting delay
      if (i + BATCH_SIZE < issues.length) {
        await new Promise(resolve => setTimeout(resolve, DELAY_MS));
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        created: {
          milestones: results.milestones.length,
          issues: results.issues.length
        },
        errors: results.errors
      })
    };
    
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    };
  }
}
```

## SAM Template Updates

```yaml
# Add to template.yaml

# DynamoDB Tables
JobsTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: !Sub ${AWS::StackName}-jobs
    AttributeDefinitions:
      - AttributeName: jobId
        AttributeType: S
    KeySchema:
      - AttributeName: jobId
        KeyType: HASH
    BillingMode: PAY_PER_REQUEST

ConnectionsTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: !Sub ${AWS::StackName}-connections
    AttributeDefinitions:
      - AttributeName: connectionId
        AttributeType: S
      - AttributeName: jobId
        AttributeType: S
    KeySchema:
      - AttributeName: connectionId
        KeyType: HASH
    GlobalSecondaryIndexes:
      - IndexName: jobId-index
        KeySchema:
          - AttributeName: jobId
            KeyType: HASH
        Projection:
          ProjectionType: ALL
    BillingMode: PAY_PER_REQUEST

# SQS Queue for job processing
GenerationQueue:
  Type: AWS::SQS::Queue
  Properties:
    QueueName: !Sub ${AWS::StackName}-generation-queue
    VisibilityTimeout: 300  # 5 minutes for long-running jobs

# Lambda Functions
GitHubRepoFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: ../lambda/handlers/
    Handler: githubRepo.handler
    Environment:
      Variables:
        SECRETS_ARN: !Ref AppSecrets
    Policies:
      - Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - secretsmanager:GetSecretValue
            Resource: !Ref AppSecrets
    Events:
      ListRepos:
        Type: Api
        Properties:
          RestApiId: !Ref ResearchHubApi
          Path: /api/github/repos
          Method: GET
      GetRepo:
        Type: Api
        Properties:
          RestApiId: !Ref ResearchHubApi
          Path: /api/github/repos/{owner}/{repo}
          Method: GET
      GetReadme:
        Type: Api
        Properties:
          RestApiId: !Ref ResearchHubApi
          Path: /api/github/repos/{owner}/{repo}/readme
          Method: GET

AgentComposerFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: ../lambda/handlers/
    Handler: agentComposer.handler
    Timeout: 300  # 5 minutes
    Environment:
      Variables:
        JOBS_TABLE: !Ref JobsTable
        GENERATION_QUEUE_URL: !Ref GenerationQueue
        ANTHROPIC_API_KEY: !Sub '{{resolve:secretsmanager:${AppSecrets}:SecretString:ANTHROPIC_API_KEY}}'
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref JobsTable
      - SQSSendMessagePolicy:
          QueueName: !GetAtt GenerationQueue.QueueName
    Events:
      StartGeneration:
        Type: Api
        Properties:
          RestApiId: !Ref ResearchHubApi
          Path: /api/agent-composer/generate
          Method: POST
      GetStatus:
        Type: Api
        Properties:
          RestApiId: !Ref ResearchHubApi
          Path: /api/agent-composer/status/{jobId}
          Method: GET
      GetResults:
        Type: Api
        Properties:
          RestApiId: !Ref ResearchHubApi
          Path: /api/agent-composer/results/{jobId}
          Method: GET

# WebSocket API
ProgressWebSocketApi:
  Type: AWS::ApiGatewayV2::Api
  Properties:
    Name: !Sub ${AWS::StackName}-progress-ws
    ProtocolType: WEBSOCKET
    RouteSelectionExpression: "$request.body.action"

ProgressWebSocketFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: ../lambda/handlers/
    Handler: progressWebSocket.handler
    Environment:
      Variables:
        CONNECTIONS_TABLE: !Ref ConnectionsTable
        JOBS_TABLE: !Ref JobsTable
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref ConnectionsTable
      - DynamoDBCrudPolicy:
          TableName: !Ref JobsTable
      - Statement:
          - Effect: Allow
            Action:
              - execute-api:ManageConnections
            Resource:
              - !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ProgressWebSocketApi}/*'

# Job Processor (triggered by SQS)
JobProcessorFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: ../lambda/handlers/
    Handler: agentComposer.processGenerationJob
    Timeout: 300
    ReservedConcurrentExecutions: 2  # Limit concurrent processing
    Environment:
      Variables:
        JOBS_TABLE: !Ref JobsTable
        ANTHROPIC_API_KEY: !Sub '{{resolve:secretsmanager:${AppSecrets}:SecretString:ANTHROPIC_API_KEY}}'
        WEBSOCKET_API_ENDPOINT: !Sub 'https://${ProgressWebSocketApi}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref JobsTable
      - Statement:
          - Effect: Allow
            Action:
              - execute-api:ManageConnections
            Resource:
              - !Sub 'arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ProgressWebSocketApi}/*'
    Events:
      ProcessJob:
        Type: SQS
        Properties:
          Queue: !GetAtt GenerationQueue.Arn
          BatchSize: 1

# Outputs
Outputs:
  WebSocketUrl:
    Description: WebSocket URL for progress updates
    Value: !Sub 'wss://${ProgressWebSocketApi}.execute-api.${AWS::Region}.amazonaws.com/prod'
    Export:
      Name: !Sub ${AWS::StackName}-WebSocketUrl
```

## Environment Variables

```bash
# Add to Secrets Manager
{
  "GITHUB_TOKEN": "ghp_xxx",
  "ANTHROPIC_API_KEY": "sk-ant-xxx",
  "SQS_QUEUE_URL": "https://sqs.region.amazonaws.com/account/queue-name",
  "GITHUB_ORG": "organization-name"
}
```

## Error Handling

All Lambda functions should implement consistent error handling:

```javascript
// Standard error response format
const errorResponse = (statusCode, message, details = {}) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  },
  body: JSON.stringify({
    error: true,
    message,
    details,
    timestamp: new Date().toISOString()
  })
});

// Rate limiting
const checkRateLimit = async (userId) => {
  // Implementation
};

// Retry logic
const withRetry = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};
```

## Monitoring and Logging

Configure CloudWatch for all Lambda functions:

```javascript
// Structured logging
const log = {
  info: (message, data = {}) => {
    console.log(JSON.stringify({
      level: 'INFO',
      message,
      ...data,
      timestamp: new Date().toISOString()
    }));
  },
  error: (message, error, data = {}) => {
    console.error(JSON.stringify({
      level: 'ERROR',
      message,
      error: error.message,
      stack: error.stack,
      ...data,
      timestamp: new Date().toISOString()
    }));
  }
};

// Metrics
const metrics = {
  jobStarted: () => cloudwatch.putMetric('JobStarted', 1),
  jobCompleted: () => cloudwatch.putMetric('JobCompleted', 1),
  jobFailed: () => cloudwatch.putMetric('JobFailed', 1)
};
```

This Lambda function architecture provides a scalable, serverless backend for the PLAN tab functionality with proper error handling, monitoring, and integration with existing AWS services.