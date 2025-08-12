#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

// Test runner for Lambda function tests
async function runTests() {
  console.log('🧪 Running Lambda Function Tests\n');
  
  const testSuites = [
    {
      name: 'Unit Tests - JSON Extraction',
      file: 'unit/test-json-extraction.js'
    },
    {
      name: 'Unit Tests - Phase Generation',
      file: 'unit/test-phase-generation.js'
    },
    {
      name: 'Unit Tests - GitHub Integration',
      file: 'unit/test-github-integration.js'
    },
    {
      name: 'Integration Tests - Full Flow',
      file: 'integration/test-full-flow.js'
    }
  ];
  
  let totalPassed = 0;
  let totalFailed = 0;
  
  for (const suite of testSuites) {
    console.log(`\n📋 Running ${suite.name}...`);
    console.log('─'.repeat(50));
    
    try {
      await new Promise((resolve, reject) => {
        const testPath = path.join(__dirname, suite.file);
        const child = spawn('node', ['--test', testPath], {
          stdio: 'inherit',
          env: {
            ...process.env,
            NODE_ENV: 'test',
            ANTHROPIC_API_KEY: 'test-key',
            AWS_REGION: 'us-east-1'
          }
        });
        
        child.on('exit', (code) => {
          if (code === 0) {
            totalPassed++;
            resolve();
          } else {
            totalFailed++;
            resolve(); // Don't reject to continue running other tests
          }
        });
        
        child.on('error', reject);
      });
    } catch (error) {
      console.error(`❌ Error running ${suite.name}:`, error.message);
      totalFailed++;
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${totalPassed}`);
  console.log(`❌ Failed: ${totalFailed}`);
  console.log(`📈 Total: ${totalPassed + totalFailed}`);
  console.log('='.repeat(60));
  
  // Exit with appropriate code
  process.exit(totalFailed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});