# Ideate Button Implementation

## Overview
Added an "Ideate" button to the Report View pages for all three Wayfinder teams (Red, Black, and White). This button triggers an AWS Lambda function that processes the research document through a 7-stage pipeline and creates a GitHub repository with the results.

## Implementation Details

### 1. Frontend Components Modified

#### ReportView.tsx
- Added `Sparkles` icon from lucide-react
- Added `isIdeating` state to track button loading state
- Created `handleIdeate` function to call the API
- Added the Ideate button with purple-pink gradient styling
- Button is positioned between team badge and Download button

### 2. API Service Integration

#### api.ts
Added new function `startIdeationPipeline`:
```typescript
async startIdeationPipeline(researchDocId: string, username: string = 'fprior'): Promise<any>
```

This function calls the `/api/start-pipeline` endpoint with:
- `researchDocId`: The research document ID (same as reportId)
- `username`: User identifier (defaults to 'fprior')

### 3. Button Features

- **Visual Design**: Purple-to-pink gradient with sparkles icon
- **Loading State**: Shows "Starting..." text and disables button during processing
- **Success Feedback**: 
  - Toast notification when pipeline starts
  - Additional toast with GitHub repo link when created
  - Option to open repository in new tab

### 4. User Flow

1. User opens a research report from any team (Red/Black/White)
2. Clicks the prominent "Ideate" button in the header
3. Lambda function processes the research document:
   - Retrieves document from S3: `users/{username}/research/{research_id}/request.json`
   - Processes through 7 stages
   - Stores outputs in S3: `users/{username}/research/{research_id}/outputs/`
   - Creates GitHub repository using repo name from DynamoDB record
4. User receives notification with link to new GitHub repository

### 5. Error Handling

- Graceful error handling with toast notifications
- Specific error messages displayed to user
- Button returns to normal state after error

### 6. Testing Instructions

1. Navigate to any research report view
2. Look for the purple "Ideate" button next to the team badge
3. Click the button and observe:
   - Button changes to "Starting..." state
   - Success toast appears
   - GitHub repository link toast appears (if Lambda completes)
4. Verify the button is disabled during processing
5. Test error scenarios by disconnecting network or using invalid report IDs

## Technical Notes

- The `reportId` in the frontend corresponds to `research_id` in the S3 structure
- The Lambda function expects the research document at the standardized S3 path
- GitHub repository name is retrieved from the DynamoDB record
- All three team types (Red, Black, White) share the same ReportView component