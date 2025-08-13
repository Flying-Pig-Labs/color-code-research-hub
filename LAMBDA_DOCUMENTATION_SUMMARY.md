# Color Code Research Hub - Lambda Functions Documentation Summary

## Overview

This document provides a comprehensive overview of all AWS Lambda functions in the Color Code Research Hub backend system. The system implements an advanced async plan generation workflow with AI-powered research capabilities.

## Architecture Overview

```
Frontend (React/Amplify) 
    ↓ HTTP Requests
API Gateway (CORS enabled)
    ↓ Route to appropriate function
Lambda Functions (Node.js 18.x)
    ↓ Data storage
DynamoDB Tables + S3 Buckets
    ↓ External APIs  
Anthropic Claude + OpenAI + GitHub APIs
```

## Core Lambda Functions

### 1. Plan Generation Workflow

#### `startPlanGeneration.js` - Async Job Initiator
- **Purpose**: Entry point for async plan generation requests
- **Timeout**: 30 seconds (API Gateway limit)
- **Memory**: Default (128MB)
- **Key Features**:
  - Creates unique job IDs using timestamp + random
  - Stores initial job record in DynamoDB
  - Asynchronously invokes planOrchestrator
  - Returns job ID immediately for frontend polling
- **Environment Variables**:
  - `JOBS_TABLE_NAME`: DynamoDB table for job tracking
  - `ORCHESTRATOR_FUNCTION_NAME`: Target orchestrator function
- **Error Handling**: Graceful failure with detailed error messages

#### `planOrchestrator.js` - Main Orchestration Engine
- **Purpose**: Core orchestrator for complete plan generation workflow
- **Timeout**: 900 seconds (15 minutes)
- **Memory**: 3008MB (for large LLM responses)
- **Reserved Concurrency**: 5 (prevents resource exhaustion)
- **Key Features**:
  - Manages complete 50-90 LLM call workflow
  - Updates job status through all stages
  - Handles GitHub milestone/issue creation
  - Implements comprehensive error recovery
- **Stages Managed**:
  - parseReadme: Extract project metadata
  - populateForm: Auto-populate form fields
  - generatePhases: Create SDLC phases
  - createGitHubIssues: Create milestones and issues (optional)
- **Integration**: Calls planGeneratorCLI for actual plan generation

#### `getJobStatus.js` - Status Polling Endpoint
- **Purpose**: Provides real-time job status for frontend polling
- **Timeout**: 30 seconds
- **Memory**: Default (128MB)
- **Key Features**:
  - Maps backend stage names to frontend-friendly names
  - Calculates progress percentage
  - Returns current stage and completion status
  - Includes results when job is completed
- **Polling Pattern**: Frontend polls every 3 seconds during generation
- **Response Mapping**: Backend 'COMPLETED' → frontend 'completed'

#### `planGeneratorCLI.js` - Core Plan Generation Logic
- **Purpose**: Multi-endpoint router for plan generation operations
- **Timeout**: 30 seconds
- **Memory**: 1024MB
- **Endpoints Supported**:
  - `/api/plan/generate-cli-plan`: Full project plan generation
  - `/api/plan/populate-form`: AI-powered form field population
  - `/api/plan/create-github-issues`: GitHub milestone/issue creation
  - `/api/plan/generate-full-plan`: Legacy UI-compatible plan format
- **Key Features**:
  - Routes requests based on URL path segments
  - Integrates with LLM orchestration service
  - Handles GitHub API operations
  - Implements CORS for browser security

### 2. Research and Analysis Functions

#### `generateResearchReport.js` - Research Report Generation
- **Purpose**: Handles research report generation for three research teams
- **Teams Supported**:
  - Red Team: Competitive analysis and market research
  - White Team: Technical feasibility and implementation research
  - Black Team: Risk assessment and security research
- **Key Features**:
  - Integrates with Perplexity AI for deep research
  - Structured report formatting
  - S3 storage for persistence
  - DynamoDB metadata indexing
- **AI Model**: sonar-deep-research for comprehensive analysis
- **Storage**: Multi-tenant S3 organization with TTL cleanup

#### `reportProcessor.js` - Report Post-Processing
- **Purpose**: Post-processing and storage of research reports
- **Key Features**:
  - Content cleaning (removes AI reasoning blocks)
  - Team-specific prompt formatting
  - S3 storage with presigned URLs
  - Metadata management in DynamoDB
- **Content Processing**:
  - Strips `<think>...</think>` blocks from AI responses
  - Sanitizes HTML content for safe display
  - Preserves markdown formatting and citations

### 3. Integration and Utility Functions

#### `githubRepos.js` - GitHub Repository Management
- **Purpose**: GitHub repository operations and validation
- **Key Features**:
  - Repository listing with pagination
  - Branch enumeration and verification
  - Repository metadata extraction
  - GitHub API integration with PAT authentication
- **Authentication**: GitHub Personal Access Token from AWS Secrets Manager
- **Error Handling**: Graceful handling of private/inaccessible repos

#### `health.js` - Health Check Endpoint
- **Purpose**: Basic health monitoring for API status
- **Response**:
  ```json
  {
    "status": "healthy",
    "environment": "production",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
  ```
- **Use Cases**: Load balancer health checks, monitoring systems

## Service Layer Architecture

### Core Services

#### `llm-orchestrator-service.js` - LLM Orchestration Engine
- **Purpose**: Core orchestration for multi-step LLM plan generation
- **3-Step Process**:
  1. **Phase Generation** (1 LLM call): Creates 10 SDLC phases
  2. **Epic Generation** (8 LLM calls): Generates 5-10 epics per phase
  3. **Issue Formatting** (40-80 LLM calls): Formats epics into GitHub issues
- **LLM Strategy**:
  - Primary: Claude 3.5 Sonnet via Anthropic API
  - Fallback: OpenAI GPT-4 for rate limit scenarios
  - Retry logic with exponential backoff
- **Performance**: 50-90 total LLM calls over 15-20 minutes

#### `form-populator-service.js` - AI Form Population
- **Purpose**: AI-powered form field population from README analysis
- **Fields Populated**:
  - title, description, targetUsers, techStack, features, domain, complexity
- **AI Model**: Claude 3 Sonnet via AWS Bedrock
- **Security**: Input sanitization and suspicious pattern detection
- **Fallbacks**: Safe fallback values if AI analysis fails

#### `prompt-sanitizer.js` - Input Sanitization Service
- **Purpose**: Prevents prompt injection attacks and ensures safe LLM interactions
- **Security Features**:
  - Template syntax removal (`{}`, `${}`, `<%>`, `{{}}`)
  - Role instruction neutralization (`Human:`, `Assistant:`, `System:`)
  - Control character removal
  - Length limitation per field type
- **Input Limits**:
  - title: 256 chars, description: 2048 chars, readme: 50K chars
- **Suspicious Pattern Detection**: Identifies potential injection attempts

#### `prompt-formatters.js` - Team-Specific Prompt Formatting
- **Purpose**: Specialized prompt formatting for research teams
- **Team Specializations**:
  - **Red Team**: Competitive disruption analysis with ethical guidelines
  - **White Team**: Technical implementation and feasibility analysis
  - **Black Team**: Risk assessment and security evaluation
- **Prompt Engineering**: Multi-expert swarm simulation for comprehensive analysis

### Prompt Templates

#### `phase-generator.js` - SDLC Phase Generation
- **Purpose**: Generates standardized SDLC phases from README analysis
- **Standard Phases**: 8 phases from Discovery to Launch & Documentation
- **Domain Adaptations**: Mobile apps, enterprise software, consumer products
- **Output**: JSON with phase ID, title, description, suggested roles

#### `epic-generator.js` - Epic and Task Breakdown
- **Purpose**: Breaks down phases into detailed epics and tasks
- **Methodology**: Agile task hierarchy (Epic → Story → Task)
- **Features**: Role assignments, task sequencing, dependency consideration
- **Output**: JSON with phase ID, roles array, tasks with descriptions

#### `issue-formatter.js` - GitHub Issue Formatting
- **Purpose**: Formats tasks into SPARC-enabled GitHub issues
- **Structure**: Comprehensive issues with context, checklists, acceptance criteria
- **SPARC Integration**: Enables autonomous agent execution
- **Agile Compliance**: Stories as trackable units, tasks as checklist items

## Infrastructure Configuration

### SAM Template (`template.yaml`)

#### Core Components
- **API Gateway**: CORS-enabled REST API with production stage
- **Lambda Functions**: 8+ functions with optimized timeouts and memory
- **DynamoDB Tables**: Job tracking and research metadata storage
- **S3 Buckets**: Research result storage with lifecycle management
- **SQS Queues**: Asynchronous processing with dead letter queues

#### Security Features
- **IAM Roles**: Least privilege access for all functions
- **Secrets Manager**: API key management for external services
- **S3 Encryption**: AES256 server-side encryption
- **Public Access Blocking**: Complete S3 public access prevention

#### Performance Optimizations
- **Reserved Concurrency**: 5 for planOrchestrator to prevent resource exhaustion
- **Memory Allocation**: Optimized per function (128MB to 3008MB)
- **Timeout Configuration**: 30s for API-facing, 900s for long-running
- **TTL Configuration**: Automatic cleanup of expired data

## Key Integration Points

### External APIs
- **Anthropic Claude**: Primary LLM for plan generation
- **OpenAI GPT-4**: Fallback LLM for rate limiting scenarios
- **GitHub REST API**: Repository operations and issue creation
- **Perplexity AI**: Deep research and analysis capabilities

### AWS Services
- **Secrets Manager**: Secure API key storage and retrieval
- **DynamoDB**: Job state tracking and metadata storage
- **S3**: Report persistence and static asset storage
- **CloudWatch**: Logging and monitoring across all functions

### Frontend Integration
- **CORS Configuration**: Allows cross-origin requests from frontend
- **Async Patterns**: Request/response pattern with job polling
- **Status Mapping**: Backend to frontend status translation
- **Error Handling**: Structured error responses with detailed messages

## Deployment and Operations

### Deployment Process
```bash
cd /Users/williamprior/Development/GitHub/color-code-research-hub/infrastructure
sam build
sam deploy --profile personal --stack-name color-code-research-hub \
  --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset \
  --region us-east-1
```

### Monitoring and Debugging
- **CloudWatch Logs**: Comprehensive logging across all functions
- **Performance Metrics**: Token usage, response times, error rates
- **Health Checks**: `/api/health` endpoint for system status
- **Job Tracking**: Real-time status updates through DynamoDB

### Error Handling Strategies
- **Graceful Degradation**: Continue processing even if non-critical steps fail
- **Retry Logic**: Exponential backoff for external API calls
- **Partial Success**: Handle scenarios where some operations succeed
- **Detailed Logging**: Comprehensive error context for debugging

## Security Considerations

### Input Validation
- **Prompt Sanitization**: Prevents injection attacks on LLM prompts
- **Content Sanitization**: Safe HTML processing for report display
- **Length Limits**: Prevents resource exhaustion attacks
- **Pattern Detection**: Identifies suspicious input patterns

### Access Control
- **IAM Policies**: Least privilege access for all AWS services
- **API Key Management**: Secure storage in AWS Secrets Manager
- **Presigned URLs**: Secure S3 access without public buckets
- **CORS Configuration**: Controlled cross-origin access

### Data Protection
- **Encryption at Rest**: S3 and DynamoDB encryption
- **Encryption in Transit**: HTTPS for all API communications
- **TTL Configuration**: Automatic data cleanup and retention
- **Audit Logging**: Comprehensive operation tracking

## Performance Characteristics

### Function Performance
- **Cold Start**: 2-3 seconds with dependencies loaded
- **Warm Execution**: <100ms for simple operations
- **LLM Calls**: 2-10 seconds per call depending on complexity
- **Total Workflow**: 15-20 minutes for complete plan generation

### Resource Utilization
- **Memory Optimization**: Function-specific memory allocation
- **Timeout Strategy**: Balanced between performance and cost
- **Concurrency Management**: Reserved concurrency for critical functions
- **Cost Optimization**: Pay-per-request billing model

### Scalability Features
- **Auto Scaling**: Lambda automatic scaling to handle load
- **DynamoDB**: On-demand billing scales with usage
- **S3 Storage**: Unlimited storage with lifecycle management
- **Queue Processing**: SQS handles traffic spikes gracefully

This documentation provides a complete overview of the Color Code Research Hub Lambda architecture, enabling developers to understand, maintain, and extend the system effectively.