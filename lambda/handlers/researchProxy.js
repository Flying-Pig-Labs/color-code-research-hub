const https = require('https');
const http = require('http');
const AWS = require('aws-sdk');

// EC2 Claude Flow endpoint - Updated to new port
const EC2_ENDPOINT = process.env.EC2_ENDPOINT || 'http://18.209.36.58:3456';

// Parse the EC2 endpoint
const endpointUrl = new URL(EC2_ENDPOINT);
const httpModule = endpointUrl.protocol === 'https:' ? https : http;

// Secrets Manager client
const secretsManager = new AWS.SecretsManager({ region: 'us-east-1' });

// Cache the API key
let cachedApiKey = null;

async function getApiKey() {
    if (cachedApiKey) return cachedApiKey;
    
    try {
        const secret = await secretsManager.getSecretValue({ 
            SecretId: 'claude-flow-research-api-key' 
        }).promise();
        
        const secretData = JSON.parse(secret.SecretString);
        cachedApiKey = secretData.api_key;
        return cachedApiKey;
    } catch (error) {
        console.error('Failed to retrieve API key from Secrets Manager:', error);
        throw error;
    }
}

exports.handler = async (event) => {
    console.log('Research proxy request:', JSON.stringify(event, null, 2));
    
    // CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    };
    
    // Handle preflight
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ''
        };
    }
    
    try {
        // Extract the path from the event
        const fullPath = event.path || '';
        console.log('Incoming request path:', fullPath);
        
        // Route mapping from frontend paths to backend paths
        let targetPath = fullPath.replace('/production', ''); // Remove stage if present
        let requestBody = event.body;
        
        // Handle different routes
        if (targetPath === '/api/claude-flow/research' && event.httpMethod === 'POST') {
            // Map submission route
            targetPath = '/api/swarms';
            
            // Transform the request body
            const bodyData = JSON.parse(event.body || '{}');
            requestBody = JSON.stringify({
                objective: bodyData.task || '',
                flags: {
                    executor: true,
                    "output-format": "json"
                }
            });
            console.log('Transformed request body:', requestBody);
            
        } else if (targetPath.match(/^\/api\/claude-flow\/execution\/([^\/]+)$/)) {
            // Map status check route to get specific swarm
            const matches = targetPath.match(/^\/api\/claude-flow\/execution\/([^\/]+)$/);
            const swarmId = matches[1];
            targetPath = `/api/swarms/${swarmId}`;
            
        } else if (targetPath.match(/^\/api\/claude-flow\/execution\/([^\/]+)\/logs$/)) {
            // For logs, we'll need to get the swarm details and extract logs from there
            const matches = targetPath.match(/^\/api\/claude-flow\/execution\/([^\/]+)\/logs$/);
            const swarmId = matches[1];
            targetPath = `/api/swarms/${swarmId}`;
        }
        
        console.log(`Proxying to EC2: ${EC2_ENDPOINT}${targetPath}`);
        
        // Get the API key from Secrets Manager
        const apiKey = await getApiKey();
        
        // Prepare request options
        const options = {
            hostname: endpointUrl.hostname,
            port: endpointUrl.port || (endpointUrl.protocol === 'https:' ? 443 : 80),
            path: targetPath,
            method: event.httpMethod,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': apiKey
            },
            timeout: 30000 // 30 second timeout
        };
        
        // Make request to EC2
        const response = await new Promise((resolve, reject) => {
            const req = httpModule.request(options, (res) => {
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
                console.error('EC2 request error:', error);
                reject(error);
            });
            
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            // Write request body if present
            if (requestBody) {
                req.write(requestBody);
            }
            
            req.end();
        });
        
        // Parse response if JSON
        let responseBody = response.body;
        try {
            responseBody = JSON.parse(response.body);
            
            // Transform response for frontend compatibility
            if (targetPath === '/api/swarms' && responseBody.id) {
                // Map id to request_id for frontend
                responseBody.request_id = responseBody.id;
                // Ensure status field exists
                if (!responseBody.status) {
                    responseBody.status = 'processing';
                }
            } else if (targetPath.startsWith('/api/swarms/') && responseBody.id) {
                // For status checks, transform the response
                responseBody.request_id = responseBody.id;
                // If this was a logs request, extract logs if available
                if (event.path.includes('/logs') && responseBody.logs) {
                    responseBody = { logs: responseBody.logs };
                }
            }
        } catch (e) {
            // Not JSON, keep as string
        }
        
        return {
            statusCode: response.statusCode || 200,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(responseBody)
        };
        
    } catch (error) {
        console.error('Research proxy error:', error);
        
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({
                error: 'Research proxy failed',
                message: error.message,
                ec2Endpoint: EC2_ENDPOINT
            })
        };
    }
};