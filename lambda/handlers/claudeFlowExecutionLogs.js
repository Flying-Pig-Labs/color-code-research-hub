const https = require('https');
const http = require('http');

const EC2_HOST = process.env.EC2_HOST || '18.209.36.58';
const EC2_PORT = process.env.EC2_PORT || '8080';

// CORS headers for all responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

/**
 * Fetch content from URL using http/https
 */
async function fetchContent(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    protocol.get(url, (response) => {
      let data = '';
      
      response.on('data', chunk => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode >= 200 && response.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        }
      });
      
    }).on('error', reject);
  });
}

/**
 * Call Claude Flow backend to get S3 URL for logs
 */
async function getLogUrl(executionId, logType = 'stdout') {
  const logFile = logType === 'stderr' ? 'stderr.log' : 'stdout.log';
  const backendUrl = `http://${EC2_HOST}:${EC2_PORT}/execution/${executionId}/download/${logFile}`;
  
  console.log(`Fetching log URL from backend: ${backendUrl}`);
  
  return new Promise((resolve, reject) => {
    http.get(backendUrl, (response) => {
      let data = '';
      
      response.on('data', chunk => {
        data += chunk;
      });
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          try {
            const result = JSON.parse(data);
            if (result.url) {
              resolve(result.url);
            } else {
              reject(new Error('No URL in response'));
            }
          } catch (error) {
            reject(new Error(`Failed to parse response: ${error.message}`));
          }
        } else if (response.statusCode === 404) {
          reject(new Error('Execution not found'));
        } else {
          reject(new Error(`Backend returned ${response.statusCode}: ${data}`));
        }
      });
      
    }).on('error', reject);
  });
}

/**
 * Get last N lines from text
 */
function tailLines(text, numLines) {
  if (!numLines || numLines <= 0) return text;
  
  const lines = text.split('\n');
  if (lines.length <= numLines) return text;
  
  return lines.slice(-numLines).join('\n');
}

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }
  
  try {
    // Extract execution ID from path
    const executionId = event.pathParameters?.id;
    if (!executionId) {
      return {
        statusCode: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing execution ID' })
      };
    }
    
    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const logType = queryParams.type || 'stdout';
    const tail = queryParams.tail ? parseInt(queryParams.tail) : null;
    
    console.log(`Fetching ${logType} logs for execution ${executionId}, tail: ${tail}`);
    
    // Get S3 URL from backend
    const s3Url = await getLogUrl(executionId, logType);
    console.log(`Got S3 URL: ${s3Url}`);
    
    // Fetch log content from S3
    let logContent = await fetchContent(s3Url);
    
    // Apply tail if requested
    if (tail && tail > 0) {
      logContent = tailLines(logContent, tail);
    }
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      body: logContent
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    
    return {
      statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message,
        executionId: event.pathParameters?.id
      })
    };
  }
};