# API Documentation - Color Code Research Hub

## Base URL
```
https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production
```

## 🔄 Async Plan Generation (Recommended)

### Start Plan Generation
**POST** `/api/plan/async/start`

Initiates async plan generation that makes 50-90 LLM calls.

**Request Body:**
```json
{
  "metadata": {
    "title": "Project Name",
    "description": "Project description",
    "domain": "general|e-commerce|social-media|productivity|healthcare|education|finance|entertainment|devtools|iot",
    "targetUsers": ["developers", "engineers"],
    "techStack": ["Node.js", "React", "MongoDB"],
    "features": ["API", "Authentication", "Dashboard"],
    "complexity": "simple|moderate|complex"
  },
  "readmeContent": "# Project README content...",
  "repository": "owner/repo" // Optional - for GitHub issue creation
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "uuid-v4",
  "status": "INITIATED",
  "message": "Plan generation job started successfully",
  "statusUrl": "/api/plan/async/status/uuid-v4"
}
```

### Check Job Status
**GET** `/api/plan/async/status/{jobId}`

Poll this endpoint every 3 seconds to check progress.

**Response (200 OK):**
```json
{
  "jobId": "uuid-v4",
  "status": "INITIATED|PROCESSING|COMPLETED|FAILED",
  "progress": 45, // Percentage
  "elapsedTime": 120, // Seconds
  "estimatedTimeRemaining": 180, // Seconds
  "createdAt": "2025-07-24T12:00:00Z",
  "updatedAt": "2025-07-24T12:02:00Z",
  "stages": {
    "populateForm": {
      "status": "completed",
      "startedAt": "2025-07-24T12:00:01Z",
      "completedAt": "2025-07-24T12:00:05Z"
    },
    "generatePhases": {
      "status": "completed",
      "startedAt": "2025-07-24T12:00:06Z",
      "completedAt": "2025-07-24T12:00:15Z"
    },
    "epicGeneration": {
      "status": "in_progress",
      "startedAt": "2025-07-24T12:00:16Z",
      "progress": {
        "current": 3,
        "total": 8
      }
    },
    "issueFormatting": {
      "status": "pending"
    },
    "createGitHubIssues": {
      "status": "pending"
    }
  },
  "llmCalls": {
    "total": 45,
    "claude": 42,
    "openai": 3 // Fallback calls
  },
  "results": {
    // Present when status is COMPLETED
    "phases": [...],
    "epics": [...],
    "issues": [...],
    "githubIssues": [...]
  },
  "errors": [
    // Present if any errors occurred
  ]
}
```

## 📋 Plan Generation V2 (Synchronous)

### Generate Full Plan
**POST** `/api/plan/v2/generate-full-plan`

Generates 8 phases with placeholder epics (optimized for 30s timeout).

**Request Body:**
```json
{
  "metadata": {
    // Same as async endpoint
  },
  "readmeContent": "..."
}
```

**Response (200 OK):**
```json
{
  "phases": [
    {
      "id": "phase-1",
      "title": "Discovery & Requirements",
      "description": "...",
      "epics": [...],
      "pending": false
    }
  ],
  "sampleIssues": [...],
  "totalEstimatedIssues": 60
}
```

### Generate Issues
**POST** `/api/plan/v2/generate-issues`

Generates issues for selected epics.

**Request Body:**
```json
{
  "phases": [...], // From generate-full-plan
  "metadata": {...}
}
```

### Create GitHub Issues
**POST** `/api/plan/v2/create-github-issues`

Creates issues in GitHub repository.

**Request Body:**
```json
{
  "repository": "owner/repo",
  "issues": [
    {
      "title": "Issue title",
      "body": "Issue body in markdown",
      "labels": ["phase:phase-1", "role:developer"],
      "assignee": "Developer"
    }
  ]
}
```

## 📚 GitHub Integration

### List Repositories
**GET** `/api/github/repos`

Returns user's GitHub repositories.

**Response:**
```json
[
  {
    "id": 123456,
    "name": "repo-name",
    "full_name": "owner/repo-name",
    "description": "Repository description",
    "private": false,
    "html_url": "https://github.com/owner/repo",
    "language": "JavaScript",
    "updated_at": "2025-07-24T12:00:00Z",
    "stargazers_count": 42
  }
]
```

### Get Repository README
**GET** `/api/github/repos/{owner}/{repo}/readme`

Returns repository README content.

**Response:**
```json
{
  "content": "# Project Title\n\nREADME content in markdown..."
}
```

## 🔬 Research API (Perplexity Integration)

### Submit Research Request
**POST** `/api/research`

Submits a research request to Perplexity API for async processing.

**Request Body:**
```json
{
  "task": "Research topic or question",
  "metadata": {
    "team": "red|white|black",  // Team affiliation (optional)
    "requester": "User Name",    // Who requested (optional)
    "company": "Company Name",   // Company context (optional)
    "project": "Project Name"    // Project context (optional)
  }
}
```

**Response (202 Accepted):**
```json
{
  "request_id": "perplexity-request-id",
  "status": "pending",
  "message": "Research request submitted successfully"
}
```

### Check Research Status
**GET** `/api/research/status/{requestId}`

Check the status of a research request.

**Response (200 OK):**
```json
{
  "request_id": "perplexity-request-id",
  "status": "completed|pending|failed",
  "result": {
    "content": "Research findings...",
    "model": "llama-3.1-sonar-large-128k-online",
    "usage": {
      "prompt_tokens": 100,
      "completion_tokens": 500
    }
  },
  "s3_location": "research-results/request-id.json"
}
```

### List Research Reports
**GET** `/api/research/reports`

List all research reports with optional filtering.

**Query Parameters:**
- `team` - Filter by team (red|white|black)
- `limit` - Number of results (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "reports": [
    {
      "reportId": "uuid",
      "task": "Research question",
      "status": "completed",
      "team": "red",
      "requester": "User Name",
      "completedAt": "2025-08-04T12:00:00Z",
      "s3Location": "research-results/uuid.json"
    }
  ],
  "count": 10,
  "hasMore": false
}
```

### Get Research Report
**GET** `/api/research/reports/{reportId}`

Retrieve a specific research report.

**Response (200 OK):**
```json
{
  "reportId": "uuid",
  "title": "Research Report Title",
  "summary": "120-word executive summary",
  "cleanedContent": "Full report content with think blocks removed",
  "sections": [
    {
      "id": "section-id",
      "heading": "Section Title",
      "markdown": "Section content in markdown",
      "html": "Sanitized HTML content",
      "wordCount": 500
    }
  ],
  "toc": [
    {
      "id": "section-id",
      "heading": "Section Title",
      "level": 2
    }
  ],
  "metrics": {
    "wordCount": 5000,
    "readingMinutes": 18
  },
  "entities": ["Company A", "Technology X"],
  "tags": ["research", "competitive-analysis"],
  "disclaimers": ["[Unverified] This report includes model-generated analysis"]
}
```

### Download Research Result
**GET** `/api/research/download/{s3Key}`

Download raw research result from S3.

**Response:** Binary file download

## 📄 Report Processing

### Process Raw Report
**POST** `/api/reports/process`

Process raw Perplexity output to generate structured reports.

**Request Body:**
```json
{
  "reportId": "unique-id",
  "rawContent": "Raw research content with <think> blocks",
  "team": "red|white|black",
  "objective": "Research objective",
  "metadata": {
    "requester": "User Name",
    "company": "Company Name"
  }
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "reportId": "unique-id",
  "result": {
    "summary": "120-word executive summary",
    "wordCount": 120,
    "sections": {
      "keyFindings": ["Finding 1", "Finding 2"],
      "opportunities": ["Opportunity 1", "Opportunity 2"],
      "recommendations": ["Recommendation 1", "Recommendation 2"],
      "risks": ["Risk 1", "Risk 2"]
    },
    "s3Location": "reports/unique-id/report.json"
  },
  "processing": {
    "thinkBlocksRemoved": 5,
    "apiCallsUsed": 1,
    "processingTimeMs": 4500
  }
}
```

### Enhance Existing Report
**POST** `/api/reports/enhance/{reportId}`

Enhance an existing report with additional processing.

**Request Body:**
```json
{
  "enhancements": ["visual-report", "action-items", "raw-export"]
}
```

## 🔬 Enhanced Research (V2)

### Submit Enhanced Research
**POST** `/api/research/v2`

Submit research with automatic report processing and 5 output formats.

**Request Body:**
```json
{
  "task": "Research question",
  "metadata": {
    "team": "red|white|black",
    "requester": "User Name",
    "company": "Company Name",
    "vendor": "Vendor Name",
    "tags": ["tag1", "tag2"],
    "priority": "high|medium|low"
  }
}
```

**Response (202 Accepted):**
```json
{
  "success": true,
  "request_id": "uuid",
  "status": "pending",
  "outputs": {
    "raw": "reports/uuid/raw.json",
    "report": "reports/uuid/report.json",
    "markdown": "reports/uuid/report.md",
    "html": "reports/uuid/report.html",
    "cleaned": "reports/uuid/cleaned.md"
  }
}
```

### Get Enhanced Research Status
**GET** `/api/research/v2/status/{requestId}`

**Response includes all 5 output formats when completed.**

### List Enhanced Reports
**GET** `/api/research/v2/reports`

**Response includes format availability flags:**
```json
{
  "reports": [
    {
      "reportId": "uuid",
      "formats": {
        "raw": true,
        "json": true,
        "markdown": true,
        "html": true,
        "cleaned": true
      }
    }
  ]
}
```

## 🔐 Authentication

Currently, the API uses GitHub OAuth for repository access. The GitHub token is retrieved from AWS Secrets Manager.

For Research API endpoints, Perplexity API key is required and managed via AWS Secrets Manager.

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Detailed error message"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Please try again later"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## 🚀 Quick Start Examples

### Start Async Plan Generation
```bash
curl -X POST https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/plan/async/start \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "title": "My Project",
      "description": "A test project",
      "domain": "general",
      "targetUsers": ["developers"],
      "techStack": ["Node.js"],
      "features": ["API"],
      "complexity": "simple"
    },
    "readmeContent": "# My Project\nA simple test project."
  }'
```

### Check Status
```bash
curl https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/plan/async/status/{jobId}
```

### Submit Research Request
```bash
curl -X POST https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "task": "Research competitive landscape for AI code assistants",
    "metadata": {
      "team": "red",
      "requester": "John Doe",
      "company": "Ocean Studio"
    }
  }'
```

### Process Report with Think Block Removal
```bash
curl -X POST https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/reports/process \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": "unique-id",
    "rawContent": "Research content with <think>internal thoughts</think>",
    "team": "red",
    "objective": "Competitive analysis"
  }'
```

## 📊 Rate Limits

- Claude API: ~10 requests per minute (with retry logic)
- OpenAI API: Fallback when Claude is overloaded
- GitHub API: 5000 requests per hour
- API Gateway: No specific limits
- Perplexity API: Rate limits apply per API key

## 🚀 Innovation Pipeline API (AWS Batch)

### Base URL
```
https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod
```

### Submit Pipeline Job
**POST** `/submit`

Submits a research document for innovation pipeline processing. The pipeline uses AWS Batch to run a multi-step LLM orchestration that:
1. Analyzes the research document
2. Generates innovation ideas
3. Creates actionable implementation plans
4. Sets up a GitHub repository with issues

**Request Body:**
```json
{
  "researchId": "string"  // ID of the research document from DynamoDB
}
```

**Success Response (200 OK):**
```json
{
  "jobId": "12345678-1234-1234-1234-123456789abc",
  "jobName": "pipeline-research123-20241215-143022",
  "status": "SUBMITTED",
  "message": "Pipeline job submitted successfully"
}
```

**Response Field Details:**
- `jobId`: AWS Batch job ID (UUID format) - use this to track the job in AWS
- `jobName`: Human-readable job name with format: `pipeline-{researchId}-{YYYYMMDD-HHMMSS}`
- `status`: Always "SUBMITTED" for successful submissions
- `message`: Confirmation message

**Error Responses:**

400 Bad Request (Missing researchId):
```json
{
  "error": "researchId is required"
}
```

404 Not Found (Research doesn't exist):
```json
{
  "error": "Research not found"
}
```

409 Conflict (Job already exists):
```json
{
  "error": "A pipeline job may already be running for this research"
}
```

**Behind the Scenes:**
1. Validates the researchId exists in DynamoDB PipelineResearch table
2. Retrieves the S3 key for the research document
3. Generates a unique job ID and timestamped job name
4. Submits an AWS Batch job with:
   - Container image from ECR
   - 4 vCPUs, 16GB RAM
   - 2-hour timeout
   - 2 retry attempts
   - Environment variables for S3 input location
5. Stores job metadata in DynamoDB PipelineBatchJobs table with:
   - 30-day TTL for automatic cleanup
   - Research ID association for lookup
   - Log stream name for monitoring

### Get Pipeline Job Logs
**GET** `/logs/{researchId}`

Retrieves the status and logs for a pipeline job. Poll this endpoint every 5 seconds to monitor progress.

**Path Parameters:**
- `researchId`: The research document ID (same as used in /submit)

**Success Response (200 OK):**
```json
{
  "jobId": "12345678-1234-1234-1234-123456789abc",
  "researchId": "research123",
  "status": "RUNNING",
  "createdAt": "2024-12-15T14:30:22Z",
  "logs": [
    {
      "timestamp": 1702652422000,
      "message": "Starting pipeline processing..."
    },
    {
      "timestamp": 1702652425000,
      "message": "Stage 1: Analyzing research document"
    },
    {
      "timestamp": 1702652430000,
      "message": "Found 5 key insights in research"
    }
  ],
  "logStreamUrl": "https://console.aws.amazon.com/cloudwatch/..."
}
```

**Response Field Details:**
- `jobId`: AWS Batch job ID
- `researchId`: The research document ID
- `status`: Current job status - one of:
  - `SUBMITTED`: Job has been submitted to the queue
  - `PENDING`: Job is waiting for resources
  - `RUNNABLE`: Job is ready to run
  - `STARTING`: Container is starting
  - `RUNNING`: Job is actively processing
  - `SUCCEEDED`: Job completed successfully
  - `FAILED`: Job failed (check logs for details)
- `createdAt`: When the job was submitted
- `logs`: Array of log entries sorted by timestamp
  - `timestamp`: Unix timestamp in milliseconds
  - `message`: Log message content
- `logStreamUrl`: Direct link to CloudWatch logs (optional)

**Error Responses:**

404 Not Found (No job found):
```json
{
  "error": "No job found for this research"
}
```

**Status Transitions:**
```
SUBMITTED → PENDING → RUNNABLE → STARTING → RUNNING → SUCCEEDED/FAILED
```

**Log Message Patterns:**
The logs contain progress indicators that can be parsed to show detailed progress:
- `"Stage 1"` or `"starting"`: Initialization phase
- `"Stage 2"` or `"processing"`: Research analysis
- `"Stage 3"` or `"analysis"`: Innovation ideation
- `"Stage 4"` or `"innovation"`: Concept development
- `"Stage 5"` or `"github"`: GitHub repository setup
- `"Issue created"`: Individual GitHub issue created
- `https://github.com/...`: GitHub repository URL when complete

### Pipeline Processing Stages

The innovation pipeline runs through 5 main stages:

1. **Research Analysis** (3-5 minutes)
   - Parses research document from S3
   - Extracts key insights and patterns
   - Identifies innovation opportunities

2. **Innovation Ideation** (3-5 minutes)
   - Generates 10-15 innovation concepts
   - Evaluates feasibility and impact
   - Prioritizes top ideas

3. **Concept Development** (3-5 minutes)
   - Develops detailed implementation plans
   - Creates technical specifications
   - Defines success metrics

4. **GitHub Repository Setup** (2-3 minutes)
   - Creates new repository in mvp-builder-app org
   - Sets up README with project overview
   - Configures repository settings

5. **Issue Creation** (3-5 minutes)
   - Creates 20-30 GitHub issues
   - Adds detailed descriptions and acceptance criteria
   - Assigns labels and milestones

**Total Processing Time:** 10-15 minutes typical, up to 22 minutes for complex research

### Integration with Frontend

The frontend uses the `innovationPipelineService.ts` to interact with the Batch API:

```typescript
// Start a pipeline job
const response = await innovationPipelineService.startPipeline(
  researchDocId,  // The research document ID
  username        // Username for tracking (optional)
);

// Poll for completion
const status = await innovationPipelineService.pollJobCompletion(
  researchDocId,
  (progress) => {
    console.log(`Progress: ${progress.overallProgress}%`);
    console.log(`Current stage: ${progress.stageName}`);
  },
  180,  // Max attempts (180 * 5s = 15 minutes)
  5000  // Poll interval (5 seconds)
);

// Results available when status.status === 'COMPLETED'
if (status.status === 'COMPLETED') {
  console.log(`GitHub repo: ${status.results.githubRepoUrl}`);
  console.log(`Issues created: ${status.results.issuesCreated}`);
}
```

### Environment Variables

The frontend requires:
```env
VITE_BATCH_PIPELINE_URL=https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod
```

### Prerequisites

Before submitting a pipeline job:
1. The researchId must exist in the DynamoDB PipelineResearch table
2. The research document must be uploaded to S3 at the registered location
3. The research document should contain market research data to process

### Rate Limiting & Polling

- **Polling Interval:** 5 seconds (recommended by AWS for Batch jobs)
- **Max Duration:** 2 hours (job timeout)
- **Retry Logic:** Jobs automatically retry 2 times on failure
- **Concurrent Jobs:** Only one job per researchId at a time

### Currently Implemented Endpoints

The AWS Batch Pipeline API currently provides two core endpoints:
- **POST /submit** - Submit a research document for processing
- **GET /logs/{researchId}** - Get status and logs for a running job

### Enhanced Endpoints (Ready for Deployment)

Additional endpoints are implemented in `cdk_batch_pipeline_enhanced.py` and ready for deployment:

- **GET /status/{jobId}** - Direct status lookup by job ID
- **GET /jobs** - List all jobs with pagination and filtering
- **DELETE /jobs/{jobId}** - Cancel running jobs
- **GET /results/{researchId}** - Download pipeline outputs
- **GET /health** - System health check

These enhanced endpoints provide:
- Conflict detection (409 responses for duplicate jobs)
- Input validation and S3 verification
- Presigned URLs for secure result downloads
- Pagination support for job listings
- Comprehensive error handling with troubleshooting hints

## 🌐 CORS Configuration

The API supports Cross-Origin Resource Sharing (CORS) with the following configuration:

### Allowed Origins
- `*` (all origins allowed)
- Note: When using wildcard origin, credentials are not supported

### Allowed Headers
- `Content-Type`
- `Authorization`
- `X-Api-Key`
- `Accept`

### Allowed Methods
- `GET`
- `POST`
- `OPTIONS`
- `PUT`
- `DELETE`

### CORS Preflight
All endpoints support OPTIONS requests for CORS preflight checks.

### Frontend Integration
The API is configured to work with:
- Production frontend: `https://oceanstudio.io`
- Development: `http://localhost:5173`

Example frontend usage:
```javascript
const response = await fetch('https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/research', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    task: 'Research question',
    metadata: { team: 'red' }
  })
});
```