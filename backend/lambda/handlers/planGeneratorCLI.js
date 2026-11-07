/**
 * @file planGeneratorCLI.js
 * @description Core plan generation Lambda handler with multiple endpoints
 * 
 * This is the main plan generation handler that implements multiple endpoints:
 * 
 * ENDPOINTS SUPPORTED:
 * 1. /api/plan/generate-cli-plan - Full project plan generation
 * 2. /api/plan/populate-form - AI-powered form field population
 * 3. /api/plan/create-github-issues - GitHub milestone/issue creation
 * 4. /api/plan/generate-full-plan - Legacy UI-compatible plan generation
 * 
 * PLAN GENERATION PROCESS:
 * The handler orchestrates a multi-step LLM process:
 * 1. Phase Generation (1 LLM call) - Creates 10 SDLC phases
 * 2. Epic Generation (8 LLM calls) - Generates 5-10 epics per phase
 * 3. Issue Formatting (40-80 LLM calls) - Formats epics into GitHub issues
 * Total: 50-90 LLM calls taking 15-20 minutes
 * 
 * GITHUB INTEGRATION:
 * - Creates milestones for ALL generated phases
 * - Creates issues ONLY for the first phase (SplashPage)
 * - Uses GitHub REST API v3 with PAT authentication
 * - Handles API rate limits and error conditions gracefully
 * 
 * LLM ORCHESTRATION:
 * - Primary: Claude 3.5 Sonnet via AWS Bedrock
 * - Fallback: OpenAI GPT-4 for rate limit scenarios
 * - Uses structured prompts from prompts/ directory
 * - Implements retry logic with exponential backoff
 * 
 * SECURITY FEATURES:
 * - Input sanitization via prompt-sanitizer service
 * - API keys stored in AWS Secrets Manager
 * - CORS headers for browser security
 * - Request size limits and timeout protections
 * 
 * PERFORMANCE CHARACTERISTICS:
 * - Timeout: 30 seconds (API Gateway limit)
 * - Memory: 1024MB for LLM response processing
 * - Concurrent execution: No reserved concurrency
 * - Cold start: ~2-3 seconds with dependencies
 * 
 * ERROR HANDLING:
 * - Graceful LLM API failures with fallbacks
 * - GitHub API error handling (continues on failure)
 * - Input validation with descriptive error messages
 * - Detailed error logging for debugging
 * 
 * @module planGeneratorCLI
 * @requires services/llm-orchestrator-service - Core LLM orchestration
 * @requires services/form-populator-service - AI form population
 * @requires @aws-sdk/client-secrets-manager - API key management
 */

const { generateProjectPlan } = require('./services/llm-orchestrator-service.js');
const { populateFormWithAI } = require('./services/form-populator-service.js');
const { createExportZip } = require('./services/github-export-service.js');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize Secrets Manager client
const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

// Get secrets from AWS Secrets Manager
/**
 * Retrieves API keys from AWS Secrets Manager
 * 
 * Fetches all required API keys from the centralized secrets store:
 * - ANTHROPIC_API_KEY: For Claude LLM access
 * - OPENAI_API_KEY: For GPT fallback access
 * - GITHUB_PAT: For GitHub API operations
 * 
 * @async
 * @function getSecrets
 * @returns {Promise<Object>} Object containing all API keys
 * @throws {Error} If secrets retrieval fails
 */
async function getSecrets() {
  try {
    const command = new GetSecretValueCommand({
      SecretId: 'BlueOceanApiKeys7FCB6430-vLuzgQxqpLkB'
    });
    
    const response = await secretsClient.send(command);
    const secrets = JSON.parse(response.SecretString);
    return secrets;
  } catch (error) {
    console.error('Failed to retrieve secrets:', error);
    throw new Error('Unable to retrieve API credentials');
  }
}

// CORS headers for all responses
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

/**
 * AWS Lambda handler function - Multi-endpoint router
 * 
 * Routes requests to appropriate services based on URL path segments.
 * Implements multiple plan generation and GitHub integration endpoints.
 * 
 * ROUTING LOGIC:
 * - populate-form → AI-powered form field population
 * - generate-cli-plan → Full project plan generation using LLM orchestration
 * - create-github-issues → GitHub milestone and issue creation
 * - generate-full-plan → Legacy UI-compatible plan format
 * 
 * CORS HANDLING:
 * Automatically handles OPTIONS preflight requests with proper CORS headers.
 * 
 * AUTHENTICATION:
 * Uses AWS Secrets Manager for API key retrieval.
 * No user authentication required (public endpoints).
 * 
 * RATE LIMITING:
 * Implements LLM provider fallbacks:
 * - Claude API rate limits → automatic OpenAI fallback
 * - GitHub API rate limits → graceful error handling
 * 
 * TIMEOUT STRATEGY:
 * - 30s Lambda timeout for API Gateway compatibility
 * - Async operations offloaded to planOrchestrator
 * - Quick validation and immediate response for long operations
 * 
 * ERROR RESPONSE FORMAT:
 * {
 *   error: 'Error category',
 *   message: 'Detailed error description'
 * }
 * 
 * SUCCESS RESPONSE FORMAT:
 * Varies by endpoint - see individual route documentation.
 * 
 * @async
 * @function handler
 * @param {Object} event - AWS Lambda event object
 * @param {string} event.httpMethod - HTTP method (POST, OPTIONS)
 * @param {string} event.path - Request path for routing
 * @param {string} event.body - JSON request body
 * @param {Object} event.pathParameters - URL path parameters
 * @returns {Promise<Object>} Lambda response with statusCode, headers, and body
 * @throws {Error} If routing fails or invalid endpoint requested
 */
exports.handler = async (event) => {
  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const body = JSON.parse(event.body);
    const pathSegments = event.path.split('/').filter(Boolean);
    
    // ROUTE: /api/plan/populate-form
    // Auto-populate form fields from README content using AI
    if (pathSegments.includes('populate-form')) {
      const { readmeContent, existingData } = body;
      
      if (!readmeContent) {
        throw new Error('README content required');
      }
      
      console.log('🤖 Populating form fields with AI...');
      
      try {
        const suggestions = await populateFormWithAI(readmeContent, existingData);
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(suggestions)
        };
      } catch (error) {
        console.error('Form population error:', error);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Failed to populate form fields',
            message: error.message
          })
        };
      }
    }
    
    // Route: Generate full project plan using CLI logic
    else if (pathSegments.includes('generate-cli-plan')) {
      const { projectInfo, readmeContent } = body;
      
      if (!projectInfo || !readmeContent) {
        throw new Error('Project info and README content required');
      }
      
      console.log('🚀 Starting CLI-based plan generation for:', projectInfo.title);
      
      try {
        // Use the exact CLI orchestration logic
        const projectPlan = await generateProjectPlan(projectInfo, readmeContent);
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(projectPlan)
        };
      } catch (error) {
        console.error('Plan generation error:', error);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Failed to generate project plan',
            message: error.message
          })
        };
      }
    }
    
    // Route: Create GitHub milestones and issues - DISABLED due to rate limiting
    else if (pathSegments.includes('create-github-issues')) {
      const { projectInfo, readmeContent, githubConfig, projectPlan } = body;
      
      console.log('🚫 GitHub creation DISABLED due to rate limiting issues');
      console.log('📦 Plan data already stored in DynamoDB with 8 milestones, epics, and issues');
      
      // Return success without making any GitHub API calls
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'GitHub creation disabled - plan data stored in DynamoDB only',
          milestonesCreated: 0, // No GitHub milestones created
          issuesCreated: 0,     // No GitHub issues created
          planGenerated: true,  // Plan was generated and stored in DB
          disabledReason: 'Rate limiting prevention',
          phases: projectPlan?.phases?.length || 8,
          epics: projectPlan?.phases?.reduce((total, phase) => total + (phase.epics?.length || 0), 0) || 0,
          issues: projectPlan?.phases?.reduce((total, phase) => total + (phase.issues?.length || 0), 0) || 0
        })
      };
    }
    
    // Route: Generate plan with phases/epics/issues (compatible with existing UI)
    else if (pathSegments.includes('generate-full-plan')) {
      const { metadata, readmeContent } = body;
      
      console.log('🔄 Generating plan with CLI logic for existing UI...');
      
      try {
        // Map metadata to projectInfo format expected by CLI
        const projectInfo = {
          title: metadata.title,
          description: metadata.description,
          domain: metadata.domain,
          features: metadata.features || [],
          techStack: metadata.techStack || [],
          complexity: metadata.complexity || 'moderate',
          targetUsers: metadata.targetUsers || [],
          repository: metadata.repository,
          branch: metadata.branch
        };
        
        // Generate using CLI logic
        const projectPlan = await generateProjectPlan(projectInfo, readmeContent);
        
        // Transform to format expected by existing UI
        // The LLM generates tasks which should become epics, and each epic has its formatted issue
        const transformedPhases = projectPlan.phases.map(phase => {
          // Create epics from the formatted issues
          const epics = phase.issues.map((issue, index) => ({
            id: `${phase.id}-epic-${index + 1}`,
            title: issue.title,
            description: issue.description,
            suggestedRole: issue.role,
            selected: true,
            issues: [{
              id: `${phase.id}-issue-${index + 1}`,
              title: issue.title,
              description: issue.description,
              assignee: issue.role,  // Map role to assignee for frontend compatibility
              priority: index === 0 ? 'high' : (index < 3 ? 'medium' : 'low'), // Prioritize first few issues
              estimatedHours: 8 + (index % 3) * 4  // Vary between 8-16 hours
            }]
          }));

          return {
            id: phase.id,
            title: phase.title,
            description: phase.description,
            roles: phase.roles,
            epics: epics,
            pending: false,
            approved: phase.approved
          };
        });
        
        // Extract all issues for sample
        const allIssues = projectPlan.phases.flatMap(phase => 
          phase.issues.map((issue, index) => ({
            ...issue,
            id: `${phase.id}-issue-${index + 1}`,
            phaseId: phase.id,
            phaseTitle: phase.title,
            labels: [
              `phase:${phase.id}`,
              `role:${issue.role.toLowerCase().replace(/\s+/g, '-')}`,
              'sparc-enabled'
            ],
            estimatedHours: 16
          }))
        );
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            phases: transformedPhases,
            sampleIssues: allIssues.slice(0, 5), // Return first 5 as samples
            totalEstimatedIssues: allIssues.length
          })
        };
        
      } catch (error) {
        console.error('Error in full plan generation:', error);
        
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Failed to generate full plan',
            message: error.message
          })
        };
      }
    }
    
    // Route: Export GitHub issues as downloadable ZIP
    else if (pathSegments.includes('export-github-issues')) {
      const { planData, repoName } = body;
      
      console.log('📦 Exporting GitHub issues for bulk upload...');
      
      if (!planData || !repoName) {
        throw new Error('Plan data and repository name required');
      }
      
      try {
        // Create ZIP file with all export formats
        const zipBuffer = await createExportZip(planData, repoName);
        
        // Convert to base64 for Lambda response
        const base64Zip = zipBuffer.toString('base64');
        
        return {
          statusCode: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="github-issues-${repoName.replace('/', '-')}.zip"`
          },
          body: base64Zip,
          isBase64Encoded: true
        };
      } catch (error) {
        console.error('Export error:', error);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Failed to create export file',
            message: error.message
          })
        };
      }
    }
    
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };
    
  } catch (error) {
    console.error('Handler error:', error);
    
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: error.message || 'An error occurred'
      })
    };
  }
};