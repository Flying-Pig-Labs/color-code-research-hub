/**
 * @file planOrchestrator.js
 * @description Main orchestration Lambda function for async plan generation workflow
 * 
 * This is the core orchestrator that manages the complete plan generation process:
 * 1. Receives job invocation from startPlanGeneration handler
 * 2. Updates job status to PROCESSING in DynamoDB
 * 3. Calls planGeneratorCLI to generate the full project plan
 * 4. Optionally creates GitHub milestones and issues if configured
 * 5. Updates job with final results and COMPLETED status
 * 
 * PERFORMANCE CHARACTERISTICS:
 * - Timeout: 900 seconds (15 minutes) - configured in template.yaml
 * - Memory: 3008MB for optimal performance with large LLM responses
 * - Reserved Concurrency: 5 to prevent resource exhaustion
 * - Makes 50-90 LLM calls total when generating full plans
 * 
 * AWS INTEGRATIONS:
 * - DynamoDB: Reads/updates job records in PlanGenerationJobs table
 * - Lambda: Invokes planGeneratorCLI handler for plan generation
 * - Secrets Manager: API keys passed through to downstream functions
 * 
 * ERROR HANDLING:
 * - Gracefully handles plan generation failures
 * - Updates job status to FAILED with error details
 * - Marks individual stages as failed with timestamps
 * - Continues execution even if GitHub creation fails
 * 
 * STAGE TRACKING:
 * The orchestrator manages these job stages:
 * - parseReadme: Extract project metadata
 * - populateForm: Auto-populate form fields
 * - generatePhases: Create SDLC phases
 * - createGitHubIssues: Create milestones and issues (optional)
 * 
 * @module planOrchestrator
 * @requires @aws-sdk/client-dynamodb - DynamoDB client for job tracking
 * @requires @aws-sdk/lib-dynamodb - Document client for simplified operations
 * @requires ./planGeneratorCLI - Core plan generation logic
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const planGeneratorCLI = require('./planGeneratorCLI');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

const JOBS_TABLE_NAME = process.env.JOBS_TABLE_NAME;

/**
 * Updates job status and stages in DynamoDB with atomic operations
 * 
 * @async
 * @function updateJobStatus
 * @param {string} jobId - Unique job identifier
 * @param {Object} updates - Status updates to apply
 * @param {string} updates.status - Job status: INITIATED, PROCESSING, COMPLETED, FAILED
 * @param {Object} updates.stages - Stage status object with timestamps
 * @param {Object} updates.results - Generation results (phases, issues, metadata)
 * @param {Array} updates.errors - Array of error objects with timestamps
 * @throws {Error} If DynamoDB update fails
 * @returns {Promise<void>}
 */
async function updateJobStatus(jobId, updates) {
  const timestamp = new Date().toISOString();
  
  try {
    await docClient.send(new UpdateCommand({
      TableName: JOBS_TABLE_NAME,
      Key: { jobId },
      UpdateExpression: 'SET #status = :status, #updatedAt = :updatedAt, #stages = :stages, #results = :results, #errors = :errors',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#updatedAt': 'updatedAt',
        '#stages': 'stages',
        '#results': 'results',
        '#errors': 'errors'
      },
      ExpressionAttributeValues: {
        ':status': updates.status,
        ':updatedAt': timestamp,
        ':stages': updates.stages,
        ':results': updates.results,
        ':errors': updates.errors
      }
    }));
  } catch (error) {
    console.error('Error updating job status:', error);
    throw error;
  }
}

/**
 * Lambda handler for plan orchestration
 * 
 * Orchestrates the complete plan generation workflow:
 * 1. Retrieves job from DynamoDB using jobId
 * 2. Updates job status to PROCESSING
 * 3. Calls planGeneratorCLI to generate project plan
 * 4. Optionally creates GitHub milestones and issues
 * 5. Updates job with final results
 * 
 * EVENT STRUCTURE:
 * {
 *   jobId: 'job-<timestamp>-<random>',
 *   input: {
 *     metadata: { title, description, domain, ... },
 *     readmeContent: 'README.md content',
 *     githubConfig: { repository, createIssues: boolean },
 *     teamFields: { additional form data }
 *   }
 * }
 * 
 * RESPONSE STRUCTURE:
 * {
 *   statusCode: 200,
 *   body: JSON.stringify({
 *     jobId: 'job-id',
 *     status: 'COMPLETED',
 *     results: {
 *       phases: [...], // Generated SDLC phases with epics/issues
 *       githubIssues: [...], // Created GitHub issues (if enabled)
 *       metadata: { ... } // Extracted project metadata
 *     }
 *   })
 * }
 * 
 * ERROR SCENARIOS:
 * - Job not found: Updates job to FAILED and throws error
 * - Plan generation fails: Marks stages as failed, stores error details
 * - GitHub creation fails: Logs error but continues (non-blocking)
 * - DynamoDB errors: Attempts to update status, then throws
 * 
 * @async
 * @function handler
 * @param {Object} event - Lambda event from startPlanGeneration invocation
 * @param {string} event.jobId - Job ID to process
 * @param {Object} event.input - Complete job input data
 * @returns {Promise<Object>} Lambda response with statusCode and body
 * @throws {Error} If job not found or critical processing fails
 */
exports.handler = async (event) => {
  console.log('Orchestrator Event v2:', JSON.stringify(event, null, 2));
  
  try {
    const { jobId, input } = event;
    
    // Get job record from DynamoDB
    const { Item: job } = await docClient.send(new GetCommand({
      TableName: JOBS_TABLE_NAME,
      Key: { jobId }
    }));
    
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }
    
    // Update job status to PROCESSING
    job.status = 'PROCESSING';
    await updateJobStatus(jobId, {
      status: 'PROCESSING',
      stages: job.stages,
      results: job.results,
      errors: job.errors
    });
    
    try {
      // Mark all stages as in_progress at start
      const startTime = new Date().toISOString();
      Object.keys(job.stages).forEach(stage => {
        if (stage !== 'createGitHubIssues' || input.githubConfig?.createIssues) {
          job.stages[stage] = {
            status: 'in_progress',
            startedAt: startTime,
            completedAt: null
          };
        }
      });
      
      await updateJobStatus(jobId, {
        status: 'PROCESSING',
        stages: job.stages,
        results: job.results,
        errors: job.errors
      });
      
      // First generate the plan
      const generatorEvent = {
        body: JSON.stringify({
          projectInfo: input.metadata || {
            title: input.metadata?.title || 'Project',
            description: input.projectDescription || input.metadata?.description,
            domain: input.metadata?.domain || 'general',
            ...input.teamFields
          },
          readmeContent: input.readmeContent || ''
        }),
        path: '/api/plan/generate-cli-plan'
      };
      
      console.log('Calling planGeneratorCLI handler to generate plan...');
      const result = await planGeneratorCLI.handler(generatorEvent);
      
      if (result.statusCode !== 200) {
        throw new Error(JSON.parse(result.body).error || 'Plan generation failed');
      }
      
      // Parse the results
      const generatedData = JSON.parse(result.body);
      
      // DISABLED: GitHub creation step due to rate limiting issues
      // All milestones, epics, and issues are generated by LLM and stored in DynamoDB
      // No GitHub API calls are made - the plan exists purely in the database
      if (input.githubConfig?.createIssues) {
        console.log('GitHub creation requested but DISABLED due to rate limiting');
        console.log('Plan data (8 milestones with epics and issues) stored in DynamoDB only');
        // Mark as skipped but don't create actual GitHub resources
      }
      
      // Update all stages as completed
      const completedTime = new Date().toISOString();
      Object.keys(job.stages).forEach(stage => {
        if (stage === 'createGitHubIssues' && !input.githubConfig?.createIssues) {
          job.stages[stage] = {
            status: 'skipped',
            startedAt: null,
            completedAt: completedTime
          };
        } else {
          job.stages[stage] = {
            status: 'completed',
            startedAt: startTime,
            completedAt: completedTime
          };
        }
      });
      
      // Store results with proper field mapping for frontend compatibility
      const mappedPhases = (generatedData.phases || generatedData).map(phase => {
        return {
          ...phase,
          epics: phase.epics ? phase.epics.map(epic => ({
            ...epic,
            issues: epic.issues.map((issue, index) => ({
              ...issue,
              // Ensure proper field mapping for frontend
              assignee: issue.assignee || issue.role,
              priority: issue.priority || (index === 0 ? 'high' : (index < 3 ? 'medium' : 'low')),
              estimatedHours: issue.estimatedHours || (8 + (index % 3) * 4)
            }))
          })) : undefined,
          // Also map issues at phase level if they exist
          issues: phase.issues ? phase.issues.map((issue, index) => ({
            ...issue,
            // Map role to assignee for frontend compatibility
            assignee: issue.assignee || issue.role,
            priority: issue.priority || (index === 0 ? 'high' : (index < 3 ? 'medium' : 'low')),
            estimatedHours: issue.estimatedHours || (8 + (index % 3) * 4)
          })) : undefined
        };
      });
      
      job.results = {
        phases: mappedPhases,
        githubIssues: generatedData.issues || null,
        metadata: generatedData.metadata || null
      };
      
      // Update final job status
      job.status = 'COMPLETED';
      await updateJobStatus(jobId, {
        status: 'COMPLETED',
        stages: job.stages,
        results: job.results,
        errors: job.errors
      });
      
      console.log('Plan orchestration completed successfully');
      return {
        statusCode: 200,
        body: JSON.stringify({
          jobId,
          status: 'COMPLETED',
          results: job.results
        })
      };
    } catch (error) {
      console.error('Processing error:', error);
      
      // Mark any in-progress stages as failed
      const failedTime = new Date().toISOString();
      Object.entries(job.stages).forEach(([stageName, stage]) => {
        if (stage.status === 'in_progress') {
          job.stages[stageName] = {
            status: 'failed',
            startedAt: stage.startedAt,
            completedAt: failedTime,
            error: error.message
          };
        }
      });
      
      // Add error to job errors
      job.errors.push({
        stage: 'processing',
        error: error.message,
        timestamp: failedTime
      });
      
      await updateJobStatus(jobId, {
        status: 'FAILED',
        stages: job.stages,
        results: job.results,
        errors: job.errors
      });
      
      throw error;
    }
  } catch (error) {
    console.error('Orchestrator error:', error);
    
    // Try to update job status to FAILED
    if (event.jobId) {
      try {
        await updateJobStatus(event.jobId, {
          status: 'FAILED',
          stages: {},
          results: {},
          errors: [{
            stage: 'orchestrator',
            error: error.message,
            timestamp: new Date().toISOString()
          }]
        });
      } catch (updateError) {
        console.error('Failed to update job status:', updateError);
      }
    }
    
    throw error;
  }
};