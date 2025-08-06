# Post-Processing Fix Documentation

## Problem Statement
Users are getting raw Perplexity JSON when downloading research reports instead of formatted reports with AI summaries. The ReportProcessingFunction exists but is not being triggered.

## Current Architecture Issues

### What's Happening Now:
1. User submits research request via frontend
2. ResearchApiFunction creates async Perplexity job and returns job ID
3. Frontend polls `/api/research/status/{job_id}` every 10 seconds
4. Status endpoint checks Perplexity and updates DynamoDB when complete
5. Status endpoint uploads raw content to S3 at `users/{user_id}/research/{research_id}/response.json`
6. **MISSING**: ReportProcessingFunction never runs
7. User downloads raw Perplexity JSON

### Why Post-Processing Isn't Running:
1. **No S3 Event Trigger**: ReportProcessingFunction has no S3 event configuration
2. **No Direct Invocation**: Status endpoint doesn't invoke the report processor
3. **Architecture Mismatch**: REPORT_PROCESSOR_ARCHITECTURE.md expects files in `raw/` prefix, but code uploads to `users/.../response.json`

## Recommended Solution

### Option 1: Direct Lambda Invocation (Simplest)
Modify the status endpoint to invoke ReportProcessingFunction when job completes:

1. Add a `reportProcessorInvoked` flag to DynamoDB to prevent duplicate invocations
2. When status changes from "pending" to "completed", invoke report processor
3. Update the flag to ensure it only runs once per job

**Pros**: Simple, no infrastructure changes needed
**Cons**: Risk of duplicate invocations if not carefully managed

### Option 2: DynamoDB Streams (Most Reliable)
Use DynamoDB Streams to trigger processing:

1. Enable DynamoDB Streams on ResearchReports table
2. Configure ReportProcessingFunction to trigger on stream events
3. Filter for status changes from "pending" to "completed"

**Pros**: Guaranteed single execution, event-driven
**Cons**: Requires infrastructure changes

### Option 3: Step Functions (Most Robust)
Replace polling pattern with Step Functions:

1. API Gateway triggers Step Function
2. Step Function polls Perplexity for up to 15 minutes
3. On completion, Step Function invokes report processor
4. Single orchestrated workflow

**Pros**: No polling from frontend, guaranteed execution order
**Cons**: Major architecture change

## Implementation Notes

### For Any Solution:
1. ReportProcessingFunction expects specific input format (see reportProcessor.js)
2. Must pass: reportId, rawContent, team, objective, metadata
3. Report processor generates 5 artifacts and AI summary
4. Updates DynamoDB with processed summary

### Current Environment Variables:
- ResearchApiFunction has `REPORT_PROCESSING_FUNCTION_NAME` configured
- ReportProcessingFunction needs access to S3 and DynamoDB
- Both functions share the same S3 bucket and DynamoDB table

## Quick Fix (Temporary)

For immediate relief, manually invoke report processor for existing reports:
```bash
aws lambda invoke \
  --function-name color-code-research-hub-ReportProcessingFunction-[suffix] \
  --payload '{"reportId":"[id]","rawContent":"[content]","team":"[team]","objective":"[task]","metadata":{}}' \
  response.json
```

## Testing
After implementing fix:
1. Submit new research request
2. Wait for completion
3. Check DynamoDB for `processedSummary` field
4. Verify download provides formatted report, not raw JSON