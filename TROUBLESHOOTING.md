# Troubleshooting Guide - Color Code Research Hub

> **Last Updated**: January 8, 2025
> **Version**: 2.1.0

## 🔍 Common Issues and Solutions

## 🆕 Recent Fixes (January 2025)

### Innovation Pipeline CORS Fix (Jan 8, 2025)
**Issue**: IDEATE button failed with CORS errors
**Root Cause**: Lambda functions missing CORS headers in responses
**Solution**: Added CORS headers to all Lambda responses:
```python
headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
}
```

### DynamoDB Field Mapping Fix (Jan 8, 2025)
**Issue**: Target and Duration columns showing "N/A"
**Root Cause**: Frontend looking for wrong field names
**Solution**: Updated frontend to use correct DynamoDB fields:
- Target: `report.objective` (was looking for metadata.vendorName)
- Duration: `report.processingTimeMs` (was looking for pipelineDurationSeconds)

### Research Not Found Error (Jan 8, 2025)
**Issue**: Pipeline API returning 404 "Research not found"
**Root Cause**: Backend validating if research exists before allowing job
**Temporary Fix**: Remove validation check in Lambda
**Proper Fix**: Create research record before submitting pipeline job

### Frontend Issues

#### 1. CORS Errors
**Symptom**: "Access to fetch at '...' from origin '...' has been blocked by CORS policy"

**Common Causes**:
- Lambda function not connected to API Gateway routes
- OPTIONS preflight requests returning 500 errors
- Incorrect CORS headers in Lambda responses
- AllowCredentials set to true with wildcard origin

**Solutions**:
1. **Ensure Lambda has Events section in SAM template**:
```yaml
ResearchApiFunction:
  Type: AWS::Serverless::Function
  Properties:
    # ... other properties
  Events:
    ResearchEndpoint:
      Type: Api
      Properties:
        RestApiId: !Ref ResearchHubApi
        Path: /api/research
        Method: POST
    OptionsResearch:
      Type: Api
      Properties:
        RestApiId: !Ref ResearchHubApi
        Path: /api/research
        Method: OPTIONS
```

2. **Check Lambda responses include CORS headers**:
```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key,Accept',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS,PUT,DELETE',
  'Access-Control-Max-Age': '86400'
};
```

3. **Add global CORS to API Gateway (SAM template)**:
```yaml
ResearchHubApi:
  Type: AWS::Serverless::Api
  Properties:
    StageName: production
    Cors:
      AllowOrigin: "'*'"
      AllowHeaders: "'Content-Type,Authorization,X-Api-Key,Accept'"
      AllowMethods: "'GET,POST,OPTIONS,PUT,DELETE'"
      MaxAge: "'86400'"
```

4. **Handle OPTIONS requests in Lambda**:
```javascript
if (event.httpMethod === 'OPTIONS') {
    return {
        statusCode: 200,
        headers: corsHeaders,
        body: ''
    };
}
```

5. **Verify environment variable**: `VITE_API_BASE_URL` (not `VITE_API_URL`)

#### 2. Frontend Not Updating After Push
**Symptom**: Changes pushed to GitHub but not reflected on live site

**Solutions**:
1. Check Amplify console: https://console.aws.amazon.com/amplify/
2. Verify build is triggered and successful
3. Clear browser cache
4. Check build logs for errors

### Lambda Function Issues

#### 1. "Cannot use import statement outside a module"
**Symptom**: Lambda fails with ES6 module syntax error

**Solution**: Convert to CommonJS:
```javascript
// ❌ Wrong
import { something } from 'module';
export const handler = async (event) => {};

// ✅ Correct
const { something } = require('module');
exports.handler = async (event) => {};
```

#### 2. DynamoDB "removeUndefinedValues" Error
**Symptom**: "Pass options.removeUndefinedValues=true to remove undefined values"

**Solution**:
```javascript
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});
```

#### 3. API Gateway Timeout (504)
**Symptom**: Request takes longer than 30 seconds

**Solutions**:
- Use async pattern (StartPlanGeneration → PlanOrchestrator)
- Optimize Lambda to respond within 30 seconds
- Return partial results and continue processing

#### 4. Claude API 529 (Overloaded)
**Symptom**: "Claude API overloaded" errors

**Solution**: Already implemented OpenAI fallback:
- Check OpenAI key in Secrets Manager
- Monitor fallback usage in logs
- Implement additional retry logic if needed

### Deployment Issues

#### 1. SAM Deploy Fails
**Symptom**: "No changes to deploy" or deployment errors

**Solutions**:
```bash
# Force rebuild
rm -rf .aws-sam/
sam build
sam deploy --profile personal --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1

# If still failing, check:
- AWS credentials: aws sts get-caller-identity --profile personal
- Stack status: aws cloudformation describe-stacks --stack-name color-code-research-hub --profile personal
```

#### 2. Lambda Not Updating
**Symptom**: Code changes not reflected after deployment

**Solutions**:
1. Ensure you're in the correct directory: `/infrastructure`
2. Check CloudFormation events for errors
3. Verify Lambda code hash changed
4. Force update by adding a comment

### Async Plan Generation Issues

#### 1. Job Stuck in INITIATED Status
**Symptom**: Job never progresses beyond INITIATED

**Debugging Steps**:
1. Check StartPlanGeneration logs:
```bash
aws logs tail /aws/lambda/color-code-research-hub-StartPlanGenerationFunctio-MlPGGj2Ujrce --profile personal --region us-east-1 --since 5m
```

2. Check PlanOrchestrator logs:
```bash
aws logs tail /aws/lambda/color-code-research-hub-PlanOrchestratorFunction-rN76TKbv9Rx0 --profile personal --region us-east-1 --since 5m
```

3. Verify DynamoDB record:
```bash
aws dynamodb get-item --table-name PlanGenerationJobs-production --key '{"jobId":{"S":"your-job-id"}}' --profile mvp --region us-east-1
```

#### 2. Missing Environment Variables
**Symptom**: "Environment variable not found" errors

**Check Lambda configuration**:
```bash
aws lambda get-function-configuration --function-name color-code-research-hub-PlanOrchestratorFunction-XXX --profile mvp --region us-east-1 | jq .Environment.Variables
```

### GitHub Integration Issues

#### 1. "Failed to create GitHub issues"
**Symptom**: Issues not created in repository

**Debugging**:
1. Check GitHub PAT in Secrets Manager
2. Verify repository permissions
3. Check rate limits (5000/hour)
4. Review error details in Lambda logs

## 🛠️ Debugging Commands

### View Lambda Logs
```bash
# List all Lambda functions
aws lambda list-functions --profile mvp --region us-east-1 | jq '.Functions[].FunctionName' | grep color-code

# Get recent logs
aws logs tail /aws/lambda/{function-name} --profile mvp --region us-east-1 --since 10m

# Search for errors
aws logs tail /aws/lambda/{function-name} --profile mvp --region us-east-1 --since 1h | grep -i error
```

### Check DynamoDB
```bash
# Scan for recent jobs
aws dynamodb scan --table-name PlanGenerationJobs-production --profile mvp --region us-east-1 --limit 5

# Get specific job
aws dynamodb get-item --table-name PlanGenerationJobs-production --key '{"jobId":{"S":"job-id"}}' --profile mvp --region us-east-1

# Scan ResearchReports table
aws dynamodb scan --table-name ResearchReports --profile mvp --region us-east-1 --limit 5
```

### Test API Endpoints
```bash
# Health check (Main API)
curl https://zi612qxxv0.execute-api.us-east-1.amazonaws.com/production/health

# Test Pipeline API
curl -X POST https://9hv22ga3uh.execute-api.us-east-1.amazonaws.com/prod/submit \
  -H "Content-Type: application/json" \
  -d '{"researchId": "test-123"}' -v

# Start async job
curl -X POST https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/plan/async/start \
  -H "Content-Type: application/json" \
  -d '{"metadata":{...},"readmeContent":"..."}'
```

## 📞 Support Escalation

If issues persist:

1. **Check CloudWatch Logs** for detailed error messages
2. **Review CloudFormation Stack** events for deployment issues
3. **Verify IAM Permissions** for Lambda execution role
4. **Check Secrets Manager** for API key issues
5. **Monitor API Gateway** metrics for throttling

## 🔄 Quick Fixes

### Reset Everything
```bash
# Redeploy all infrastructure
cd /Users/williamprior/Development/GitHub/color-code-research-hub/infrastructure
sam build --use-container
sam deploy --profile personal --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1

# Clear DynamoDB (careful!)
aws dynamodb scan --table-name PlanGenerationJobs-production --profile personal --region us-east-1 | jq -r '.Items[].jobId.S' | xargs -I {} aws dynamodb delete-item --table-name PlanGenerationJobs-production --key '{"jobId":{"S":"{}"}}' --profile personal --region us-east-1
```

### Force Frontend Rebuild
```bash
# Trigger Amplify rebuild
git commit --allow-empty -m "Force Amplify rebuild"
git push origin main
```