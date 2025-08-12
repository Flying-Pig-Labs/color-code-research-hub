const template = `Based on this README, suggest improvements and additions to the project metadata.

Current data:
\${existingData}

README:
\${readmeContent}

Return improved metadata in the same JSON format with better title, description, targetUsers, techStack, features, domain, and complexity.
Return only valid JSON.`;

function buildPrompt(variables = {}) {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => {
    const value = variables[key];
    return value == null ? '' : (typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
  });
}

module.exports = { template, buildPrompt };


