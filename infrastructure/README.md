# Infrastructure Documentation

## Overview

This directory contains the AWS SAM (Serverless Application Model) infrastructure for Color Code Research Hub.

## Key Files

- **template.yaml**: SAM template defining all AWS resources
- **samconfig.toml**: SAM configuration (if exists)
- **.aws-sam/**: Build artifacts (git-ignored)

## Resources Created

### Lambda Functions (9 total)
1. **HealthFunction** - Health check endpoint
2. **TeamsFunction** - Team management
3. **GitHubReposFunction** - GitHub integration  
4. **PlanGeneratorFunction** - Original plan generator
5. **PlanGeneratorV2Function** - Optimized for API Gateway timeout
6. **PlanGeneratorCLIFunction** - Full CLI logic implementation
7. **StartPlanGenerationFunction** - Async job initiation
8. **PlanOrchestratorFunction** - Long-running orchestration (900s)
9. **GetJobStatusFunction** - Job status polling

### DynamoDB Tables
- **PlanGenerationJobsTable**: Async job tracking with TTL

### API Gateway
- **ResearchHubApi**: REST API with CORS enabled

### IAM Roles
- Automatically created for each Lambda function
- Permissions for DynamoDB, Secrets Manager, Lambda invocation

## Deployment Commands

### Build
```bash
sam build
# Or with container (if dependencies fail)
sam build --use-container
```

### Deploy
```bash
sam deploy --profile personal --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1
```

### Validate Template
```bash
sam validate
```

### Delete Stack (Careful!)
```bash
aws cloudformation delete-stack --stack-name color-code-research-hub --profile personal --region us-east-1
```

## Environment Variables

Set in template.yaml for each function:
- `ENVIRONMENT`: production
- `SECRETS_ARN`: Reference to Secrets Manager
- `JOBS_TABLE_NAME`: DynamoDB table name
- `ORCHESTRATOR_FUNCTION_NAME`: For async invocation
- `ANTHROPIC_API_KEY`: From Secrets Manager

## Important Configuration

### Lambda Timeouts
- Default: 30 seconds (API Gateway limit)
- PlanOrchestrator: 900 seconds (15 minutes)

### Memory Allocation
- Small functions: 128MB
- PlanOrchestrator: 3008MB (for heavy processing)

### Reserved Concurrency
- PlanOrchestrator: 5 (prevent overwhelming system)

## Monitoring

### CloudFormation Stack
```bash
aws cloudformation describe-stacks --stack-name color-code-research-hub --profile personal --region us-east-1
```

### Stack Events (for debugging)
```bash
aws cloudformation describe-stack-events --stack-name color-code-research-hub --profile personal --region us-east-1 --max-items 20
```

### Outputs
```bash
aws cloudformation describe-stacks --stack-name color-code-research-hub --profile personal --region us-east-1 --query 'Stacks[0].Outputs'
```

## Troubleshooting Deployment

### "No changes to deploy"
- Make a small change to force update (add comment)
- Or delete .aws-sam/ and rebuild

### "Insufficient capabilities"
- Ensure `--capabilities CAPABILITY_IAM` is included

### Timeout during deployment
- Use `--no-confirm-changeset` to skip confirmation
- Check CloudFormation console for stuck resources

### Build failures
- Check Node.js version (should be 18.x)
- Verify package.json in lambda/handlers/
- Use `sam build --use-container` for consistency