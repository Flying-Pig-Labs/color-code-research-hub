# EC2 Research Team Integration Guide

## Overview
This guide documents the integration between the Color Code Research Hub frontend (Sita) and the Claude Flow research API running on EC2 (Ram).

## What Was Integrated

### 1. Research API Service (`src/services/researchApi.ts`)
Created a new service to handle communication with the EC2 research endpoint:
- `submitResearch()` - Submits research tasks to `/research` endpoint
- `checkResearchStatus()` - Polls `/execution/{requestId}` for status updates
- Format functions for each team type (Red, White, Black)

### 2. Research Form Components
Updated all three research form components to use the EC2 integration:

#### Red Team (`ResearchSwarmForm.tsx`)
- Submits competitive disruption analysis requests
- Formats data using `formatRedTeamPrompt()`
- Polls for status updates every 5 seconds

#### White Team (`WhiteResearchSwarmForm.tsx`)
- Submits market opportunity discovery requests
- Formats data using `formatWhiteTeamPrompt()`
- Shows progress and completion status

#### Black Team (`BlackResearchSwarmForm.tsx`)
- Submits vendor replacement engineering requests
- Formats data using `formatBlackTeamPrompt()`
- Handles real-time status updates

### 3. Research Request Table (`ResearchRequestTable.tsx`)
- Automatically polls for status updates of processing tasks
- Updates localStorage when tasks complete
- Shows real-time progress for all research requests

## Configuration

### Environment Variables
Add to your `.env.local`:
```env
# EC2 Claude Flow endpoint
VITE_EC2_ENDPOINT=http://your-ec2-ip:8080
```

### Default Configuration
If no EC2 endpoint is configured, the system falls back to `http://localhost:8080`.

## How It Works

### 1. Research Submission Flow
1. User fills out research form (Red/White/Black team)
2. Form data is formatted into a research prompt
3. Request is sent to `POST /research` with task data
4. EC2 returns a `request_id` for tracking

### 2. Status Polling
1. Forms poll `/execution/{request_id}` every 5 seconds
2. Status can be: `processing`, `completed`, or `failed`
3. On completion, results are stored in localStorage
4. UI updates automatically to show results

### 3. Data Flow
```
Frontend Form → formatTeamPrompt() → /research API → EC2 Claude Flow
                                                          ↓
ResearchRequestTable ← localStorage ← Status Polling ← /execution/{id}
```

## API Endpoints

### Submit Research
```http
POST http://<ec2-ip>:8080/research
Content-Type: application/json

{
  "task": "Formatted research prompt",
  "teamType": "red" | "white" | "black"
}
```

### Check Status
```http
GET http://<ec2-ip>:8080/execution/{request_id}
```

Response:
```json
{
  "request_id": "string",
  "status": "processing" | "completed" | "failed",
  "result": {},
  "error": "string (if failed)"
}
```

## Testing

1. Configure your EC2 endpoint in `.env.local`
2. Start the frontend: `npm run dev`
3. Navigate to any research team page
4. Fill out and submit the research form
5. Watch the progress bar and status updates
6. Check the Research Requests table for results

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check EC2 security group allows port 8080
   - Verify Claude Flow is running on EC2
   - Check VITE_EC2_ENDPOINT is correct

2. **CORS Errors**
   - Ensure EC2 Claude Flow has CORS enabled
   - Check browser console for specific CORS errors

3. **Status Not Updating**
   - Verify polling is working (check Network tab)
   - Check localStorage for stored tasks
   - Ensure request_id is being saved correctly

## Future Enhancements

1. Add WebSocket support for real-time updates
2. Implement retry logic for failed requests
3. Add result visualization components
4. Support batch research submissions
5. Add export functionality for research results