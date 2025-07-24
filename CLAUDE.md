# CLAUDE.md - Critical System Documentation

## THE FUNDAMENTAL PROBLEM

The web UI is NOT displaying epics correctly because PlanWorkflow.tsx is calling the WRONG endpoint. It's calling `/api/plan/v2/generate-full-plan` which returns placeholder data to avoid timeouts, instead of `/api/plan/generate-cli-plan` which actually works.

## HOW THE CLI ACTUALLY WORKS

The CLI that "just works" follows this exact flow:

### 1. THREE-STEP LLM ORCHESTRATION

**Step 1: Generate Phases**
- Uses `PHASE_GENERATOR_PROMPT` 
- Generates 8 standard phases for ANY project:
  1. Discovery & Requirements
  2. Technical Planning & Architecture  
  3. UI/UX Design & Prototyping
  4. Core Development
  5. System Integration & Testing
  6. Quality Assurance & Testing
  7. Deployment & Distribution
  8. Launch & Documentation

**Step 2: Generate Epics/Tasks** 
- Uses `EPIC_GENERATOR_PROMPT`
- Runs 8 PARALLEL calls (one per phase)
- Generates 5-10 epics PER PHASE
- Each epic gets a specific role assignment
- Total: 40-80 epics across all phases

**Step 3: Format Issues**
- Uses `ISSUE_FORMATTER_PROMPT`
- Processes epics in batches of 3
- Formats each as a GitHub issue with:
  - Title: `[Role] Task Name`
  - Body: Markdown with context, tasks, acceptance criteria
  - Labels: phase, role, sparc-enabled

### 2. THE WORKING ENDPOINT

The CLI logic is implemented in:
- **Handler**: `/lambda/handlers/planGeneratorCLI.js`
- **Service**: `/lambda/handlers/services/llm-orchestrator-service.js`
- **Endpoint**: `/api/plan/generate-cli-plan`

This endpoint:
1. Calls `generateProjectPlan()` which runs ALL THREE STEPS
2. Returns COMPLETE data with all phases, epics, and issues
3. Makes 50-90 LLM calls total (not 2-3 like the broken V2)
4. Takes 30-60 seconds to complete

### 3. WHY V2 IS BROKEN

The V2 endpoint (`/api/plan/v2/generate-full-plan`) was created to avoid Lambda timeouts by:
- Only generating phases (Step 1)
- Adding 2 placeholder epics to phase 1 only
- Returning empty epic arrays for all other phases
- Deferring real epic generation to a separate call

Result: The UI shows only 2 placeholder epics instead of 40-80 real ones.

### 4. THE FIX

**Option 1: Use the Working CLI Endpoint**
```javascript
// In PlanWorkflow.tsx, line 144:
const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plan/generate-cli-plan`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectInfo: projectSummary,  // Note: different field name
    readmeContent: readmeContent
  })
});
```

**Option 2: Fix the V2 Endpoint**
Make it actually generate epics instead of returning placeholders.

**Option 3: Implement Progressive Loading**
1. Call generate-phases first
2. Then call generate-epics for each phase
3. Update UI progressively as data arrives

## CRITICAL NOTES

1. **The CLI endpoint WORKS** - it generates real epics for all phases
2. **The V2 endpoint is BROKEN** - it only returns 2 placeholder epics
3. **The UI expects complete data** - it can't handle the async epic generation
4. **Sample data is never used** - because allEpics.length > 0 (has 2 placeholders)

## COMMANDS TO RUN

When making changes to this system, always run:
```bash
npm run lint
npm run typecheck
```

## DEPLOYMENT INSTRUCTIONS

### Frontend (Automatic)
The frontend deploys automatically via AWS Amplify when you push to main branch.

### Backend Lambda Functions (Manual)

1. **Install SAM CLI** (if not already installed):
```bash
curl -L https://github.com/aws/aws-sam-cli/releases/latest/download/aws-sam-cli-linux-x86_64.zip -o sam.zip
unzip -q sam.zip
sudo ./install
sam --version  # Should show SAM CLI version
```

2. **Build the SAM application**:
```bash
cd infrastructure
sam build
```

3. **Deploy to AWS**:
```bash
# IMPORTANT: Use profile=personal, NOT default
sam deploy --profile personal --stack-name color-code-research-hub --capabilities CAPABILITY_IAM --resolve-s3 --no-confirm-changeset --region us-east-1
```

The deployment will:
- Upload Lambda function code
- Update API Gateway endpoints
- Apply any infrastructure changes from template.yaml
- Take 2-5 minutes to complete

## TESTING THE FIX

1. Check that Epic View shows 40-80 epics (not 2)
2. Check that epics are distributed across all 8 phases
3. Check that each epic has a proper role assignment
4. Check that Issue View shows all issues properly formatted