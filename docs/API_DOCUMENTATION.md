# 🔌 Color Code Research Hub - API Documentation

> **Complete API reference for all endpoints in the Color Code Research Hub platform**

## 📋 Table of Contents

- [Overview](#overview)
- [Base URLs](#base-urls)
- [Authentication](#authentication)
- [Plan Generation APIs](#plan-generation-apis)
  - [Async Plan Generation](#async-plan-generation-recommended)
  - [CLI Plan Generation](#cli-plan-generation)
  - [V2 Plan Generation](#v2-plan-generation-legacy)
- [GitHub Integration APIs](#github-integration-apis)
- [Claude Flow APIs](#claude-flow-apis)
- [Research Team APIs](#research-team-apis)
- [Utility APIs](#utility-apis)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)
- [Examples](#examples)

## Overview

The Color Code Research Hub API is a RESTful service that provides endpoints for AI-powered project planning, GitHub integration, and Claude Flow swarm orchestration. All responses are in JSON format unless otherwise specified.

### API Versioning

The API uses path-based versioning:
- `/api/plan/v2/*` - Version 2 endpoints (legacy)
- `/api/plan/*` - Current stable endpoints
- `/api/claude-flow/*` - Claude Flow integration endpoints

## Base URLs

```yaml
Production:
  API Gateway: https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production
  Frontend: https://main.dgj0e8wt2o1zf.amplifyapp.com

Development:
  API: http://localhost:3001
  Frontend: http://localhost:3000
```

## Authentication

### API Key Authentication

Most endpoints require API key authentication via AWS Secrets Manager. The Lambda functions automatically retrieve necessary keys.

### GitHub OAuth

GitHub-related endpoints use OAuth tokens stored in Secrets Manager:
- Token Name: `github/personal_token`
- Scopes Required: `repo`, `read:user`

### Headers

```http
Content-Type: application/json
Accept: application/json
```

## Plan Generation APIs

### Async Plan Generation (Recommended)

The async endpoints handle long-running plan generation operations that make 50-90 LLM calls.

#### Start Async Plan Generation

```http
POST /api/plan/async/start
```

Initiates an asynchronous plan generation job.

**Request Body:**
```json
{
  "metadata": {
    "title": "Project Name",
    "description": "Detailed project description",
    "domain": "general|e-commerce|social-media|productivity|healthcare|education|finance|entertainment|devtools|iot",
    "targetUsers": ["developers", "business analysts", "end users"],
    "techStack": ["Node.js", "React", "PostgreSQL", "AWS"],
    "features": ["User authentication", "API integration", "Real-time updates"],
    "complexity": "simple|moderate|complex"
  },
  "readmeContent": "# Project README\n\nFull README content in markdown...",
  "repository": "owner/repo-name",  // Optional - for GitHub issue creation
  "branch": "main"                  // Optional - defaults to main
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "INITIATED",
  "message": "Plan generation job started successfully",
  "statusUrl": "/api/plan/async/status/550e8400-e29b-41d4-a716-446655440000",
  "estimatedDuration": 900,  // seconds
  "createdAt": "2025-01-27T12:00:00.000Z"
}
```

#### Get Job Status

```http
GET /api/plan/async/status/{jobId}
```

Check the status of an async plan generation job. Poll every 3 seconds.

**Path Parameters:**
- `jobId` (required): The job ID returned from start endpoint

**Response (200 OK):**
```json
{
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "INITIATED|PROCESSING|COMPLETED|FAILED",
  "progress": 65,  // Percentage (0-100)
  "currentStage": "epicGeneration",
  "elapsedTime": 420,  // seconds
  "estimatedTimeRemaining": 480,  // seconds
  "createdAt": "2025-01-27T12:00:00.000Z",
  "updatedAt": "2025-01-27T12:07:00.000Z",
  "stages": {
    "populateForm": {
      "status": "completed",
      "startedAt": "2025-01-27T12:00:01.000Z",
      "completedAt": "2025-01-27T12:00:05.000Z",
      "duration": 4
    },
    "generatePhases": {
      "status": "completed",
      "startedAt": "2025-01-27T12:00:06.000Z",
      "completedAt": "2025-01-27T12:00:15.000Z",
      "duration": 9
    },
    "epicGeneration": {
      "status": "in_progress",
      "startedAt": "2025-01-27T12:00:16.000Z",
      "progress": {
        "current": 5,
        "total": 8,
        "details": "Processing phase 5 of 8"
      }
    },
    "issueFormatting": {
      "status": "pending",
      "estimatedStart": "2025-01-27T12:12:00.000Z"
    },
    "createGitHubIssues": {
      "status": "pending",
      "enabled": true
    }
  },
  "llmCalls": {
    "total": 45,
    "successful": 42,
    "failed": 3,
    "providers": {
      "claude": 40,
      "openai": 5  // Fallback calls
    }
  },
  "results": {
    // Present only when status is COMPLETED
    "summary": {
      "totalPhases": 8,
      "totalEpics": 62,
      "totalIssues": 62,
      "estimatedHours": 480
    },
    "phases": [...],  // Full phase data
    "epics": [...],   // All generated epics
    "issues": [...],  // Formatted issues
    "githubIssues": [
      {
        "number": 1,
        "title": "[Frontend] Implement user authentication UI",
        "url": "https://github.com/owner/repo/issues/1",
        "state": "open"
      }
    ]
  },
  "errors": [
    // Present if any errors occurred
    {
      "stage": "epicGeneration",
      "phase": "phase-3",
      "error": "Rate limit exceeded",
      "timestamp": "2025-01-27T12:05:30.000Z",
      "resolved": true
    }
  ]
}
```

### CLI Plan Generation

Direct access to the full CLI logic that generates complete plans synchronously.

#### Generate CLI Plan

```http
POST /api/plan/generate-cli-plan
```

Generates a complete project plan using the CLI orchestration logic. This endpoint may take 30-60 seconds to complete.

**Request Body:**
```json
{
  "projectInfo": {
    "title": "E-commerce Platform",
    "description": "Modern e-commerce platform with AI recommendations",
    "domain": "e-commerce",
    "features": ["Product catalog", "Shopping cart", "Payment processing", "AI recommendations"],
    "techStack": ["Next.js", "Node.js", "PostgreSQL", "Redis", "Stripe"],
    "complexity": "complex",
    "targetUsers": ["shoppers", "merchants", "administrators"],
    "repository": "owner/ecommerce-platform",
    "branch": "main"
  },
  "readmeContent": "# E-commerce Platform\n\nFull README content..."
}
```

**Response (200 OK):**
```json
{
  "summary": {
    "title": "E-commerce Platform",
    "description": "Modern e-commerce platform with AI recommendations",
    "domain": "e-commerce",
    "repository": "owner/ecommerce-platform",
    "branch": "main",
    "targetUsers": ["shoppers", "merchants", "administrators"],
    "techStack": ["Next.js", "Node.js", "PostgreSQL", "Redis", "Stripe"],
    "features": ["Product catalog", "Shopping cart", "Payment processing", "AI recommendations"],
    "complexity": "complex"
  },
  "phases": [
    {
      "id": "phase-1",
      "title": "Discovery & Requirements",
      "description": "Initial research and requirement gathering phase",
      "roles": ["Product Manager", "Business Analyst", "UX Researcher"],
      "issues": [
        {
          "title": "[Product Manager] Define MVP feature set",
          "description": "## Context\n\nDefine the minimum viable product features...\n\n## Tasks\n- [ ] Analyze competitor features\n- [ ] Survey target users\n- [ ] Create feature priority matrix\n\n## Acceptance Criteria\n- MVP features documented\n- Stakeholder approval received",
          "role": "Product Manager",
          "labels": ["phase:discovery", "priority:high"]
        }
      ],
      "approved": true
    }
  ],
  "metadata": {
    "generatedAt": "2025-01-27T12:00:00.000Z",
    "llmCalls": 75,
    "processingTime": 45.3,  // seconds
    "version": "1.0.0"
  }
}
```

#### Populate Form from README

```http
POST /api/plan/populate-form
```

Extracts project metadata from a README file using AI.

**Request Body:**
```json
{
  "readmeContent": "# My Awesome Project\n\nA revolutionary app that..."
}
```

**Response (200 OK):**
```json
{
  "metadata": {
    "title": "My Awesome Project",
    "description": "A revolutionary app that enhances productivity",
    "domain": "productivity",
    "targetUsers": ["developers", "project managers"],
    "techStack": ["React", "Node.js", "MongoDB"],
    "features": ["Task management", "Team collaboration", "Analytics"],
    "complexity": "moderate"
  },
  "confidence": 0.92,
  "extractedSections": {
    "overview": "Found in README",
    "features": "Extracted from features section",
    "techStack": "Identified from tech stack section"
  }
}
```

### V2 Plan Generation (Legacy)

These endpoints were designed to work within API Gateway's 30-second timeout limit.

#### Generate Full Plan V2

```http
POST /api/plan/v2/generate-full-plan
```

Generates phases with limited epics due to timeout constraints.

**Request/Response:** Similar to CLI endpoint but with fewer epics generated.

## GitHub Integration APIs

### List User Repositories

```http
GET /api/github/repos/{owner}
```

Lists all repositories for a GitHub user or organization.

**Path Parameters:**
- `owner` (required): GitHub username or organization name

**Query Parameters:**
- `type` (optional): `all|owner|member` (default: `all`)
- `sort` (optional): `created|updated|pushed|full_name` (default: `updated`)
- `per_page` (optional): Results per page (max 100, default: 30)
- `page` (optional): Page number (default: 1)

**Response (200 OK):**
```json
[
  {
    "id": 123456789,
    "name": "color-code-research-hub",
    "full_name": "owner/color-code-research-hub",
    "description": "AI-powered project planning platform",
    "private": false,
    "fork": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2025-01-27T12:00:00Z",
    "pushed_at": "2025-01-27T11:00:00Z",
    "html_url": "https://github.com/owner/color-code-research-hub",
    "language": "JavaScript",
    "stargazers_count": 42,
    "watchers_count": 10,
    "forks_count": 5,
    "open_issues_count": 3,
    "topics": ["ai", "planning", "automation"],
    "default_branch": "main"
  }
]
```

### Get Repository README

```http
GET /api/github/repos/{owner}/{repo}/readme
```

Fetches the README content from a GitHub repository.

**Path Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name

**Query Parameters:**
- `ref` (optional): Branch/tag/commit (default: default branch)

**Response (200 OK):**
```json
{
  "content": "# Repository Name\n\nFull README content in markdown format...",
  "encoding": "utf-8",
  "size": 4523,
  "name": "README.md",
  "path": "README.md",
  "sha": "abc123def456...",
  "url": "https://api.github.com/repos/owner/repo/contents/README.md",
  "html_url": "https://github.com/owner/repo/blob/main/README.md"
}
```

## Claude Flow APIs

Integration with the Claude Flow swarm orchestration backend.

### Health Check

```http
GET /api/claude-flow/health
```

Check Claude Flow backend health status.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "uptime": 345600,  // seconds
  "services": {
    "swarmOrchestrator": "operational",
    "memoryStore": "operational",
    "executionEngine": "operational"
  },
  "timestamp": "2025-01-27T12:00:00.000Z"
}
```

### Execute Swarm Command

```http
POST /api/claude-flow/execute
```

Execute a Claude Flow swarm command.

**Request Body:**
```json
{
  "command": "sparc \"Research population of Richmond, VA\"",
  "options": {
    "maxAgents": 5,
    "timeout": 300,
    "strategy": "research"
  }
}
```

**Response (200 OK):**
```json
{
  "executionId": "exec-1753631657732",
  "status": "running",
  "command": "sparc \"Research population of Richmond, VA\"",
  "startTime": "2025-01-27T12:00:00.000Z",
  "estimatedDuration": 120
}
```

### Get Swarm Status

```http
GET /api/claude-flow/swarm-status
```

Get current swarm system status.

**Response (200 OK):**
```json
{
  "activeSwarms": 3,
  "totalAgents": 12,
  "queuedTasks": 5,
  "completedTasks": 145,
  "systemLoad": 0.65,
  "memoryUsage": {
    "used": 2048,
    "total": 4096,
    "percentage": 50
  }
}
```

### List Executions

```http
GET /api/claude-flow/executions
```

List recent swarm executions.

**Query Parameters:**
- `limit` (optional): Number of results (default: 10, max: 100)
- `status` (optional): Filter by status (running|completed|failed)

**Response (200 OK):**
```json
{
  "executions": [
    {
      "executionId": "exec-1753631657732",
      "command": "sparc \"Research population of Richmond, VA\"",
      "status": "completed",
      "startTime": "2025-01-27T12:00:00.000Z",
      "endTime": "2025-01-27T12:02:30.000Z",
      "duration": 150,
      "agentCount": 5,
      "taskCount": 23
    }
  ],
  "total": 145,
  "page": 1,
  "limit": 10
}
```

### Get Execution Details

```http
GET /api/claude-flow/execution/{id}
```

Get detailed information about a specific execution.

**Path Parameters:**
- `id` (required): Execution ID

**Response (200 OK):**
```json
{
  "executionId": "exec-1753631657732",
  "command": "sparc \"Research population of Richmond, VA\"",
  "status": "completed",
  "startTime": "2025-01-27T12:00:00.000Z",
  "endTime": "2025-01-27T12:02:30.000Z",
  "duration": 150,
  "result": {
    "summary": "Richmond, VA has a population of 238,728 (2020 census)",
    "details": {
      "population": 238728,
      "metroPopulation": 1300000,
      "growthRate": "2.1%",
      "density": "3,782/sq mi"
    }
  },
  "agents": [
    {
      "id": "agent-coordinator-1",
      "type": "coordinator",
      "status": "completed",
      "tasksCompleted": 5
    }
  ],
  "logs": {
    "stdout": "s3://bucket/logs/exec-1753631657732/stdout.log",
    "stderr": "s3://bucket/logs/exec-1753631657732/stderr.log"
  }
}
```

### Get Execution Logs

```http
GET /api/claude-flow/execution/{id}/logs
```

Fetch execution logs directly without handling S3 URLs.

**Path Parameters:**
- `id` (required): Execution ID

**Query Parameters:**
- `type` (optional): `stdout|stderr|all` (default: `stdout`)
- `tail` (optional): Number of lines from end (default: all)

**Response (200 OK):**
```text
Content-Type: text/plain

[12:07:37] Starting research on Richmond, VA population...
[12:07:38] Agent coordinator-1 initialized
[12:07:39] Agent researcher-1 analyzing demographic data...
[12:07:40] Found 2020 census data: 238,728 residents
[12:07:41] Analyzing growth trends...
[12:07:42] Richmond metro area: 1.3 million
[12:07:43] Population density: 3,782/sq mi
[12:07:44] Growth rate: 2.1% annually
[12:07:45] Task completed successfully
[12:07:46] Generating final report...
```

### Get Execution Metadata

```http
GET /api/claude-flow/execution/{id}/metadata
```

Get execution metadata as JSON.

**Path Parameters:**
- `id` (required): Execution ID

**Response (200 OK):**
```json
{
  "executionId": "exec-1753631657732",
  "command": "sparc \"Research Richmond VA population\"",
  "status": "completed",
  "startTime": "2025-01-27T12:07:37.000Z",
  "endTime": "2025-01-27T12:07:46.000Z",
  "duration": 9,
  "taskCount": 10,
  "completedTasks": 10,
  "failedTasks": 0,
  "agents": [
    {
      "id": "coordinator-1",
      "type": "coordinator",
      "role": "orchestrator"
    },
    {
      "id": "researcher-1", 
      "type": "researcher",
      "role": "data_analyst"
    }
  ],
  "resources": {
    "cpu": "2 cores",
    "memory": "4GB",
    "storage": "10GB"
  }
}
```

### Get Latest Activity

```http
GET /api/claude-flow/execution/{id}/activity
```

Get execution status with recent activity logs.

**Path Parameters:**
- `id` (required): Execution ID

**Query Parameters:**
- `lines` (optional): Number of recent log lines (default: 50)

**Response (200 OK):**
```json
{
  "executionId": "exec-1753631657732",
  "status": "running",
  "recentActivity": [
    "[12:07:37] Starting research on Richmond, VA population...",
    "[12:07:38] Agent coordinator-1 initialized",
    "[12:07:39] Agent researcher-1 analyzing demographic data..."
  ],
  "lastUpdated": "2025-01-27T12:07:40.000Z",
  "progress": 50,
  "taskCount": 10,
  "completedTasks": 5,
  "currentTask": "Analyzing demographic trends"
}
```

## Research Team APIs

### Submit Research Request

```http
POST /api/sqs/submit
```

Submit a research request to one of the specialized teams.

**Request Body:**
```json
{
  "teamType": "red|black|white",
  "repoId": "unique-identifier-123",
  "formData": {
    // Red Team Example
    "companyName": "Carvana",
    "analysisFocus": ["pricing strategy", "technology platform", "customer acquisition"],
    "marketScope": "North America",
    "disruptionTimeline": "12-18 months",
    "investmentRange": "$1M-$5M",
    "disruptionStrategy": "technology differentiation",
    
    // Black Team Example
    "toolCategories": ["Analytics", "Monitoring", "Development"],
    "informationSources": ["documentation", "reviews", "pricing"],
    "implementationComplexity": "medium",
    "teamSizeConstraint": "5-10 developers",
    "techStackPreference": ["Python", "React", "PostgreSQL"],
    "timeToMarket": "3-6 months",
    
    // White Team Example
    "opportunityTypes": ["market gaps", "emerging tech"],
    "targetCustomerSize": "SMB",
    "businessModelPreference": "SaaS",
    "technicalApproach": "build",
    "riskTolerance": 4,
    "minimumOpportunitySize": "$10M ARR"
  }
}
```

**Response (200 OK):**
```json
{
  "messageId": "msg-123456789",
  "requestId": "req-987654321",
  "status": "queued",
  "estimatedProcessingTime": 300,
  "queueUrl": "https://sqs.us-east-1.amazonaws.com/123456789/research-requests",
  "repository": "Flying-Pig-Labs/ci-red-unique-identifier-123"
}
```

## Utility APIs

### Health Check

```http
GET /health
```

Basic health check endpoint.

**Response (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "production"
}
```

### Get Team Fields

```http
GET /teams/{teamType}/fields
```

Get field definitions for a specific research team.

**Path Parameters:**
- `teamType` (required): `red|black|white`

**Response (200 OK):**
```json
{
  "teamType": "red",
  "fields": [
    {
      "name": "companyName",
      "label": "Target Company",
      "type": "text",
      "required": true,
      "placeholder": "e.g., Carvana, DoorDash",
      "description": "The company you want to disrupt"
    },
    {
      "name": "analysisFocus",
      "label": "Analysis Focus Areas",
      "type": "multiselect",
      "required": true,
      "options": [
        "Pricing Strategy",
        "Technology Platform",
        "Customer Acquisition",
        "Supply Chain",
        "User Experience"
      ]
    }
  ]
}
```

## Error Handling

All endpoints return consistent error responses.

### Error Response Format

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional context"
    }
  },
  "timestamp": "2025-01-27T12:00:00.000Z",
  "path": "/api/endpoint/path",
  "requestId": "req-123456789"
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|------------|------------|-------------|
| 400 | `BAD_REQUEST` | Invalid request parameters |
| 401 | `UNAUTHORIZED` | Missing or invalid authentication |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 409 | `CONFLICT` | Resource conflict (e.g., duplicate) |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 502 | `BAD_GATEWAY` | Upstream service error |
| 503 | `SERVICE_UNAVAILABLE` | Service temporarily unavailable |
| 504 | `TIMEOUT` | Request timeout |

### Error Examples

#### 400 Bad Request
```json
{
  "error": {
    "code": "INVALID_PARAMETERS",
    "message": "Invalid request parameters",
    "details": {
      "metadata.title": "Title is required",
      "metadata.complexity": "Must be one of: simple, moderate, complex"
    }
  },
  "timestamp": "2025-01-27T12:00:00.000Z",
  "path": "/api/plan/async/start",
  "requestId": "req-123456789"
}
```

#### 429 Rate Limited
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "API rate limit exceeded",
    "details": {
      "limit": 100,
      "window": "1 hour",
      "retryAfter": 1753631657
    }
  },
  "timestamp": "2025-01-27T12:00:00.000Z",
  "path": "/api/plan/generate-cli-plan",
  "requestId": "req-123456789"
}
```

## Rate Limiting

### API Gateway Limits
- **Requests per second**: 10,000 (account limit)
- **Burst**: 5,000 requests
- **Payload size**: 10MB request, 6MB response

### LLM Provider Limits
- **Claude API**: ~10 requests/minute with retry logic
- **OpenAI API**: 500 requests/minute (fallback)
- **Retry strategy**: Exponential backoff (2s, 4s, 8s)

### GitHub API Limits
- **Authenticated**: 5,000 requests/hour
- **Per repository**: 1,000 issues/day
- **Search**: 30 requests/minute

### Best Practices
1. Implement client-side rate limiting
2. Use exponential backoff for retries
3. Cache responses where appropriate
4. Monitor rate limit headers

## Examples

### Complete Async Plan Generation Flow

```javascript
// 1. Start plan generation
const startResponse = await fetch(`${API_BASE_URL}/api/plan/async/start`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    metadata: {
      title: 'E-commerce Platform',
      description: 'Modern online shopping platform',
      domain: 'e-commerce',
      targetUsers: ['shoppers', 'merchants'],
      techStack: ['Next.js', 'Node.js', 'PostgreSQL'],
      features: ['Product catalog', 'Shopping cart', 'Payment'],
      complexity: 'complex'
    },
    readmeContent: '# E-commerce Platform\n\nProject details...',
    repository: 'myorg/ecommerce-platform'
  })
});

const { jobId } = await startResponse.json();

// 2. Poll for status
const pollInterval = setInterval(async () => {
  const statusResponse = await fetch(
    `${API_BASE_URL}/api/plan/async/status/${jobId}`
  );
  const status = await statusResponse.json();
  
  console.log(`Progress: ${status.progress}%`);
  console.log(`Current stage: ${status.currentStage}`);
  
  if (status.status === 'COMPLETED') {
    clearInterval(pollInterval);
    console.log('Plan generation complete!');
    console.log(`Generated ${status.results.summary.totalIssues} issues`);
    
    // Process results
    processResults(status.results);
  } else if (status.status === 'FAILED') {
    clearInterval(pollInterval);
    console.error('Plan generation failed:', status.errors);
  }
}, 3000); // Poll every 3 seconds
```

### Claude Flow Swarm Execution

```javascript
// 1. Execute a swarm command
const executeResponse = await fetch(`${API_BASE_URL}/api/claude-flow/execute`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: 'sparc "Research AI trends in healthcare for 2025"',
    options: {
      maxAgents: 8,
      timeout: 600,
      strategy: 'research'
    }
  })
});

const { executionId } = await executeResponse.json();

// 2. Monitor execution progress
const activityInterval = setInterval(async () => {
  const activityResponse = await fetch(
    `${API_BASE_URL}/api/claude-flow/execution/${executionId}/activity?lines=20`
  );
  const activity = await activityResponse.json();
  
  console.log(`Status: ${activity.status}`);
  console.log(`Progress: ${activity.completedTasks}/${activity.taskCount} tasks`);
  
  // Display recent activity
  activity.recentActivity.forEach(line => console.log(line));
  
  if (activity.status === 'completed' || activity.status === 'failed') {
    clearInterval(activityInterval);
    
    // Get full results
    const detailsResponse = await fetch(
      `${API_BASE_URL}/api/claude-flow/execution/${executionId}`
    );
    const details = await detailsResponse.json();
    console.log('Execution complete:', details.result);
  }
}, 5000); // Poll every 5 seconds
```

### Error Handling Example

```javascript
async function apiCall(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      
      // Handle specific error codes
      switch (error.error.code) {
        case 'RATE_LIMITED':
          const retryAfter = error.error.details.retryAfter;
          console.log(`Rate limited. Retry after ${retryAfter} seconds`);
          // Implement retry logic
          break;
          
        case 'INVALID_PARAMETERS':
          console.error('Invalid parameters:', error.error.details);
          // Fix parameters and retry
          break;
          
        default:
          throw new Error(error.error.message);
      }
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System design and components
- [Lambda Functions](../lambda/README.md) - Serverless function details
- [Claude Flow Integration](./features/CLAUDE_FLOW_INTEGRATION.md) - AI swarm documentation
- [Authentication Guide](./guides/AUTHENTICATION.md) - Auth implementation
- [WebSocket APIs](./api/WEBSOCKET_APIS.md) - Real-time communication (planned)

---

> 💡 **API Client Libraries**: Official client libraries are planned for JavaScript/TypeScript, Python, and Go. Check the [SDK Documentation](./sdk/README.md) for updates.