const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');
const { BatchClient, DescribeJobsCommand } = require('@aws-sdk/client-batch');

const logsClient = new CloudWatchLogsClient({ region: process.env.AWS_REGION || 'us-east-1' });
const batchClient = new BatchClient({ region: process.env.AWS_REGION || 'us-east-1' });

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

    // First, get the actual log stream name from the Batch job
    let logStreamName;
    try {
      const describeCommand = new DescribeJobsCommand({ jobs: [jobId] });
      const jobResponse = await batchClient.send(describeCommand);
      
      if (!jobResponse.jobs || jobResponse.jobs.length === 0) {
        throw new Error('Job not found');
      }
      
      const job = jobResponse.jobs[0];
      logStreamName = job.container?.logStreamName;
      
      if (!logStreamName) {
        // Job might not have started yet
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            logs: ['Waiting for job to start...'],
            nextToken: null,
            jobId
          })
        };
      }
    } catch (batchError) {
      console.error('Error fetching job details:', batchError);
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

    // CloudWatch log group from the Batch configuration
    const logGroupName = '/mvp-backlog';

    // Prepare parameters for CloudWatch Logs
    const params = {
      logGroupName,
      logStreamNames: [logStreamName], // Use exact stream name instead of prefix
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