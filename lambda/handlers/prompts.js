// Prompt templates for multi-step LLM orchestration

const PHASE_GENERATOR_PROMPT = `You are an expert product manager working with a CEO and engineer to plan a digital product MVP.

Given a README.md file from a GitHub repository, analyze the product specification and generate a comprehensive project phase breakdown.

Use these 8 standard phases as a template, but modify them based on the specific product needs:

1. Discovery & Requirements - Initial project analysis, stakeholder alignment, and requirement gathering
2. Technical Planning & Architecture - System design, technology selection, and implementation roadmap  
3. UI/UX Design & Prototyping - User interface design, prototyping, and user experience optimization
4. Core Development - Implementation of core features and functionality
5. System Integration & Testing - Integration testing, API connections, and end-to-end workflow validation
6. Quality Assurance & Testing - Comprehensive testing, bug fixes, and quality validation
7. Deployment & Distribution - Packaging, distribution setup, and deployment automation
8. Launch & Documentation - Documentation, marketing materials, and go-to-market preparation

For each phase, provide:
- A unique ID (lowercase, no spaces)
- A clear title
- A detailed description of what will be accomplished
- Suggested roles needed (e.g., Product Owner, Software Engineer, Designer, etc.)

The product domain is: {domain}
The README content is:
{readmeContent}

Important considerations:
- For mobile apps, consider splitting development into API Development and Mobile Development phases
- For enterprise software, emphasize security and compliance phases
- For consumer products, focus more on UX and marketing phases
- Be specific to the actual product described in the README

Return a JSON object with this structure:
{
  "phases": [
    {
      "id": "discovery",
      "title": "Discovery & Requirements",
      "description": "Initial project analysis...",
      "suggestedRoles": ["Product Owner", "UX Researcher"]
    }
  ]
}`;

const EPIC_GENERATOR_PROMPT = `You are an expert agile project manager working to break down a project phase into detailed epics and tasks.

Given a specific phase of a digital product development project, generate a comprehensive task breakdown with role assignments.

Phase Information:
- Phase Title: {phaseTitle}
- Phase Description: {phaseDescription}
- Product Context: {productContext}

Common roles for the "{phaseTitle}" phase typically include:
{commonRoles}

Your task:
1. Analyze what specific tasks would be needed to complete this phase successfully
2. Identify the optimal team composition (which roles are needed)
3. For each task, assign the most appropriate role
4. Ensure tasks are sequenced logically and dependencies are considered

Important guidelines:
- Use the suggested common roles but feel free to add specialized roles if needed
- Each task should have a clear deliverable that adds value
- Tasks should enable subsequent work to be completed successfully
- Consider the specific product type and domain when defining tasks
- Be specific and actionable in task descriptions

Return a JSON object with this structure:
{
  "phaseId": "{phaseId}",
  "roles": ["Product Owner", "Software Engineer", "Designer"],
  "tasks": [
    {
      "title": "Clear, actionable task title",
      "description": "Detailed description of what needs to be done, why it's important, and what the deliverable will be.",
      "suggestedRole": "Product Owner"
    }
  ]
}`;

const ISSUE_FORMATTER_PROMPT = `You are formatting a GitHub issue for a SPARC-enabled Claude agent to work on.

Task Information:
- Task Title: {taskTitle}
- Task Description: {taskDescription}
- Assigned Role: {assignedRole}
- Phase: {phaseTitle}
- Product Context: {productContext}

Create a well-structured GitHub issue that includes:
1. A clear, actionable title
2. A comprehensive body with:
   - Context about the task and its importance
   - Step-by-step instructions for completion
   - Clear acceptance criteria
   - Any relevant technical details
   - SPARC directives for autonomous agent execution

Format the issue body using GitHub-flavored Markdown.

Return a JSON object with this structure:
{
  "title": "Issue title",
  "body": "Full issue body in markdown"
}`;

// Role mapping for different phases
const PHASE_ROLE_MAPPING = {
  'discovery': ['Product Owner', 'UX Researcher', 'Business Analyst', 'Technical Lead'],
  'technical_planning': ['Software Architect', 'Technical Lead', 'DevOps Engineer', 'Security Engineer'],
  'design': ['UX Designer', 'UI Designer', 'Product Designer', 'Frontend Developer'],
  'core_development': ['Software Engineer', 'Backend Developer', 'Frontend Developer', 'Database Engineer'],
  'integration': ['Software Engineer', 'QA Engineer', 'DevOps Engineer', 'API Developer'],
  'quality_assurance': ['QA Engineer', 'Test Automation Engineer', 'Performance Engineer', 'Security Tester'],
  'deployment': ['DevOps Engineer', 'Release Manager', 'Infrastructure Engineer', 'SRE'],
  'launch': ['Product Manager', 'Technical Writer', 'Marketing Manager', 'Support Engineer']
};

module.exports = {
  PHASE_GENERATOR_PROMPT,
  EPIC_GENERATOR_PROMPT,
  ISSUE_FORMATTER_PROMPT,
  PHASE_ROLE_MAPPING
};