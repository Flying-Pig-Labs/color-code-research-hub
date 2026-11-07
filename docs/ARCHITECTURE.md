# 🏗️ Color Code Research Hub - System Architecture

> **Complete architectural overview of the Color Code Research Hub platform**

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Architecture Diagram](#architecture-diagram)
- [Component Architecture](#component-architecture)
- [Data Flow Architecture](#data-flow-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Security Architecture](#security-architecture)
- [Integration Architecture](#integration-architecture)
- [Performance Architecture](#performance-architecture)
- [Monitoring & Observability](#monitoring--observability)

## System Overview

The Color Code Research Hub is a serverless, event-driven application built on AWS infrastructure. It combines a React frontend with Lambda-based backend services to provide AI-powered project planning and research capabilities.

### Key Architectural Principles

- **Serverless First**: All compute is handled by AWS Lambda
- **Event-Driven**: Asynchronous processing for long-running operations
- **Microservices**: Each Lambda function has a single responsibility
- **API-First**: RESTful API design with clear contracts
- **Security by Design**: IAM roles, secrets management, HTTPS everywhere
- **Cost Optimized**: Pay-per-use model with efficient resource allocation

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              User Browser                                    │
│                                   │                                          │
│                                   ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    React Frontend (AWS Amplify)                      │   │
│  │                 https://main.dgj0e8wt2o1zf.amplifyapp.com           │   │
│  └─────────────────────────────┬───────────────────────────────────────┘   │
└────────────────────────────────┼───────────────────────────────────────────┘
                                 │ HTTPS
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         AWS Cloud (us-east-1)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          API Gateway                                  │   │
│  │          https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com     │   │
│  └──────┬──────────┬──────────┬──────────┬──────────┬─────────────────┘   │
│         │          │          │          │          │                       │
│         ▼          ▼          ▼          ▼          ▼                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Lambda   │ │ Lambda   │ │ Lambda   │ │ Lambda   │ │ Lambda   │        │
│  │ Start    │ │ Plan     │ │ Get Job  │ │ GitHub   │ │ Claude   │        │
│  │ Plan Gen │ │ Orchestr │ │ Status   │ │ APIs     │ │ Flow     │        │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘        │
│       │            │            │            │            │                 │
│       └────────────┴────────────┴────────────┴────────────┘                │
│                    │                                                        │
│                    ▼                                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         DynamoDB                                     │   │
│  │                   PlanGenerationJobs Table                          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────┐   │
│  │   Secrets Manager   │  │    Claude Flow      │  │   S3 Buckets    │   │
│  │  - API Keys         │  │   EC2 Backend       │  │  - Logs         │   │
│  │  - GitHub PAT       │  │  18.209.36.58:8080  │  │  - Artifacts    │   │
│  └────────────────────┘  └─────────────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          External Services                                   │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │  Anthropic API  │  │   OpenAI API    │  │     GitHub API          │   │
│  │  (Claude 3.5)   │  │   (GPT-4)       │  │  (Repos & Issues)       │   │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Frontend Components

Located in `/src`:

```
src/
├── components/
│   ├── forms/           # Team-specific research forms
│   ├── workflow/        # Plan generation workflow UI
│   ├── claude-flow/     # Claude Flow integration UI
│   └── shared/          # Reusable components
├── services/
│   ├── api.ts          # API client service
│   ├── github.ts       # GitHub integration
│   └── claudeFlow.ts   # Claude Flow service
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
└── types/              # TypeScript definitions
```

### Backend Components

Located in `/lambda/handlers`:

```
lambda/handlers/
├── planOrchestrator.js      # Main orchestration logic (900s timeout)
├── startPlanGeneration.js   # Async job initiator (30s timeout)
├── getJobStatus.js          # Job status polling
├── planGeneratorCLI.js      # Full CLI logic implementation
├── claudeFlowProxy.js       # Claude Flow backend proxy
├── claudeFlowExecution*.js  # Execution monitoring functions
└── services/
    ├── llm-orchestrator-service.js  # LLM coordination
    ├── github-service.js            # GitHub operations
    └── dynamodb-service.js          # Database operations
```

### Infrastructure Components

Located in `/infrastructure`:

```
infrastructure/
├── template.yaml           # SAM template defining all AWS resources
├── deploy.sh              # Deployment automation script
└── parameters/            # Environment-specific parameters
```

## Data Flow Architecture

### 1. Synchronous Plan Generation Flow

```
User Input → API Gateway → Lambda → Claude API → Response
                                 ↓
                            GitHub API
```

### 2. Asynchronous Plan Generation Flow (Recommended)

```
User Input
    │
    ▼
API Gateway ──► StartPlanGeneration Lambda
    │                    │
    │                    ├── Create Job in DynamoDB
    │                    └── Invoke PlanOrchestrator (async)
    │
    ▼
Return Job ID ◄─────────┘
    │
    ▼
Frontend Polls ──► GetJobStatus Lambda ──► DynamoDB
    │
    │         ┌── PlanOrchestrator Lambda (Background)
    │         │        │
    │         │        ├── Stage 1: Form Population (1 call)
    │         │        ├── Stage 2: Generate Phases (1 call)
    │         │        ├── Stage 3: Generate Epics (8 calls)
    │         │        ├── Stage 4: Format Issues (40-80 calls)
    │         │        └── Stage 5: Create GitHub Issues
    │         │
    │         └──► Updates DynamoDB after each stage
    │
    ▼
Display Results ◄── Complete Status from DynamoDB
```

### 3. Claude Flow Execution Flow

```
User Command
    │
    ▼
API Gateway ──► ClaudeFlowExecute Lambda
    │                    │
    │                    └──► EC2 Backend (18.209.36.58:8080)
    │                              │
    ▼                              ├── Execute Swarm
Return Execution ID ◄─────────────┘  └── Store Logs in S3
    │
    ▼
Frontend Polls ──► ClaudeFlowActivity Lambda
                           │
                           ├──► Get Status from EC2
                           └──► Fetch Logs from S3
```

## Deployment Architecture

### Frontend Deployment (AWS Amplify)

- **Auto-deployment**: Triggered on push to main branch
- **Build Settings**: Defined in `amplify.yml`
- **Environment Variables**: Managed in Amplify Console
- **CDN**: CloudFront distribution included
- **SSL**: Automatic HTTPS with managed certificates

### Backend Deployment (AWS SAM)

- **Manual Deployment**: Using SAM CLI
- **Stack Name**: `color-code-research-hub`
- **Region**: `us-east-1` (hardcoded requirement)
- **Deployment Command**:
  ```bash
  cd infrastructure
  ./deploy.sh
  ```

### Environment Configuration

```yaml
Development:
  Frontend: http://localhost:3000
  Backend: http://localhost:3001
  SAM Local: sam local start-api

Production:
  Frontend: https://main.dgj0e8wt2o1zf.amplifyapp.com
  API Gateway: https://ojfpuao6c4.execute-api.us-east-1.amazonaws.com/production
  Claude Flow: http://18.209.36.58:8080
```

## Security Architecture

### Authentication & Authorization

- **GitHub OAuth**: For repository access
- **API Keys**: Stored in AWS Secrets Manager
- **IAM Roles**: Least privilege for each Lambda
- **CORS**: Configured at API Gateway level

### Secrets Management

```yaml
Secrets Manager Keys:
  - ColorCodeResearchHubSecrets:
      - ANTHROPIC_API_KEY
      - OPENAI_API_KEY
      - GITHUB_PAT
  
Access Pattern:
  Lambda → IAM Role → Secrets Manager → Decrypt → Use
```

### Network Security

- **HTTPS Only**: All endpoints use TLS
- **API Gateway**: Request validation and throttling
- **Lambda**: VPC isolation where needed
- **DynamoDB**: Encryption at rest

## Integration Architecture

### External Service Integrations

#### 1. Anthropic Claude API
- **Endpoint**: `https://api.anthropic.com/v1/messages`
- **Model**: `claude-3-5-sonnet-20241022`
- **Rate Limits**: 1000 requests/minute
- **Retry Strategy**: Exponential backoff (2s, 4s, 8s)

#### 2. OpenAI API (Fallback)
- **Endpoint**: `https://api.openai.com/v1/chat/completions`
- **Model**: `gpt-4-turbo-preview`
- **Activation**: On Claude 529 errors
- **Rate Limits**: 500 requests/minute

#### 3. GitHub API
- **Endpoint**: `https://api.github.com`
- **Authentication**: Personal Access Token
- **Operations**: List repos, create issues, read files
- **Rate Limits**: 5000 requests/hour (authenticated)

#### 4. Claude Flow Backend
- **Host**: EC2 instance at 18.209.36.58
- **Port**: 8080
- **Protocol**: HTTP (internal only)
- **Features**: Swarm orchestration, agent management

### Internal Service Communication

```
Lambda Functions communicate via:
- Direct invocation (for async operations)
- DynamoDB (for shared state)
- S3 (for large payloads)
- Environment variables (for configuration)
```

## Performance Architecture

### Optimization Strategies

#### 1. Lambda Configuration
```yaml
Function Memory Allocation:
  - API Handlers: 128MB (fast response)
  - Orchestrator: 3008MB (heavy processing)
  - Status Checks: 128MB (lightweight)
  
Timeout Configuration:
  - API Gateway: 30 seconds max
  - Orchestrator: 900 seconds (15 minutes)
  - Status Endpoints: 30 seconds
```

#### 2. Caching Strategy
- **CloudFront**: Static asset caching
- **API Gateway**: Response caching for GET requests
- **Lambda**: In-memory caching for secrets
- **DynamoDB**: TTL for automatic cleanup

#### 3. Concurrent Execution
- **Reserved Concurrency**: 5 for PlanOrchestrator
- **Provisioned Concurrency**: None (cost optimization)
- **Batch Processing**: Issues processed 3 at a time

### Scalability Considerations

```yaml
Current Limits:
  - API Gateway: 10,000 requests/second
  - Lambda Concurrency: 1000 (account limit)
  - DynamoDB: On-demand scaling
  - S3: Unlimited storage
  
Bottlenecks:
  - LLM API rate limits (primary constraint)
  - Lambda cold starts (minimal impact)
  - DynamoDB hot partitions (unlikely)
```

## Monitoring & Observability

### CloudWatch Integration

```yaml
Metrics:
  - Lambda invocations, errors, duration
  - API Gateway 4xx/5xx errors
  - DynamoDB read/write capacity
  - Custom metrics via CloudWatch API

Logs:
  - Lambda function logs (auto-created)
  - API Gateway access logs
  - Application logs (structured JSON)

Alarms:
  - Lambda errors > 1% (5 min)
  - API Gateway 5xx > 10/min
  - DynamoDB throttling
  - Lambda timeout frequency
```

### Distributed Tracing

- **X-Ray**: Enabled for Lambda functions
- **Correlation IDs**: Passed through all requests
- **Request Tracking**: From frontend to external APIs

### Dashboard Configuration

```yaml
Key Metrics Dashboard:
  - Request volume (by endpoint)
  - Error rates (by service)
  - Latency percentiles (p50, p95, p99)
  - LLM API usage and costs
  - Job completion rates
  - Claude Flow execution status
```

## Related Documentation

- [API Documentation](./API_DOCUMENTATION.md) - Detailed endpoint specifications
- [Lambda Functions](../lambda/README.md) - Function-specific documentation
- [Infrastructure Guide](../infrastructure/README.md) - SAM template details
- [Security Guide](./architecture/SECURITY.md) - Security best practices
- [Performance Tuning](./operations/PERFORMANCE.md) - Optimization guide

---

> 💡 **Architecture Decision Records (ADRs)** are maintained in `/docs/architecture/decisions/` for historical context on key architectural choices.