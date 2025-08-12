# CLI to Lambda Migration Summary

This document summarizes the extraction and migration of the exact CLI logic from `agent-team-composer` to Lambda functions.

## What Was Migrated

### 1. Prompt Templates (Exact Copies)
All prompts have been copied exactly as-is from the CLI:
- `/prompts/phase-generator.js` - 8-phase project breakdown prompt
- `/prompts/epic-generator.js` - Task/epic generation with role assignments
- `/prompts/issue-formatter.js` - GitHub issue formatting
- `/prompts/form-population.js` - README analysis for form suggestions

### 2. Core Services

#### LLM Orchestrator Service (`/services/llm-orchestrator-service.js`)
Implements the exact 3-step orchestration process:
1. **Phase Generation** - Generates 8 standard phases based on domain and README
2. **Epic Generation** - For each phase, generates tasks with role assignments
3. **Issue Formatting** - Formats each task as a GitHub issue

Key features preserved:
- Exact same prompt templates
- Same role mapping by phase
- Batch processing (3 issues at a time)
- Rate limiting (1s between batches, 2s between phases)
- Same JSON extraction logic
- Same error handling with fallbacks

#### Form Populator Service (`/services/form-populator-service.js`)
Analyzes README content to suggest:
- Project title and description
- Target users
- Tech stack
- Features
- Domain classification
- Complexity assessment

#### Prompt Sanitizer (`/services/prompt-sanitizer.js`)
Security features:
- Removes prompt injection patterns
- Sanitizes template syntax
- Limits input lengths
- Checks for suspicious patterns

### 3. Lambda Handler (`planGeneratorCLI.js`)
New Lambda handler that exposes three endpoints:

1. **`/populate-form`** - AI-powered form field suggestions
   - Input: README content, existing data
   - Output: Suggested form fields

2. **`/generate-cli-plan`** - Direct CLI logic execution
   - Input: Project info, README content
   - Output: Complete project plan with phases and issues

3. **`/generate-full-plan`** - Compatible with existing UI
   - Input: Metadata format (from current UI)
   - Output: Transformed to match current UI expectations

## Key Differences from Original CLI

1. **No Progress Caching** - Lambda is stateless, so no cache between calls
2. **AWS Bedrock Instead of Anthropic SDK** - Uses AWS-managed Claude
3. **Simplified JSON Extraction** - Removed Zod validation for simplicity
4. **No Telemetry** - Removed telemetry tracking

## Model Configuration

Uses the same Claude model as CLI:
- Model: `anthropic.claude-3-sonnet-20240229-v1:0`
- Temperature: 0.7
- Max Tokens: 4096 (2048 for form population)

## Usage

The new Lambda can be deployed and used as a drop-in replacement:

```javascript
// Form population
POST /populate-form
{
  "readmeContent": "...",
  "existingData": { "title": "...", "features": [...] }
}

// Full CLI plan generation
POST /generate-cli-plan
{
  "projectInfo": {
    "title": "Project Name",
    "description": "Description",
    "domain": "e-commerce",
    "features": ["feature1", "feature2"],
    "techStack": ["React", "Node.js"],
    "complexity": "moderate",
    "targetUsers": ["developers"]
  },
  "readmeContent": "..."
}
```

## File Structure

```
lambda/handlers/
├── planGeneratorCLI.js          # Main Lambda handler
├── prompts/                     # Exact prompts from CLI
│   ├── phase-generator.js
│   ├── epic-generator.js
│   ├── issue-formatter.js
│   └── form-population.js
├── services/                    # Core logic services
│   ├── llm-orchestrator-service.js
│   ├── form-populator-service.js
│   └── prompt-sanitizer.js
├── MIGRATION_SEQUENCE.md        # Detailed sequence documentation
└── CLI_MIGRATION_SUMMARY.md     # This file
```

## Next Steps

1. Update SAM template to include the new handler
2. Deploy and test with real README content
3. Update frontend to use new endpoints
4. Monitor performance and adjust rate limiting if needed