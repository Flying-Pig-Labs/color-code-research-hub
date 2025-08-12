const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');

// Test utilities for Lambda function testing

/**
 * Creates a mock API Gateway event
 */
const createMockEvent = (httpMethod, path, body = {}, headers = {}) => {
  return {
    httpMethod,
    path,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    body: typeof body === 'object' ? JSON.stringify(body) : body,
    isBase64Encoded: false,
    pathParameters: {},
    queryStringParameters: {},
    multiValueHeaders: {},
    multiValueQueryStringParameters: {}
  };
};

/**
 * Mock DynamoDB client for testing
 */
class MockDynamoDBClient {
  constructor() {
    this.data = new Map();
    this.calls = [];
  }

  send(command) {
    this.calls.push(command);
    
    if (command.constructor.name === 'PutItemCommand') {
      const key = JSON.stringify(command.input.Item);
      this.data.set(key, command.input.Item);
      return Promise.resolve({});
    }
    
    if (command.constructor.name === 'GetItemCommand') {
      const results = Array.from(this.data.values()).find(item => {
        return Object.entries(command.input.Key).every(([k, v]) => 
          JSON.stringify(item[k]) === JSON.stringify(v)
        );
      });
      return Promise.resolve({ Item: results });
    }
    
    if (command.constructor.name === 'UpdateItemCommand') {
      // Simplified update logic for testing
      return Promise.resolve({});
    }
    
    return Promise.reject(new Error(`Unknown command: ${command.constructor.name}`));
  }

  getCalls() {
    return this.calls;
  }

  reset() {
    this.data.clear();
    this.calls = [];
  }
}

/**
 * Mock Secrets Manager client
 */
class MockSecretsManagerClient {
  constructor() {
    this.secrets = new Map([
      ['color-code-research-hub-secrets-production', JSON.stringify({
        ANTHROPIC_API_KEY: 'test-anthropic-key'
      })],
      ['github/personal_token-7lbje4', 'test-github-token'],
      ['feel-forward/openai-api-key-zezdyv', 'test-openai-key']
    ]);
  }

  send(command) {
    if (command.constructor.name === 'GetSecretValueCommand') {
      const secretId = command.input.SecretId;
      const secretValue = this.secrets.get(secretId.split(':').pop()) || 
                         this.secrets.get(secretId);
      
      if (secretValue) {
        return Promise.resolve({ SecretString: secretValue });
      }
      return Promise.reject(new Error(`Secret not found: ${secretId}`));
    }
    return Promise.reject(new Error(`Unknown command: ${command.constructor.name}`));
  }
}

/**
 * Mock HTTPS request for testing API calls
 */
class MockHttpsRequest {
  constructor() {
    this.responses = new Map();
    this.calls = [];
  }

  addResponse(hostname, path, method, response) {
    const key = `${method}:${hostname}${path}`;
    this.responses.set(key, response);
  }

  request(options, callback) {
    this.calls.push(options);
    
    const key = `${options.method}:${options.hostname}${options.path}`;
    const response = this.responses.get(key);
    
    const res = {
      statusCode: response?.statusCode || 404,
      on: (event, handler) => {
        if (event === 'data' && response?.data) {
          handler(response.data);
        }
        if (event === 'end') {
          handler();
        }
      }
    };
    
    callback(res);
    
    return {
      on: (event, handler) => {
        if (event === 'error' && response?.error) {
          handler(new Error(response.error));
        }
      },
      write: () => {},
      end: () => {}
    };
  }

  getCalls() {
    return this.calls;
  }

  reset() {
    this.responses.clear();
    this.calls = [];
  }
}

/**
 * Load test README content
 */
const loadTestReadme = async () => {
  const readmePath = path.join(__dirname, 'fixtures', 'test-readme.md');
  try {
    return await fs.readFile(readmePath, 'utf-8');
  } catch (error) {
    // Return a default test README if file doesn't exist
    return `# Test Product

A comprehensive product management platform for modern teams.

## Features
- Task management
- Team collaboration
- Real-time updates
- Analytics dashboard
- API integrations

## Tech Stack
- React
- Node.js
- PostgreSQL
- Redis
- Docker

## Getting Started
1. Clone the repository
2. Install dependencies
3. Run the application`;
  }
};

/**
 * Create test project metadata
 */
const createTestMetadata = () => ({
  title: "Test Product Management Platform",
  description: "A comprehensive platform for managing products and teams",
  domain: "enterprise",
  targetUsers: ["Product Managers", "Development Teams", "Stakeholders"],
  techStack: ["React", "Node.js", "PostgreSQL", "Redis", "Docker"],
  features: [
    "Task management",
    "Team collaboration", 
    "Real-time updates",
    "Analytics dashboard",
    "API integrations"
  ],
  complexity: "moderate",
  repository: "test-owner/test-repo",
  branch: "main"
});

/**
 * Create expected phases structure
 */
const createExpectedPhases = () => [
  {
    id: "discovery",
    title: "Discovery & Requirements",
    description: "Initial project analysis, stakeholder alignment, and requirement gathering",
    suggestedRoles: ["Product Owner", "UX Researcher", "Business Analyst"]
  },
  {
    id: "technical_planning",
    title: "Technical Planning & Architecture",
    description: "System design, technology selection, and implementation roadmap",
    suggestedRoles: ["Software Architect", "Technical Lead", "DevOps Engineer"]
  },
  {
    id: "design",
    title: "UI/UX Design & Prototyping",
    description: "User interface design, prototyping, and user experience optimization",
    suggestedRoles: ["UX Designer", "UI Designer", "Frontend Developer"]
  },
  {
    id: "core_development",
    title: "Core Development",
    description: "Implementation of core features and functionality",
    suggestedRoles: ["Software Engineer", "Backend Developer", "Frontend Developer"]
  },
  {
    id: "integration",
    title: "System Integration & Testing",
    description: "Integration testing, API connections, and end-to-end workflow validation",
    suggestedRoles: ["Software Engineer", "QA Engineer", "DevOps Engineer"]
  },
  {
    id: "quality_assurance",
    title: "Quality Assurance & Testing",
    description: "Comprehensive testing, bug fixes, and quality validation",
    suggestedRoles: ["QA Engineer", "Test Automation Engineer", "Security Tester"]
  },
  {
    id: "deployment",
    title: "Deployment & Distribution",
    description: "Packaging, distribution setup, and deployment automation",
    suggestedRoles: ["DevOps Engineer", "Release Manager", "Infrastructure Engineer"]
  },
  {
    id: "launch",
    title: "Launch & Documentation",
    description: "Documentation, marketing materials, and go-to-market preparation",
    suggestedRoles: ["Product Manager", "Technical Writer", "Marketing Manager"]
  }
];

/**
 * Create expected epic structure
 */
const createExpectedEpic = (phase) => ({
  phaseId: phase.id,
  roles: phase.suggestedRoles,
  tasks: [
    {
      title: `Define ${phase.title} requirements`,
      description: `Comprehensive analysis and documentation of ${phase.title.toLowerCase()} requirements`,
      suggestedRole: phase.suggestedRoles[0]
    },
    {
      title: `Create ${phase.title} implementation plan`,
      description: `Detailed plan for implementing ${phase.title.toLowerCase()} activities`,
      suggestedRole: phase.suggestedRoles[1] || phase.suggestedRoles[0]
    },
    {
      title: `Review and approve ${phase.title} deliverables`,
      description: `Final review and approval of all ${phase.title.toLowerCase()} outputs`,
      suggestedRole: phase.suggestedRoles[2] || phase.suggestedRoles[0]
    }
  ]
});

/**
 * Create expected GitHub issue
 */
const createExpectedIssue = (task, phase, epicIndex = 0) => ({
  title: `[${task.suggestedRole}] ${task.title}`,
  body: expect.stringContaining('## Context'),
  labels: [
    `phase:${phase.id}`,
    `role:${task.suggestedRole.toLowerCase().replace(/\s+/g, '-')}`,
    'sparc-enabled'
  ],
  assignee: task.suggestedRole,
  phaseId: phase.id,
  phaseTitle: phase.title,
  epicTitle: task.title
});

/**
 * Mock Claude API responses
 */
const createClaudeResponses = () => ({
  phaseGeneration: {
    statusCode: 200,
    data: JSON.stringify({
      id: 'msg_test',
      content: [{
        type: 'text',
        text: JSON.stringify({
          phases: createExpectedPhases()
        })
      }]
    })
  },
  epicGeneration: (phase) => ({
    statusCode: 200,
    data: JSON.stringify({
      id: 'msg_test',
      content: [{
        type: 'text',
        text: JSON.stringify(createExpectedEpic(phase))
      }]
    })
  }),
  issueFormatting: (task, phase) => ({
    statusCode: 200,
    data: JSON.stringify({
      id: 'msg_test',
      content: [{
        type: 'text',
        text: JSON.stringify({
          title: `[${task.suggestedRole}] ${task.title}`,
          body: `## Context
${task.description}

## Role
${task.suggestedRole}

## Phase
${phase.title}

## Tasks
- [ ] Implement requirements
- [ ] Document approach
- [ ] Test implementation
- [ ] Get review and approval

## Acceptance Criteria
- Implementation complete
- Tests passing
- Documentation updated
- Reviewed and approved`
        })
      }]
    })
  }),
  rateLimitError: {
    statusCode: 529,
    data: JSON.stringify({
      error: {
        type: 'rate_limit_error',
        message: 'Rate limit exceeded'
      }
    })
  }
});

/**
 * Mock GitHub API responses
 */
const createGitHubResponses = () => ({
  createIssue: (number) => ({
    statusCode: 201,
    data: JSON.stringify({
      id: 1000 + number,
      number: number,
      title: `Test Issue ${number}`,
      html_url: `https://github.com/test-owner/test-repo/issues/${number}`
    })
  }),
  rateLimitError: {
    statusCode: 403,
    data: JSON.stringify({
      message: 'API rate limit exceeded'
    })
  }
});

/**
 * Verify LLM call count and patterns
 */
const verifyLLMCalls = (httpsMock, expectedCallCount) => {
  const claudeCalls = httpsMock.getCalls().filter(call => 
    call.hostname === 'api.anthropic.com'
  );
  
  const openAICalls = httpsMock.getCalls().filter(call =>
    call.hostname === 'api.openai.com'
  );
  
  const totalLLMCalls = claudeCalls.length + openAICalls.length;
  
  return {
    total: totalLLMCalls,
    claude: claudeCalls.length,
    openai: openAICalls.length,
    isValid: totalLLMCalls >= expectedCallCount.min && totalLLMCalls <= expectedCallCount.max
  };
};

/**
 * Verify DynamoDB updates
 */
const verifyDynamoDBUpdates = (dynamoMock, expectedUpdates) => {
  const putCalls = dynamoMock.getCalls().filter(call =>
    call.constructor.name === 'PutItemCommand'
  );
  
  const updateCalls = dynamoMock.getCalls().filter(call =>
    call.constructor.name === 'UpdateItemCommand'
  );
  
  return {
    puts: putCalls.length,
    updates: updateCalls.length,
    total: putCalls.length + updateCalls.length,
    isValid: (putCalls.length + updateCalls.length) >= expectedUpdates
  };
};

/**
 * Wait for async operations with timeout
 */
const waitForCondition = async (conditionFn, timeout = 5000, interval = 100) => {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    if (await conditionFn()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
};

module.exports = {
  createMockEvent,
  MockDynamoDBClient,
  MockSecretsManagerClient,
  MockHttpsRequest,
  loadTestReadme,
  createTestMetadata,
  createExpectedPhases,
  createExpectedEpic,
  createExpectedIssue,
  createClaudeResponses,
  createGitHubResponses,
  verifyLLMCalls,
  verifyDynamoDBUpdates,
  waitForCondition
};