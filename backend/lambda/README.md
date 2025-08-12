# ⚡ Lambda Functions Documentation

> **Comprehensive documentation for all AWS Lambda functions in the Color Code Research Hub**

## 📋 Table of Contents

- [Overview](#overview)
- [Directory Structure](#directory-structure)
- [Function Categories](#function-categories)
- [Individual Function Documentation](#individual-function-documentation)
- [Shared Services](#shared-services)
- [Configuration](#configuration)
- [Development Guide](#development-guide)
- [Testing](#testing)
- [Deployment](#deployment)
- [Monitoring & Debugging](#monitoring--debugging)
- [Troubleshooting](#troubleshooting)

## Overview

The Lambda functions power all backend operations for the Color Code Research Hub. They are organized into functional categories and share common services for LLM orchestration, GitHub integration, and AWS service interactions.

### Key Design Principles

- **Single Responsibility**: Each function handles one specific task
- **Timeout Awareness**: Functions respect API Gateway's 30-second limit
- **Error Resilience**: Comprehensive error handling with retries
- **Cost Optimization**: Efficient memory allocation and execution time
- **CommonJS Modules**: All functions use `require()` and `module.exports`

## Directory Structure

```
lambda/
├── handlers/                    # All Lambda function handlers
│   ├── prompts/                # LLM prompt templates (ported from CLI)
│   │   ├── phase-generator.js
│   │   ├── epic-generator.js
│   │   └── issue-formatter.js
│   ├── services/               # Shared service modules
│   │   ├── llm-orchestrator-service.js
│   │   ├── github-service.js
│   │   ├── dynamodb-service.js
│   │   └── secrets-service.js
│   │
│   # Plan Generation Functions
│   ├── planGeneratorCLI.js     # Full CLI logic implementation
│   ├── planGeneratorV2.js      # Optimized for API Gateway timeout
│   ├── planOrchestrator.js     # Long-running async orchestration
│   ├── startPlanGeneration.js  # Async job initiation
│   ├── getJobStatus.js         # Job status polling
│   │
│   # Claude Flow Functions
│   ├── claudeFlowProxy.js      # EC2 backend proxy
│   ├── claudeFlowExecutionLogs.js
│   ├── claudeFlowExecutionMetadata.js
│   ├── claudeFlowExecutionActivity.js
│   │
│   # GitHub Functions
│   ├── githubRepos.js          # Repository operations
│   │
│   # Research Team Functions
│   ├── submitToSQS.js          # Research request submission
│   ├── teams.js                # Team field definitions
│   │
│   # Utility Functions
│   └── health.js               # Health check endpoint
│
└── tests/                      # Test suite
    ├── fixtures/               # Test data
    └── unit/                   # Unit tests
```

## Function Categories

### 1. Plan Generation Functions

These functions handle the core AI-powered project planning functionality.

### 2. Async Orchestration Functions

Handle long-running operations that exceed API Gateway's timeout.

### 3. Claude Flow Integration Functions

Proxy requests to the Claude Flow EC2 backend and handle execution monitoring.

### 4. GitHub Integration Functions

Interact with GitHub API for repository and issue management.

### 5. Research Team Functions

Support the Red, Black, and White team research workflows.

### 6. Utility Functions

Health checks and other utility endpoints.

## Individual Function Documentation

### Plan Generation Functions

#### planGeneratorCLI.js

**Purpose**: Implements the exact CLI logic for comprehensive plan generation.

**Configuration**:
- Timeout: 900 seconds (15 minutes)
- Memory: 1024MB
- Environment Variables:
  - `ANTHROPIC_API_KEY` (from Secrets Manager)
  - `OPENAI_API_KEY` (from Secrets Manager)

**Endpoints**:
- `POST /api/plan/populate-form` - Extract metadata from README
- `POST /api/plan/generate-cli-plan` - Generate complete plan

**Key Features**:
- Makes 50-90 LLM calls across 5 stages
- Generates 8 SDLC phases
- Creates 5-10 epics per phase
- Formats all epics as GitHub issues
- Uses exact prompts from CLI

**Example Usage**:
```javascript
// Handler structure
exports.handler = async (event) => {
  const { path, httpMethod, body } = event;
  
  if (path === '/api/plan/populate-form' && httpMethod === 'POST') {
    const { readmeContent } = JSON.parse(body);
    const metadata = await populateFormFromReadme(readmeContent);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ metadata })
    };
  }
  
  if (path === '/api/plan/generate-cli-plan' && httpMethod === 'POST') {
    const { projectInfo, readmeContent } = JSON.parse(body);
    const plan = await generateProjectPlan(projectInfo, readmeContent);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(plan)
    };
  }
};
```

#### planGeneratorV2.js

**Purpose**: Optimized version that works within API Gateway's 30-second timeout.

**Configuration**:
- Timeout: 30 seconds
- Memory: 512MB
- Environment Variables: Same as planGeneratorCLI

**Endpoints**:
- `POST /api/plan/v2/generate-full-plan` - Generate phases with limited epics
- `POST /api/plan/v2/generate-issues` - Generate issues for selected epics
- `POST /api/plan/v2/create-github-issues` - Create issues in GitHub

**Optimization Strategies**:
- Generates only 2 placeholder epics initially
- Defers full epic generation to separate calls
- Uses streaming responses where possible
- Implements aggressive timeouts

#### planOrchestrator.js

**Purpose**: Long-running function for complete plan generation.

**Configuration**:
- Timeout: 900 seconds (15 minutes)
- Memory: 3008MB
- Reserved Concurrency: 5
- Environment Variables:
  - `JOBS_TABLE_NAME` - DynamoDB table for job tracking
  - `ANTHROPIC_API_KEY` - From Secrets Manager

**Invocation**: Called asynchronously by startPlanGeneration

**Workflow**:
```javascript
async function orchestratePlanGeneration(jobId) {
  // 1. Retrieve job from DynamoDB
  const job = await getJob(jobId);
  
  // 2. Update status to PROCESSING
  await updateJobStatus(jobId, 'PROCESSING');
  
  // 3. Execute stages with progress updates
  const stages = [
    { name: 'populateForm', fn: populateFormStage },
    { name: 'generatePhases', fn: generatePhasesStage },
    { name: 'epicGeneration', fn: generateEpicsStage },
    { name: 'issueFormatting', fn: formatIssuesStage },
    { name: 'createGitHubIssues', fn: createGitHubIssuesStage }
  ];
  
  for (const stage of stages) {
    await executeStage(jobId, stage);
  }
  
  // 4. Update final status
  await updateJobStatus(jobId, 'COMPLETED');
}
```

#### startPlanGeneration.js

**Purpose**: Initiates async plan generation and returns immediately.

**Configuration**:
- Timeout: 30 seconds
- Memory: 128MB
- Environment Variables:
  - `JOBS_TABLE_NAME` - DynamoDB table
  - `ORCHESTRATOR_FUNCTION_NAME` - PlanOrchestrator function name

**Endpoint**: `POST /api/plan/async/start`

**Flow**:
1. Validate input
2. Create job record in DynamoDB
3. Invoke PlanOrchestrator asynchronously
4. Return job ID to client

#### getJobStatus.js

**Purpose**: Returns current status of async job for polling.

**Configuration**:
- Timeout: 30 seconds
- Memory: 128MB
- Environment Variables:
  - `JOBS_TABLE_NAME` - DynamoDB table

**Endpoint**: `GET /api/plan/async/status/{jobId}`

**Response Structure**:
```json
{
  "jobId": "uuid",
  "status": "PROCESSING",
  "progress": 45,
  "currentStage": "epicGeneration",
  "stages": {
    "populateForm": { "status": "completed" },
    "generatePhases": { "status": "completed" },
    "epicGeneration": { "status": "in_progress", "progress": { "current": 3, "total": 8 } }
  }
}
```

### Claude Flow Integration Functions

#### claudeFlowProxy.js

**Purpose**: Proxies requests to Claude Flow EC2 backend.

**Configuration**:
- Timeout: 30 seconds
- Memory: 256MB
- Environment Variables:
  - `EC2_HOST`: 18.209.36.58
  - `EC2_PORT`: 8080

**Handlers**:
- `healthHandler` - GET /api/claude-flow/health
- `executeHandler` - POST /api/claude-flow/execute
- `swarmStatusHandler` - GET /api/claude-flow/swarm-status
- `executionsHandler` - GET /api/claude-flow/executions
- `executionDetailsHandler` - GET /api/claude-flow/execution/{id}

**Proxy Implementation**:
```javascript
async function proxyRequest(path, method, body = null) {
  const options = {
    hostname: EC2_HOST,
    port: EC2_PORT,
    path: path,
    method: method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, body: data }));
    });
    
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}
```

#### claudeFlowExecutionLogs.js

**Purpose**: Fetches execution logs from S3 via EC2 backend.

**Configuration**:
- Timeout: 30 seconds
- Memory: 128MB
- Environment Variables: Same as proxy

**Endpoint**: `GET /api/claude-flow/execution/{id}/logs`

**Query Parameters**:
- `type`: stdout|stderr|all (default: stdout)
- `tail`: Number of lines from end

**Features**:
- Fetches S3 URL from backend
- Downloads log content
- Implements tail functionality
- Returns plain text response

#### claudeFlowExecutionMetadata.js

**Purpose**: Returns execution metadata as JSON.

**Configuration**:
- Timeout: 30 seconds
- Memory: 128MB

**Endpoint**: `GET /api/claude-flow/execution/{id}/metadata`

#### claudeFlowExecutionActivity.js

**Purpose**: Combines execution status with recent log activity.

**Configuration**:
- Timeout: 30 seconds
- Memory: 128MB

**Endpoint**: `GET /api/claude-flow/execution/{id}/activity`

**Response Includes**:
- Execution status
- Recent log lines
- Progress information
- Task completion stats

### GitHub Integration Functions

#### githubRepos.js

**Purpose**: GitHub repository operations.

**Configuration**:
- Timeout: 30 seconds
- Memory: 256MB
- Environment Variables:
  - `GITHUB_TOKEN` (from Secrets Manager)

**Endpoints**:
- `GET /api/github/repos/{owner}` - List repositories
- `GET /api/github/repos/{owner}/{repo}/readme` - Get README

**Features**:
- OAuth authentication
- Pagination support
- README content extraction
- Error handling for rate limits

### Research Team Functions

#### submitToSQS.js

**Purpose**: Submits research requests to SQS queue.

**Configuration**:
- Timeout: 30 seconds
- Memory: 128MB
- Environment Variables:
  - `SQS_QUEUE_URL` - Research request queue

**Endpoint**: `POST /api/sqs/submit`

**Message Format**:
```json
{
  "teamType": "red|black|white",
  "repoId": "unique-id",
  "formData": {
    // Team-specific fields
  }
}
```

#### teams.js

**Purpose**: Returns field definitions for research teams.

**Configuration**:
- Timeout: 30 seconds
- Memory: 128MB

**Endpoint**: `GET /teams/{teamType}/fields`

### Utility Functions

#### health.js

**Purpose**: Basic health check endpoint.

**Configuration**:
- Timeout: 30 seconds
- Memory: 128MB

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "version": "1.0.0"
}
```

## Shared Services

### llm-orchestrator-service.js

Handles all LLM interactions with retry logic and provider fallback.

**Key Functions**:
- `generateProjectPlan()` - Main orchestration function
- `callLLM()` - Unified LLM interface with fallback
- `callClaude()` - Claude API integration
- `callOpenAI()` - OpenAI fallback

**Retry Strategy**:
```javascript
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('529') && i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        continue;
      }
      throw error;
    }
  }
};
```

### github-service.js

Handles GitHub API interactions.

**Key Functions**:
- `createRepository()` - Create new repositories
- `createIssues()` - Bulk issue creation
- `getRepository()` - Repository metadata
- `getReadme()` - README content

### dynamodb-service.js

DynamoDB operations for job tracking.

**Key Functions**:
- `createJob()` - Create new job record
- `updateJob()` - Update job status
- `getJob()` - Retrieve job details
- `queryJobs()` - List jobs by status

### secrets-service.js

AWS Secrets Manager integration.

**Key Functions**:
- `getSecret()` - Retrieve secret value
- `getCachedSecret()` - In-memory caching

## Configuration

### Environment Variables

#### Global Variables (All Functions)
```yaml
AWS_REGION: us-east-1
NODE_ENV: production
LOG_LEVEL: info
```

#### Function-Specific Variables
```yaml
# Plan Generation
ANTHROPIC_API_KEY: "{{resolve:secretsmanager:anthropic_key}}"
OPENAI_API_KEY: "{{resolve:secretsmanager:openai_key}}"
GITHUB_TOKEN: "{{resolve:secretsmanager:github_token}}"

# Async Orchestration
JOBS_TABLE_NAME: PlanGenerationJobs-production
ORCHESTRATOR_FUNCTION_NAME: PlanOrchestratorFunction

# Claude Flow
EC2_HOST: 18.209.36.58
EC2_PORT: 8080

# SQS
SQS_QUEUE_URL: https://sqs.us-east-1.amazonaws.com/123456/research-requests
```

### Memory and Timeout Configuration

| Function | Memory (MB) | Timeout (s) | Reserved Concurrency |
|----------|-------------|-------------|---------------------|
| planGeneratorCLI | 1024 | 900 | - |
| planGeneratorV2 | 512 | 30 | - |
| planOrchestrator | 3008 | 900 | 5 |
| startPlanGeneration | 128 | 30 | - |
| getJobStatus | 128 | 30 | - |
| claudeFlow* | 256 | 30 | - |
| githubRepos | 256 | 30 | - |
| health | 128 | 30 | - |

## Development Guide

### Setting Up Local Development

1. **Install Dependencies**:
```bash
cd lambda
npm install
```

2. **Set Environment Variables**:
```bash
export AWS_REGION=us-east-1
export ANTHROPIC_API_KEY=your-key
export GITHUB_TOKEN=your-token
```

3. **Run Tests**:
```bash
npm test
```

### Local Testing with SAM

```bash
# Start local API
sam local start-api

# Test specific function
sam local invoke PlanGeneratorCLIFunction -e events/test-event.json
```

### Code Standards

#### Module System
```javascript
// ✅ CORRECT - CommonJS
const AWS = require('aws-sdk');
const { handler } = require('./handler');

module.exports = { handler };

// ❌ WRONG - ES6 Modules
import AWS from 'aws-sdk';
export const handler = async () => {};
```

#### Error Handling
```javascript
exports.handler = async (event) => {
  try {
    // Function logic
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(result)
    };
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: error.statusCode || 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: error.message,
        code: error.code || 'INTERNAL_ERROR'
      })
    };
  }
};
```

#### Logging
```javascript
// Use structured logging
console.log(JSON.stringify({
  level: 'info',
  message: 'Processing request',
  requestId: event.requestContext?.requestId,
  data: { jobId, status }
}));
```

## Testing

### Unit Tests

Located in `/lambda/tests/unit/`:

```javascript
// Example test
const { handler } = require('../handlers/health');

describe('Health Check Handler', () => {
  test('should return healthy status', async () => {
    const event = { httpMethod: 'GET', path: '/health' };
    const response = await handler(event);
    
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).status).toBe('healthy');
  });
});
```

### Integration Tests

```bash
# Test against deployed API
npm run test:integration
```

### Load Testing

```bash
# Using Artillery
artillery run tests/load/plan-generation.yml
```

## Deployment

### Prerequisites

1. AWS CLI configured
2. SAM CLI installed
3. Proper AWS credentials

### Deploy All Functions

```bash
cd infrastructure
./deploy.sh
```

### Deploy Specific Function

```bash
# Build
sam build PlanGeneratorCLIFunction

# Deploy
sam deploy --stack-name color-code-research-hub \
  --capabilities CAPABILITY_IAM \
  --parameter-overrides ParameterKey=Value
```

### Rollback

```bash
# List stack events
aws cloudformation describe-stack-events \
  --stack-name color-code-research-hub \
  --profile personal

# Rollback to previous version
aws cloudformation cancel-update-stack \
  --stack-name color-code-research-hub \
  --profile personal
```

## Monitoring & Debugging

### CloudWatch Logs

```bash
# Tail logs for specific function
aws logs tail /aws/lambda/color-code-research-hub-PlanGeneratorCLI \
  --profile personal \
  --region us-east-1 \
  --since 5m

# Search logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/color-code-research-hub-PlanGeneratorCLI \
  --filter-pattern "ERROR" \
  --profile personal
```

### X-Ray Tracing

```javascript
// Enable tracing in function
const AWSXRay = require('aws-xray-sdk-core');
const AWS = AWSXRay.captureAWS(require('aws-sdk'));
```

### CloudWatch Metrics

Key metrics to monitor:
- Invocation count
- Error count and rate
- Duration (average, p95, p99)
- Concurrent executions
- Throttles

### Custom Metrics

```javascript
// Publish custom metrics
const cloudwatch = new AWS.CloudWatch();

await cloudwatch.putMetricData({
  Namespace: 'ColorCodeResearchHub',
  MetricData: [{
    MetricName: 'PlanGenerationDuration',
    Value: duration,
    Unit: 'Seconds',
    Dimensions: [{ Name: 'FunctionName', Value: 'PlanGeneratorCLI' }]
  }]
}).promise();
```

## Troubleshooting

### Common Issues

#### 1. Module Import Errors

**Error**: "Cannot use import statement outside a module"

**Solution**: Convert to CommonJS:
```javascript
// Change this:
import { something } from 'module';

// To this:
const { something } = require('module');
```

#### 2. Timeout Errors

**Error**: "Task timed out after 30.00 seconds"

**Solutions**:
- Use async pattern for long operations
- Increase timeout in SAM template
- Optimize function logic

#### 3. Memory Errors

**Error**: "Runtime exited with error: signal: killed Runtime.ExitError"

**Solution**: Increase memory allocation in SAM template

#### 4. DynamoDB Errors

**Error**: "ValidationException: The provided key element does not match the schema"

**Solution**: Ensure correct key structure:
```javascript
const params = {
  TableName: tableName,
  Key: {
    jobId: { S: jobId }  // Note the type descriptor
  }
};
```

#### 5. Secrets Manager Errors

**Error**: "AccessDeniedException: User is not authorized to perform: secretsmanager:GetSecretValue"

**Solution**: Add IAM policy to Lambda role:
```yaml
- Effect: Allow
  Action:
    - secretsmanager:GetSecretValue
  Resource:
    - arn:aws:secretsmanager:region:account:secret:name-*
```

### Debug Mode

Enable detailed logging:
```javascript
if (process.env.DEBUG === 'true') {
  console.log('Detailed debug info:', {
    event,
    environment: process.env,
    memoryLimit: context.memoryLimitInMB
  });
}
```

## Best Practices

1. **Cold Start Optimization**
   - Minimize dependencies
   - Lazy load modules
   - Use provisioned concurrency for critical functions

2. **Error Handling**
   - Always return proper HTTP responses
   - Log errors with context
   - Implement retry logic for external services

3. **Security**
   - Never log sensitive data
   - Use Secrets Manager for credentials
   - Implement least privilege IAM roles

4. **Performance**
   - Use connection pooling
   - Cache frequently accessed data
   - Optimize memory allocation

5. **Monitoring**
   - Set up CloudWatch alarms
   - Use X-Ray for distributed tracing
   - Monitor costs and usage

## Related Documentation

- [API Documentation](../docs/API_DOCUMENTATION.md) - API endpoint specifications
- [Architecture Overview](../docs/ARCHITECTURE.md) - System architecture
- [Infrastructure Guide](../infrastructure/README.md) - SAM template details
- [Deployment Guide](../docs/deployment/README.md) - Deployment procedures

---

> 💡 **Pro Tip**: Use the AWS Lambda Power Tuning tool to find optimal memory/cost configuration for each function.