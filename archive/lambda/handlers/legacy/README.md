# Lambda Handlers

Serverless functions backing API Gateway routes and asynchronous research/report processing.

## Categories

- Plan generation
  - `planGeneratorCLI.js`: Full multi-step plan generation (long-running)
  - `planGeneratorV2.js`: API-friendly generation + GitHub issue creation
  - `planGeneratorAsync.js` / `planOrchestrator.js` / `startPlanGeneration.js`: Async orchestration variants
- Research pipeline
  - `researchApi.py`: Research API entrypoint (intended to start async Perplexity jobs and persist)
  - `researchStreamProcessor.js`: DynamoDB stream processor; polls Perplexity and writes S3 artifacts; enqueues SQS
  - `reportProcessor.js` / `reportProcessor.py`: Post-process report (summary + markdown) from SQS; update DynamoDB
  - `getReportHandler.js` / `getJobStatus.js`: Retrieval/status helpers
- GitHub integration
  - `githubRepos.js`: List org repos, fetch README
  - Issue creation is embedded in plan generators (consider centralizing via Octokit)
- Utilities
  - `teams.js`, `health.js`, `fixNullStatus.js`
  - `prompts/`: prompt templates (planning + research)
  - `services/`: shared modules (LLM orchestrator, prompt formatting/sanitizing, report-processing)

## API (representative)

- Plan
  - POST `/api/plan/generate-cli-plan` → `planGeneratorCLI.js`
  - POST `/api/plan/v2/generate-full-plan` → `planGeneratorV2.js`
  - POST `/api/plan/v2/create-github-issues` → `planGeneratorV2.js`
- GitHub
  - GET `/api/github/repos/{org}` → `githubRepos.js`
  - GET `/api/github/repos/{org}/{repo}/readme` → `githubRepos.js`
- Research
  - POST `/api/research` → `researchApi.py` (start job; persist)
  - GET `/api/research/status/{request_id}` → `researchApi.py`
  - GET `/api/research/reports` → `researchApi.py`
  - GET `/api/research/download/{base64_key}` → `researchApi.py`

## Data stores

- S3: Research artifacts under `users/{userId}/research/{team}/{reportId}/...`
- DynamoDB: `ResearchReports` (status, metadata, S3 keys)
- SQS: Report processing queue

## Development

- See `infrastructure/README.md` for SAM deployment and environment details.
- Secrets via AWS Secrets Manager (Perplexity key, GitHub PAT, etc.).
