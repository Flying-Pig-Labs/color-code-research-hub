# EC2 Integration Implementation Guide

## 🎯 Current State Analysis

Your localhost app is **partially ready** but needs significant updates to work with the EC2 instance. Here's what needs to change:

### Key Mismatches:
1. **Backend expects wrong field structure** - Generic red/black/white fields vs competitive intelligence fields
2. **No EC2 webhook client integration** - Using local mock instead of EC2
3. **Forms don't include company name** - Critical field missing
4. **No GitHub repo display** - Results UI doesn't show repo link

## 🚀 Implementation Steps

### Step 1: Update Backend to Proxy EC2 Requests

**File: `backend/server.js`**

Replace the entire file with this EC2-aware version:

```javascript
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import crypto from 'crypto';

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration
const EC2_WEBHOOK_URL = process.env.EC2_WEBHOOK_URL;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const USE_EC2 = process.env.USE_EC2_BACKEND === 'true';

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Helper to generate webhook signature
function generateWebhookSignature(payload) {
  if (!WEBHOOK_SECRET) return null;
  return 'sha256=' + crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
}

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: USE_EC2 ? 'ec2-proxy' : 'local-mock',
    ec2Configured: !!EC2_WEBHOOK_URL
  });
});

// Get form configuration for team
app.get('/api/form-config/:teamType', async (req, res) => {
  try {
    // Load from local form-customization-config.json
    const formConfig = require('../form-customization-config.json');
    const teamConfig = formConfig.teams[req.params.teamType];
    
    if (!teamConfig) {
      return res.status(404).json({ error: 'Team type not found' });
    }
    
    res.json(teamConfig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load form configuration' });
  }
});

// Submit analysis - proxy to EC2 or handle locally
app.post('/api/analyze', async (req, res) => {
  const { teamType, formData } = req.body;
  
  if (!teamType || !formData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  if (USE_EC2 && EC2_WEBHOOK_URL) {
    // Proxy to EC2
    try {
      const headers = {
        'Content-Type': 'application/json',
      };
      
      const signature = generateWebhookSignature(req.body);
      if (signature) {
        headers['X-Webhook-Signature'] = signature;
      }
      
      const response = await fetch(`${EC2_WEBHOOK_URL}/api/analyze`, {
        method: 'POST',
        headers,
        body: JSON.stringify(req.body)
      });
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('EC2 proxy error:', error);
      res.status(500).json({ error: 'Failed to proxy to EC2' });
    }
  } else {
    // Local mock response
    const jobId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate async processing
    setTimeout(() => {
      console.log(`Mock job ${jobId} would complete here`);
    }, 5000);
    
    res.json({
      jobId,
      status: 'accepted',
      message: 'Analysis started (local mock)',
      statusUrl: `/api/status/${jobId}`
    });
  }
});

// Get job status - proxy to EC2 or return mock
app.get('/api/status/:jobId', async (req, res) => {
  const { jobId } = req.params;
  
  if (USE_EC2 && EC2_WEBHOOK_URL && !jobId.startsWith('local-')) {
    // Proxy to EC2
    try {
      const response = await fetch(`${EC2_WEBHOOK_URL}/api/status/${jobId}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get status from EC2' });
    }
  } else {
    // Local mock status
    const mockStatus = {
      jobId,
      status: 'completed',
      teamType: 'red',
      company: 'Mock Company',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      results: {
        overallScore: 85,
        recommendations: ['Recommendation 1', 'Recommendation 2'],
        reportUrl: `/api/report/${jobId}`,
        // Mock GitHub URL for local testing
        output: {
          repository_url: 'https://github.com/example/ci-red-mockcompany-20240120'
        }
      }
    };
    
    res.json(mockStatus);
  }
});

// Get report - proxy to EC2 or return mock
app.get('/api/report/:jobId', async (req, res) => {
  const { jobId } = req.params;
  
  if (USE_EC2 && EC2_WEBHOOK_URL && !jobId.startsWith('local-')) {
    // Proxy to EC2
    try {
      const acceptHeader = req.get('Accept');
      const response = await fetch(`${EC2_WEBHOOK_URL}/api/report/${jobId}`, {
        headers: { 'Accept': acceptHeader || 'application/json' }
      });
      
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('text/markdown')) {
        const text = await response.text();
        res.type('text/markdown').send(text);
      } else {
        const data = await response.json();
        res.json(data);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to get report from EC2' });
    }
  } else {
    // Local mock report
    res.json({
      metadata: { teamType: 'red', company: 'Mock Company' },
      grading: { overall_score: 85 },
      results: { findings: ['Finding 1', 'Finding 2'] }
    });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  console.log(`Mode: ${USE_EC2 ? 'EC2 Proxy' : 'Local Mock'}`);
  if (USE_EC2) {
    console.log(`EC2 Webhook URL: ${EC2_WEBHOOK_URL || 'Not configured'}`);
  }
});
```

### Step 2: Create TypeScript Webhook Client

**File: `src/services/claudeFlowClient.ts`**

```typescript
import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import crypto from 'crypto';

interface ClaudeFlowConfig {
  baseUrl: string;
  apiKey?: string;
  webhookSecret?: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

interface ResearchParams {
  intent?: string;
  teamType: 'red' | 'black' | 'white';
  formData: Record<string, any>;
  swarmConfig?: Record<string, any>;
  researchConfig?: Record<string, any>;
  metadata?: Record<string, any>;
}

interface JobResponse {
  success?: boolean;
  jobId: string;
  message?: string;
  statusUrl?: string;
}

interface JobStatus {
  status: 'running' | 'completed' | 'failed';
  jobId: string;
  output?: {
    repository_url?: string;
    repository_name?: string;
    selected_product?: any;
    research_summary?: string;
  };
  results?: any;
  error?: string;
}

export class ClaudeFlowResearchClient extends EventEmitter {
  private client: AxiosInstance;
  private config: ClaudeFlowConfig;

  constructor(config: ClaudeFlowConfig) {
    super();
    this.config = config;
    
    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        ...(config.apiKey && { 'X-API-Key': config.apiKey })
      }
    });
    
    if (config.webhookSecret) {
      this.client.interceptors.request.use(this.addWebhookSignature.bind(this));
    }
  }

  private addWebhookSignature(config: any) {
    if (config.data && config.method === 'post' && this.config.webhookSecret) {
      const payload = JSON.stringify(config.data);
      const signature = 'sha256=' + crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(payload)
        .digest('hex');
      
      config.headers['X-Webhook-Signature'] = signature;
    }
    return config;
  }

  async submitResearch(params: ResearchParams): Promise<JobResponse> {
    try {
      const response = await this.client.post<JobResponse>('/api/analyze', {
        teamType: params.teamType,
        formData: params.formData
      });
      
      this.emit('jobSubmitted', response.data);
      return response.data;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async checkJobStatus(jobId: string): Promise<JobStatus> {
    try {
      const response = await this.client.get<JobStatus>(`/api/status/${jobId}`);
      
      if (response.data.status === 'completed') {
        this.emit('jobCompleted', response.data);
      }
      
      return response.data;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async getJobReport(jobId: string, format: 'json' | 'markdown' = 'json'): Promise<any> {
    try {
      const headers = format === 'markdown' 
        ? { 'Accept': 'text/markdown' } 
        : { 'Accept': 'application/json' };
        
      const response = await this.client.get(`/api/report/${jobId}`, { headers });
      return response.data;
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  async waitForCompletion(
    jobId: string, 
    options: {
      pollInterval?: number;
      maxWaitTime?: number;
      onProgress?: (status: JobStatus) => void;
    } = {}
  ): Promise<JobStatus> {
    const {
      pollInterval = 5000,
      maxWaitTime = 600000, // 10 minutes
      onProgress
    } = options;
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.checkJobStatus(jobId);
      
      if (onProgress) {
        onProgress(status);
      }
      
      if (status.status === 'completed') {
        return status;
      }
      
      if (status.status === 'failed') {
        throw new Error(`Job failed: ${status.error || 'Unknown error'}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error(`Job timed out after ${maxWaitTime}ms`);
  }
}
```

### Step 3: Update API Service for Dual Mode

**File: `src/services/api.ts`**

Add EC2 support to existing api.ts:

```typescript
// Add imports
import { ClaudeFlowResearchClient } from './claudeFlowClient';

// Add EC2 configuration
const USE_EC2 = import.meta.env.VITE_USE_EC2_BACKEND === 'true';
const EC2_WEBHOOK_URL = import.meta.env.VITE_EC2_WEBHOOK_URL || '';
const WEBHOOK_SECRET = import.meta.env.VITE_WEBHOOK_SECRET || '';

// Create EC2 client if enabled
let ec2Client: ClaudeFlowResearchClient | null = null;
if (USE_EC2 && EC2_WEBHOOK_URL) {
  ec2Client = new ClaudeFlowResearchClient({
    baseUrl: EC2_WEBHOOK_URL,
    webhookSecret: WEBHOOK_SECRET,
  });
}

// Update the submitResearch method
async submitResearch(submission: ResearchSubmission): Promise<{ jobId: string }> {
  // For EC2, transform to expected format
  if (USE_EC2 && ec2Client) {
    const formData: Record<string, any> = {
      companyName: submission.fields.companyName || 
                   submission.fields.vendorName || 
                   submission.fields.company,
      ...submission.fields
    };
    
    const response = await ec2Client.submitResearch({
      teamType: submission.teamType,
      formData
    });
    
    return { jobId: response.jobId };
  }
  
  // Existing local backend code
  return fetchWithErrorHandling<{ jobId: string }>(
    `${API_BASE_URL}/research/submit`,
    {
      method: 'POST',
      body: JSON.stringify(submission),
    }
  );
},

// Update getJobStatus to handle EC2 response
async getJobStatus(jobId: string): Promise<ResearchJob> {
  if (USE_EC2 && ec2Client) {
    const status = await ec2Client.checkJobStatus(jobId);
    
    // Transform EC2 status to local format
    return {
      jobId: status.jobId,
      status: status.status === 'running' ? 'processing' : status.status,
      createdAt: new Date().toISOString(),
      completedAt: status.status === 'completed' ? new Date().toISOString() : undefined,
      result: status.output || status.results,
      error: status.error
    };
  }
  
  // Existing local backend code
  return fetchWithErrorHandling<ResearchJob>(
    `${API_BASE_URL}/research/status/${jobId}`,
    { method: 'GET' }
  );
},
```

### Step 4: Update Form Components

**File: `src/components/BlackResearchSwarmForm.tsx`**

Add company name field at the top of the form:

```typescript
// Add state
const [companyName, setCompanyName] = useState("");

// Add field in JSX (after DialogHeader)
<div className="space-y-2">
  <Label htmlFor="companyName">Target Company Name</Label>
  <Input
    id="companyName"
    placeholder="e.g., Google, Amazon, Meta..."
    value={companyName}
    onChange={(e) => setCompanyName(e.target.value)}
    required
  />
</div>

// Update handleLaunchSwarm data
const researchData = {
  companyName, // Add this
  toolCategories,
  informationSources,
  // ... rest of fields
};
```

### Step 5: Add Results Display

**File: `src/components/ResearchResults.tsx`**

```typescript
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExternalLink, Github, Download } from "lucide-react";
import { ResearchJob } from "@/services/api";

interface ResearchResultsProps {
  job: ResearchJob;
  teamType: 'red' | 'black' | 'white';
}

export const ResearchResults = ({ job, teamType }: ResearchResultsProps) => {
  if (job.status !== 'completed' || !job.result) {
    return null;
  }

  const githubUrl = job.result.repository_url || job.result.output?.repository_url;
  const overallScore = job.result.overall_score || job.result.grading?.overall_score;
  const recommendations = job.result.recommendations || job.result.grading?.recommendations || [];

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Research Analysis Complete</CardTitle>
        <CardDescription>
          {teamType === 'red' && 'Market Disruption Analysis'}
          {teamType === 'black' && 'Tool Reverse Engineering Report'}
          {teamType === 'white' && 'Whitespace Opportunity Research'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {overallScore && (
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">Overall Score</span>
            <span className="text-2xl font-bold">{overallScore}/100</span>
          </div>
        )}

        {recommendations.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Key Recommendations</h4>
            <ul className="list-disc list-inside space-y-1">
              {recommendations.slice(0, 3).map((rec, idx) => (
                <li key={idx} className="text-sm text-muted-foreground">{rec}</li>
              ))}
            </ul>
          </div>
        )}

        {githubUrl && (
          <Alert>
            <Github className="h-4 w-4" />
            <AlertDescription>
              Full research report has been compiled and pushed to a private GitHub repository
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {githubUrl && (
            <Button asChild>
              <a href={githubUrl} target="_blank" rel="noopener noreferrer">
                <Github className="mr-2 h-4 w-4" />
                View GitHub Repository
              </a>
            </Button>
          )}
          
          <Button variant="outline" asChild>
            <a href={`/api/report/${job.jobId}`} download>
              <Download className="mr-2 h-4 w-4" />
              Download Report
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Step 6: Update Forms to Use Results Component

In each form component, import and use ResearchResults:

```typescript
import { ResearchResults } from "./ResearchResults";

// In the JSX, after the form dialog:
{jobStatus && jobStatus.status === 'completed' && (
  <ResearchResults job={jobStatus} teamType="black" />
)}
```

## 📦 Environment Setup

**File: `.env.local`**

```env
# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_API_KEY=local-dev-key

# EC2 Integration
VITE_USE_EC2_BACKEND=true
VITE_EC2_WEBHOOK_URL=http://YOUR-EC2-PUBLIC-IP
VITE_WEBHOOK_SECRET=your-webhook-secret

# Backend Configuration (create backend/.env)
PORT=3001
USE_EC2_BACKEND=true
EC2_WEBHOOK_URL=http://YOUR-EC2-PUBLIC-IP
WEBHOOK_SECRET=your-webhook-secret
```

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install
cd backend && npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your EC2 IP

# 3. Create backend/.env
echo "USE_EC2_BACKEND=true" > backend/.env
echo "EC2_WEBHOOK_URL=http://YOUR-EC2-IP" >> backend/.env

# 4. Start both servers
npm run dev           # Frontend on :3000
cd backend && npm start  # Backend on :3001
```

## ✅ Testing the Integration

1. **Test Backend Proxy**:
   ```bash
   curl http://localhost:3001/health
   # Should show: {"status":"healthy","environment":"ec2-proxy","ec2Configured":true}
   ```

2. **Test Form Submission**:
   - Open http://localhost:3000
   - Fill out any team form with a company name
   - Submit and watch for job ID
   - Check console for status updates

3. **Test GitHub Display**:
   - Wait for job completion
   - Should see GitHub repository link
   - Click to verify repo was created

## 🔍 Troubleshooting

- **"Connection refused"**: Check EC2 security group allows port 80
- **"Invalid signature"**: Verify WEBHOOK_SECRET matches on both sides
- **No GitHub URL**: Check EC2 has GitHub token configured
- **Form won't submit**: Ensure company name field is filled