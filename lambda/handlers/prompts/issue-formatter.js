const ISSUE_FORMATTER_PROMPT = `You are formatting a GitHub issue for a SPARC-enabled Claude agent to work on.

# ✅ What is a Task in Software Engineering?

In Agile teams, a **task** is the **smallest unit of actionable work**—a specific step required to complete a user story. Tasks are **not typically tracked as standalone GitHub issues**, but instead live inside the **description or checklist of a story**.

## 🔍 Definition
- A **task** is a **bite-sized, concrete action**, often technical or operational in nature.
- It helps complete a **user story**, but doesn't deliver user-facing value on its own.
- In GitHub-based workflows, tasks are often represented as:
  - Markdown checkboxes (\`- [ ]\`) within a story issue description
  - Inline TODOs during implementation
  - Comments or annotations in PRs

## 🔗 Hierarchy in Context
Epic → Story (GitHub Issue) → Task (Checklist Item)

- **Epics** are large, strategic objectives.
- **Stories** are the finest-grain **trackable units in GitHub**—they represent discrete user-facing goals or engineering deliverables.
- **Tasks** are **non-issue-level** steps that support story completion.

## 🧠 Examples
| Task                                | Story (GitHub Issue)                 | Epic                               |
|-------------------------------------|--------------------------------------|------------------------------------|
| \`- [ ] Create login form layout\`    | "Implement login UI"                 | "Implement user authentication"   |
| \`- [ ] Add search index to backend\` | "Build product search endpoint"      | "Build product search feature"    |
| \`- [ ] Write CI config for deploy\`  | "Set up CI/CD for auth service"      | "Improve DevOps automation"       |

Task Information:
- Task Title: {taskTitle}
- Task Description: {taskDescription}
- Assigned Role: {assignedRole}
- Phase: {phaseTitle}
- Product Context: {productContext}

## CRITICAL: Component-Based Issue Decomposition

### Step 1: Identify Workable Components
Break down this epic into its SMALLEST WORKABLE COMPONENTS. These are the individual pieces that:
- Can be independently developed, tested, and deployed
- Deliver a specific piece of functionality
- Have clear boundaries and interfaces
- Can be completed by one person in 1-3 days

Examples of workable components:
- **API endpoints**: Individual CRUD operations, authentication endpoints
- **UI components**: Login form, navigation menu, data table
- **Data models**: User schema, product model, order structure
- **Integration points**: Payment gateway connector, email service
- **Configuration**: Environment setup, CI/CD pipeline, deployment scripts

### Step 2: Create Issues for Each Component
For EACH workable component, create a GitHub issue that:
- Focuses on that single component
- Can be independently verified as complete
- Has clear acceptance criteria
- Includes all necessary implementation details

### Step 3: Define Discrete Tasks for Each Issue
Within each issue, break down the work into LOGICAL, DISCRETE, SEQUENCED TASKS:
1. Setup/preparation tasks (environment, dependencies, scaffolding)
2. Core implementation tasks (the actual coding work)
3. Testing tasks (unit tests, integration tests, edge cases)
4. Documentation tasks (code comments, API docs, usage examples)
5. Review/validation tasks (code review prep, acceptance testing)

Important: Tasks should be:
- Ordered by dependency (what must be done first?)
- Atomic (each task does one thing)
- Verifiable (clear completion criteria)
- Time-boxed (can be done in hours, not days)

Create a comprehensive GitHub issue with:

1. **Title**: "[Role] Component: Specific deliverable" (e.g., "[Backend] API: User authentication endpoint")

2. **Body Structure**:
\`\`\`markdown
## 🎯 Objective
Brief description of what this issue delivers and why it's important.

## 📋 Context
- Part of epic: {taskTitle}
- Phase: {phaseTitle}
- Dependencies: List any other issues that must be completed first
- Impacts: What other components depend on this

## 🔧 Implementation Details
Specific technical details, architecture decisions, or design considerations.

## ✅ Acceptance Criteria
- [ ] Specific, measurable criteria that must be met
- [ ] Include functional requirements
- [ ] Include non-functional requirements (performance, security)
- [ ] Include testing requirements

## 📝 Tasks
### Setup & Preparation
- [ ] Task 1: Specific setup step
- [ ] Task 2: Dependencies or environment prep

### Core Implementation  
- [ ] Task 3: Main coding task broken down
- [ ] Task 4: Additional implementation steps

### Testing & Validation
- [ ] Task 5: Unit test implementation
- [ ] Task 6: Integration testing
- [ ] Task 7: Edge case handling

### Documentation & Review
- [ ] Task 8: Code documentation
- [ ] Task 9: API/usage documentation
- [ ] Task 10: Prepare for code review

## 🤖 SPARC Directives
Instructions for autonomous agent execution...

## 📋 Note for Agents or Agent Teams picking up this Issue:
This work item was created before project work began; because implementation details change throughout a product development journey as new information comes to light, go back and review the project CHANGELOG to:

1. **Check for completed epics and issues** that may impact this work
2. **Identify any architectural decisions** made in previous phases
3. **Review technical patterns** established by completed work
4. **Adjust implementation approach** based on actual code structure
5. **Coordinate with existing code** rather than duplicating efforts

⚠️ **CRITICAL CONSTRAINTS:**
- **NEVER change** the feature description, objectives, or acceptance criteria
- **NEVER modify** anything that affects the user experience
- **ONLY adjust** technical implementation details (e.g., which APIs to call, file structure, integration points)
- **DO NOT edit** the issue itself - add comments instead

📝 **How to document your insights:**
Add a comment to this issue with:
- Technical adjustments you're making based on CHANGELOG review
- Integration points discovered in existing code
- Implementation approach changes to avoid conflicts
- Any architectural patterns you'll follow from completed work

This courtesy check will save time and prevent integration bugs later.
\`\`\`

Return a JSON object with this structure:
{
  "title": "[Role] Component: Specific deliverable",
  "body": "Full issue body following the template above"
}`;

module.exports = { ISSUE_FORMATTER_PROMPT };