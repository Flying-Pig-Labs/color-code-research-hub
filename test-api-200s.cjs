#!/usr/bin/env node

/**
 * Test API endpoints for 200 responses
 * 
 * Simple test script that assumes you have a valid JWT token
 * and tests all API endpoints to ensure they return 200 status codes.
 */

const https = require('https');
const { URL } = require('url');

// Configuration
const config = {
  v2ApiUrl: 'https://g5rpch8h1l.execute-api.us-east-1.amazonaws.com/prod',
  token: process.env.COGNITO_JWT_TOKEN || process.argv[2] || '',
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v')
};

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

// Simple request helper
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
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

// Test function
async function testEndpoint(name, url, options = {}) {
  try {
    const response = await request(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${config.token}`,
        ...options.headers
      }
    });

    const status = response.status;
    const statusColor = status === 200 ? colors.green : 
                       status >= 400 ? colors.red : colors.yellow;

    log(`${statusColor}${status}${colors.reset} ${name}`);
    
    if (config.verbose && response.data) {
      log(`    Data: ${JSON.stringify(response.data, null, 2)}`, colors.blue);
    }

    return response;
  } catch (error) {
    log(`${colors.red}ERROR${colors.reset} ${name}: ${error.message}`);
    throw error;
  }
}

async function runTests() {
  if (!config.token) {
    log(`${colors.red}❌ No JWT token provided${colors.reset}`);
    log('');
    log('Please provide a token in one of these ways:', colors.yellow);
    log('1. Environment variable: export COGNITO_JWT_TOKEN="your-token"', colors.blue);
    log('2. Command line argument: node test-api-200s.cjs "your-token"', colors.blue);
    log('3. Get a token first: node get-cognito-token.cjs', colors.blue);
    return;
  }

  log(`${colors.bold}🚀 Testing API Endpoints for 200 Responses${colors.reset}`);
  log(`Token: ${config.token.substring(0, 20)}...`);
  log('');

  const tests = [
    // GET endpoints
    { name: 'Credits Balance', url: `${config.v2ApiUrl}/credits/balance` },
    { name: 'Projects List', url: `${config.v2ApiUrl}/projects` },
    { name: 'Reports List', url: `${config.v2ApiUrl}/reports` },
    { name: 'Ideations List', url: `${config.v2ApiUrl}/ideations` },
    { name: 'Double-Downs List', url: `${config.v2ApiUrl}/double-downs` },
    
    // Public endpoint (should work without auth too)
    { name: 'Config (Public)', url: `${config.v2ApiUrl}/config` },
  ];

  let passed = 0;
  let total = tests.length;

  for (const test of tests) {
    try {
      const response = await testEndpoint(test.name, test.url, test.options);
      if (response.status === 200) {
        passed++;
      }
    } catch (error) {
      // Error already logged in testEndpoint
    }
  }

  log('');
  log(`${colors.bold}📊 Results:${colors.reset}`);
  log(`${colors.green}Passed: ${passed}/${total}${colors.reset}`);
  
  if (passed === total) {
    log(`${colors.green}${colors.bold}🎉 All endpoints returning 200! Perfect!${colors.reset}`);
  } else {
    log(`${colors.yellow}Some endpoints not returning 200. Check auth token or endpoint status.${colors.reset}`);
  }

  // Try to create a test project if all basic endpoints work
  if (passed >= total - 1) { // Allow config endpoint to not need auth
    log('');
    log(`${colors.bold}🧪 Testing POST endpoints...${colors.reset}`);
    
    try {
      const projectResponse = await testEndpoint(
        'Create Test Project',
        `${config.v2ApiUrl}/projects`,
        {
          method: 'POST',
          body: JSON.stringify({
            title: `API Test Project ${new Date().toISOString()}`,
            domain: 'API Testing',
            inputs: { test: true, timestamp: Date.now() }
          })
        }
      );

      if (projectResponse.status === 200 || projectResponse.status === 201) {
        log(`${colors.green}✅ Project creation successful!${colors.reset}`);
        
        // Try to start a report if project was created
        const projectId = projectResponse.data?.projectId;
        if (projectId) {
          const reportResponse = await testEndpoint(
            'Start Report',
            `${config.v2ApiUrl}/projects/${projectId}/report/start`,
            {
              method: 'POST',
              body: JSON.stringify({})
            }
          );
          
          if (reportResponse.status === 200 || reportResponse.status === 201) {
            log(`${colors.green}✅ Report start successful!${colors.reset}`);
          }
        }
      }
    } catch (error) {
      log(`${colors.yellow}⚠️  POST endpoint test failed: ${error.message}${colors.reset}`);
    }
  }
}

if (require.main === module) {
  runTests().catch(error => {
    log(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}

module.exports = { runTests, config };