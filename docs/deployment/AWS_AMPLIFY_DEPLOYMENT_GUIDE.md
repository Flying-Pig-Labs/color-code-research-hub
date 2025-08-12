# AWS Amplify Deployment Guide for Color Code Research Hub

## 🚨 Critical Security Notice

**IMMEDIATE ACTION REQUIRED**: The repository contains hardcoded AWS credentials that must be removed before deployment:

1. **File**: `backend/sqs-publisher.js` (lines 9-10)
   - AWS Access Key ID: `AKIAWCYX75IYXJ4ITU7G`
   - AWS Secret Access Key: `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`

**These credentials MUST be rotated immediately in the AWS Console and removed from the codebase!**

## 📋 Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Node.js 18+ installed
- GitHub repository access

## 🏗️ Architecture Overview

### Current Architecture (Local)
```
Frontend (Vite) → Backend (Express) → AWS SQS → EC2 Processing
   Port 3000         Port 3001
```

### Target Architecture (AWS Amplify)
```
Frontend (Amplify) → API Gateway → Lambda Functions → AWS SQS → EC2 Processing
     Static Site        HTTPS         Serverless
```

## 📝 Pre-Deployment Checklist

### 1. Remove Hardcoded Credentials
```bash
# Remove hardcoded AWS credentials from backend/sqs-publisher.js
# Lines 9-10 should use environment variables instead:
# accessKeyId: process.env.AWS_ACCESS_KEY_ID,
# secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
```

### 2. Update Environment Variables
Create `.env.production` with:
```bash
VITE_API_GATEWAY_URL=https://your-api-gateway-url.execute-api.region.amazonaws.com/production
VITE_GITHUB_ORG=Flying-Pig-Labs
VITE_GITHUB_TOKEN=your-github-token
VITE_AWS_REGION=us-east-1
```

## 🚀 Deployment Steps

### Step 1: Deploy Lambda Functions and API Gateway

1. **Install AWS SAM CLI**:
   ```bash
   pip install aws-sam-cli
   ```

2. **Build the SAM application**:
   ```bash
   cd infrastructure
   sam build
   ```

3. **Deploy the backend**:
   ```bash
   sam deploy --guided \
     --parameter-overrides \
     GitHubOrg=Flying-Pig-Labs \
     ClientCompanyName="Your Company" \
     SQSQueueUrl="your-sqs-queue-url"
   ```

4. **Note the API Gateway URL** from the output.

### Step 2: Configure AWS Secrets Manager

1. **Create secrets in AWS Console**:
   ```json
   {
     "SQS_QUEUE_URL": "https://sqs.us-east-1.amazonaws.com/your-account/your-queue",
     "GITHUB_ORG": "Flying-Pig-Labs",
     "GITHUB_TOKEN": "your-github-token",
     "CLIENT_COMPANY_NAME": "Your Company"
   }
   ```

2. **Grant Lambda functions access** to the secrets (already configured in template).

### Step 3: Deploy Frontend to Amplify

1. **Connect GitHub repository** to AWS Amplify Console.

2. **Configure build settings** (already set in `amplify.yml`).

3. **Set environment variables** in Amplify Console:
   - `VITE_API_GATEWAY_URL`: Your API Gateway URL from Step 1
   - `VITE_GITHUB_ORG`: Your GitHub organization
   - `VITE_GITHUB_TOKEN`: Your GitHub token (optional)
   - `VITE_AWS_REGION`: us-east-1

4. **Configure custom domain** (optional).

### Step 4: Update Frontend Code

1. **Replace API service** for production:
   ```bash
   # In production builds, use the Amplify-optimized API service
   cp src/services/api.amplify.ts src/services/api.ts
   ```

2. **Update imports** to use environment config:
   ```typescript
   import { envConfig } from '@/config/environment';
   ```

## 🔧 Configuration Details

### API Gateway Endpoints

| Endpoint | Method | Lambda Function | Description |
|----------|--------|----------------|-------------|
| `/health` | GET | HealthFunction | Health check |
| `/teams` | GET | TeamsFunction | Get team types |
| `/teams/{teamType}/fields` | GET | TeamsFunction | Get team fields |
| `/api/sqs/submit` | POST | SubmitToSQSFunction | Submit to SQS |

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_API_GATEWAY_URL` | API Gateway endpoint | Yes (production) |
| `VITE_GITHUB_ORG` | GitHub organization | Yes |
| `VITE_GITHUB_TOKEN` | GitHub access token | No |
| `VITE_AWS_REGION` | AWS region | Yes |

### CORS Configuration

CORS is pre-configured in:
- API Gateway (via SAM template)
- Lambda functions (response headers)
- Frontend (no proxy needed in production)

## 🔍 Post-Deployment Verification

1. **Test API Gateway**:
   ```bash
   curl https://your-api-gateway-url/production/health
   ```

2. **Verify SQS permissions**:
   - Lambda function can send messages
   - EC2 instances can receive messages

3. **Check CloudWatch logs** for any errors.

## 🚨 Security Best Practices

1. **Never commit credentials** to source control
2. **Use AWS Secrets Manager** for all sensitive data
3. **Enable API Gateway authentication** if needed
4. **Restrict CORS origins** in production
5. **Use IAM roles** instead of access keys
6. **Enable CloudWatch monitoring**
7. **Set up AWS WAF** for additional protection

## 📊 Monitoring and Logs

- **CloudWatch Logs**: All Lambda functions log to CloudWatch
- **API Gateway Metrics**: Monitor request counts and latencies
- **SQS Metrics**: Track message processing
- **Amplify Metrics**: Monitor frontend performance

## 🔄 Continuous Deployment

Amplify automatically deploys when you push to the connected branch:
1. Push code to GitHub
2. Amplify builds and deploys automatically
3. Monitor deployment in Amplify Console

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Verify API Gateway CORS settings
   - Check Lambda response headers

2. **Authentication Errors**:
   - Verify Secrets Manager permissions
   - Check Lambda execution role

3. **SQS Permission Errors**:
   - Verify Lambda has SQS:SendMessage permission
   - Check queue policy

4. **404 Errors**:
   - Verify API Gateway deployment
   - Check endpoint paths match

## 📚 Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [API Gateway CORS](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-cors.html)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)