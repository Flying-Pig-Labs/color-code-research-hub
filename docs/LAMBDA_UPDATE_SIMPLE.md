# Lambda Update for Simplified S3 Structure

## New Structure

```
users/
└── fprior/
    └── research/
        └── {research_id}/          # e.g., research_a1b2c3d4e5f6
            ├── request.json        # Original request
            ├── response.json       # API response
            └── metadata.json       # Combined metadata
```

## Key Changes

### 1. Research ID as S3 Prefix
- Generate unique `research_id` (e.g., `research_a1b2c3d4e5f6`)
- Use as S3 folder: `users/fprior/research/{research_id}/`
- Store this prefix in DynamoDB

### 2. DynamoDB Record Structure
```json
{
  "reportId": "research_a1b2c3d4e5f6",
  "userId": "fprior",
  "s3Prefix": "users/fprior/research/research_a1b2c3d4e5f6",
  "s3Bucket": "color-code-research-results-984906149037",
  "s3Files": {
    "request": "users/fprior/research/research_a1b2c3d4e5f6/request.json",
    "response": "users/fprior/research/research_a1b2c3d4e5f6/response.json",
    "metadata": "users/fprior/research/research_a1b2c3d4e5f6/metadata.json"
  },
  "contentSummary": "First 500 chars of response...",
  "createdAt": "2025-08-05T12:00:00Z"
}
```

### 3. Benefits
- ✅ Clean organization: All files for one research in one folder
- ✅ Easy retrieval: Just need the research_id to find everything
- ✅ Simple structure: No complex date hierarchies
- ✅ User-scoped: Ready for multi-user support

## Implementation Steps

### Step 1: Update researchApi.py

Replace the `upload_to_s3` function with the new version that:
1. Creates a research folder
2. Uploads three separate files
3. Returns the S3 prefix

### Step 2: Update DynamoDB Schema

Add these fields to records:
- `s3Prefix`: The folder path in S3
- `userId`: The user who created it
- `s3Files`: Map of file types to S3 keys

### Step 3: Test

```bash
# Create a test research request
curl -X POST https://zi612qxxv0.execute-api.us-east-1.amazonaws.com/production/api/research \
  -H "Content-Type: application/json" \
  -H "X-User-Id: fprior" \
  -d '{"content": "Test research with new structure"}'

# Response should include:
{
  "research_id": "research_a1b2c3d4e5f6",
  "s3_prefix": "users/fprior/research/research_a1b2c3d4e5f6"
}

# Check S3
aws s3 ls s3://color-code-research-results-984906149037/users/fprior/research/research_a1b2c3d4e5f6/ --profile mvp

# Should show:
# request.json
# response.json  
# metadata.json
```

## Frontend Changes

The frontend can now:
1. Store just the `research_id`
2. Display research using the ID
3. Know that all files are under `users/fprior/research/{research_id}/`

## Migration for Old Data

Old files like `research/20250804_201905_81c6bf35.json` can be migrated to:
`users/fprior/research/research_81c6bf35/response.json`

The research_id can be extracted from the old filename.