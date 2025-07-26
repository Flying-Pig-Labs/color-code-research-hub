const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

const logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
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
    // Extract job ID from path parameters
    const jobId = event.pathParameters?.jobId;
    if (!jobId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Job ID is required' })
      };
    }

    // Extract nextToken from query parameters
    const nextToken = event.queryStringParameters?.nextToken;

    // CloudWatch log group and stream names
    const logGroupName = `/aws/batch/job`;
    const logStreamName = `mvp-backlog-generator/default/${jobId}`;

    // Prepare parameters for CloudWatch Logs
    const params = {
      logGroupName,
      logStreamNamePrefix: logStreamName,
      startFromHead: true,
      limit: 100
    };

    if (nextToken) {
      params.nextToken = nextToken;
    }

    try {
      // Fetch logs from CloudWatch
      const command = new FilterLogEventsCommand(params);
      const response = await logsClient.send(command);

      // Extract log messages
      const logs = (response.events || []).map(event => event.message);

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          logs,
          nextToken: response.nextToken,
          jobId
        })
      };
    } catch (logError) {
      // If log stream doesn't exist yet, return empty logs
      if (logError.name === 'ResourceNotFoundException') {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            logs: [],
            nextToken: null,
            jobId
          })
        };
      }
      throw logError;
    }
  } catch (error) {
    console.error('Error streaming logs:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to stream logs',
        message: error.message
      })
    };
  }
};