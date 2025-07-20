# 🚀 Async Job Tracking System - Backend Implementation Spec

## 📋 Overview

This spec defines the backend requirements for implementing an async job tracking system that supports immediate responses to research requests while processing Claude Flow jobs in the background.

## 🎯 Goals

1. **Immediate Response**: Return "200 OK" immediately when research requests are submitted
2. **Background Processing**: Process EC2 webhook calls asynchronously 
3. **Job Tracking**: Provide endpoints to check job status and progress
4. **UI Integration**: Support polling mechanisms for real-time status updates

---

## 🔧 Required API Endpoints

### 1. Submit Research Request (Modified)

**Endpoint**: `POST /api/ec2/analyze`

**Purpose**: Accept research requests and return immediate response

**Request Body**:
```json
{
  "teamType": "black|red|white",
  "repoId": "5-char-id",
  "formData": {
    // Team-specific form data
    "toolCategories": ["analytics", "monitoring"],
    "implementationComplexity": "medium",
    // ... other fields
  }
}
```

**Response** (IMMEDIATE - Don't wait for EC2):
```json
{
  "status": "accepted",
  "message": "Research request accepted! Processing in background.",
  "jobId": "black-a3x9k-1737378645123",
  "repoId": "a3x9k",
  "repository": "Flying-Pig-Labs/ci-black-a3x9k",
  "expectedRepoName": "ci-black-a3x9k",
  "githubUrl": "https://github.com/Flying-Pig-Labs/ci-black-a3x9k",
  "estimatedTime": "2-5 minutes"
}
```

**Backend Flow**:
1. Validate request
2. Generate unique `jobId`: `${teamType}-${repoId}-${timestamp}`
3. Store job in database/memory with status "submitted"
4. **Return response immediately**
5. **After response sent**: Call EC2 webhook asynchronously
6. Update job status as processing progresses

---

### 2. Get Job Status (NEW)

**Endpoint**: `GET /api/ec2/status/:jobId`

**Purpose**: Check status of a specific job

**Response**:
```json
{
  "id": "black-a3x9k-1737378645123",
  "status": "submitted|processing|completed|failed",
  "teamType": "black",
  "repoId": "a3x9k", 
  "repository": "Flying-Pig-Labs/ci-black-a3x9k",
  "repoName": "ci-black-a3x9k",
  "githubUrl": "https://github.com/Flying-Pig-Labs/ci-black-a3x9k",
  "submittedAt": "2025-07-20T13:54:10.338Z",
  "startedAt": "2025-07-20T13:54:12.150Z",      // When EC2 call started
  "completedAt": "2025-07-20T13:57:33.442Z",   // When job finished
  "formData": { /* original form data */ },
  "error": "Error message if failed",           // Only if status=failed
  "ec2Response": { /* EC2 response data */ }    // Only if status=completed
}
```

**Status Codes**:
- `200`: Job found, returns job data
- `404`: Job not found

---

### 3. List Jobs (NEW)

**Endpoint**: `GET /api/ec2/jobs?teamType=black`

**Purpose**: Get list of jobs, optionally filtered by team

**Query Parameters**:
- `teamType` (optional): Filter by "red", "black", or "white"
- `limit` (optional): Number of jobs to return (default: 50)
- `status` (optional): Filter by job status

**Response**:
```json
{
  "jobs": [
    {
      "id": "black-a3x9k-1737378645123",
      "status": "completed",
      "teamType": "black",
      "repoId": "a3x9k",
      "repository": "Flying-Pig-Labs/ci-black-a3x9k",
      "submittedAt": "2025-07-20T13:54:10.338Z",
      "completedAt": "2025-07-20T13:57:33.442Z",
      "githubUrl": "https://github.com/Flying-Pig-Labs/ci-black-a3x9k"
    },
    // ... more jobs, sorted by submittedAt DESC
  ]
}
```

---

## 📊 Job Data Model

### Job Object Structure

```typescript
interface Job {
  id: string;                    // "teamType-repoId-timestamp"
  status: JobStatus;             // Current job status
  teamType: 'red' | 'black' | 'white';
  repoId: string;               // 5-char unique ID
  repository: string;           // "Flying-Pig-Labs/ci-{team}-{id}"
  repoName: string;            // "ci-{team}-{id}"
  githubUrl: string;           // Full GitHub URL
  
  // Timestamps
  submittedAt: string;         // ISO datetime when submitted
  startedAt?: string;          // ISO datetime when EC2 call started
  completedAt?: string;        // ISO datetime when finished
  
  // Data
  formData: Record<string, any>; // Original form submission
  
  // Results (only when completed)
  ec2Response?: any;           // Raw EC2 response
  
  // Error handling (only when failed)  
  error?: string;              // Error message
}

type JobStatus = 'submitted' | 'processing' | 'completed' | 'failed';
```

---

## ⚙️ Implementation Requirements

### 1. Async Processing Pattern

```javascript
// Example implementation pattern
app.post('/api/ec2/analyze', async (req, res) => {
  // 1. Validate and create job
  const job = createJob(req.body);
  await saveJob(job);
  
  // 2. IMMEDIATE RESPONSE
  res.json({
    status: 'accepted',
    jobId: job.id,
    // ... other fields
  });
  
  // 3. ASYNC PROCESSING (after response sent)
  processJobAsync(job.id)
    .catch(error => {
      updateJobStatus(job.id, 'failed', { error: error.message });
    });
});

async function processJobAsync(jobId) {
  const job = await getJob(jobId);
  
  try {
    // Update to processing
    await updateJobStatus(jobId, 'processing', { startedAt: new Date() });
    
    // Call EC2 webhook
    const response = await callEC2Webhook(job);
    
    // Update to completed
    await updateJobStatus(jobId, 'completed', { 
      completedAt: new Date(),
      ec2Response: response 
    });
    
  } catch (error) {
    await updateJobStatus(jobId, 'failed', { 
      completedAt: new Date(),
      error: error.message 
    });
  }
}
```

### 2. Job Storage Requirements

**Option A: In-Memory (Development)**
```javascript
const jobs = new Map();
```

**Option B: Database (Production)**
- Table: `research_jobs`
- Indexes: `id`, `status`, `teamType`, `submittedAt`
- TTL: Jobs older than 30 days auto-deleted

### 3. EC2 Webhook Integration

**Webhook Payload** (same as before):
```json
{
  "repository": "Flying-Pig-Labs/ci-black-a3x9k",
  "branch": "main", 
  "command": "npx claude-flow@alpha swarm 'Explore replacing...' --mode distributed --max-agents 5 --parallel --output json"
}
```

**Headers**:
```
Authorization: Bearer test-secret-2024
Content-Type: application/json
```

---

## 🎨 Frontend Integration

### Expected UI Flow

1. **User submits form** → Gets immediate "accepted" response with jobId
2. **UI shows**: "Request submitted! Processing in background..."
3. **User can click "Check Status"** → Calls `/api/ec2/status/:jobId`
4. **Status updates**:
   - `submitted` → "Submitted" badge
   - `processing` → "Processing..." badge with spinner
   - `completed` → "Completed" badge + GitHub link
   - `failed` → "Failed" badge + error message

### Polling Strategy

Frontend will implement smart polling:
- Check job status every 10 seconds for first 2 minutes
- Then every 30 seconds for next 3 minutes  
- Then every 60 seconds until completion
- Stop polling after 10 minutes or on completion/failure

### GitHub Integration

Once job status = "completed":
- UI shows GitHub icon/link
- Users can click to view results
- Background GitHub polling can verify repo exists

---

## 🧪 Testing Requirements

### Unit Tests

1. **Job Creation**: Verify job object creation and storage
2. **Status Updates**: Test all status transitions
3. **Error Handling**: Test failed EC2 calls
4. **Filtering**: Test job list filtering by team/status

### Integration Tests

1. **End-to-End Flow**: Submit → Process → Complete
2. **EC2 Connectivity**: Test actual webhook calls
3. **Concurrent Jobs**: Multiple jobs processing simultaneously
4. **Error Recovery**: Handle EC2 timeouts/failures

### API Tests

```bash
# Test immediate response
curl -X POST localhost:3001/api/ec2/analyze \
  -H "Content-Type: application/json" \
  -d '{"teamType":"black","repoId":"test1","formData":{}}'

# Test job status
curl -X GET localhost:3001/api/ec2/status/black-test1-1234567890

# Test job listing  
curl -X GET localhost:3001/api/ec2/jobs?teamType=black
```

---

## 🚨 Error Handling

### EC2 Webhook Failures

- **Timeout**: Job status → "failed" with timeout error
- **Connection Error**: Job status → "failed" with connection error  
- **HTTP Error**: Job status → "failed" with HTTP status + message
- **Invalid Response**: Job status → "failed" with parse error

### Edge Cases

- **Duplicate JobIDs**: Include timestamp to ensure uniqueness
- **Memory Leaks**: Clean up old completed jobs (TTL)
- **Server Restart**: Persist jobs to survive restarts
- **Concurrent Access**: Handle race conditions in status updates

---

## 📝 Example Responses

### Successful Flow

1. **Submit Request**:
```json
POST /api/ec2/analyze
→ 200 OK {"status":"accepted","jobId":"black-a3x9k-1737378645123",...}
```

2. **Check Status (Processing)**:
```json
GET /api/ec2/status/black-a3x9k-1737378645123
→ 200 OK {"status":"processing","startedAt":"2025-07-20T13:54:12.150Z",...}
```

3. **Check Status (Completed)**:
```json
GET /api/ec2/status/black-a3x9k-1737378645123
→ 200 OK {"status":"completed","completedAt":"2025-07-20T13:57:33.442Z",...}
```

### Error Flow

1. **Submit Request**: 
```json
POST /api/ec2/analyze
→ 200 OK {"status":"accepted","jobId":"black-xyz99-1737378645124",...}
```

2. **Check Status (Failed)**:
```json
GET /api/ec2/status/black-xyz99-1737378645124
→ 200 OK {"status":"failed","error":"EC2 webhook timeout","completedAt":"..."}
```

---

## 🚀 Deployment Notes

### Environment Variables

```bash
EC2_WEBHOOK_URL=http://54.162.132.68:5000
EC2_WEBHOOK_TOKEN=test-secret-2024
GITHUB_ORG=Flying-Pig-Labs
JOB_CLEANUP_INTERVAL=86400000  # 24 hours in ms
MAX_JOB_AGE=2592000000        # 30 days in ms
```

### Monitoring

- **Metrics**: Job submission rate, completion rate, error rate
- **Alerts**: High failure rate, EC2 connectivity issues
- **Logs**: Job state changes, EC2 call attempts, errors

---

## ✅ Acceptance Criteria

- [ ] Immediate response (< 100ms) for research submissions
- [ ] Background EC2 processing with status tracking
- [ ] Job status API returns correct status and timestamps
- [ ] Job list API supports filtering and pagination
- [ ] Error handling for all EC2 failure scenarios
- [ ] Frontend can poll and update UI based on job status
- [ ] Jobs persist across server restarts (if using database)
- [ ] Old jobs are cleaned up automatically

---

## 📋 Implementation Checklist

### Phase 1: Core Async Pattern
- [ ] Modify `/api/ec2/analyze` for immediate response
- [ ] Implement job storage (Map or database)
- [ ] Add async EC2 processing function
- [ ] Basic error handling

### Phase 2: Status Endpoints  
- [ ] Add `GET /api/ec2/status/:jobId` endpoint
- [ ] Add `GET /api/ec2/jobs` endpoint
- [ ] Add filtering and pagination
- [ ] Comprehensive error responses

### Phase 3: Production Ready
- [ ] Database persistence (if needed)
- [ ] Job cleanup/TTL
- [ ] Monitoring and logging
- [ ] Load testing

This spec ensures the backend supports the full async workflow while maintaining a great user experience! 🎯