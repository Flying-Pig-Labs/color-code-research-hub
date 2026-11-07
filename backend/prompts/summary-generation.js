const template = `Create a concise 120-word executive summary of the following research report.

Focus on the key findings, implications, and actionable insights.
Write for C-level executives who need quick understanding.

## Research Content:
\${content}

## Requirements:
- Exactly 120 words (acceptable range: 110-130 words)
- Clear and compelling
- Focus on what matters most
- No fluff or filler

Return ONLY the summary text, no JSON, no formatting, just the 120-word summary.`;

function buildPrompt(variables = {}) {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => {
    const value = variables[key];
    return value == null ? '' : String(value);
  });
}

module.exports = { template, buildPrompt };


