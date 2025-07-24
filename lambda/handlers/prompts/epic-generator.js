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

Given a specific phase of a digital product development project, generate a comprehensive task breakdown with role assignments.

Phase Information:
- Phase Title: {phaseTitle}
- Phase Description: {phaseDescription}
- Product Context: {productContext}

Common roles for the "{phaseTitle}" phase typically include:
{commonRoles}

Your task:
1. Analyze what specific EPICS (large bodies of work) would be needed to complete this phase successfully
2. Think comprehensively - each phase typically requires multiple epics to fully deliver its objectives
3. Identify the optimal team composition (which roles are needed)
4. For each epic, assign the most appropriate role
5. Ensure epics are sequenced logically and dependencies are considered

Important guidelines:
- Remember that each task you generate will become an EPIC - a large body of work spanning multiple sprints
- Each epic should represent a broad goal or feature that would be broken down into smaller stories
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

module.exports = { EPIC_GENERATOR_PROMPT };