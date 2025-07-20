# EC2 Integration Checklist & Implementation Plan

## 📋 Complete Localhost Requirements Checklist

### ✅ Current Status Assessment

Based on my analysis, here's what your localhost website needs to interact with the EC2 instance:

#### 🟢 Already Implemented:
- [x] **Frontend Forms** - BlackResearchSwarmForm.tsx, WhiteResearchSwarmForm.tsx exist
- [x] **Basic API Service** - api.ts with health check, submit, polling
- [x] **Backend Server** - server.js with endpoints (but wrong field structure)
- [x] **Environment Config** - .env.example with API configuration
- [x] **Form Configuration** - form-customization-config.json with team definitions
- [x] **Error Handling** - ApiError types and toast notifications
- [x] **API Environment Hook** - useApiEnvironment.ts for status checking

#### 🔴 Missing/Needs Update:
- [ ] **EC2 Webhook Integration** - Need to point to EC2 instead of local mock
- [ ] **Form Field Mapping** - Current forms don't match EC2 expectations
- [ ] **ClaudeFlowResearchClient** - Not integrated into frontend
- [ ] **Competitive Intelligence Endpoints** - Backend has wrong endpoints
- [ ] **Job Status Display** - Need to show GitHub repo link when complete
- [ ] **Form Data Processor** - Missing transformation logic
- [ ] **EC2-specific Environment Variables** - Need EC2_WEBHOOK_URL
- [ ] **Webhook Signature Verification** - Security feature not implemented

## 🚀 Step-by-Step Implementation Plan

### Step 1: Update Environment Configuration
```bash
# Add to .env.local
VITE_EC2_WEBHOOK_URL=http://YOUR-EC2-IP
VITE_WEBHOOK_SECRET=your-webhook-secret
VITE_USE_EC2_BACKEND=true
```

### Step 2: Replace Backend Endpoints

**Current Issue**: Your backend server.js has generic red/black/white team fields, not the competitive intelligence fields expected by EC2.

**Action**: Update backend/server.js to proxy to EC2 or transform data properly.

### Step 3: Integrate ClaudeFlowResearchClient

1. Copy `LOCAL_UI_WEBHOOK_CLIENT.js` to `src/services/claudeFlowClient.ts`
2. Convert to TypeScript
3. Update api.ts to use it when EC2 mode is enabled

### Step 4: Update Form Components

The current forms need to match the EC2 expected structure:
- **companyName** instead of vendorName/productName
- Add missing fields from form-customization-config.json
- Remove fields not in the EC2 configuration

### Step 5: Add Form Data Transformation

Create `src/services/formDataProcessor.ts` to transform UI form data to EC2 format.

### Step 6: Update API Service for EC2

Modify `src/services/api.ts` to:
1. Check if EC2 mode is enabled
2. Use different endpoints for EC2 vs local
3. Handle GitHub repository URL in results

### Step 7: Add Job Status UI Components

Create components to show:
- Processing status with progress
- GitHub repository link when complete
- Download options for reports

### Step 8: Implement Security Features

Add webhook signature verification when configured.

## 🛠️ Detailed Implementation

### 1. Updated Environment Variables (.env.local)
```env
# Local Backend (existing)
VITE_API_BASE_URL=http://localhost:3001
VITE_API_KEY=local-dev-key

# EC2 Integration (new)
VITE_USE_EC2_BACKEND=true
VITE_EC2_WEBHOOK_URL=http://YOUR-EC2-PUBLIC-IP
VITE_WEBHOOK_SECRET=your-webhook-secret-here

# Feature Flags
VITE_ENABLE_GITHUB_INTEGRATION=true
VITE_ENABLE_JOB_DOWNLOADS=true
```

### 2. API Service Updates (src/services/api.ts)
```typescript
// Add EC2-specific configuration
const EC2_ENABLED = import.meta.env.VITE_USE_EC2_BACKEND === 'true';
const EC2_WEBHOOK_URL = import.meta.env.VITE_EC2_WEBHOOK_URL || '';

// Update submission to handle EC2 format
async submitResearch(submission: ResearchSubmission): Promise<{ jobId: string }> {
  if (EC2_ENABLED) {
    // Transform to EC2 format
    const ec2Payload = {
      teamType: submission.teamType,
      formData: {
        companyName: submission.fields.companyName || submission.fields.vendorName,
        ...submission.fields
      }
    };
    
    return fetchWithErrorHandling<{ jobId: string }>(
      `${EC2_WEBHOOK_URL}/api/analyze`,
      {
        method: 'POST',
        body: JSON.stringify(ec2Payload),
      }
    );
  }
  
  // Existing local backend logic
  return this.submitToLocalBackend(submission);
}
```

### 3. Form Updates (Example for BlackResearchSwarmForm)
```typescript
// Add company name field
const [companyName, setCompanyName] = useState("");

// Update submission data
const researchData = {
  companyName, // Add this
  toolCategories,
  informationSources,
  // ... rest of fields
};
```

### 4. Backend Proxy Updates (backend/server.js)
```javascript
// Add EC2 proxy endpoints
app.post('/api/analyze', async (req, res) => {
  if (process.env.EC2_WEBHOOK_URL) {
    // Proxy to EC2
    try {
      const response = await fetch(`${process.env.EC2_WEBHOOK_URL}/api/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': generateSignature(req.body)
        },
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'EC2 proxy failed' });
    }
  } else {
    // Handle locally
    handleLocalAnalysis(req, res);
  }
});
```

### 5. Results Display Component
```typescript
// New component: src/components/ResearchResults.tsx
interface ResearchResultsProps {
  job: ResearchJob;
}

export const ResearchResults = ({ job }: ResearchResultsProps) => {
  if (job.status !== 'completed') return null;
  
  const githubUrl = job.results?.output?.repository_url;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Research Complete!</CardTitle>
      </CardHeader>
      <CardContent>
        {githubUrl && (
          <div className="space-y-4">
            <Alert>
              <AlertDescription>
                Your research has been compiled and pushed to GitHub
              </AlertDescription>
            </Alert>
            <Button asChild>
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                View GitHub Repository
              </a>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
```

## 🔧 Quick Start Commands

```bash
# 1. Copy EC2 integration files
cp LOCAL_UI_WEBHOOK_CLIENT.js src/services/claudeFlowClient.ts
cp form-data-processor.js src/services/formDataProcessor.ts

# 2. Update environment
cp .env.example .env.local
# Edit .env.local with your EC2 details

# 3. Install any missing dependencies
npm install axios archiver

# 4. Start development
npm run dev
```

## 🎯 Priority Order

1. **High Priority** - Get basic EC2 communication working
   - Environment setup
   - API endpoint updates
   - Basic form submission

2. **Medium Priority** - Full feature parity
   - Form field mapping
   - Status polling
   - Results display

3. **Low Priority** - Enhanced features
   - Download functionality
   - Advanced error handling
   - Performance optimization

## 📝 Testing Checklist

- [ ] Can submit form to EC2
- [ ] Receives job ID back
- [ ] Can poll for status
- [ ] Displays GitHub repo link
- [ ] Handles errors gracefully
- [ ] Works with both local and EC2 backends