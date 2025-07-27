# Claude Flow Direct Log Access Endpoints

These Lambda functions provide direct access to Claude Flow execution logs without requiring frontend handling of S3 URLs.

## New Endpoints

### 1. Get Execution Logs
- **URL**: `GET /api/claude-flow/execution/{id}/logs`
- **Query Parameters**:
  - `type` (optional): `stdout` | `stderr` | `all` (default: `stdout`)
  - `tail` (optional): number of lines from end (default: all)
- **Response**: Text/plain with log content
- **Example**: 
  ```bash
  curl https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/claude-flow/execution/exec-1753631657732/logs?tail=20
  ```

### 2. Get Execution Metadata
- **URL**: `GET /api/claude-flow/execution/{id}/metadata`
- **Response**: JSON with execution details
- **Example**:
  ```bash
  curl https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production/api/claude-flow/execution/exec-1753631657732/metadata
  ```

### 3. Get Latest Activity
- **URL**: `GET /api/claude-flow/execution/{id}/activity`
- **Query Parameters**:
  - `lines` (optional): number of recent lines (default: 50)
- **Response**: JSON with status and recent activity
- **Example Response**:
  ```json
  {
    "executionId": "exec-1753631657732",
    "status": "running",
    "recentActivity": [
      "[12:07:37] Starting research on Richmond, VA population...",
      "[12:07:38] Agent coordinator-1 initialized",
      "[12:07:39] Agent researcher-1 analyzing demographic data..."
    ],
    "lastUpdated": "2025-01-27T16:07:40.000Z",
    "taskCount": 10,
    "completedTasks": 5
  }
  ```

## Frontend Usage Example

```javascript
// Poll for latest activity every 5 seconds
const pollActivity = async (executionId) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/claude-flow/execution/${executionId}/activity?lines=20`
    );
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Status: ${data.status}`);
      console.log(`Progress: ${data.completedTasks}/${data.taskCount} tasks`);
      
      // Display recent activity
      data.recentActivity.forEach(line => {
        console.log(line);
      });
    }
  } catch (error) {
    console.error('Failed to fetch activity:', error);
  }
};

// Start polling
const executionId = 'exec-1753631657732';
const intervalId = setInterval(() => pollActivity(executionId), 5000);

// Stop polling when done
// clearInterval(intervalId);
```

## Lambda Functions Created

1. **claudeFlowExecutionLogs.js** - Fetches and returns log content
2. **claudeFlowExecutionMetadata.js** - Fetches and returns execution metadata
3. **claudeFlowExecutionActivity.js** - Combines status and recent logs

## Environment Variables

- `EC2_HOST`: 18.209.36.58
- `EC2_PORT`: 8080

These are configured in the SAM template for each function.