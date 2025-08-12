# Code Audit Report - Color Code Research Hub

## Audit Scope
Reviewing research flow Lambda functions against requirements.

## 1. ResearchApiFunction (researchApi.py)

### What it SHOULD do:
- Submit to Perplexity async API
- Store request in S3
- Create DynamoDB record (status="processing")
- Return immediately

### What it ACTUALLY does:
❌ **CRITICAL ISSUE**: Lines 500-655 - Function polls Perplexity for up to 15 minutes
✓ Creates DynamoDB record with status="processing"
✓ Stores files in S3 (but only after polling completes)
✓ Has proper CORS headers

**Verdict**: BROKEN - Will timeout due to synchronous polling

## 2. ResearchStreamProcessorFunction (researchStreamProcessor.js)

### What it SHOULD do:
- Trigger on DynamoDB records with status="processing"
- Poll Perplexity for completion
- Update DynamoDB when complete
- Send to SQS for post-processing

### What it ACTUALLY does (after my recent edit):
✓ Triggers on DynamoDB stream
✓ Polls Perplexity API
✓ Updates DynamoDB with results
✓ Sends to SQS when complete
❓ **ISSUE**: Looking for wrong event trigger (needs verification)

**Verdict**: MOSTLY CORRECT after recent changes

## 3. ReportProcessingFunction (reportProcessor.js)

### What it SHOULD do:
- Receive from SQS
- Call report-processing-service for 2 LLM calls
- Store summary.txt and report.md
- Update DynamoDB

### What it ACTUALLY does:
✓ Triggered by SQS
✓ Calls report-processing-service
✓ Handles new unified S3 structure
✓ Updates DynamoDB with processedSummary

**Verdict**: CORRECT

## 4. report-processing-service.js

### What it SHOULD do:
- Make 2 separate Claude API calls
- Generate 120-word summary
- Format report as markdown (NO summarization)

### What it ACTUALLY does:
✓ Makes 2 separate API calls (generateSummary + formatReport)
✓ Has specific prompts for each task
✓ Stores files in correct S3 structure
✓ Enhanced markdown formatting guidelines

**Verdict**: CORRECT

## 5. GetReportFunction (getReportHandler.js)

### What it SHOULD do:
- Fetch report from DynamoDB
- Return markdown content
- Handle both old and new S3 structures

### What it ACTUALLY does:
✓ Reads from DynamoDB
✓ Handles new S3 structure (s3ReportKey)
✓ Returns proper content type
✓ CORS headers included

**Verdict**: CORRECT

## Critical Integration Points

### DynamoDB Status Flow:
Current: `processing → pending_postprocessing → completed`
This is CORRECT.

### S3 Structure:
Current: `users/{username}/research/{team}/{research-id}/`
This is CORRECT.

### API Response:
ResearchApiFunction returns research_id immediately (after fixing polling issue)
This is CORRECT pattern.

## Summary of Issues

1. **CRITICAL**: ResearchApiFunction is polling instead of returning immediately
2. **UNKNOWN**: ResearchStreamProcessor trigger condition may need adjustment
3. **MINOR**: Error handling could be improved across all functions

## Files That Need Fixing:
1. `/lambda/handlers/researchApi.py` - Remove polling loop (lines 500-655)
2. Possibly `/lambda/handlers/researchStreamProcessor.js` - Verify trigger condition