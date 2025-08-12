const template = `Analyze this README content and extract the following information in JSON format:
- title: Project title
- description: Brief description (max 200 chars)
- domain: One of [e-commerce, social-media, productivity, healthcare, education, finance, entertainment, devtools, iot, general]
- userTypes: Array of target user types
- techStack: Array of technologies mentioned
- features: Array of key features (max 5)
- complexity: One of [simple, moderate, complex]

README content:
\${content}

Return only valid JSON, no additional text.`;

function buildPrompt(variables = {}) {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => {
    const value = variables[key];
    return value == null ? '' : String(value);
  });
}

module.exports = { template, buildPrompt };


