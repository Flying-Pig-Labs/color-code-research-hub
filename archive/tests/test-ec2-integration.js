#!/usr/bin/env node

/**
 * Test script for EC2 webhook integration
 * Run this to verify the EC2 connection is working
 */

const fetch = require('node-fetch');

// Configuration
const EC2_WEBHOOK_URL = 'http://54.162.132.68:5000/webhook';
const EC2_TOKEN = 'test-secret-2024';
const GITHUB_ORG = 'Flying-Pig-Labs';

console.log('🧪 Testing EC2 Webhook Integration...\n');

async function testWebhook() {
  // Test 1: Direct webhook test
  console.log('1️⃣ Testing direct webhook connection...');
  try {
    const response = await fetch(EC2_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EC2_TOKEN}`
      },
      body: JSON.stringify({
        repository: 'ollama/ollama',
        branch: 'main'
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log('✅ Direct webhook test successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Direct webhook test failed!');
      console.log('Status:', response.status);
      console.log('Response:', await response.text());
    }
  } catch (error) {
    console.log('❌ Direct webhook test failed!');
    console.log('Error:', error.message);
  }

  console.log('\n---\n');

  // Test 2: Local proxy test
  console.log('2️⃣ Testing local backend proxy (make sure backend is running on port 3001)...');
  try {
    const proxyResponse = await fetch('http://localhost:3001/api/ec2/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        teamType: 'black',
        repoId: 'test1',
        formData: {
          toolCategories: ['analytics', 'monitoring'],
          implementationComplexity: 'medium',
          teamSizeConstraint: 'small'
        }
      })
    });

    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      console.log('✅ Local proxy test successful!');
      console.log('Response:', JSON.stringify(data, null, 2));
      console.log('\n📌 Expected GitHub repo:', `${GITHUB_ORG}/ci-black-test1`);
    } else {
      console.log('❌ Local proxy test failed!');
      console.log('Status:', proxyResponse.status);
      console.log('Response:', await proxyResponse.text());
    }
  } catch (error) {
    console.log('❌ Local proxy test failed!');
    console.log('Error:', error.message);
    console.log('Make sure your backend server is running: cd backend && npm start');
  }
}

// Run the tests
testWebhook().catch(console.error);