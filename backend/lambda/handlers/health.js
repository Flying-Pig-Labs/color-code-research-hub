/**
 * @file health.js
 * @description Simple health check endpoint for API monitoring
 * 
 * This Lambda function provides a basic health check for the API:
 * 1. Returns HTTP 200 with health status
 * 2. Includes environment information
 * 3. Provides current timestamp
 * 4. Handles CORS for browser requests
 * 
 * MONITORING USE CASES:
 * - API Gateway health monitoring
 * - Load balancer health checks
 * - External monitoring systems (Pingdom, etc.)
 * - Frontend connectivity verification
 * 
 * ENDPOINT:
 * GET /api/health
 * 
 * RESPONSE STRUCTURE:
 * {
 *   status: 'healthy',
 *   environment: 'production|development',
 *   timestamp: '2024-01-01T00:00:00.000Z'
 * }
 * 
 * PERFORMANCE:
 * - Minimal processing overhead
 * - No external dependencies
 * - Fast response time (<50ms)
 * - 30 second timeout sufficient
 * 
 * CORS HEADERS:
 * Allows cross-origin requests from any domain for health checks.
 * 
 * @module health
 */
/**
 * Lambda handler for health check endpoint
 * 
 * Returns basic health status with timestamp and environment info.
 * Always returns 200 OK unless Lambda itself is failing.
 * 
 * RESPONSE STRUCTURE:
 * {
 *   status: 'healthy', // Always 'healthy' if function executes
 *   environment: 'production'|'development'|undefined, // From ENVIRONMENT env var
 *   timestamp: '2024-01-01T00:00:00.000Z' // Current ISO timestamp
 * }
 * 
 * HEADERS:
 * - Content-Type: application/json
 * - Access-Control-Allow-Origin: * (CORS)
 * - Access-Control-Allow-Headers: Content-Type,X-Api-Key
 * - Access-Control-Allow-Methods: GET,OPTIONS
 * 
 * @async
 * @function handler
 * @param {Object} event - API Gateway event (unused)
 * @returns {Promise<Object>} Lambda response with health status
 */
exports.handler = async (event) => {
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
      'Access-Control-Allow-Methods': 'GET,OPTIONS'
    },
    body: JSON.stringify({
      status: 'healthy',
      environment: process.env.ENVIRONMENT || 'production',
      timestamp: new Date().toISOString()
    })
  };
};