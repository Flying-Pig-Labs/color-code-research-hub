# 🚀 Deployment Guide - Color Code Research Hub

> **Complete deployment documentation for all environments and components**

## 📋 Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Architecture Overview](#architecture-overview)
- [Frontend Deployment](#frontend-deployment)
- [Backend Deployment](#backend-deployment)
- [Database Setup](#database-setup)
- [Secrets Management](#secrets-management)
- [Environment Configuration](#environment-configuration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Monitoring Setup](#monitoring-setup)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The Color Code Research Hub uses a modern cloud-native deployment architecture:

- **Frontend**: AWS Amplify (auto-deploy on git push)
- **Backend**: AWS Lambda via SAM (manual deploy)
- **Database**: DynamoDB (serverless)
- **API**: API Gateway (managed)
- **Secrets**: AWS Secrets Manager
- **Monitoring**: CloudWatch

### Deployment Environments

| Environment | Frontend URL | API URL | Purpose |
|------------|--------------|---------|---------|
| Development | http://localhost:3000 | http://localhost:3001 | Local development |
| Staging | - | - | Testing (planned) |
| Production | https://main.dgj0e8wt2o1zf.amplifyapp.com | https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production | Live system |

## Prerequisites

### Required Tools

1. **AWS CLI** (v2.x)
   ```bash
   # Install AWS CLI
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   
   # Configure credentials
   aws configure --profile personal
   ```

2. **SAM CLI** (v1.100.0+)
   ```bash
   # Install SAM CLI
   curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip -o sam.zip
   unzip sam.zip
   sudo ./install
   
   # Verify installation
   sam --version
   ```

3. **Node.js** (18.x)
   ```bash
   # Using nvm
   nvm install 18
   nvm use 18
   
   # Verify
   node --version
   ```

4. **Git** configured with GitHub access

### AWS Account Setup

1. **IAM User** with appropriate permissions:
   - Lambda full access
   - API Gateway full access
   - DynamoDB full access
   - Secrets Manager read access
   - CloudFormation full access
   - IAM role creation
   - S3 bucket access (for SAM)

2. **AWS Profile** configured:
   ```bash
   aws configure --profile personal
   # Enter Access Key ID
   # Enter Secret Access Key
   # Default region: us-east-1
   # Default output: json
   ```

## Architecture Overview

```
Deployment Architecture
┌─────────────────────────────────────────────────────────────┐
│                         Git Repository                       │
│                    (GitHub: main branch)                     │
└──────────────────┬──────────────────────┬──────────────────┘
                   │                      │
         Auto Deploy│              Manual Deploy│
                   ▼                      ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│      AWS Amplify        │    │        SAM CLI          │
│   (Frontend Hosting)    │    │   (Lambda Deployment)   │
│                         │    │                         │
│  - Auto build on push   │    │  - sam build           │
│  - CDN distribution     │    │  - sam deploy          │
│  - Custom domain        │    │  - Stack updates       │
└─────────────────────────┘    └─────────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────────┐    ┌─────────────────────────┐
│     CloudFront CDN      │    │   CloudFormation Stack  │
│   (Global Distribution) │    │    (Infrastructure)     │
└─────────────────────────┘    └─────────────────────────┘
```

## Frontend Deployment

### AWS Amplify Configuration

The frontend automatically deploys when you push to the main branch.

#### Initial Setup (Already Completed)

1. **Connect Repository**
   - AWS Amplify Console → "New app" → "Host web app"
   - Choose GitHub and authorize
   - Select repository and branch

2. **Build Settings** (`amplify.yml`):
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: dist
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Environment Variables**:
   - Set in Amplify Console → App settings → Environment variables
   - `VITE_API_BASE_URL`: Production API endpoint

### Manual Frontend Deployment

#### Build Locally
```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview build
npm run preview
```

#### Deploy to S3 (Alternative)
```bash
# Create S3 bucket
aws s3 mb s3://color-code-research-hub-frontend --profile personal

# Enable static website hosting
aws s3 website s3://color-code-research-hub-frontend \
  --index-document index.html \
  --error-document error.html \
  --profile personal

# Sync build files
aws s3 sync dist/ s3://color-code-research-hub-frontend \
  --delete \
  --profile personal

# Create CloudFront distribution
aws cloudfront create-distribution \
  --origin-domain-name color-code-research-hub-frontend.s3.amazonaws.com \
  --default-root-object index.html \
  --profile personal
```

### Frontend Deployment Checklist

- [ ] Code committed to main branch
- [ ] Build passing locally (`npm run build`)
- [ ] Environment variables updated in Amplify Console
- [ ] Push to GitHub main branch
- [ ] Monitor Amplify Console for build status
- [ ] Verify deployment at production URL
- [ ] Test all features in production

## Backend Deployment

### SAM Deployment Process

#### 1. Using the Deployment Script (Recommended)

```bash
cd infrastructure
./deploy.sh
```

The script handles:
- Validates AWS credentials
- Builds the SAM application
- Deploys with correct parameters
- Shows deployment progress

#### 2. Manual SAM Deployment

```bash
# Navigate to infrastructure directory
cd infrastructure

# Build the application
sam build

# Deploy (first time)
sam deploy --guided

# Deploy (subsequent)
sam deploy \
  --stack-name color-code-research-hub \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --region us-east-1 \
  --profile personal
```

### Deployment Parameters

```yaml
Stack Name: color-code-research-hub
Region: us-east-1
Capabilities: CAPABILITY_IAM
Parameters:
  GitHubOrg: Flying-Pig-Labs
  ClientCompanyName: Your Company
```

### Lambda Function Deployment

Each Lambda function is deployed as part of the SAM stack:

1. **Code Location**: `/lambda/handlers/`
2. **Build Process**: SAM packages dependencies
3. **Deployment**: CloudFormation creates/updates functions

#### Updating a Single Function

```bash
# Quick update (function code only)
sam deploy --no-confirm-changeset

# Full rebuild
sam build FunctionName
sam deploy
```

### API Gateway Deployment

API Gateway is deployed automatically with SAM:

1. **Stages**: production (default)
2. **CORS**: Enabled for all origins
3. **Throttling**: Default limits apply

#### Custom Domain (Optional)

```bash
# Create certificate
aws acm request-certificate \
  --domain-name api.yourcompany.com \
  --validation-method DNS \
  --profile personal

# Create custom domain
aws apigateway create-domain-name \
  --domain-name api.yourcompany.com \
  --certificate-arn arn:aws:acm:... \
  --profile personal
```

## Database Setup

### DynamoDB Tables

Tables are created automatically by SAM deployment.

#### Manual Table Creation (if needed)

```bash
aws dynamodb create-table \
  --table-name PlanGenerationJobs \
  --attribute-definitions \
    AttributeName=jobId,AttributeType=S \
  --key-schema \
    AttributeName=jobId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --profile personal \
  --region us-east-1
```

#### Enable TTL

```bash
aws dynamodb update-time-to-live \
  --table-name PlanGenerationJobs \
  --time-to-live-specification \
    Enabled=true,AttributeName=ttl \
  --profile personal
```

#### Backup Configuration

```bash
# Enable point-in-time recovery
aws dynamodb update-continuous-backups \
  --table-name PlanGenerationJobs \
  --point-in-time-recovery-specification \
    PointInTimeRecoveryEnabled=true \
  --profile personal
```

## Secrets Management

### Creating Secrets

```bash
# Anthropic API Key
aws secretsmanager create-secret \
  --name anthropic_key \
  --secret-string '{"anthropic_key":"sk-ant-api03-..."}' \
  --profile personal \
  --region us-east-1

# OpenAI API Key
aws secretsmanager create-secret \
  --name openai_key \
  --secret-string '{"openai_key":"sk-proj-..."}' \
  --profile personal \
  --region us-east-1

# GitHub Token
aws secretsmanager create-secret \
  --name github_token \
  --secret-string '{"github_token":"ghp_..."}' \
  --profile personal \
  --region us-east-1
```

### Updating Secrets

```bash
aws secretsmanager update-secret \
  --secret-id anthropic_key \
  --secret-string '{"anthropic_key":"new-key-here"}' \
  --profile personal
```

### Rotating Secrets

```bash
# Create rotation Lambda
aws secretsmanager rotate-secret \
  --secret-id anthropic_key \
  --rotation-lambda-arn arn:aws:lambda:... \
  --rotation-rules AutomaticallyAfterDays=30 \
  --profile personal
```

## Environment Configuration

### Development Environment

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:3001
VITE_PORT=3000

# Lambda environment
export AWS_REGION=us-east-1
export ANTHROPIC_API_KEY=your-dev-key
export OPENAI_API_KEY=your-dev-key
```

### Production Environment

#### Frontend (Amplify Console)
```
VITE_API_BASE_URL=https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production
```

#### Backend (SAM template.yaml)
```yaml
Environment:
  Variables:
    ENVIRONMENT: production
    LOG_LEVEL: INFO
    ANTHROPIC_API_KEY: '{{resolve:secretsmanager:anthropic_key:SecretString:anthropic_key}}'
    OPENAI_API_KEY: '{{resolve:secretsmanager:openai_key:SecretString:openai_key}}'
```

### Environment-Specific Configurations

```yaml
# samconfig.toml
[default.deploy.parameters]
stack_name = "color-code-research-hub"
region = "us-east-1"
capabilities = "CAPABILITY_IAM"
resolve_s3 = true

[staging.deploy.parameters]
stack_name = "color-code-research-hub-staging"
parameter_overrides = "Environment=staging"

[production.deploy.parameters]
stack_name = "color-code-research-hub"
parameter_overrides = "Environment=production"
```

## CI/CD Pipeline

### GitHub Actions (Planned)

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup SAM
        uses: aws-actions/setup-sam@v2
        
      - name: Configure AWS
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
          
      - name: Build
        run: |
          cd infrastructure
          sam build
          
      - name: Deploy
        run: |
          sam deploy --no-confirm-changeset
```

### Manual Deployment Process

1. **Code Review**: PR approved and merged
2. **Frontend**: Automatically deployed via Amplify
3. **Backend**: Manual SAM deployment
4. **Verification**: Test in production
5. **Monitoring**: Check CloudWatch for errors

## Monitoring Setup

### CloudWatch Dashboards

```bash
# Create dashboard
aws cloudwatch put-dashboard \
  --dashboard-name ColorCodeResearchHub \
  --dashboard-body file://dashboard.json \
  --profile personal
```

#### dashboard.json
```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/Lambda", "Invocations", {"stat": "Sum"}],
          [".", "Errors", {"stat": "Sum"}],
          [".", "Duration", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "Lambda Metrics"
      }
    }
  ]
}
```

### CloudWatch Alarms

```bash
# Lambda error alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "Lambda-Errors-High" \
  --alarm-description "Alert when Lambda errors exceed threshold" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --profile personal

# API Gateway 5XX alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "API-5XX-Errors" \
  --alarm-description "Alert on API Gateway 5XX errors" \
  --metric-name 5XXError \
  --namespace AWS/ApiGateway \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --profile personal
```

### Log Aggregation

```bash
# Create log group for API Gateway
aws logs create-log-group \
  --log-group-name /aws/apigateway/ResearchHubApi \
  --profile personal

# Set retention
aws logs put-retention-policy \
  --log-group-name /aws/apigateway/ResearchHubApi \
  --retention-in-days 30 \
  --profile personal
```

## Rollback Procedures

### Frontend Rollback

#### Via Amplify Console
1. Go to AWS Amplify Console
2. Select the app
3. Go to "Hosting environments" → "main"
4. Click "View build history"
5. Select previous successful build
6. Click "Redeploy this version"

#### Via Git
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### Backend Rollback

#### CloudFormation Rollback
```bash
# View stack events
aws cloudformation describe-stack-events \
  --stack-name color-code-research-hub \
  --profile personal \
  --max-items 50

# Cancel in-progress update
aws cloudformation cancel-update-stack \
  --stack-name color-code-research-hub \
  --profile personal

# Rollback to previous version
aws cloudformation update-stack \
  --stack-name color-code-research-hub \
  --use-previous-template \
  --profile personal
```

#### Manual Function Rollback
```bash
# Update function code to previous version
aws lambda update-function-code \
  --function-name color-code-research-hub-PlanGeneratorCLI \
  --s3-bucket your-deployment-bucket \
  --s3-key previous-version.zip \
  --profile personal
```

### Database Rollback

```bash
# Restore from point-in-time
aws dynamodb restore-table-to-point-in-time \
  --source-table-name PlanGenerationJobs \
  --target-table-name PlanGenerationJobs-restored \
  --restore-date-time "2025-01-27T12:00:00Z" \
  --profile personal
```

## Troubleshooting

### Common Deployment Issues

#### 1. SAM Build Failures

**Problem**: `npm install` fails during build

**Solution**:
```bash
# Use container build
sam build --use-container

# Or clear cache
rm -rf .aws-sam/
sam build
```

#### 2. Stack Update Failures

**Problem**: CloudFormation stack stuck in UPDATE_ROLLBACK_FAILED

**Solution**:
```bash
# Continue update rollback
aws cloudformation continue-update-rollback \
  --stack-name color-code-research-hub \
  --profile personal

# If that fails, skip resources
aws cloudformation continue-update-rollback \
  --stack-name color-code-research-hub \
  --resources-to-skip LogicalResourceId1 LogicalResourceId2 \
  --profile personal
```

#### 3. Permission Errors

**Problem**: AccessDenied errors during deployment

**Solution**:
```bash
# Check current permissions
aws iam get-user --profile personal
aws iam list-attached-user-policies --user-name your-user --profile personal

# Ensure these permissions:
- cloudformation:*
- lambda:*
- apigateway:*
- dynamodb:*
- iam:*Role*
- s3:*
```

#### 4. Amplify Build Failures

**Problem**: Frontend build fails in Amplify

**Solution**:
1. Check build logs in Amplify Console
2. Ensure Node version matches local
3. Clear build cache in Amplify settings
4. Check environment variables

### Debug Commands

```bash
# Check deployment status
aws cloudformation describe-stacks \
  --stack-name color-code-research-hub \
  --profile personal

# View Lambda logs
aws logs tail /aws/lambda/color-code-research-hub-PlanGeneratorCLI \
  --profile personal \
  --follow

# Test API endpoint
curl -X GET https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/health

# Check DynamoDB items
aws dynamodb scan \
  --table-name PlanGenerationJobs \
  --profile personal
```

## Best Practices

### Pre-Deployment Checklist

- [ ] All tests passing (`npm test`)
- [ ] TypeScript compilation successful (`npm run typecheck`)
- [ ] ESLint passing (`npm run lint`)
- [ ] Environment variables documented
- [ ] Secrets updated if needed
- [ ] Database migrations planned
- [ ] Rollback plan prepared

### Deployment Best Practices

1. **Version Control**
   - Tag releases: `git tag -a v1.0.0 -m "Release 1.0.0"`
   - Use semantic versioning
   - Maintain changelog

2. **Staging Environment**
   - Test in staging first
   - Use same infrastructure code
   - Separate AWS account (ideal)

3. **Blue-Green Deployment**
   ```bash
   # Create new stack
   sam deploy --stack-name color-code-research-hub-green
   
   # Switch traffic
   # Update Route53 or ALB
   
   # Delete old stack
   aws cloudformation delete-stack --stack-name color-code-research-hub-blue
   ```

4. **Monitoring**
   - Set up alarms before deployment
   - Watch metrics during deployment
   - Have rollback plan ready

5. **Documentation**
   - Update deployment notes
   - Document any manual steps
   - Record deployment times

### Security Best Practices

1. **Secrets**
   - Never commit secrets
   - Use Secrets Manager
   - Rotate regularly
   - Audit access

2. **IAM**
   - Least privilege principle
   - Use roles, not users
   - Regular access review
   - MFA for console access

3. **Network**
   - HTTPS only
   - API Gateway throttling
   - CloudFront for DDoS protection
   - VPC for sensitive functions

### Cost Optimization

1. **Lambda**
   - Right-size memory
   - Set appropriate timeouts
   - Use ARM architecture
   - Enable compression

2. **DynamoDB**
   - Use on-demand billing
   - Enable auto-scaling
   - Set TTL for cleanup
   - Monitor usage

3. **CloudWatch**
   - Set log retention
   - Use log filters
   - Aggregate metrics
   - Archive old logs to S3

## Related Documentation

- [Infrastructure Documentation](../infrastructure/README.md)
- [Architecture Overview](../ARCHITECTURE.md)
- [API Documentation](../API_DOCUMENTATION.md)
- [Monitoring Guide](./MONITORING.md)
- [Security Guide](./SECURITY.md)

---

> 💡 **Deployment Tip**: Always deploy to staging first, even for "simple" changes. Production surprises are expensive.