/**
 * Monitoring Proxy Lambda Functions
 * 
 * These functions proxy monitoring requests from API Gateway to the EC2 monitoring API
 * and handle the necessary data transformations for the frontend.
 */

const https = require('https');
const http = require('http');

// Configuration from environment variables
const EC2_HOST = process.env.EC2_MONITORING_HOST || '18.209.36.58';
const EC2_PORT = process.env.EC2_MONITORING_PORT || '3001';
const API_KEY = process.env.MONITORING_API_KEY || 'test';

// Common headers for all responses
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Content-Type': 'application/json'
};

/**
 * Make HTTP request to EC2 monitoring API
 */
async function makeMonitoringRequest(path, method = 'GET', body = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: EC2_HOST,
            port: EC2_PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': API_KEY
            },
            timeout: 25000 // 25 second timeout
        };

        if (body) {
            options.headers['Content-Length'] = Buffer.byteLength(body);
        }

        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    const jsonData = data ? JSON.parse(data) : {};
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonData,
                        headers: res.headers
                    });
                } catch (parseError) {
                    console.error('JSON parse error:', parseError);
                    resolve({
                        statusCode: res.statusCode,
                        data: { error: 'Invalid JSON response', raw: data },
                        headers: res.headers
                    });
                }
            });
        });

        req.on('error', (error) => {
            console.error(`Request error for ${path}:`, error);
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Request timeout for ${path}`));
        });

        if (body) {
            req.write(body);
        }
        
        req.end();
    });
}

/**
 * Transform EC2 monitoring data to frontend format
 */
function transformDashboardData(ec2Data) {
    // Transform Ram's monitoring data to match frontend expectations
    // Calculate percentages from raw values
    const cpuPercent = ec2Data.metrics?.cpu ? 
        Math.round((ec2Data.metrics.cpu.user + ec2Data.metrics.cpu.system) / 100000) : 0;
    const memoryPercent = ec2Data.metrics?.memory ? 
        Math.round((ec2Data.metrics.memory.rss / 1073741824) * 100) : 0; // Assume 1GB total
    
    return {
        timestamp: ec2Data.timestamp || new Date().toISOString(),
        metrics: ec2Data.metrics ? {
            cpu: {
                name: 'CPU Usage',
                value: cpuPercent,
                unit: '%',
                trend: [],
                threshold: 80
            },
            memory: {
                name: 'Memory Usage',
                value: memoryPercent,
                unit: '%',
                trend: [],
                threshold: 85
            },
            activeAgents: {
                name: 'Active Agents',
                value: ec2Data.agents?.active || 0,
                unit: '',
                trend: []
            },
            runningTasks: {
                name: 'Running Tasks',
                value: ec2Data.tasks?.running || 0,
                unit: '',
                trend: []
            },
            completedTasks: {
                name: 'Completed Tasks',
                value: ec2Data.tasks?.completed || 0,
                unit: '',
                trend: []
            }
        } : undefined,
        agents: ec2Data.agents?.data || [],
        tasks: ec2Data.tasks?.data || [],
        alerts: ec2Data.alerts?.data || [],
        swarm: ec2Data.swarm || {}
    };
}

/**
 * Handle dashboard data requests
 */
exports.dashboardHandler = async (event) => {
    try {
        // Handle OPTIONS preflight
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: ''
            };
        }

        console.log('Fetching dashboard data from EC2 monitoring API...');
        
        const result = await makeMonitoringRequest('/api/monitoring/dashboard');
        
        if (result.statusCode !== 200) {
            console.error('EC2 monitoring API error:', result.statusCode, result.data);
            return {
                statusCode: result.statusCode,
                headers: CORS_HEADERS,
                body: JSON.stringify({
                    error: 'Failed to fetch monitoring data',
                    details: result.data
                })
            };
        }

        // Transform data for frontend
        const transformedData = transformDashboardData(result.data);

        return {
            statusCode: 200,
            headers: CORS_HEADERS,
            body: JSON.stringify(transformedData)
        };

    } catch (error) {
        console.error('Dashboard handler error:', error);
        
        // Return fallback data if EC2 is unavailable
        const fallbackData = {
            timestamp: new Date().toISOString(),
            metrics: {
                cpu: { name: 'CPU Usage', value: 0, unit: '%', trend: [], threshold: 80 },
                memory: { name: 'Memory Usage', value: 0, unit: '%', trend: [], threshold: 85 },
                activeAgents: { name: 'Active Agents', value: 0, unit: '', trend: [] },
                runningTasks: { name: 'Running Tasks', value: 0, unit: '', trend: [] },
                completedTasks: { name: 'Completed Tasks', value: 0, unit: '', trend: [] }
            },
            agents: [],
            tasks: [],
            alerts: [{
                id: 'connection-error',
                type: 'warning',
                title: 'Monitoring Connection Error',
                message: `Unable to connect to monitoring service at ${EC2_HOST}:${EC2_PORT}`,
                timestamp: new Date().toISOString(),
                source: 'monitoring-proxy',
                acknowledged: false
            }]
        };

        return {
            statusCode: 200, // Return 200 with fallback data
            headers: CORS_HEADERS,
            body: JSON.stringify(fallbackData)
        };
    }
};

/**
 * Handle metrics requests
 */
exports.metricsHandler = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: ''
            };
        }

        const result = await makeMonitoringRequest('/api/monitoring/metrics');
        
        return {
            statusCode: result.statusCode,
            headers: CORS_HEADERS,
            body: JSON.stringify(result.data)
        };

    } catch (error) {
        console.error('Metrics handler error:', error);
        return {
            statusCode: 503,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: 'Service unavailable',
                message: 'Unable to fetch metrics from monitoring service'
            })
        };
    }
};

/**
 * Handle agents requests
 */
exports.agentsHandler = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: ''
            };
        }

        const result = await makeMonitoringRequest('/api/monitoring/agents');
        
        return {
            statusCode: result.statusCode,
            headers: CORS_HEADERS,
            body: JSON.stringify(result.data)
        };

    } catch (error) {
        console.error('Agents handler error:', error);
        return {
            statusCode: 503,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: 'Service unavailable',
                message: 'Unable to fetch agents from monitoring service'
            })
        };
    }
};

/**
 * Handle tasks requests
 */
exports.tasksHandler = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: ''
            };
        }

        const result = await makeMonitoringRequest('/api/monitoring/tasks');
        
        return {
            statusCode: result.statusCode,
            headers: CORS_HEADERS,
            body: JSON.stringify(result.data)
        };

    } catch (error) {
        console.error('Tasks handler error:', error);
        return {
            statusCode: 503,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: 'Service unavailable',
                message: 'Unable to fetch tasks from monitoring service'
            })
        };
    }
};

/**
 * Handle alerts requests and acknowledgments
 */
exports.alertsHandler = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: ''
            };
        }

        let path = '/api/monitoring/alerts';
        let method = 'GET';
        let body = null;

        // Handle alert acknowledgment
        if (event.httpMethod === 'POST' && event.pathParameters?.alertId) {
            path = `/api/monitoring/alerts/${event.pathParameters.alertId}/acknowledge`;
            method = 'POST';
            body = JSON.stringify({});
        }

        const result = await makeMonitoringRequest(path, method, body);
        
        return {
            statusCode: result.statusCode,
            headers: CORS_HEADERS,
            body: JSON.stringify(result.data)
        };

    } catch (error) {
        console.error('Alerts handler error:', error);
        return {
            statusCode: 503,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: 'Service unavailable',
                message: 'Unable to process alert request'
            })
        };
    }
};

/**
 * Handle SSE stream requests (with long-polling fallback)
 * 
 * Note: API Gateway doesn't support true SSE, so we implement long-polling
 */
exports.streamHandler = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers: CORS_HEADERS,
                body: ''
            };
        }

        // Extract query parameters for long-polling
        const queryParams = event.queryStringParameters || {};
        const timeout = parseInt(queryParams.timeout) || 30000; // 30 seconds default
        const lastUpdate = queryParams.lastUpdate;

        // Build query string for EC2 API
        const params = new URLSearchParams();
        if (timeout) params.append('timeout', timeout.toString());
        if (lastUpdate) params.append('lastUpdate', lastUpdate);

        const path = `/api/monitoring/stream?${params.toString()}`;
        
        console.log('Long-polling monitoring updates...', path);
        
        const result = await makeMonitoringRequest(path);
        
        return {
            statusCode: result.statusCode,
            headers: {
                ...CORS_HEADERS,
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
            },
            body: JSON.stringify(result.data)
        };

    } catch (error) {
        console.error('Stream handler error:', error);
        return {
            statusCode: 503,
            headers: CORS_HEADERS,
            body: JSON.stringify({
                error: 'Service unavailable',
                message: 'Unable to establish monitoring stream'
            })
        };
    }
};