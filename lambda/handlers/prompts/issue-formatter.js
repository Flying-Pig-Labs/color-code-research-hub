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

You are creating a STORY (GitHub Issue) that represents a discrete user-facing goal or engineering deliverable.
This story should be substantial enough to track as its own issue, not just a simple task.

Create a well-structured GitHub issue that includes:
1. A clear, actionable title for the STORY
2. A comprehensive body with:
   - Context about the story and its importance
   - User value or engineering benefit delivered
   - Breaking down into concrete tasks (as checkboxes)
   - Clear acceptance criteria
   - Any relevant technical details
   - SPARC directives for autonomous agent execution

Format the issue body using GitHub-flavored Markdown.

Return a JSON object with this structure:
{
  "title": "Issue title",
  "body": "Full issue body in markdown"
}`;

module.exports = { ISSUE_FORMATTER_PROMPT };