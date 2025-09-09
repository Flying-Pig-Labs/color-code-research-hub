# Color Code Research Hub - Developer Documentation

## 🚨 CRITICAL: API Architecture Understanding

### Dual API System Architecture

This project runs **TWO separate API systems simultaneously**:

#### 1. SAM-deployed API (Legacy) - `aifo8hdco2.execute-api.us-east-1.amazonaws.com`
- **Deployment**: Via `template.yaml` using AWS SAM
- **Gateway Type**: HTTP API Gateway  
- **Routes**: `/research-reports`, `/pipeline-ideations`, `/pipeline-repos`
- **Authentication**: `"AuthorizationType": "NONE"` ❌
- **Problem**: Routes have no auth but Lambda functions expect JWT authentication
- **Result**: 500 Internal Server Error when called

#### 2. CDK-deployed API (V2) - `g5rpch8h1l.execute-api.us-east-1.amazonaws.com/prod`
- **Deployment**: Via CDK stacks (`AuthStack`, `DataLayerStack`, `ApiLayerStack`)
- **Gateway Type**: REST API Gateway
- **Routes**: `/reports`, `/ideations`, `/projects`
- **Authentication**: Cognito User Pool authorizer (`us-east-1_bKshBMVth`) ✅
- **Features**: User-scoped access, JWT processing, email→username mapping
- **Result**: Proper authenticated access with data filtering

### Frontend API Client Configuration

The frontend MUST call the V2 CDK API endpoints in `frontend/src/services/v2/api.ts`:

```typescript
// ✅ CORRECT - V2 CDK API endpoints
listReports: () => apiFetch('/reports'),
listIdeations: () => apiFetch('/ideations'), 
listPipelineRepos: () => apiFetch('/projects'),

// ❌ WRONG - Legacy SAM API endpoints (will cause 500 errors)
listReports: () => apiFetch('/research-reports'),
listIdeations: () => apiFetch('/pipeline-ideations'),
listPipelineRepos: () => apiFetch('/pipeline-repos'),
```

### Environment Variable Configuration

Ensure frontend points to V2 API in `.env.production` and Amplify environment variables:

```bash
VITE_API_GATEWAY_URL=https://g5rpch8h1l.execute-api.us-east-1.amazonaws.com/prod
VITE_API_BASE_URL=https://g5rpch8h1l.execute-api.us-east-1.amazonaws.com/prod
```

### User Authentication & Mapping

- **Cognito User Pool**: `us-east-1_bKshBMVth`
- **User Mapping**: `priorww@gmail.com` → `fprior` (in legacy database)
- **JWT Processing**: V2 Lambda functions extract username from JWT and map to legacy usernames
- **Data Filtering**: All database queries filtered by `username` field

### Deployment Commands

```bash
# Deploy both SAM and CDK systems
make lambda

# Deploy frontend with correct API configuration  
aws amplify start-job --app-id d3i4a0icgmkocs --branch-name main --job-type RELEASE --region us-east-1
```

### Common Issues

**Problem**: Frontend calls return 500 errors
**Cause**: Frontend calling legacy SAM API without proper auth configuration
**Solution**: Update frontend API client to use V2 CDK endpoints

**Problem**: User sees all data instead of user-scoped data
**Cause**: Calling wrong API or missing user authentication
**Solution**: Ensure proper Cognito authentication and V2 API usage

### Architecture Decision

The dual API system exists because:
1. **Legacy SAM API**: Maintains existing functionality and routes
2. **V2 CDK API**: Provides proper authentication and user-scoped access

**Always use the V2 CDK API for authenticated, user-scoped operations.**