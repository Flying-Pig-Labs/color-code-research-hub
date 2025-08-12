const template = `Create a project plan with 3 phases for: \${title}
        
Tech: \${techStack}
Features: \${features}

Return a JSON array with 3 phase objects. Each phase should have:
- id (string)
- name (string) 
- description (string)
- duration (string like "2 weeks")
- epics (array with 2 epics, each having: id, title, description, issues array)
- each issue should have: id, title, description, assignee (from: architect, backend-dev, frontend-dev, tester), priority (high/medium/low), estimatedHours (number 2-40)

Keep descriptions concise. Return ONLY valid JSON, no explanation.`;

function buildPrompt(variables = {}) {
  const normalized = { ...variables };
  if (Array.isArray(normalized.techStack)) {
    normalized.techStack = normalized.techStack.join(', ');
  }
  if (Array.isArray(normalized.features)) {
    normalized.features = normalized.features.join(', ');
  }
  return template.replace(/\$\{(\w+)\}/g, (_, key) => {
    const value = normalized[key];
    return value == null ? '' : String(value);
  });
}

module.exports = { template, buildPrompt };


