#!/bin/bash

# Direct test of the ReportProcessingFunction
# This bypasses the stream/queue and tests the processor directly

set -e

PROFILE="mvp"
REGION="us-east-1"
FUNCTION_NAME="color-code-research-hub-ReportProcessingFunction-HaCSag5t4t7Y"
TEST_REPORT_ID="DIRECT-TEST-$RANDOM"

echo "🚀 Direct Test of ReportProcessingFunction"
echo "=========================================="
echo "Test Report ID: $TEST_REPORT_ID"
echo ""

# Create test payload
PAYLOAD=$(cat <<EOF
{
  "reportId": "$TEST_REPORT_ID",
  "rawContent": "# Test Research Report\\n\\nThis is a comprehensive test of the report processing pipeline.\\n\\n## Executive Summary\\nThe system appears to be functioning correctly with all components operational.\\n\\n## Key Findings\\n1. DynamoDB Streams are triggering as expected\\n2. SQS is receiving and queuing messages\\n3. Lambda functions are being invoked\\n4. Processing pipeline is operational\\n\\n## Technical Analysis\\n### Infrastructure Status\\n- AWS Lambda: Operational\\n- DynamoDB: Functioning normally\\n- SQS: Message flow confirmed\\n- S3: Storage accessible\\n\\n### Performance Metrics\\n- Stream processing latency: <1s\\n- Queue delivery: Confirmed\\n- Lambda cold start: ~700ms\\n\\n## Recommendations\\n1. Continue monitoring system performance\\n2. Implement CloudWatch alarms for failures\\n3. Add integration tests to CI/CD pipeline\\n4. Document the processing flow\\n\\n## Conclusion\\nThe report processing pipeline is working as designed.",
  "team": "red",
  "objective": "Test the direct invocation of report processing",
  "metadata": {
    "title": "Direct Integration Test Report",
    "requester": "direct-test",
    "vendorName": "test",
    "companyName": "Test Company",
    "model": "test-model",
    "createdAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  }
}
EOF
)

echo "📤 Invoking ReportProcessingFunction directly..."
echo ""

# Invoke the function
RESPONSE=$(aws lambda invoke \
    --function-name "$FUNCTION_NAME" \
    --payload "$(echo $PAYLOAD | base64)" \
    --profile $PROFILE \
    --region $REGION \
    /tmp/lambda-response.json 2>&1)

echo "Lambda invocation response:"
echo "$RESPONSE"
echo ""

# Check the response
if [ -f /tmp/lambda-response.json ]; then
    echo "📥 Lambda function response:"
    cat /tmp/lambda-response.json | jq '.'
    echo ""
    
    # Check if it was successful
    SUCCESS=$(cat /tmp/lambda-response.json | jq -r '.success // false')
    
    if [ "$SUCCESS" = "true" ]; then
        echo "✅ Direct invocation succeeded!"
        
        # Wait a bit for DynamoDB update
        sleep 2
        
        # Check DynamoDB for the summary
        echo ""
        echo "📊 Checking DynamoDB for processed summary..."
        SUMMARY=$(aws dynamodb scan \
            --table-name ResearchReports \
            --filter-expression "requestId = :rid" \
            --expression-attribute-values "{\":rid\":{\"S\":\"$TEST_REPORT_ID\"}}" \
            --profile $PROFILE \
            --region $REGION \
            --query 'Items[0].processedSummary.S' \
            --output text 2>/dev/null || echo "NULL")
        
        if [ "$SUMMARY" != "NULL" ] && [ "$SUMMARY" != "None" ]; then
            echo "✅ Summary found in DynamoDB:"
            echo "$SUMMARY" | head -3
            echo "..."
        else
            echo "⚠️  No summary found in DynamoDB yet"
        fi
    else
        echo "❌ Direct invocation failed!"
        echo "Error details:"
        cat /tmp/lambda-response.json | jq -r '.error // .errorMessage // "Unknown error"'
    fi
else
    echo "❌ No response file created"
fi

echo ""
echo "🔍 To check CloudWatch logs for this invocation:"
echo "aws logs tail $FUNCTION_NAME --profile $PROFILE --region $REGION --since 5m | grep '$TEST_REPORT_ID'"

# Cleanup
rm -f /tmp/lambda-response.json