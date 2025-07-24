# Color Code Research Hub

A comprehensive AI-powered platform for generating detailed project plans from README files using Claude AI and GitHub integration.

## Features

- **AI-Powered Analysis**: Utilizes Claude 3.5 Sonnet to analyze README content and generate comprehensive project plans
- **8-Phase SDLC**: Automatically generates a complete software development lifecycle with 8 distinct phases
- **Role-Based Task Assignment**: Assigns tasks to specific roles (Product Owner, Developer, Designer, etc.)
- **GitHub Integration**: Creates issues, milestones, and labels directly in your GitHub repository
- **SPARC-Ready Issues**: Formats issues for consumption by Claude Flow SPARC agents
- **Interactive Web UI**: User-friendly interface for reviewing and customizing generated plans
- **Progress Tracking**: Real-time progress updates during plan generation

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Radix UI
- **Backend**: AWS Lambda, API Gateway, DynamoDB
- **AI**: Anthropic Claude API (with OpenAI fallback)
- **Infrastructure**: AWS SAM, CloudFormation
- **Languages**: JavaScript/TypeScript, Python
- **Tools**: GitHub API, AWS SDK

## Architecture

The system uses a serverless architecture with:
- AWS Lambda functions for API endpoints
- DynamoDB for storing generation progress
- API Gateway for RESTful API
- Secrets Manager for secure credential storage
- CloudWatch for logging and monitoring

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure AWS credentials
4. Deploy infrastructure: `sam deploy`
5. Set up environment variables
6. Run the application

## API Endpoints

- `POST /api/plan/v2/generate-full-plan` - Generate complete project plan
- `POST /api/plan/v2/generate-issues` - Generate GitHub issues for selected epics
- `POST /api/plan/v2/create-github-issues` - Create issues in GitHub repository
- `GET /api/plan/v2/status/{planId}` - Check generation progress
- `GET /api/github/repos` - List user repositories
- `GET /api/github/repos/{owner}/{repo}/readme` - Fetch repository README

## Environment Variables

- `ANTHROPIC_API_KEY` - Claude API key
- `GITHUB_TOKEN` - GitHub personal access token
- `OPENAI_API_KEY` - OpenAI API key (optional fallback)
- `AWS_REGION` - AWS region for services
- `DYNAMODB_TABLE` - DynamoDB table name for progress tracking