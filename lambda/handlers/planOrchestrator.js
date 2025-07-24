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

exports.handler = async (event) => {
  console.log('Orchestrator Event:', JSON.stringify(event, null, 2));
  
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
      
      // Call the existing planGeneratorV2 handler which handles all stages
      const generatorEvent = {
        body: JSON.stringify({
          projectDescription: input.projectDescription,
          selectedTeams: input.selectedTeams,
          teamFields: input.teamFields,
          githubConfig: input.githubConfig,
          metadata: input.metadata || {
            projectDescription: input.projectDescription,
            ...input.teamFields
          },
          readmeContent: input.readmeContent || ''
        }),
        path: '/api/plan/generate-cli-plan'
      };
      
      // If GitHub issues should be created, set the appropriate path
      if (input.githubConfig?.createIssues) {
        generatorEvent.path = '/api/plan/v2/create-github-issues';
      }
      
      console.log('Calling planGeneratorCLI handler...');
      const result = await planGeneratorCLI.handler(generatorEvent);
      
      if (result.statusCode !== 200) {
        throw new Error(JSON.parse(result.body).error || 'Plan generation failed');
      }
      
      // Parse the results
      const generatedData = JSON.parse(result.body);
      
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