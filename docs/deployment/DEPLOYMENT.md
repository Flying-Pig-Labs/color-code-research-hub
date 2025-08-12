# Color Code Research Hub - Deployment Guide

This guide provides information about the automated deployment setup for the Color Code Research Hub application.

## Prerequisites

- AWS CLI configured with `personal` profile
- SAM CLI installed (for infrastructure changes only)
- Node.js 18.x or higher
- Git configured with GitHub access

## Architecture Overview

The application consists of:
- **Frontend**: React application deployed to AWS Amplify (auto-deploy on push)
- **Backend**: Lambda functions deployed via SAM
- **API**: API Gateway managed by SAM

## 🚀 Automated Deployment

### Frontend & Code Changes

The application is configured with **automatic deployment**:

1. Make your changes
2. Commit with a descriptive message:
   ```bash
   git add .
   git commit -m "Your descriptive commit message"
   ```
3. Push to main branch:
   ```bash
   git push origin main
   ```

**Amplify automatically**:
- Detects the push to main branch
- Builds the React application
- Deploys to the configured domain
- Process takes 3-5 minutes

### Backend Infrastructure Changes

Only needed when modifying Lambda functions or SAM template:

```bash
cd infrastructure
sam build
sam deploy --profile personal --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1
```

## Environment Configuration

### API Gateway URL
After SAM deployment, note the API Gateway URL from the output:
```
ApiGatewayUrl: https://[api-id].execute-api.us-east-1.amazonaws.com/production
```

Update `.env.production` with this URL:
```
VITE_API_URL=https://[api-id].execute-api.us-east-1.amazonaws.com/production
```

### Secrets Configuration
The application uses AWS Secrets Manager for:
- GitHub Personal Access Token: `arn:aws:secretsmanager:us-east-1:984906149037:secret:github/personal_token-7lbje4`
- Anthropic API Key: Stored in stack secrets

## Deployment Verification

### Automated Validation Script
Use the comprehensive validation script to check all infrastructure components:

```bash
cd infrastructure
./validate-deployment.sh
```

This script validates:
- CloudFormation stack status
- All Lambda functions
- Lambda layer deployment
- DynamoDB tables
- S3 bucket
- API endpoints (health checks)
- Secrets Manager secrets (optional)

### Manual Verification Steps

#### 1. Check Lambda Functions
```bash
aws lambda list-functions --profile personal --region us-east-1 | grep color-code
```

#### 2. Check API Gateway
```bash
aws apigateway get-rest-apis --profile personal --region us-east-1
```

#### 3. Check New Report Processing Function
```bash
aws lambda get-function --function-name color-code-research-hub-ReportProcessingFunction --profile personal --region us-east-1
```

#### 4. Check Python Dependencies Layer
```bash
aws lambda list-layer-versions --layer-name python-dependencies-layer --profile personal --region us-east-1
```

#### 5. Test Report Processing Endpoints
```bash
# Test CORS preflight
curl -X OPTIONS https://[API-ID].execute-api.us-east-1.amazonaws.com/production/api/reports/process

# Test basic endpoint availability (should return method not allowed or similar)
curl -X GET https://[API-ID].execute-api.us-east-1.amazonaws.com/production/api/reports/process
```

#### 6. Check Amplify Status
Visit the AWS Amplify console to monitor deployment progress.

## Common Issues

### Large File Push Errors
If git push fails due to large files:
1. Check for accidentally included directories (node_modules, .aws-sam)
2. Update .gitignore
3. Use `git rm --cached <directory>` to remove from index

### CORS Errors
Ensure Lambda responses include proper CORS headers:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};
```

### Authentication Errors
Verify secrets are accessible:
```bash
aws secretsmanager get-secret-value --secret-id github/personal_token-7lbje4 --profile personal --region us-east-1
```

### Report Processing Issues

#### Lambda Layer Build Failures
If the Python dependencies layer fails to build:
1. Check that SAM CLI version supports Python 3.11
2. Verify the layer directory structure:
   ```
   layers/python-dependencies/
   ├── requirements.txt
   └── README.md
   ```
3. Ensure requirements.txt has valid package specifications

#### Report Processing Function Errors
Check CloudWatch logs for the report processing function:
```bash
aws logs tail /aws/lambda/color-code-research-hub-ReportProcessingFunction --profile personal --region us-east-1 --since 5m
```

#### Missing Dependencies
If imports fail in the Lambda function:
1. Verify the layer is properly attached to the function
2. Check that the layer contains the required packages
3. Ensure Python version compatibility (3.11)

#### API Gateway Timeouts
For long-running report processing:
1. Consider using async processing pattern (like plan generation)
2. Increase Lambda timeout (currently set to 900s/15min)
3. Monitor memory usage and adjust if needed (currently 3008MB)

## Rollback Procedures

### Backend Rollback
```bash
aws cloudformation rollback-stack --stack-name color-code-research-hub --profile personal --region us-east-1
```

### Frontend Rollback
Use Amplify console to redeploy a previous build.

## Monitoring

- **CloudWatch Logs**: Monitor Lambda execution
- **API Gateway Logs**: Track API requests
- **Amplify Console**: Monitor frontend deployments

## Security Notes

- Never commit secrets to the repository
- Use AWS Secrets Manager for all sensitive data
- Ensure proper IAM roles and permissions
- Review CORS settings for production use

## Claude Flow Research Integration

### New Lambda Function
The deployment now includes a Research Proxy Lambda function that:
- Routes requests to EC2 Claude Flow service (18.209.36.58:8080)
- Retrieves API key from AWS Secrets Manager
- Handles CORS and private network access issues

### API Gateway Routes
New routes added for Claude Flow integration:
- `POST /api/claude-flow/research` - Submit research requests
- `GET /api/claude-flow/execution/{request_id}` - Check execution status
- `GET /api/claude-flow/executions` - List all executions

### Secrets Manager
- **Secret Name**: `claude-flow-research-api-key`
- **Purpose**: API key for authenticating with EC2 Claude Flow service
- **Access**: ResearchProxyFunction has permission to retrieve this secret

## Report Processing Infrastructure (NEW)

### Report Processing Function
A new Lambda function has been added for enhanced research report processing:
- **Function**: `ReportProcessingFunction`
- **Runtime**: Python 3.11
- **Timeout**: 900 seconds (15 minutes)
- **Memory**: 3008 MB
- **Purpose**: Post-process research reports with enhanced formatting, structure, and analysis

### Python Dependencies Layer
A new Lambda layer provides shared Python libraries:
- **Layer**: `PythonDependenciesLayer`
- **Dependencies**: markdown, bleach, beautifulsoup4, lxml, requests, boto3
- **Purpose**: Shared dependencies for Python-based Lambda functions

### New API Endpoints
- `POST /api/reports/process` - Process and enhance raw research reports
- `POST /api/reports/enhance/{reportId}` - Enhance existing reports with additional analysis
- All endpoints include proper CORS support with OPTIONS methods

### Deployment Profile
**Important**: Use the `personal` profile for deployments (as per CLAUDE.md):
```bash
# Using the deployment script (recommended)
cd infrastructure
./deploy.sh

# Or manually with personal profile
sam deploy --profile personal --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1

# Override profile if needed
AWS_PROFILE=mvp ./deploy.sh
```