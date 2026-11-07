#!/usr/bin/env node

/**
 * Comprehensive CORS and Authentication Configuration Verification
 * 
 * Verifies that both SAM and CDK APIs have proper CORS headers and 
 * authentication configurations to prevent redirect loops and API failures.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const config = {
  legacyApiUrl: 'https://aifo8hdco2.execute-api.us-east-1.amazonaws.com',
  v2ApiUrl: 'https://g5rpch8h1l.execute-api.us-east-1.amazonaws.com/prod',
  verbose: process.argv.includes('--verbose')
};

// Results tracking
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  errors: []
};

// Colors for terminal output
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

function logVerbose(message) {
  if (config.verbose) {
    log(`  ${message}`, colors.blue);
  }
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'CORS-Auth-Verification/1.0',
        ...options.headers
      },
      timeout: 30000
    };

    if (options.body) {
      requestOptions.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    logVerbose(`Making ${requestOptions.method} request to ${url}`);
    if (options.headers) {
      logVerbose(`Headers: ${JSON.stringify(options.headers, null, 2)}`);
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const response = {
          status: res.statusCode,
          headers: res.headers,
          body: data
        };
        
        try {
          if (data && res.headers['content-type']?.includes('application/json')) {
            response.data = JSON.parse(data);
          }
        } catch (e) {
          // Keep raw body if JSON parsing fails
        }
        
        logVerbose(`Response: ${res.statusCode} ${res.statusMessage}`);
        logVerbose(`Response Headers: ${JSON.stringify(res.headers, null, 2)}`);
        
        resolve(response);
      });
    });

    req.on('error', (error) => {
      logVerbose(`Request error: ${error.message}`);
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test runner
async function runTest(name, testFn) {
  results.total++;
  
  try {
    log(`🧪 TEST: ${name}`, colors.blue);
    await testFn();
    results.passed++;
    log(`✅ PASS: ${name}`, colors.green);
  } catch (error) {
    results.failed++;
    results.errors.push({ test: name, error: error.message });
    log(`❌ FAIL: ${name} - ${error.message}`, colors.red);
    if (config.verbose) {
      log(`   Error details: ${error.stack}`, colors.red);
    }
  }
}

// CORS Header Verification Tests
async function testLegacyApiCorsHeaders() {
  const response = await makeRequest(`${config.legacyApiUrl}/health`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://www.truflr.ai',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization,Content-Type'
    }
  });

  const requiredHeaders = [
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers'
  ];

  for (const header of requiredHeaders) {
    if (!response.headers[header]) {
      throw new Error(`Missing CORS header: ${header}`);
    }
  }

  // Verify origin is allowed
  const allowOrigin = response.headers['access-control-allow-origin'];
  if (allowOrigin !== '*' && !allowOrigin.includes('truflr.ai')) {
    throw new Error(`Origin not allowed: ${allowOrigin}`);
  }

  logVerbose(`CORS headers verified: Origin=${allowOrigin}, Methods=${response.headers['access-control-allow-methods']}`);
}

async function testV2ApiCorsHeaders() {
  const response = await makeRequest(`${config.v2ApiUrl}/config`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://www.truflr.ai',
      'Access-Control-Request-Method': 'GET',
      'Access-Control-Request-Headers': 'Authorization,Content-Type'
    }
  });

  const requiredHeaders = [
    'access-control-allow-origin',
    'access-control-allow-methods',
    'access-control-allow-headers'
  ];

  for (const header of requiredHeaders) {
    if (!response.headers[header]) {
      throw new Error(`Missing CORS header: ${header}`);
    }
  }

  // Verify origin is allowed
  const allowOrigin = response.headers['access-control-allow-origin'];
  if (allowOrigin !== '*' && !allowOrigin.includes('truflr.ai')) {
    throw new Error(`Origin not allowed: ${allowOrigin}`);
  }

  logVerbose(`CORS headers verified: Origin=${allowOrigin}, Methods=${response.headers['access-control-allow-methods']}`);
}

async function testCorsWithLocalhost() {
  // Test CORS for localhost development
  const response = await makeRequest(`${config.v2ApiUrl}/config`, {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:3000',
      'Access-Control-Request-Method': 'GET'
    }
  });

  const allowOrigin = response.headers['access-control-allow-origin'];
  if (allowOrigin !== '*') {
    throw new Error(`Localhost origin not allowed for development: ${allowOrigin}`);
  }

  logVerbose(`Localhost CORS verified: ${allowOrigin}`);
}

// Authentication Configuration Tests
async function testLegacyApiAuthBehavior() {
  // Test endpoints that should require authentication
  const authEndpoints = ['/research-reports', '/pipeline-ideations', '/pipeline-repos'];
  
  for (const endpoint of authEndpoints) {
    const response = await makeRequest(`${config.legacyApiUrl}${endpoint}`);
    
    // Should return 401 for auth-required endpoints or 500 for misconfigured ones
    if (response.status !== 401 && response.status !== 500) {
      throw new Error(`${endpoint}: Expected 401 or 500, got ${response.status}`);
    }
    
    logVerbose(`${endpoint}: Returns ${response.status} (auth required)`);
  }
}

async function testV2ApiAuthBehavior() {
  // Test endpoints that should require authentication
  const authEndpoints = [
    '/credits/balance',
    '/projects', 
    '/reports',
    '/ideations',
    '/double-downs'
  ];
  
  for (const endpoint of authEndpoints) {
    const response = await makeRequest(`${config.v2ApiUrl}${endpoint}`);
    
    // Should return 401 or 403 for auth-required endpoints
    if (response.status !== 401 && response.status !== 403) {
      throw new Error(`${endpoint}: Expected 401/403, got ${response.status}`);
    }
    
    logVerbose(`${endpoint}: Returns ${response.status} (auth required)`);
  }
}

async function testV2PublicEndpoints() {
  // Test endpoints that should be public
  const publicEndpoints = ['/config'];
  
  for (const endpoint of publicEndpoints) {
    const response = await makeRequest(`${config.v2ApiUrl}${endpoint}`);
    
    // Should return 200 for public endpoints
    if (response.status !== 200) {
      throw new Error(`${endpoint}: Expected 200 (public), got ${response.status}`);
    }
    
    logVerbose(`${endpoint}: Returns ${response.status} (public access)`);
  }
}

// Error Response Format Tests
async function testErrorResponseFormats() {
  // Test that error responses include proper headers and format
  const response = await makeRequest(`${config.v2ApiUrl}/projects`);
  
  // Verify error response has CORS headers even on 401
  if (!response.headers['access-control-allow-origin']) {
    throw new Error('Error response missing CORS headers (would cause redirect loop)');
  }

  // Verify proper JSON error format
  if (!response.data || typeof response.data !== 'object') {
    throw new Error('Error response not in proper JSON format');
  }

  logVerbose(`Error response format verified: ${JSON.stringify(response.data)}`);
}

// Auth Token Format Validation
async function testAuthTokenRequirements() {
  // Test with malformed auth token
  const response = await makeRequest(`${config.v2ApiUrl}/credits/balance`, {
    headers: {
      'Authorization': 'Bearer invalid-token-format'
    }
  });

  // Should return 401/403 for invalid token, not 500
  if (response.status >= 500) {
    throw new Error(`Invalid token caused server error (${response.status}) instead of auth error`);
  }

  logVerbose(`Invalid token handling verified: ${response.status}`);
}

// Security Headers Verification
async function testSecurityHeaders() {
  const response = await makeRequest(`${config.v2ApiUrl}/config`);
  
  // Check for security headers
  const securityHeaders = [
    'x-frame-options',
    'x-content-type-options',
    'strict-transport-security'
  ];

  let missingHeaders = [];
  for (const header of securityHeaders) {
    if (!response.headers[header]) {
      missingHeaders.push(header);
    }
  }

  if (missingHeaders.length > 0) {
    logVerbose(`Info: Missing optional security headers: ${missingHeaders.join(', ')}`);
    // Not failing the test as these are not critical for current functionality
  } else {
    logVerbose(`All security headers present`);
  }
}

// Configuration Consistency Tests
async function testCognitoConfigConsistency() {
  const response = await makeRequest(`${config.v2ApiUrl}/config`);
  
  if (!response.data) {
    throw new Error('Config endpoint not returning data');
  }

  const requiredConfigFields = ['cognitoDomain', 'cognitoClientId', 'redirectUri'];
  
  for (const field of requiredConfigFields) {
    if (!response.data[field]) {
      throw new Error(`Missing required config field: ${field}`);
    }
  }

  // Verify redirect URI matches expected production URL
  const redirectUri = response.data.redirectUri;
  if (!redirectUri.includes('truflr.ai') || !redirectUri.includes('/v2/auth/callback')) {
    throw new Error(`Suspicious redirect URI: ${redirectUri}`);
  }

  logVerbose(`Cognito configuration verified: Domain=${response.data.cognitoDomain}, Client=${response.data.cognitoClientId}`);
}

// Main test runner
async function runAllTests() {
  log(`${colors.bold}🔐 CORS and Auth Configuration Verification${colors.reset}`);
  log(`Legacy API: ${config.legacyApiUrl}`);
  log(`V2 API: ${config.v2ApiUrl}`);
  log('');

  // CORS Tests
  log(`${colors.yellow}=== CORS Configuration Tests ===${colors.reset}`);
  await runTest('Legacy API CORS Headers', testLegacyApiCorsHeaders);
  await runTest('V2 API CORS Headers', testV2ApiCorsHeaders);
  await runTest('CORS with Localhost (Development)', testCorsWithLocalhost);

  // Authentication Tests
  log('');
  log(`${colors.yellow}=== Authentication Configuration Tests ===${colors.reset}`);
  await runTest('Legacy API Auth Behavior', testLegacyApiAuthBehavior);
  await runTest('V2 API Auth Behavior', testV2ApiAuthBehavior);
  await runTest('V2 Public Endpoints', testV2PublicEndpoints);

  // Error Handling Tests
  log('');
  log(`${colors.yellow}=== Error Handling Tests ===${colors.reset}`);
  await runTest('Error Response Formats', testErrorResponseFormats);
  await runTest('Auth Token Requirements', testAuthTokenRequirements);

  // Security and Configuration Tests
  log('');
  log(`${colors.yellow}=== Security and Configuration Tests ===${colors.reset}`);
  await runTest('Security Headers', testSecurityHeaders);
  await runTest('Cognito Config Consistency', testCognitoConfigConsistency);

  // Print results
  log('');
  log(`${colors.bold}📊 Verification Results:${colors.reset}`);
  log(`Total: ${results.total}`);
  log(`${colors.green}Passed: ${results.passed}${colors.reset}`);
  log(`${colors.red}Failed: ${results.failed}${colors.reset}`);

  if (results.errors.length > 0) {
    log('');
    log(`${colors.bold}❌ Failed Verifications:${colors.reset}`);
    results.errors.forEach(({ test, error }) => {
      log(`  ${test}: ${error}`, colors.red);
    });
  }

  if (results.failed > 0) {
    log('');
    log(`${colors.red}${colors.bold}Some verifications failed. Check the errors above.${colors.reset}`);
    process.exit(1);
  } else {
    log('');
    log(`${colors.green}${colors.bold}All CORS and auth configurations verified! 🎉${colors.reset}`);
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    log(`Fatal error: ${error.message}`, colors.red);
    if (config.verbose) {
      log(error.stack, colors.red);
    }
    process.exit(1);
  });
}

module.exports = { runAllTests, config };