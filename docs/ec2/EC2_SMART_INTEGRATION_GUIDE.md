# Smart EC2 Integration Guide (GitHub Polling Approach)

## 🎯 Revised Architecture

Instead of waiting for EC2 to complete, we'll:
1. Generate a unique 5-char ID locally
2. Pass it to EC2 for repo naming
3. Log the request in your existing table
4. Poll GitHub directly for the repo
5. Update the table when repo is found

## 🔧 Implementation Steps

### Step 1: Add Unique ID Generator

**File: `src/utils/idGenerator.ts`**

```typescript
/**
 * Generate a unique 5-character ID for repo identification
 * Uses alphanumeric characters to avoid conflicts
 */
export function generateRepoId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate expected repo name based on team type and ID
 */
export function getExpectedRepoName(
  teamType: 'red' | 'black' | 'white',
  repoId: string,
  date?: Date
): string {
  const dateStr = (date || new Date()).toISOString().split('T')[0].replace(/-/g, '');
  return `ci-${teamType}-${repoId}-${dateStr}`;
}
```

### Step 2: Add GitHub Polling Service

**File: `src/services/githubService.ts`**

```typescript
interface GitHubRepo {
  name: string;
  html_url: string;
  created_at: string;
  private: boolean;
}

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_ORG = import.meta.env.VITE_GITHUB_ORG || 'your-org';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';

export const githubService = {
  /**
   * Check if a repository exists
   */
  async checkRepoExists(repoName: string): Promise<GitHubRepo | null> {
    try {
      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${GITHUB_ORG}/${repoName}`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
            ...(GITHUB_TOKEN && { 'Authorization': `token ${GITHUB_TOKEN}` })
          }
        }
      );
      
      if (response.status === 404) {
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('GitHub check failed:', error);
      return null;
    }
  },

  /**
   * Poll for repository creation
   */
  async pollForRepo(
    repoName: string,
    options: {
      maxAttempts?: number;
      interval?: number;
      onProgress?: (attempt: number) => void;
    } = {}
  ): Promise<GitHubRepo | null> {
    const {
      maxAttempts = 60, // 5 minutes with 5-second intervals
      interval = 5000,
      onProgress
    } = options;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (onProgress) {
        onProgress(attempt);
      }
      
      const repo = await this.checkRepoExists(repoName);
      if (repo) {
        return repo;
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }
    
    return null;
  }
};
```

### Step 3: Update Backend for Minimal EC2 Proxy

**File: `backend/server.js`**

Keep your existing mock server but add just the EC2 proxy endpoint:

```javascript
// Add to your existing server.js
const EC2_WEBHOOK_URL = process.env.EC2_WEBHOOK_URL;

// Add this endpoint for EC2 submission
app.post('/api/ec2/analyze', async (req, res) => {
  const { teamType, formData, repoId } = req.body;
  
  if (!EC2_WEBHOOK_URL) {
    return res.status(503).json({ error: 'EC2 not configured' });
  }
  
  try {
    // Add repoId to the formData
    const enrichedFormData = {
      ...formData,
      repoId, // This will be used by EC2 for repo naming
      companyName: process.env.CLIENT_COMPANY_NAME || 'ClientCo' // Your hardcoded client
    };
    
    // Forward to EC2
    const response = await fetch(`${EC2_WEBHOOK_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamType,
        formData: enrichedFormData
      })
    });
    
    const data = await response.json();
    res.json({ ...data, repoId }); // Include repoId in response
  } catch (error) {
    console.error('EC2 proxy error:', error);
    res.status(500).json({ error: 'Failed to submit to EC2' });
  }
});
```

### Step 4: Update Form Components

**Example for BlackResearchSwarmForm.tsx:**

```typescript
import { generateRepoId, getExpectedRepoName } from "@/utils/idGenerator";
import { githubService } from "@/services/githubService";

// Add state for tracking
const [repoId, setRepoId] = useState<string | null>(null);
const [expectedRepoName, setExpectedRepoName] = useState<string | null>(null);
const [githubUrl, setGithubUrl] = useState<string | null>(null);
const [isCheckingGithub, setIsCheckingGithub] = useState(false);

const handleLaunchSwarm = async () => {
  // Generate unique repo ID
  const newRepoId = generateRepoId();
  const expectedName = getExpectedRepoName('black', newRepoId);
  
  setRepoId(newRepoId);
  setExpectedRepoName(expectedName);
  
  const researchData = {
    toolCategories,
    informationSources,
    // ... other fields
  };

  setIsSubmitting(true);

  try {
    // Submit to EC2 with repoId
    const response = await fetch('/api/ec2/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        teamType: 'black',
        formData: researchData,
        repoId: newRepoId
      })
    });
    
    const { jobId } = await response.json();
    
    // Log to your table (this is where you'd update your existing table)
    const requestLog = {
      id: jobId,
      repoId: newRepoId,
      expectedRepoName: expectedName,
      teamType: 'black',
      timestamp: new Date(),
      status: 'submitted',
      customizations: researchData
    };
    
    // Add to your table state here
    console.log('Would add to table:', requestLog);
    
    toast.success('Research submitted!', {
      description: `Tracking ID: ${newRepoId}`
    });
    
    setOpen(false);
    handleReset();
  } catch (error) {
    showApiError(error as ApiError);
  } finally {
    setIsSubmitting(false);
  }
};

// Function to check GitHub
const checkGitHub = async () => {
  if (!expectedRepoName) return;
  
  setIsCheckingGithub(true);
  try {
    const repo = await githubService.checkRepoExists(expectedRepoName);
    
    if (repo) {
      setGithubUrl(repo.html_url);
      toast.success('Repository found!', {
        description: 'Click to view your research results'
      });
    } else {
      toast.info('Repository not found yet', {
        description: 'EC2 is still processing. Try again in a moment.'
      });
    }
  } catch (error) {
    toast.error('Failed to check GitHub');
  } finally {
    setIsCheckingGithub(false);
  }
};
```

### Step 5: Create Research Table Component

**File: `src/components/ResearchRequestsTable.tsx`**

```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ExternalLink, Clock } from "lucide-react";
import { githubService } from "@/services/githubService";
import { getExpectedRepoName } from "@/utils/idGenerator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ResearchRequest {
  id: string;
  repoId: string;
  teamType: 'red' | 'black' | 'white';
  timestamp: Date;
  status: 'submitted' | 'processing' | 'completed';
  githubUrl?: string;
  customizations: Record<string, any>;
}

interface ResearchRequestsTableProps {
  requests: ResearchRequest[];
  onUpdateRequest: (id: string, updates: Partial<ResearchRequest>) => void;
}

export const ResearchRequestsTable = ({ 
  requests, 
  onUpdateRequest 
}: ResearchRequestsTableProps) => {
  const [checkingIds, setCheckingIds] = useState<Set<string>>(new Set());

  const checkGitHub = async (request: ResearchRequest) => {
    setCheckingIds(prev => new Set(prev).add(request.id));
    
    try {
      const expectedRepoName = getExpectedRepoName(
        request.teamType,
        request.repoId,
        request.timestamp
      );
      
      const repo = await githubService.checkRepoExists(expectedRepoName);
      
      if (repo) {
        onUpdateRequest(request.id, {
          status: 'completed',
          githubUrl: repo.html_url
        });
      }
    } finally {
      setCheckingIds(prev => {
        const next = new Set(prev);
        next.delete(request.id);
        return next;
      });
    }
  };

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'red': return 'destructive';
      case 'black': return 'default';
      case 'white': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Team</TableHead>
          <TableHead>Submitted</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>GitHub</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell className="font-mono text-sm">
              {request.repoId}
            </TableCell>
            <TableCell>
              <Badge variant={getTeamColor(request.teamType)}>
                {request.teamType.toUpperCase()}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {request.timestamp.toLocaleTimeString()}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant={
                request.status === 'completed' ? 'success' :
                request.status === 'processing' ? 'secondary' : 
                'outline'
              }>
                {request.status}
              </Badge>
            </TableCell>
            <TableCell>
              {request.githubUrl ? (
                <Button size="sm" variant="link" asChild>
                  <a 
                    href={request.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              ) : (
                <span className="text-muted-foreground text-sm">
                  Not yet
                </span>
              )}
            </TableCell>
            <TableCell>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => checkGitHub(request)}
                disabled={checkingIds.has(request.id) || !!request.githubUrl}
              >
                <RefreshCw className={`h-4 w-4 ${
                  checkingIds.has(request.id) ? 'animate-spin' : ''
                }`} />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
```

### Step 6: Update Remote Executor Script (EC2 Side)

The `remote-swarm-executor.sh` needs a small update to use the repoId:

```bash
# In the generate_swarm_config function, extract repoId
REPO_ID=$(echo "$config_json" | jq -r '.repoId // empty')

# Later, in create_github_repo function, use it for repo naming
if [ -n "$REPO_ID" ]; then
    REPO_NAME="ci-${TEAM_TYPE}-${REPO_ID}-$(date +%Y%m%d)"
else
    # Fallback to existing logic
    REPO_NAME="ci-${TEAM_TYPE}-$(echo "$COMPANY_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g')-${RANDOM_SUFFIX}"
fi
```

## 🚀 Environment Configuration

**File: `.env.local`**

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3001

# EC2 Configuration (minimal)
VITE_EC2_WEBHOOK_URL=http://YOUR-EC2-IP

# GitHub Configuration for polling
VITE_GITHUB_ORG=your-github-org
VITE_GITHUB_TOKEN=ghp_xxxxx  # Optional, for private repos

# Client Configuration
VITE_CLIENT_COMPANY_NAME=YourClient
```

**File: `backend/.env`**

```env
PORT=3001
EC2_WEBHOOK_URL=http://YOUR-EC2-IP
CLIENT_COMPANY_NAME=YourClient
```

## 📊 Complete Flow

1. **User fills form** → Generates unique 5-char ID (e.g., `a3x9k`)
2. **Submit to EC2** → Includes repoId in payload
3. **Log in table** → Shows request with ID, team, timestamp
4. **EC2 processes** → Creates repo: `ci-black-a3x9k-20240120`
5. **User clicks refresh** → Polls GitHub for that exact repo name
6. **Repo found** → Updates table with GitHub link

## ✅ Benefits of This Approach

1. **No waiting** - Users can submit multiple requests without blocking
2. **Direct GitHub polling** - More reliable than webhook callbacks
3. **Simple tracking** - 5-char ID is easy to remember/share
4. **Existing UI** - Uses your table implementation
5. **Minimal changes** - Doesn't require major backend rewrites

## 🎯 Quick Implementation

```bash
# 1. Add the new files
mkdir -p src/utils src/services
touch src/utils/idGenerator.ts
touch src/services/githubService.ts

# 2. Update your .env.local
echo "VITE_EC2_WEBHOOK_URL=http://YOUR-EC2-IP" >> .env.local
echo "VITE_GITHUB_ORG=your-org" >> .env.local

# 3. Add the EC2 proxy endpoint to your backend
# (Just the one endpoint, keep everything else)

# 4. Update your forms to generate and pass repoId
```

This approach is much cleaner and doesn't require waiting for EC2 to complete!