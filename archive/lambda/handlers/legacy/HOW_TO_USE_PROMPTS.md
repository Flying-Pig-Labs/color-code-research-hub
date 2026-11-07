# How to Use the Text-Based Prompts

## Structure
```
/lambda/handlers/
├── prompts-txt/           # All prompts as .txt files
│   ├── metadata-extraction.txt
│   ├── metadata-improvement.txt
│   ├── simple-phase-generation.txt
│   ├── summary-generation.txt
│   └── format-report.txt
└── prompt-loader.js       # Simple loader utility
```

## Usage in Your Code

### Before (inline prompt):
```javascript
// In planGenerator.js
const prompt = `Analyze this README content and extract the following information in JSON format:
- title: Project title
...
README content:
${content}
Return only valid JSON, no additional text.`;
```

### After (using .txt files):
```javascript
// In planGenerator.js
const { buildPrompt } = require('./prompt-loader');

const prompt = buildPrompt('metadata-extraction', { 
  content: readmeContent 
});
```

## Example Migration

```javascript
// report-processing-service.js
const { buildPrompt } = require('../prompt-loader');

// Instead of inline SUMMARY_PROMPT
const summaryPrompt = buildPrompt('summary-generation', {
  content: reportContent
});

// Instead of inline FORMAT_REPORT_PROMPT  
const formatPrompt = buildPrompt('format-report', {
  content: rawReport
});
```

## Adding New Prompts

1. Create a new `.txt` file in `prompts-txt/`
2. Use `${variableName}` for placeholders
3. Call with `buildPrompt('filename-without-txt', { variableName: value })`

## Benefits

- ✅ Clean separation of prompts from code
- ✅ Easy to edit prompts without touching code
- ✅ Version control shows clear diffs for prompt changes
- ✅ Can easily swap prompt versions
- ✅ Simple to understand - just text files
- ✅ No complex build process needed