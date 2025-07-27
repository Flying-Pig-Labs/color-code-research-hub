# 📚 Color Code Research Hub Documentation

Welcome to the comprehensive documentation for the Color Code Research Hub. This documentation is organized to help both AI assistants and human developers quickly find the information they need.

## 🧭 Navigation Guide

### 🏁 Getting Started
- [**Quick Start Guide**](./quickstart/README.md) - Get up and running in 5 minutes
- [**Local Development Setup**](./setup/LOCAL_SETUP_GUIDE.md) - Complete dev environment setup
- [**Environment Variables**](./setup/ENVIRONMENT_VARIABLES.md) - Required configuration

### 🏗️ Architecture & Design
- [**System Architecture**](./ARCHITECTURE.md) - High-level system design
- [**Component Architecture**](./architecture/COMPONENTS.md) - Detailed component breakdown
- [**Data Flow**](./architecture/DATA_FLOW.md) - How data moves through the system
- [**Security Architecture**](./architecture/SECURITY.md) - Security considerations

### 🔌 API Documentation
- [**Complete API Reference**](./API_DOCUMENTATION.md) - All endpoints documented
- [**Lambda Functions**](./api/LAMBDA_FUNCTIONS.md) - Serverless function details
- [**Claude Flow APIs**](./api/CLAUDE_FLOW_APIS.md) - AI swarm endpoints
- [**GitHub Integration APIs**](./api/GITHUB_APIS.md) - Repository management

### 🎯 Features
- [**Plan Generation**](./features/PLAN_GENERATION.md) - How AI planning works
- [**Async Processing**](./features/ASYNC_PROCESSING.md) - Job queue system
- [**Research Teams**](./features/RESEARCH_TEAMS.md) - Red, Black, White teams
- [**Claude Flow Integration**](./features/CLAUDE_FLOW_INTEGRATION.md) - AI swarms

### 🛠️ Development
- [**Development Guide**](./development/DEVELOPMENT_GUIDE.md) - Best practices
- [**Testing Strategy**](./testing/TEST_GUIDE.md) - How to test
- [**Debugging Guide**](./development/DEBUGGING.md) - Troubleshooting tips
- [**Contributing**](./development/CONTRIBUTING.md) - How to contribute

### 🚀 Deployment
- [**Deployment Overview**](./deployment/README.md) - Deployment strategies
- [**AWS Deployment**](./deployment/AWS_DEPLOYMENT.md) - SAM deployment
- [**Frontend Deployment**](./deployment/FRONTEND_DEPLOYMENT.md) - Amplify setup
- [**Infrastructure as Code**](./deployment/INFRASTRUCTURE.md) - SAM templates

### 🔧 Operations
- [**Monitoring**](./operations/MONITORING.md) - System monitoring
- [**Troubleshooting**](./TROUBLESHOOTING.md) - Common issues & solutions
- [**FAQ**](./FAQ.md) - Frequently asked questions
- [**Performance Tuning**](./operations/PERFORMANCE.md) - Optimization tips
- [**Maintenance**](./operations/MAINTENANCE.md) - Regular maintenance

### 🤖 Claude Flow
- [**Claude Flow Overview**](./claude-flow/README.md) - AI swarm system
- [**Swarm Patterns**](./claude-flow/SWARM_PATTERNS.md) - Common patterns
- [**Agent Types**](./claude-flow/AGENT_TYPES.md) - Available agents
- [**Execution Monitoring**](./claude-flow/MONITORING.md) - Track executions

### 📁 Component Documentation
- [**Lambda Functions**](../lambda/README.md) - `/lambda` directory docs
- [**Frontend Components**](../src/README.md) - `/src` directory docs
- [**Infrastructure**](../infrastructure/README.md) - `/infrastructure` directory docs
- [**Tests**](../lambda/tests/README.md) - Test documentation

## 🔍 Quick Links by Topic

### For AI Assistants
- [System Overview](./ARCHITECTURE.md#system-overview)
- [API Endpoints](./API_DOCUMENTATION.md#endpoint-summary)
- [Environment Setup](./setup/ENVIRONMENT_VARIABLES.md)
- [Common Tasks](./guides/COMMON_TASKS.md)

### For Frontend Developers
- [React Components](../src/README.md)
- [API Integration](./development/FRONTEND_API_INTEGRATION.md)
- [State Management](./development/STATE_MANAGEMENT.md)
- [UI Components](./development/UI_COMPONENTS.md)

### For Backend Developers
- [Lambda Development](../lambda/README.md)
- [API Design](./development/API_DESIGN.md)
- [Database Schema](./development/DATABASE_SCHEMA.md)
- [AWS Services](./development/AWS_SERVICES.md)

### For DevOps Engineers
- [Infrastructure](../infrastructure/README.md)
- [CI/CD Pipeline](./deployment/CICD.md)
- [Monitoring Setup](./operations/MONITORING.md)
- [Security](./architecture/SECURITY.md)

## 📊 Documentation Standards

### File Naming
- Use UPPERCASE for documentation files (e.g., `README.md`, `API_DOCUMENTATION.md`)
- Use descriptive names that indicate content
- Group related docs in subdirectories

### Content Structure
- Start with a clear title and description
- Include a table of contents for long documents
- Use code examples liberally
- Include diagrams where helpful
- Cross-reference related documentation

### Code Examples
Always include working examples:
```javascript
// Example API call
const response = await fetch(`${API_BASE_URL}/api/plan/generate-cli-plan`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

### Diagrams
Use ASCII diagrams for clarity:
```
User → Frontend → API Gateway → Lambda → DynamoDB
                               ↓
                         Claude API
```

## 🚦 Documentation Status

| Section | Status | Last Updated |
|---------|--------|--------------|
| Architecture | ✅ Complete | 2025-01-27 |
| API Reference | ✅ Complete | 2025-01-27 |
| Setup Guides | ✅ Complete | 2025-01-27 |
| Claude Flow | 🔄 In Progress | 2025-01-27 |
| Operations | 📝 Planned | - |

## 🤝 Contributing to Documentation

1. Follow the documentation standards above
2. Update the table of contents when adding new docs
3. Include examples and diagrams
4. Cross-reference related documentation
5. Keep documentation close to code

## 🔗 External Resources

- [AWS SAM Documentation](https://docs.aws.amazon.com/serverless-application-model/)
- [Claude API Reference](https://docs.anthropic.com/claude/reference/getting-started-with-the-api)
- [GitHub API Documentation](https://docs.github.com/en/rest)
- [React Documentation](https://react.dev/)

---

> 💡 **Tip**: Use the search function (Ctrl+F / Cmd+F) to quickly find topics, or follow the breadcrumb links throughout the documentation.