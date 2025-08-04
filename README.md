# 🧬 Color Code Research Hub

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.1.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.8.3-3178c6.svg)
![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20DynamoDB%20%7C%20Bedrock-ff9900.svg)
![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)

**Strategic Competitive Intelligence Platform**  
*Three specialized AI research teams for market disruption, tool replacement, and whitespace discovery*

[Features](#features) • [Architecture](#architecture) • [Quick Start](#quick-start) • [Teams](#research-teams) • [API](#api-reference) • [Deployment](#deployment) • [Changelog](CHANGELOG.md)

</div>

---

## 🚀 Overview

Color Code Research Hub is a sophisticated competitive intelligence platform that leverages Claude AI to conduct deep market research through three specialized research teams. Each team has unique capabilities and customization options tailored to specific strategic objectives.

### Key Capabilities

- **🔴 Red Team**: Analyze competitors and identify market disruption opportunities
- **⚫ Black Team**: Research third-party tools for internal replacement strategies  
- **⚪ White Team**: Discover untapped market opportunities and whitespace

### Powered by Advanced AI

- **10-Phase Generation**: Comprehensive project planning with SplashPage foundation
- **LLM Orchestration**: 3-step process with intelligent batching and rate limiting
- **SPARC Methodology**: Autonomous agent execution framework
- **Claude Integration**: AWS Bedrock with Anthropic's Claude Sonnet model
- **GitHub Automation**: Automatic repository creation and issue management

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Frontend (AWS Amplify)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Red Team   │  │ Black Team  │  │ White Team  │            │
│  │    Form     │  │    Form     │  │    Form     │            │
│  └─────┬───────┘  └─────┬───────┘  └─────┬───────┘            │
│        └─────────────────┴─────────────────┘                    │
│                           │                                      │
│                 Plan Generation Interface                        │
│                   (10 Phases + SPARC)                           │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────┴─────────────────────────────────────┐
│                      API Gateway                                 │
│               /api/plan/generate-cli-plan                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                 AWS Lambda Functions                             │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │          LLM Orchestrator Service (3-Step)               │  │
│  │  1. Phase Generation (10 phases)                         │  │
│  │  2. Epic Generation (5-10 per phase)                     │  │
│  │  3. Issue Formatting (SPARC methodology)                 │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Bedrock   │  │  DynamoDB   │  │   Secrets   │            │
│  │   Claude    │  │    Jobs     │  │   Manager   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React 19.1.0 with TypeScript
- **Build Tool**: Vite 7.0.5
- **UI Components**: shadcn/ui + Tailwind CSS
- **State Management**: Tanstack Query
- **Forms**: React Hook Form with Zod validation
- **Routing**: React Router v7

#### Backend
- **Cloud Functions**: AWS Lambda (Node.js 20.x runtime)
- **LLM Service**: AWS Bedrock with Claude Sonnet
- **Database**: DynamoDB for job tracking
- **Infrastructure**: AWS SAM (Serverless Application Model)
- **API Management**: API Gateway with CORS support

#### External Integrations
- **AI Provider**: Anthropic Claude API (Sonnet model)
- **Version Control**: GitHub API for repo/issue creation
- **Cloud Services**: AWS Bedrock, Secrets Manager

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 20.0.0
- AWS CLI configured with credentials
- AWS SAM CLI for Lambda deployments
- GitHub personal access token
- AWS Bedrock access (Claude Sonnet model)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd color-code-research-hub

# Install all dependencies and start servers
make all
```

This single command will:
1. Install all dependencies
2. Start the frontend on port 3000
3. Start the backend API on port 3001

### Environment Configuration

1. **Copy the example environment file:**
```bash
cp .env.example .env.local
```

2. **Configure your `.env.local`:**
```env
# Frontend Configuration
VITE_API_BASE_URL=http://localhost:3001
VITE_API_KEY=your-api-key-here
VITE_PORT=3000

# EC2 Claude Flow Integration (Optional)
# If you have Claude Flow running on EC2, configure this endpoint
VITE_EC2_ENDPOINT=http://your-ec2-ip:8080

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# External Services
ANTHROPIC_API_KEY=your-claude-api-key
GITHUB_TOKEN=your-github-token
GITHUB_ORG=your-github-org
```

### Available Commands

```bash
make all        # Install deps & start all servers
make start      # Start both frontend and backend
make api        # Start only API server
make web        # Start only web server
make stop       # Stop all servers
make clean      # Force kill all processes
make test       # Run E2E tests
make install    # Install all dependencies
```

---

## 🎯 Research Teams

### 🔴 Red Team - Market Disruption Analysis

**Purpose**: Analyze competitor vulnerabilities and develop offensive market disruption strategies.

**How It Works**: 
- You specify a **target company** to disrupt (e.g., "Carvana")
- The AI analyzes market vulnerabilities and opportunities
- Generates actionable strategies for market attack

**Custom Fields**:
- `companyName` - Target competitor to disrupt
- `analysisFocus` - Areas like pricing, technology, customer acquisition
- `marketScope` - Geographic focus (Global, Regional, Custom)
- `disruptionTimeline` - Expected timeline (0-24 months)
- `investmentRange` - Capital deployment ($10K - $10M)
- `disruptionStrategy` - Direct competition, differentiation, cost leadership

### ⚫ Black Team - Internal Tool Replacement

**Purpose**: Explore replacing expensive third-party tools with internal solutions.

**Custom Fields**:
- `toolCategories` - Analytics, Development, Security, etc.
- `informationSources` - Documentation, reviews, specs, pricing
- `implementationComplexity` - Low, Medium, High
- `teamSizeConstraint` - Available development resources
- `techStackPreference` - Preferred technologies
- `timeToMarket` - Implementation timeline

### ⚪ White Team - Whitespace Discovery

**Purpose**: Discover untapped market opportunities and new product spaces.

**Custom Fields**:
- `opportunityTypes` - Market gaps, technology disruptions
- `targetCustomerSize` - Customer segments to target
- `businessModelPreference` - SaaS, Marketplace, etc.
- `technicalApproach` - Build vs. buy vs. partner
- `riskTolerance` - Risk acceptance level (1-5)
- `minimumOpportunitySize` - Revenue potential threshold

---

## 📡 API Reference

### Core Endpoints

#### Health Check
```http
GET /health
```

#### Submit Research Request
```http
POST /api/sqs/submit
Content-Type: application/json

{
  "teamType": "red|black|white",
  "repoId": "unique-identifier",
  "formData": {
    // Team-specific fields
  }
}
```

#### GitHub Repository Management
```http
GET /api/github/repos/{org}
GET /api/github/repos/{org}/{repo}/readme
```

#### Plan Generation (CLI - Working)
```http
POST /api/plan/generate-cli-plan
Content-Type: application/json

{
  "projectInfo": {
    "title": "Project Title",
    "description": "Description",
    "domain": "Domain",
    "features": ["feature1", "feature2"],
    "techStack": ["tech1", "tech2"],
    "complexity": "simple|moderate|complex"
  },
  "readmeContent": "README content here"
}
```

### Research Payload Structure

```json
{
  "repository": "org/ci-{teamType}-{repoId}",
  "branch": "main",
  "researchConfig": {
    "teamType": "red|black|white",
    "researchSpecs": {
      // Team-specific configuration
    },
    "metadata": {
      "timestamp": "2024-01-20T15:30:00.000Z",
      "client": "ClientName"
    }
  }
}
```

---

## 🔗 Claude Flow Research Integration

### Overview
The Color Code Research Hub integrates with Claude Flow running on EC2 to provide AI-powered research capabilities for all three research teams (Red, White, and Black).

### Architecture
```
Frontend (Amplify) → API Gateway → Lambda Proxy → EC2 Claude Flow (18.209.36.58:8080)
```

### API Endpoints
- **Submit Research**: `POST /api/claude-flow/research`
- **Check Status**: `GET /api/claude-flow/execution/{request_id}`
- **List Executions**: `GET /api/claude-flow/executions`

### Security
- API key stored in AWS Secrets Manager: `claude-flow-research-api-key`
- Lambda automatically retrieves and adds the API key to all EC2 requests
- Frontend doesn't need to handle API keys

### Research Teams
1. **Red Team** - Competitive Disruption Analysis
2. **White Team** - Market Opportunity Discovery
3. **Black Team** - Vendor Replacement Engineering

### Testing the Integration
1. Navigate to any research team page (e.g., `/red-team`)
2. Fill out the research form
3. Submit to see real-time progress updates
4. Results appear in the Research Requests table

---

## 🚀 Deployment

### Frontend (Automatic via AWS Amplify)

The frontend automatically deploys when you push to the main branch.

### Backend Lambda Functions (Manual)

#### Using the Deployment Script (Recommended)

```bash
cd infrastructure
./deploy.sh
```

#### Manual Deployment

1. **Install SAM CLI**:
```bash
curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip -o sam.zip
unzip -q sam.zip
sudo ./install
```

2. **Build and Deploy**:
```bash
cd infrastructure
sam build
sam deploy \
  --stack-name color-code-research-hub \
  --capabilities CAPABILITY_IAM \
  --resolve-s3 \
  --no-confirm-changeset \
  --region us-east-1
```

⚠️ **Important**: 
- Stack name MUST be `color-code-research-hub` (no "-production" suffix)
- Region MUST be `us-east-1`
- Never create new stacks - always update the existing one

---

## 🧬 SPARC Methodology

The platform implements SPARC (Specialized Planning and Autonomous Research Coordination) methodology for AI agent execution:

### 10-Phase Project Planning

1. **SplashPage Pre-Phase** (Auto-injected foundation)
   - Public-facing landing experience
   - Modular architecture foundation
   - CI/CD pipeline setup
   - NOT a disposable landing page

2. **Discovery & Requirements**
3. **Technical Planning & Architecture**
4. **UI/UX Design & Prototyping**
5. **Core Development**
6. **System Integration & Testing**
7. **Quality Assurance & Testing**
8. **Deployment & Distribution**
9. **GTM Strategy & Launch Readiness**
10. **Launch Activation & Feedback Loop**

### Generation Process
- **Phase 1 Only (Demo)**: Currently generates 5-10 epics with full details
- **Phases 2-10**: Structure only (epics disabled for demo)
- **Full Mode**: Would generate 40-80 epics across all phases

---

## 📊 Data Flow

### Plan Generation Flow
1. **User Input** → Project metadata and README content
2. **API Gateway** → Routes to `/api/plan/generate-cli-plan`
3. **Lambda Handler** → `planGeneratorCLI.js` processes request
4. **LLM Orchestrator** → 3-step generation process:
   - Step 1: Generate 10 phases (1 Claude API call)
   - Step 2: Generate epics for Phase 1 (1 Claude API call)
   - Step 3: Format issues with batching (5-10 Claude API calls)
5. **Response** → Complete plan with phases and formatted issues

### Research Team Flow
1. **Team Selection** → Red, Black, or White team form
2. **Form Submission** → Custom fields per team type
3. **EC2 Integration** → Claude Flow swarm orchestration
4. **GitHub Creation** → Repository and issue generation
5. **Status Updates** → Real-time progress tracking

---

## 🧪 Testing

```bash
# Run unit tests
npm test

# Run E2E tests
make test

# Quick Lambda test
cd lambda
npm run quick-test
```

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

- **Setup & Configuration**: Local setup, remote execution guides
- **Integration & API**: System integration, API documentation
- **AWS EC2 Deployment**: Infrastructure setup, integration flows
- **Implementation**: Development guides, form customization
- **Testing**: Test guides and quality assurance

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

<div align="center">

**Built with ❤️ by the Claude Flow Team**

[Report Bug](https://github.com/your-org/color-code-research-hub/issues) • [Request Feature](https://github.com/your-org/color-code-research-hub/issues)

</div>