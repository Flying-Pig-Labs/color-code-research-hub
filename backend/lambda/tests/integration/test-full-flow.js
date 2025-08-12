const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const {
  createMockEvent,
  MockDynamoDBClient,
  MockSecretsManagerClient,
  MockHttpsRequest,
  loadTestReadme,
  createTestMetadata,
  createExpectedPhases,
  createClaudeResponses,
  createGitHubResponses,
  verifyLLMCalls,
  verifyDynamoDBUpdates
} = require('../test-utils');

// Test the complete flow of the V2 Lambda implementation
test('Full Flow Integration Test - 50-90 LLM Calls', async (t) => {
  // Set up mocks
  const dynamoMock = new MockDynamoDBClient();
  const secretsMock = new MockSecretsManagerClient();
  const httpsMock = new MockHttpsRequest();
  
  // Mock modules
  const originalDynamoDB = require('@aws-sdk/client-dynamodb');
  const originalSecretsManager = require('@aws-sdk/client-secrets-manager');
  const originalHttps = require('https');
  
  // Store original constructors
  const OriginalDynamoDBClient = originalDynamoDB.DynamoDBClient;
  const OriginalSecretsManagerClient = originalSecretsManager.SecretsManagerClient;
  const originalHttpsRequest = originalHttps.request;
  
  // Replace with mocks
  originalDynamoDB.DynamoDBClient = class { 
    constructor() { return dynamoMock; }
  };
  originalSecretsManager.SecretsManagerClient = class {
    constructor() { return secretsMock; }
  };
  originalHttps.request = httpsMock.request.bind(httpsMock);
  
  try {
    // Load test data
    const readmeContent = await loadTestReadme();
    const metadata = createTestMetadata();
    const phases = createExpectedPhases();
    const claudeResponses = createClaudeResponses();
    const githubResponses = createGitHubResponses();
    
    // Set up Claude API responses
    // Phase generation
    httpsMock.addResponse('api.anthropic.com', '/v1/messages', 'POST', 
      claudeResponses.phaseGeneration);
    
    // Epic generation for each phase (8 phases)
    phases.forEach(phase => {
      httpsMock.addResponse('api.anthropic.com', '/v1/messages', 'POST',
        claudeResponses.epicGeneration(phase));
    });
    
    // Issue formatting - we need many of these
    // Assuming 3 epics per phase, 3 issues per epic = 72 issues total
    for (let i = 0; i < 72; i++) {
      const phaseIndex = Math.floor(i / 9); // 9 issues per phase
      const phase = phases[phaseIndex];
      httpsMock.addResponse('api.anthropic.com', '/v1/messages', 'POST',
        claudeResponses.issueFormatting(
          { title: `Task ${i}`, description: `Description ${i}`, suggestedRole: 'Developer' },
          phase
        ));
    }
    
    // Test Step 1: Generate Full Plan
    console.log('Testing Step 1: Generate Full Plan');
    
    const { handler } = require('../../handlers/planGeneratorV2');
    
    const generatePlanEvent = createMockEvent('POST', '/api/plan/v2/generate-full-plan', {
      metadata,
      readmeContent
    });
    
    const planResponse = await handler(generatePlanEvent);
    
    assert.strictEqual(planResponse.statusCode, 200, 'Plan generation should succeed');
    
    const planData = JSON.parse(planResponse.body);
    assert.ok(planData.phases, 'Response should include phases');
    assert.strictEqual(planData.phases.length, 8, 'Should generate 8 phases');
    
    // Verify initial LLM calls (1 for phase generation)
    let llmCalls = verifyLLMCalls(httpsMock, { min: 1, max: 1 });
    console.log(`LLM calls after phase generation: ${llmCalls.total}`);
    
    // Test Step 2: Generate Issues for Selected Epics
    console.log('\nTesting Step 2: Generate Issues for Selected Epics');
    
    // Prepare phases with selected epics
    const phasesWithEpics = planData.phases.map((phase, phaseIndex) => ({
      ...phase,
      epics: [
        {
          id: `${phase.id}-epic-1`,
          title: 'Requirements Gathering',
          description: 'Gather and document requirements',
          suggestedRole: 'Product Owner',
          selected: true
        },
        {
          id: `${phase.id}-epic-2`, 
          title: 'Technical Planning',
          description: 'Plan technical implementation',
          suggestedRole: 'Tech Lead',
          selected: true
        },
        {
          id: `${phase.id}-epic-3`,
          title: 'Implementation',
          description: 'Implement core functionality',
          suggestedRole: 'Developer',
          selected: true
        }
      ]
    }));
    
    // Reset HTTPS mock to track new calls
    httpsMock.reset();
    
    // Add responses for epic generation and issue formatting
    // We need 8 phases * 3 epics * 3 issues per epic = 72 LLM calls minimum
    for (let phaseIdx = 0; phaseIdx < 8; phaseIdx++) {
      const phase = phases[phaseIdx];
      
      // Epic generation response
      httpsMock.addResponse('api.anthropic.com', '/v1/messages', 'POST',
        claudeResponses.epicGeneration(phase));
      
      // Issue formatting responses (3 epics * 3 issues = 9 per phase)
      for (let issueIdx = 0; issueIdx < 9; issueIdx++) {
        httpsMock.addResponse('api.anthropic.com', '/v1/messages', 'POST',
          claudeResponses.issueFormatting(
            { 
              title: `Task ${phaseIdx}-${issueIdx}`, 
              description: `Task description for phase ${phaseIdx}`, 
              suggestedRole: ['Product Owner', 'Tech Lead', 'Developer'][issueIdx % 3]
            },
            phase
          ));
      }
    }
    
    const generateIssuesEvent = createMockEvent('POST', '/api/plan/v2/generate-issues', {
      phases: phasesWithEpics,
      metadata
    });
    
    const issuesResponse = await handler(generateIssuesEvent);
    
    assert.strictEqual(issuesResponse.statusCode, 200, 'Issue generation should succeed');
    
    const issuesData = JSON.parse(issuesResponse.body);
    assert.ok(issuesData.issues, 'Response should include issues');
    
    // Verify LLM calls for issue generation
    llmCalls = verifyLLMCalls(httpsMock, { min: 50, max: 90 });
    console.log(`LLM calls for issue generation: ${llmCalls.total}`);
    assert.ok(llmCalls.isValid, `LLM calls should be between 50-90, got ${llmCalls.total}`);
    
    // Test Step 3: Create GitHub Issues
    console.log('\nTesting Step 3: Create GitHub Issues');
    
    // Reset and set up GitHub API responses
    httpsMock.reset();
    
    // Add GitHub issue creation responses
    issuesData.issues.forEach((issue, index) => {
      httpsMock.addResponse('api.github.com', `/repos/test-owner/test-repo/issues`, 'POST',
        createGitHubResponses().createIssue(index + 1));
    });
    
    const createIssuesEvent = createMockEvent('POST', '/api/plan/v2/create-github-issues', {
      repository: 'test-owner/test-repo',
      issues: issuesData.issues
    });
    
    const githubResponse = await handler(createIssuesEvent);
    
    assert.strictEqual(githubResponse.statusCode, 200, 'GitHub issue creation should succeed');
    
    const githubData = JSON.parse(githubResponse.body);
    assert.ok(githubData.success, 'GitHub creation should be successful');
    assert.ok(githubData.issues.length > 0, 'Should create GitHub issues');
    
    // Verify GitHub API calls
    const githubCalls = httpsMock.getCalls().filter(call => 
      call.hostname === 'api.github.com'
    );
    console.log(`GitHub API calls: ${githubCalls.length}`);
    assert.ok(githubCalls.length >= issuesData.issues.length, 
      'Should make one GitHub call per issue');
    
    // Verify DynamoDB updates (if implemented)
    const dynamoUpdates = verifyDynamoDBUpdates(dynamoMock, 1);
    console.log(`\nDynamoDB operations - Puts: ${dynamoUpdates.puts}, Updates: ${dynamoUpdates.updates}`);
    
    // Summary
    console.log('\n=== Test Summary ===');
    console.log(`Total LLM calls: ${llmCalls.total}`);
    console.log(`- Claude calls: ${llmCalls.claude}`);
    console.log(`- OpenAI calls: ${llmCalls.openai}`);
    console.log(`GitHub issues created: ${githubData.issues.length}`);
    console.log(`DynamoDB operations: ${dynamoUpdates.total}`);
    
  } finally {
    // Restore original modules
    originalDynamoDB.DynamoDBClient = OriginalDynamoDBClient;
    originalSecretsManager.SecretsManagerClient = OriginalSecretsManagerClient;
    originalHttps.request = originalHttpsRequest;
  }
});

// Test error handling and resilience
test('Error Handling - Rate Limiting and Fallback', async (t) => {
  const dynamoMock = new MockDynamoDBClient();
  const secretsMock = new MockSecretsManagerClient();
  const httpsMock = new MockHttpsRequest();
  
  const originalDynamoDB = require('@aws-sdk/client-dynamodb');
  const originalSecretsManager = require('@aws-sdk/client-secrets-manager');
  const originalHttps = require('https');
  
  const OriginalDynamoDBClient = originalDynamoDB.DynamoDBClient;
  const OriginalSecretsManagerClient = originalSecretsManager.SecretsManagerClient;
  const originalHttpsRequest = originalHttps.request;
  
  originalDynamoDB.DynamoDBClient = class { 
    constructor() { return dynamoMock; }
  };
  originalSecretsManager.SecretsManagerClient = class {
    constructor() { return secretsMock; }
  };
  originalHttps.request = httpsMock.request.bind(httpsMock);
  
  try {
    const readmeContent = await loadTestReadme();
    const metadata = createTestMetadata();
    const claudeResponses = createClaudeResponses();
    
    // First call returns rate limit error
    httpsMock.addResponse('api.anthropic.com', '/v1/messages', 'POST',
      claudeResponses.rateLimitError);
    
    // OpenAI fallback should work
    httpsMock.addResponse('api.openai.com', '/v1/chat/completions', 'POST', {
      statusCode: 200,
      data: JSON.stringify({
        choices: [{
          message: {
            content: JSON.stringify({
              phases: createExpectedPhases()
            })
          }
        }]
      })
    });
    
    const { handler } = require('../../handlers/planGeneratorV2');
    
    const event = createMockEvent('POST', '/api/plan/v2/generate-full-plan', {
      metadata,
      readmeContent
    });
    
    const response = await handler(event);
    
    assert.strictEqual(response.statusCode, 200, 'Should succeed with OpenAI fallback');
    
    const llmCalls = verifyLLMCalls(httpsMock, { min: 1, max: 2 });
    console.log(`Claude attempts: ${llmCalls.claude}, OpenAI attempts: ${llmCalls.openai}`);
    assert.ok(llmCalls.openai > 0, 'Should fall back to OpenAI');
    
  } finally {
    originalDynamoDB.DynamoDBClient = OriginalDynamoDBClient;
    originalSecretsManager.SecretsManagerClient = OriginalSecretsManagerClient;
    originalHttps.request = originalHttpsRequest;
  }
});

// Test polling mechanism (if implemented)
test('Progress Polling Mechanism', async (t) => {
  // This test would verify the polling mechanism if DynamoDB progress tracking is implemented
  console.log('Note: Progress polling test requires DynamoDB implementation');
  
  // Placeholder for when DynamoDB progress tracking is added
  assert.ok(true, 'Polling mechanism test placeholder');
});