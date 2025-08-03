const https = require('https');

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Forward the request to the mvp-backlog-generator API
    const mvpApiUrl = 'https://6kiu2wkbwg.execute-api.us-east-1.amazonaws.com/Stage/api/submit-job';
    
    const requestBody = event.body;
    
    // Make the request to the MVP API
    const response = await new Promise((resolve, reject) => {
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody)
        }
      };

      const req = https.request(mvpApiUrl, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.write(requestBody);
      req.end();
    });

    // Log the response for debugging
    console.log('MVP API Response:', {
      statusCode: response.statusCode,
      body: response.body
    });

    return {
      statusCode: response.statusCode,
      headers: corsHeaders,
      body: response.body
    };

  } catch (error) {
    console.error('Error proxying to MVP API:', error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ 
        error: 'Failed to submit job',
        message: error.message 
      })
    };
  }
};