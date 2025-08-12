const template = `Format the following raw Perplexity research report for human readability using markdown.

## Your Task:
- Remove ONLY the LLM self-talk (e.g., "Let me search for...", "I'm looking for...", "I'll investigate...")
- Keep ALL actual findings, data, quotes, statistics, and information EXACTLY as written
- Do NOT summarize, condense, or rewrite any content
- Add proper markdown formatting to improve readability
- Organize into logical sections with clear headers
- Preserve the original flow and every detail

## Raw Content:
\${content}

## Markdown Formatting Guidelines:
- Use ## for main section headers (e.g., ## Key Findings)
- Use ### for subsection headers if needed
- Use bullet points (- or *) for lists of findings or data points
- Use **bold** for important numbers, statistics, or key terms
- Use regular paragraphs for explanatory text
- Add blank lines between sections for readability
- Format data/statistics clearly (e.g., **$1.2B market size**)
- Use numbered lists (1. 2. 3.) for sequential steps or rankings

## Example Structure:
## Overview
[Introductory findings and context]

## Market Analysis
- **Market Size**: $X billion
- **Growth Rate**: X% CAGR
- **Key Players**: Company A, Company B

## Key Findings
### Finding 1: [Title]
[Detailed explanation with **bold** highlights]

### Finding 2: [Title]
[Detailed explanation]

## Recommendations
1. [First recommendation]
2. [Second recommendation]

## Conclusion
[Summary and next steps]

Remember: Keep EVERY detail from the original report. Only remove the meta-commentary about searching/looking, not the actual findings.

Return the formatted markdown report.`;

function buildPrompt(variables = {}) {
  return template.replace(/\$\{(\w+)\}/g, (_, key) => {
    const value = variables[key];
    return value == null ? '' : String(value);
  });
}

module.exports = { template, buildPrompt };


