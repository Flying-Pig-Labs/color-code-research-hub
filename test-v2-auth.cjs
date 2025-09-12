#!/usr/bin/env node

/**
 * Test V2 API with proper Cognito JWT authentication
 * Debug authorization issues and get 200 responses
 */

const https = require('https');
const { URL } = require('url');

const config = {
  v2ApiUrl: 'https://g5rpch8h1l.execute-api.us-east-1.amazonaws.com/prod',
  idToken: 'eyJraWQiOiI2ZzZ6cTBMSmxqUnZzNUVwS3JrQm1hdUFIV3pUczRIYUVWZ28xSngweEs4PSIsImFsZyI6IlJTMjU2In0.eyJzdWIiOiI4NGI4MjRjOC04MDIxLTcwY2YtNWM3MS0zZTU1MDFhM2NhODEiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfYktzaEJNVnRoIiwiY29nbml0bzp1c2VybmFtZSI6Ijg0YjgyNGM4LTgwMjEtNzBjZi01YzcxLTNlNTUwMWEzY2E4MSIsIm9yaWdpbl9qdGkiOiJmYjYxYTM2NS00ZjMwLTRlN2YtYjNlMS03MTk0YTg1M2Y1MjAiLCJhdWQiOiIzc3FsZWo5OGhoMnM1dm8xMTdoYTNoZzBpNCIsImV2ZW50X2lkIjoiMjgzZWU5OTktMTM4NC00Yjk3LTlkNjItMjEzOWY2YjhkMmMxIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE3NTc2NjMzNTQsImV4cCI6MTc1NzY2Njk1NCwiaWF0IjoxNzU3NjYzMzU0LCJqdGkiOiJmNjZmNTliYS1lM2ZhLTRhNjAtYTVkNS01NjljN2VlY2Q5NjUiLCJlbWFpbCI6InByaW9yd3dAZ21haWwuY29tIn0.Qi_m0PubrjexX6ebKx-OIAiUuz3AEM4p4uEr1pqiy3dbXNAnl7BNqMceMIYMn_3_fNhz3oOXy57r6OQ-TbZNrN9lourigHPdgBQ_evg42eKRbB__qsmYrDaeeolgfJtAfXEWbZt1sL-gtKiG_tLloAgvviLhK0PqPdixtNv4lsMMlqHX2mbmde1Cd-ZEOQAU06DPzTt_bMRSyt0OX7T298ggtpfPsuurbqzWvQLt2uhWU84C5Y2sAMfODs_Xf8RVxfFx_FKuvOKCNVlaF-8-yjhOn7EOpQHMq_d1QprmOH73mOVhZUqW8s4o0a65AusCl9MzHBYsLthWBH9y56WH_g'
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

    log(`Making ${requestOptions.method} ${url}`, colors.blue);
    log(`Headers: ${JSON.stringify(requestOptions.headers, null, 2)}`, colors.blue);

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

async function testAuthMethod(name, headers) {
  log(`\n${colors.bold}=== Testing ${name} ===${colors.reset}`);
  
  try {
    const response = await request(`${config.v2ApiUrl}/credits/balance`, {
      headers
    });
    
    const statusColor = response.status === 200 ? colors.green : 
                       response.status >= 400 ? colors.red : colors.yellow;
                       
    log(`${statusColor}Status: ${response.status}${colors.reset}`);
    log(`Response: ${JSON.stringify(response.data || response.body, null, 2)}`, colors.blue);
    
    return response.status === 200;
    
  } catch (error) {
    log(`${colors.red}Error: ${error.message}${colors.reset}`);
    return false;
  }
}

async function testAllEndpointsWithWorkingAuth(authHeaders) {
  log(`\n${colors.bold}=== Testing All Endpoints with Working Auth ===${colors.reset}`);
  
  const endpoints = [
    { name: 'Credits Balance', path: '/credits/balance' },
    { name: 'Projects List', path: '/projects' },
    { name: 'Reports List', path: '/reports' },
    { name: 'Ideations List', path: '/ideations' },
    { name: 'Double-Downs List', path: '/double-downs' }
  ];

  let successCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await request(`${config.v2ApiUrl}${endpoint.path}`, {
        headers: authHeaders
      });
      
      const statusColor = response.status === 200 ? colors.green : 
                         response.status >= 400 ? colors.red : colors.yellow;
                         
      log(`${statusColor}${response.status}${colors.reset} ${endpoint.name}`);
      
      if (response.status === 200) {
        successCount++;
        log(`  Data: ${JSON.stringify(response.data, null, 2)}`, colors.blue);
      } else {
        log(`  Error: ${JSON.stringify(response.data || response.body)}`, colors.red);
      }
      
    } catch (error) {
      log(`${colors.red}ERROR${colors.reset} ${endpoint.name}: ${error.message}`);
    }
  }
  
  log(`\n${colors.bold}Results: ${successCount}/${endpoints.length} endpoints returned 200${colors.reset}`);
  return successCount;
}

async function main() {
  log(`${colors.bold}🔐 V2 API Authentication Testing${colors.reset}`);
  log(`Testing different auth header formats for JWT token...\n`);
  
  // Test different authorization header formats
  const authTests = [
    {
      name: 'Bearer Token (Standard)',
      headers: { 'Authorization': `Bearer ${config.idToken}` }
    },
    {
      name: 'Direct Token',
      headers: { 'Authorization': config.idToken }
    },
    {
      name: 'Custom Auth Header',
      headers: { 'X-Authorization': config.idToken }
    },
    {
      name: 'Custom Token Header',
      headers: { 'X-Token': config.idToken }
    },
    {
      name: 'Cognito Token Header',
      headers: { 'X-Cognito-Token': config.idToken }
    }
  ];

  let workingAuth = null;

  for (const test of authTests) {
    const success = await testAuthMethod(test.name, test.headers);
    if (success) {
      workingAuth = test.headers;
      log(`${colors.green}✅ Found working auth method: ${test.name}${colors.reset}`);
      break;
    }
  }

  if (workingAuth) {
    const successCount = await testAllEndpointsWithWorkingAuth(workingAuth);
    
    if (successCount > 0) {
      log(`\n${colors.green}${colors.bold}🎉 SUCCESS! ${successCount} endpoints returning 200!${colors.reset}`);
    }
  } else {
    log(`\n${colors.yellow}❌ No working auth method found. Let me check the API Gateway configuration...${colors.reset}`);
    
    // Test the config endpoint to make sure API is reachable
    log(`\n${colors.blue}Testing public config endpoint...${colors.reset}`);
    try {
      const configResponse = await request(`${config.v2ApiUrl}/config`);
      log(`Config Status: ${configResponse.status}`);
      log(`Config Data: ${JSON.stringify(configResponse.data, null, 2)}`);
    } catch (error) {
      log(`Config Error: ${error.message}`, colors.red);
    }
  }
}

if (require.main === module) {
  main().catch(error => {
    log(`Fatal error: ${error.message}`, colors.red);
    console.error(error);
  });
}