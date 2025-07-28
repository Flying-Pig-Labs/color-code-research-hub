# Claude Flow Research API Key Configuration

## Overview
This document contains the API key information for the Claude Flow Research integration.

## API Key Details

**API Key**: `6c51ae9afdd2e199772c6d5bce55d21d0e60bf7ec058e1e8b12e6f0181c17683`

**Purpose**: This API key authenticates requests between the Color Code Research Hub and the Claude Flow service running on EC2.

## AWS Secrets Manager

The API key is securely stored in AWS Secrets Manager:

- **Secret Name**: `claude-flow-research-api-key`
- **ARN**: `arn:aws:secretsmanager:us-east-1:984906149037:secret:claude-flow-research-api-key-0GjVNO`
- **Region**: us-east-1
- **Format**: JSON with key `api_key`

## Architecture

```
Frontend (Amplify)
    ↓ (includes API key in header)
API Gateway
    ↓
Lambda Proxy (retrieves key from Secrets Manager)
    ↓ (adds X-API-Key header)
EC2 Claude Flow (validates API key)
```

## How It Works

1. **Frontend** makes requests to API Gateway (no API key needed from frontend)
2. **Lambda Proxy** retrieves the API key from AWS Secrets Manager
3. **Lambda** adds the `X-API-Key` header to all requests to EC2
4. **EC2 Claude Flow** validates the API key and processes the request

## For Ram's EC2 Configuration

Add this API key to your EC2 Claude Flow configuration to validate incoming requests:

```bash
# In your EC2 Claude Flow .env or configuration
API_KEY=6c51ae9afdd2e199772c6d5bce55d21d0e60bf7ec058e1e8b12e6f0181c17683
```

## Endpoints

All endpoints require the `X-API-Key` header:

- `POST /api/claude-flow/research` - Submit research request
- `GET /api/claude-flow/execution/{request_id}` - Check execution status
- `GET /api/claude-flow/executions` - List all executions

## Security Notes

- The API key is never exposed to the frontend
- Lambda retrieves it securely from Secrets Manager
- The key is cached in Lambda memory for performance
- EC2 should validate this key on all protected endpoints

## Updating the API Key

To rotate or update the API key:

1. Update the secret in AWS Secrets Manager:
   ```bash
   aws secretsmanager update-secret \
     --secret-id claude-flow-research-api-key \
     --secret-string '{"api_key":"new-api-key-here"}' \
     --profile mvp \
     --region us-east-1
   ```

2. Update Ram's EC2 configuration with the new key
3. Lambda will automatically use the new key (may take a few minutes due to caching)