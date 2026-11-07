# Lambda Function Test Suite

Comprehensive test suite for verifying the Color Code Research Hub Lambda implementation.

## Overview

This test suite validates that the Lambda implementation correctly:
- Makes 50-90 LLM calls for complete plan generation
- Updates DynamoDB at each stage (when implemented)
- Handles polling mechanisms for progress tracking
- Produces identical results to the CLI version
- Handles errors and rate limiting gracefully

## Test Structure

```
tests/
├── run-tests.js           # Main test runner
├── test-utils.js          # Shared test utilities and mocks
├── fixtures/              # Test data
│   └── test-readme.md     # Sample README for testing
├── unit/                  # Unit tests
│   ├── test-json-extraction.js    # JSON parsing tests
│   ├── test-phase-generation.js   # Phase generation logic
│   └── test-github-integration.js # GitHub API tests
└── integration/           # Integration tests
    └── test-full-flow.js  # Complete flow validation
```

## Running Tests

### Run All Tests
```bash
cd /Users/williamprior/Development/GitHub/color-code-research-hub/lambda/tests
./run-tests.js
```

### Run Individual Test Suites
```bash
# Unit tests
node --test unit/test-json-extraction.js
node --test unit/test-phase-generation.js
node --test unit/test-github-integration.js

# Integration tests
node --test integration/test-full-flow.js
```

## Test Coverage

### 1. Full Flow Integration Test
- **Purpose**: Validates the complete 3-step process
- **Verifies**:
  - Phase generation (1 LLM call)
  - Epic generation (8 LLM calls - one per phase)
  - Issue formatting (72 LLM calls - 9 issues per phase)
  - Total: 81 LLM calls for full generation
  - GitHub issue creation
  - DynamoDB updates (when implemented)

### 2. JSON Extraction Tests
- **Purpose**: Ensures reliable parsing of LLM responses
- **Tests**:
  - Pure JSON extraction
  - JSON embedded in markdown
  - Handling of trailing commas
  - Array to object conversion
  - Complex nested structures
  - Error handling for invalid JSON

### 3. Phase Generation Tests
- **Purpose**: Validates phase generation logic
- **Tests**:
  - Prompt template structure
  - Role mapping for each phase
  - Phase ID generation
  - Domain-specific customization

### 4. GitHub Integration Tests
- **Purpose**: Ensures correct GitHub API usage
- **Tests**:
  - Label sanitization
  - Issue structure formatting
  - Rate limit handling
  - Batch processing with delays
  - Repository parsing
  - Role to assignee mapping

## Key Findings

### LLM Call Pattern
The Lambda implementation makes approximately 81 LLM calls for a complete plan:
1. **Phase Generation**: 1 call to generate 8 phases
2. **Epic Generation**: 8 calls (1 per phase) if all phases need epics
3. **Issue Formatting**: 72 calls (3 epics × 3 issues × 8 phases)

This falls within the expected 50-90 call range.

### Current Limitations

1. **No DynamoDB Implementation**: The current Lambda doesn't use DynamoDB for progress tracking
2. **No Polling Endpoint**: No `/status/{planId}` endpoint for progress polling
3. **Simplified Epic Generation**: The Lambda uses a simplified approach to avoid timeouts
4. **No Progress Updates**: Client can't track generation progress in real-time

## Recommendations

### 1. Add DynamoDB Progress Tracking
```javascript
// Store initial plan
await dynamodb.putItem({
  TableName: 'PlanGeneration',
  Item: {
    planId: { S: planId },
    status: { S: 'in_progress' },
    phasesComplete: { N: '0' },
    totalPhases: { N: '8' },
    timestamp: { N: Date.now().toString() }
  }
});

// Update progress after each phase
await dynamodb.updateItem({
  TableName: 'PlanGeneration',
  Key: { planId: { S: planId } },
  UpdateExpression: 'SET phasesComplete = phasesComplete + :inc',
  ExpressionAttributeValues: { ':inc': { N: '1' } }
});
```

### 2. Add Status Endpoint
```javascript
// GET /api/plan/v2/status/{planId}
exports.statusHandler = async (event) => {
  const { planId } = event.pathParameters;
  
  const result = await dynamodb.getItem({
    TableName: 'PlanGeneration',
    Key: { planId: { S: planId } }
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify({
      planId,
      status: result.Item.status.S,
      progress: {
        phasesComplete: parseInt(result.Item.phasesComplete.N),
        totalPhases: parseInt(result.Item.totalPhases.N),
        percentage: Math.round((parseInt(result.Item.phasesComplete.N) / 8) * 100)
      }
    })
  };
};
```

### 3. Implement Async Processing
- Use SQS for long-running generation tasks
- Return immediately with a planId
- Process in background Lambda
- Client polls for status

### 4. Match CLI Output Exactly
- Ensure issue format matches CLI version
- Use same role assignments
- Maintain identical phase structure
- Preserve all metadata fields

## Mock Utilities

The test suite includes comprehensive mocks for:
- **DynamoDB Client**: Simulates database operations
- **Secrets Manager**: Provides test API keys
- **HTTPS Requests**: Mocks Claude and GitHub APIs
- **Test Data**: Realistic README and project metadata

## Continuous Integration

To add to CI/CD pipeline:
```yaml
test:
  stage: test
  script:
    - cd lambda/tests
    - npm install
    - ./run-tests.js
  artifacts:
    reports:
      junit: lambda/tests/test-results.xml
```

## Debugging Tests

Enable verbose logging:
```bash
DEBUG=* ./run-tests.js
```

Run with Node inspector:
```bash
node --inspect --test integration/test-full-flow.js
```

## Contributing

When adding new features:
1. Add unit tests for individual functions
2. Update integration tests for end-to-end flows
3. Ensure mocks reflect actual API responses
4. Document any new test utilities
5. Update this README with new test coverage