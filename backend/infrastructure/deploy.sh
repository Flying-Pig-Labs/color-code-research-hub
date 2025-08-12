#!/bin/bash

# Deploy script for Color Code Research Hub
# CRITICAL: Uses MVP AWS profile and account 984906149037 ONLY!

set -e  # Exit on error
set -u  # Exit on undefined variable
set -o pipefail  # Exit on pipe failure

# Enable debug mode if DEBUG is set
if [ "${DEBUG:-}" = "true" ]; then
    set -x  # Print commands as they execute
fi

# CRITICAL: MUST use mvp profile - NEVER personal!
PROFILE=${AWS_PROFILE:-mvp}

echo "==============================================="
echo "🚀 Color Code Research Hub Deployment Script"
echo "==============================================="
echo "📅 Date: $(date)"
echo "👤 Profile: $PROFILE"
echo "🌎 Region: us-east-1"
echo "📦 Stack: color-code-research-hub"
echo "==============================================="

# Verify we're NOT using personal profile
if [ "$PROFILE" = "personal" ]; then
    echo "❌ CRITICAL ERROR: Attempting to use 'personal' profile!"
    echo "This deployment MUST use the 'mvp' profile for account 984906149037"
    echo "Please run with: AWS_PROFILE=mvp ./deploy.sh"
    exit 1
fi

# Set AWS profile and region
export AWS_PROFILE=$PROFILE
export AWS_REGION=us-east-1

# Verify AWS credentials
echo ""
echo "📋 Step 1: Verifying AWS credentials..."
echo "---------------------------------------"

ACCOUNT_INFO=$(aws sts get-caller-identity --profile $PROFILE 2>&1) || {
    echo "❌ Failed to authenticate with AWS profile '$PROFILE'"
    echo "Error details: $ACCOUNT_INFO"
    echo ""
    echo "Please ensure you have configured the '$PROFILE' profile with:"
    echo "  aws configure --profile $PROFILE"
    echo "Or set AWS_PROFILE environment variable to your preferred profile"
    exit 1
}

# Parse account info
ACCOUNT_ID=$(echo "$ACCOUNT_INFO" | jq -r '.Account')
USER_ARN=$(echo "$ACCOUNT_INFO" | jq -r '.Arn')

echo "✅ Successfully authenticated!"
echo "   Account ID: $ACCOUNT_ID"
echo "   User ARN: $USER_ARN"

# Verify it's the correct account
if [ "$ACCOUNT_ID" != "984906149037" ]; then
    echo ""
    echo "❌ CRITICAL ERROR: Wrong AWS account!"
    echo "   Expected: 984906149037"
    echo "   Actual: $ACCOUNT_ID"
    echo ""
    echo "Please switch to the MVP account profile!"
    exit 1
fi

echo "✅ Correct AWS account verified!"

# Navigate to infrastructure directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
echo ""
echo "📁 Step 2: Navigating to infrastructure directory..."
echo "---------------------------------------"
cd "$SCRIPT_DIR"
echo "✅ Current directory: $(pwd)"

# Check if template.yaml exists
if [ ! -f "template.yaml" ]; then
    echo "❌ ERROR: template.yaml not found in current directory!"
    echo "   Please ensure you're running this script from the infrastructure directory"
    exit 1
fi
echo "✅ Found template.yaml"

# Copy canonical prompts into handlers for packaging (build-only)
echo ""
echo "📤 Step 3: Copying prompts into handlers for build..."
echo "---------------------------------------"
"$(dirname "$0")/copy-prompts-for-build.sh"
echo "✅ Prompts copied"

# Build the SAM application with parallel and caching
echo ""
echo "🏗️  Step 4: Building SAM application..."
echo "---------------------------------------"
echo "⚙️  Using parallel build with caching for faster builds"

BUILD_START=$(date +%s)
sam build --parallel --cached 2>&1 | while IFS= read -r line; do
    echo "   BUILD: $line"
done

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ SAM build failed!"
    exit 1
fi

BUILD_END=$(date +%s)
BUILD_DURATION=$((BUILD_END - BUILD_START))
echo "✅ Build completed successfully in ${BUILD_DURATION} seconds!"

# Deploy the SAM application
echo ""
echo "🚀 Step 5: Deploying SAM application..."
echo "---------------------------------------"
echo "⚙️  Stack: color-code-research-hub"
echo "⚙️  Region: us-east-1"
echo "⚙️  Profile: $PROFILE"
echo ""

DEPLOY_START=$(date +%s)
sam deploy \
    --profile $PROFILE \
    --stack-name color-code-research-hub \
    --capabilities CAPABILITY_IAM \
    --resolve-s3 \
    --no-confirm-changeset \
    --region us-east-1 \
    --parameter-overrides \
        Environment=production \
        GitHubOrg=Flying-Pig-Labs \
        ClientCompanyName="Your Company" 2>&1 | while IFS= read -r line; do
    echo "   DEPLOY: $line"
done

if [ ${PIPESTATUS[0]} -ne 0 ]; then
    echo "❌ SAM deploy failed!"
    exit 1
fi

DEPLOY_END=$(date +%s)
DEPLOY_DURATION=$((DEPLOY_END - DEPLOY_START))

echo "✅ Deployment completed successfully in ${DEPLOY_DURATION} seconds!"

# Get the API Gateway URL and other outputs
echo ""
echo "📊 Step 6: Retrieving stack outputs..."
echo "---------------------------------------"

STACK_INFO=$(aws cloudformation describe-stacks \
    --stack-name color-code-research-hub \
    --profile $PROFILE \
    --region us-east-1 2>&1)

if [ $? -ne 0 ]; then
    echo "❌ Failed to retrieve stack information!"
    echo "Error: $STACK_INFO"
    exit 1
fi

# Extract outputs
API_URL=$(echo "$STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="ApiGatewayUrl") | .OutputValue')
REPORT_PROCESSING_ARN=$(echo "$STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="ReportProcessingFunctionArn") | .OutputValue')
RESEARCH_BUCKET=$(echo "$STACK_INFO" | jq -r '.Stacks[0].Outputs[] | select(.OutputKey=="ResearchBucketName") | .OutputValue')

echo "✅ Stack outputs retrieved successfully!"
echo ""
echo "==============================================="
echo "🎉 DEPLOYMENT SUMMARY"
echo "==============================================="
echo "⏱️  Total deployment time: $((BUILD_DURATION + DEPLOY_DURATION)) seconds"
echo "    - Build time: ${BUILD_DURATION}s"
echo "    - Deploy time: ${DEPLOY_DURATION}s"
echo ""
echo "🌐 API Gateway URL: $API_URL"
echo "📦 Research Bucket: $RESEARCH_BUCKET"
echo "⚡ Report Processor: ${REPORT_PROCESSING_ARN##*/}"
echo ""
echo "==============================================="
echo "📝 NEXT STEPS"
echo "==============================================="
echo ""
echo "1️⃣  Update your frontend .env.local file with:"
echo "    VITE_API_BASE_URL=$API_URL"
echo ""
echo "2️⃣  Verify the following secrets exist in Secrets Manager:"
echo "    ✓ github_token"
echo "    ✓ anthropic_key" 
echo "    ✓ openai_key"
echo "    ✓ perplexity-key"
echo ""
echo "3️⃣  To test the report processing integration:"
echo "    - Submit a research request through the frontend"
echo "    - Monitor CloudWatch Logs for the ResearchApiFunction"
echo "    - Check that ReportProcessingFunction is invoked"
echo "    - Verify processed summaries appear in DynamoDB"
echo ""
echo "4️⃣  To enable debug logging, run:"
echo "    DEBUG=true ./deploy.sh"
echo ""
echo "==============================================="
echo "✨ Deployment completed at $(date)"
echo "==============================================="