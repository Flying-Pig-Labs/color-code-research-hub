# API Documentation - Color Code Research Hub

## Base URL
```
https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production
```

## 🔄 Async Plan Generation (Recommended)

### Start Plan Generation
**POST** `/api/plan/async/start`

Initiates async plan generation that makes 50-90 LLM calls.

**Request Body:**
```json
{
  "metadata": {
    "title": "Project Name",
    "description": "Project description",
    "domain": "general|e-commerce|social-media|productivity|healthcare|education|finance|entertainment|devtools|iot",
    "targetUsers": ["developers", "engineers"],
    "techStack": ["Node.js", "React", "MongoDB"],
    "features": ["API", "Authentication", "Dashboard"],
    "complexity": "simple|moderate|complex"
  },
  "readmeContent": "# Project README content...",
  "repository": "owner/repo" // Optional - for GitHub issue creation
}
```

**Response (202 Accepted):**
```json
{
  "jobId": "uuid-v4",
  "status": "INITIATED",
  "message": "Plan generation job started successfully",
  "statusUrl": "/api/plan/async/status/uuid-v4"
}
```

### Check Job Status
**GET** `/api/plan/async/status/{jobId}`

Poll this endpoint every 3 seconds to check progress.

**Response (200 OK):**
```json
{
  "jobId": "uuid-v4",
  "status": "INITIATED|PROCESSING|COMPLETED|FAILED",
  "progress": 45, // Percentage
  "elapsedTime": 120, // Seconds
  "estimatedTimeRemaining": 180, // Seconds
  "createdAt": "2025-07-24T12:00:00Z",
  "updatedAt": "2025-07-24T12:02:00Z",
  "stages": {
    "populateForm": {
      "status": "completed",
      "startedAt": "2025-07-24T12:00:01Z",
      "completedAt": "2025-07-24T12:00:05Z"
    },
    "generatePhases": {
      "status": "completed",
      "startedAt": "2025-07-24T12:00:06Z",
      "completedAt": "2025-07-24T12:00:15Z"
    },
    "epicGeneration": {
      "status": "in_progress",
      "startedAt": "2025-07-24T12:00:16Z",
      "progress": {
        "current": 3,
        "total": 8
      }
    },
    "issueFormatting": {
      "status": "pending"
    },
    "createGitHubIssues": {
      "status": "pending"
    }
  },
  "llmCalls": {
    "total": 45,
    "claude": 42,
    "openai": 3 // Fallback calls
  },
  "results": {
    // Present when status is COMPLETED
    "phases": [...],
    "epics": [...],
    "issues": [...],
    "githubIssues": [...]
  },
  "errors": [
    // Present if any errors occurred
  ]
}
```

## 📋 Plan Generation V2 (Synchronous)

### Generate Full Plan
**POST** `/api/plan/v2/generate-full-plan`

Generates 8 phases with placeholder epics (optimized for 30s timeout).

**Request Body:**
```json
{
  "metadata": {
    // Same as async endpoint
  },
  "readmeContent": "..."
}
```

**Response (200 OK):**
```json
{
  "phases": [
    {
      "id": "phase-1",
      "title": "Discovery & Requirements",
      "description": "...",
      "epics": [...],
      "pending": false
    }
  ],
  "sampleIssues": [...],
  "totalEstimatedIssues": 60
}
```

### Generate Issues
**POST** `/api/plan/v2/generate-issues`

Generates issues for selected epics.

**Request Body:**
```json
{
  "phases": [...], // From generate-full-plan
  "metadata": {...}
}
```

### Create GitHub Issues
**POST** `/api/plan/v2/create-github-issues`

Creates issues in GitHub repository.

**Request Body:**
```json
{
  "repository": "owner/repo",
  "issues": [
    {
      "title": "Issue title",
      "body": "Issue body in markdown",
      "labels": ["phase:phase-1", "role:developer"],
      "assignee": "Developer"
    }
  ]
}
```

## 📚 GitHub Integration

### List Repositories
**GET** `/api/github/repos`

Returns user's GitHub repositories.

**Response:**
```json
[
  {
    "id": 123456,
    "name": "repo-name",
    "full_name": "owner/repo-name",
    "description": "Repository description",
    "private": false,
    "html_url": "https://github.com/owner/repo",
    "language": "JavaScript",
    "updated_at": "2025-07-24T12:00:00Z",
    "stargazers_count": 42
  }
]
```

### Get Repository README
**GET** `/api/github/repos/{owner}/{repo}/readme`

Returns repository README content.

**Response:**
```json
{
  "content": "# Project Title\n\nREADME content in markdown..."
}
```

## 🔐 Authentication

Currently, the API uses GitHub OAuth for repository access. The GitHub token is retrieved from AWS Secrets Manager.

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid request",
  "message": "Detailed error message"
}
```

### 404 Not Found
```json
{
  "error": "Not found",
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "error": "Rate limit exceeded",
  "message": "Please try again later"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

## 🚀 Quick Start Examples

### Start Async Plan Generation
```bash
curl -X POST https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/plan/async/start \
  -H "Content-Type: application/json" \
  -d '{
    "metadata": {
      "title": "My Project",
      "description": "A test project",
      "domain": "general",
      "targetUsers": ["developers"],
      "techStack": ["Node.js"],
      "features": ["API"],
      "complexity": "simple"
    },
    "readmeContent": "# My Project\nA simple test project."
  }'
```

### Check Status
```bash
curl https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/plan/async/status/{jobId}
```

## 📊 Rate Limits

- Claude API: ~10 requests per minute (with retry logic)
- OpenAI API: Fallback when Claude is overloaded
- GitHub API: 5000 requests per hour
- API Gateway: No specific limits