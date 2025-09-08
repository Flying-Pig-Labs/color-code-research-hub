/**
 * @file repositoryData.js
 * @description DynamoDB-backed repository data API handler
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

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
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const pathSegments = event.path.split('/').filter(Boolean);

    // GET /api/repositories - List all repositories
    if (pathSegments.length === 2 && pathSegments[0] === 'api' && pathSegments[1] === 'repositories') {
      const command = new ScanCommand({
        TableName: TABLE_NAMES.REPOSITORIES
      });
      
      const result = await docClient.send(command);
      
      // Transform to GitHub API format
      const repositories = result.Items.map(item => ({
        id: parseInt(item.repoId),
        name: item.name,
        full_name: `owner/${item.name}`, // You might want to store owner separately
        description: item.description,
        html_url: item.url,
        language: item.language,
        stargazers_count: item.stars || 0,
        created_at: item.createdAt,
        updated_at: item.updatedAt
      }));

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(repositories)
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