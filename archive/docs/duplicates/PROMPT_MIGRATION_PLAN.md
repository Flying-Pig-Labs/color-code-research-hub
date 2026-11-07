# Fail-Safe Prompt Migration Plan

## 🎯 Objective
Migrate all inline prompts to a consolidated `/lambda/handlers/prompts/` directory while preserving variable interpolation and formatting.

## 📋 Pre-Migration Checklist

### 1. Backup Current State
```bash
# Create backup branch
git checkout -b backup-before-prompt-migration
git add .
git commit -m "backup: Pre-prompt migration state"
git push origin backup-before-prompt-migration

# Return to main
git checkout main
```

### 2. Document Current Prompts
- [x] `/lambda/handlers/prompts/` already exists with 4 prompt files
- [ ] Identify all files with inline prompts
- [ ] Document variable dependencies for each prompt

## 🏗️ Migration Architecture

### Directory Structure
```
/lambda/handlers/prompts/
├── README.md                    # Documentation for prompt usage
├── index.js                     # Central export file
├── constants.js                 # Shared constants and configs
│
├── core/                        # Core prompts
│   ├── phase-generator.js       ✅ Already exists
│   ├── epic-generator.js        ✅ Already exists  
│   ├── issue-formatter.js       ✅ Already exists
│   └── form-population.js       ✅ Already exists
│
├── research/                    # Research-related prompts
│   ├── report-processing.js     
│   └── research-analysis.js     
│
├── planning/                    # Plan generation prompts
│   ├── plan-generator.js        
│   ├── plan-generator-v2.js     
│   └── plan-async.js            
│
└── utils/                       # Utility functions
    ├── prompt-builder.js        # Template builder with variable support
    └── prompt-validator.js      # Validation utilities
```

## 🔄 Migration Strategy

### Phase 1: Create Infrastructure (Non-Breaking)

#### Step 1.1: Create Prompt Builder Utility
```javascript
// /lambda/handlers/prompts/utils/prompt-builder.js
class PromptBuilder {
  constructor(template) {
    this.template = template;
    this.variables = {};
  }

  setVariables(vars) {
    this.variables = { ...this.variables, ...vars };
    return this;
  }

  build() {
    let prompt = this.template;
    
    // Replace ${variable} patterns
    Object.entries(this.variables).forEach(([key, value]) => {
      const pattern = new RegExp(`\\$\\{${key}\\}`, 'g');
      prompt = prompt.replace(pattern, value || '');
    });
    
    // Handle template literals with backticks
    prompt = this.interpolateTemplateLiterals(prompt);
    
    return prompt;
  }

  interpolateTemplateLiterals(text) {
    // Preserve formatting for multi-line strings
    return text;
  }

  static fromTemplate(template) {
    return new PromptBuilder(template);
  }
}

module.exports = { PromptBuilder };
```

#### Step 1.2: Create Central Export File
```javascript
// /lambda/handlers/prompts/index.js
// Core prompts
const { PHASE_GENERATOR_PROMPT } = require('./core/phase-generator');
const { EPIC_GENERATOR_PROMPT } = require('./core/epic-generator');
const { ISSUE_FORMATTER_PROMPT } = require('./core/issue-formatter');
const { FORM_POPULATION_PROMPT } = require('./core/form-population');

// Research prompts
const { REPORT_PROCESSING_PROMPT } = require('./research/report-processing');

// Planning prompts  
const { PLAN_GENERATOR_PROMPT } = require('./planning/plan-generator');

// Utilities
const { PromptBuilder } = require('./utils/prompt-builder');

module.exports = {
  // Core
  PHASE_GENERATOR_PROMPT,
  EPIC_GENERATOR_PROMPT,
  ISSUE_FORMATTER_PROMPT,
  FORM_POPULATION_PROMPT,
  
  // Research
  REPORT_PROCESSING_PROMPT,
  
  // Planning
  PLAN_GENERATOR_PROMPT,
  
  // Utils
  PromptBuilder
};
```

### Phase 2: Migrate Prompts (One at a Time)

#### Step 2.1: Identify Inline Prompts
```bash
# Find all inline prompts
grep -r "const.*prompt.*=.*\`" --include="*.js" lambda/handlers/services/
grep -r "const.*PROMPT.*=.*\`" --include="*.js" lambda/handlers/services/
```

#### Step 2.2: Migration Template for Each Prompt

**BEFORE** (inline prompt):
```javascript
// In service file
const prompt = `
You are analyzing ${projectName}.
Tech stack: ${techStack.join(', ')}
Features: ${features.map(f => `- ${f}`).join('\n')}
`;
```

**AFTER** (migrated prompt):
```javascript
// /lambda/handlers/prompts/planning/project-analysis.js
const PROJECT_ANALYSIS_TEMPLATE = `
You are analyzing \${projectName}.
Tech stack: \${techStackList}
Features: \${featuresList}
`;

function buildProjectAnalysisPrompt(variables) {
  const { projectName, techStack = [], features = [] } = variables;
  
  return PROJECT_ANALYSIS_TEMPLATE
    .replace(/\${projectName}/g, projectName)
    .replace(/\${techStackList}/g, techStack.join(', '))
    .replace(/\${featuresList}/g, features.map(f => `- ${f}`).join('\n'));
}

module.exports = {
  PROJECT_ANALYSIS_TEMPLATE,
  buildProjectAnalysisPrompt
};

// In service file
const { buildProjectAnalysisPrompt } = require('../prompts/planning/project-analysis');
const prompt = buildProjectAnalysisPrompt({ projectName, techStack, features });
```

### Phase 3: Testing Strategy

#### Step 3.1: Create Test Harness
```javascript
// /lambda/handlers/prompts/test/validate-prompts.js
const fs = require('fs');
const path = require('path');

function validatePromptMigration(originalFile, migratedPromptBuilder, testData) {
  // 1. Generate prompt with original inline code
  const originalPrompt = generateOriginalPrompt(testData);
  
  // 2. Generate prompt with migrated builder
  const migratedPrompt = migratedPromptBuilder(testData);
  
  // 3. Compare outputs
  if (originalPrompt !== migratedPrompt) {
    console.error('❌ Prompt migration failed!');
    console.error('Original:', originalPrompt.substring(0, 100));
    console.error('Migrated:', migratedPrompt.substring(0, 100));
    return false;
  }
  
  console.log('✅ Prompt migration validated');
  return true;
}
```

#### Step 3.2: Unit Tests for Each Migrated Prompt
```javascript
// /lambda/tests/prompts/test-prompt-migration.js
const { buildProjectAnalysisPrompt } = require('../../handlers/prompts/planning/project-analysis');

describe('Prompt Migration Tests', () => {
  test('Project Analysis Prompt maintains variable interpolation', () => {
    const testData = {
      projectName: 'Test Project',
      techStack: ['React', 'Node.js', 'PostgreSQL'],
      features: ['Auth', 'Dashboard', 'API']
    };
    
    const result = buildProjectAnalysisPrompt(testData);
    
    expect(result).toContain('Test Project');
    expect(result).toContain('React, Node.js, PostgreSQL');
    expect(result).toContain('- Auth\n- Dashboard\n- API');
  });
});
```

## 🛡️ Fail-Safe Mechanisms

### 1. Gradual Migration
- Migrate one prompt at a time
- Keep original inline prompt commented until verified
- Test each migration before moving to next

### 2. Rollback Strategy
```javascript
// Keep original prompt as fallback
const USE_MIGRATED_PROMPTS = process.env.USE_MIGRATED_PROMPTS === 'true';

const prompt = USE_MIGRATED_PROMPTS 
  ? buildMigratedPrompt(data)
  : buildOriginalInlinePrompt(data);
```

### 3. Validation Checklist for Each Prompt
- [ ] Variable interpolation works correctly
- [ ] Multi-line formatting preserved
- [ ] Special characters handled properly
- [ ] JSON structures remain valid
- [ ] No runtime errors
- [ ] Output matches original exactly

### 4. Deployment Strategy
```bash
# Step 1: Deploy with feature flag OFF
USE_MIGRATED_PROMPTS=false sam deploy

# Step 2: Test specific Lambda with flag ON
aws lambda update-function-configuration \
  --function-name PlanGeneratorCLI \
  --environment "Variables={USE_MIGRATED_PROMPTS=true}"

# Step 3: Monitor CloudWatch for errors
aws logs tail /aws/lambda/PlanGeneratorCLI --follow

# Step 4: If successful, enable for all functions
USE_MIGRATED_PROMPTS=true sam deploy
```

## 📊 Migration Tracking

### Files to Migrate

| File | Prompts | Status | Tested |
|------|---------|--------|--------|
| **Already Using External Prompts** | | | |
| `/services/llm-orchestrator-service.js` | Uses external prompts ✅ | Complete | ✅ |
| `/prompts/phase-generator.js` | External prompt module ✅ | Complete | ✅ |
| `/prompts/epic-generator.js` | External prompt module ✅ | Complete | ✅ |
| `/prompts/issue-formatter.js` | External prompt module ✅ | Complete | ✅ |
| `/prompts/form-population.js` | External prompt module ✅ | Complete | ✅ |
| **Files with Inline Prompts to Migrate** | | | |
| `/services/report-processing-service.js` | 2 prompts (SUMMARY_PROMPT, FORMAT_REPORT_PROMPT) | Pending | ⬜ |
| `/services/form-populator-service.js` | Uses FORM_POPULATION_PROMPT from external | Complete | ✅ |
| `/planGenerator.js` | 3 inline prompts (metadata extraction, improvements, phase generation) | Pending | ⬜ |
| `/planGeneratorV2.js` | 1 inline prompt | Pending | ⬜ |
| `/planGeneratorAsync.js` | References external prompts | Complete | ✅ |
| `/prompts.js` | 3 prompts (deprecated file - should be removed) | Pending | ⬜ |
| `/generateResearchReport.js` | Uses Perplexity API (no text prompts) | N/A | N/A |
| `/reportProcessor.js` | May have prompts | Pending | ⬜ |

## 🚀 Implementation Order

### Week 1: Infrastructure & Testing
- Day 1: Create prompt builder utility and test harness
- Day 2: Set up central export file and directory structure
- Day 3: Write comprehensive tests for prompt builder

### Week 2: Core Migrations
- Day 4: Migrate form-populator-service prompts
- Day 5: Migrate report-processing-service prompts
- Day 6: Test migrated prompts in dev environment

### Week 3: Complex Migrations
- Day 7: Migrate planGenerator prompts
- Day 8: Migrate planGeneratorV2 prompts
- Day 9: Full integration testing

### Week 4: Deployment
- Day 10: Deploy with feature flag OFF
- Day 11: Gradual rollout with monitoring
- Day 12: Full deployment and cleanup

## ⚠️ Critical Considerations

### 1. Variable Interpolation Patterns
```javascript
// Pattern 1: Template literals with ${}
`Hello ${name}` → "Hello " + name

// Pattern 2: String concatenation
"Hello " + name → Keep as is

// Pattern 3: Array joins
${items.join(', ')} → Pre-process before injection

// Pattern 4: Conditional content
${isEnabled ? 'Enabled' : 'Disabled'} → Use builder logic
```

### 2. Special Characters
- Escape sequences: `\n`, `\t`, `\\`
- Quote handling: `"`, `'`, `` ` ``
- JSON in prompts: Validate JSON.parse() still works

### 3. Performance Impact
- Lazy loading: Only load prompts when needed
- Caching: Cache built prompts when variables don't change
- Bundle size: Monitor Lambda package size

## 📝 Post-Migration Cleanup

1. Remove all inline prompts
2. Delete backup comments
3. Update documentation
4. Archive migration branch
5. Update README with prompt usage guide

## 🎯 Success Criteria

- [ ] All prompts centralized in `/prompts/` directory
- [ ] No inline prompt strings in service files
- [ ] All tests passing
- [ ] No performance degradation
- [ ] Variable interpolation working correctly
- [ ] CloudWatch shows no new errors
- [ ] Easy to add new prompts
- [ ] Easy to modify existing prompts
- [ ] Clear documentation for future developers

## 🔄 Rollback Plan

If issues occur:
1. `git checkout backup-before-prompt-migration`
2. `sam deploy --profile mvp`
3. Investigate issues in CloudWatch
4. Fix and retry migration

---

**Created**: January 10, 2025
**Status**: Planning Phase
**Owner**: Development Team