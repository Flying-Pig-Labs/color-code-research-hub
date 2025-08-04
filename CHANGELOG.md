# Changelog

All notable changes to the Color Code Research Hub project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Comprehensive JSDoc documentation to core Lambda handlers and services
- File-level documentation explaining the 3-step LLM orchestration process
- Updated CLAUDE.md with current system architecture and recent changes
- Created CHANGELOG.md for tracking project changes

### Changed
- Enhanced code documentation in `llm-orchestrator-service.js` with detailed JSDoc comments
- Updated `planGeneratorCLI.js` with comprehensive handler documentation
- Improved function-level documentation for all major orchestration methods

### Fixed
- No fixes in this release

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