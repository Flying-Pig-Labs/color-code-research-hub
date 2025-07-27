const axios = require('axios');

const CLAUDE_FLOW_BASE_URL = 'http://18.209.36.58';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
};

/**
 * Generic proxy handler for Claude Flow endpoints
 */
const proxyRequest = async (path, method, body = null) => {
  try {
    const config = {
      method: method,
      url: `${CLAUDE_FLOW_BASE_URL}${path}`,
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 seconds
    };

    if (body) {
      config.data = body;
    }

    console.log(`Proxying ${method} request to: ${config.url}`);
    const response = await axios(config);
    
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify(response.data)
    };
  } catch (error) {
    console.error('Proxy request failed:', error.message);
    
    if (error.response) {
      // Forward the error response from Claude Flow
      return {
        statusCode: error.response.status,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          error: error.response.data || error.message,
          status: error.response.status
        })
      };
    }
    
    // Network or other errors
    return {
      statusCode: 503,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Claude Flow backend unavailable',
        details: error.message
      })
    };
  }
};

/**
 * Health check proxy
 */
exports.healthHandler = async (event) => {
  console.log('Health check proxy request');
  
  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'OK' })
    };
  }
  
  return proxyRequest('/health', 'GET');
};

/**
 * Execute task proxy
 */
exports.executeHandler = async (event) => {
  console.log('Execute proxy request');
  
  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'OK' })
    };
  }
  
  let body;
  try {
    body = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }
  
  return proxyRequest('/execute', 'POST', body);
};

/**
 * Swarm status proxy
 */
exports.swarmStatusHandler = async (event) => {
  console.log('Swarm status proxy request');
  
  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'OK' })
    };
  }
  
  return proxyRequest('/swarm-status', 'GET');
};

/**
 * SQS health proxy
 */
exports.sqsHealthHandler = async (event) => {
  console.log('SQS health proxy request');
  
  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'OK' })
    };
  }
  
  return proxyRequest('/sqs-health', 'GET');
};

/**
 * Executions list proxy
 */
exports.executionsHandler = async (event) => {
  console.log('Executions list proxy request');
  
  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'OK' })
    };
  }
  
  return proxyRequest('/executions', 'GET');
};

/**
 * Execution details proxy
 */
exports.executionDetailsHandler = async (event) => {
  console.log('Execution details proxy request');
  
  // Handle OPTIONS for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ message: 'OK' })
    };
  }
  
  const executionId = event.pathParameters?.id;
  if (!executionId) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Execution ID is required' })
    };
  }
  
  return proxyRequest(`/execution/${executionId}`, 'GET');
};