#!/usr/bin/env node

// Test script for EC2 webhook payload testing
// Usage: node tests/test-ec2-webhook.js [red|black|white]

import fs from 'fs';
import fetch from 'node-fetch';

const EC2_WEBHOOK_URL = process.env.EC2_WEBHOOK_URL || 'http://54.162.132.68:5000';
const EC2_WEBHOOK_TOKEN = process.env.EC2_WEBHOOK_TOKEN || 'test-secret-2024';

async function testEC2Webhook(teamType) {
  try {
    // Load test payload
    const payloadPath = `./tests/payloads/${teamType}-team-test.json`;
    
    if (!fs.existsSync(payloadPath)) {
      throw new Error(`Test payload not found: ${payloadPath}`);
    }
    
    const payload = JSON.parse(fs.readFileSync(payloadPath, 'utf8'));
    
    console.log(`🧪 Testing ${teamType.toUpperCase()} Team webhook payload`);
    console.log(`📡 Target: ${EC2_WEBHOOK_URL}/webhook`);
    console.log(`📦 Repository: ${payload.repository}`);
    console.log(`📄 Payload preview:`, JSON.stringify(payload, null, 2).substring(0, 200) + '...');
    
    // Send test request
    console.log('\n🚀 Sending webhook request...');
    
    const response = await fetch(`${EC2_WEBHOOK_URL}/webhook`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${EC2_WEBHOOK_TOKEN}`
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Success! Response:', JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:', errorText);
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Tip: Make sure the EC2 webhook server is running at', EC2_WEBHOOK_URL);
    }
  }
}

// Parse command line argument
const teamType = process.argv[2] || 'red';

if (!['red', 'black', 'white'].includes(teamType)) {
  console.error('❌ Invalid team type. Use: red, black, or white');
  process.exit(1);
}

// Run the test
testEC2Webhook(teamType);