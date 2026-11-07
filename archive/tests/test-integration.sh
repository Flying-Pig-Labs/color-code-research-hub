#!/bin/bash

# Integration Test for DynamoDB Streams → SQS → Lambda Pipeline
# This script tests the complete post-processing flow

set -e

PROFILE="mvp"
REGION="us-east-1"
TABLE_NAME="ResearchReports"
QUEUE_URL="https://sqs.us-east-1.amazonaws.com/984906149037/color-code-research-hub-ReportProcessingQueue"
TEST_REPORT_ID="TEST-$(uuidv4 || echo $RANDOM)"

echo "🚀 Starting Integration Test for Report Processing Pipeline"
echo "==========================================================="
echo "Test Report ID: $TEST_REPORT_ID"
echo ""

# Function to check queue messages
check_queue() {
    local msg_count=$(aws sqs get-queue-attributes \
        --queue-url "$QUEUE_URL" \
        --attribute-names ApproximateNumberOfMessages \
        --profile $PROFILE \
        --region $REGION \
        --query 'Attributes.ApproximateNumberOfMessages' \
        --output text)
    echo "$msg_count"
}

# Function to check if report is processed
check_processed() {
    local report_id=$1
    aws dynamodb get-item \
        --table-name "$TABLE_NAME" \
        --key "{\"reportId\": {\"S\": \"$report_id\"}}" \
        --profile $PROFILE \
        --region $REGION \
        --query 'Item.processedSummary.S' \
        --output text 2>/dev/null || echo "NULL"
}

echo "📊 Step 1: Checking initial queue state..."
INITIAL_QUEUE_COUNT=$(check_queue)
echo "   Initial messages in queue: $INITIAL_QUEUE_COUNT"
echo ""

echo "📝 Step 2: Creating test report with status 'pending'..."
aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --item "{
        \"reportId\": {\"S\": \"$TEST_REPORT_ID\"},
        \"requestId\": {\"S\": \"$TEST_REPORT_ID\"},
        \"team\": {\"S\": \"red\"},
        \"status\": {\"S\": \"pending\"},
        \"title\": {\"S\": \"Integration Test Report\"},
        \"prompt\": {\"S\": \"Test the processing pipeline\"},
        \"content\": {\"S\": \"# Test Report\\n\\nThis is a test to verify the processing pipeline.\"},
        \"createdAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
        \"requester\": {\"S\": \"integration-test\"}
    }" \
    --profile $PROFILE \
    --region $REGION

echo "   ✅ Created report: $TEST_REPORT_ID"
echo ""

echo "⏱️  Step 3: Waiting 5 seconds to ensure no processing happens..."
sleep 5

PENDING_QUEUE_COUNT=$(check_queue)
echo "   Messages in queue after pending: $PENDING_QUEUE_COUNT"

if [ "$PENDING_QUEUE_COUNT" -gt "$INITIAL_QUEUE_COUNT" ]; then
    echo "   ❌ ERROR: Message sent to queue while status is pending!"
else
    echo "   ✅ Good: No message sent while status is pending"
fi
echo ""

echo "🔄 Step 4: Updating report status to 'completed'..."
aws dynamodb put-item \
    --table-name "$TABLE_NAME" \
    --item "{
        \"reportId\": {\"S\": \"$TEST_REPORT_ID\"},
        \"requestId\": {\"S\": \"$TEST_REPORT_ID\"},
        \"team\": {\"S\": \"red\"},
        \"status\": {\"S\": \"completed\"},
        \"title\": {\"S\": \"Integration Test Report\"},
        \"prompt\": {\"S\": \"Test the processing pipeline\"},
        \"content\": {\"S\": \"# Test Report\\n\\nThis is a test to verify the processing pipeline.\\n\\n## Key Findings\\n1. System is working\\n2. Pipeline is functional\\n\\n## Recommendations\\n- Continue monitoring\\n- Verify all components\"},
        \"createdAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
        \"completedAt\": {\"S\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"},
        \"requester\": {\"S\": \"integration-test\"}
    }" \
    --profile $PROFILE \
    --region $REGION

echo "   ✅ Updated status to completed"
echo ""

echo "📬 Step 5: Checking if message appears in SQS queue..."
sleep 3

AFTER_QUEUE_COUNT=$(check_queue)
echo "   Messages in queue after completion: $AFTER_QUEUE_COUNT"

if [ "$AFTER_QUEUE_COUNT" -gt "$INITIAL_QUEUE_COUNT" ]; then
    echo "   ✅ Message sent to queue!"
else
    echo "   ⚠️  No new messages in queue (might already be processed)"
fi
echo ""

echo "🔍 Step 6: Waiting for report processing (up to 60 seconds)..."
PROCESSED="NULL"
WAIT_TIME=0

while [ "$PROCESSED" = "NULL" ] && [ $WAIT_TIME -lt 60 ]; do
    sleep 3
    WAIT_TIME=$((WAIT_TIME + 3))
    PROCESSED=$(check_processed "$TEST_REPORT_ID")
    if [ "$PROCESSED" = "NULL" ]; then
        echo -n "."
    fi
done

echo ""
echo ""

if [ "$PROCESSED" != "NULL" ]; then
    echo "🎉 Integration Test PASSED!"
    echo ""
    echo "Processed Report Details:"
    echo "   Report ID: $TEST_REPORT_ID"
    echo "   Summary: ${PROCESSED:0:100}..."
    
    # Get full report details
    echo ""
    echo "Full report item from DynamoDB:"
    aws dynamodb get-item \
        --table-name "$TABLE_NAME" \
        --key "{\"reportId\": {\"S\": \"$TEST_REPORT_ID\"}}" \
        --profile $PROFILE \
        --region $REGION \
        --query 'Item.{Status:status.S,ProcessedAt:processedAt.S,WordCount:summaryWordCount.N,S3Key:fullReportS3Key.S}' \
        --output table
else
    echo "❌ Integration Test FAILED - Report not processed"
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Check CloudWatch logs for ResearchStreamProcessorFunction:"
    echo "   aws logs tail /aws/lambda/color-code-research-hub-ResearchStreamProcessorFun-zA44Hsf6hC5y --profile $PROFILE --region $REGION --since 5m"
    echo ""
    echo "2. Check CloudWatch logs for ReportProcessingFunction:"
    echo "   aws logs tail /aws/lambda/color-code-research-hub-ReportProcessingFunction-HaCSag5t4t7Y --profile $PROFILE --region $REGION --since 5m"
    echo ""
    echo "3. Check Dead Letter Queue:"
    echo "   aws sqs receive-message --queue-url https://sqs.us-east-1.amazonaws.com/984906149037/color-code-research-hub-ReportProcessingDLQ --profile $PROFILE --region $REGION"
fi

echo ""
echo "🧹 Test report left in DynamoDB for inspection: $TEST_REPORT_ID"