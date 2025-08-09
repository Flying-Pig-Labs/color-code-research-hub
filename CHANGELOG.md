# Changelog

All notable changes to the Color Code Research Hub project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Ideate button functionality to research report views (January 5, 2025)
- S3 multi-tenant architecture for report storage
- Comprehensive JSDoc documentation to core Lambda handlers and services
- File-level documentation explaining the 3-step LLM orchestration process
- Updated CLAUDE.md with current system architecture and recent changes
- Created CHANGELOG.md for tracking project changes
- Enhanced research prompts for 4D intelligence gathering (January 8, 2025)
  - Red Team: Deep competitive dynamics and ecosystem analysis
  - Black Team: Operational reality and organizational impact analysis
  - White Team: Why whitespace exists and signals/indicators analysis

### Changed
- Enhanced code documentation in `llm-orchestrator-service.js` with detailed JSDoc comments
- Updated `planGeneratorCLI.js` with comprehensive handler documentation
- Improved function-level documentation for all major orchestration methods
- Updated frontend to fetch all reports from DynamoDB instead of limited results
- Show 'Processing Summary' status until AI summary is generated
- **BREAKING**: Changed Perplexity API reasoning_effort from "low" to "high" for better research quality (January 8, 2025)
- Refocused all research prompts on deep understanding rather than action plans (January 8, 2025)

### Fixed
- Handle invalid date values in ResearchReportHistory to prevent RangeError (January 5, 2025)
- Use processed summaries and fix team detection in research reports
- Integration of report processing service for proper AI-generated summaries
- Generate fresh presigned URLs for expired S3 downloads in ResearchReportHistory
- Correct API Gateway URL in documentation (zi612qxxv0 instead of ojfpuao6c4)

### Documentation
- Updated CLAUDE.md and README.md with correct API Gateway URL and AWS profile information

## [2.1.0] - 2025-01-04

### Added
- Research Reports API endpoint (`/api/research/reports`) with DynamoDB integration
- AI-powered report summary generation using Perplexity API
- Preview button functionality with 120-word summary generation
- S3 presigned URL generation for secure report downloads
- Research report logging system with DynamoDB persistence
- Comprehensive report processing with 5 output formats (JSON, Markdown, Executive Summary, Slides, Action Items)
- ResearchReportHistory component for viewing historical reports
- CORS configuration for oceanstudio.io access
- AWS account safeguards to prevent deployment to personal account
- Report deletion scripts with TODO for future UI feature
- Claude Flow monitoring dashboard integration
- WebSocket support for real-time swarm monitoring
- Terminal monitoring section in Research page
- Company Name field to Black and White team forms
- ASCII art branding for MVP AutoFoundry
- Lambda functions for direct Claude Flow log access
- Runs subtab with Claude Flow backend integration
- Async plan generation with progress UI
- Dynamic Header component with page-specific configurations
- Makefile commands for simplified development workflow

### Changed
- Frontend now fetches all reports from DynamoDB instead of limited results
- Updated API Gateway URL from incorrect `ojfpuao6c4` to correct `zi612qxxv0`
- Improved error handling for decimal serialization in Lambda functions
- Enhanced documentation with correct AWS profile (mvp) and API endpoints
- Refactored research report processing to use proper AI-generated summaries
- Migrated from AWS account 418272766513 to 984906149037 (MVP account)
- Updated all deployment scripts to use mvp profile instead of personal
- Replaced MVP AUTO FOUNDRY with OCEAN STUDIO branding
- Changed MILESTONES tab to PLAN in navigation bar
- Updated favicon to factory emoji 🏭
- Simplified Research section UI
- Enhanced monitoring dashboard with terminal dark mode theme
- Integrated MVP Backlog Generator into MILESTONES tab
- Updated Lambda functions to use AWS SDK v3
- Removed 18 redundant Lambda functions and handlers

### Fixed
- DynamoDB decimal serialization error with `decimal_default` helper
- Invalid date handling in ResearchReportHistory to prevent RangeError
- CORS configuration to comply with wildcard origin restrictions
- Research report downloads with fresh S3 presigned URL generation
- ReportModal import and type errors
- Team detection logic in research reports
- Processing summary display status
- Mixed content errors by proxying Claude Flow through API Gateway
- Batch job integration issues and status polling
- Lambda runtime errors in researchProxy
- CORS headers in Lambda proxy responses
- Field name mismatches in Claude Flow frontend
- Tab button layout to prevent text squishing
- Package dependency issues (recharts, @radix-ui/react-avatar)
- SAM build issues by removing package-lock.json
- Perplexity async API integration for research Lambda

### Security
- Added critical AWS account deployment safeguards
- Enforced MVP account (984906149037) usage
- Prevented accidental deployment to personal account
- Removed GitHub token from .env.production for better security

### Infrastructure
- Successfully deployed to AWS account 984906149037
- Updated all API endpoints to new infrastructure
- Added SPA redirects for proper routing
- Implemented comprehensive logs and metrics system
- Added Lambda proxies for EC2 Research endpoint
- Connected research swarms to Claude Flow API v2 on port 3456

## [2.0.0] - 2024-12-17

### Added
- Claude Flow Research Integration with EC2 (endpoint: 18.209.36.58:8080)
- Three specialized research teams: Red Team, Black Team, White Team
- SPARC methodology implementation for autonomous agent execution
- 10-phase project plan generation with SplashPage pre-phase
- Batch processing for issue formatting to respect rate limits
- Exponential backoff for Claude API retry logic

### Changed
- Migrated from AWS Batch to pure Lambda implementation
- Updated to Node.js 20 for AWS Amplify compatibility
- Switched from fragmented epic generation to unified orchestration
- Improved error handling with proper CORS headers
- Updated branding to Ocean Studio across the platform

### Fixed
- CORS issues with proxy endpoint configuration
- GitHub token secret access using SECRETS_ARN
- Parameter mismatches between metadata and projectInfo
- Template literal syntax errors in issue-formatter.js
- Coral emoji rendering issues in Reef Builder header
- Missing uuid dependency in Lambda functions

### Removed
- AWS Batch infrastructure and dependencies
- SQS queue dependencies from GitHubRepos function
- Legacy plan generation endpoints

## [1.0.0] - 2024-11-15

### Added
- Initial release of Color Code Research Hub
- React frontend with TypeScript and Vite
- AWS Lambda backend for plan generation
- Integration with Anthropic Claude API
- GitHub repository and issue creation
- DynamoDB for job tracking
- AWS SAM infrastructure templates

### Features
- Form-based project plan generation
- README analysis and metadata extraction
- 8-phase SDLC plan generation
- Role-based epic assignment
- GitHub issue formatting with SPARC directives

## Notes

### Current Limitations (as of v2.0.0)
- **Demo Mode**: Only Phase 1 receives generated epics (line 214 in llm-orchestrator-service.js)
- **Broken Endpoint**: `/api/plan/generate-phases` returns 500 errors
- **Incomplete V2**: `/api/plan/v2/generate-full-plan` only returns 2 placeholder epics

### Upcoming Features
- Full epic generation for all 10 phases
- Enhanced error recovery and retry mechanisms
- Real-time progress streaming
- Advanced GitHub integration features