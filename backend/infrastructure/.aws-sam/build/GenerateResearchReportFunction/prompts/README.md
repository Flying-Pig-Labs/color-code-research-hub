# 📝 LLM Prompts Directory

> **Prompt templates for AI-powered plan generation**

## Overview

This directory contains the carefully crafted prompt templates used by the LLM orchestrator service to generate comprehensive project plans. These prompts have been ported from the original CLI implementation and refined for optimal results.

## Prompt Templates

### 🎯 phase-generator.js

Generates the 8 standard SDLC phases for any project.

**Purpose**: Creates a consistent framework of development phases regardless of project type.

**Output Structure**:
```javascript
{
  phases: [
    {
      id: "phase-1",
      title: "Discovery & Requirements",
      description: "Initial research, stakeholder interviews...",
      roles: ["Product Manager", "Business Analyst", "UX Researcher"],
      estimatedDuration: "2-3 weeks"
    },
    // ... 7 more phases
  ]
}
```

**Key Features:**
- Always generates exactly 8 phases
- Consistent phase structure across all projects
- Role assignments based on phase requirements
- Time estimates for each phase

**Phase Order:**
1. Discovery & Requirements
2. Technical Planning & Architecture  
3. UI/UX Design & Prototyping
4. Core Development
5. System Integration & Testing
6. Quality Assurance & Testing
7. Deployment & Distribution
8. Launch & Documentation

### 🚀 epic-generator.js

Generates detailed epics for each phase.

**Purpose**: Creates 5-10 specific epics per phase with role assignments.

**Input Context**:
- Phase details (title, description, roles)
- Project metadata (domain, tech stack, features)
- README content for additional context

**Output Structure**:
```javascript
{
  epics: [
    {
      id: "epic-1",
      title: "User Authentication System",
      description: "Implement secure user authentication...",
      role: "Backend Developer",
      phase: "phase-4",
      priority: "high",
      dependencies: ["epic-2"],
      estimatedHours: 40
    },
    // ... more epics
  ]
}
```

**Generation Strategy:**
- Analyzes phase requirements
- Considers project complexity
- Assigns appropriate roles
- Creates logical dependencies
- Estimates effort based on scope

### 📋 issue-formatter.js

Formats epics into GitHub-ready issues.

**Purpose**: Transforms epics into well-structured GitHub issues with proper formatting.

**Issue Format**:
```markdown
## Context
[Background information about why this issue is needed]

## Tasks
- [ ] Specific task 1
- [ ] Specific task 2
- [ ] Specific task 3

## Acceptance Criteria
- Clear, measurable criteria
- User-facing outcomes
- Technical requirements

## Technical Notes
- Implementation suggestions
- Potential challenges
- Relevant documentation

## Dependencies
- Links to related issues
- Required prerequisites
```

**Formatting Rules:**
- Title format: `[Role] Task Description`
- Markdown formatting for readability
- Actionable task lists
- Clear acceptance criteria
- Label suggestions

## Prompt Engineering Principles

### 1. Clarity and Specificity

```javascript
// Good: Specific instructions
"Generate exactly 8 SDLC phases following standard software development lifecycle"

// Bad: Vague instructions  
"Generate some phases for development"
```

### 2. Structured Output

All prompts request JSON output with specific schemas:

```javascript
const PHASE_OUTPUT_SCHEMA = {
  phases: [{
    id: "string",
    title: "string", 
    description: "string",
    roles: ["string"],
    estimatedDuration: "string"
  }]
};
```

### 3. Context Injection

Prompts include relevant context:

```javascript
const prompt = `
Project: ${projectInfo.title}
Domain: ${projectInfo.domain}
Tech Stack: ${projectInfo.techStack.join(', ')}
Complexity: ${projectInfo.complexity}

README Content:
${readmeContent}

Based on this context, generate...
`;
```

### 4. Role-Based Generation

Prompts consider available roles:

```javascript
const STANDARD_ROLES = [
  "Product Manager",
  "Business Analyst",
  "UX Designer",
  "UI Designer",
  "Frontend Developer",
  "Backend Developer",
  "Full-Stack Developer",
  "DevOps Engineer",
  "QA Engineer",
  "Technical Writer"
];
```

## Prompt Templates Structure

### Base Template Pattern

```javascript
module.exports = {
  PROMPT_NAME: `
    <system_instructions>
    You are an expert project planner...
    </system_instructions>
    
    <context>
    ${contextVariables}
    </context>
    
    <task>
    Generate...
    </task>
    
    <output_format>
    Return JSON in this exact format:
    ${outputSchema}
    </output_format>
    
    <constraints>
    - Constraint 1
    - Constraint 2
    </constraints>
  `
};
```

### Variable Interpolation

```javascript
function buildPrompt(template, variables) {
  return template.replace(/\${(\w+)}/g, (match, key) => {
    return variables[key] || match;
  });
}
```

## Testing Prompts

### Validation Tests

```javascript
// Test phase generation
const phases = await generatePhases(testProject);
expect(phases).toHaveLength(8);
expect(phases[0].title).toBe("Discovery & Requirements");
```

### Output Quality Checks

```javascript
function validateEpicOutput(epics) {
  return epics.every(epic => 
    epic.id &&
    epic.title &&
    epic.description &&
    epic.role &&
    STANDARD_ROLES.includes(epic.role)
  );
}
```

## Optimization Techniques

### 1. Token Efficiency

```javascript
// Compress context by removing redundancy
const compressedReadme = readme
  .replace(/\s+/g, ' ')
  .substring(0, 2000);
```

### 2. Parallel Processing

```javascript
// Generate epics for all phases in parallel
const epicPromises = phases.map(phase => 
  generateEpicsForPhase(phase, context)
);
```

### 3. Caching Patterns

```javascript
// Cache phase generation for similar projects
const phaseCache = new Map();
const cacheKey = `${domain}-${complexity}`;
```

## Common Issues and Solutions

### Issue: Inconsistent Output Format

**Solution**: Use strict JSON schema validation
```javascript
const Joi = require('joi');

const phaseSchema = Joi.object({
  id: Joi.string().required(),
  title: Joi.string().required(),
  // ... rest of schema
});
```

### Issue: Role Mismatch

**Solution**: Validate roles against standard list
```javascript
if (!STANDARD_ROLES.includes(epic.role)) {
  epic.role = findClosestRole(epic.role, STANDARD_ROLES);
}
```

### Issue: Excessive Token Usage

**Solution**: Implement context windowing
```javascript
const MAX_CONTEXT_LENGTH = 2000;
const truncatedContext = context.substring(0, MAX_CONTEXT_LENGTH);
```

## Best Practices

1. **Version Control**: Track prompt changes and their impact
2. **A/B Testing**: Test prompt variations for quality
3. **Monitoring**: Log prompt performance metrics
4. **Documentation**: Document why specific prompt choices were made
5. **Validation**: Always validate LLM output against schema
6. **Fallbacks**: Have fallback prompts for edge cases

## Metrics and Monitoring

Track these metrics for prompt performance:

```javascript
const promptMetrics = {
  executionTime: endTime - startTime,
  tokenUsage: response.usage.total_tokens,
  outputQuality: validateOutput(response),
  errorRate: errors / totalCalls,
  cacheHitRate: cacheHits / totalCalls
};
```

## Future Improvements

- [ ] Dynamic prompt adjustment based on project type
- [ ] Multi-language prompt support
- [ ] Prompt versioning system
- [ ] A/B testing framework
- [ ] Quality scoring system
- [ ] Prompt template marketplace

## Related Documentation

- [LLM Orchestrator Service](../services/README.md#llm-orchestrator-servicejs)
- [API Documentation](../../../docs/API_DOCUMENTATION.md#plan-generation-apis)
- [Architecture Overview](../../../docs/ARCHITECTURE.md#ai-components)

---

> 💡 **Prompt Engineering Tip**: Small changes in prompt wording can have significant impacts on output quality. Always test prompt changes thoroughly before deploying!