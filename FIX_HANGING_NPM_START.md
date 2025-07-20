# Fix for Hanging npm start

## Problem
The app was hanging on `npm start` because:
1. A server instance was already running on port 3000 (PID 5811)
2. Running `npm start` again attempted to bind to the same port, causing it to hang indefinitely

## Solution
Kill the existing server process before starting a new one:

```bash
# Find the process using port 3000
lsof -i :3000

# Kill the process (replace PID with the actual process ID)
kill [PID]

# Start the server again
npm start
```

## Prevention
To prevent this issue in the future:

1. **Always check if the server is already running** before starting it:
   ```bash
   lsof -i :3000
   ```

2. **Use a process manager** like `pm2` or `nodemon` (already in devDependencies):
   ```bash
   npm run dev  # Uses nodemon which handles restarts gracefully
   ```

3. **Add a startup check** to the server that exits gracefully if the port is already in use

## Server Details
- **Port**: 3000 (configurable via PORT environment variable)
- **Entry point**: `server-endpoint.js`
- **Purpose**: Competitive Intelligence API server with endpoints for form processing and analysis

## Available Endpoints
- `GET /health` - Health check
- `GET /api/form-config/:teamType` - Get form configuration
- `POST /api/analyze` - Submit analysis request
- `GET /api/status/:jobId` - Check job status
- `GET /api/report/:jobId` - Get analysis report
- `GET /api/download/:jobId` - Download full results