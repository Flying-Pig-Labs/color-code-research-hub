#!/bin/bash

# Deployment Validation Script for Color Code Research Hub
# Validates that all infrastructure components are properly deployed

set -e

# Check for profile override
PROFILE=${AWS_PROFILE:-personal}
REGION=${AWS_REGION:-us-east-1}
STACK_NAME="color-code-research-hub"

echo "🔍 Validating deployment for stack: $STACK_NAME"
echo "📋 Using AWS profile: $PROFILE"
echo "🌍 Using AWS region: $REGION"

# Function to check if a resource exists
check_resource() {
    local resource_type=$1
    local resource_name=$2
    local check_command=$3
    
    echo -n "  Checking $resource_type: $resource_name... "
    if eval "$check_command" >/dev/null 2>&1; then
        echo "✅ Found"
        return 0
    else
        echo "❌ Not found"
        return 1
    fi
}

# Check CloudFormation stack
echo "📚 Validating CloudFormation Stack"
check_resource "Stack" "$STACK_NAME" "aws cloudformation describe-stacks --stack-name $STACK_NAME --profile $PROFILE --region $REGION"

# Get stack outputs
echo "📄 Getting stack outputs..."
OUTPUTS=$(aws cloudformation describe-stacks \
    --stack-name $STACK_NAME \
    --query 'Stacks[0].Outputs' \
    --output json \
    --profile $PROFILE \
    --region $REGION)

API_URL=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue')
BUCKET_NAME=$(echo $OUTPUTS | jq -r '.[] | select(.OutputKey=="ResearchResultsBucketName") | .OutputValue')

echo "  API Gateway URL: $API_URL"
echo "  S3 Bucket: $BUCKET_NAME"

# Check Lambda functions
echo "🔧 Validating Lambda Functions"
FUNCTIONS=(
    "color-code-research-hub-HealthFunction"
    "color-code-research-hub-GitHubReposFunction"
    "color-code-research-hub-StartPlanGenerationFunction"
    "color-code-research-hub-PlanOrchestratorFunction"
    "color-code-research-hub-GetJobStatusFunction"
    "color-code-research-hub-ResearchApiFunction"
    "color-code-research-hub-ReportProcessingFunction"
)

for func in "${FUNCTIONS[@]}"; do
    check_resource "Lambda Function" "$func" "aws lambda get-function --function-name $func --profile $PROFILE --region $REGION"
done

# Check Lambda Layer
echo "🔗 Validating Lambda Layer"
LAYER_NAME="python-dependencies-layer"
check_resource "Lambda Layer" "$LAYER_NAME" "aws lambda list-layer-versions --layer-name $LAYER_NAME --profile $PROFILE --region $REGION"

# Check DynamoDB tables
echo "🗃️  Validating DynamoDB Tables"
TABLES=(
    "PlanGenerationJobs"
    "ResearchReports"
)

for table in "${TABLES[@]}"; do
    check_resource "DynamoDB Table" "$table" "aws dynamodb describe-table --table-name $table --profile $PROFILE --region $REGION"
done

# Check S3 bucket
echo "🪣 Validating S3 Bucket"
if [ "$BUCKET_NAME" != "null" ] && [ -n "$BUCKET_NAME" ]; then
    check_resource "S3 Bucket" "$BUCKET_NAME" "aws s3 ls s3://$BUCKET_NAME --profile $PROFILE --region $REGION"
else
    echo "  ❌ Could not determine S3 bucket name from stack outputs"
fi

# Test API endpoints
echo "🌐 Testing API Endpoints"
if [ "$API_URL" != "null" ] && [ -n "$API_URL" ]; then
    echo -n "  Testing health endpoint... "
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Health check passed (HTTP $HTTP_STATUS)"
    else
        echo "❌ Health check failed (HTTP $HTTP_STATUS)"
    fi
    
    echo -n "  Testing CORS on research endpoint... "
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$API_URL/api/research" || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ CORS check passed (HTTP $HTTP_STATUS)"
    else
        echo "❌ CORS check failed (HTTP $HTTP_STATUS)"
    fi
    
    echo -n "  Testing report processing endpoint... "
    HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS "$API_URL/api/reports/process" || echo "000")
    if [ "$HTTP_STATUS" = "200" ]; then
        echo "✅ Report processing endpoint available (HTTP $HTTP_STATUS)"
    else
        echo "❌ Report processing endpoint not available (HTTP $HTTP_STATUS)"
    fi
else
    echo "  ❌ Could not determine API URL from stack outputs"
fi

# Check secrets (optional - may fail if permissions are restricted)
echo "🔐 Validating Secrets (optional)"
SECRETS=(
    "anthropic_key"
    "github_token"
    "openai_key"
    "perplexity-key"
)

for secret in "${SECRETS[@]}"; do
    echo -n "  Checking secret: $secret... "
    if aws secretsmanager describe-secret --secret-id "$secret" --profile $PROFILE --region $REGION >/dev/null 2>&1; then
        echo "✅ Found"
    else
        echo "⚠️  Not found or no access"
    fi
done

echo ""
echo "✅ Deployment validation complete!"
echo ""
echo "📋 Next steps for development:"
echo "1. Update frontend environment variable:"
echo "   VITE_API_BASE_URL=$API_URL"
echo ""
echo "2. Test the new report processing endpoints:"
echo "   POST $API_URL/api/reports/process"
echo "   POST $API_URL/api/reports/enhance/{reportId}"
echo ""
echo "3. Implement report processing logic in:"
echo "   lambda/handlers/reportProcessor.py"