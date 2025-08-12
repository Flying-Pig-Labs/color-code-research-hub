# Innovation Pipeline API Documentation

> **Last Updated**: January 8, 2025
> **Version**: 1.0.0
> **API Gateway**: https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod

## Overview

The Innovation Pipeline API processes research reports through a multi-step LLM pipeline to generate actionable innovation ideas and create GitHub repositories with structured issues. The system uses AWS Batch for containerized processing and typically takes 10-15 minutes to complete.

## Architecture

### Components
- **API Gateway**: 9hv22ga3uh (prod stage)
- **Lambda Functions**: pipeline-submit-job, pipeline-get-logs
- **AWS Batch**: Container-based LLM processing
- **CloudWatch Logs**: Pipeline execution logs
- **S3 Bucket**: pipeline-data-984906149037-us-east-1

### Data Flow
```
1. Frontend submits researchId → POST /submit
2. Lambda validates and submits to AWS Batch
3. Batch runs containerized pipeline (10-15 min)
4. Frontend polls GET /logs/{researchId} for status
5. Pipeline generates GitHub repo with issues
6. Frontend displays completion with repo link
```

## API Endpoints

### POST /submit

Submit a research report for innovation pipeline processing.

**Request**
```http
POST https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod/submit
Content-Type: application/json

{
  "researchId": "report-2024-12-15-123456"
}
```

**Success Response (200 OK)**
```json
{
  "jobId": "12345678-1234-1234-1234-123456789abc",
  "jobName": "pipeline-report123-20241215-143022",
  "status": "SUBMITTED",
  "message": "Pipeline job submitted successfully"
}
```

**Error Responses**

400 Bad Request - Missing researchId:
```json
{
  "error": "researchId is required"
}
```

404 Not Found - Research doesn't exist:
```json
{
  "error": "Research not found"
}
```

### GET /logs/{researchId}

Poll for job status and execution logs.

**Request**
```http
GET https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod/logs/report-2024-12-15-123456
```

**Success Response (200 OK)**
```json
{
  "jobId": "12345678-1234-1234-1234-123456789abc",
  "researchId": "report-2024-12-15-123456",
  "status": "RUNNING",
  "createdAt": "2024-12-15T10:30:00",
  "logs": [
    {
      "timestamp": 1702634400000,
      "message": "Starting pipeline execution..."
    },
    {
      "timestamp": 1702634401000,
      "message": "Stage 1: Research Analysis started"
    },
    {
      "timestamp": 1702634420000,
      "message": "Processing research data from S3..."
    },
    {
      "timestamp": 1702634440000,
      "message": "Stage 2: Innovation Ideation started"
    }
  ],
  "logStreamUrl": "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups/..."
}
```

**Status Values**
- `SUBMITTED`: Job submitted to queue
- `PENDING`: Waiting for resources
- `RUNNABLE`: Ready to run
- `STARTING`: Container starting
- `RUNNING`: Pipeline actively executing
- `SUCCEEDED`: Pipeline completed successfully
- `FAILED`: Pipeline failed

**Error Responses**

404 Not Found - No job found:
```json
{
  "error": "No job found for this research"
}
```

400 Bad Request - Invalid researchId:
```json
{
  "error": "researchId is required"
}
```

## Pipeline Stages

The innovation pipeline executes 5 stages:

1. **Research Analysis** (2-3 min)
   - Load research report from S3
   - Extract key insights and themes
   - Identify innovation opportunities

2. **Innovation Ideation** (3-4 min)
   - Generate innovative product ideas
   - Create technical specifications
   - Define implementation approaches

3. **Concept Development** (2-3 min)
   - Refine selected ideas
   - Create detailed requirements
   - Plan development phases

4. **GitHub Repository Setup** (1-2 min)
   - Create new repository
   - Configure settings and permissions
   - Set up project structure

5. **Issue Creation** (3-4 min)
   - Generate GitHub issues for each task
   - Add labels and milestones
   - Create project board

## Frontend Integration

### Service: innovationPipelineService.ts

```typescript
import { innovationPipelineService } from '@/services/innovationPipelineService';

// Start pipeline
const response = await innovationPipelineService.startPipeline(
  researchId,
  username
);

// Poll for status
const status = await innovationPipelineService.checkJobStatus(researchId);

// Poll until completion
const finalStatus = await innovationPipelineService.pollJobCompletion(
  researchId,
  (status) => console.log('Progress:', status),
  180, // max attempts (15 minutes)
  5000  // poll interval (5 seconds)
);
```

### Component: PipelineProgress.tsx

The PipelineProgress component displays real-time status updates:

```typescript
<PipelineProgress
  jobId={pipelineJobId}
  researchId={researchId}
  onComplete={(repoUrl) => {
    console.log('Repository created:', repoUrl);
  }}
/>
```

## Polling Strategy

**Recommended Configuration:**
- **Interval**: 5-10 seconds
- **Timeout**: 15 minutes (180 attempts × 5 seconds)
- **Backoff**: None needed (AWS Batch handles rate limiting)

**Implementation Example:**
```javascript
async function pollForCompletion(researchId) {
  const maxAttempts = 180;
  const pollInterval = 5000; // 5 seconds
  
  for (let i = 0; i < maxAttempts; i++) {
    const response = await fetch(`/logs/${researchId}`);
    const data = await response.json();
    
    if (data.status === 'SUCCEEDED') {
      return { success: true, data };
    }
    
    if (data.status === 'FAILED') {
      return { success: false, error: data.error };
    }
    
    await new Promise(resolve => setTimeout(resolve, pollInterval));
  }
  
  throw new Error('Pipeline timed out after 15 minutes');
}
```

## CORS Configuration

As of January 8, 2025, CORS headers are properly configured:

```python
headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
}
```

## Error Handling

### Common Errors

1. **404 Research Not Found**
   - Cause: Research record doesn't exist in DynamoDB/S3
   - Solution: Ensure research is created before starting pipeline

2. **AWS Batch Job Failed**
   - Cause: Container error, API limits, or processing failure
   - Solution: Check CloudWatch logs via logStreamUrl

3. **Timeout After 15 Minutes**
   - Cause: Pipeline taking longer than expected
   - Solution: Check AWS Batch console for job status

### Retry Strategy

```javascript
async function startPipelineWithRetry(researchId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await startPipeline(researchId);
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

## AWS Infrastructure

### Lambda Functions

**pipeline-submit-job**
- Runtime: Python 3.11
- Timeout: 30 seconds
- Memory: 256MB
- Role: Submit jobs to AWS Batch

**pipeline-get-logs**
- Runtime: Python 3.11
- Timeout: 30 seconds
- Memory: 256MB
- Role: Query Batch status and CloudWatch logs

### AWS Batch Configuration

- **Compute Environment**: ECS Fargate
- **Job Queue**: pipeline-queue
- **Job Definition**: multi-step-llm-pipeline
- **Container Image**: ECR repository with LLM pipeline
- **vCPUs**: 4
- **Memory**: 8192 MB
- **Timeout**: 20 minutes

### CloudWatch Logs

Log groups:
- `/aws/batch/job/multi-step-llm-pipeline`
- `/aws/lambda/pipeline-submit-job`
- `/aws/lambda/pipeline-get-logs`

## Monitoring

### Key Metrics
- Job submission rate
- Average processing time (target: 10-15 min)
- Success/failure rates
- API Gateway 4xx/5xx errors

### CloudWatch Alarms
- Job failures > 10% in 5 minutes
- Average duration > 20 minutes
- API Gateway errors > 5% in 5 minutes

## Cost Considerations

**Estimated costs per pipeline run:**
- AWS Batch (Fargate): ~$0.20-0.30
- Lambda invocations: < $0.01
- CloudWatch Logs: < $0.01
- API Gateway: < $0.01
- **Total**: ~$0.25 per pipeline execution

## Security

### API Security
- CORS configured for allowed origins
- API Gateway throttling: 10 requests/second
- Lambda function permissions via IAM roles

### Data Security
- S3 bucket encryption at rest
- VPC endpoints for private communication
- Secrets stored in AWS Secrets Manager

## Testing

### Test Pipeline Submission
```bash
# Test with curl
curl -X POST https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod/submit \
  -H "Content-Type: application/json" \
  -d '{"researchId": "test-research-123"}' \
  -v

# Check status
curl https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod/logs/test-research-123
```

### Local Testing
```javascript
// Mock service for development
class MockPipelineService {
  async startPipeline(researchId) {
    return {
      jobId: 'mock-job-123',
      status: 'SUBMITTED',
      message: 'Mock pipeline started'
    };
  }
  
  async checkJobStatus(researchId) {
    return {
      status: 'SUCCEEDED',
      logs: [{ message: 'Mock completed' }]
    };
  }
}
```

## Troubleshooting

### Check AWS Batch Job
```bash
aws batch describe-jobs \
  --jobs job-id-here \
  --profile mvp \
  --region us-east-1
```

### View CloudWatch Logs
```bash
aws logs tail /aws/batch/job/multi-step-llm-pipeline \
  --profile mvp \
  --region us-east-1 \
  --follow
```

### Debug Lambda Functions
```bash
# View recent Lambda logs
aws logs tail /aws/lambda/pipeline-submit-job \
  --profile mvp \
  --region us-east-1 \
  --since 10m
```

## Future Enhancements

1. **WebSocket Support**: Real-time updates instead of polling
2. **Progress Percentage**: More granular progress tracking
3. **Cancel Job**: Ability to cancel running pipelines
4. **Batch Processing**: Submit multiple research reports
5. **Custom Parameters**: Configure pipeline behavior
6. **Result Caching**: Cache results for identical inputs

## Support

For issues or questions:
- Check CloudWatch logs for detailed error messages
- Review AWS Batch job details in console
- Contact the development team with jobId and timestamp