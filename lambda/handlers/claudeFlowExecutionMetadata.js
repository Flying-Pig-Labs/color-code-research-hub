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
 * Call Claude Flow backend to get S3 URL for metadata
 */
async function getMetadataUrl(executionId) {
  const backendUrl = `http://${EC2_HOST}:${EC2_PORT}/execution/${executionId}/download/execution.json`;
  
  console.log(`Fetching metadata URL from backend: ${backendUrl}`);
  
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
    
    console.log(`Fetching metadata for execution ${executionId}`);
    
    // Get S3 URL from backend
    const s3Url = await getMetadataUrl(executionId);
    console.log(`Got S3 URL: ${s3Url}`);
    
    // Fetch metadata content from S3
    const metadataContent = await fetchContent(s3Url);
    
    // Parse and return the metadata
    const metadata = JSON.parse(metadataContent);
    
    return {
      statusCode: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(metadata)
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