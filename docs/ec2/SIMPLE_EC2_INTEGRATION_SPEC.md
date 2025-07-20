# 🚀 Simple EC2 Integration - Backend Spec

## 📋 Overview

Simple fire-and-forget integration: Submit research requests to EC2 webhook, get immediate response, then users poll GitHub directly to check if repo has been created.

## 🎯 Requirements

### 1. Single Webhook Endpoint (Modified)

**Endpoint**: `POST /api/ec2/analyze`

**Purpose**: Accept research requests and forward to EC2 immediately, return "got it" response

**Request Body**:
```json
{
  "teamType": "black|red|white",
  "repoId": "5-char-id", 
  "formData": {
    "toolCategories": ["analytics", "monitoring"],
    "implementationComplexity": "medium",
    // ... other team-specific fields
  }
}
```

**Response** (IMMEDIATE):
```json
{
  "status": "accepted",
  "message": "Research request accepted! Processing in background.",
  "repoId": "a3x9k",
  "repository": "Flying-Pig-Labs/ci-black-a3x9k",
  "expectedRepoName": "ci-black-a3x9k", 
  "githubUrl": "https://github.com/Flying-Pig-Labs/ci-black-a3x9k",
  "estimatedTime": "2-5 minutes"
}
```

### 2. Backend Flow

```javascript
app.post('/api/ec2/analyze', async (req, res) => {
  const { teamType, repoId, formData } = req.body;
  
  // 1. Validate request
  if (!teamType || !repoId || !formData) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  
  // 2. Generate repository info
  const repoName = `ci-${teamType}-${repoId}`;
  const repository = `Flying-Pig-Labs/${repoName}`;
  
  // 3. IMMEDIATE RESPONSE
  res.json({
    status: 'accepted',
    message: 'Research request accepted! Processing in background.',
    repoId,
    repository,
    expectedRepoName: repoName,
    githubUrl: `https://github.com/${repository}`,
    estimatedTime: '2-5 minutes'
  });
  
  // 4. FIRE-AND-FORGET: Call EC2 webhook (don't await)
  callEC2Webhook(repository, teamType, formData)
    .catch(error => {
      console.error('EC2 webhook failed:', error);
      // Log error but don't affect user experience
    });
});

async function callEC2Webhook(repository, teamType, formData) {
  const webhookPayload = {
    repository: repository,
    branch: 'main',
    command: generateClaudeFlowCommand(teamType, formData)
  };
  
  const response = await fetch('http://54.162.132.68:5000/webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer test-secret-2024'
    },
    body: JSON.stringify(webhookPayload)
  });
  
  if (!response.ok) {
    throw new Error(`EC2 webhook failed: ${response.status}`);
  }
  
  return await response.json();
}
```

### 3. Command Generation

```javascript
function generateClaudeFlowCommand(teamType, formData) {
  switch (teamType) {
    case 'red':
      return `npx claude-flow@alpha swarm "Analyze ${formData.companyName || 'target company'} for market disruption opportunities. Focus: ${formData.analysisFocus?.join(', ') || 'revenue unbundling'}. Market scope: ${formData.marketScope || 'global'}." --mode distributed --max-agents 5 --parallel --output json`;
      
    case 'black':
      return `npx claude-flow@alpha swarm "Explore replacing third-party tools with internal solutions. Tool categories: ${formData.toolCategories?.join(', ') || 'analytics'}. Implementation complexity: ${formData.implementationComplexity || 'medium'}." --mode distributed --max-agents 5 --parallel --output json`;
      
    case 'white':
      return `npx claude-flow@alpha swarm "Discover whitespace opportunities. Focus areas: ${formData.opportunityTypes?.join(', ') || 'integration gaps'}. Target customers: ${formData.targetCustomerSize?.join(', ') || 'enterprise'}." --mode distributed --max-agents 5 --parallel --output json`;
      
    default:
      return `npx claude-flow@alpha swarm "Conduct competitive intelligence analysis" --mode distributed --max-agents 5 --parallel --output json`;
  }
}
```

## 🎯 That's It!

**No job tracking, no status endpoints, no database.**

### Frontend Flow:
1. User submits form → Gets immediate "accepted" response
2. User sees "Request submitted! Check GitHub in 2-5 minutes"
3. User clicks "Check GitHub" button → Calls GitHub API directly
4. When repo exists → Show GitHub link

### Backend Flow:
1. Receive request → Validate → Return immediate response
2. Fire-and-forget call to EC2 webhook
3. Log any errors but don't track jobs

## 🧪 Test Command

```bash
curl -X POST http://localhost:3001/api/ec2/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "teamType": "black",
    "repoId": "test1", 
    "formData": {
      "toolCategories": ["analytics"],
      "implementationComplexity": "medium"
    }
  }'
```

**Expected Response:**
```json
{
  "status": "accepted",
  "message": "Research request accepted! Processing in background.",
  "repoId": "test1",
  "repository": "Flying-Pig-Labs/ci-black-test1",
  "expectedRepoName": "ci-black-test1",
  "githubUrl": "https://github.com/Flying-Pig-Labs/ci-black-test1",
  "estimatedTime": "2-5 minutes"
}
```

**That's the entire backend requirement!** ✨