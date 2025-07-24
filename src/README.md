# Frontend Documentation

## Overview

React + Vite frontend for Color Code Research Hub, deployed on AWS Amplify.

## Key Directories

- **components/**: Reusable React components
  - **plan/**: Plan generation workflow components
  - **ui/**: shadcn/ui components
- **pages/**: Main page components
- **hooks/**: Custom React hooks
- **lib/**: Utility functions

## Important Components

### Plan Generation Workflow

1. **PlanTab.tsx**: Repository selection page
2. **PlanWorkflow.tsx**: Standard plan generation (V2)
3. **EnhancedPlanWorkflow.tsx**: Async plan generation with CLI logic
4. **PlanGenerationProgress.tsx**: Progress tracking UI

### Workflow Components (from agent-team-composer)
- **ParseProduct.tsx**: Project metadata form
- **LifecyclePhases.tsx**: 8-phase SDLC display
- **EpicIssueView.tsx**: Epic and issue management
- **ReviewSubmit.tsx**: Final review before GitHub sync

## Environment Variables

**Required in `.env.production`:**
```env
VITE_API_BASE_URL=https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production
```

**Important**: Must use `VITE_API_BASE_URL` (not `VITE_API_URL`)

## Key Features

### Async Plan Generation
- Initiates job via POST /api/plan/async/start
- Polls status every 3 seconds
- Shows real-time progress through 5 stages
- Handles 15+ minute processing times

### Progress Tracking
```javascript
// Polling pattern
useEffect(() => {
  const interval = setInterval(async () => {
    const response = await fetch(`${API_BASE_URL}/api/plan/async/status/${jobId}`);
    const data = await response.json();
    
    if (data.status === 'COMPLETED' || data.status === 'FAILED') {
      clearInterval(interval);
    }
  }, 3000);
  
  return () => clearInterval(interval);
}, [jobId]);
```

## Deployment

### Automatic (via GitHub push)
```bash
git push origin main
# Amplify auto-deploys in 2-3 minutes
```

### Manual Trigger
1. Go to AWS Amplify Console
2. Select app: color-code-research-hub
3. Click "Redeploy this version"

## Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Styling

- Uses Tailwind CSS
- shadcn/ui components in components/ui/
- Custom styles in index.css

## State Management

Currently using React's built-in state (useState, useContext).
No Redux or other state management library.

## API Integration

All API calls use the pattern:
```javascript
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/endpoint`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
});
```

## Error Handling

Uses toast notifications:
```javascript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: "Error",
  description: "Something went wrong",
  variant: "destructive"
});
```

## Testing

No tests currently implemented. Would benefit from:
- Component tests with React Testing Library
- Integration tests for API calls
- E2E tests with Cypress/Playwright