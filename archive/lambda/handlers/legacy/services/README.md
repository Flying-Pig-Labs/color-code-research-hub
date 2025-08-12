# 🛠️ Lambda Services Directory

> **Shared service modules used across Lambda functions**

## Overview

This directory contains reusable service modules that provide common functionality for Lambda functions. These services handle external integrations, database operations, and core business logic that's shared across multiple handlers.

## Service Modules

### 🤖 llm-orchestrator-service.js

Core service for orchestrating LLM (Large Language Model) calls to generate project plans.

**Key Features:**
- 3-step orchestration process (phases → epics → issues)
- Retry logic with exponential backoff
- Provider fallback (Claude → OpenAI)
- Parallel processing for performance
- Comprehensive error handling

**Main Functions:**
```javascript
// Generate complete project plan
generateProjectPlan(projectInfo, readmeContent)

// Internal orchestration steps
generatePhases(projectInfo, readmeContent)
generateEpicsForPhases(phases, projectInfo)
formatIssuesForGitHub(epics, metadata)

// LLM interface with fallback
callLLM(prompt, options)
callClaude(prompt, options)
callOpenAI(prompt, options)
```

**Usage Example:**
```javascript
const { generateProjectPlan } = require('./services/llm-orchestrator-service');

const plan = await generateProjectPlan({
  title: 'E-commerce Platform',
  domain: 'e-commerce',
  features: ['cart', 'payments'],
  techStack: ['React', 'Node.js']
}, readmeContent);
```

### 🐙 github-service.js

GitHub API integration for repository and issue management.

**Key Features:**
- OAuth authentication
- Repository operations
- Issue creation and management
- README extraction
- Rate limit handling

**Main Functions:**
```javascript
// Repository operations
listRepositories(owner)
getRepository(owner, repo)
getReadmeContent(owner, repo)

// Issue operations
createIssue(owner, repo, issue)
createBulkIssues(owner, repo, issues)
updateIssue(owner, repo, number, updates)

// Utility functions
parseGitHubUrl(url)
validateRepository(owner, repo)
```

### 💾 dynamodb-service.js

DynamoDB operations for job tracking and persistence.

**Key Features:**
- Job lifecycle management
- TTL support for automatic cleanup
- Atomic updates
- Query optimization
- Error handling

**Main Functions:**
```javascript
// Job operations
createJob(jobData)
updateJob(jobId, updates)
getJob(jobId)
deleteJob(jobId)

// Query operations
queryJobsByStatus(status)
queryRecentJobs(limit)
scanExpiredJobs()

// Utility functions
generateJobId()
calculateTTL(days)
```

**Job Schema:**
```javascript
{
  jobId: 'uuid',          // Partition key
  status: 'PROCESSING',   // GSI
  input: {},              // Request data
  stages: {},             // Progress tracking
  results: {},            // Output data
  errors: [],             // Error log
  createdAt: 'ISO8601',
  updatedAt: 'ISO8601',
  ttl: 1234567890        // Unix timestamp
}
```

### 🔐 secrets-service.js

AWS Secrets Manager integration for secure credential management.

**Key Features:**
- Credential retrieval
- In-memory caching
- Automatic refresh
- Multi-secret support

**Main Functions:**
```javascript
// Secret retrieval
getSecret(secretName)
getCachedSecret(secretName)

// Bulk operations
getSecrets(['secret1', 'secret2'])

// Cache management
clearCache()
refreshSecret(secretName)
```

**Supported Secrets:**
- `anthropic_key` - Claude API key
- `openai_key` - OpenAI API key  
- `github_token` - GitHub PAT
- `colorCodeResearchHubSecrets` - Combined secrets

## Service Patterns

### Error Handling

All services follow consistent error patterns:

```javascript
class ServiceError extends Error {
  constructor(message, code, details) {
    super(message);
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
  }
}

// Usage
if (!jobId) {
  throw new ServiceError(
    'Job ID is required',
    'INVALID_INPUT',
    { field: 'jobId' }
  );
}
```

### Retry Logic

Services implement retry logic for resilience:

```javascript
async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Resource Management

Services handle AWS SDK clients efficiently:

```javascript
// Singleton pattern for AWS clients
let dynamoClient;

function getDynamoClient() {
  if (!dynamoClient) {
    dynamoClient = new AWS.DynamoDB.DocumentClient({
      region: process.env.AWS_REGION || 'us-east-1'
    });
  }
  return dynamoClient;
}
```

### Logging

Structured logging for CloudWatch:

```javascript
function log(level, message, data = {}) {
  console.log(JSON.stringify({
    level,
    message,
    ...data,
    timestamp: new Date().toISOString(),
    service: 'llm-orchestrator'
  }));
}

// Usage
log('info', 'Starting phase generation', {
  projectTitle: projectInfo.title,
  phases: phases.length
});
```

## Configuration

### Environment Variables

Services expect these environment variables:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# API Keys (from Secrets Manager)
ANTHROPIC_API_KEY={{resolve:secretsmanager:anthropic_key}}
OPENAI_API_KEY={{resolve:secretsmanager:openai_key}}
GITHUB_TOKEN={{resolve:secretsmanager:github_token}}

# Service Configuration
JOBS_TABLE_NAME=PlanGenerationJobs
MAX_RETRIES=3
LLM_TIMEOUT=30000
```

### Service Dependencies

```json
{
  "dependencies": {
    "aws-sdk": "^2.x",
    "@anthropic-ai/sdk": "^0.17.1",
    "openai": "^4.x",
    "@octokit/rest": "^19.x",
    "uuid": "^9.x"
  }
}
```

## Testing Services

### Unit Testing

```javascript
// llm-orchestrator-service.test.js
const { generatePhases } = require('./llm-orchestrator-service');

jest.mock('@anthropic-ai/sdk');

describe('LLM Orchestrator Service', () => {
  it('should generate 8 phases', async () => {
    const mockResponse = { /* mock data */ };
    anthropic.messages.create.mockResolvedValue(mockResponse);
    
    const phases = await generatePhases(projectInfo, readme);
    
    expect(phases).toHaveLength(8);
    expect(phases[0]).toHaveProperty('title');
  });
});
```

### Integration Testing

```javascript
// Test with localstack for DynamoDB
const endpoint = process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566';
const client = new AWS.DynamoDB.DocumentClient({ endpoint });
```

## Performance Optimization

### Parallel Processing

```javascript
// Process phases in parallel
const epicPromises = phases.map(phase => 
  generateEpicsForPhase(phase, projectInfo)
);

const epicResults = await Promise.allSettled(epicPromises);
```

### Connection Reuse

```javascript
// Reuse HTTP connections
process.env.AWS_NODEJS_CONNECTION_REUSE_ENABLED = '1';
```

### Caching

```javascript
// In-memory cache for secrets
const secretCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCachedSecret(name) {
  const cached = secretCache.get(name);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value;
  }
  return null;
}
```

## Monitoring

### CloudWatch Metrics

Services emit custom metrics:

```javascript
const cloudwatch = new AWS.CloudWatch();

async function emitMetric(name, value, unit = 'Count') {
  await cloudwatch.putMetricData({
    Namespace: 'ColorCodeResearchHub',
    MetricData: [{
      MetricName: name,
      Value: value,
      Unit: unit,
      Timestamp: new Date()
    }]
  }).promise();
}
```

### Error Tracking

```javascript
// Log errors with context
function logError(error, context) {
  console.error(JSON.stringify({
    level: 'error',
    message: error.message,
    stack: error.stack,
    code: error.code,
    context,
    timestamp: new Date().toISOString()
  }));
}
```

## Best Practices

1. **Error Handling**: Always throw meaningful errors with codes
2. **Logging**: Use structured logging for CloudWatch
3. **Timeouts**: Set appropriate timeouts for external calls
4. **Retries**: Implement retry logic for transient failures
5. **Validation**: Validate inputs early
6. **Caching**: Cache expensive operations appropriately
7. **Monitoring**: Emit metrics for key operations

## Related Documentation

- [Lambda Functions](../../README.md) - Handler documentation
- [API Documentation](../../../docs/API_DOCUMENTATION.md) - API specifications
- [Architecture](../../../docs/ARCHITECTURE.md) - System design

---

> 💡 **Development Tip**: Always use these services instead of implementing functionality directly in handlers. This promotes code reuse and maintains consistency!