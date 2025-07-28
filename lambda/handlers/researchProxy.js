const https = require('https');
const http = require('http');

// EC2 Claude Flow endpoint
const EC2_ENDPOINT = process.env.EC2_ENDPOINT || 'http://18.209.36.58:8080';

// Parse the EC2 endpoint
const endpointUrl = new URL(EC2_ENDPOINT);
const httpModule = endpointUrl.protocol === 'https:' ? https : http;

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
        const path = event.pathParameters?.proxy || '';
        let targetPath = '/';
        
        // Route based on the proxy path
        if (path === 'submit') {
            targetPath = '/research';
        } else if (path.startsWith('status/')) {
            const requestId = path.replace('status/', '');
            targetPath = `/execution/${requestId}`;
        }
        
        console.log(`Proxying to EC2: ${EC2_ENDPOINT}${targetPath}`);
        
        // Prepare request options
        const options = {
            hostname: endpointUrl.hostname,
            port: endpointUrl.port || (endpointUrl.protocol === 'https:' ? 443 : 80),
            path: targetPath,
            method: event.httpMethod,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
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
            if (event.body) {
                req.write(event.body);
            }
            
            req.end();
        });
        
        // Parse response if JSON
        let responseBody = response.body;
        try {
            responseBody = JSON.parse(response.body);
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