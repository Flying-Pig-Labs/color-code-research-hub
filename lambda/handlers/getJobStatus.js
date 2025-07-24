const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient, {
  marshallOptions: {
    removeUndefinedValues: true
  }
});

const JOBS_TABLE_NAME = process.env.JOBS_TABLE_NAME;

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Content-Type': 'application/json'
  };

  try {
    const jobId = event.pathParameters?.jobId;
    
    if (!jobId) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Bad Request',
          message: 'Job ID is required'
        })
      };
    }

    // Get job from DynamoDB
    const { Item: job } = await docClient.send(new GetCommand({
      TableName: JOBS_TABLE_NAME,
      Key: { jobId }
    }));

    if (!job) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Not Found',
          message: `Job ${jobId} not found`
        })
      };
    }

    // Map backend stage names to frontend stage names
    const stageNameMapping = {
      'populateForm': 'Form Analysis',
      'generatePhases': 'Phase Generation',
      'epicGeneration': 'Epic Generation',
      'issueFormatting': 'Issue Formatting',
      'createGitHubIssues': 'GitHub Creation'
    };

    // Calculate progress percentage and completed stages
    const stages = Object.entries(job.stages || {});
    const completedStagesList = stages
      .filter(([_, stage]) => stage.status === 'completed' || stage.status === 'skipped')
      .map(([stageName, _]) => stageNameMapping[stageName] || stageName);
    
    const totalStages = stages.length;
    const progress = totalStages > 0 ? Math.round((completedStagesList.length / totalStages) * 100) : 0;

    // Find current stage
    let currentStageName = '';
    const currentStageEntry = stages.find(([_, stage]) => stage.status === 'in_progress');
    if (currentStageEntry) {
      currentStageName = stageNameMapping[currentStageEntry[0]] || currentStageEntry[0];
    }

    // Prepare response based on job status - map to frontend expected format
    const response = {
      jobId: job.jobId,
      status: job.status.toLowerCase(), // Frontend expects lowercase
      stage: currentStageName,
      progress,
      completedStages: completedStagesList,
      issuesCreated: 0, // Will be updated if we have this info
      totalIssues: 0, // Will be updated if we have this info
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      errors: job.errors || []
    };

    // Include results only if job is completed - note: frontend expects 'result' not 'results'
    if (job.status === 'COMPLETED' && job.results) {
      response.result = job.results;
      
      // Count total issues if available
      if (job.results.phases) {
        let totalIssues = 0;
        job.results.phases.forEach(phase => {
          if (phase.epics) {
            phase.epics.forEach(epic => {
              if (epic.issues) {
                totalIssues += epic.issues.length;
              }
            });
          } else if (phase.issues) {
            totalIssues += phase.issues.length;
          }
        });
        response.totalIssues = totalIssues;
      }
    }

    // Add error message if failed
    if (job.status === 'FAILED' && job.errors && job.errors.length > 0) {
      response.error = job.errors[job.errors.length - 1].error || 'Plan generation failed';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response)
    };
  } catch (error) {
    console.error('Error getting job status:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};