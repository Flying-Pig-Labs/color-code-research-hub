# LLM Orchestration Sequence Documentation

This document details the exact sequence of LLM calls made by the CLI, now migrated to Lambda.

## Overview

The agent-team-composer CLI follows a precise 3-step orchestration process for generating project plans. Each step makes specific LLM calls with carefully crafted prompts.

## LLM Call Sequence

### Pre-Step: Form Population (Optional)
- **Purpose**: Analyze README to suggest form field values
- **Prompt**: `FORM_POPULATION_PROMPT`
- **Input**: README content + existing parsed data
- **Output**: Suggested values for title, description, targetUsers, techStack, features, domain, complexity
- **Model**: Claude 3 Sonnet (`anthropic.claude-3-sonnet-20240229-v1:0`)

### Step 1: Phase Generation
- **Purpose**: Generate 8 project phases based on README
- **Prompt**: `PHASE_GENERATOR_PROMPT`
- **Input**: 
  - Domain (e.g., "e-commerce", "healthcare")
  - README content
- **Output**: Array of phases with:
  - id (e.g., "discovery")
  - title (e.g., "Discovery & Requirements")
  - description
  - suggestedRoles
- **Model**: Claude 3 Sonnet

### Step 2: Epic/Task Generation
- **Purpose**: Break down each phase into specific tasks with role assignments
- **Prompt**: `EPIC_GENERATOR_PROMPT`
- **Calls**: One per phase (8 calls total, executed in parallel)
- **Input per call**:
  - phaseTitle
  - phaseDescription
  - productContext (title + description)
  - commonRoles (phase-specific role suggestions)
  - phaseId
- **Output per call**:
  - phaseId
  - roles (array of roles needed)
  - tasks (array with title, description, suggestedRole)
- **Model**: Claude 3 Sonnet

### Step 3: Issue Formatting
- **Purpose**: Format each task as a GitHub issue
- **Prompt**: `ISSUE_FORMATTER_PROMPT`
- **Calls**: One per task (variable, typically 40-80 total)
- **Batching**: Processes 3 tasks at a time
- **Rate Limiting**: 
  - 1 second delay between batches
  - 2 second delay between phases
- **Input per call**:
  - taskTitle
  - taskDescription
  - assignedRole
  - phaseTitle
  - productContext
- **Output per call**:
  - title (formatted issue title)
  - body (markdown-formatted issue body)
- **Model**: Claude 3 Sonnet

## Rate Limiting Strategy

The CLI implements careful rate limiting:
1. **Batch Processing**: Issues are processed in batches of 3
2. **Inter-Batch Delay**: 1000ms between batches within a phase
3. **Inter-Phase Delay**: 2000ms between phases
4. **Error Handling**: Falls back to original task data if formatting fails

## Prompt Templates

All prompts are stored in separate files:
- `/prompts/form-population.js` - Form field suggestions
- `/prompts/phase-generator.js` - Phase generation
- `/prompts/epic-generator.js` - Epic/task breakdown
- `/prompts/issue-formatter.js` - GitHub issue formatting

## Key Implementation Details

### 1. Prompt Sanitization
All inputs are sanitized to prevent prompt injection:
- Template syntax removal (`{}`, `${}`, `<%%>`, `{{}}`)
- Command sequence replacement (Human:, Assistant:, System:)
- Control character removal
- Length limiting

### 2. JSON Extraction
The system uses multiple fallback strategies:
1. Extract from code blocks (```json)
2. Extract raw JSON objects
3. Manual parsing with regex
4. Schema validation with Zod (in CLI)

### 3. Role Mapping
Phase-specific roles are pre-defined:
- Discovery: Market Research Analyst, User Research Specialist, Product Owner
- Implementation: Frontend Developer, Backend Developer, Database Engineer, DevOps Engineer
- Testing: Test Engineer, Security Auditor, Performance Tester
- etc.

### 4. Progress Caching (CLI Only)
The CLI implements progress caching to resume interrupted generations. This is not implemented in Lambda as each request is stateless.

## Model Configuration

- **Model ID**: `anthropic.claude-3-sonnet-20240229-v1:0`
- **Temperature**: 0.7
- **Max Tokens**: 
  - Form population: 2048
  - Other calls: 4096
- **Stop Sequences**: ["\n\nHuman:"]

## Error Handling

Each step has fallback behavior:
1. **Form Population**: Returns basic defaults if AI fails
2. **Phase Generation**: No fallback (throws error)
3. **Epic Generation**: No fallback (throws error)
4. **Issue Formatting**: Falls back to original task data

## Total LLM Calls

For a typical project:
- 1 call for form population (optional)
- 1 call for phase generation
- 8 calls for epic generation (one per phase)
- 40-80 calls for issue formatting (5-10 tasks per phase)
- **Total**: ~50-90 LLM calls per project generation