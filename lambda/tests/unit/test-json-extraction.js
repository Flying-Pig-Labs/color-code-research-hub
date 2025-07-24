const test = require('node:test');
const assert = require('node:assert');

// Test JSON extraction logic from planGeneratorV2.js
test('JSON Extraction Tests', async (t) => {
  // Extract the extractJSON function for testing
  const extractJSON = (response) => {
    // First, try to parse the entire response as JSON
    try {
      return JSON.parse(response);
    } catch (e) {
      // Not pure JSON, continue with extraction
    }
    
    // Try to find JSON object in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        // Clean up common formatting issues
        let cleanJson = jsonMatch[0]
          .replace(/\n\s*\n/g, '\n') // Remove extra newlines
          .replace(/,\s*}/, '}')     // Remove trailing commas
          .replace(/,\s*]/, ']');    // Remove trailing commas in arrays
        
        return JSON.parse(cleanJson);
      } catch (e) {
        console.error('Failed to parse JSON object:', e);
        console.error('Raw match:', jsonMatch[0].substring(0, 200));
      }
    }
    
    // Try array format
    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        let cleanArray = arrayMatch[0]
          .replace(/\n\s*\n/g, '\n')
          .replace(/,\s*]/, ']');
        
        const parsed = JSON.parse(cleanArray);
        // If it's an array, wrap it in an object
        return Array.isArray(parsed) ? { phases: parsed } : parsed;
      } catch (e) {
        console.error('Failed to parse array:', e);
        console.error('Raw match:', arrayMatch[0].substring(0, 200));
      }
    }
    
    // Try to extract structured data even if not perfect JSON
    console.error('Could not parse response as JSON, raw response:', response.substring(0, 500));
    throw new Error('Could not extract valid JSON from response');
  };
  
  await t.test('extracts pure JSON', () => {
    const response = '{"phases": [{"id": "test", "title": "Test Phase"}]}';
    const result = extractJSON(response);
    assert.deepStrictEqual(result, {
      phases: [{ id: "test", title: "Test Phase" }]
    });
  });
  
  await t.test('extracts JSON from text with markdown', () => {
    const response = `Here is the JSON response:
\`\`\`json
{
  "phases": [
    {
      "id": "discovery",
      "title": "Discovery & Requirements"
    }
  ]
}
\`\`\``;
    const result = extractJSON(response);
    assert.deepStrictEqual(result, {
      phases: [{ id: "discovery", title: "Discovery & Requirements" }]
    });
  });
  
  await t.test('handles trailing commas', () => {
    const response = `{
      "phases": [
        {
          "id": "test",
          "title": "Test",
        },
      ],
    }`;
    const result = extractJSON(response);
    assert.deepStrictEqual(result, {
      phases: [{ id: "test", title: "Test" }]
    });
  });
  
  await t.test('extracts array and wraps in object', () => {
    const response = `[
      {"id": "phase1", "title": "Phase 1"},
      {"id": "phase2", "title": "Phase 2"}
    ]`;
    const result = extractJSON(response);
    assert.deepStrictEqual(result, {
      phases: [
        { id: "phase1", title: "Phase 1" },
        { id: "phase2", title: "Phase 2" }
      ]
    });
  });
  
  await t.test('handles complex nested JSON', () => {
    const response = `The analysis results are:
    
    {
      "phases": [
        {
          "id": "discovery",
          "title": "Discovery & Requirements",
          "description": "Initial project analysis",
          "suggestedRoles": ["Product Owner", "UX Researcher"]
        }
      ],
      "metadata": {
        "totalPhases": 1,
        "estimatedDuration": "2 weeks"
      }
    }
    
    This represents the project structure.`;
    
    const result = extractJSON(response);
    assert.ok(result.phases);
    assert.strictEqual(result.phases.length, 1);
    assert.strictEqual(result.phases[0].id, "discovery");
    assert.ok(result.metadata);
  });
  
  await t.test('throws error for invalid JSON', () => {
    const response = 'This is not JSON at all';
    assert.throws(() => extractJSON(response), {
      message: 'Could not extract valid JSON from response'
    });
  });
});

// Test prompt building
test('Prompt Building Tests', async (t) => {
  const buildPrompt = (template, variables) => {
    let prompt = template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
    }
    return prompt;
  };
  
  await t.test('replaces single variable', () => {
    const template = 'Hello {name}!';
    const result = buildPrompt(template, { name: 'World' });
    assert.strictEqual(result, 'Hello World!');
  });
  
  await t.test('replaces multiple variables', () => {
    const template = 'Phase: {phaseTitle}\nDescription: {phaseDescription}';
    const result = buildPrompt(template, {
      phaseTitle: 'Discovery',
      phaseDescription: 'Initial analysis'
    });
    assert.strictEqual(result, 'Phase: Discovery\nDescription: Initial analysis');
  });
  
  await t.test('replaces same variable multiple times', () => {
    const template = '{domain} is the domain. We focus on {domain} projects.';
    const result = buildPrompt(template, { domain: 'enterprise' });
    assert.strictEqual(result, 'enterprise is the domain. We focus on enterprise projects.');
  });
  
  await t.test('handles missing variables', () => {
    const template = 'Hello {name}! Welcome to {place}.';
    const result = buildPrompt(template, { name: 'User' });
    assert.strictEqual(result, 'Hello User! Welcome to {place}.');
  });
});