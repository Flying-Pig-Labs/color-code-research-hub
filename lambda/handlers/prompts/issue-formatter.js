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

module.exports = { ISSUE_FORMATTER_PROMPT };