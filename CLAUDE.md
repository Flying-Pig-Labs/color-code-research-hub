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

## 🚨 CRITICAL: Authentication Redirect Loop Prevention

### Root Cause Analysis

After 12+ attempts to fix authentication redirect loops, we identified the exact mechanism:

**The Problem**: Multiple redirect sources + premature API calls = infinite 100ms loops
1. Components make API calls on mount before auth hydration
2. Multiple 401 responses trigger concurrent redirects
3. Auth page and ProtectedRoute both redirect simultaneously  
4. React re-render cycles create 100ms timing

### 🛡️ Permanent Solution Implemented

#### Core Architecture Changes:

**1. Single Redirect Source Pattern**
```typescript
// src/lib/redirectToAuth.ts - ONLY place that redirects
const LOCK_KEY = 'auth_redirect_lock';
const LOCK_TTL_MS = 5000; // Cross-reload protection

export function redirectToAuthOnce(url = '/v2/auth') {
  if (hasRecentLock()) return; // Prevent loops across reloads
  setLock();
  window.location.assign(url);
}
```

**2. Unified 401 Handler** 
```typescript
// src/lib/apiFetch.ts - ALL APIs use this
export async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${envConfig.apiBaseUrl}${path}`, { ...options, headers });
  if (res.status === 401) { 
    redirectToAuthOnce('/v2/auth'); // ONLY place that handles 401s
    throw new Error('UNAUTHORIZED'); 
  }
  return res.json();
}
```

**3. UI-Only ProtectedRoute**
```typescript
// src/components/ProtectedRoute.tsx - NEVER navigates
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated || !hasValidToken) {
    return <div>Please log in to continue.</div>; // UI only
  }
  return <>{children}</>;
};
```

**4. Auth-Gated Components**
```typescript
// All components that fetch data
export function DataComponent() {
  const { isAuthenticated } = useAuth();
  const hasValidToken = !!sessionStorage.getItem('id_token');
  if (!isAuthenticated || !hasValidToken) return null; // No rendering/fetching
  
  useEffect(() => {
    fetchData(); // Safe to fetch here
  }, []);
}
```

### 🔧 Implementation Checklist

✅ **Single redirect function** (`lib/redirectToAuth.ts`)  
✅ **Unified API client** (`lib/apiFetch.ts`)  
✅ **Both API services use unified handler** (`services/v2/api.ts`, `services/api.ts`)  
✅ **ProtectedRoute never navigates** (UI-only)  
✅ **Auth page is minimal** (clears locks, no fetching)  
✅ **All data components auth-gated** (no premature API calls)  
✅ **Cross-reload lock** (5-second TTL prevents reload storms)  

### 🚫 Critical Rules

**NEVER do these (will reintroduce loop):**
- Add `window.location.*` or `navigate()` calls outside `lib/redirectToAuth.ts`
- Add 401 handling outside `lib/apiFetch.ts` 
- Make API calls before `isAuthenticated && hasValidToken` check
- Mount data-fetching components in `/v2/auth` route
- Remove the 5-second cross-reload lock

### 🧪 Validation Tests

**Test 1: Single Redirect**
- Clear tokens: `sessionStorage.clear()`
- Visit `/v2/projects` 
- Expected: ONE redirect to `/v2/auth`, no loop

**Test 2: Cross-Reload Protection**  
- Repeat above within 5 seconds
- Expected: No additional redirect (lock active)

**Test 3: Multiple Tabs**
- Open `/v2/projects` in 2 tabs simultaneously
- Expected: Each tab redirects once, no oscillation

**Test 4: Debug Counters**
```javascript
// In browser console
window.authStateManager.getCounters()
// Expected: redirectExecuted ≤ 1 per page load
```

### 🚨 Emergency Rollback

If redirect loop returns:
1. Check `rg -n "window\.location|status\s*===\s*401" frontend/src`
2. Ensure only `lib/apiFetch.ts` and `lib/redirectToAuth.ts` have redirects
3. Verify no components make API calls before auth gate
4. Enable safe mode: `VITE_AUTH_SAFE_MODE=true`