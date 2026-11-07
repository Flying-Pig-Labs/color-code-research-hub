#!/usr/bin/env node

/**
 * Verify API Gateway Authorizer Configuration
 * 
 * This script checks if the API Gateway authorizer is correctly configured
 * with the expected Cognito User Pool ID from the JWT token.
 */

const https = require('https');
const { URL } = require('url');

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = '') {
  console.log(`${color}${message}${colors.reset}`);
}

function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers
      }
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const response = {
            status: res.statusCode,
            headers: res.headers,
            data: data ? JSON.parse(data) : null
          };
          resolve(response);
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data
          });
        }
      });
    });

    req.on('error', reject);
    if (options.body) req.write(options.body);
    req.end();
  });
}

async function verifyAPIGatewayAuth() {
  log(`${colors.bold}🔐 API Gateway Authorization Verification${colors.reset}`);
  log('');

  const apiUrl = 'https://g5rpch8h1l.execute-api.us-east-1.amazonaws.com/prod';
  
  // Test 1: Check public config endpoint works
  log('1. Testing public endpoint (should return 200)...', colors.blue);
  try {
    const configResponse = await request(`${apiUrl}/config`);
    if (configResponse.status === 200) {
      log(`   ✅ Config endpoint working: ${colors.green}200${colors.reset}`);
      log(`   Cognito Domain: ${configResponse.data.cognitoDomain}`);
      log(`   Client ID: ${configResponse.data.cognitoClientId}`);
    } else {
      log(`   ❌ Config endpoint failed: ${configResponse.status}`, colors.red);
      return;
    }
  } catch (error) {
    log(`   ❌ Config endpoint error: ${error.message}`, colors.red);
    return;
  }
  
  log('');

  // Test 2: Check if auth endpoint returns proper 401 (not 500)
  log('2. Testing auth endpoint without token (should return 401)...', colors.blue);
  try {
    const authResponse = await request(`${apiUrl}/credits/balance`);
    if (authResponse.status === 401) {
      log(`   ✅ Auth endpoint properly protected: ${colors.green}401${colors.reset}`);
      if (authResponse.data && authResponse.data.message === 'Unauthorized') {
        log(`   ✅ Proper unauthorized message`);
      } else {
        log(`   ⚠️  Unexpected message: ${JSON.stringify(authResponse.data)}`, colors.yellow);
      }
    } else {
      log(`   ❌ Unexpected status: ${authResponse.status}`, colors.red);
      log(`   Response: ${JSON.stringify(authResponse.data)}`, colors.red);
    }
  } catch (error) {
    log(`   ❌ Auth endpoint error: ${error.message}`, colors.red);
  }
  
  log('');

  // Test 3: Test with the known JWT token
  const jwt = process.env.COGNITO_JWT_TOKEN || process.argv[2];
  if (!jwt) {
    log('3. Skipping JWT test (no token provided)', colors.yellow);
    log('   Set COGNITO_JWT_TOKEN env var or pass token as argument', colors.yellow);
    log('');
    log(`${colors.bold}Expected User Pool ID from JWT:${colors.reset}`);
    log('   us-east-1_bKshBMVth (from iss claim in working tokens)', colors.green);
    return;
  }

  log('3. Testing with JWT token...', colors.blue);
  
  // Decode JWT to show expected User Pool ID
  try {
    const payload = JSON.parse(Buffer.from(jwt.split('.')[1], 'base64').toString());
    const issuer = payload.iss;
    const userPoolId = issuer.split('/').pop();
    
    log(`   JWT Issuer: ${issuer}`, colors.green);
    log(`   Expected User Pool ID: ${userPoolId}`, colors.green);
    log(`   Token expires: ${new Date(payload.exp * 1000).toISOString()}`, colors.green);
    log(`   Token valid: ${payload.exp > Date.now() / 1000 ? 'Yes' : 'No'}`, payload.exp > Date.now() / 1000 ? colors.green : colors.red);
    
    const authResponse = await request(`${apiUrl}/credits/balance`, {
      headers: {
        'Authorization': `Bearer ${jwt}`
      }
    });
    
    if (authResponse.status === 200) {
      log(`   🎉 ${colors.bold}SUCCESS! Auth working: ${colors.green}200${colors.reset}`);
      log(`   Credits: ${authResponse.data.credits}`, colors.green);
    } else if (authResponse.status === 401) {
      log(`   ❌ Still getting 401 - authorizer config issue`, colors.red);
      log(`   Likely cause: API Gateway authorizer using wrong User Pool ID`, colors.red);
      log(`   Expected: ${userPoolId}`, colors.yellow);
    } else {
      log(`   ❌ Unexpected status: ${authResponse.status}`, colors.red);
      log(`   Response: ${JSON.stringify(authResponse.data)}`, colors.red);
    }
    
  } catch (error) {
    log(`   ❌ JWT test error: ${error.message}`, colors.red);
  }
  
  log('');
  
  // Test 4: Summary and next steps
  log(`${colors.bold}🔍 Diagnosis Summary:${colors.reset}`);
  log('- If config endpoint works (200) but auth fails (401), the issue is:');
  log('  API Gateway Cognito User Pool authorizer configuration', colors.yellow);
  log('');
  log('- The authorizer needs to reference User Pool: us-east-1_bKshBMVth', colors.yellow);
  log('- CDK deployment with USER_POOL_ID environment variable should fix this', colors.green);
}

if (require.main === module) {
  verifyAPIGatewayAuth().catch(error => {
    log(`Fatal error: ${error.message}`, colors.red);
    process.exit(1);
  });
}

module.exports = { verifyAPIGatewayAuth };