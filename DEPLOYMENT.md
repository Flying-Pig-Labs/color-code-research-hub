# Color Code Research Hub - Deployment Guide

This guide provides step-by-step instructions for deploying the Color Code Research Hub application.

## Prerequisites

- AWS CLI configured with `personal` profile
- SAM CLI installed
- Node.js 18.x or higher
- Git configured with GitHub access

## Architecture Overview

The application consists of:
- **Frontend**: React application deployed to AWS Amplify
- **Backend**: Lambda functions deployed via SAM
- **API**: API Gateway managed by SAM

## Deployment Steps

### 1. Backend Deployment (Lambda Functions)

Deploy all Lambda functions and API Gateway:

```bash
cd /Users/williamprior/Development/GitHub/color-code-research-hub/infrastructure
sam build
sam deploy --profile personal --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1
```

This deploys:
- Health check endpoint
- GitHub repository endpoints
- Plan generation endpoints (v1 and v2)
- SQS submission endpoint

### 2. Frontend Deployment (Amplify)

The frontend automatically deploys when changes are pushed to GitHub:

```bash
cd /Users/williamprior/Development/GitHub/color-code-research-hub
git add .
git commit -m "Your descriptive commit message"
git push origin main
```

Amplify will:
- Detect the push to main branch
- Build the React application
- Deploy to the configured domain

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
- GitHub Personal Access Token: `arn:aws:secretsmanager:us-east-1:418272766513:secret:github/personal_token-7lbje4`
- Anthropic API Key: Stored in stack secrets

## Deployment Verification

### 1. Check Lambda Functions
```bash
aws lambda list-functions --profile personal --region us-east-1 | grep color-code
```

### 2. Check API Gateway
```bash
aws apigateway get-rest-apis --profile personal --region us-east-1
```

### 3. Check Amplify Status
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