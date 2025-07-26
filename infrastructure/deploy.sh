#!/bin/bash

# Deploy script for Color Code Research Hub
# Uses mvp AWS profile and account 984906149037

set -e

echo "🚀 Starting deployment to AWS account 984906149037 with profile 'mvp'"

# Set AWS profile
export AWS_PROFILE=mvp
export AWS_REGION=us-east-1

# Verify AWS credentials
echo "📋 Checking AWS credentials..."
aws sts get-caller-identity --profile mvp || {
    echo "❌ Failed to authenticate with AWS profile 'mvp'"
    echo "Please ensure you have configured the 'mvp' profile with:"
    echo "  aws configure --profile mvp"
    exit 1
}

# Navigate to infrastructure directory
cd "$(dirname "$0")"

# Build the SAM application
echo "🏗️  Building SAM application..."
sam build

# Deploy the SAM application
echo "🚀 Deploying SAM application..."
sam deploy \
    --profile mvp \
    --stack-name color-code-research-hub \
    --capabilities CAPABILITY_IAM \
    --resolve-s3 \
    --no-confirm-changeset \
    --region us-east-1 \
    --parameter-overrides \
        Environment=production \
        GitHubOrg=mvp-builder-app \
        ClientCompanyName="MVP Builder"

echo "✅ Deployment complete!"

# Get the API Gateway URL
API_URL=$(aws cloudformation describe-stacks \
    --stack-name color-code-research-hub \
    --query 'Stacks[0].Outputs[?OutputKey==`ApiGatewayUrl`].OutputValue' \
    --output text \
    --profile mvp \
    --region us-east-1)

echo ""
echo "🌐 API Gateway URL: $API_URL"
echo ""
echo "📝 Next steps:"
echo "1. Update your frontend .env.local file with:"
echo "   VITE_API_BASE_URL=$API_URL"
echo "2. Ensure the following secrets exist in Secrets Manager:"
echo "   - github_token (ARN: arn:aws:secretsmanager:us-east-1:984906149037:secret:github_token-sIuriy)"
echo "   - batch-job-queue-arn (ARN: arn:aws:secretsmanager:us-east-1:984906149037:secret:batch-job-queue-arn-a18jG3)"
echo "   - anthropic_key (ARN: arn:aws:secretsmanager:us-east-1:984906149037:secret:anthropic_key-47iAE6)"
echo "   - openai_key (ARN: arn:aws:secretsmanager:us-east-1:984906149037:secret:openai_key-PkoBXY)"
echo "3. Ensure AWS Batch job definition 'mvp-backlog-generator:1' exists"
echo "4. Ensure S3 bucket 'mvp-codegen-bucket' exists and has proper permissions"