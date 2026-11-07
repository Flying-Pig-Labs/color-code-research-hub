# GitHub → DynamoDB Migration Specification

## Current DynamoDB Tables

- Users, Projects, Reports, Ideations, DoubleDowns – V2 user data
- CreditLedger – billing/credits
- PipelineJobs-dev, PipelineBatchJobs, PipelineRepos, PipelineResearch – pipeline tracking
- ResearchReports, SharkCache, SharkTankReviews – legacy research data
- PlanGenerationJobs – planning system

## Data Currently in GitHub vs DynamoDB

### GitHub (Repository-based data)
- Source code and configurations
- Documentation (README, markdown files)
- Static assets (images, configs)
- Workflow definitions (`.github/workflows`)

### DynamoDB (Application data)
- User profiles and authentication
- Project metadata and relationships
- Research reports and job tracking
- Billing and credit information
- Pipeline job statuses and results

## Migration Strategy

### Phase 1: Repository Metadata
- Create **Repositories** table
- Fields: `repoId`, `name`, `description`, `url`, `createdAt`, `updatedAt`, `stars`, `language`
- Migrate data from GitHub API calls to persistent DynamoDB storage
- Reduces GitHub API rate limiting issues

### Phase 2: Workflow and Build Data
- Create **BuildHistory** table
- Fields: `buildId`, `repoId`, `status`, `startTime`, `endTime`, `logs`, `artifacts`
- Store CI/CD results in DynamoDB instead of just GitHub Actions logs
- Enable better analytics and reporting

### Phase 3: Issue and PR Tracking
- Create **Issues** and **PullRequests** tables
- Sync issue and PR data to DynamoDB for faster querying
- Enable cross-repository analytics and metrics

## Migration Implementation

1. Batch ETL job to sync existing GitHub data to DynamoDB
2. Real-time sync via GitHub webhooks for ongoing updates
3. Dual-write pattern during migration period
4. Gradual cutover from GitHub API queries to DynamoDB queries
