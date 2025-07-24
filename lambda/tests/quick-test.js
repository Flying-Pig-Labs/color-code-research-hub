#!/usr/bin/env node

// Quick test to demonstrate the test suite functionality
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Color Code Research Hub - Lambda Test Suite Demo\n');

try {
  // Run validation first
  console.log('📋 Running implementation validation...\n');
  execSync('node validate-implementation.js', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('\n\n📊 Running sample unit test...\n');
  
  // Run a simple unit test
  execSync('node --test unit/test-json-extraction.js', {
    cwd: __dirname,
    stdio: 'inherit'
  });
  
  console.log('\n✅ Test suite is ready to use!');
  console.log('\nTo run all tests: ./run-tests.js');
  console.log('To validate implementation: ./validate-implementation.js');
  
} catch (error) {
  console.error('❌ Error running tests:', error.message);
  process.exit(1);
}