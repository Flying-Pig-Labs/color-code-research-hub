const https = require('https');
const http = require('http');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// EC2 Claude Flow endpoint - Updated to new port
const EC2_ENDPOINT = process.env.EC2_ENDPOINT || 'http://18.209.36.58:3456';

// Parse the EC2 endpoint
const endpointUrl = new URL(EC2_ENDPOINT);
const httpModule = endpointUrl.protocol === 'https:' ? https : http;

// Secrets Manager client
const secretsManager = new SecretsManagerClient({ region: 'us-east-1' });

// Cache the API key
let cachedApiKey = null;

async function getApiKey() {
    if (cachedApiKey) return cachedApiKey;
    
    try {
        const command = new GetSecretValueCommand({ 
            SecretId: 'claude-flow-research-api-key' 
        });
        const secret = await secretsManager.send(command);
        
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
        'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
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
        
        // Enhanced route mapping for all Bridge API endpoints
        if (targetPath === '/api/claude-flow/research' && event.httpMethod === 'POST') {
            // Map submission route
            targetPath = '/api/swarms';
            
            // Transform the request body
            const bodyData = JSON.parse(event.body || '{}');
            requestBody = JSON.stringify({
                objective: bodyData.task || '',
                strategy: bodyData.strategy || 'auto',
                config: {
                    maxAgents: bodyData.maxAgents || 5,
                    timeout: bodyData.timeout || 300000
                }
            });
            console.log('Transformed request body:', requestBody);
            
        } else if (targetPath === '/api/claude-flow/swarms' && event.httpMethod === 'GET') {
            // List all swarms
            targetPath = '/api/swarms';
            
        } else if (targetPath === '/api/claude-flow/swarms' && event.httpMethod === 'POST') {
            // Create new swarm (direct Bridge API call)
            targetPath = '/api/swarms';
            
        } else if (targetPath.match(/^\/api\/claude-flow\/swarms\/([^\/]+)$/) && event.httpMethod === 'GET') {
            // Get specific swarm details
            const matches = targetPath.match(/^\/api\/claude-flow\/swarms\/([^\/]+)$/);
            const swarmId = matches[1];
            targetPath = `/api/swarms/${swarmId}`;
            
        } else if (targetPath.match(/^\/api\/claude-flow\/swarms\/([^\/]+)$/) && event.httpMethod === 'DELETE') {
            // Stop specific swarm
            const matches = targetPath.match(/^\/api\/claude-flow\/swarms\/([^\/]+)$/);
            const swarmId = matches[1];
            targetPath = `/api/swarms/${swarmId}`;
            
        } else if (targetPath === '/api/claude-flow/logs' && event.httpMethod === 'GET') {
            // Aggregate logs from system status executions
            // Since the Bridge API doesn't have a dedicated logs endpoint,
            // we'll provide execution-level information
            const swarmId = queryParams.swarmId;
            
            if (swarmId) {
                // Get specific swarm logs by fetching swarm details
                targetPath = `/api/swarms/${swarmId}`;
            } else {
                // Get system-wide execution info as logs
                targetPath = '/api/system/status';
            }
            
        } else if (targetPath === '/api/claude-flow/metrics' && event.httpMethod === 'GET') {
            // Generate metrics from system status
            targetPath = '/api/system/status';
            
        } else if (targetPath === '/api/claude-flow/system/status' && event.httpMethod === 'GET') {
            // System status
            targetPath = '/api/system/status';
            
        } else if (targetPath === '/api/claude-flow/health' && event.httpMethod === 'GET') {
            // Health check
            targetPath = '/health';
            
        } else if (targetPath.match(/^\/api\/claude-flow\/execution\/([^\/]+)$/)) {
            // Legacy: Map status check route to get specific swarm
            const matches = targetPath.match(/^\/api\/claude-flow\/execution\/([^\/]+)$/);
            const swarmId = matches[1];
            targetPath = `/api/swarms/${swarmId}`;
            
        } else if (targetPath.match(/^\/api\/claude-flow\/execution\/([^\/]+)\/logs$/)) {
            // Legacy: For logs, we'll need to get the swarm details and extract logs from there
            const matches = targetPath.match(/^\/api\/claude-flow\/execution\/([^\/]+)\/logs$/);
            const swarmId = matches[1];
            targetPath = `/api/swarms/${swarmId}`;
        }
        
        // Forward query parameters for endpoints that support them
        const queryParams = event.queryStringParameters || {};
        const queryString = new URLSearchParams(queryParams).toString();
        const fullTargetPath = queryString ? `${targetPath}?${queryString}` : targetPath;
        
        console.log(`Proxying to EC2: ${EC2_ENDPOINT}${fullTargetPath}`);
        
        // Get the API key from Secrets Manager
        const apiKey = await getApiKey();
        
        // Prepare request options
        const options = {
            hostname: endpointUrl.hostname,
            port: endpointUrl.port || (endpointUrl.protocol === 'https:' ? 443 : 80),
            path: fullTargetPath,
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
            if (targetPath === '/api/swarms' && event.httpMethod === 'POST' && responseBody.id) {
                // Map swarm creation response: id to request_id for frontend compatibility
                responseBody.request_id = responseBody.id;
                responseBody.swarmId = responseBody.id;
                // Ensure status field exists
                if (!responseBody.status) {
                    responseBody.status = 'processing';
                }
            } else if (targetPath === '/api/swarms' && event.httpMethod === 'GET') {
                // List swarms response - ensure each swarm has request_id for frontend compatibility
                if (responseBody.swarms && Array.isArray(responseBody.swarms)) {
                    responseBody.swarms = responseBody.swarms.map(swarm => ({
                        ...swarm,
                        request_id: swarm.id,
                        swarmId: swarm.id
                    }));
                }
            } else if (targetPath.startsWith('/api/swarms/') && responseBody.id) {
                // For individual swarm operations
                responseBody.request_id = responseBody.id;
                responseBody.swarmId = responseBody.id;
                
                // If this was a legacy logs request, extract logs if available
                if (event.path.includes('/execution/') && event.path.includes('/logs') && responseBody.logs) {
                    responseBody = { 
                        logs: responseBody.logs,
                        swarmId: responseBody.id || responseBody.swarmId
                    };
                }
            } else if (event.path.includes('/logs')) {
                // Transform system status or swarm details into logs format
                if (targetPath === '/api/system/status' && responseBody.executions) {
                    // Transform executions into log entries
                    const logs = responseBody.executions.map(exec => ({
                        timestamp: new Date(exec.startTime).toISOString(),
                        level: 'info',
                        message: `Swarm execution started: ${exec.objective}`,
                        swarmId: exec.id,
                        metadata: {
                            duration: exec.duration,
                            strategy: exec.strategy,
                            mode: exec.mode,
                            agents: exec.agents
                        }
                    }));
                    
                    responseBody = {
                        success: true,
                        logs: logs,
                        total: logs.length
                    };
                } else if (responseBody.swarm) {
                    // Transform single swarm into log entry
                    const swarm = responseBody.swarm;
                    responseBody = {
                        success: true,
                        logs: [{
                            timestamp: new Date(swarm.startTime).toISOString(),
                            level: 'info',
                            message: `Swarm ${swarm.status}: ${swarm.objective}`,
                            swarmId: swarm.id,
                            metadata: {
                                duration: swarm.duration,
                                status: swarm.status
                            }
                        }],
                        total: 1
                    };
                }
            } else if (event.path.includes('/metrics')) {
                // Transform system status into metrics format
                if (responseBody.system && responseBody.executions) {
                    const now = Date.now();
                    const metrics = {
                        success: true,
                        timeRange: '1h',
                        metrics: {
                            executionTimes: responseBody.executions.map(exec => ({
                                timestamp: new Date(exec.startTime).toISOString(),
                                avgExecutionTime: exec.duration || (now - exec.startTime),
                                totalExecutions: 1
                            })),
                            resourceUsage: [{
                                timestamp: new Date().toISOString(),
                                memoryUsage: responseBody.system.memory.heapUsed,
                                cpuUsage: 0 // Not available in current API
                            }],
                            successRates: [{
                                timestamp: new Date().toISOString(),
                                successRate: responseBody.service.activeSwarms / (responseBody.service.totalExecutions || 1),
                                totalAttempts: responseBody.service.totalExecutions
                            }]
                        }
                    };
                    responseBody = metrics;
                }
            } else if (targetPath === '/api/system/status' || targetPath === '/health') {
                // System status/health - pass through, ensure success flag
                if (!responseBody.hasOwnProperty('success')) {
                    responseBody.success = response.statusCode >= 200 && response.statusCode < 300;
                }
                // Add timestamp if not present
                if (!responseBody.timestamp) {
                    responseBody.timestamp = new Date().toISOString();
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
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Api-Key',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                error: 'Research proxy failed',
                message: error.message,
                ec2Endpoint: EC2_ENDPOINT
            })
        };
    }
};