/**
 * @file repositoryData.js
 * @description DynamoDB-backed repository data API handler
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

/**
 * Extract username from JWT token in Authorization header
 */
function getAuthenticatedUsername(event) {
  const authHeader = event.headers?.Authorization || event.headers?.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.substring(7);
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    // Prefer friendly name; support Cognito username and email fallbacks
    let uname = payload.name || payload.username || payload['cognito:username'] || payload.email || null;
    if (uname === 'priorww@gmail.com') uname = 'fprior';
    return uname;
  } catch (error) {
    console.error('Error parsing JWT token:', error);
    return null;
  }
}

const ddb = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(ddb);

const TABLE_NAMES = {
  REPOSITORIES: process.env.REPOSITORIES_TABLE,
  BUILD_HISTORY: process.env.BUILD_HISTORY_TABLE,
  ISSUES: process.env.ISSUES_TABLE,
  PULL_REQUESTS: process.env.PRS_TABLE,
  SHARK_REVIEWS: process.env.SHARK_REVIEWS_TABLE
};

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key,Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
  };

  // Handle API Gateway v2 event format
  const method = event.requestContext?.http?.method || event.httpMethod || '';
  const path = event.rawPath || event.path || '';

  if (method === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const pathSegments = path.split('/').filter(Boolean);

    // GET /api/repositories - List repositories for authenticated user
    if (pathSegments.length === 2 && pathSegments[0] === 'api' && pathSegments[1] === 'repositories') {
      const username = getAuthenticatedUsername(event);
      if (!username) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Authentication required' })
        };
      }

      const command = new ScanCommand({
        TableName: TABLE_NAMES.REPOSITORIES,
        FilterExpression: 'username = :username',
        ExpressionAttributeValues: {
          ':username': username
        }
      });
      
      const result = await docClient.send(command);
      
      // Transform to GitHub API format
      const repositories = result.Items.map(item => ({
        id: parseInt(item.repoId) || parseInt(item.id) || Date.now(),
        name: item.name,
        full_name: item.full_name || `${username}/${item.name}`,
        description: item.description,
        html_url: item.html_url || item.url,
        language: item.language,
        stargazers_count: item.stars || item.stargazers_count || 0,
        created_at: item.createdAt || item.created_at,
        updated_at: item.updatedAt || item.updated_at,
        private: item.private || false,
        body: item.body // Include README content
      }));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(repositories)
      };
    }

    // POST /api/repositories - Create a new repository record
    if (pathSegments.length === 2 && pathSegments[0] === 'api' && pathSegments[1] === 'repositories' && method === 'POST') {
      const username = getAuthenticatedUsername(event);
      if (!username) {
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Authentication required' })
        };
      }

      let repositoryData;
      try {
        repositoryData = JSON.parse(event.body);
      } catch (error) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Invalid JSON in request body' })
        };
      }

      // Generate a unique repository ID
      const repoId = repositoryData.name ? `${username}-${repositoryData.name}-${Date.now()}` : `${username}-${Date.now()}`;
      
      const repositoryRecord = {
        repoId: repoId,
        username: username,
        name: repositoryData.name,
        full_name: repositoryData.full_name,
        description: repositoryData.description,
        html_url: repositoryData.html_url,
        language: repositoryData.language || 'Unknown',
        stargazers_count: repositoryData.stargazers_count || 0,
        private: repositoryData.private || false,
        created_at: repositoryData.created_at || new Date().toISOString(),
        updated_at: repositoryData.updated_at || new Date().toISOString(),
        body: repositoryData.body || '', // README content
      };

      const command = new PutCommand({
        TableName: TABLE_NAMES.REPOSITORIES,
        Item: repositoryRecord
      });

      await docClient.send(command);

      return {
        statusCode: 201,
        headers: corsHeaders,
        body: JSON.stringify({
          success: true,
          repository: repositoryRecord,
          message: 'Repository record created successfully'
        })
      };
    }

    // GET /api/repositories/{repoId}/issues - Get repository issues
    if (pathSegments.length === 4 && pathSegments[0] === 'api' && pathSegments[1] === 'repositories' && pathSegments[3] === 'issues') {
      const repoId = pathSegments[2];
      
      const command = new ScanCommand({
        TableName: TABLE_NAMES.ISSUES,
        FilterExpression: 'repoId = :repoId',
        ExpressionAttributeValues: {
          ':repoId': repoId
        }
      });
      
      const result = await docClient.send(command);
      
      const issues = result.Items.map(item => ({
        id: parseInt(item.issueId),
        number: item.number,
        title: item.title,
        state: item.state,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
        repository_id: parseInt(item.repoId)
      }));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(issues)
      };
    }

    // GET /api/repositories/{repoId}/pulls - Get repository pull requests
    if (pathSegments.length === 4 && pathSegments[0] === 'api' && pathSegments[1] === 'repositories' && pathSegments[3] === 'pulls') {
      const repoId = pathSegments[2];
      
      const command = new ScanCommand({
        TableName: TABLE_NAMES.PULL_REQUESTS,
        FilterExpression: 'repoId = :repoId',
        ExpressionAttributeValues: {
          ':repoId': repoId
        }
      });
      
      const result = await docClient.send(command);
      
      const pulls = result.Items.map(item => ({
        id: parseInt(item.prId),
        number: item.number,
        title: item.title,
        state: item.state,
        created_at: item.createdAt,
        updated_at: item.updatedAt,
        merged_at: item.mergedAt,
        repository_id: parseInt(item.repoId)
      }));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(pulls)
      };
    }

    // GET /api/repositories/{repoId}/builds - Get repository build history
    if (pathSegments.length === 4 && pathSegments[0] === 'api' && pathSegments[1] === 'repositories' && pathSegments[3] === 'builds') {
      const repoId = pathSegments[2];
      
      const command = new ScanCommand({
        TableName: TABLE_NAMES.BUILD_HISTORY,
        FilterExpression: 'repoId = :repoId',
        ExpressionAttributeValues: {
          ':repoId': repoId
        }
      });
      
      const result = await docClient.send(command);
      
      const builds = result.Items.map(item => ({
        id: parseInt(item.buildId),
        status: item.status,
        start_time: item.startTime,
        end_time: item.endTime,
        logs_url: item.logs,
        artifacts_url: item.artifacts,
        repository_id: parseInt(item.repoId)
      }));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(builds)
      };
    }

    // GET /api/issues/{issueId}/comments - Get issue comments/reviews
    if (pathSegments.length === 4 && pathSegments[0] === 'api' && pathSegments[1] === 'issues' && pathSegments[3] === 'comments') {
      const issueId = pathSegments[2];
      
      const command = new ScanCommand({
        TableName: TABLE_NAMES.SHARK_REVIEWS,
        FilterExpression: 'issue_id = :issueId',
        ExpressionAttributeValues: {
          ':issueId': issueId
        }
      });
      
      const result = await docClient.send(command);
      
      const comments = result.Items.map(item => ({
        issue_id: item.issue_id,
        shark_name: item.shark_name,
        decision: item.decision,
        review_content: item.review_content,
        investment_amount: item.investment_amount,
        equity_percentage: item.equity_percentage,
        confidence_score: item.confidence_score,
        review_timestamp: item.review_timestamp,
        repository: item.repository
      }));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(comments)
      };
    }

    // GET /api/repositories/from-ideations - Get repos created by ideations
    if (pathSegments.length === 3 && pathSegments[0] === 'api' && pathSegments[1] === 'repositories' && pathSegments[2] === 'from-ideations') {
      const command = new ScanCommand({
        TableName: TABLE_NAMES.SHARK_REVIEWS
      });
      
      const result = await docClient.send(command);
      
      // Extract unique repositories from shark reviews (these are repos created from ideations)
      const repoNames = [...new Set(result.Items.map(item => item.repository))];
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(repoNames)
      };
    }

    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' })
    };

  } catch (error) {
    console.error('Repository data API error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};
