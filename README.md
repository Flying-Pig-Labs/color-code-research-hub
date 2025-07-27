# 🧬 Color Code Research Hub

<div align="center">

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen.svg)
![React](https://img.shields.io/badge/react-19.1.0-61dafb.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.8.3-3178c6.svg)
![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20SQS%20%7C%20DynamoDB-ff9900.svg)

**Strategic Competitive Intelligence Platform**  
*Three specialized AI research teams for market disruption, tool replacement, and whitespace discovery*

[Features](#features) • [Architecture](#architecture) • [Quick Start](#quick-start) • [Teams](#research-teams) • [API](#api-reference) • [Deployment](#deployment)

</div>

---

## 🚀 Overview

Color Code Research Hub is a sophisticated competitive intelligence platform that leverages Claude AI to conduct deep market research through three specialized research teams. Each team has unique capabilities and customization options tailored to specific strategic objectives.

### Key Capabilities

- **🔴 Red Team**: Analyze competitors and identify market disruption opportunities
- **⚫ Black Team**: Research third-party tools for internal replacement strategies  
- **⚪ White Team**: Discover untapped market opportunities and whitespace

### Powered by Advanced AI

- **LLM Orchestration**: 3-step process generating 40-80 actionable insights per research
- **SPARC Methodology**: Autonomous agent execution framework
- **Claude Integration**: Direct integration with Anthropic's Claude API
- **GitHub Automation**: Automatic repository creation and issue management

---

## 🏗️ Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │  Red Team   │  │ Black Team  │  │ White Team  │            │
│  │    Form     │  │    Form     │  │    Form     │            │
│  └─────┬───────┘  └─────┬───────┘  └─────┬───────┘            │
│        └─────────────────┴─────────────────┘                    │
│                           │                                      │
│                    Vite Dev Server                               │
│                      (Port 3000)                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │ Proxy /api
┌───────────────────────────┴─────────────────────────────────────┐
│                    Express Backend API                           │
│                      (Port 3001)                                 │
└───────────────────────────┬─────────────────────────────────────┘
                            │
┌───────────────────────────┴─────────────────────────────────────┐
│                    AWS Infrastructure                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Lambda    │  │     SQS     │  │  DynamoDB   │            │
│  │  Functions  │  │    Queue    │  │   Tables    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Secrets   │  │     API     │  │    AWS      │            │
│  │   Manager   │  │   Gateway   │  │    Batch    │            │
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
- **API Server**: Express.js on Node.js
- **Cloud Functions**: AWS Lambda (Node.js 18.x)
- **Queue Service**: AWS SQS for async processing
- **Database**: DynamoDB for job tracking
- **Infrastructure**: AWS SAM (Serverless Application Model)

#### External Integrations
- **AI Provider**: Anthropic Claude API (Sonnet model)
- **Version Control**: GitHub API for repo/issue creation
- **Cloud Services**: AWS Bedrock, Secrets Manager

---

## 🚀 Quick Start

### Prerequisites

- Node.js >= 16.0.0
- AWS CLI configured with credentials
- GitHub personal access token
- Anthropic Claude API key

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

1. **Phase Generation**: 8 standard phases for any project
2. **Epic Creation**: 5-10 epics per phase with role assignments
3. **Issue Formatting**: GitHub issues with SPARC directives for autonomous execution

Each research generates 40-80 actionable items across:
- Discovery & Requirements
- Technical Planning & Architecture
- UI/UX Design & Prototyping
- Core Development
- System Integration & Testing
- Quality Assurance
- Deployment & Distribution
- Launch & Documentation

---

## 📊 Data Flow

1. **User Input** → Custom research form submission
2. **API Gateway** → Express backend validates and processes
3. **SQS Queue** → Asynchronous job submission
4. **Lambda Functions** → LLM orchestration and processing
5. **Claude API** → Multi-step AI analysis
6. **GitHub API** → Repository and issue creation
7. **DynamoDB** → Job status tracking
8. **Frontend Polling** → Real-time status updates

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