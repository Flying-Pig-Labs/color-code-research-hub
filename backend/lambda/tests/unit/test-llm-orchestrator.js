const test = require('node:test');
const assert = require('node:assert');

// Test the LLMOrchestrator service
test('LLM Orchestrator Tests', async (t) => {
  // Mock BedrockRuntimeClient
  const mockBedrock = {
    send: async () => {
      throw new Error('Should be mocked in tests');
    }
  };

  // Mock the module dependencies
  const originalRequire = require;
  require.cache = {};
  
  // Override require to inject mocks
  require = (path) => {
    if (path === '@aws-sdk/client-bedrock-runtime') {
      return {
        BedrockRuntimeClient: class MockBedrock {
          constructor() {
            // Don't try to load credentials
          }
          send(command) {
            return mockBedrock.send(command);
          }
        },
        InvokeModelCommand: class MockCommand {
          constructor(params) {
            this.params = params;
          }
        }
      };
    }
    return originalRequire(path);
  };

  // Load the service with mocks
  const { LLMOrchestrator } = require('../../handlers/services/llm-orchestrator-service.js');
  const orchestrator = new LLMOrchestrator();

  await t.test('extractJSON handles various JSON formats', async () => {
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
  });

  await t.test('extractJSON throws on invalid input', async () => {
    assert.throws(() => orchestrator.extractJSON('No JSON here'), {
      message: 'No JSON found in response'
    });

    assert.throws(() => orchestrator.extractJSON('{"invalid": json}'), {
      name: 'SyntaxError'
    });
  });

  await t.test('callClaude retries on rate limit', async () => {
    let callCount = 0;
    const startTime = Date.now();

    // Mock Bedrock to simulate rate limit then success
    mockBedrock.send = async () => {
      callCount++;
      if (callCount < 3) {
        const error = new Error('Too many requests, please wait before trying again.');
        error.$metadata = { httpStatusCode: 429 };
        throw error;
      }
      return {
        body: new TextEncoder().encode(JSON.stringify({
          completion: '{"phases": [{"id": "1", "title": "Success"}]}'
        }))
      };
    };

    const result = await orchestrator.callClaude('test prompt');
    const elapsed = Date.now() - startTime;

    // Should have retried twice (2s + 4s = 6s minimum)
    assert.strictEqual(callCount, 3);
    assert.ok(elapsed >= 6000, `Expected at least 6000ms, got ${elapsed}ms`);
    assert.strictEqual(result, '{"phases": [{"id": "1", "title": "Success"}]}');
  });

  await t.test('callClaude throws after max retries', async () => {
    let callCount = 0;

    // Mock Bedrock to always fail with rate limit
    mockBedrock.send = async () => {
      callCount++;
      const error = new Error('Too many requests');
      error.$metadata = { httpStatusCode: 429 };
      throw error;
    };

    await assert.rejects(
      orchestrator.callClaude('test prompt', 2), // Only 2 retries
      {
        message: 'Too many requests'
      }
    );

    assert.strictEqual(callCount, 2); // Initial + 1 retry
  });

  await t.test('callClaude does not retry on non-rate-limit errors', async () => {
    let callCount = 0;

    // Mock Bedrock to fail with different error
    mockBedrock.send = async () => {
      callCount++;
      throw new Error('Invalid request');
    };

    await assert.rejects(
      orchestrator.callClaude('test prompt'),
      {
        message: 'Invalid request'
      }
    );

    assert.strictEqual(callCount, 1); // No retries
  });

  // Restore original require
  require = originalRequire;
});

// Test integration with prompts
test('LLM Orchestrator Integration Tests', async (t) => {
  await t.test('generateProjectPlan handles complete flow', async () => {
    const mockResponses = {
      phases: `\`\`\`json
{
  "phases": [
    {
      "id": "discovery",
      "title": "Discovery & Requirements",
      "description": "Initial phase"
    }
  ]
}
\`\`\``,
      epics: `{
  "roles": ["Product Owner", "Developer"],
  "tasks": [
    {
      "title": "Task 1",
      "description": "Description 1",
      "suggestedRole": "Developer"
    }
  ]
}`,
      issue: `{
  "title": "Implement Task 1",
  "body": "Detailed description for GitHub issue"
}`
    };

    let callIndex = 0;
    const responses = [
      mockResponses.phases,
      mockResponses.epics,
      mockResponses.issue
    ];

    // Mock Bedrock responses
    const mockBedrock = {
      send: async () => ({
        body: new TextEncoder().encode(JSON.stringify({
          completion: responses[callIndex++ % responses.length]
        }))
      })
    };

    // Override require for this test
    const originalRequire = require;
    require.cache = {};
    
    require = (path) => {
      if (path === '@aws-sdk/client-bedrock-runtime') {
        return {
          BedrockRuntimeClient: class MockBedrock {
            send(command) {
              return mockBedrock.send(command);
            }
          },
          InvokeModelCommand: class MockCommand {
            constructor(params) {
              this.params = params;
            }
          }
        };
      }
      return originalRequire(path);
    };

    const { generateProjectPlan } = require('../../handlers/services/llm-orchestrator-service.js');
    
    const projectInfo = {
      title: 'Test Project',
      description: 'Test Description',
      domain: 'general'
    };
    
    const result = await generateProjectPlan(projectInfo, '# Test README');
    
    // Verify structure
    assert.ok(result.summary);
    assert.strictEqual(result.summary.title, 'Test Project');
    assert.ok(result.phases);
    assert.ok(Array.isArray(result.phases));
    assert.ok(result.phases.length > 0);
    assert.ok(result.phases[0].issues);
    
    // Restore require
    require = originalRequire;
  });
});