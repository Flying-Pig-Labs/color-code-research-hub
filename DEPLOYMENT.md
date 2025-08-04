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

### Deployment Profile
**Important**: Always use the `mvp` profile for deployments:
```bash
sam deploy --profile mvp --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1
```