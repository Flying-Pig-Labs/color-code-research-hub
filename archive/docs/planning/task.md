# Instructions

We currently have a front-end that's sending requests to the backend via APIGW and Lambda to start a research job. We need to make some updates to the way these requests are handled so that they successfully reach the backend.

Here are the specs of the new backend server where the requests will ultimatley arrive after passing through APIGW and Lambda.

The API server offers these API endpoints:
   - Health check: GET http://<IP ADDRESS>:3456/health
   - Execute swarm: POST http://<IP ADDRESS>:3456/api/swarm/execute
   - Check status: GET http://<IP ADDRESS>:3456/api/swarm/{swarmId}/status

 An example curl command for a swarm where the OBJECTIVE is the research requested from the frontend would be:
 curl -X POST http://<IP ADDRESS>:3456/api/swarm/execute \
   -H "Content-Type: application/json" \
   -d '{
     "objective": $OBJECTIVE,
     "flags": {
       "executor": true,
       "output-format": "json"
     }
   }'

   I'm not sure how well the Lambda function returns the response to the API all the way back to the web app, but ideally this is what happens because it's packed with valuable info.

   When the execute swarm route is called (specifically the POST /api/swarm/create endpoint), it returns:

  Initial Response (201 Created):
  {
    "swarmId": "swarm-abc123",
    "status": "planning",
    "message": "Swarm created successfully",
    "data": {
      "objective": "Your objective here",
      "strategy": "hybrid",
      "mode": "distributed",
      "maxAgents": 5
    },
    "timestamp": "2025-07-29T..."
  }

  The swarm is created in a "planning" state. To actually execute it, you need to call:

  POST /api/swarm/{swarmId}/start

  Which returns:
  {
    "swarmId": "swarm-abc123",
    "status": "executing",
    "message": "Swarm started successfully",
    "timestamp": "2025-07-29T..."
  }

  To get execution results:
  1. Poll the status endpoint: GET /api/swarm/{swarmId}/status
  3. Check the results endpoint when status is "completed": GET /api/swarm/{swarmId}/results

  Additionally, the server's Bridge API provides access to detailed logs through the /api/swarm/:swarmId/logs endpoint:

  Available log levels:
  - info - General information
  - debug - Detailed debug information
  - warn - Warnings
  - error - Errors

  API endpoints for logs:
  # Get logs for a specific swarm
  GET /api/swarm/{swarmId}/logs?limit=100&offset=0&level=debug

  Example to get verbose logs:
  # Get all debug logs for a swarm (which is what we'd want to use for polling)
  curl http://localhost:3456/api/swarm/YOUR_SWARM_ID/logs?level=debug&limit=1000

  The logs include:
  - Agent execution details
  - Task progress updates
  - Error messages with stack traces
  - Performance metrics
  - Resource utilization
