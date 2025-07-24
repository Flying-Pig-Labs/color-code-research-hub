#!/bin/bash

# AWS Amplify Deployment Script for Color Code Research Hub
# This script deploys the application to AWS using your personal profile

set -e  # Exit on error

echo "🚀 Starting AWS Amplify Deployment..."

# Use personal AWS profile
export AWS_PROFILE=personal

# Check if AWS CLI is configured
echo "✅ Checking AWS CLI configuration..."
aws sts get-caller-identity --profile personal

# Step 1: Deploy Lambda functions using SAM
echo "📦 Deploying Lambda functions..."
cd infrastructure

# Build the SAM application
sam build

# Deploy with guided prompts on first run
sam deploy --guided \
  --profile personal \
  --stack-name color-code-research-hub-backend \
  --parameter-overrides \
    SQSQueueURL=https://sqs.us-east-1.amazonaws.com/418272766513/tempLocalToEc2-1753059239 \
  --capabilities CAPABILITY_IAM

# Get the API Gateway URL from the stack outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name color-code-research-hub-backend \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiUrl`].OutputValue' \
  --output text \
  --profile personal)

echo "✅ API Gateway deployed at: $API_URL"

cd ..

# Step 2: Create Secrets in AWS Secrets Manager
echo "🔐 Creating secrets in AWS Secrets Manager..."

# Store GitHub token (replace with your actual token)
aws secretsmanager create-secret \
  --name color-code-research-hub/github-token \
  --secret-string '{"token":"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"}' \
  --profile personal || echo "Secret already exists"

# Store API keys if needed
aws secretsmanager create-secret \
  --name color-code-research-hub/api-keys \
  --secret-string '{"internalApiKey":"your-secure-api-key"}' \
  --profile personal || echo "Secret already exists"

# Step 3: Initialize Amplify App
echo "🌐 Creating Amplify App..."

# Create the Amplify app
AMPLIFY_APP_ID=$(aws amplify create-app \
  --name color-code-research-hub \
  --platform WEB \
  --profile personal \
  --query 'app.appId' \
  --output text)

echo "✅ Amplify App created with ID: $AMPLIFY_APP_ID"

# Step 4: Connect GitHub repository
echo "📁 Connecting GitHub repository..."

# Update Amplify app with GitHub repository
aws amplify update-app \
  --app-id $AMPLIFY_APP_ID \
  --repository https://github.com/yourusername/color-code-research-hub \
  --profile personal

# Step 5: Set environment variables in Amplify
echo "🔧 Setting environment variables..."

aws amplify update-branch \
  --app-id $AMPLIFY_APP_ID \
  --branch-name main \
  --environment-variables \
    VITE_API_URL=$API_URL \
    VITE_GITHUB_TOKEN_SECRET_NAME=color-code-research-hub/github-token \
    VITE_ENABLE_AUTH=false \
  --profile personal

# Step 6: Create Amplify branch and start deployment
echo "🏗️ Creating main branch and starting deployment..."

aws amplify create-branch \
  --app-id $AMPLIFY_APP_ID \
  --branch-name main \
  --profile personal

# Start the build
BUILD_ID=$(aws amplify start-job \
  --app-id $AMPLIFY_APP_ID \
  --branch-name main \
  --job-type RELEASE \
  --profile personal \
  --query 'jobSummary.jobId' \
  --output text)

echo "✅ Build started with ID: $BUILD_ID"

# Step 7: Get the Amplify app URL
AMPLIFY_URL="https://main.${AMPLIFY_APP_ID}.amplifyapp.com"
echo "🌐 Your app will be available at: $AMPLIFY_URL"

# Step 8: Monitor the build
echo "📊 Monitoring build progress..."
echo "You can check the build status with:"
echo "aws amplify get-job --app-id $AMPLIFY_APP_ID --branch-name main --job-id $BUILD_ID --profile personal"

# Save deployment info
cat > deployment-info.json << EOF
{
  "amplifyAppId": "$AMPLIFY_APP_ID",
  "amplifyUrl": "$AMPLIFY_URL",
  "apiGatewayUrl": "$API_URL",
  "buildId": "$BUILD_ID",
  "deploymentDate": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF

echo "✅ Deployment information saved to deployment-info.json"
echo ""
echo "🎉 Deployment initiated successfully!"
echo ""
echo "Next steps:"
echo "1. Monitor the build in the AWS Amplify Console"
echo "2. Update your GitHub repository settings to point to this deployment"
echo "3. Test the API endpoints at $API_URL"
echo "4. Access your app at $AMPLIFY_URL once the build completes"