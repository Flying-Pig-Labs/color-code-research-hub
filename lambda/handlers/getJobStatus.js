const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(dynamoClient);

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

    // Calculate progress percentage
    const stages = Object.values(job.stages || {});
    const completedStages = stages.filter(s => s.status === 'completed' || s.status === 'skipped').length;
    const totalStages = stages.length;
    const progress = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;

    // Prepare response based on job status
    const response = {
      jobId: job.jobId,
      status: job.status,
      progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      stages: job.stages,
      errors: job.errors || []
    };

    // Include results only if job is completed
    if (job.status === 'COMPLETED') {
      response.results = job.results;
    }

    // Include current stage information if processing
    if (job.status === 'PROCESSING') {
      const currentStage = Object.entries(job.stages || {})
        .find(([_, stage]) => stage.status === 'in_progress');
      
      if (currentStage) {
        response.currentStage = {
          name: currentStage[0],
          startedAt: currentStage[1].startedAt
        };
      }
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