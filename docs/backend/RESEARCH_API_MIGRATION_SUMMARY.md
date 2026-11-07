# Research API Migration Summary

## Overview
Successfully replaced the ResearchProxy Lambda function (which proxied to EC2 Claude Flow) with a new Python-based ResearchApi Lambda that directly integrates with Perplexity AI.

## What Was Changed

### 1. **New Lambda Function** (`lambda/handlers/researchApi.py`)
- Written in Python 3.11
- Direct integration with Perplexity AI API
- Retrieves API key from AWS Secrets Manager (`perplexity-key`)
- Uploads research results to S3 for long-term storage
- Returns results immediately (no polling required)
- Comprehensive error handling and CORS support

### 2. **Infrastructure Updates** (`infrastructure/template.yaml`)
- Replaced `ResearchProxyFunction` with `ResearchApiFunction`
- Added S3 bucket (`ResearchResultsBucket`) with:
  - Encryption at rest
  - Versioning enabled
  - 90-day lifecycle policy
  - Public access blocked
- Updated API routes from `/api/claude-flow/research` to `/api/research`
- Added proper IAM permissions for Secrets Manager and S3

### 3. **Frontend Updates** (`src/services/researchApi.ts`)
- Updated API endpoint to `/api/research`
- Modified request payload to match Perplexity API format
- Updated response handling for immediate results
- Removed dependency on polling mechanism
- Maintained backward compatibility

### 4. **Documentation**
- Created comprehensive setup guide (`docs/PERPLEXITY_SETUP.md`)
- Includes API key setup, deployment steps, and troubleshooting

## Key Benefits

1. **Simplified Architecture**: No longer depends on EC2 Claude Flow instance
2. **Immediate Results**: API returns research immediately (no polling)
3. **Cost Efficient**: Only pay for Lambda invocations and Perplexity API calls
4. **Better Reliability**: Direct API integration with proper error handling
5. **Data Persistence**: All research results stored in S3 for future reference
6. **Security**: API keys stored in Secrets Manager, least-privilege IAM roles

## Next Steps

### Required Actions:
1. **Add Perplexity API Key to Secrets Manager**:
   ```bash
   aws secretsmanager create-secret \
     --name perplexity-key \
     --description "Perplexity AI API key for Research Lambda" \
     --secret-string '{"api_key":"YOUR_KEY_HERE","perplexity_key":"YOUR_KEY_HERE"}' \
     --region us-east-1 \
     --profile personal
   ```

2. **Deploy the Changes**:
   ```bash
   cd infrastructure
   ./deploy.sh
   ```

3. **Push Frontend Changes**:
   ```bash
   git push origin main
   ```

### Testing:
```bash
# Test the new API
curl -X POST https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Test research query",
    "title": "Test",
    "model": "sonar-deep-research",
    "reasoning_effort": "high"
  }'
```

## Files Modified
- `lambda/handlers/researchApi.py` (new)
- `lambda/handlers/requirements.txt` (new)
- `lambda/handlers/__init__.py` (new)
- `infrastructure/template.yaml`
- `src/services/researchApi.ts`
- `docs/PERPLEXITY_SETUP.md` (new)

## Removed Dependencies
- No longer requires EC2 Claude Flow instance
- Removed proxy endpoint dependencies
- Eliminated polling mechanism