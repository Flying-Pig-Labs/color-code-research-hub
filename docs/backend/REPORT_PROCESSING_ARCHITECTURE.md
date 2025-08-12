# Report Processing Architecture

## Overview

The Color Code Research Hub implements an event-driven architecture for automatic post-processing of research reports. When a research job completes, the system automatically generates AI summaries, structured sections, and multiple output formats.

## Architecture Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Research API   │────▶│   DynamoDB      │────▶│ DynamoDB Stream │
│  (Perplexity)   │     │ ResearchReports │     │   (Triggers)    │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                          │
                                                          ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Report Processor│◀────│      SQS        │◀────│ Stream Processor│
│   (Lambda)      │     │     Queue       │     │    (Lambda)     │
└────────┬────────┘     └─────────────────┘     └─────────────────┘
         │
         ▼
┌─────────────────┐     ┌─────────────────┐
│   S3 Storage    │     │   DynamoDB      │
│ (Full Reports)  │     │  (Summaries)    │
└─────────────────┘     └─────────────────┘
```

## Components

### 1. ResearchApiFunction (Python)
- **Role**: Handles research requests and polls Perplexity API
- **Trigger**: API Gateway POST `/api/research`
- **Actions**:
  - Creates async job with Perplexity
  - Polls for completion (up to 15 minutes)
  - Updates DynamoDB with status changes
  - Saves raw response to S3

### 2. DynamoDB ResearchReports Table
- **Purpose**: Stores research metadata and processing status
- **Key Fields**:
  - `reportId`: Unique identifier
  - `status`: pending → processing → completed
  - `content`: Raw research content
  - `processedSummary`: AI-generated summary
  - `summaryWordCount`: Word count of summary
  - `fullReportS3Key`: S3 location of processed report
- **Features**:
  - DynamoDB Streams enabled (NEW_AND_OLD_IMAGES)
  - TTL set to 90 days
  - GSI on team-createdAt for querying

### 3. ResearchStreamProcessorFunction (Node.js)
- **Role**: Monitors DynamoDB Streams for completed research
- **Trigger**: DynamoDB Stream events
- **Actions**:
  - Detects status changes to "completed"
  - Extracts report data
  - Sends message to SQS for processing
- **Key Logic**:
  ```javascript
  // Only process when status changes TO completed
  if (newStatus === 'completed' && oldStatus !== 'completed') {
      // Send to SQS for processing
  }
  ```

### 4. SQS ReportProcessingQueue
- **Purpose**: Decouples stream processing from report generation
- **Configuration**:
  - Standard queue (not FIFO)
  - Visibility timeout: 960 seconds (16 minutes)
  - Message retention: 24 hours
  - DLQ after 3 failed attempts
- **Benefits**:
  - Reliable message delivery
  - Automatic retries
  - No circular dependencies

### 5. ReportProcessingFunction (Node.js)
- **Role**: Generates AI summaries and structured reports
- **Trigger**: SQS messages
- **Actions**:
  - Receives report data from queue
  - Uses team-specific prompts (red/white/black)
  - Calls Claude API for summarization
  - Generates 5 output artifacts
  - Updates DynamoDB with summary
  - Saves full report to S3
- **Timeout**: 15 minutes
- **Memory**: 3008 MB

### 6. Prompt Library (prompt-formatters.js)
- **Purpose**: Team-specific prompt templates
- **Teams**:
  - **Red Team**: Competitive disruption analysis
  - **White Team**: Market opportunity discovery
  - **Black Team**: Vendor replacement analysis
- **Features**:
  - Exhaustive research directives
  - Ethical context framing
  - Structured output requirements

## Data Flow Example

1. **User submits research request**
   ```
   POST /api/research
   {
     "content": "Research task",
     "team": "red",
     "companyName": "Example Corp"
   }
   ```

2. **ResearchApiFunction creates job**
   - Calls Perplexity API
   - Creates DynamoDB record with status "pending"
   - Returns job ID to user

3. **Polling and completion**
   - API polls Perplexity every 10 seconds
   - When complete, updates DynamoDB status to "completed"
   - Saves raw response to S3

4. **Stream processing triggers**
   - DynamoDB Stream detects status change
   - ResearchStreamProcessor sends message to SQS

5. **Report processing**
   - ReportProcessingFunction receives SQS message
   - Generates AI summary using Claude
   - Creates structured sections
   - Updates DynamoDB with summary
   - Saves full report to S3

6. **User retrieves report**
   - Frontend polls status endpoint
   - Downloads formatted report with AI summary

## Output Artifacts

The report processor generates 5 artifacts:

1. **Executive Summary** (processedSummary)
   - 100-200 word AI summary
   - Stored directly in DynamoDB
   - Displayed in UI immediately

2. **Structured Report** (fullReportS3Key)
   - Complete formatted report
   - Markdown format
   - Sections: Key Findings, Opportunities, Recommendations, Risks
   - Stored in S3

3. **Raw Research Data**
   - Original Perplexity response
   - Preserved for audit trail
   - Located at `users/{userId}/research/{researchId}/response.json`

4. **Metadata File**
   - Processing timestamps
   - Model versions used
   - Token counts
   - Located at `users/{userId}/research/{researchId}/metadata.json`

5. **Request Record**
   - Original request parameters
   - User information
   - Located at `users/{userId}/research/{researchId}/request.json`

## Error Handling

### Rate Limiting
- Claude API throttling handled with exponential backoff
- Maximum 3 retry attempts
- Falls back to OpenAI if Claude unavailable

### Failed Processing
- Messages sent to Dead Letter Queue after 3 failures
- Original raw data always preserved
- Users can still access unprocessed reports

### Missing Dependencies
- Graceful fallback if prompt library unavailable
- Default prompts used as backup
- Errors logged but don't block processing

## Monitoring and Debugging

### CloudWatch Logs
- Stream Processor: `/aws/lambda/color-code-research-hub-ResearchStreamProcessorFun-*`
- Report Processor: `/aws/lambda/color-code-research-hub-ReportProcessingFunction-*`
- Research API: `/aws/lambda/color-code-research-hub-ResearchApiFunction-*`

### Key Metrics
- SQS queue depth
- Processing time per report
- Success/failure rates
- API throttling incidents

### Common Issues

1. **Report not processing**
   - Check DynamoDB Stream is enabled
   - Verify status changed to "completed"
   - Check SQS for stuck messages

2. **Processing failures**
   - Check CloudWatch logs for errors
   - Verify API keys in Secrets Manager
   - Check rate limiting errors

3. **Missing summaries**
   - Verify DynamoDB update permissions
   - Check requestId vs reportId mapping
   - Ensure scan operation finds record

4. **CloudWatch logging errors**
   - Non-critical error that doesn't affect processing
   - Fixed by removing CloudWatch SDK dependency
   - All logs now use console.log/console.error

5. **Claude API rate limiting**
   - Automatic retry with exponential backoff (2s, 4s, 8s)
   - Detects ThrottlingException and 429 status codes
   - Adds jitter to prevent thundering herd
   - Max wait time capped at 30 seconds

## Testing

### Integration Test Script
```bash
./test-integration.sh
```
- Creates test report
- Triggers status change
- Verifies processing pipeline
- Checks all components

### Direct Processor Test
```bash
./test-direct-processor.sh
```
- Bypasses queue/stream
- Tests report processor directly
- Useful for debugging

## Deployment

### Prerequisites
- AWS SAM CLI installed
- Correct AWS profile configured
- Secrets in AWS Secrets Manager:
  - `anthropic_key`
  - `openai_key`
  - `perplexity-key`

### Deploy Command
```bash
cd infrastructure
./deploy.sh
```

### Post-Deployment Verification
1. Check stack status: `UPDATE_COMPLETE`
2. Verify DynamoDB Streams enabled
3. Check SQS queue created
4. Test with sample research request

## Future Improvements

1. **Batch Processing**
   - Process multiple reports in single Lambda invocation
   - Reduce API calls and costs

2. **Caching**
   - Cache common prompts
   - Store frequently used summaries

3. **Custom Models**
   - Fine-tune models for specific team types
   - Improve summary quality

4. **Real-time Updates**
   - WebSocket notifications
   - Live progress tracking

5. **Advanced Analytics**
   - Processing time trends
   - Summary quality metrics
   - User satisfaction tracking