const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
    const corsHeaders = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
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
        console.log('Received event:', JSON.stringify(event, null, 2));
        
        // Parse the request body
        const requestBody = JSON.parse(event.body || '{}');
        const { repo } = requestBody;
        
        if (!repo) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ 
                    error: 'Missing required field: repo' 
                })
            };
        }
        
        // Generate a unique job ID
        const jobId = uuidv4();
        
        console.log(`Submitting batch job for repo: ${repo} with jobId: ${jobId}`);
        
        // Mock batch job submission for now
        // In a real implementation, this would submit to AWS Batch
        
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
                jobId: jobId,
                repo: repo,
                status: 'SUBMITTED',
                message: 'Batch job submitted successfully'
            })
        };
        
    } catch (error) {
        console.error('Error processing request:', error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};