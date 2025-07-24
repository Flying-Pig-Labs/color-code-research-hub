# Color Code Research Hub - Architecture Overview

## 🏗️ System Architecture

### Frontend (React + Vite)
- **Location**: `/src`
- **Deployment**: AWS Amplify (auto-deploys on git push to main)
- **URL**: https://main.d2ql2vtt0qnyww.amplifyapp.com/
- **Key Environment Variables**:
  - `VITE_API_BASE_URL`: API Gateway endpoint (production)

### Backend (AWS Lambda + API Gateway)
- **Location**: `/lambda/handlers`
- **Deployment**: AWS SAM (manual deployment required)
- **API Gateway**: https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production

### Infrastructure
- **Location**: `/infrastructure`
- **Template**: `template.yaml` (SAM template)
- **DynamoDB Table**: `PlanGenerationJobs-production`

## 🔄 Async Plan Generation Architecture

### Overview
The system implements a fully async plan generation that mirrors the agent-team-composer CLI, making 50-90 LLM calls to generate comprehensive project plans.

### Lambda Functions

#### 1. StartPlanGenerationFunction
- **Handler**: `startPlanGeneration.js`
- **Timeout**: 30 seconds
- **Memory**: 128MB
- **Purpose**: Accepts plan generation requests and returns job ID immediately
- **Endpoint**: `POST /api/plan/async/start`
- **Environment Variables**:
  - `JOBS_TABLE_NAME`: DynamoDB table name
  - `ORCHESTRATOR_FUNCTION_NAME`: PlanOrchestrator function name

#### 2. PlanOrchestratorFunction
- **Handler**: `planOrchestrator.js`
- **Timeout**: 900 seconds (15 minutes)
- **Memory**: 3008MB
- **Purpose**: Executes the full 50-90 LLM orchestration
- **Invoked**: Asynchronously by StartPlanGeneration
- **Environment Variables**:
  - `JOBS_TABLE_NAME`: DynamoDB table name
  - `ANTHROPIC_API_KEY`: From Secrets Manager

#### 3. GetJobStatusFunction
- **Handler**: `getJobStatus.js`
- **Timeout**: 30 seconds
- **Memory**: 128MB
- **Purpose**: Returns current job status and progress
- **Endpoint**: `GET /api/plan/async/status/{jobId}`

### Data Flow

```
1. User clicks "Enhanced Async Plan" → Frontend
2. Frontend calls POST /api/plan/async/start
3. StartPlanGeneration:
   - Creates job in DynamoDB
   - Invokes PlanOrchestrator asynchronously
   - Returns job ID immediately
4. Frontend polls GET /api/plan/async/status/{jobId}
5. PlanOrchestrator (running in background):
   - Stage 1: Form Population (1 LLM call)
   - Stage 2: Phase Generation (1 LLM call) 
   - Stage 3: Epic Generation (8 calls with 2s delays)
   - Stage 4: Issue Formatting (40-80 calls in batches of 3)
   - Stage 5: GitHub Issue Creation (optional)
   - Updates DynamoDB after each stage
6. Frontend displays progress until completion
```

### DynamoDB Schema

**Table**: `PlanGenerationJobs-production`
- **Partition Key**: `jobId` (String)
- **TTL**: 24 hours (auto-cleanup)
- **Item Structure**:
```json
{
  "jobId": "uuid",
  "status": "INITIATED|PROCESSING|COMPLETED|FAILED",
  "input": { /* original request */ },
  "stages": {
    "populateForm": { "status": "pending|completed", "startedAt": "...", "completedAt": "..." },
    "generatePhases": { /* same structure */ },
    "epicGeneration": { /* same structure */ },
    "issueFormatting": { /* same structure */ },
    "createGitHubIssues": { /* same structure */ }
  },
  "results": { /* final output */ },
  "errors": [],
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601",
  "ttl": "unix-timestamp"
}
```

## 🔌 API Endpoints

### Plan Generation V2 (Synchronous - Legacy)
- `POST /api/plan/v2/generate-full-plan` - Generates phases with placeholder epics
- `POST /api/plan/v2/generate-issues` - Generates issues for selected epics
- `POST /api/plan/v2/create-github-issues` - Creates issues in GitHub

### Plan Generation CLI (Full CLI Logic)
- `POST /api/plan/populate-form` - AI form population from README
- `POST /api/plan/generate-cli-plan` - Full 50-90 LLM call orchestration

### Async Plan Generation (Recommended)
- `POST /api/plan/async/start` - Start async job
- `GET /api/plan/async/status/{jobId}` - Check job status

### Other Endpoints
- `GET /health` - Health check
- `GET /api/github/repos` - List user's GitHub repositories
- `GET /api/github/repos/{owner}/{repo}/readme` - Get repository README

## 🔐 Secrets and API Keys

### AWS Secrets Manager
1. **Anthropic API Key**: `color-code-research-hub-secrets-production`
   - Used for Claude API calls (primary LLM)
   
2. **OpenAI API Key**: `arn:aws:secretsmanager:us-east-1:418272766513:secret:feel-forward/openai-api-key-zezdyv`
   - Used as fallback when Claude returns 529 (overloaded)

3. **GitHub PAT**: `arn:aws:secretsmanager:us-east-1:418272766513:secret:github/personal_token-7lbje4`
   - Used for GitHub API operations

## 🚀 Deployment

### Frontend (Automatic)
```bash
git push origin main
# Amplify auto-deploys within 2-3 minutes
```

### Backend (Manual)
```bash
cd /Users/williamprior/Development/GitHub/color-code-research-hub/infrastructure
sam build
sam deploy --profile personal --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1
```

## 🔧 Key Technical Details

### Rate Limiting Strategy
- Claude API: 3 retries with exponential backoff (2s, 4s, 8s)
- OpenAI fallback: Automatic switch on 529 errors
- Batch processing: Issues processed 3 at a time
- Phase delays: 2 seconds between phases
- Batch delays: 1 second between issue batches

### LLM Models
- **Primary**: Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
- **Fallback**: GPT-4 Turbo (`gpt-4-turbo-preview`)
- **AWS Bedrock**: `anthropic.claude-3-sonnet-20240229-v1:0`

### Node.js Configuration
- **Runtime**: Node.js 18.x
- **Module System**: CommonJS (not ES6 modules!)
- **Important**: All Lambda functions use `require()` and `module.exports`