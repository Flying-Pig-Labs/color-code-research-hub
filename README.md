# Color Code Research Hub

A strategic intelligence platform featuring three specialized research teams for comprehensive competitive analysis and market insights.

## Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd color-code-research-hub

# Install dependencies
make install

# Start the application
make start
```

This will:
- Kill any processes on ports 3000 and 3001
- Start the backend API server on port 3001
- Start the frontend development server on port 3000
- Open your browser automatically to http://localhost:3000

To stop all servers, press `Ctrl+C`.

## Research Teams Overview

The Color Code Research Hub provides three specialized research teams, each with unique customization options:

### 🔴 Red Team - Market Disruption Analysis
**Purpose**: Analyze competitor vulnerabilities and develop offensive market disruption strategies

**How Red Team Research Works**:

Red Team research follows an **offensive strategy** where you analyze competitors or third-party vendors to identify opportunities for market disruption. This is not about defending your company - it's about finding ways to attack competitors' market positions.

When launching a Red Team research swarm, you specify a **target company name** - this is the competitor or vendor you want to disrupt, not your own company. For example, if CarMax launches Red Team research against "Carvana", the analysis will focus on finding Carvana's market vulnerabilities and opportunities for CarMax to exploit.

The research systematically analyzes the target company's market position to identify strategic disruption opportunities.

The research process then branches into multiple analytical dimensions. Users select their analysis focus areas, choosing from options like market positioning analysis, competitive intelligence, technology assessment, business model evaluation, customer acquisition strategies, pricing strategies, partnership opportunities, and market entry barriers. This multi-faceted approach ensures comprehensive coverage of potential disruption vectors.

Geographic scope plays a crucial role in the analysis. Users can target global markets, specific regions like North America or Europe, or define custom countries for focused regional analysis. This geographic lens helps identify market-specific vulnerabilities and opportunities that might not be apparent in a global view.

The temporal dimension is captured through the disruption timeline - users specify their expected timeframe for market disruption, ranging from immediate action (0 months) to longer-term strategic planning (24 months). This timeline influences the urgency and nature of recommendations, with shorter timelines focusing on rapid market entry tactics and longer timelines allowing for more fundamental disruption strategies.

Financial parameters are established through investment range specifications, allowing users to define their capital deployment capacity from $10,000 for lean startup approaches up to $10 million for well-funded disruption attempts. This financial framework ensures recommendations align with available resources.

Target market size categories help focus the analysis on markets that match strategic objectives - from small niche markets under $100M to very large markets exceeding $10B. The competitive intensity assessment (low, medium, high, very high) provides context for the difficulty and approach required for successful market entry.

Industry vertical selection and custom keywords allow for domain-specific research, ensuring the analysis considers industry-specific dynamics, regulations, and competitive factors. Finally, users select their preferred disruption strategy - whether through direct competition, market differentiation, cost leadership, innovation, acquisition, or strategic partnerships.

This comprehensive input framework enables the Claude Flow swarm to conduct targeted research that produces actionable intelligence for market disruption opportunities specific to the user's strategic context and constraints.

**Custom Form Fields**:
- `companyName` - **Target competitor/vendor to disrupt** (e.g., "Carvana", "AutoTrader")
- `analysisFocus` - Focus areas (Market positioning, Competitive intelligence, etc.)
- `marketScope` - Geographic scope (Global, North America, Europe, Asia Pacific, Custom)
- `disruptionTimeline` - Expected timeline for market attack (0-24 months)
- `investmentRange` - Investment range for disruption strategy ($10K - $10M)
- `targetMarketSize` - Market size categories
- `competitiveIntensity` - Competition level assessment
- `customKeywords` - Custom search terms
- `industryVerticals` - Target industries
- `disruptionStrategy` - Attack approach (Direct competition, differentiation, cost leadership, etc.)

**Example Scenario**: CarMax enters "Carvana" as the target company, selects "competitive intelligence" and "pricing strategies" as focus areas, sets a 12-month disruption timeline with $2M investment range, and chooses "cost leadership" as the disruption strategy. The Red Team research will analyze Carvana's weaknesses and provide actionable strategies for CarMax to undercut Carvana's market position.

### ⚫ Black Team - Internal Tool Replacement
**Purpose**: Explore replacing third-party tools with internal solutions

**Custom Form Fields**:
- `toolCategories` - Tool types (Analytics, Development, Security, etc.)
- `informationSources` - Research sources with boolean toggles
- `implementationComplexity` - Development complexity level
- `teamSizeConstraint` - Available team size
- `techStackPreference` - Preferred technologies
- `costComparisonBaseline` - Cost comparison method
- `customCostThreshold` - Custom budget threshold
- `evidenceThreshold` - Quality of evidence required (1-4 scale)
- `existingTools` - Current tool inventory
- `timeToMarket` - Implementation timeline

### ⚪ White Team - Whitespace Discovery
**Purpose**: Discover untapped market opportunities and new product spaces

**Custom Form Fields**:
- `opportunityTypes` - Opportunity categories (Market gaps, Technology disruptions, etc.)
- `targetCustomerSize` - Customer segments
- `businessModelPreference` - Preferred business models
- `technicalApproach` - Implementation approach
- `marketEntrySpeed` - Speed to market preference
- `competitiveLandscape` - Competition assessment
- `successMetrics` - Key success indicators (max 4)
- `riskTolerance` - Risk acceptance level (1-5 scale)
- `minimumOpportunitySize` - Minimum revenue potential
- `ecosystemIntegration` - Integration preferences
- `customSearchAreas` - Custom research areas

## EC2 Integration & Research Payload

### Webhook Payload Structure

When a research request is submitted, the backend sends a structured payload to the EC2 webhook:

```json
{
  "repository": "Flying-Pig-Labs/ci-{teamType}-{repoId}",
  "branch": "main",
  "researchConfig": {
    "teamType": "red|black|white",
    "researchSpecs": {
      // All custom form fields specific to the team type
      // Red Team: companyName, analysisFocus, marketScope, etc.
      // Black Team: toolCategories, implementationComplexity, etc.
      // White Team: opportunityTypes, targetCustomerSize, etc.
    },
    "metadata": {
      "timestamp": "2024-01-20T15:30:00.000Z",
      "client": "CarMax"
    }
  }
}
```

### Repository Naming Convention

- **Pattern**: `ci-{teamType}-{repoId}`
- **Examples**: 
  - `ci-red-a3x9k` (Red Team analysis)
  - `ci-black-7h2j9` (Black Team tool research)
  - `ci-white-mx4p1` (White Team opportunity discovery)

### Integration Flow

1. **Frontend** → User fills team-specific form with custom fields
2. **Backend** → Generates unique `repoId` and sends research payload to EC2
3. **EC2** → Processes research specs and creates GitHub repository
4. **Frontend** → Polls GitHub for repository creation to show results

## Payload Examples

### 🔴 Red Team Example - CarMax vs Carvana

```json
{
  "repository": "Flying-Pig-Labs/ci-red-m8k4x",
  "branch": "main",
  "researchConfig": {
    "teamType": "red",
    "researchSpecs": {
      "companyName": "Carvana",
      "analysisFocus": [
        "Market positioning analysis",
        "Competitive intelligence", 
        "Pricing strategies",
        "Customer acquisition strategies"
      ],
      "marketScope": "north-america",
      "disruptionTimeline": 18,
      "investmentRange": [500000, 2000000],
      "targetMarketSize": ["Large ($1B-$10B)", "Very Large (>$10B)"],
      "competitiveIntensity": "high",
      "customKeywords": ["online car sales", "vehicle financing"],
      "industryVerticals": ["Automotive", "Financial Services"],
      "disruptionStrategy": "cost-leadership"
    },
    "metadata": {
      "timestamp": "2024-01-20T15:30:00.000Z",
      "client": "CarMax"
    }
  }
}
```

### ⚫ Black Team Example - Tool Replacement Analysis

```json
{
  "repository": "Flying-Pig-Labs/ci-black-p7j2n",
  "branch": "main",
  "researchConfig": {
    "teamType": "black",
    "researchSpecs": {
      "toolCategories": ["Analytics & Monitoring", "Customer Support"],
      "informationSources": {
        "Public Documentation": true,
        "User Reviews": true,
        "Technical Specs": true,
        "Pricing Information": true
      },
      "implementationComplexity": "medium",
      "teamSizeConstraint": "medium",
      "techStackPreference": ["React/Next.js", "Node.js", "Python"],
      "costComparisonBaseline": "current_tool",
      "evidenceThreshold": 3,
      "existingTools": ["Salesforce Analytics", "Zendesk"],
      "timeToMarket": "medium"
    },
    "metadata": {
      "timestamp": "2024-01-20T15:30:00.000Z",
      "client": "CarMax"
    }
  }
}
```

### ⚪ White Team Example - Market Opportunity Discovery

```json
{
  "repository": "Flying-Pig-Labs/ci-white-z9a3q",
  "branch": "main",
  "researchConfig": {
    "teamType": "white",
    "researchSpecs": {
      "opportunityTypes": ["Market gaps", "Technology disruptions"],
      "targetCustomerSize": ["Small businesses (1-50 employees)"],
      "businessModelPreference": ["SaaS/Subscription", "Marketplace"],
      "technicalApproach": "hybrid-approach",
      "marketEntrySpeed": "fast",
      "competitiveLandscape": "emerging",
      "successMetrics": ["Revenue potential", "User adoption rate"],
      "riskTolerance": 4,
      "minimumOpportunitySize": "medium",
      "ecosystemIntegration": ["CarMax ecosystem", "Third-party APIs"],
      "customSearchAreas": ["vehicle inspection services"]
    },
    "metadata": {
      "timestamp": "2024-01-20T15:30:00.000Z",
      "client": "CarMax"
    }
  }
}
```

## Technology Stack

- **Frontend**: React, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Express.js, Node.js
- **Testing**: Vitest (unit), Playwright (E2E)
- **Forms**: React Hook Form with Zod validation
- **State Management**: Tanstack Query

## Available Commands

### Primary Commands
- `make start` - Start both frontend and backend servers and open browser
- `make stop` - Stop all running servers
- `make test` - Run e2e tests
- `make install` - Install all dependencies

### Other Scripts
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

## Documentation

The project documentation has been organized into the following categories:

### 📁 Setup & Configuration
- [Local Setup Guide](./docs/setup/LOCAL_SETUP_GUIDE.md) - Comprehensive local development setup
- [Remote Execution Guide](./docs/setup/REMOTE_EXECUTION_GUIDE.md) - Remote deployment and execution instructions

### 🔗 Integration & API
- [Integration Guide](./docs/integration/INTEGRATION_GUIDE.md) - System integration documentation
- [API Integration Test Results](./docs/integration/test-api-integration.md) - API testing and validation

### ☁️ AWS EC2 Deployment
- [EC2 Agent Briefing](./docs/ec2/EC2_AGENT_BRIEFING.md) - EC2 agent configuration and setup
- [EC2 Backend Confirmation](./docs/ec2/EC2_BACKEND_CONFIRMATION.md) - Backend deployment verification
- [EC2 Forms Implementation](./docs/ec2/EC2_FORMS_IMPLEMENTATION_GUIDE.md) - Form integration guide
- [EC2 Forms Integration Analysis](./docs/ec2/EC2_FORMS_INTEGRATION_ANALYSIS.md) - Integration analysis
- [EC2 Implementation Guide](./docs/ec2/EC2_IMPLEMENTATION_GUIDE.md) - Main implementation documentation
- [EC2 Infrastructure Setup](./docs/ec2/EC2_INFRASTRUCTURE_SETUP.md) - Infrastructure configuration
- [EC2 Integration Checklist](./docs/ec2/EC2_INTEGRATION_CHECKLIST.md) - Step-by-step integration checklist
- [EC2 Integration Flow Diagram](./docs/ec2/EC2_INTEGRATION_FLOW_DIAGRAM.md) - Visual integration workflow
- [EC2 Integration Summary](./docs/ec2/EC2_INTEGRATION_SUMMARY.md) - Integration overview
- [EC2 Script Update](./docs/ec2/EC2_SCRIPT_UPDATE.md) - Script update procedures
- [EC2 Smart Integration Guide](./docs/ec2/EC2_SMART_INTEGRATION_GUIDE.md) - Advanced integration strategies
- [Async Job Tracking Specification](./docs/ec2/ASYNC_JOB_TRACKING_SPEC.md) - Asynchronous job handling
- [Simple EC2 Integration Spec](./docs/ec2/SIMPLE_EC2_INTEGRATION_SPEC.md) - Simplified integration approach

### 🏗️ Implementation & Development
- [Implementation Summary](./docs/implementation/IMPLEMENTATION_SUMMARY.md) - Overall implementation overview
- [Form Update Example](./docs/implementation/FORM_UPDATE_EXAMPLE.md) - Form customization examples
- [N8N Refactoring Proposal](./docs/implementation/N8N_REFACTORING_PROPOSAL.md) - N8N workflow refactoring
- [N8N Refactor Proposal](./docs/implementation/N8N_REFACTOR_PROPOSAL.md) - Alternative N8N refactoring approach

### 🧪 Testing & Quality Assurance
- [Test Guide](./docs/testing/TEST_GUIDE.md) - Comprehensive testing documentation

## Environment Variables

Create a `.env.local` file based on `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_API_KEY=local-dev-key
VITE_PORT=3000
```

## Project Structure

```
├── backend/          # Express.js API server
├── src/             # React frontend source
├── e2e/             # Playwright E2E tests
├── scripts/         # Build and start scripts
└── public/          # Static assets
```

## License

This project is configured for local development and testing purposes.