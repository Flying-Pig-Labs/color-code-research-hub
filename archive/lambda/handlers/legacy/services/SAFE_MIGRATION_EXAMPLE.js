/**
 * @file SAFE_MIGRATION_EXAMPLE.js
 * @description Example of how to safely migrate prompts with Lambda-safe fallbacks
 * 
 * This shows the pattern to use when migrating planGenerator.js or other services
 */

// ======================================================================
// SAFE PROMPT LOADING WITH FALLBACK
// ======================================================================

let promptBuilders = {};

// Try to load external prompts, but have inline fallbacks ready
try {
  // Attempt to load the external prompt module
  const externalPrompts = require('../prompts/simple-prompt-builder');
  
  // If successful, use external prompts
  promptBuilders = {
    buildMetadataExtractionPrompt: externalPrompts.buildMetadataExtractionPrompt,
    buildMetadataImprovementPrompt: externalPrompts.buildMetadataImprovementPrompt,
    buildSimplePhaseGenerationPrompt: externalPrompts.buildSimplePhaseGenerationPrompt,
    source: 'external'
  };
  
  console.log('✅ Successfully loaded external prompts');
  
} catch (error) {
  // Log the error but don't fail
  console.warn('⚠️ Failed to load external prompts, using inline fallbacks:', error.message);
  
  // Use inline fallback implementations
  promptBuilders = {
    buildMetadataExtractionPrompt: (variables) => {
      const { content = '' } = variables;
      return `Analyze this README content and extract the following information in JSON format:
      - title: Project title
      - description: Brief description (max 200 chars)
      - domain: One of [e-commerce, social-media, productivity, healthcare, education, finance, entertainment, devtools, iot, general]
      - userTypes: Array of target user types
      - techStack: Array of technologies mentioned
      - features: Array of key features (max 5)
      - complexity: One of [simple, moderate, complex]
      
      README content:
      ${content}
      
      Return only valid JSON, no additional text.`;
    },
    
    buildMetadataImprovementPrompt: (variables) => {
      const { existingData, readmeContent } = variables;
      return `Based on this README, suggest improvements and additions to the project metadata.
      
      Current data:
      ${JSON.stringify(existingData, null, 2)}
      
      README:
      ${readmeContent}
      
      Return improved metadata in the same JSON format with better title, description, targetUsers, techStack, features, domain, and complexity.
      Return only valid JSON.`;
    },
    
    buildSimplePhaseGenerationPrompt: (variables) => {
      const { metadata } = variables;
      const techStack = (metadata.techStack || []).join(', ');
      const features = (metadata.features || []).join(', ');
      
      return `Create a project plan with 3 phases for: ${metadata.title}
        
Tech: ${techStack}
Features: ${features}

Return a JSON array with 3 phase objects. Each phase should have:
- id (string)
- name (string) 
- description (string)
- duration (string like "2 weeks")
- epics (array with 2 epics, each having: id, title, description, issues array)
- each issue should have: id, title, description, assignee (from: architect, backend-dev, frontend-dev, tester), priority (high/medium/low), estimatedHours (number 2-40)

Keep descriptions concise. Return ONLY valid JSON, no explanation.`;
    },
    
    source: 'inline'
  };
}

// ======================================================================
// USAGE IN YOUR HANDLER (same as before, no changes needed!)
// ======================================================================

async function handleMetadataExtraction(readmeContent) {
  try {
    // Build the prompt using whichever source loaded successfully
    const prompt = promptBuilders.buildMetadataExtractionPrompt({ 
      content: readmeContent 
    });
    
    // Log which source we're using (for monitoring)
    console.log(`Using ${promptBuilders.source} prompts for metadata extraction`);
    
    // Call your LLM as normal
    const response = await callClaude(prompt);
    
    return JSON.parse(response);
    
  } catch (error) {
    console.error('Error in metadata extraction:', error);
    throw error;
  }
}

async function handleMetadataImprovement(existingData, readmeContent) {
  try {
    const prompt = promptBuilders.buildMetadataImprovementPrompt({
      existingData,
      readmeContent
    });
    
    console.log(`Using ${promptBuilders.source} prompts for metadata improvement`);
    
    const response = await callClaude(prompt);
    
    return JSON.parse(response);
    
  } catch (error) {
    console.error('Error in metadata improvement:', error);
    throw error;
  }
}

async function handlePhaseGeneration(metadata) {
  try {
    const prompt = promptBuilders.buildSimplePhaseGenerationPrompt({
      metadata
    });
    
    console.log(`Using ${promptBuilders.source} prompts for phase generation`);
    
    const response = await callClaude(prompt);
    
    return JSON.parse(response);
    
  } catch (error) {
    console.error('Error in phase generation:', error);
    throw error;
  }
}

// ======================================================================
// MONITORING AND METRICS
// ======================================================================

/**
 * Report which prompt source is being used
 * This helps you monitor the migration in CloudWatch
 */
function reportPromptSource() {
  const metrics = {
    functionName: process.env.AWS_LAMBDA_FUNCTION_NAME || 'local',
    promptSource: promptBuilders.source,
    timestamp: new Date().toISOString()
  };
  
  console.log('PROMPT_SOURCE_METRIC:', JSON.stringify(metrics));
  
  // If using CloudWatch
  if (process.env.AWS_LAMBDA_FUNCTION_NAME) {
    // Could send to CloudWatch here
    // cloudwatch.putMetricData(...) 
  }
  
  return metrics;
}

// ======================================================================
// HEALTH CHECK ENDPOINT
// ======================================================================

/**
 * Health check to verify prompt loading
 * Add this as a test endpoint in your Lambda
 */
async function promptHealthCheck() {
  const health = {
    status: 'healthy',
    promptSource: promptBuilders.source,
    availableBuilders: Object.keys(promptBuilders).filter(k => k !== 'source'),
    testResults: {}
  };
  
  // Test each builder
  try {
    const testMetadata = promptBuilders.buildMetadataExtractionPrompt({ 
      content: 'test' 
    });
    health.testResults.metadataExtraction = testMetadata.length > 0 ? 'pass' : 'fail';
  } catch (e) {
    health.testResults.metadataExtraction = `error: ${e.message}`;
  }
  
  try {
    const testImprovement = promptBuilders.buildMetadataImprovementPrompt({ 
      existingData: { test: true },
      readmeContent: 'test' 
    });
    health.testResults.metadataImprovement = testImprovement.length > 0 ? 'pass' : 'fail';
  } catch (e) {
    health.testResults.metadataImprovement = `error: ${e.message}`;
  }
  
  try {
    const testPhase = promptBuilders.buildSimplePhaseGenerationPrompt({ 
      metadata: { title: 'Test Project' }
    });
    health.testResults.phaseGeneration = testPhase.length > 0 ? 'pass' : 'fail';
  } catch (e) {
    health.testResults.phaseGeneration = `error: ${e.message}`;
  }
  
  // Set overall health
  const hasFailures = Object.values(health.testResults).some(r => 
    r === 'fail' || r.startsWith('error')
  );
  
  if (hasFailures) {
    health.status = 'degraded';
  }
  
  return health;
}

// ======================================================================
// EXPORTS
// ======================================================================

module.exports = {
  // Main handlers
  handleMetadataExtraction,
  handleMetadataImprovement,
  handlePhaseGeneration,
  
  // Utilities
  reportPromptSource,
  promptHealthCheck,
  
  // Direct access to builders (for testing)
  promptBuilders
};

// ======================================================================
// EXAMPLE LAMBDA HANDLER
// ======================================================================

/**
 * Example of how this would be used in an actual Lambda handler
 */
exports.handler = async (event) => {
  // Report metrics on cold start
  reportPromptSource();
  
  // Check for health check request
  if (event.path === '/health/prompts') {
    const health = await promptHealthCheck();
    return {
      statusCode: health.status === 'healthy' ? 200 : 503,
      body: JSON.stringify(health)
    };
  }
  
  // Normal request handling
  try {
    const { action, data } = JSON.parse(event.body);
    
    switch (action) {
      case 'extractMetadata':
        const metadata = await handleMetadataExtraction(data.readme);
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            metadata,
            promptSource: promptBuilders.source 
          })
        };
        
      case 'improveMetadata':
        const improved = await handleMetadataImprovement(
          data.existing,
          data.readme
        );
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            improved,
            promptSource: promptBuilders.source 
          })
        };
        
      case 'generatePhases':
        const phases = await handlePhaseGeneration(data.metadata);
        return {
          statusCode: 200,
          body: JSON.stringify({ 
            phases,
            promptSource: promptBuilders.source 
          })
        };
        
      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Unknown action' })
        };
    }
    
  } catch (error) {
    console.error('Handler error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message,
        promptSource: promptBuilders.source,
        tip: 'Check CloudWatch logs for details'
      })
    };
  }
};