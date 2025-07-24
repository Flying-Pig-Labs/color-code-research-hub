# Lambda Functions Documentation

## 📁 Directory Structure

```
lambda/
├── handlers/           # All Lambda function handlers
│   ├── prompts/       # LLM prompt templates (from CLI)
│   ├── services/      # Shared service modules
│   └── *.js          # Individual Lambda handlers
└── tests/             # Test suite (if exists)
```

## 🔧 Lambda Functions

### Core Plan Generation

#### planGeneratorV2.js
- **Purpose**: Handles V2 plan generation (optimized for API Gateway timeout)
- **Endpoints**: 
  - `/api/plan/v2/generate-full-plan`
  - `/api/plan/v2/generate-issues`
  - `/api/plan/v2/create-github-issues`
- **Key Features**:
  - Generates 8 SDLC phases
  - Creates placeholder epics to avoid timeout
  - Limits epic generation to 3 phases
  - Creates 2 issues per epic
  - Uses OpenAI fallback on Claude overload

#### planGeneratorCLI.js
- **Purpose**: Exact CLI logic implementation (50-90 LLM calls)
- **Endpoints**:
  - `/api/plan/populate-form`
  - `/api/plan/generate-cli-plan`
- **Key Features**:
  - Form population from README
  - Full 8-phase generation
  - Epic generation for all phases
  - Issue formatting for all tasks
  - Maintains CLI's exact prompt templates

### Async Orchestration

#### startPlanGeneration.js
- **Purpose**: Entry point for async plan generation
- **Endpoint**: `POST /api/plan/async/start`
- **Flow**:
  1. Creates job record in DynamoDB
  2. Invokes PlanOrchestrator asynchronously
  3. Returns job ID immediately

#### planOrchestrator.js
- **Purpose**: Long-running orchestration (up to 15 minutes)
- **Invoked by**: startPlanGeneration (async)
- **Flow**:
  1. Retrieves job from DynamoDB
  2. Calls planGeneratorCLI for full orchestration
  3. Updates job status after each stage
  4. Stores results in DynamoDB

#### getJobStatus.js
- **Purpose**: Returns job status for polling
- **Endpoint**: `GET /api/plan/async/status/{jobId}`
- **Returns**: Current status, progress, results, errors

### Other Functions

#### githubRepos.js
- **Purpose**: GitHub repository operations
- **Endpoint**: `GET /api/github/repos`
- **Features**: Lists repositories, gets README content

#### health.js
- **Purpose**: Health check endpoint
- **Endpoint**: `GET /health`

## 📦 Dependencies

Required packages (in package.json):
```json
{
  "@anthropic-ai/sdk": "^0.24.3",
  "@aws-sdk/client-bedrock-runtime": "^3.606.0",
  "@aws-sdk/client-dynamodb": "^3.606.0",
  "@aws-sdk/client-lambda": "^3.606.0",
  "@aws-sdk/client-secrets-manager": "^3.606.0",
  "@aws-sdk/lib-dynamodb": "^3.606.0",
  "uuid": "^10.0.0"
}
```

## 🔑 Environment Variables

### Required for All Functions
- `AWS_REGION`: Default 'us-east-1'
- `ENVIRONMENT`: 'production'

### Function-Specific
- `SECRETS_ARN`: Secrets Manager ARN (for API keys)
- `JOBS_TABLE_NAME`: DynamoDB table name
- `ORCHESTRATOR_FUNCTION_NAME`: For async invocation
- `ANTHROPIC_API_KEY`: Claude API key (from Secrets Manager)

## ⚠️ Common Issues and Solutions

### Issue: "Cannot use import statement outside a module"
**Solution**: All Lambda functions must use CommonJS syntax:
```javascript
// ❌ Wrong
import { something } from 'module';
export const handler = async (event) => {};

// ✅ Correct
const { something } = require('module');
exports.handler = async (event) => {};
```

### Issue: DynamoDB "removeUndefinedValues" error
**Solution**: Configure DynamoDB document client properly:
```javascript
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});
```

### Issue: API Gateway timeout (30 seconds)
**Solution**: 
- Use async pattern (startPlanGeneration → planOrchestrator)
- Or optimize to return within 30 seconds (planGeneratorV2 approach)

### Issue: Claude API 529 (Overloaded)
**Solution**: Implemented automatic OpenAI fallback:
```javascript
try {
  return await callClaude(prompt, claudeKey);
} catch (error) {
  if (error.message.includes('529')) {
    return await callOpenAI(prompt, openAIKey);
  }
}
```

## 🚀 Deployment

Always deploy Lambda functions after changes:
```bash
cd infrastructure/
sam build
sam deploy --profile personal --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1
```

## 📊 Monitoring

### CloudWatch Logs
- Log Group: `/aws/lambda/{function-name}`
- Check logs:
```bash
aws logs tail /aws/lambda/color-code-research-hub-{FunctionName} --profile personal --region us-east-1 --since 5m
```

### DynamoDB
- Check job status:
```bash
aws dynamodb get-item --table-name PlanGenerationJobs-production --key '{"jobId":{"S":"job-id-here"}}' --profile personal --region us-east-1
```