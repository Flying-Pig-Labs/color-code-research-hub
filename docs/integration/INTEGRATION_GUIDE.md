# Competitive Intelligence System Integration Guide

## System Architecture

The competitive intelligence system consists of several integrated components:

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web Form UI   │────▶│  Server Endpoint │────▶│  Shell Script   │
│  (Frontend)     │     │   (Node.js API)  │     │   (Executor)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │                          │
                                ▼                          ▼
                        ┌──────────────────┐      ┌─────────────────┐
                        │  Form Processor  │      │  Claude Flow    │
                        │   (Config Gen)   │      │    Swarms       │
                        └──────────────────┘      └─────────────────┘
                                                           │
                                                           ▼
                                                  ┌─────────────────┐
                                                  │    GitHub       │
                                                  │  Repository     │
                                                  └─────────────────┘
```

## Component Overview

### 1. Form Configuration (`form-customization-config.json`)

Defines the customizable fields for each team type:
- Field types and validation rules
- Default values and options
- Conditional logic for dynamic fields

### 2. Form Data Processor (`form-data-processor.js`)

Processes user input and generates swarm configurations:
- Validates form data
- Merges with template defaults
- Generates dynamic prompts
- Adjusts grading weights
- Configures swarm parameters

### 3. Server Endpoint (`server-endpoint.js`)

RESTful API for form submission and job management:
- Receives form data
- Triggers analysis execution
- Tracks job status
- Serves results

### 4. Remote Swarm Executor (`remote-swarm-executor.sh`)

Shell script that orchestrates the entire analysis:
- Environment validation
- Swarm initialization
- Agent spawning
- Task execution
- Result compilation
- GitHub integration

## Data Flow

### 1. Form Submission

```javascript
// Frontend submits form data
POST /api/analyze
{
  "teamType": "red",
  "formData": {
    "companyName": "Salesforce",
    "analysisFocus": ["revenue_unbundling", "feature_extraction"],
    "marketScope": "global",
    "investmentRange": ["small", "medium"]
  }
}
```

### 2. Server Processing

```javascript
// Server processes and validates
const config = formProcessor.generateSwarmConfig(teamType, formData);
// Spawns shell script with configuration
```

### 3. Swarm Execution

```bash
# Shell script executes with configuration
./remote-swarm-executor.sh --team red --config /tmp/config.json --output /tmp/output
```

### 4. Result Delivery

```javascript
// Results available via API
GET /api/report/{jobId}
// Returns comprehensive analysis report
```

## Integration with Frontend

### Form Generation

Frontend should dynamically generate forms based on team configuration:

```javascript
// Fetch form configuration
const response = await fetch('/api/form-config/red');
const formConfig = await response.json();

// Generate form fields
formConfig.customizableFields.forEach(field => {
  // Create appropriate form controls
  // Apply validation rules
  // Handle conditional fields
});
```

### Submission Handling

```javascript
// Submit analysis request
const submitAnalysis = async (formData) => {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      teamType: selectedTeam,
      formData: formData
    })
  });
  
  const { jobId, statusUrl } = await response.json();
  
  // Poll for status
  pollJobStatus(jobId);
};
```

### Status Polling

```javascript
// Poll job status
const pollJobStatus = async (jobId) => {
  const interval = setInterval(async () => {
    const response = await fetch(`/api/status/${jobId}`);
    const status = await response.json();
    
    updateUI(status);
    
    if (status.status === 'completed' || status.status === 'failed') {
      clearInterval(interval);
      if (status.status === 'completed') {
        displayResults(status.results);
      }
    }
  }, 5000); // Poll every 5 seconds
};
```

## Configuration Merging Logic

The system merges user selections with template defaults:

### Priority Order

1. User form selections (highest priority)
2. Template defaults
3. System defaults (lowest priority)

### Example Merge

```javascript
// Template default
{
  "research_agents": ["researcher", "analyst"],
  "grading_rubric": {
    "market_opportunity_score": 30,
    "disruption_potential_score": 25
  }
}

// User customization
{
  "analysisFocus": ["revenue_unbundling"],
  "competitiveIntensity": "blue_ocean"
}

// Merged result
{
  "research_agents": ["researcher", "analyst", "market-validator"],
  "grading_rubric": {
    "market_opportunity_score": 45,  // Increased for blue ocean
    "disruption_potential_score": 20  // Decreased
  }
}
```

## Dynamic Behavior

### Agent Spawning

Agent count and types adjust based on selections:

```javascript
// Red Team: More agents for global scope
if (marketScope === 'global') {
  agentCount += 2;
  agents.push('geographic-analyst');
}

// Black Team: Agents per tool category
agentCount = Math.min(toolCategories.length * 2, 10);

// White Team: Agents for opportunity types
opportunityTypes.forEach(type => {
  agents.push(getSpecializedAgent(type));
});
```

### Prompt Generation

Prompts dynamically adjust to focus areas:

```javascript
// Generate focused prompts
if (analysisFocus.includes('revenue_unbundling')) {
  prompts.push("Identify specific revenue streams that can be isolated");
}

if (customKeywords.length > 0) {
  prompts.push(`Focus on: ${customKeywords.join(', ')}`);
}
```

### Grading Adjustments

Weights shift based on preferences:

```javascript
// Risk tolerance affects innovation weight
innovationWeight *= (1 + (riskTolerance - 2) * 0.2);

// Speed preference affects feasibility weight
if (marketEntrySpeed === '30_days') {
  feasibilityWeight *= 1.5;
}
```

## GitHub Integration

When enabled, the system creates structured repositories:

### Repository Naming

```
ci-{teamType}-{companyName}-{date}
Example: ci-red-salesforce-20240120
```

### Automatic Organization

```
repository/
├── README.md           # Executive summary
├── data/              # Raw analysis data
├── analysis/          # Processed results
└── recommendations/   # Actionable insights
```

## Environment Configuration

### Required Variables

```bash
# Claude API access
export CLAUDE_API_KEY="sk-ant-..."

# Optional GitHub integration
export GITHUB_ORG="your-org"
export GITHUB_TOKEN="ghp_..."

# Optional notifications
export WEBHOOK_URL="https://hooks.slack.com/..."
```

### Server Configuration

```bash
# API server settings
export PORT=3000
export NODE_ENV=production

# Job retention
export JOB_RETENTION_HOURS=24
export MAX_CONCURRENT_JOBS=10
```

## Security Considerations

### API Security

1. **Authentication**: Implement API key or JWT authentication
2. **Rate Limiting**: Prevent abuse with request limits
3. **Input Validation**: Strict validation of all inputs
4. **Sandboxing**: Execute swarms in isolated environments

### Data Protection

1. **Encryption**: Use HTTPS for all communications
2. **Temporary Files**: Clean up after job completion
3. **Access Control**: Restrict GitHub repo access
4. **Audit Logging**: Track all analysis requests

## Deployment Options

### 1. Containerized Deployment

```dockerfile
FROM node:18-alpine
RUN apk add --no-cache bash git jq curl
WORKDIR /app
COPY . .
RUN npm install
RUN chmod +x remote-swarm-executor.sh
CMD ["npm", "start"]
```

### 2. Serverless Functions

Split into separate functions:
- Form validation function
- Swarm execution function
- Result retrieval function

### 3. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ci-analyzer
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api-server
        image: ci-analyzer:latest
        env:
        - name: CLAUDE_API_KEY
          valueFrom:
            secretKeyRef:
              name: claude-secrets
              key: api-key
```

## Monitoring and Observability

### Metrics to Track

1. **Job Metrics**
   - Total jobs submitted
   - Success/failure rates
   - Average execution time
   - Token usage

2. **Performance Metrics**
   - API response times
   - Swarm agent efficiency
   - Memory usage
   - CPU utilization

3. **Business Metrics**
   - Most analyzed companies
   - Popular team types
   - Common focus areas
   - Report quality scores

### Logging Strategy

```javascript
// Structured logging
logger.info('Analysis started', {
  jobId,
  teamType,
  company,
  customizations: Object.keys(formData)
});
```

## Troubleshooting

### Common Integration Issues

1. **Form Data Not Processing**
   - Check form field names match configuration
   - Validate JSON structure
   - Ensure required fields present

2. **Swarm Execution Fails**
   - Verify Claude API key
   - Check system dependencies
   - Review error logs

3. **GitHub Integration Issues**
   - Validate token permissions
   - Check organization access
   - Ensure unique repo names

## Best Practices

1. **Async Processing**: Always process swarms asynchronously
2. **Error Recovery**: Implement retry logic for transient failures
3. **Resource Limits**: Set maximum execution times
4. **Clean Architecture**: Keep concerns separated
5. **Documentation**: Maintain API documentation
6. **Testing**: Unit test each component
7. **Monitoring**: Track all aspects of system health

## Future Enhancements

1. **WebSocket Support**: Real-time status updates
2. **Batch Processing**: Submit multiple analyses
3. **Scheduled Runs**: Periodic competitive monitoring
4. **Collaboration**: Share and comment on reports
5. **ML Integration**: Learn from past analyses
6. **Custom Templates**: User-defined analysis templates