# 🚨 URGENT: Lambda Functions Still Using Old S3 Paths

## Current Status

**PROBLEM**: While we migrated 2,611 existing files to the new user-based structure, the Lambda functions are STILL writing new content to the old locations!

## Lambda Functions That Need Updates

### 1. researchApi.py (Line 70)
**Current Code**:
```python
s3_key = f"research/{timestamp}_{research_id}.json"
```

**Should Be**:
```python
# Extract user from event headers or default
user_id = event.get('headers', {}).get('X-User-Id', 'fprior')
scope = event.get('headers', {}).get('X-Scope', 'personal')

# Generate time-based path
now = datetime.now(timezone.utc)
year = now.strftime("%Y")
month = now.strftime("%m") 
day = now.strftime("%d")

# Build user-based path
if scope == 'personal':
    s3_key = f"users/{user_id}/personal/research/{year}/{month}/{day}/{research_id}/response.json"
else:
    project_id = event.get('headers', {}).get('X-Project-Id', 'default')
    s3_key = f"users/{user_id}/projects/{project_id}/research/{year}/{month}/{day}/{research_id}/response.json"
```

### 2. reportProcessor.js (Line 132)
**Current Code**:
```javascript
const s3Key = `reports/${team}_${timestamp}_${requestId}.json`;
```

**Should Be**:
```javascript
// Extract user context from event
const userId = event.headers?.['X-User-Id'] || 'fprior';
const scope = event.headers?.['X-Scope'] || 'personal';

// Generate date-based path
const now = new Date();
const year = now.getUTCFullYear();
const month = String(now.getUTCMonth() + 1).padStart(2, '0');
const day = String(now.getUTCDate()).padStart(2, '0');

// Build user-based path
let s3Key;
if (scope === 'team' && team) {
    s3Key = `teams/${team}/reports/${year}/${month}/${day}/${requestId}/processed.json`;
} else if (scope === 'project') {
    const projectId = event.headers?.['X-Project-Id'] || 'default';
    s3Key = `users/${userId}/projects/${projectId}/reports/${year}/${month}/${day}/${requestId}/processed.json`;
} else {
    s3Key = `users/${userId}/personal/reports/${year}/${month}/${day}/${requestId}/processed.json`;
}
```

### 3. generateResearchReport.js (Line 380)
**Current Code**:
```javascript
const baseKey = `reports/${requestId}`;
```

**Should Be**:
```javascript
// Extract user context
const userId = event.headers?.['X-User-Id'] || 'fprior';
const scope = event.headers?.['X-Scope'] || 'personal';

// Generate date-based path
const now = new Date();
const datePath = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${String(now.getUTCDate()).padStart(2, '0')}`;

// Build user-based path
let baseKey;
if (scope === 'project') {
    const projectId = event.headers?.['X-Project-Id'] || 'default';
    baseKey = `users/${userId}/projects/${projectId}/reports/${datePath}/${requestId}`;
} else {
    baseKey = `users/${userId}/personal/reports/${datePath}/${requestId}`;
}
```

## Deployment Steps

1. **Update Lambda Functions**:
   ```bash
   cd infrastructure
   sam build
   sam deploy --profile mvp --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1
   ```

2. **Test New Paths**:
   - Create a new research request
   - Verify it's saved to `/users/fprior/personal/research/2025/08/05/{id}/`
   - Not to `/research/`

3. **Update DynamoDB Records**:
   - Update s3Key field in existing records to point to new locations

## Temporary Dual-Write Strategy

For safety during transition, consider writing to BOTH locations temporarily:

```python
# Write to new location
new_s3_key = f"users/{user_id}/personal/research/{year}/{month}/{day}/{research_id}/response.json"
s3_client.put_object(Bucket=S3_BUCKET, Key=new_s3_key, Body=data)

# Also write to old location (temporary)
old_s3_key = f"research/{timestamp}_{research_id}.json"
s3_client.put_object(Bucket=S3_BUCKET, Key=old_s3_key, Body=data)
```

## Impact If Not Fixed

- ❌ New research continues to pile up in old `/research/` folder
- ❌ User-based organization benefits are lost
- ❌ Migration effort is wasted
- ❌ Inconsistent data location

## Quick Test

After updating, test with:
```bash
# Create new research via API
curl -X POST https://zi612qxxv0.execute-api.us-east-1.amazonaws.com/production/api/research \
  -H "Content-Type: application/json" \
  -H "X-User-Id: fprior" \
  -H "X-Scope: personal" \
  -d '{"content": "Test research after migration"}'

# Check where it was saved
aws s3 ls s3://color-code-research-results-984906149037/users/fprior/personal/research/2025/08/05/ --recursive --profile mvp
```