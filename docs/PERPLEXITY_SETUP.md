# Perplexity API Setup Instructions

## Overview
The Research API Lambda function has been replaced with a new Python implementation that directly integrates with the Perplexity AI API. This eliminates the dependency on the EC2 Claude Flow instance and provides immediate research results.

## Prerequisites

### 1. Create Perplexity API Key
1. Sign up for a Perplexity AI account at https://www.perplexity.ai/
2. Navigate to API settings and generate an API key
3. Keep this key secure - you'll need it for the next step

### 2. Add API Key to AWS Secrets Manager

Run the following AWS CLI command to create the secret:

```bash
aws secretsmanager create-secret \
  --name perplexity-key \
  --description "Perplexity AI API key for Research Lambda" \
  --secret-string '{"api_key":"YOUR_PERPLEXITY_API_KEY_HERE","perplexity_key":"YOUR_PERPLEXITY_API_KEY_HERE"}' \
  --region us-east-1 \
  --profile personal
```

Note: The secret includes both `api_key` and `perplexity_key` fields for compatibility.

## Deployment Steps

### 1. Deploy the Lambda Function

From the infrastructure directory:

```bash
cd /Users/williamprior/Development/GitHub/color-code-research-hub/infrastructure
./deploy.sh
```

Or manually:

```bash
sam build --parallel --cached
sam deploy --profile personal --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1
```

### 2. Verify Deployment

Check that the following resources were created:
- Lambda Function: `color-code-research-hub-ResearchApiFunction-*`
- S3 Bucket: `color-code-research-results-{ACCOUNT_ID}`
- API Gateway Route: `POST /api/research`

## API Usage

### Request Format

```json
{
  "content": "Your research question or task",
  "title": "Optional title for the research",
  "model": "sonar-deep-research",
  "reasoning_effort": "high",
  "tags": ["optional", "tags"],
  "requester": "Optional requester name"
}
```

### Response Format

```json
{
  "success": true,
  "research_id": "abc12345",
  "content": "The detailed research results...",
  "metadata": {
    "title": "Research Request",
    "requester": "Unknown",
    "tags": [],
    "model": "sonar-deep-research",
    "reasoning_effort": "high"
  },
  "s3_location": "s3://color-code-research-results-{ACCOUNT_ID}/research/20240315_120000_abc12345.json",
  "model_used": "sonar-deep-research",
  "timestamp": "2024-03-15T12:00:00.000Z"
}
```

## Features

### Immediate Results
Unlike the previous proxy implementation, the new API returns results immediately without requiring polling.

### S3 Storage
All research results are automatically stored in S3 with:
- Encryption at rest (AES256)
- Versioning enabled
- 90-day lifecycle policy for automatic cleanup
- Organized by timestamp and research ID

### Error Handling
The Lambda function includes comprehensive error handling for:
- Missing API keys
- Invalid request formats
- Perplexity API errors
- S3 upload failures (non-blocking)

## Monitoring

### CloudWatch Logs
Monitor the Lambda function logs:
```bash
aws logs tail /aws/lambda/color-code-research-hub-ResearchApiFunction-* --profile personal --region us-east-1 --follow
```

### S3 Storage
View stored research results:
```bash
aws s3 ls s3://color-code-research-results-$(aws sts get-caller-identity --query Account --output text --profile personal)/ --profile personal
```

## Troubleshooting

### Common Issues

1. **403 Forbidden**: Check that the Perplexity API key is correctly stored in Secrets Manager
2. **500 Internal Server Error**: Check CloudWatch logs for detailed error messages
3. **S3 Access Denied**: Ensure the Lambda function has proper S3 permissions

### Testing the API

```bash
curl -X POST https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "content": "What are the latest developments in quantum computing?",
    "title": "Quantum Computing Research",
    "model": "sonar-deep-research",
    "reasoning_effort": "high"
  }'
```

## Cost Considerations

- **Perplexity API**: Charges per API call based on your subscription plan
- **Lambda**: ~$0.20 per 1M requests + compute time
- **S3**: ~$0.023 per GB stored per month
- **Secrets Manager**: $0.40 per secret per month

## Security Notes

- API keys are stored securely in AWS Secrets Manager
- Lambda function uses IAM roles with least privilege
- S3 bucket has public access blocked
- All data is encrypted at rest