# API Integration Test Plan

## Overview

This document outlines comprehensive integration tests for the dual API system:
1. **SAM HTTP API** (aifo8hdco2.execute-api.us-east-1.amazonaws.com) - Legacy system  
2. **CDK REST API** (g5rpch8h1l.execute-api.us-east-1.amazonaws.com/prod) - V2 system with auth

## API Systems Comparison

| Feature | SAM HTTP API | CDK REST API |
|---------|-------------|-------------|
| **Auth** | ❌ No authentication | ✅ Cognito User Pool |
| **Gateway Type** | HTTP API Gateway | REST API Gateway |
| **Event Format** | v2 (rawPath, requestContext.http.method) | v1 (path, httpMethod) |
| **User Scoping** | ❌ No user filtering | ✅ Email→username mapping |
| **Status** | Legacy - broken routes | Active - working with auth |

## SAM HTTP API Routes (Legacy System)

### Research & Reports
- **POST /api/research** - Create research job
- **GET /api/research/status/{requestId}** - Poll job status  
- **GET /api/research/reports** - List research reports ✅ **FIXED**
- **GET /api/research/reports/{reportId}** - Get specific report
- **GET /api/research/download/{base64Key}** - Generate download URL

### Legacy List Endpoints (No Auth)
- **GET /research-reports** - List research reports (legacy)
- **GET /pipeline-ideations** - List ideations (legacy)
- **GET /pipeline-repos** - List pipeline repos (legacy)

### Health & Management
- **GET /health** - Health check
- **GET /api/repositories** - List GitHub repositories
- **GET /api/github/repos** - GitHub repo integration

### Planning & Pipeline
- **POST /api/plan/async/start** - Start async planning job
- **GET /api/plan/async/status/{jobId}** - Check planning status
- **GET /api/plan/async/list** - List planning jobs

### Billing (Stripe)
- **POST /billing/stripe/create-checkout-session** - Create Stripe session
- **POST /billing/stripe/webhook** - Handle Stripe webhooks

## CDK REST API Routes (V2 System with Auth)

### Core Platform
- **GET /config** - Get platform configuration (no auth)

### Projects Management
- **POST /projects** - Create new project (auth)
- **GET /projects** - List user projects (auth) 
- **GET /projects/{projectId}** - Get specific project (auth)

### Research Reports
- **POST /projects/{projectId}/report/start** - Start research report (auth)
- **GET /reports** - List user reports (auth)
- **GET /reports/{reportId}** - Get specific report (auth)

### Ideations
- **POST /projects/{projectId}/ideation/start** - Start ideation (auth)
- **GET /ideations** - List user ideations (auth)
- **GET /ideations/{ideationId}** - Get specific ideation (auth)

### Double Downs
- **POST /projects/{projectId}/double-down/start** - Start double down (auth)
- **GET /double-downs/{doubleId}** - Get specific double down (auth)

### Credits & Billing
- **GET /credits/balance** - Get user credit balance (auth)
- **POST /billing/stripe/create-checkout-session** - Create checkout (auth)
- **POST /billing/stripe/webhook** - Stripe webhook (no auth)

### Admin Functions
- **GET /admin/users** - List all users (auth)
- **GET /admin/users/{id}** - Get specific user (auth)
- **GET /admin/metrics** - Get platform metrics (auth)
- **GET /admin/metrics/summary** - Get metrics summary (auth)
- **POST /admin/credits/adjust** - Adjust user credits (auth)

## Test Categories

### 1. API Gateway Event Format Tests

**Purpose**: Verify both systems handle their respective event formats correctly

```python
def test_sam_api_event_format():
    """Test SAM HTTP API handles v2 event format (rawPath, requestContext.http.method)"""
    event = {
        "rawPath": "/api/research/reports",
        "requestContext": {"http": {"method": "GET"}},
        "queryStringParameters": {"limit": "5"}
    }
    # Test that researchApi.handler processes correctly

def test_cdk_api_event_format():
    """Test CDK REST API handles v1 event format (path, httpMethod)"""
    event = {
        "path": "/reports", 
        "httpMethod": "GET",
        "headers": {"Authorization": "Bearer jwt_token"}
    }
    # Test that v2 handlers process correctly
```

### 2. CORS Headers Tests

```python
def test_cors_preflight_sam():
    """Test OPTIONS requests return proper CORS headers on SAM API"""
    
def test_cors_preflight_cdk():
    """Test OPTIONS requests return proper CORS headers on CDK API"""

def test_cors_actual_request():
    """Test actual requests include CORS headers in response"""
```

### 3. Authentication Tests

```python
def test_sam_api_no_auth():
    """Verify SAM API endpoints work without authentication"""
    
def test_cdk_api_requires_auth():
    """Verify CDK API endpoints require valid JWT tokens"""
    
def test_cdk_api_user_scoping():
    """Verify CDK API returns only user-scoped data"""
```

### 4. Data Consistency Tests

```python
def test_research_reports_data_matching():
    """Verify same data returned from both /research-reports and /reports"""
    
def test_ideations_data_matching():
    """Verify same data from /pipeline-ideations and /ideations"""
    
def test_repos_data_matching():
    """Verify same data from /pipeline-repos and /projects"""
```

### 5. Error Handling Tests

```python
def test_404_endpoints():
    """Test non-existent endpoints return proper 404s with CORS"""
    
def test_method_not_allowed():
    """Test invalid HTTP methods return 405s with CORS"""
    
def test_malformed_requests():
    """Test malformed JSON/headers return proper 400s"""
```

### 6. End-to-End Workflow Tests

```python
def test_research_workflow_sam():
    """Test complete research workflow on SAM API"""
    # 1. POST /api/research (create job)
    # 2. GET /api/research/status/{id} (poll until complete) 
    # 3. GET /api/research/reports (verify in list)
    # 4. GET /api/research/download/{key} (get download URL)
    
def test_research_workflow_cdk():
    """Test complete research workflow on CDK API with auth"""
    # 1. POST /projects (create project)
    # 2. POST /projects/{id}/report/start (start report)
    # 3. GET /reports (verify in list)
    # 4. GET /reports/{id} (get download URL)
```

### 7. Performance & Load Tests

```python
def test_concurrent_requests():
    """Test both APIs handle concurrent requests properly"""
    
def test_large_payload_handling():
    """Test APIs handle large request/response payloads"""
    
def test_timeout_handling():
    """Test proper timeout behavior for long-running operations"""
```

## Test Infrastructure Setup

### Environment Configuration
```bash
# SAM API (Legacy)
export SAM_API_URL="https://aifo8hdco2.execute-api.us-east-1.amazonaws.com"

# CDK API (V2) 
export CDK_API_URL="https://g5rpch8h1l.execute-api.us-east-1.amazonaws.com/prod"

# Test credentials
export COGNITO_USER_POOL_ID="us-east-1_bKshBMVth"
export TEST_USER_EMAIL="priorww@gmail.com"
export TEST_JWT_TOKEN="..." # Valid JWT for testing
```

### Test Data Setup
```python
def setup_test_data():
    """Create test data in DynamoDB tables"""
    # Create test research reports
    # Create test users, projects, ideations
    # Ensure proper test isolation

def cleanup_test_data():
    """Clean up test data after tests"""
    # Remove test records
    # Clean S3 test objects
```

### Continuous Integration
```yaml
# GitHub Actions workflow
name: API Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Python
        uses: actions/setup-python@v4
      - name: Install dependencies
        run: pip install requests pytest boto3
      - name: Run SAM API tests
        run: pytest tests/integration/test_sam_api.py
      - name: Run CDK API tests  
        run: pytest tests/integration/test_cdk_api.py
      - name: Run cross-API consistency tests
        run: pytest tests/integration/test_api_consistency.py
```

## Test Execution Strategy

### Phase 1: Critical Path Validation
1. **Research Reports Endpoint** - Verify /api/research/reports works (highest priority)
2. **Authentication Flow** - Ensure CDK API auth is working
3. **CORS Headers** - Verify frontend can call APIs

### Phase 2: Comprehensive Coverage  
1. **All SAM endpoints** - Test every route in template.yaml
2. **All CDK endpoints** - Test every route in api-layer-stack.ts
3. **Error conditions** - 404s, 500s, malformed requests

### Phase 3: Integration & Performance
1. **End-to-end workflows** - Complete user journeys
2. **Cross-API consistency** - Data matches between systems
3. **Load testing** - Concurrent users, large payloads

## Success Criteria

- ✅ All SAM API routes return proper responses with CORS headers
- ✅ All CDK API routes work with proper authentication
- ✅ Frontend can successfully call both APIs without CORS errors
- ✅ Data consistency maintained between legacy and v2 systems
- ✅ Manual zip fix process documented to prevent future breaks
- ✅ Automated tests prevent regression after `make lambda` deployments

## Implementation Files Structure

```
backend/tests/integration/
├── conftest.py              # Test configuration and fixtures
├── test_sam_api.py          # SAM HTTP API tests
├── test_cdk_api.py          # CDK REST API tests  
├── test_api_consistency.py  # Cross-API data consistency tests
├── test_cors.py             # CORS functionality tests
├── test_auth.py             # Authentication flow tests
└── utils/
    ├── api_client.py        # HTTP client utilities
    ├── jwt_helper.py        # JWT token generation/validation
    └── test_data.py         # Test data setup/teardown
```

This comprehensive test plan ensures both API systems work correctly and prevents the "make lambda wipes manual fixes" issue from recurring.