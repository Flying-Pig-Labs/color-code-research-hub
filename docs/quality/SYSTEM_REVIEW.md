# Color Code Research Hub - System Architecture Review

## Executive Summary

This document provides a comprehensive review of the Color Code Research Hub system architecture as of January 2025. The system is designed to accept research requests from users, process them through Perplexity AI, and deliver formatted reports.

## Core System Flow

### 1. User Journey
```
User submits research request → Gets immediate response → Views formatted report
```

### 2. Technical Flow
```
Frontend → API Gateway → Lambda A → DynamoDB → Lambda B → SQS → Lambda C → S3/DynamoDB
```

## Component Architecture

### Frontend (React/Vite)
- **URL**: https://oceanstudio.io
- **Hosting**: AWS Amplify
- **Purpose**: User interface for submitting research requests and viewing reports

### API Gateway
- **URL**: https://zi612qxxv0.execute-api.us-east-1.amazonaws.com/production
- **Purpose**: HTTP endpoint for all API calls
- **Timeout**: 30 seconds (hard limit)

### Lambda Functions

#### ResearchApiFunction (Lambda A)
- **Purpose**: Receive research requests and initiate async processing
- **Timeout**: 900 seconds (but must return in <30s due to API Gateway)
- **Key Actions**:
  1. Receive POST /api/research
  2. Submit to Perplexity async API
  3. Store request.json in S3
  4. Create DynamoDB record (status="processing")
  5. Return immediately with research_id

#### ResearchStreamProcessor (Lambda B)
- **Purpose**: Poll Perplexity for completion
- **Trigger**: DynamoDB Stream (when status="processing")
- **Timeout**: 900 seconds
- **Key Actions**:
  1. Poll Perplexity API every 5 seconds
  2. When complete, store response.json in S3
  3. Update DynamoDB (status="pending_postprocessing")
  4. Send message to SQS

#### ReportProcessingFunction (Lambda C)
- **Purpose**: Generate summary and format report
- **Trigger**: SQS Queue
- **Timeout**: 900 seconds
- **Key Actions**:
  1. Make 2 Claude API calls:
     - Generate 120-word summary
     - Format report as markdown (NO summarization)
  2. Store summary.txt and report.md in S3
  3. Update DynamoDB with processedSummary

#### GetReportHandler (Lambda D)
- **Purpose**: Serve reports to frontend
- **Endpoint**: GET /api/research/reports/{reportId}
- **Key Actions**:
  1. Read from DynamoDB
  2. Fetch report.md from S3
  3. Return formatted data

### Storage

#### DynamoDB Table: ResearchReports
- **Primary Key**: reportId
- **Key Fields**:
  - status: processing → pending_postprocessing → completed
  - requestId: Perplexity request ID
  - s3BasePath: users/{username}/research/{team}/{research-id}
  - processedSummary: 120-word summary text

#### S3 Bucket: color-code-research-results-984906149037
- **Structure**:
  ```
  users/
    {username}/
      research/
        {team}/
          {research-id}/
            request.json
            metadata.json
            response.json
            summary.txt
            report.md
  ```

### Integration Points

#### DynamoDB Streams
- Triggers Lambda B when new records are created/modified
- Enables async processing without polling

#### SQS Queue: ReportProcessingQueue
- Decouples research completion from report processing
- Ensures reliable processing even if Lambda C fails

## Critical Integration Requirements

### 1. CORS Headers
All Lambda responses MUST include:
```javascript
{
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key,Accept",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS"
}
```

### 2. Status Flow
```
processing → pending_postprocessing → completed
           ↓ (on error)
           error / error_timeout
```

### 3. S3 File Naming
All files MUST follow the pattern:
`users/{username}/research/{team}/{research-id}/{filename}`

### 4. API Response Format
ResearchApiFunction MUST return:
```json
{
  "success": true,
  "research_id": "uuid",
  "request_id": "perplexity-id",
  "status": "processing",
  "message": "Research job started...",
  "status_url": "/api/research/status/{request_id}",
  "report_url": "/reports/{research_id}"
}
```

## Known Issues to Address

1. **ResearchApiFunction is polling Perplexity** - Should NOT poll, just submit and return
2. **ResearchStreamProcessor needs to poll** - Currently looking for wrong status
3. **Frontend may need updates** - To handle async nature properly
4. **Missing error handling** - Need proper error states and recovery

## Success Criteria

1. User can submit research request and get immediate response (<1 second)
2. Research processes asynchronously without timeouts
3. User can view formatted report when complete
4. System handles errors gracefully