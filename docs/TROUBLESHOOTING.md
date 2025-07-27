# 🔧 Troubleshooting Guide - Color Code Research Hub

> **Solutions to common issues and frequently asked questions**

## 📋 Table of Contents

- [Quick Fixes](#quick-fixes)
- [Frontend Issues](#frontend-issues)
- [Backend Issues](#backend-issues)
- [Plan Generation Issues](#plan-generation-issues)
- [Claude Flow Issues](#claude-flow-issues)
- [GitHub Integration Issues](#github-integration-issues)
- [Deployment Issues](#deployment-issues)
- [Performance Issues](#performance-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Development Environment Issues](#development-environment-issues)
- [Common Error Messages](#common-error-messages)
- [FAQ](#faq)
- [Getting Help](#getting-help)

## Quick Fixes

### 🚀 Top 5 Quick Solutions

1. **500 Error on Plan Generation**
   ```bash
   # The UI is calling the wrong endpoint. Use CLI endpoint instead:
   # Change: /api/plan/generate-phases
   # To: /api/plan/generate-cli-plan
   ```

2. **Frontend Not Loading**
   ```bash
   # Check environment variable
   echo $VITE_API_BASE_URL
   # Should be: https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production
   ```

3. **Lambda Timeout Errors**
   ```bash
   # Use async endpoints for long operations
   # POST /api/plan/async/start instead of sync endpoints
   ```

4. **CORS Errors**
   ```bash
   # Ensure API Gateway CORS is configured
   # Check Lambda response includes CORS headers
   ```

5. **Module Import Errors**
   ```javascript
   // Lambda uses CommonJS, not ES6
   // Wrong: import { handler } from './handler'
   // Right: const { handler } = require('./handler')
   ```

## Frontend Issues

### React Application Won't Start

**Problem**: `npm run dev` fails to start

**Solutions**:
1. Check Node version:
   ```bash
   node --version  # Should be 18.x
   nvm use 18
   ```

2. Clear node_modules:
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. Check port availability:
   ```bash
   lsof -i :3000  # Check if port is in use
   ```

### Build Failures

**Problem**: `npm run build` fails

**Common Causes & Solutions**:

1. **TypeScript Errors**:
   ```bash
   npm run typecheck  # Check for type errors
   ```

2. **Missing Environment Variables**:
   ```bash
   # Create .env.local
   VITE_API_BASE_URL=https://your-api-url
   ```

3. **Import Path Issues**:
   ```typescript
   // Use absolute imports
   import { Component } from '@/components/Component'
   // Not: import { Component } from '../../../components/Component'
   ```

### Styling Not Applied

**Problem**: Tailwind classes not working

**Solution**:
```javascript
// Check tailwind.config.js content paths
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
]
```

### Component Not Updating

**Problem**: State changes not reflecting in UI

**Solutions**:
```typescript
// Ensure immutable state updates
setState(prev => ({
  ...prev,
  newField: value
}));

// Check key prop for lists
items.map(item => <Item key={item.id} />)
```

## Backend Issues

### Lambda Function Errors

#### Handler Not Found

**Error**: `Runtime.HandlerNotFound`

**Solution**:
```javascript
// Check handler export
module.exports.handler = async (event) => {
  // handler code
};

// SAM template handler format: filename.handler
Handler: planGeneratorCLI.handler
```

#### Memory Exceeded

**Error**: `Runtime.ExitError - signal: killed`

**Solution**:
```yaml
# Increase memory in template.yaml
Properties:
  MemorySize: 3008  # Max: 10240
```

#### Timeout Errors

**Error**: `Task timed out after 30.00 seconds`

**Solutions**:
1. Increase timeout:
   ```yaml
   Properties:
     Timeout: 900  # Max for async
   ```

2. Use async pattern:
   ```javascript
   // Start async job
   const { jobId } = await startAsyncJob();
   // Return immediately
   return { statusCode: 202, body: JSON.stringify({ jobId }) };
   ```

### API Gateway Issues

#### Request Too Large

**Error**: `413 Request Entity Too Large`

**Solution**:
```yaml
# API Gateway limit is 10MB
# Compress large payloads or use S3 presigned URLs
```

#### Missing CORS Headers

**Error**: CORS policy blocking request

**Solution**:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

return {
  statusCode: 200,
  headers: corsHeaders,
  body: JSON.stringify(data)
};
```

## Plan Generation Issues

### Only 2 Epics Generated

**Problem**: Plan shows only 2 placeholder epics instead of 40-80

**Root Cause**: Using V2 endpoint which is limited by timeout

**Solution**:
```javascript
// Use CLI endpoint
const response = await fetch('/api/plan/generate-cli-plan', {
  method: 'POST',
  body: JSON.stringify({
    projectInfo: metadata,  // Note: 'projectInfo' not 'metadata'
    readmeContent: readme
  })
});
```

### Async Generation Not Completing

**Problem**: Job stays in PROCESSING forever

**Debugging Steps**:
1. Check CloudWatch logs:
   ```bash
   aws logs tail /aws/lambda/color-code-research-hub-PlanOrchestratorFunction
   ```

2. Check DynamoDB job record:
   ```bash
   aws dynamodb get-item \
     --table-name PlanGenerationJobs \
     --key '{"jobId":{"S":"your-job-id"}}'
   ```

3. Common causes:
   - LLM rate limiting
   - Invalid API keys
   - Malformed input data

### Rate Limiting Errors

**Error**: Claude API returns 429 or 529

**Solutions**:
1. Implement retry logic (already in orchestrator)
2. Use OpenAI fallback
3. Add delays between calls:
   ```javascript
   await new Promise(resolve => setTimeout(resolve, 2000));
   ```

## Claude Flow Issues

### EC2 Backend Unreachable

**Error**: `ECONNREFUSED 18.209.36.58:8080`

**Solutions**:
1. Check EC2 instance status
2. Verify security group allows port 8080
3. Check Claude Flow service is running:
   ```bash
   ssh ec2-user@18.209.36.58
   sudo systemctl status claude-flow
   ```

### Execution Logs Not Loading

**Problem**: Can't fetch execution logs

**Solution**:
```javascript
// Use the new Lambda endpoints
const logs = await fetch(`/api/claude-flow/execution/${id}/logs`);
// Not the S3 URLs directly
```

### Swarm Not Starting

**Problem**: Swarm execution fails to start

**Common Causes**:
1. Invalid command syntax
2. Insufficient resources
3. Memory store full

**Debug**:
```javascript
// Check swarm status first
const status = await fetch('/api/claude-flow/swarm-status');
console.log('Available agents:', status.availableAgents);
console.log('System load:', status.systemLoad);
```

## GitHub Integration Issues

### Repository Not Found

**Error**: 404 when fetching repos

**Solutions**:
1. Check GitHub token permissions:
   - Needs `repo` scope
   - Needs `read:user` scope

2. Verify token in Secrets Manager:
   ```bash
   aws secretsmanager get-secret-value \
     --secret-id github_token
   ```

### README Fetch Fails

**Problem**: Can't get repository README

**Solutions**:
```javascript
// Check multiple README locations
const readmeFiles = [
  'README.md',
  'readme.md',
  'README.markdown',
  'docs/README.md'
];
```

### Issue Creation Fails

**Error**: Can't create GitHub issues

**Common Causes**:
1. No write permissions to repository
2. Rate limited (5000 requests/hour)
3. Issue already exists

## Deployment Issues

### SAM Deploy Fails

#### Stack Already Exists

**Error**: `Stack color-code-research-hub already exists`

**Solution**:
```bash
# Update existing stack
sam deploy --no-confirm-changeset

# Or delete and recreate
aws cloudformation delete-stack --stack-name color-code-research-hub
```

#### IAM Permission Errors

**Error**: `User is not authorized to perform: iam:CreateRole`

**Solution**:
Ensure your AWS user has these permissions:
- CloudFormation full access
- IAM role creation
- Lambda full access
- API Gateway full access
- DynamoDB full access

### Frontend Deploy Issues

#### Amplify Build Fails

**Problem**: Build fails in Amplify Console

**Solutions**:
1. Check build logs in Amplify Console
2. Ensure environment variables are set
3. Match Node version with local:
   ```yaml
   # amplify.yml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - nvm use 18
   ```

## Performance Issues

### Slow API Responses

**Problem**: API calls taking too long

**Solutions**:
1. **Lambda Cold Starts**:
   ```yaml
   # Add provisioned concurrency
   Properties:
     ProvisionedConcurrencyConfig:
       ProvisionedConcurrentExecutions: 2
   ```

2. **Database Queries**:
   ```javascript
   // Use projection expressions
   ProjectionExpression: 'jobId, status, updatedAt'
   ```

3. **Memory Allocation**:
   ```yaml
   # Increase memory for CPU
   MemorySize: 1024  # More memory = more CPU
   ```

### High Lambda Costs

**Problem**: AWS bill higher than expected

**Solutions**:
1. Set reserved concurrency limits
2. Implement caching
3. Use appropriate memory sizing
4. Enable X-Ray to find bottlenecks

## Database Issues

### DynamoDB Throttling

**Error**: `ProvisionedThroughputExceededException`

**Solution**:
```yaml
# Use on-demand billing
BillingMode: PAY_PER_REQUEST
```

### TTL Not Working

**Problem**: Old jobs not being deleted

**Solution**:
```bash
# Enable TTL on table
aws dynamodb update-time-to-live \
  --table-name PlanGenerationJobs \
  --time-to-live-specification \
    Enabled=true,AttributeName=ttl
```

## Authentication Issues

### Secrets Manager Access Denied

**Error**: `AccessDeniedException: User is not authorized to perform: secretsmanager:GetSecretValue`

**Solution**:
```yaml
# Add to Lambda role policy
Policies:
  - Version: '2012-10-17'
    Statement:
      - Effect: Allow
        Action:
          - secretsmanager:GetSecretValue
        Resource: !Sub 'arn:aws:secretsmanager:${AWS::Region}:${AWS::AccountId}:secret:*'
```

### API Key Issues

**Problem**: LLM API calls failing

**Solutions**:
1. Verify key in Secrets Manager:
   ```bash
   aws secretsmanager get-secret-value --secret-id anthropic_key
   ```

2. Check key format:
   ```json
   {
     "anthropic_key": "sk-ant-api03-..."
   }
   ```

## Development Environment Issues

### Local Testing Problems

#### SAM Local Not Working

**Problem**: `sam local start-api` fails

**Solutions**:
1. Ensure Docker is running
2. Check port 3001 is free
3. Use environment file:
   ```bash
   sam local start-api --env-vars env.json
   ```

#### Environment Variables Not Loading

**Problem**: `import.meta.env.VITE_API_BASE_URL` is undefined

**Solution**:
```bash
# Create .env.local (not .env)
VITE_API_BASE_URL=http://localhost:3001
# Restart dev server
```

## Common Error Messages

### "Cannot use import statement outside a module"

**Context**: Lambda function error

**Solution**:
```javascript
// Use CommonJS in Lambda
const AWS = require('aws-sdk');
module.exports.handler = async (event) => {};
```

### "Missing required key 'jobId' in params"

**Context**: DynamoDB error

**Solution**:
```javascript
// Ensure correct key structure
Key: {
  jobId: { S: jobId }  // Note the type descriptor
}
```

### "The provided key element does not match the schema"

**Context**: DynamoDB query error

**Solution**:
```javascript
// Use correct attribute types
const params = {
  TableName: 'PlanGenerationJobs',
  Key: {
    jobId: jobId  // DocumentClient handles type conversion
  }
};
```

## FAQ

### General Questions

**Q: Why does plan generation take so long?**
A: The system makes 50-90 LLM calls to generate comprehensive plans. This ensures high quality but takes 15-20 minutes.

**Q: Can I use my own OpenAI/Anthropic API keys?**
A: Yes, update the keys in AWS Secrets Manager.

**Q: Why are there two plan generation endpoints?**
A: V2 was created for API Gateway's 30-second timeout. The CLI endpoint is recommended for full functionality.

**Q: How much does it cost to run?**
A: With typical usage:
- Lambda: ~$5-10/month
- DynamoDB: ~$2-5/month  
- API Gateway: ~$3-5/month
- LLM APIs: Variable based on usage

### Technical Questions

**Q: Why use CommonJS instead of ES6 modules?**
A: AWS Lambda Node.js 18 runtime uses CommonJS by default. ES6 modules require additional configuration.

**Q: Can I increase the API Gateway timeout?**
A: No, 30 seconds is the hard limit. Use async patterns for longer operations.

**Q: Why is the EC2 backend separate?**
A: Claude Flow requires persistent processes and resources that don't fit the serverless model.

**Q: How do I add a new LLM provider?**
A: Implement the provider in `llm-orchestrator-service.js` following the existing pattern for Claude/OpenAI.

### Troubleshooting Questions

**Q: How do I check if the system is healthy?**
A: Use these health check endpoints:
- GET /health - Basic health
- GET /api/claude-flow/health - Claude Flow health

**Q: Where are the logs?**
A: CloudWatch Logs under `/aws/lambda/function-name`

**Q: How do I debug Lambda functions locally?**
A: Use SAM local with debug port:
```bash
sam local start-api --debug-port 5858
```

## Getting Help

### 📚 Resources

1. **Documentation**:
   - [Main Documentation Hub](./README.md)
   - [API Documentation](./API_DOCUMENTATION.md)
   - [Architecture Overview](./ARCHITECTURE.md)

2. **Source Code**:
   - [GitHub Repository](https://github.com/your-org/color-code-research-hub)
   - [Lambda Handlers](../lambda/handlers/)
   - [Frontend Components](../src/components/)

3. **AWS Resources**:
   - [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#logsV2:log-groups)
   - [Lambda Console](https://console.aws.amazon.com/lambda/home?region=us-east-1)
   - [DynamoDB Console](https://console.aws.amazon.com/dynamodbv2/home?region=us-east-1)

### 🐛 Reporting Issues

When reporting issues, please include:

1. **Error messages** (full stack trace)
2. **Steps to reproduce**
3. **Environment details** (browser, Node version)
4. **Relevant logs** (CloudWatch, browser console)
5. **Expected vs actual behavior**

### 💬 Support Channels

- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and help
- **Email**: support@colorcode.ai

### 🔍 Debug Checklist

Before asking for help, check:

- [ ] CloudWatch logs for errors
- [ ] Browser console for frontend errors
- [ ] Network tab for failed API calls
- [ ] Environment variables are set correctly
- [ ] AWS credentials are valid
- [ ] API keys are not expired
- [ ] You're using the latest code

---

> 💡 **Pro Tip**: Most issues are caused by misconfiguration. Double-check your environment variables and AWS credentials first!