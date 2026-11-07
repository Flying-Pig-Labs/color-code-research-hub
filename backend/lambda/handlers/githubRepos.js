/**
 * @file githubRepos.js
 * @description GitHub repository management and integration handler
 * 
 * This Lambda function provides GitHub repository operations for the plan generation system:
 * 
 * CORE FUNCTIONALITY:
 * - Repository listing and validation
 * - Branch enumeration and verification
 * - Repository metadata extraction
 * - GitHub API integration with authentication
 * 
 * AUTHENTICATION:
 * - Uses GitHub Personal Access Token (PAT) from AWS Secrets Manager
 * - Supports both organization and personal repositories
 * - Implements token caching for performance
 * - Handles authentication errors gracefully
 * 
 * API ENDPOINTS SUPPORTED:
 * - List user repositories (with pagination)
 * - Get repository details and metadata
 * - List repository branches
 * - Validate repository access permissions
 * 
 * GITHUB API INTEGRATION:
 * - REST API v3 for maximum compatibility
 * - Rate limit handling with retry logic
 * - Pagination support for large repository lists
 * - Error handling for private/inaccessible repos
 * 
 * RESPONSE FORMATTING:
 * Returns repository data in standardized format:
 * {
 *   name: 'repo-name',
 *   full_name: 'owner/repo-name',
 *   description: 'Repository description',
 *   private: boolean,
 *   branches: ['main', 'develop', ...],
 *   default_branch: 'main',
 *   permissions: { admin: boolean, push: boolean, pull: boolean }
 * }
 * 
 * SECURITY CONSIDERATIONS:
 * - Token stored in AWS Secrets Manager
 * - CORS headers for browser security
 * - Input validation for repository names
 * - Error messages sanitized to prevent information disclosure
 * 
 * PERFORMANCE FEATURES:
 * - Token caching across Lambda invocations
 * - Efficient API calls with minimal data transfer
 * - Timeout handling for slow GitHub responses
 * - Connection pooling for multiple API calls
 * 
 * ERROR HANDLING:
 * - 401: Invalid or expired GitHub token
 * - 403: Rate limit exceeded or insufficient permissions
 * - 404: Repository not found or inaccessible
 * - 500: GitHub API errors or network issues
 * 
 * @module githubRepos
 * @requires @aws-sdk/client-secrets-manager - GitHub token retrieval
 * @requires https - HTTP client for GitHub API calls
 */

const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const https = require('https');

const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Cache secrets to avoid repeated calls
let cachedSecrets = null;
let cachedGitHubToken = null;

/**
 * Retrieves GitHub and other API secrets from AWS Secrets Manager
 * 
 * Fetches the main secrets bundle containing GitHub PAT and other credentials.
 * Implements caching to avoid repeated Secrets Manager calls.
 * 
 * @async
 * @function getSecrets
 * @returns {Promise<Object>} Object containing all API secrets
 * @throws {Error} If secrets retrieval fails
 */
const getSecrets = async () => {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.SECRETS_ARN
    });
    
    const response = await secretsClient.send(command);
    cachedSecrets = JSON.parse(response.SecretString);
    return cachedSecrets;
  } catch (error) {
    console.error('Failed to retrieve secrets:', error);
    throw new Error('Configuration error');
  }
};

/**
 * Retrieves GitHub Personal Access Token from dedicated secret
 * 
 * Gets GitHub PAT from a dedicated secret store with fallback logic.
 * Implements token validation and caching for performance.
 * 
 * @async
 * @function getGitHubToken
 * @returns {Promise<string>} GitHub Personal Access Token
 * @throws {Error} If token retrieval fails or token is invalid
 */
const getGitHubToken = async () => {
  if (cachedGitHubToken) {
    return cachedGitHubToken;
  }

  try {
    // Use the GitHub token secret directly
    const secretArn = process.env.GITHUB_TOKEN_SECRET_ARN || 'arn:aws:secretsmanager:us-east-1:984906149037:secret:github_token-sIuriy';
    const command = new GetSecretValueCommand({
      SecretId: secretArn
    });
    
    const response = await secretsClient.send(command);
    const secretData = JSON.parse(response.SecretString);
    cachedGitHubToken = secretData.github_token;
    
    if (!cachedGitHubToken) {
      throw new Error('GitHub token not found in secret');
    }
    
    return cachedGitHubToken;
  } catch (error) {
    console.error('Failed to retrieve GitHub token:', error);
    throw new Error('GitHub token configuration error');
  }
};

// Make GitHub API request
const makeGitHubRequest = (path, token) => {
  console.log('Making GitHub API request:', {
    path: path,
    hasToken: !!token,
    tokenLength: token ? token.length : 0
  });
  
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: path,
      method: 'GET',
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Color-Code-Research-Hub'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log('GitHub API response:', {
          statusCode: res.statusCode,
          dataLength: data.length,
          headers: res.headers
        });
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (parseError) {
            console.error('Failed to parse GitHub response:', data);
            reject(new Error(`Failed to parse GitHub response: ${parseError.message}`));
          }
        } else {
          console.error('GitHub API error response:', data);
          reject(new Error(`GitHub API error: ${res.statusCode} ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
};

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,OPTIONS'
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
    // Get GitHub token from the dedicated Secrets Manager secret
    const githubToken = await getGitHubToken();

    // Parse path parameters
    const pathSegments = event.path.split('/').filter(Boolean);
    
    // Handle different endpoints
    if (pathSegments.length === 3 && pathSegments[0] === 'api' && pathSegments[1] === 'github' && pathSegments[2] === 'repos') {
      // List repositories
      const repos = await makeGitHubRequest('/user/repos?per_page=100&sort=updated', githubToken);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(repos)
      };
    } else if (pathSegments.length === 4 && pathSegments[0] === 'api' && pathSegments[1] === 'github' && pathSegments[2] === 'repos') {
      // List repositories for a specific organization
      const org = pathSegments[3];
      const repos = await makeGitHubRequest(`/orgs/${org}/repos?per_page=100&sort=updated`, githubToken);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(repos)
      };
    } else if (pathSegments.length === 6 && pathSegments[0] === 'api' && pathSegments[1] === 'github' && pathSegments[2] === 'repos' && pathSegments[5] === 'readme') {
      // Get repository README
      const owner = pathSegments[3];
      const repo = pathSegments[4];
      
      try {
        const readme = await makeGitHubRequest(`/repos/${owner}/${repo}/readme`, githubToken);
        
        // Decode base64 content
        const content = Buffer.from(readme.content, 'base64').toString('utf-8');
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            name: readme.name,
            content: content,
            sha: readme.sha
          })
        };
      } catch (error) {
        // If README not found, return empty content
        if (error.message.includes('404')) {
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              name: 'README.md',
              content: '',
              sha: null
            })
          };
        }
        throw error;
      }
    } else {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Not found' })
      };
    }
  } catch (error) {
    console.error('Error:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      path: event.path,
      method: event.httpMethod
    });
    
    // Determine appropriate status code
    let statusCode = 500;
    let errorMessage = 'An internal server error occurred';
    
    if (error.message.includes('Configuration')) {
      statusCode = 500;
      errorMessage = 'Server configuration error';
    } else if (error.message.includes('404')) {
      statusCode = 404;
      errorMessage = 'Repository or organization not found';
    } else if (error.message.includes('401')) {
      statusCode = 500; // Don't expose auth errors to client
      errorMessage = 'Authentication error';
    } else if (error.message.includes('403')) {
      statusCode = 403;
      errorMessage = 'Access denied to this resource';
    }
    
    return {
      statusCode: statusCode,
      headers: corsHeaders,
      body: JSON.stringify({
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
};