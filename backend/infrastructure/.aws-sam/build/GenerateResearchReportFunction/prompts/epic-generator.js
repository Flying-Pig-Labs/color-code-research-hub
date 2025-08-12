const EPIC_GENERATOR_PROMPT = `You are an expert agile project manager working to break down a project phase into detailed epics and tasks.

# 🧱 What is an Epic in Software Engineering?

In Agile software development, an **epic** is a **large body of work** that can be broken down into smaller tasks (called _user stories_ or _issues_) and delivered incrementally.

## 🗂️ Definition
- An **epic** represents a **broad goal or feature** that spans multiple sprints or iterations.
- It is **too large** to complete in a single sprint and must be **split into smaller, actionable stories**.

## 🧭 Context in Agile or Scrum
- Used in **backlog grooming** to organize and prioritize work.
- Acts as a **container** for related user stories or tasks.
- Helps teams **track progress** on larger initiatives over time.

## 🧩 Why Use Epics?
- **Clarity at scale**: Avoid a flat, overwhelming backlog.
- **Strategic planning**: Connect daily work to higher-level goals.
- **Progress tracking**: Measure completion of complex work across sprints or teams.

## 🧠 Examples
| Epic                          | Example User Stories                                         |
|-------------------------------|--------------------------------------------------------------|
| Implement user authentication | - Sign up page UI<br>- Password reset flow<br>- JWT-based session handling |
| Build product search feature   | - Index products in Elasticsearch<br>- Frontend search UI<br>- Paginate results |

Given a specific phase of a digital product development project, generate a comprehensive epic breakdown using feature decomposition.

Phase Information:
- Phase Title: {phaseTitle}
- Phase Description: {phaseDescription}
- Product Context: {productContext}

Common roles for the "{phaseTitle}" phase typically include:
{commonRoles}

## CRITICAL: Feature-Driven Decomposition Process

### Step 1: Identify Phase Features
First, break down this phase into its constituent FEATURES. Features are the major capabilities, components, or deliverables that must be completed to successfully deliver this phase.

Examples of features by scope:
- **Large features**: Complete authentication system, Full API architecture, Comprehensive testing framework
- **Medium features**: User dashboard, Payment integration, Search functionality  
- **Small features**: Password reset flow, Error logging, Email notifications

### Step 2: Create Epics for Each Feature
For EACH feature identified, create one or more epics. The number of epics depends on the feature's complexity:
- Simple features may need just 1 epic
- Complex features may need 2-4 epics to cover different aspects

### Step 3: Ensure Comprehensive Coverage
Your epics should collectively cover:
- All technical implementation needed
- All user-facing functionality
- All quality and testing requirements
- All documentation and knowledge transfer
- All integration and deployment needs

Important guidelines:
- DO NOT limit yourself to a fixed number of epics - generate as many as needed to properly cover all features
- Each epic should represent a complete, deliverable piece of work
- Epics should be sequenced considering dependencies
- Each epic must have a clear owner (role assignment)
- Be specific to this project, not generic
- Consider edge cases, security, performance, and maintenance

Important: Each epic should include a note about reviewing the CHANGELOG before implementation begins.

Return a valid JSON object with this structure:
{
  "phaseId": "{phaseId}",
  "roles": ["Product Owner", "Software Engineer", "Designer"],
  "epics": [
    {
      "title": "Clear, actionable epic title",
      "description": "Detailed description of what needs to be done, why it's important, and what the deliverable will be. \\n\\n📋 Note for Agents or Agent Teams picking up this Epic: This work item was created before project work began; because implementation details change throughout a product development journey as new information comes to light, go back and review the project CHANGELOG to check for completed work, architectural decisions, and established patterns that may impact this epic's implementation approach.\\n\\n⚠️ CRITICAL: You have liberty to adjust technical implementation details based on what you find, but NEVER change the feature description, success criteria, or anything affecting user experience. Instead, add comments to this epic documenting your technical insights and integration approach. This courtesy check prevents integration bugs without altering product requirements.",
      "suggestedRole": "Product Owner"
    }
  ]
}

IMPORTANT: Return ONLY valid JSON. All newlines within string values must be escaped as \\n. Do not include any explanatory text before or after the JSON.`;

module.exports = { EPIC_GENERATOR_PROMPT };