# AWS Batch Innovation Pipeline Documentation

## Overview

The Innovation Pipeline is an AWS Batch-powered system that transforms research documents into actionable innovation ideas with GitHub repositories and issues. The pipeline runs a multi-step LLM orchestration that takes approximately 10-15 minutes to complete.

## Architecture

### Components

1. **API Gateway**: `https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod`
2. **AWS Batch**: Manages job execution with 4 vCPUs and 16GB RAM per job
3. **DynamoDB Tables**:
   - `PipelineResearch`: Stores research document metadata
   - `PipelineBatchJobs`: Tracks job status and metadata
4. **S3 Bucket**: Stores research documents and pipeline outputs
5. **CloudWatch Logs**: Captures detailed job execution logs
6. **ECR**: Hosts the container image for pipeline processing

### Data Flow

```
User clicks IDEATE → Frontend calls /submit → API validates research
     ↓                      ↓                         ↓
AWS Batch job     ← Job submitted to queue ← Job metadata stored
     ↓
Container runs 5-stage pipeline
     ↓
Results saved to S3 & GitHub created
     ↓
Frontend polls /logs/{researchId} for status
```

## Frontend Integration

### Service Implementation

The `innovationPipelineService.ts` provides a complete interface to the Batch API:

```typescript
import { innovationPipelineService } from '../services/innovationPipelineService';

// Start a pipeline job
const startJob = async (researchDocId: string) => {
  try {
    const response = await innovationPipelineService.startPipeline(
      researchDocId,
      'username' // optional
    );
    
    console.log('Job started:', response.jobId);
    console.log('Job name:', response.jobName);
    
    // Store jobId for recovery
    localStorage.setItem('innovationPipelineJobId', response.jobId);
    
    return response;
  } catch (error) {
    console.error('Failed to start pipeline:', error);
  }
};

// Check job status once
const checkStatus = async (researchId: string) => {
  const status = await innovationPipelineService.checkJobStatus(researchId);
  
  console.log('Status:', status.status);
  console.log('Progress:', status.overallProgress + '%');
  console.log('Current stage:', status.stageName);
  
  if (status.status === 'COMPLETED') {
    console.log('GitHub repo:', status.results.githubRepoUrl);
  }
};

// Poll until completion
const pollForCompletion = async (researchId: string) => {
  const finalStatus = await innovationPipelineService.pollJobCompletion(
    researchId,
    (progress) => {
      // Progress callback
      console.log(`${progress.overallProgress}% - ${progress.stageName}`);
    },
    180,  // max attempts (15 minutes)
    5000  // poll interval (5 seconds)
  );
  
  if (finalStatus.status === 'COMPLETED') {
    console.log('Pipeline completed!');
    console.log('Repository:', finalStatus.results.githubRepoUrl);
    console.log('Issues created:', finalStatus.results.issuesCreated);
  } else if (finalStatus.status === 'FAILED') {
    console.error('Pipeline failed:', finalStatus.error);
  }
};
```

### Status Adapter

The service includes an adapter that converts AWS Batch status to UI-friendly format:

#### AWS Batch Status → UI Status Mapping
- `SUBMITTED`, `PENDING`, `RUNNABLE` → `QUEUED`
- `STARTING`, `RUNNING` → `RUNNING`
- `SUCCEEDED` → `COMPLETED`
- `FAILED` → `FAILED`

#### Progress Calculation
The service parses CloudWatch logs to determine progress:
- Searches for stage indicators: "Stage 1", "Stage 2", etc.
- Calculates overall progress: each stage = 20% (5 stages total)
- Extracts GitHub URLs and issue counts from logs
- Provides estimated time remaining based on typical durations

### React Component Integration

```tsx
import { PipelineProgress } from './components/PipelineProgress';

function ReportModal() {
  const [pipelineJobId, setPipelineJobId] = useState<string | null>(null);
  const [showPipeline, setShowPipeline] = useState(false);
  
  const handleIdeate = async () => {
    try {
      const response = await innovationPipelineService.startPipeline(
        reportId,
        'user'
      );
      
      setPipelineJobId(response.jobId);
      setShowPipeline(true);
      
      // Store for recovery after page refresh
      localStorage.setItem('innovationPipelineJobId', response.jobId);
    } catch (error) {
      toast.error('Failed to start pipeline');
    }
  };
  
  return (
    <>
      {showPipeline ? (
        <PipelineProgress 
          jobId={pipelineJobId}
          onComplete={(repoUrl) => {
            toast.success('Innovation ideas generated!', {
              action: {
                label: 'View on GitHub',
                onClick: () => window.open(repoUrl, '_blank')
              }
            });
          }}
          onError={(error) => {
            toast.error('Pipeline failed: ' + error);
          }}
        />
      ) : (
        <button onClick={handleIdeate}>
          IDEATE
        </button>
      )}
    </>
  );
}
```

## API Endpoints

### POST /submit

Submit a research document for processing.

**Request:**
```json
{
  "researchId": "research-doc-123"
}
```

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "jobName": "pipeline-research-doc-123-20241215-143022",
  "status": "SUBMITTED",
  "message": "Pipeline job submitted successfully"
}
```

**Error Cases:**
- `400`: Missing researchId
- `404`: Research document not found
- `409`: Job already running for this research

### GET /logs/{researchId}

Get status and logs for a pipeline job.

**Response:**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "researchId": "research-doc-123",
  "status": "RUNNING",
  "createdAt": "2024-12-15T14:30:22Z",
  "logs": [
    {
      "timestamp": 1702652422000,
      "message": "Stage 2: Processing research document"
    },
    {
      "timestamp": 1702652430000,
      "message": "Generating innovation concepts..."
    }
  ],
  "logStreamUrl": "https://console.aws.amazon.com/cloudwatch/..."
}
```

## Pipeline Stages

### Stage 1: Initialization (1-2 minutes)
- Validates input research document
- Sets up processing environment
- Loads AI models and configurations

### Stage 2: Research Analysis (3-5 minutes)
- Parses research document from S3
- Extracts key insights using LLMs
- Identifies market opportunities
- Analyzes competitive landscape

### Stage 3: Innovation Ideation (3-5 minutes)
- Generates 10-15 innovation concepts
- Evaluates each idea for:
  - Technical feasibility
  - Market potential
  - Implementation complexity
  - Competitive advantage
- Prioritizes top 5-7 ideas

### Stage 4: Concept Development (3-5 minutes)
- Develops detailed implementation plans
- Creates technical specifications
- Defines success metrics and KPIs
- Outlines resource requirements
- Generates project timeline

### Stage 5: GitHub Integration (3-5 minutes)
- Creates new repository in mvp-builder-app organization
- Generates comprehensive README
- Creates 20-30 detailed GitHub issues with:
  - User stories
  - Acceptance criteria
  - Technical specifications
  - Dependencies
- Adds labels and milestones
- Sets up project board

## Configuration

### Environment Variables

**Frontend (.env.production):**
```env
VITE_BATCH_PIPELINE_URL=https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod
```

**Backend (Lambda Environment):**
```env
BATCH_JOB_QUEUE=pipeline-job-queue
BATCH_JOB_DEFINITION=pipeline-job-definition
S3_BUCKET=pipeline-data-984906149037-us-east-1
DYNAMODB_TABLE_RESEARCH=PipelineResearch
DYNAMODB_TABLE_JOBS=PipelineBatchJobs
```

### AWS Batch Configuration

**Job Definition:**
- Container: ECR image with pipeline processing logic
- vCPUs: 4
- Memory: 16384 MB (16 GB)
- Job timeout: 7200 seconds (2 hours)
- Retry attempts: 2

**Job Queue:**
- Priority: 1000
- Compute environment: Managed EC2 Spot instances

## Monitoring & Debugging

### CloudWatch Logs

Log streams are created for each job:
```
/aws/batch/job/pipeline-research-doc-123-20241215-143022
```

### Key Log Patterns

**Success Indicators:**
```
"Pipeline completed successfully"
"GitHub repository created: https://github.com/..."
"Created X issues in repository"
```

**Error Indicators:**
```
"ERROR:"
"FAILED:"
"Exception:"
"Rate limit exceeded"
```

### Progress Tracking

The frontend parses logs to show progress:
```javascript
// Log parsing logic in innovationPipelineService.ts
private detectCurrentStage(logs: string[]): number {
  for (let i = logs.length - 1; i >= 0; i--) {
    const log = logs[i].toLowerCase();
    if (log.includes('stage 5') || log.includes('github')) return 5;
    if (log.includes('stage 4') || log.includes('innovation')) return 4;
    if (log.includes('stage 3') || log.includes('analysis')) return 3;
    if (log.includes('stage 2') || log.includes('processing')) return 2;
    if (log.includes('stage 1') || log.includes('starting')) return 1;
  }
  return 1;
}
```

## Troubleshooting

### Common Issues

1. **404 Error on /submit**
   - Research document doesn't exist in DynamoDB
   - Solution: Ensure research is created before ideation

2. **409 Conflict on /submit**
   - Job already running for this research
   - Solution: Wait for current job to complete or check status

3. **Pipeline Stuck in PENDING**
   - AWS Batch queue is full or resources unavailable
   - Solution: Wait for resources or check AWS Batch console

4. **Pipeline Failed**
   - Check CloudWatch logs for specific error
   - Common causes:
     - S3 document not found
     - GitHub API rate limit
     - LLM API errors
     - Invalid research format

### Recovery Mechanisms

The frontend includes recovery features:

1. **Job ID Persistence**: Stores in localStorage
2. **Page Refresh Recovery**: Automatically reconnects to running job
3. **Error Retry**: Manual retry button on failure
4. **Timeout Protection**: 15-minute polling limit

## Testing

### Manual Testing

1. **Start a test job:**
```bash
curl -X POST https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod/submit \
  -H "Content-Type: application/json" \
  -d '{"researchId": "test-research-123"}'
```

2. **Check status:**
```bash
curl https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod/logs/test-research-123
```

### Frontend Testing

1. Open browser DevTools
2. Navigate to Reports page
3. Click IDEATE on any report
4. Monitor Network tab for API calls
5. Check Console for progress logs

## Cost Optimization

### AWS Batch Spot Instances
- Uses Spot instances for 70% cost savings
- Automatic failover to On-Demand if needed

### DynamoDB TTL
- Jobs auto-delete after 30 days
- Reduces storage costs

### S3 Lifecycle
- Research documents moved to Glacier after 90 days
- Outputs retained for 1 year

## Security

### API Gateway
- No authentication required (public endpoint)
- Rate limiting: 100 requests per second
- Throttling: 1000 burst capacity

### DynamoDB
- Encryption at rest enabled
- Point-in-time recovery enabled

### S3
- Server-side encryption (SSE-S3)
- Versioning enabled
- Access logging enabled

### AWS Batch
- Jobs run in isolated containers
- IAM roles with minimal permissions
- Network isolation via VPC

## Enhanced API Routes (Planned)

The following enhanced routes are designed and ready for deployment in `cdk_batch_pipeline_enhanced.py`:

### ✅ Routes Ready for Deployment

1. **Enhanced POST /submit**
   - 409 conflict detection for running jobs
   - Input validation and sanitization
   - S3 file verification before submission
   - Force flag to override existing jobs
   
2. **GET /status/{jobId}**
   - Direct job status lookup by AWS Batch job ID
   - Runtime metrics and detailed progress
   
3. **GET /jobs**
   - List all jobs with pagination support
   - Filter by status or researchId
   - Sort by creation date
   
4. **DELETE /jobs/{jobId}**
   - Cancel running jobs
   - Reason tracking for audit trail
   
5. **GET /results/{researchId}**
   - Retrieve pipeline outputs from S3
   - Presigned URLs for secure downloads
   - Multiple output format support
   
6. **GET /health**
   - System health check
   - AWS Batch queue status
   - DynamoDB connectivity check

### 🔑 Key Features in Enhanced Stack

- **Conflict Detection**: Prevents duplicate jobs unless forced
- **Input Validation**: Sanitizes researchId format (alphanumeric + hyphens)
- **S3 Verification**: Confirms research document exists before job submission
- **Presigned URLs**: Secure temporary download links (1-hour expiry)
- **Pagination**: Efficiently handle large job lists (default 20, max 100)
- **Status Tracking**: Real-time updates from AWS Batch with runtime calculations
- **Comprehensive Error Handling**: Detailed error messages with troubleshooting hints

### 🔄 Additional Future Enhancements

1. **Rate Limiting**: API Gateway throttling (10 req/sec per IP)
2. **Webhook Support**: POST callbacks on job completion/failure
3. **Retry Logic**: Automatic retry with exponential backoff
4. **WebSocket Support**: Real-time status updates without polling
5. **Multiple LLM Providers**: Fallback options for resilience
6. **Custom Templates**: User-defined innovation frameworks
7. **Batch Processing**: Submit multiple research documents
8. **Export Options**: Download results as PDF/DOCX
9. **Cost Tracking**: Per-job cost breakdown with billing alerts
10. **Priority Queues**: Fast-track urgent research with dedicated resources

## Support

For issues or questions:
1. Check CloudWatch logs for detailed error messages
2. Review this documentation
3. Contact the development team with job ID and error details