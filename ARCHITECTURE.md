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
   
2. **OpenAI API Key**: `arn:aws:secretsmanager:us-east-1:984906149037:secret:feel-forward/openai-api-key-zezdyv`
   - Used as fallback when Claude returns 529 (overloaded)

3. **GitHub PAT**: `arn:aws:secretsmanager:us-east-1:984906149037:secret:github/personal_token-7lbje4`
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

## 🧠 Perplexity API Report Processing Architecture

### Overview
The system integrates with Perplexity API's async research capabilities to generate comprehensive intelligence reports. The architecture processes research requests through a sophisticated pipeline that generates 5 distinct output artifacts.

### Data Flow Architecture
```
1. User submits research request → Frontend
2. Frontend calls POST /api/research
3. ResearchApiFunction:
   - Creates async job with Perplexity API
   - Returns request_id for polling
4. Frontend polls GET /api/research/status/{request_id}
5. When completed, ResearchApiFunction:
   - Retrieves research content from Perplexity
   - Processes through LLM pipeline (5 artifacts)
   - Stores results in S3 bucket
   - Logs metadata to DynamoDB
6. Frontend displays processed results
```

### Lambda Functions for Research Processing

#### 1. ResearchApiFunction (Existing)
- **Handler**: `researchApi.py`
- **Runtime**: Python 3.9
- **Timeout**: 30 seconds
- **Memory**: 256MB
- **Purpose**: Handles Perplexity API integration and basic processing
- **Endpoints**:
  - `POST /api/research` - Create async research job
  - `GET /api/research/status/{request_id}` - Check job status
  - `GET /api/research/reports` - List historical reports
  - `GET /api/research/download/{s3_key}` - Generate presigned URLs

#### 2. ReportProcessorFunction (Implemented)
- **Handler**: `reportProcessor.js`
- **Runtime**: Node.js 18.x
- **Timeout**: 900 seconds (15 minutes)
- **Memory**: 3008MB
- **Purpose**: Process raw research content into 5 structured artifacts
- **Trigger**: SQS Queue (via DynamoDB Streams → ResearchStreamProcessor)
- **Environment Variables**:
  - `REPORT_BUCKET`: S3 bucket for processed reports
  - `RESEARCH_REPORTS_TABLE`: DynamoDB table name
- **Features**:
  - Team-specific prompts (red/white/black teams)
  - AI summarization using Claude/OpenAI
  - Structured report generation
  - See [REPORT_PROCESSING_ARCHITECTURE.md](./REPORT_PROCESSING_ARCHITECTURE.md) for full details

#### 3. ResearchStreamProcessorFunction (New)
- **Handler**: `researchStreamProcessor.js`
- **Runtime**: Node.js 18.x
- **Timeout**: 60 seconds
- **Memory**: 256MB
- **Purpose**: Monitor DynamoDB Streams for completed research
- **Trigger**: DynamoDB Streams on ResearchReports table
- **Actions**:
  - Detects status changes to "completed"
  - Sends messages to SQS ReportProcessingQueue
- **Environment Variables**:
  - `REPORT_PROCESSING_QUEUE_URL`: SQS queue URL

### 5 Output Artifacts Architecture

The report processing pipeline generates these artifacts:

1. **Executive Summary** (`executive-summary.json`)
   - High-level insights and key findings
   - Strategic recommendations
   - Risk assessment matrix

2. **Detailed Analysis** (`detailed-analysis.json`)
   - Comprehensive research findings
   - Methodology and sources
   - Evidence-based conclusions

3. **Action Items** (`action-items.json`)
   - Prioritized task list
   - Timeline recommendations
   - Resource requirements

4. **Visual Report** (`visual-report.json`)
   - Chart and graph specifications
   - Data visualization configs
   - Presentation-ready formats

5. **Raw Data Export** (`raw-data.json`)
   - Original research content
   - Source citations
   - Metadata and timestamps

### Data Storage Architecture

#### S3 Bucket Structure
```
color-code-research-results-{account-id}/
├── raw/
│   └── {timestamp}_{research_id}.json (from Perplexity)
├── processed/
│   └── {research_id}/
│       ├── executive-summary.json
│       ├── detailed-analysis.json
│       ├── action-items.json
│       ├── visual-report.json
│       └── raw-data.json
└── exports/
    └── {research_id}_complete_report.zip
```

#### DynamoDB Schema Enhancement
**Table**: `ResearchReports` (existing, to be enhanced)
```json
{
  "reportId": "uuid",
  "team": "red|black|white",
  "status": "processing|completed|failed",
  "perplexityRequestId": "original-request-id",
  "s3RawKey": "path-to-raw-content",
  "s3ProcessedPrefix": "path-to-processed-artifacts",
  "artifacts": {
    "executiveSummary": {"status": "completed|failed", "s3Key": "..."},
    "detailedAnalysis": {"status": "completed|failed", "s3Key": "..."},
    "actionItems": {"status": "completed|failed", "s3Key": "..."},
    "visualReport": {"status": "completed|failed", "s3Key": "..."},
    "rawDataExport": {"status": "completed|failed", "s3Key": "..."}
  },
  "processingStartedAt": "ISO-8601",
  "processingCompletedAt": "ISO-8601",
  "metadata": {
    "originalRequest": {},
    "processingStats": {}
  }
}
```

### LLM Processing Pipeline

#### Processing Strategy
1. **Raw Content Analysis** - Extract key themes and structure
2. **Parallel Artifact Generation** - Process 5 artifacts concurrently
3. **Cross-Artifact Validation** - Ensure consistency across outputs
4. **Quality Assurance** - Validate completeness and accuracy

#### Prompt Structure for Each Artifact
Each artifact uses specialized prompts:
- **Executive Summary Prompt**: Focus on strategic insights
- **Detailed Analysis Prompt**: Comprehensive technical analysis
- **Action Items Prompt**: Actionable task generation
- **Visual Report Prompt**: Data visualization specifications
- **Raw Data Export Prompt**: Structured data extraction

### Integration Points

#### Frontend Integration
The React components need updates to handle the new processing pipeline:

```typescript
// New components needed:
- ReportProcessingStatus.tsx
- ArtifactViewer.tsx
- ReportDownloader.tsx
- ProcessingProgress.tsx
```

#### API Endpoints Enhancement
New endpoints to be added to `researchApi.py`:
- `GET /api/research/artifacts/{report_id}` - List available artifacts
- `GET /api/research/artifact/{report_id}/{artifact_type}` - Get specific artifact
- `POST /api/research/reprocess/{report_id}` - Trigger reprocessing

### Error Handling & Resilience

#### Retry Strategy
- **S3 Upload Failures**: 3 retries with exponential backoff
- **LLM API Failures**: Fallback to OpenAI if Claude fails
- **Processing Timeouts**: Checkpoint intermediate results

#### Monitoring & Alerting
- CloudWatch metrics for processing success rates
- Dead letter queues for failed processing
- SNS notifications for processing completion

## 🔧 Key Technical Details

### Rate Limiting Strategy
- Claude API: 3 retries with exponential backoff (2s, 4s, 8s)
- OpenAI fallback: Automatic switch on 529 errors
- Batch processing: Issues processed 3 at a time
- Phase delays: 2 seconds between phases
- Batch delays: 1 second between issue batches
- **Perplexity API**: 5 concurrent requests max, 1s delays between batches

### LLM Models
- **Primary**: Claude 3.5 Sonnet (`claude-3-5-sonnet-20241022`)
- **Fallback**: GPT-4 Turbo (`gpt-4-turbo-preview`)
- **AWS Bedrock**: `anthropic.claude-3-sonnet-20240229-v1:0`
- **Perplexity**: `sonar-deep-research` (async research model)

### Node.js Configuration
- **Runtime**: Node.js 18.x
- **Module System**: CommonJS (not ES6 modules!)
- **Important**: All Lambda functions use `require()` and `module.exports`