const test = require('node:test');
const assert = require('node:assert');

// Test just the extractJSON function without AWS dependencies
test('LLM Orchestrator extractJSON Tests', async (t) => {
  // Create a minimal orchestrator with just the extractJSON method
  const orchestrator = {
    extractJSON(content) {
      try {
        // First, try to parse the entire response as JSON
        try {
          const parsed = JSON.parse(content);
          // If it's a pure array, wrap it appropriately
          return Array.isArray(parsed) ? { phases: parsed } : parsed;
        } catch (e) {
          // Not pure JSON, continue with extraction
        }

        // Try to find JSON between code blocks
        const codeBlockMatch = content.match(/```(?:json)?\s*([\{\[][\s\S]*?[\}\]])\s*```/);
        if (codeBlockMatch) {
          // Clean up common formatting issues
          let cleanJson = codeBlockMatch[1]
            .replace(/\n\s*\n/g, '\n')  // Remove extra newlines
            .replace(/,\s*}/g, '}')     // Remove trailing commas in objects
            .replace(/,\s*]/g, ']');    // Remove trailing commas in arrays
          
          const parsed = JSON.parse(cleanJson);
          return Array.isArray(parsed) ? { phases: parsed } : parsed;
        }

        // Try to find raw JSON object
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          let cleanJson = jsonMatch[0]
            .replace(/\n\s*\n/g, '\n')
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']');
          
          return JSON.parse(cleanJson);
        }

        // Try to find array
        const arrayMatch = content.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          let cleanArray = arrayMatch[0]
            .replace(/\n\s*\n/g, '\n')
            .replace(/,\s*]/g, ']');
          
          const parsed = JSON.parse(cleanArray);
          return Array.isArray(parsed) ? { phases: parsed } : parsed;
        }

        throw new Error('No JSON found in response');
      } catch (error) {
        console.error('Failed to extract JSON:', error);
        console.error('Content sample:', content.substring(0, 200));
        throw error;
      }
    }
  };

  await t.test('handles various JSON formats', async () => {
    // Test pure JSON
    const pureJson = '{"phases": [{"id": "1", "title": "Phase 1"}]}';
    const result1 = orchestrator.extractJSON(pureJson);
    assert.deepStrictEqual(result1, { phases: [{ id: "1", title: "Phase 1" }] });

    // Test JSON in code block
    const codeBlockJson = '```json\n{\n  "phases": [\n    {"id": "1", "title": "Phase 1"}\n  ]\n}\n```';
    const result2 = orchestrator.extractJSON(codeBlockJson);
    assert.deepStrictEqual(result2, { phases: [{ id: "1", title: "Phase 1" }] });

    // Test JSON with trailing commas
    const trailingCommaJson = '```json\n{\n  "phases": [\n    {"id": "1", "title": "Phase 1"},\n  ],\n}\n```';
    const result3 = orchestrator.extractJSON(trailingCommaJson);
    assert.deepStrictEqual(result3, { phases: [{ id: "1", title: "Phase 1" }] });

    // Test pure array (should wrap in object)
    const pureArray = '[{"id": "1", "title": "Phase 1"}]';
    const result4 = orchestrator.extractJSON(pureArray);
    assert.deepStrictEqual(result4, { phases: [{ id: "1", title: "Phase 1" }] });

    // Test JSON with text around it
    const jsonWithText = 'Here is the result:\n{"title": "Test", "body": "Content"}\nThat was the JSON.';
    const result5 = orchestrator.extractJSON(jsonWithText);
    assert.deepStrictEqual(result5, { title: "Test", body: "Content" });

    // Test array in code block
    const arrayCodeBlock = '```json\n[\n  {"id": "task1", "title": "Task 1"},\n  {"id": "task2", "title": "Task 2"}\n]\n```';
    const result6 = orchestrator.extractJSON(arrayCodeBlock);
    assert.deepStrictEqual(result6, { phases: [{ id: "task1", title: "Task 1" }, { id: "task2", title: "Task 2" }] });

    // Test nested JSON with trailing commas
    const nestedJson = '```json\n{\n  "roles": ["Developer", "Designer",],\n  "tasks": [\n    {\n      "title": "Task 1",\n      "suggestedRole": "Developer",\n    },\n  ],\n}\n```';
    const result7 = orchestrator.extractJSON(nestedJson);
    assert.deepStrictEqual(result7, {
      roles: ["Developer", "Designer"],
      tasks: [{ title: "Task 1", suggestedRole: "Developer" }]
    });
  });

  await t.test('throws on invalid input', async () => {
    assert.throws(() => orchestrator.extractJSON('No JSON here'), {
      message: 'No JSON found in response'
    });

    assert.throws(() => orchestrator.extractJSON('{"invalid": json}'), {
      name: 'SyntaxError'
    });
  });

  await t.test('handles real-world Claude responses', async () => {
    // Test a realistic Claude response with markdown formatting
    const claudeResponse = `I'll help you generate the phases for this project. Here's the structured response:

\`\`\`json
{
  "phases": [
    {
      "id": "discovery",
      "title": "Discovery & Requirements Analysis",
      "description": "Analyze the existing codebase and define requirements",
    },
    {
      "id": "design",
      "title": "Technical Design & Architecture",
      "description": "Design the system architecture and API specifications",
    },
  ],
}
\`\`\`

These phases cover the main development lifecycle.`;

    const result = orchestrator.extractJSON(claudeResponse);
    assert.ok(result.phases);
    assert.strictEqual(result.phases.length, 2);
    assert.strictEqual(result.phases[0].id, "discovery");
    assert.strictEqual(result.phases[1].id, "design");
  });
});

// Test the rate limiting logic separately
test('Rate Limit Retry Logic', async (t) => {
  await t.test('implements exponential backoff correctly', async () => {
    const delays = [];
    let attempt = 0;

    // Simulate the retry logic
    const callWithRetry = async (retries = 3) => {
      for (let i = 0; i < retries; i++) {
        try {
          attempt++;
          if (attempt < 3) {
            throw { message: 'Too many requests', $metadata: { httpStatusCode: 429 } };
          }
          return 'success';
        } catch (error) {
          const isRateLimit = error.message?.includes('Too many requests') || 
                             error.message?.includes('rate limit') ||
                             error.$metadata?.httpStatusCode === 429;
          
          if (isRateLimit && i < retries - 1) {
            const waitTime = Math.pow(2, i + 1) * 1000;
            delays.push(waitTime);
            await new Promise(resolve => setTimeout(resolve, 10)); // Short delay for test
          } else {
            throw error;
          }
        }
      }
    };

    const result = await callWithRetry();
    assert.strictEqual(result, 'success');
    assert.deepStrictEqual(delays, [2000, 4000]); // 2^1 * 1000, 2^2 * 1000
  });
});