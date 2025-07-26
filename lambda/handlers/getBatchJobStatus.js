const { BatchClient, DescribeJobsCommand } = require('@aws-sdk/client-batch');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');

const batchClient = new BatchClient({ region: process.env.AWS_REGION || 'us-east-1' });
const s3Client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });

const getS3Object = async (bucket, key) => {
  try {
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key
    });
    
    const response = await s3Client.send(command);
    const body = await response.Body.transformToString();
    return JSON.parse(body);
  } catch (error) {
    console.error(`Error fetching S3 object ${bucket}/${key}:`, error);
    return null;
  }
};

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
    const customJobId = event.pathParameters?.jobId;
    if (!customJobId) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Job ID is required' })
      };
    }

    // For MVP Backlog Generator, we need to find the actual Batch job ID
    // This is a simplified approach - in production, you'd store the mapping
    const jobName = `mvp-backlog-*-${customJobId}*`;
    
    // Describe the job (you might need to list jobs first to find the right one)
    // For now, we'll assume the job ID is passed correctly
    try {
      const command = new DescribeJobsCommand({
        jobs: [customJobId]
      });
      
      const response = await batchClient.send(command);
      
      if (!response.jobs || response.jobs.length === 0) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Job not found' })
        };
      }
      
      const job = response.jobs[0];
      const result = {
        jobId: job.jobId,
        jobName: job.jobName,
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        stoppedAt: job.stoppedAt
      };
      
      // If job failed, include the reason
      if (job.status === 'FAILED' && job.statusReason) {
        result.failureReason = job.statusReason;
      }
      
      // If job succeeded, fetch results from S3
      if (job.status === 'SUCCEEDED') {
        // Extract repo name from job name or container overrides
        const repoEnv = job.container?.environment?.find(e => e.name === 'GITHUB_REPO');
        if (repoEnv && repoEnv.value) {
          const repo = repoEnv.value.split('/')[1]; // Get repo name without org
          const s3Bucket = process.env.S3_BUCKET || 'mvp-codegen-bucket';
          const s3Key = `backlogs/${repoEnv.value}/${customJobId}/summary.json`;
          
          const s3Results = await getS3Object(s3Bucket, s3Key);
          if (s3Results) {
            result.results = s3Results;
          }
        }
      }
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result)
      };
    } catch (batchError) {
      // If the job isn't found by ID, it might be because we're using custom job ID
      // In a real implementation, you'd have a DynamoDB table mapping custom IDs to Batch job IDs
      console.error('Error describing job:', batchError);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          jobId: customJobId,
          status: 'PENDING',
          message: 'Job is being processed'
        })
      };
    }
  } catch (error) {
    console.error('Error getting job status:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Failed to get job status',
        message: error.message
      })
    };
  }
};