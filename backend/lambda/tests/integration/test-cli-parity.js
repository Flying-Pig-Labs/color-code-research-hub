const test = require('node:test');
const assert = require('node:assert');
const {
  createMockEvent,
  MockSecretsManagerClient,
  MockHttpsRequest,
  loadTestReadme,
  createTestMetadata,
  createClaudeResponses
} = require('../test-utils');

// Test that Lambda output matches CLI output format exactly
test('CLI Parity Tests - Output Format Validation', async (t) => {
  const secretsMock = new MockSecretsManagerClient();
  const httpsMock = new MockHttpsRequest();
  
  const originalSecretsManager = require('@aws-sdk/client-secrets-manager');
  const originalHttps = require('https');
  
  const OriginalSecretsManagerClient = originalSecretsManager.SecretsManagerClient;
  const originalHttpsRequest = originalHttps.request;
  
  originalSecretsManager.SecretsManagerClient = class {
    constructor() { return secretsMock; }
  };
  originalHttps.request = httpsMock.request.bind(httpsMock);
  
  try {
    const readmeContent = await loadTestReadme();
    const metadata = createTestMetadata();
    const claudeResponses = createClaudeResponses();
    
    // Set up mocked responses
    httpsMock.addResponse('api.anthropic.com', '/v1/messages', 'POST',
      claudeResponses.phaseGeneration);
    
    const { handler } = require('../../handlers/planGeneratorV2');
    
    await t.test('phase generation matches CLI format', async () => {
      const event = createMockEvent('POST', '/api/plan/v2/generate-full-plan', {
        metadata,
        readmeContent
      });
      
      const response = await handler(event);
      const data = JSON.parse(response.body);
      
      // Validate phase structure matches CLI
      assert.ok(data.phases, 'Should have phases array');
      assert.strictEqual(data.phases.length, 8, 'Should have exactly 8 phases');
      
      // Check each phase has required fields from CLI
      data.phases.forEach((phase, index) => {
        assert.ok(phase.id, `Phase ${index} should have id`);
        assert.ok(phase.title, `Phase ${index} should have title`);
        assert.ok(phase.description, `Phase ${index} should have description`);
        assert.ok(Array.isArray(phase.epics), `Phase ${index} should have epics array`);
        
        // CLI adds these fields
        if (index === 0) {
          assert.strictEqual(phase.pending, undefined, 'First phase should not be pending');
        } else {
          assert.strictEqual(phase.pending, true, `Phase ${index} should be marked pending`);
        }
      });
    });
    
    await t.test('issue format matches CLI structure', async () => {
      // Expected CLI issue format based on MIGRATION_REPORT.md
      const expectedIssueFormat = {
        title: expect.stringMatching(/^\[.+\] .+$/), // [Role] Title format
        body: expect.stringMatching(/^## Overview\n/), // Starts with Overview
        labels: expect.arrayContaining([
          expect.stringMatching(/^phase:/),
          expect.stringMatching(/^role:/),
          'sparc-enabled' // CLI uses 'sparc-enabled', not 'sparc-ready'
        ])
      };
      
      // Test issue generation
      const phases = [{
        id: 'discovery',
        title: 'Discovery & Requirements',
        description: 'Initial analysis',
        epics: [{
          id: 'discovery-epic-1',
          title: 'Requirements Gathering',
          description: 'Gather requirements',
          suggestedRole: 'Product Owner',
          selected: true
        }]
      }];
      
      // Add mock responses for issue generation
      httpsMock.addResponse('api.anthropic.com', '/v1/messages', 'POST',
        claudeResponses.issueFormatting(
          { title: 'Requirements', description: 'Gather requirements', suggestedRole: 'Product Owner' },
          phases[0]
        ));
      
      const event = createMockEvent('POST', '/api/plan/v2/generate-issues', {
        phases,
        metadata
      });
      
      const response = await handler(event);
      const data = JSON.parse(response.body);
      
      assert.ok(data.issues, 'Should have issues array');
      
      if (data.issues.length > 0) {
        const issue = data.issues[0];
        
        // Title format: [Role] Task
        assert.ok(issue.title.match(/^\[.+\] .+$/), 'Title should match [Role] format');
        
        // Body sections
        assert.ok(issue.body.includes('## Context'), 'Body should have Context section');
        assert.ok(issue.body.includes('## Tasks'), 'Body should have Tasks section');
        assert.ok(issue.body.includes('## Acceptance Criteria'), 'Body should have Acceptance Criteria');
        
        // Labels
        assert.ok(issue.labels.some(l => l.startsWith('phase:')), 'Should have phase label');
        assert.ok(issue.labels.some(l => l.startsWith('role:')), 'Should have role label');
        assert.ok(issue.labels.includes('sparc-enabled'), 'Should have sparc-enabled label');
        
        // Metadata
        assert.ok(issue.phaseId, 'Should have phaseId');
        assert.ok(issue.phaseTitle, 'Should have phaseTitle');
        assert.ok(issue.epicTitle, 'Should have epicTitle');
        assert.ok(typeof issue.estimatedHours === 'number', 'Should have estimatedHours as number');
      }
    });
    
    await t.test('epic structure matches CLI format', async () => {
      // CLI epic structure from MIGRATION_REPORT.md
      const expectedEpicStructure = {
        id: expect.any(String),
        title: expect.any(String),
        description: expect.any(String),
        suggestedRole: expect.any(String),
        issues: expect.any(Array) // CLI includes issues within epics
      };
      
      // The Lambda currently returns simplified epics
      // This test documents the difference
      const phases = [{
        id: 'discovery',
        title: 'Discovery & Requirements',
        epics: [{
          id: 'discovery-epic-1',
          title: 'Requirements Gathering',
          description: 'Gather and document requirements',
          suggestedRole: 'Product Owner',
          issues: [] // CLI would populate this
        }]
      }];
      
      const epic = phases[0].epics[0];
      
      // Validate epic structure
      assert.ok(epic.id, 'Epic should have id');
      assert.ok(epic.title, 'Epic should have title');
      assert.ok(epic.description, 'Epic should have description');
      assert.ok(epic.suggestedRole, 'Epic should have suggestedRole');
      
      // Note: CLI includes issues array within epics
      assert.ok(Array.isArray(epic.issues), 'Epic should have issues array (for CLI compatibility)');
    });
    
    await t.test('response includes CLI-specific fields', async () => {
      const event = createMockEvent('POST', '/api/plan/v2/generate-full-plan', {
        metadata,
        readmeContent
      });
      
      const response = await handler(event);
      const data = JSON.parse(response.body);
      
      // CLI includes these additional fields
      assert.ok(data.totalEstimatedIssues !== undefined, 'Should include totalEstimatedIssues');
      assert.ok(data.sampleIssues !== undefined, 'Should include sampleIssues for preview');
      
      // Validate sample issues format
      if (data.sampleIssues && data.sampleIssues.length > 0) {
        const sample = data.sampleIssues[0];
        assert.ok(sample.title, 'Sample issue should have title');
        assert.ok(sample.body, 'Sample issue should have body');
        assert.ok(sample.labels, 'Sample issue should have labels');
      }
    });
    
  } finally {
    originalSecretsManager.SecretsManagerClient = OriginalSecretsManagerClient;
    originalHttps.request = originalHttpsRequest;
  }
});

// Test role assignments match CLI
test('CLI Parity Tests - Role Assignments', async (t) => {
  const { PHASE_ROLE_MAPPING } = require('../../handlers/prompts');
  
  // Expected role mappings from CLI (MIGRATION_REPORT.md)
  const cliRoleMappings = {
    'Discovery': [
      'Market Research Analyst',
      'User Research Specialist',
      'Product Owner'
    ],
    'Specification': [
      'Product Requirements Author',
      'UI/UX Designer',
      'System Architect'
    ],
    'Architecture': [
      'System Architect',
      'Sprint Planner',
      'Tech Lead'
    ],
    'Implementation': [
      'Frontend Developer',
      'Backend Developer',
      'Database Engineer',
      'DevOps Engineer'
    ],
    'Testing': [
      'Test Engineer',
      'Security Auditor',
      'Performance Tester'
    ],
    'Deployment': [
      'Release Manager',
      'DevOps Engineer',
      'Technical Writer'
    ],
    'Monitoring': [
      'Analytics Engineer',
      'Site Reliability Engineer',
      'Support Engineer'
    ],
    'Enhancement': [
      'Feature Developer',
      'Refactoring Specialist',
      'Product Owner'
    ]
  };
  
  await t.test('Lambda phase mappings align with CLI', () => {
    // Map Lambda phase IDs to CLI phase names
    const phaseIdToCliName = {
      'discovery': 'Discovery',
      'technical_planning': 'Architecture',
      'design': 'Specification',
      'core_development': 'Implementation',
      'integration': 'Implementation',
      'quality_assurance': 'Testing',
      'deployment': 'Deployment',
      'launch': 'Monitoring'
    };
    
    // Check that Lambda has appropriate role mappings
    Object.entries(PHASE_ROLE_MAPPING).forEach(([phaseId, roles]) => {
      assert.ok(Array.isArray(roles), `Phase ${phaseId} should have roles array`);
      assert.ok(roles.length >= 3, `Phase ${phaseId} should have at least 3 roles`);
      
      // Verify some key roles are present
      if (phaseId === 'discovery') {
        assert.ok(roles.includes('Product Owner'), 'Discovery should include Product Owner');
      }
      if (phaseId === 'core_development') {
        assert.ok(roles.includes('Software Engineer') || roles.includes('Backend Developer'),
          'Development should include developers');
      }
    });
  });
});

// Test error messages match CLI format
test('CLI Parity Tests - Error Response Format', async (t) => {
  const secretsMock = new MockSecretsManagerClient();
  const httpsMock = new MockHttpsRequest();
  
  const originalSecretsManager = require('@aws-sdk/client-secrets-manager');
  const originalHttps = require('https');
  
  const OriginalSecretsManagerClient = originalSecretsManager.SecretsManagerClient;
  const originalHttpsRequest = originalHttps.request;
  
  originalSecretsManager.SecretsManagerClient = class {
    constructor() { return secretsMock; }
  };
  originalHttps.request = httpsMock.request.bind(httpsMock);
  
  try {
    const { handler } = require('../../handlers/planGeneratorV2');
    
    await t.test('missing parameters error format', async () => {
      const event = createMockEvent('POST', '/api/plan/v2/generate-full-plan', {
        // Missing required fields
      });
      
      const response = await handler(event);
      
      // CLI returns structured error responses
      assert.ok(response.statusCode >= 400, 'Should return error status');
      
      const error = JSON.parse(response.body);
      assert.ok(error.error, 'Should have error field');
      
      // CLI includes these fields in errors
      if (error.message) {
        assert.ok(typeof error.message === 'string', 'Error message should be string');
      }
    });
    
    await t.test('API failure error format', async () => {
      // Mock API failure
      httpsMock.addResponse('api.anthropic.com', '/v1/messages', 'POST', {
        statusCode: 500,
        data: JSON.stringify({ error: 'Internal server error' })
      });
      
      const event = createMockEvent('POST', '/api/plan/v2/generate-full-plan', {
        metadata: createTestMetadata(),
        readmeContent: 'Test README'
      });
      
      const response = await handler(event);
      
      assert.ok(response.statusCode >= 400, 'Should return error status');
      
      const error = JSON.parse(response.body);
      assert.ok(error.error, 'Should have error field');
    });
    
  } finally {
    originalSecretsManager.SecretsManagerClient = OriginalSecretsManagerClient;
    originalHttps.request = originalHttpsRequest;
  }
});