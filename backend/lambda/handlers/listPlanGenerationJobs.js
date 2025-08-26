/**
 * @file listPlanGenerationJobs.js
 * @description List completed plan generation jobs for backlog history display
 * 
 * This Lambda function provides a list of plan generation jobs for the frontend
 * BacklogGenerationHistory component. It scans the PlanGenerationJobs DynamoDB table
 * and returns a paginated list of jobs with essential metadata.
 * 
 * ENDPOINT:
 * GET /api/plan/async/list
 * 
 * QUERY PARAMETERS:
 * - status: Filter by job status (COMPLETED, FAILED, PROCESSING, INITIATED)
 * - limit: Maximum number of jobs to return (default: 50, max: 100)
 * - lastEvaluatedKey: For pagination (base64 encoded DynamoDB key)
 * 
 * RESPONSE STRUCTURE:
 * {
 *   jobs: [
 *     {
 *       jobId: 'job-xyz123-abc789',
 *       status: 'COMPLETED|PROCESSING|FAILED|INITIATED',
 *       createdAt: '2024-01-01T00:00:00.000Z',
 *       updatedAt: '2024-01-01T00:05:30.000Z',
 *       completedAt: '2024-01-01T00:05:30.000Z', // if completed
 *       repositoryName: 'owner/repo-name',
 *       projectTitle: 'My Awesome Project',
 *       totalIssues: 45,
 *       issuesCreated: 45,
 *       error: 'Error message if failed'
 *     }
 *   ],
 *   pagination: {
 *     hasMore: boolean,
 *     lastEvaluatedKey: 'base64-encoded-key'
 *   },
 *   totalCount: 150
 * }
 * 
 * PERFORMANCE OPTIMIZATIONS:
 * - Scan operation with projection to reduce data transfer
 * - Client-side sorting by createdAt descending
 * - Pagination support for large datasets
 * - Response caching headers (5 minutes)
 * 
 * ERROR HANDLING:
 * - 400: Invalid query parameters
 * - 500: DynamoDB scan errors
 * - CORS headers for all responses
 * 
 * @module listPlanGenerationJobs
 * @requires @aws-sdk/client-dynamodb - DynamoDB client
 * @requires @aws-sdk/lib-dynamodb - Document client for simplified operations
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

const JOBS_TABLE_NAME = process.env.JOBS_TABLE_NAME;

/**
 * Extracts repository name from GitHub config
 * 
 * @function extractRepositoryName
 * @param {Object} input - Job input object
 * @returns {string|null} Repository name (owner/repo) or null
 */
const extractRepositoryName = (input) => {
  if (!input?.githubConfig?.repository) return null;
  return input.githubConfig.repository;
};

/**
 * Extracts project title from job metadata
 * 
 * @function extractProjectTitle
 * @param {Object} input - Job input object
 * @returns {string|null} Project title or null
 */
const extractProjectTitle = (input) => {
  if (input?.metadata?.title) return input.metadata.title;
  if (input?.projectDescription) return input.projectDescription;
  return null;
};

/**
 * Extracts issue counts from job results
 * 
 * @function extractIssueCounts
 * @param {Object} results - Job results object
 * @returns {Object} Object with totalIssues and issuesCreated counts
 */
const extractIssueCounts = (results) => {
  const counts = { totalIssues: 0, issuesCreated: 0 };
  
  if (results?.githubIssues) {
    counts.totalIssues = Array.isArray(results.githubIssues) ? results.githubIssues.length : 0;
    counts.issuesCreated = counts.totalIssues; // If in results, they were created
  }
  
  if (results?.phases) {
    // Count issues across all phases if githubIssues not available
    let totalFromPhases = 0;
    if (Array.isArray(results.phases)) {
      results.phases.forEach(phase => {
        if (phase.epics && Array.isArray(phase.epics)) {
          phase.epics.forEach(epic => {
            if (epic.issues && Array.isArray(epic.issues)) {
              totalFromPhases += epic.issues.length;
            }
          });
        }
      });
    }
    if (totalFromPhases > 0 && counts.totalIssues === 0) {
      counts.totalIssues = totalFromPhases;
    }
  }
  
  return counts;
};

/**
 * Transforms raw DynamoDB item to frontend-friendly format
 * 
 * @function transformJobItem
 * @param {Object} item - Raw DynamoDB job item
 * @returns {Object} Transformed job object for frontend consumption
 */
const transformJobItem = (item) => {
  const issueCounts = extractIssueCounts(item.results || {});
  
  return {
    jobId: item.jobId,
    status: item.status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    completedAt: item.status === 'COMPLETED' ? item.updatedAt : null,
    repositoryName: extractRepositoryName(item.input),
    projectTitle: extractProjectTitle(item.input),
    totalIssues: issueCounts.totalIssues,
    issuesCreated: issueCounts.issuesCreated,
    error: item.status === 'FAILED' ? (item.errors?.[0]?.message || 'Job failed') : null
  };
};

/**
 * Lambda handler for listing plan generation jobs
 * 
 * Scans DynamoDB table and returns paginated list of jobs.
 * Supports filtering by status and pagination.
 * 
 * @async
 * @function handler
 * @param {Object} event - API Gateway event
 * @param {Object} event.queryStringParameters - Query parameters
 * @returns {Promise<Object>} Lambda response with job list
 */
exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
    'Access-Control-Allow-Methods': 'OPTIONS,GET',
    'Content-Type': 'application/json',
    'Cache-Control': 'public, max-age=300' // 5 minutes cache
  };

  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const queryParams = event.queryStringParameters || {};
    const statusFilter = queryParams.status?.toUpperCase();
    const limit = Math.min(parseInt(queryParams.limit) || 50, 100);
    const lastEvaluatedKey = queryParams.lastEvaluatedKey ? 
      JSON.parse(Buffer.from(queryParams.lastEvaluatedKey, 'base64').toString()) : 
      undefined;

    console.log('Query parameters:', { statusFilter, limit, hasLastKey: !!lastEvaluatedKey });

    // Build scan parameters
    const scanParams = {
      TableName: JOBS_TABLE_NAME,
      Limit: limit,
      ProjectionExpression: 'jobId, #status, createdAt, updatedAt, #input, results, errors',
      ExpressionAttributeNames: {
        '#status': 'status', // 'status' is a reserved word in DynamoDB
        '#input': 'input'    // 'input' is a reserved word in DynamoDB
      }
    };

    // Add status filter if provided
    if (statusFilter && ['INITIATED', 'PROCESSING', 'COMPLETED', 'FAILED'].includes(statusFilter)) {
      scanParams.FilterExpression = '#status = :statusValue';
      scanParams.ExpressionAttributeValues = {
        ':statusValue': statusFilter
      };
    }

    // Add pagination if provided
    if (lastEvaluatedKey) {
      scanParams.ExclusiveStartKey = lastEvaluatedKey;
    }

    console.log('Scanning DynamoDB with params:', JSON.stringify(scanParams, null, 2));

    // Scan DynamoDB table
    const result = await docClient.send(new ScanCommand(scanParams));
    
    console.log(`Scan completed. Found ${result.Items?.length || 0} items`);

    // Transform items for frontend
    const jobs = (result.Items || [])
      .map(transformJobItem)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Most recent first

    // Prepare pagination info
    const pagination = {
      hasMore: !!result.LastEvaluatedKey,
      lastEvaluatedKey: result.LastEvaluatedKey ? 
        Buffer.from(JSON.stringify(result.LastEvaluatedKey)).toString('base64') : 
        null
    };

    const response = {
      jobs,
      pagination,
      totalCount: result.Count,
      scannedCount: result.ScannedCount
    };

    console.log(`Returning ${jobs.length} jobs`);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };

  } catch (error) {
    console.error('Error listing plan generation jobs:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Failed to list plan generation jobs',
        message: error.message
      })
    };
  }
};