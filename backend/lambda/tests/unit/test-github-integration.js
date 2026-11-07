const test = require('node:test');
const assert = require('node:assert');
const { MockHttpsRequest, createGitHubResponses } = require('../test-utils');

test('GitHub Issue Creation Tests', async (t) => {
  await t.test('formats issue labels correctly', () => {
    const sanitizeLabel = (label) => {
      return label.toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
    };
    
    assert.strictEqual(sanitizeLabel('phase:Discovery & Requirements'), 'phase-discovery-requirements');
    assert.strictEqual(sanitizeLabel('role:Product Owner'), 'role-product-owner');
    assert.strictEqual(sanitizeLabel('SPARC-Ready!!!'), 'sparc-ready');
    assert.strictEqual(sanitizeLabel('  Spaced   Label  '), 'spaced-label');
  });
  
  await t.test('creates issue with correct structure', () => {
    const issue = {
      title: '[Product Owner] Define project requirements',
      body: `## Context
This issue is for defining initial project requirements.

## Role
Product Owner

## Phase
Discovery & Requirements

## Tasks
- [ ] Interview stakeholders
- [ ] Document requirements
- [ ] Get approval

## Acceptance Criteria
- All requirements documented
- Stakeholder approval received`,
      labels: ['phase:discovery', 'role:product-owner', 'sparc-enabled']
    };
    
    // Validate issue structure
    assert.ok(issue.title.includes('[Product Owner]'));
    assert.ok(issue.body.includes('## Context'));
    assert.ok(issue.body.includes('## Role'));
    assert.ok(issue.body.includes('## Phase'));
    assert.ok(issue.body.includes('## Tasks'));
    assert.ok(issue.body.includes('## Acceptance Criteria'));
    assert.ok(issue.labels.includes('sparc-enabled'));
  });
  
  await t.test('handles GitHub API rate limiting', async () => {
    const httpsMock = new MockHttpsRequest();
    const githubResponses = createGitHubResponses();
    
    // First call returns rate limit error
    httpsMock.addResponse('api.github.com', '/repos/test-owner/test-repo/issues', 'POST',
      githubResponses.rateLimitError);
    
    // Simulate the request
    const issueData = JSON.stringify({
      title: 'Test Issue',
      body: 'Test Body',
      labels: ['test']
    });
    
    let errorCaught = false;
    
    try {
      await new Promise((resolve, reject) => {
        const req = httpsMock.request({
          hostname: 'api.github.com',
          path: '/repos/test-owner/test-repo/issues',
          method: 'POST',
          headers: {
            'Authorization': 'token test-token',
            'Content-Type': 'application/json'
          }
        }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 403) {
              reject(new Error('Rate limit exceeded'));
            } else {
              resolve(JSON.parse(data));
            }
          });
        });
        
        req.write(issueData);
        req.end();
      });
    } catch (error) {
      errorCaught = true;
      assert.strictEqual(error.message, 'Rate limit exceeded');
    }
    
    assert.ok(errorCaught, 'Should catch rate limit error');
  });
  
  await t.test('batches issue creation correctly', () => {
    // Test that issues are created with delays to avoid rate limiting
    const delays = [];
    let lastTime = Date.now();
    
    // Simulate batch processing with delays
    for (let i = 0; i < 5; i++) {
      const currentTime = Date.now();
      delays.push(currentTime - lastTime);
      lastTime = currentTime;
      
      // Simulate 100ms delay between issues
      if (i < 4) {
        const start = Date.now();
        while (Date.now() - start < 100) {
          // Busy wait
        }
      }
    }
    
    // First delay will be 0, others should be ~100ms
    delays.slice(1).forEach(delay => {
      assert.ok(delay >= 90, `Delay should be at least 90ms, got ${delay}ms`);
    });
  });
});

test('Repository Parsing Tests', async (t) => {
  await t.test('parses repository format correctly', () => {
    const parseRepo = (repository) => {
      const [owner, repo] = repository.split('/');
      return { owner, repo };
    };
    
    const result = parseRepo('test-owner/test-repo');
    assert.strictEqual(result.owner, 'test-owner');
    assert.strictEqual(result.repo, 'test-repo');
  });
  
  await t.test('validates repository format', () => {
    const isValidRepo = (repository) => {
      if (!repository || typeof repository !== 'string') return false;
      const parts = repository.split('/');
      return parts.length === 2 && parts[0].length > 0 && parts[1].length > 0;
    };
    
    assert.ok(isValidRepo('owner/repo'));
    assert.ok(isValidRepo('my-org/my-project'));
    assert.ok(!isValidRepo('invalid-format'));
    assert.ok(!isValidRepo('/repo'));
    assert.ok(!isValidRepo('owner/'));
    assert.ok(!isValidRepo(''));
    assert.ok(!isValidRepo(null));
  });
});

test('Issue Assignee Mapping Tests', async (t) => {
  await t.test('maps roles to assignees correctly', () => {
    const roleToAssignee = (role) => {
      // In real implementation, this might map to actual GitHub usernames
      return role.toLowerCase().replace(/\s+/g, '-');
    };
    
    assert.strictEqual(roleToAssignee('Product Owner'), 'product-owner');
    assert.strictEqual(roleToAssignee('Software Engineer'), 'software-engineer');
    assert.strictEqual(roleToAssignee('UX Designer'), 'ux-designer');
    assert.strictEqual(roleToAssignee('QA Engineer'), 'qa-engineer');
  });
  
  await t.test('handles complex role names', () => {
    const sanitizeRole = (role) => {
      return role.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .trim();
    };
    
    assert.strictEqual(sanitizeRole('Sr. Software Engineer'), 'sr-software-engineer');
    assert.strictEqual(sanitizeRole('UI/UX Designer'), 'uiux-designer');
    assert.strictEqual(sanitizeRole('DevOps & Cloud Engineer'), 'devops-cloud-engineer');
  });
});