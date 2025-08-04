/**
 * @file planGeneratorCLI.js
 * @description Lambda handler for the CLI plan generation endpoint
 * 
 * This handler implements the working plan generation logic that:
 * - Generates 10 phases (including auto-injected SplashPage)
 * - Creates 5-10 epics per phase (currently limited to phase 1)
 * - Formats epics into GitHub issues with SPARC methodology
 * 
 * Endpoints:
 * - POST /api/plan/generate-cli-plan - Generate full project plan
 * - POST /api/plan/populate-form - Auto-populate form fields from README
 * 
 * @module planGeneratorCLI
 * @requires services/llm-orchestrator-service
 * @requires services/form-populator-service
 */

const { generateProjectPlan } = require('./services/llm-orchestrator-service.js');
const { populateFormWithAI } = require('./services/form-populator-service.js');

// CORS headers for all responses
const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
  'Access-Control-Allow-Methods': 'POST,OPTIONS'
};

/**
 * AWS Lambda handler function
 * Routes requests to appropriate services based on path
 * 
 * @async
 * @param {Object} event - AWS Lambda event object
 * @param {string} event.httpMethod - HTTP method (POST, OPTIONS)
 * @param {string} event.path - Request path
 * @param {string} event.body - JSON request body
 * @returns {Promise<Object>} Lambda response with statusCode, headers, and body
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
    
    // Route: Populate form fields using AI
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