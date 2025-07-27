# 🏗️ Infrastructure Documentation - Color Code Research Hub

> **Complete infrastructure as code documentation using AWS SAM**

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Resources](#resources)
- [SAM Template Structure](#sam-template-structure)
- [Lambda Functions](#lambda-functions)
- [DynamoDB Tables](#dynamodb-tables)
- [API Gateway](#api-gateway)
- [IAM Roles & Policies](#iam-roles--policies)
- [Secrets Management](#secrets-management)
- [Deployment Guide](#deployment-guide)
- [Configuration](#configuration)
- [Monitoring & Logs](#monitoring--logs)
- [Cost Optimization](#cost-optimization)
- [Troubleshooting](#troubleshooting)
- [Best Practices](#best-practices)

## Overview

The infrastructure for Color Code Research Hub is defined using AWS SAM (Serverless Application Model), which extends CloudFormation to provide simplified syntax for serverless applications. All infrastructure is defined as code in the `template.yaml` file.

### Key Benefits

- **Infrastructure as Code**: Version controlled, reviewable, repeatable
- **Serverless Architecture**: No servers to manage, automatic scaling
- **Cost Effective**: Pay only for what you use
- **Integrated Security**: IAM roles with least privilege
- **Easy Deployment**: Single command deployment

### Technology Stack

- **AWS SAM**: Infrastructure definition and deployment
- **CloudFormation**: Underlying infrastructure provisioning
- **Lambda**: Serverless compute
- **API Gateway**: REST API management
- **DynamoDB**: NoSQL database for job tracking
- **Secrets Manager**: Secure credential storage
- **S3**: Deployment artifact storage
- **CloudWatch**: Logging and monitoring

## Architecture

```
Infrastructure Architecture
┌─────────────────────────────────────────────────────────────────┐
│                        CloudFormation Stack                      │
│                    (color-code-research-hub)                     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                      API Gateway                          │   │
│  │              (ResearchHubApi - REST API)                  │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │   │
│  │  │   /health   │  │ /api/plan/* │  │/api/github/*│     │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │   │
│  └─────────┼────────────────┼────────────────┼─────────────┘   │
│            │                │                │                   │
│  ┌─────────▼────────────────▼────────────────▼─────────────┐   │
│  │                    Lambda Functions                       │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐│   │
│  │  │  Health  │  │Plan Gen  │  │Plan Orch │  │ GitHub   ││   │
│  │  │ Function │  │Functions │  │Function  │  │Functions ││   │
│  │  └──────────┘  └──────────┘  └─────┬────┘  └──────────┘│   │
│  └─────────────────────────────────────┼────────────────────┘   │
│                                        │                         │
│  ┌─────────────────────────────────────▼────────────────────┐   │
│  │                    DynamoDB Table                         │   │
│  │             (PlanGenerationJobs + TTL)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────┐  ┌─────────────────────┐             │
│  │   Secrets Manager   │  │    CloudWatch       │             │
│  │  - API Keys         │  │  - Logs             │             │
│  │  - GitHub PAT       │  │  - Metrics          │             │
│  └────────────────────┘  └─────────────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

## Resources

### Complete Resource List

| Resource Type | Count | Purpose |
|--------------|-------|---------|
| Lambda Functions | 20 | API handlers and processing |
| API Gateway | 1 | REST API endpoint |
| DynamoDB Tables | 1 | Job tracking with TTL |
| IAM Roles | 20 | One per Lambda function |
| CloudWatch Log Groups | 20 | Function logs |
| S3 Buckets | 1 | SAM deployment artifacts |

## SAM Template Structure

### template.yaml Overview

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: Color Code Research Hub - AWS SAM Template

# Global configuration for all Lambda functions
Globals:
  Function:
    Timeout: 30
    Runtime: nodejs18.x
    Environment:
      Variables:
        GITHUB_ORG: !Ref GitHubOrg
        CLIENT_COMPANY_NAME: !Ref ClientCompanyName

# Template parameters
Parameters:
  GitHubOrg:
    Type: String
    Default: Flying-Pig-Labs
    Description: GitHub organization name
  
  ClientCompanyName:
    Type: String
    Default: Your Company
    Description: Client company name

# Resources section
Resources:
  # API Gateway
  ResearchHubApi:
    Type: AWS::Serverless::Api
    Properties:
      StageName: production
      Cors:
        AllowMethods: "'GET,POST,OPTIONS'"
        AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
        AllowOrigin: "'*'"
      
  # Lambda Functions (see detailed section below)
  # DynamoDB Tables (see detailed section below)
  
# Stack outputs
Outputs:
  ApiGatewayUrl:
    Description: API Gateway endpoint URL
    Value: !Sub https://${ResearchHubApi}.execute-api.${AWS::Region}.amazonaws.com/production
```

## Lambda Functions

### Function Categories

#### 1. Plan Generation Functions

##### PlanGeneratorCLIFunction
- **Purpose**: Full CLI logic implementation with 50-90 LLM calls
- **Timeout**: 900 seconds (15 minutes)
- **Memory**: 1024MB
- **Endpoints**: 
  - POST `/api/plan/populate-form`
  - POST `/api/plan/generate-cli-plan`

```yaml
PlanGeneratorCLIFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: ../lambda/handlers/
    Handler: planGeneratorCLI.handler
    Timeout: 900
    MemorySize: 1024
    Environment:
      Variables:
        ANTHROPIC_API_KEY: '{{resolve:secretsmanager:anthropic_key:SecretString:anthropic_key}}'
        OPENAI_API_KEY: '{{resolve:secretsmanager:openai_key:SecretString:openai_key}}'
    Policies:
      - Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - secretsmanager:GetSecretValue
            Resource:
              - !Sub arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:anthropic_key-*
              - !Sub arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:openai_key-*
    Events:
      PopulateForm:
        Type: Api
        Properties:
          RestApiId: !Ref ResearchHubApi
          Path: /api/plan/populate-form
          Method: POST
      GenerateCLIPlan:
        Type: Api
        Properties:
          RestApiId: !Ref ResearchHubApi
          Path: /api/plan/generate-cli-plan
          Method: POST
```

##### PlanGeneratorV2Function
- **Purpose**: Optimized for API Gateway 30s timeout
- **Timeout**: 30 seconds
- **Memory**: 512MB
- **Endpoints**: 
  - POST `/api/plan/v2/generate-full-plan`
  - POST `/api/plan/v2/generate-issues`
  - POST `/api/plan/v2/create-github-issues`

#### 2. Async Orchestration Functions

##### StartPlanGenerationFunction
- **Purpose**: Initiates async jobs
- **Timeout**: 30 seconds
- **Memory**: 128MB
- **Endpoint**: POST `/api/plan/async/start`

##### PlanOrchestratorFunction
- **Purpose**: Long-running orchestration
- **Timeout**: 900 seconds
- **Memory**: 3008MB
- **Reserved Concurrency**: 5
- **Invocation**: Async from StartPlanGeneration

```yaml
PlanOrchestratorFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: ../lambda/handlers/
    Handler: planOrchestrator.handler
    Timeout: 900
    MemorySize: 3008
    ReservedConcurrentExecutions: 5
    Environment:
      Variables:
        JOBS_TABLE_NAME: !Ref PlanGenerationJobsTable
        ANTHROPIC_API_KEY: '{{resolve:secretsmanager:anthropic_key:SecretString:anthropic_key}}'
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref PlanGenerationJobsTable
      - Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Action:
              - secretsmanager:GetSecretValue
            Resource: '*'
```

##### GetJobStatusFunction
- **Purpose**: Returns job status for polling
- **Timeout**: 30 seconds
- **Memory**: 128MB
- **Endpoint**: GET `/api/plan/async/status/{jobId}`

#### 3. Claude Flow Functions

##### ClaudeFlowProxy Functions
- **ClaudeFlowHealthFunction**: Health check
- **ClaudeFlowExecuteFunction**: Execute commands
- **ClaudeFlowSwarmStatusFunction**: Swarm status
- **ClaudeFlowExecutionsFunction**: List executions
- **ClaudeFlowExecutionDetailsFunction**: Execution details

##### ClaudeFlowExecution Functions
- **ClaudeFlowExecutionLogsFunction**: Fetch logs
- **ClaudeFlowExecutionMetadataFunction**: Get metadata
- **ClaudeFlowExecutionActivityFunction**: Latest activity

```yaml
ClaudeFlowExecutionLogsFunction:
  Type: AWS::Serverless::Function
  Properties:
    CodeUri: ../lambda/handlers/
    Handler: claudeFlowExecutionLogs.handler
    Timeout: 30
    Environment:
      Variables:
        EC2_HOST: 18.209.36.58
        EC2_PORT: 8080
    Events:
      GetLogs:
        Type: Api
        Properties:
          RestApiId: !Ref ResearchHubApi
          Path: /api/claude-flow/execution/{id}/logs
          Method: GET
```

#### 4. GitHub Integration Functions

##### GitHubReposFunction
- **Purpose**: Repository operations
- **Endpoints**:
  - GET `/api/github/repos/{owner}`
  - GET `/api/github/repos/{owner}/{repo}/readme`

#### 5. Research Team Functions

##### SubmitToSQSFunction
- **Purpose**: Submit research requests
- **Endpoint**: POST `/api/sqs/submit`

##### TeamsFunction
- **Purpose**: Team field definitions
- **Endpoint**: GET `/teams/{teamType}/fields`

#### 6. Utility Functions

##### HealthFunction
- **Purpose**: Basic health check
- **Endpoint**: GET `/health`

## DynamoDB Tables

### PlanGenerationJobsTable

```yaml
PlanGenerationJobsTable:
  Type: AWS::DynamoDB::Table
  Properties:
    TableName: PlanGenerationJobs
    AttributeDefinitions:
      - AttributeName: jobId
        AttributeType: S
    KeySchema:
      - AttributeName: jobId
        KeyType: HASH
    BillingMode: PAY_PER_REQUEST
    TimeToLiveSpecification:
      AttributeName: ttl
      Enabled: true
    StreamSpecification:
      StreamViewType: NEW_AND_OLD_IMAGES
    Tags:
      - Key: Application
        Value: color-code-research-hub
      - Key: Environment
        Value: production
```

#### Table Schema

```javascript
{
  jobId: "550e8400-e29b-41d4-a716-446655440000",  // Partition key
  status: "PROCESSING",                            // Job status
  input: {                                         // Original request
    metadata: { ... },
    readmeContent: "..."
  },
  stages: {                                        // Progress tracking
    populateForm: { status: "completed", ... },
    generatePhases: { status: "completed", ... },
    epicGeneration: { status: "in_progress", ... }
  },
  results: { ... },                                // Final output
  errors: [],                                      // Error tracking
  createdAt: "2025-01-27T12:00:00.000Z",
  updatedAt: "2025-01-27T12:05:00.000Z",
  ttl: 1753717200                                  // Auto-delete after 30 days
}
```

## API Gateway

### Configuration

```yaml
ResearchHubApi:
  Type: AWS::Serverless::Api
  Properties:
    Name: ResearchHubApi
    StageName: production
    TracingEnabled: true
    Cors:
      AllowMethods: "'GET,POST,PUT,DELETE,OPTIONS'"
      AllowHeaders: "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
      AllowOrigin: "'*'"
      MaxAge: "'86400'"
    MethodSettings:
      - ResourcePath: /*
        HttpMethod: '*'
        LoggingLevel: INFO
        DataTraceEnabled: true
        MetricsEnabled: true
    AccessLogSetting:
      DestinationArn: !GetAtt ApiLogGroup.Arn
      Format: '{"requestId":"$context.requestId","ip":"$context.identity.sourceIp","requestTime":"$context.requestTime","httpMethod":"$context.httpMethod","routeKey":"$context.routeKey","status":"$context.status","protocol":"$context.protocol","responseLength":"$context.responseLength"}'
```

### Endpoint Structure

```
https://{api-id}.execute-api.{region}.amazonaws.com/production
│
├── /health                          # Health check
├── /teams/{teamType}/fields         # Team field definitions
│
├── /api/
│   ├── plan/
│   │   ├── populate-form           # Extract metadata from README
│   │   ├── generate-cli-plan       # Full CLI plan generation
│   │   ├── async/
│   │   │   ├── start              # Start async job
│   │   │   └── status/{jobId}     # Check job status
│   │   └── v2/
│   │       ├── generate-full-plan  # Generate phases
│   │       ├── generate-issues     # Generate issues
│   │       └── create-github-issues# Create GitHub issues
│   │
│   ├── github/
│   │   └── repos/
│   │       ├── {owner}            # List repositories
│   │       └── {owner}/{repo}/readme # Get README
│   │
│   ├── claude-flow/
│   │   ├── health                 # Backend health
│   │   ├── execute                # Execute command
│   │   ├── swarm-status          # Swarm status
│   │   ├── executions            # List executions
│   │   └── execution/{id}        # Execution details
│   │       ├── logs              # Get logs
│   │       ├── metadata          # Get metadata
│   │       └── activity          # Latest activity
│   │
│   └── sqs/
│       └── submit                 # Submit research request
```

## IAM Roles & Policies

### Lambda Execution Roles

Each Lambda function gets an automatically generated execution role with:

1. **Basic Lambda Execution**
   ```yaml
   - Effect: Allow
     Action:
       - logs:CreateLogGroup
       - logs:CreateLogStream
       - logs:PutLogEvents
     Resource: !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*
   ```

2. **Function-Specific Permissions**

   **DynamoDB Access**:
   ```yaml
   - DynamoDBCrudPolicy:
       TableName: !Ref PlanGenerationJobsTable
   ```

   **Secrets Manager Access**:
   ```yaml
   - Effect: Allow
     Action:
       - secretsmanager:GetSecretValue
     Resource:
       - arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:anthropic_key-*
       - arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:openai_key-*
       - arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:github_token-*
   ```

   **Lambda Invocation**:
   ```yaml
   - Effect: Allow
     Action:
       - lambda:InvokeFunction
     Resource: !GetAtt PlanOrchestratorFunction.Arn
   ```

### Security Best Practices

1. **Least Privilege**: Each function only gets permissions it needs
2. **No Wildcards**: Specific resource ARNs where possible
3. **Secrets in Secrets Manager**: Never hardcode credentials
4. **Encrypted at Rest**: DynamoDB encryption enabled
5. **VPC Optional**: Functions not in VPC for simplicity

## Secrets Management

### Secrets Manager Integration

```yaml
Environment:
  Variables:
    ANTHROPIC_API_KEY: '{{resolve:secretsmanager:anthropic_key:SecretString:anthropic_key}}'
    OPENAI_API_KEY: '{{resolve:secretsmanager:openai_key:SecretString:openai_key}}'
    GITHUB_TOKEN: '{{resolve:secretsmanager:github_token:SecretString:github_token}}'
```

### Secret Structure

```json
{
  "anthropic_key": "sk-ant-api03-...",
  "openai_key": "sk-proj-...",
  "github_token": "ghp_..."
}
```

### Creating Secrets

```bash
# Create secret
aws secretsmanager create-secret \
  --name anthropic_key \
  --secret-string '{"anthropic_key":"your-key-here"}' \
  --profile personal \
  --region us-east-1

# Update secret
aws secretsmanager update-secret \
  --secret-id anthropic_key \
  --secret-string '{"anthropic_key":"new-key-here"}' \
  --profile personal \
  --region us-east-1
```

## Deployment Guide

### Prerequisites

1. **AWS CLI** configured with credentials
2. **SAM CLI** installed (v1.100.0+)
3. **Node.js** 18.x installed
4. **Docker** (optional, for consistent builds)

### Deployment Script

Use the provided deployment script for safety:

```bash
cd infrastructure
./deploy.sh
```

The script enforces:
- Correct stack name: `color-code-research-hub`
- Required capabilities: `CAPABILITY_IAM`
- Correct region: `us-east-1`
- Profile: `personal` (or configure)

### Manual Deployment Steps

#### 1. Build the Application

```bash
cd infrastructure
sam build

# Or with Docker for consistency
sam build --use-container
```

#### 2. Deploy to AWS

```bash
sam deploy \
  --stack-name color-code-research-hub \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --region us-east-1 \
  --profile personal
```

#### 3. First-Time Deployment

```bash
sam deploy --guided
```

Follow prompts to configure:
- Stack name: `color-code-research-hub`
- AWS Region: `us-east-1`
- Confirm changes: Y
- Allow SAM to create roles: Y
- Save parameters: Y

### Deployment Parameters

```yaml
Parameters:
  GitHubOrg:
    Default: Flying-Pig-Labs
    Description: GitHub organization for research teams
  
  ClientCompanyName:
    Default: Your Company
    Description: Client name for branding
```

### Update Deployment

After code changes:

```bash
cd infrastructure
sam build
sam deploy --no-confirm-changeset
```

### Rollback

```bash
# View stack history
aws cloudformation describe-stack-events \
  --stack-name color-code-research-hub \
  --profile personal \
  --region us-east-1

# Rollback to previous version
aws cloudformation cancel-update-stack \
  --stack-name color-code-research-hub \
  --profile personal \
  --region us-east-1
```

## Configuration

### Environment Variables

#### Global Variables (All Functions)

```yaml
Globals:
  Function:
    Environment:
      Variables:
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: 1
        LOG_LEVEL: INFO
        ENVIRONMENT: production
```

#### Function-Specific Variables

```yaml
# Plan Generation
ANTHROPIC_API_KEY: From Secrets Manager
OPENAI_API_KEY: From Secrets Manager
MODEL_CLAUDE: claude-3-5-sonnet-20241022
MODEL_OPENAI: gpt-4-turbo-preview

# Async Orchestration
JOBS_TABLE_NAME: !Ref PlanGenerationJobsTable
ORCHESTRATOR_FUNCTION_NAME: !Ref PlanOrchestratorFunction

# Claude Flow
EC2_HOST: 18.209.36.58
EC2_PORT: 8080

# SQS
SQS_QUEUE_URL: !Ref ResearchRequestQueue
```

### Function Configuration

| Function | Memory | Timeout | Reserved Concurrency |
|----------|--------|---------|---------------------|
| PlanGeneratorCLI | 1024 MB | 900s | - |
| PlanOrchestrator | 3008 MB | 900s | 5 |
| StartPlanGeneration | 128 MB | 30s | - |
| GetJobStatus | 128 MB | 30s | - |
| ClaudeFlow* | 256 MB | 30s | - |
| Health | 128 MB | 30s | - |

### Cost Optimization Settings

```yaml
# DynamoDB On-Demand Billing
BillingMode: PAY_PER_REQUEST

# TTL for Automatic Cleanup
TimeToLiveSpecification:
  AttributeName: ttl
  Enabled: true

# Reserved Concurrency (prevent runaway costs)
ReservedConcurrentExecutions: 5
```

## Monitoring & Logs

### CloudWatch Logs

#### Log Groups

Each Lambda function creates a log group:
- Pattern: `/aws/lambda/{function-name}`
- Retention: 30 days (configurable)

#### Viewing Logs

```bash
# Tail logs for specific function
aws logs tail /aws/lambda/color-code-research-hub-PlanOrchestratorFunction-ABC123 \
  --profile personal \
  --region us-east-1 \
  --follow

# Search logs
aws logs filter-log-events \
  --log-group-name /aws/lambda/color-code-research-hub-PlanOrchestratorFunction-ABC123 \
  --filter-pattern '"ERROR"' \
  --profile personal \
  --region us-east-1
```

### CloudWatch Metrics

#### Default Metrics
- Invocations
- Errors
- Duration
- Throttles
- ConcurrentExecutions

#### Custom Metrics

```javascript
// In Lambda function
const AWS = require('aws-sdk');
const cloudwatch = new AWS.CloudWatch();

await cloudwatch.putMetricData({
  Namespace: 'ColorCodeResearchHub',
  MetricData: [{
    MetricName: 'LLMCallDuration',
    Value: duration,
    Unit: 'Milliseconds',
    Dimensions: [{
      Name: 'Provider',
      Value: 'Claude'
    }]
  }]
}).promise();
```

### X-Ray Tracing

Enable in template:

```yaml
Globals:
  Function:
    Tracing: Active
  Api:
    TracingEnabled: true
```

### CloudWatch Dashboards

Create custom dashboard:

```bash
aws cloudwatch put-dashboard \
  --dashboard-name ColorCodeResearchHub \
  --dashboard-body file://dashboard.json \
  --profile personal \
  --region us-east-1
```

## Cost Optimization

### Current Cost Drivers

1. **Lambda Invocations**
   - First 1M requests/month: Free
   - $0.20 per 1M requests thereafter

2. **Lambda Duration**
   - First 400,000 GB-seconds/month: Free
   - $0.0000166667 per GB-second thereafter

3. **DynamoDB**
   - On-demand: $0.25 per million reads/writes
   - Storage: $0.25 per GB/month

4. **API Gateway**
   - First 1M calls/month: Free (12 months)
   - $3.50 per million calls thereafter

### Optimization Strategies

1. **Memory Optimization**
   ```yaml
   # Right-size memory allocation
   MemorySize: 128  # For simple functions
   MemorySize: 512  # For moderate processing
   MemorySize: 3008 # Only for heavy processing
   ```

2. **Timeout Configuration**
   ```yaml
   # Set appropriate timeouts
   Timeout: 30   # API handlers
   Timeout: 900  # Long-running orchestration
   ```

3. **Reserved Concurrency**
   ```yaml
   # Prevent runaway costs
   ReservedConcurrentExecutions: 5
   ```

4. **DynamoDB TTL**
   ```yaml
   # Auto-delete old records
   TimeToLiveSpecification:
     AttributeName: ttl
     Enabled: true
   ```

### Cost Monitoring

```bash
# Get cost forecast
aws ce get-cost-forecast \
  --time-period Start=2025-01-01,End=2025-01-31 \
  --metric UNBLENDED_COST \
  --granularity MONTHLY \
  --profile personal

# Set up billing alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "ColorCodeResearchHub-Billing" \
  --alarm-description "Alert when costs exceed $100" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --threshold 100 \
  --comparison-operator GreaterThanThreshold \
  --profile personal
```

## Troubleshooting

### Common Issues

#### 1. Stack Creation Failed

**Error**: "Resource handler returned message: Resource of type 'AWS::Lambda::Function' with identifier 'FunctionName' already exists"

**Solution**:
```bash
# Delete existing function
aws lambda delete-function \
  --function-name FunctionName \
  --profile personal \
  --region us-east-1

# Or use unique names in template
```

#### 2. Insufficient IAM Permissions

**Error**: "User is not authorized to perform: iam:CreateRole"

**Solution**:
```bash
# Deploy with admin credentials
# Or add required permissions:
- iam:CreateRole
- iam:AttachRolePolicy
- iam:PutRolePolicy
```

#### 3. Lambda Timeout

**Error**: "Task timed out after 30.00 seconds"

**Solution**:
```yaml
# Increase timeout in template
Properties:
  Timeout: 900  # Max for API Gateway is 30s
```

#### 4. DynamoDB Throttling

**Error**: "ProvisionedThroughputExceededException"

**Solution**:
```yaml
# Use on-demand billing
BillingMode: PAY_PER_REQUEST
```

#### 5. Secrets Manager Access

**Error**: "AccessDeniedException: User is not authorized to perform: secretsmanager:GetSecretValue"

**Solution**:
```yaml
# Add policy to function
Policies:
  - Version: '2012-10-17'
    Statement:
      - Effect: Allow
        Action:
          - secretsmanager:GetSecretValue
        Resource: !Sub arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:*
```

### Debug Commands

```bash
# Describe stack
aws cloudformation describe-stacks \
  --stack-name color-code-research-hub \
  --profile personal

# List stack resources
aws cloudformation list-stack-resources \
  --stack-name color-code-research-hub \
  --profile personal

# Get specific resource
aws cloudformation describe-stack-resource \
  --stack-name color-code-research-hub \
  --logical-resource-id PlanOrchestratorFunction \
  --profile personal

# View stack events (for errors)
aws cloudformation describe-stack-events \
  --stack-name color-code-research-hub \
  --profile personal \
  --max-items 20
```

### Local Testing

```bash
# Start local API
sam local start-api

# Test specific function
sam local invoke PlanGeneratorCLIFunction -e events/test-event.json

# With environment variables
sam local invoke PlanGeneratorCLIFunction \
  -e events/test-event.json \
  --env-vars env.json
```

## Best Practices

### 1. Infrastructure as Code

- **Version Control**: Always commit template.yaml changes
- **Code Review**: Review infrastructure changes like code
- **Documentation**: Update README with changes
- **Testing**: Test in dev environment first

### 2. Security

- **Secrets Management**: Never hardcode credentials
- **Least Privilege**: Minimal IAM permissions
- **Encryption**: Enable encryption at rest
- **Logging**: Audit all API calls

### 3. Performance

- **Memory Optimization**: Profile and right-size
- **Cold Starts**: Use provisioned concurrency if needed
- **Caching**: Cache expensive operations
- **Async Pattern**: Use for long operations

### 4. Cost Management

- **Monitoring**: Set up billing alarms
- **Optimization**: Regular review of resources
- **Cleanup**: Remove unused resources
- **TTL**: Auto-delete old data

### 5. Operational Excellence

- **Monitoring**: CloudWatch dashboards
- **Alerting**: SNS notifications
- **Logging**: Structured JSON logs
- **Tracing**: X-Ray for debugging

## Related Documentation

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [API Gateway Limits](https://docs.aws.amazon.com/apigateway/latest/developerguide/limits.html)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [Deployment Guide](../docs/deployment/README.md)

---

> 💡 **Infrastructure Tip**: Use `sam validate` before deployment to catch template errors early.