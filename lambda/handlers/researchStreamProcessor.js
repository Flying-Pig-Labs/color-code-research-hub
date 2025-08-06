const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { DynamoDBClient, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const axios = require('axios');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

// Initialize AWS clients
const sqsClient = new SQSClient({ region: 'us-east-1' });
const dynamodbClient = new DynamoDBClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });
const secretsClient = new SecretsManagerClient({ region: 'us-east-1' });

// Environment variables
const QUEUE_URL = process.env.REPORT_PROCESSING_QUEUE_URL;
const RESEARCH_BUCKET = process.env.REPORT_BUCKET || 'color-code-research-results-984906149037';
const RESEARCH_REPORTS_TABLE = process.env.RESEARCH_REPORTS_TABLE || 'ResearchReports';

// Perplexity API configuration
const PERPLEXITY_STATUS_URL = 'https://api.perplexity.ai/async/chat/completions/';
let perplexityApiKey = null;

/**
 * Get Perplexity API key from Secrets Manager
 */
async function getPerplexityApiKey() {
    if (perplexityApiKey) return perplexityApiKey;
    
    try {
        const command = new GetSecretValueCommand({ SecretId: 'perplexity-key' });
        const response = await secretsClient.send(command);
        
        // Try to parse as JSON first, if it fails, use as plain string
        try {
            const secret = JSON.parse(response.SecretString);
            perplexityApiKey = secret.PERPLEXITY_API_KEY || secret.perplexity_api_key || secret;
        } catch (parseError) {
            // If parsing fails, it's a plain string
            perplexityApiKey = response.SecretString;
        }
        
        return perplexityApiKey;
    } catch (error) {
        console.error('Failed to retrieve Perplexity API key:', error);
        throw error;
    }
}

/**
 * Check Perplexity job status
 */
async function checkPerplexityStatus(requestId) {
    const apiKey = await getPerplexityApiKey();
    const url = `${PERPLEXITY_STATUS_URL}${requestId}`;
    
    const response = await axios.get(url, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });
    
    return response.data;
}

/**
 * Process DynamoDB Stream events and send completed research to SQS
 */
exports.handler = async (event) => {
    console.log('Processing DynamoDB stream records:', event.Records.length);
    
    const promises = event.Records.map(async (record) => {
        try {
            // Only process INSERT and MODIFY events
            if (record.eventName !== 'INSERT' && record.eventName !== 'MODIFY') {
                return;
            }
            
            const newImage = record.dynamodb.NewImage;
            const oldImage = record.dynamodb.OldImage || {};
            
            // Extract status values
            const newStatus = newImage?.status?.S;
            const oldStatus = oldImage?.status?.S;
            
            console.log(`Record ${record.eventID}: oldStatus=${oldStatus}, newStatus=${newStatus}`);
            
            // Check if this is a new research job that needs polling
            if (newStatus === 'processing' && record.eventName === 'MODIFY') {
                const reportId = newImage.reportId.S;
                const requestId = newImage.requestId?.S;
                
                if (!requestId) {
                    console.log(`Report ${reportId} has no Perplexity request ID, skipping`);
                    return;
                }
                
                console.log(`Starting to poll Perplexity for report ${reportId}, request ${requestId}`);
                
                // Start polling Perplexity
                const maxAttempts = 180; // 15 minutes with 5-second intervals
                let attempts = 0;
                let completed = false;
                
                while (attempts < maxAttempts && !completed) {
                    try {
                        const statusResponse = await checkPerplexityStatus(requestId);
                        const status = statusResponse.status;
                        
                        console.log(`Perplexity status for ${requestId}: ${status} (attempt ${attempts + 1}/${maxAttempts})`);
                        
                        if (status === 'COMPLETED') {
                            completed = true;
                            
                            // Extract content
                            const researchContent = statusResponse.response?.choices?.[0]?.message?.content || '';
                            
                            if (!researchContent) {
                                throw new Error('No content in completed response');
                            }
                            
                            // Get S3 paths from DynamoDB
                            const s3BasePath = newImage.s3BasePath?.S;
                            const userId = newImage.userId?.S || newImage.username?.S || 'fprior';
                            const team = newImage.team?.S || 'red';
                            
                            // Upload response.json to S3
                            const responseKey = `${s3BasePath}/response.json`;
                            await s3Client.send(new PutObjectCommand({
                                Bucket: RESEARCH_BUCKET,
                                Key: responseKey,
                                Body: JSON.stringify({
                                    perplexityResponse: statusResponse,
                                    content: researchContent,
                                    metadata: {
                                        reportId,
                                        requestId,
                                        team,
                                        completedAt: new Date().toISOString()
                                    }
                                }, null, 2),
                                ContentType: 'application/json'
                            }));
                            
                            // Update DynamoDB with completed status
                            await dynamodbClient.send(new UpdateItemCommand({
                                TableName: RESEARCH_REPORTS_TABLE,
                                Key: { reportId: { S: reportId } },
                                UpdateExpression: 'SET #status = :status, content = :content, s3ResponseKey = :responseKey, perplexityCompletedAt = :pca',
                                ExpressionAttributeNames: {
                                    '#status': 'status'
                                },
                                ExpressionAttributeValues: {
                                    ':status': { S: 'pending_postprocessing' },
                                    ':content': { S: researchContent },
                                    ':responseKey': { S: responseKey },
                                    ':pca': { S: new Date().toISOString() }
                                }
                            }));
                            
                            console.log(`Successfully stored Perplexity response for ${reportId}`);
                            
                            // Send to processing queue
                            const messageBody = {
                                reportId: reportId,
                                rawContent: researchContent,
                                team: team,
                                username: userId,
                                objective: newImage.metadata?.M?.title?.S || 'Research Report',
                                metadata: {
                                    title: newImage.metadata?.M?.title?.S,
                                    requester: newImage.metadata?.M?.requester?.S,
                                    vendorName: newImage.metadata?.M?.vendorName?.S,
                                    companyName: newImage.metadata?.M?.companyName?.S,
                                    model: newImage.metadata?.M?.model?.S,
                                    createdAt: newImage.createdAt?.S,
                                    completedAt: new Date().toISOString()
                                }
                            };
                            
                            await sqsClient.send(new SendMessageCommand({
                                QueueUrl: QUEUE_URL,
                                MessageBody: JSON.stringify(messageBody)
                            }));
                            
                            console.log(`Successfully sent report ${reportId} to processing queue`);
                            
                        } else if (status === 'FAILED') {
                            // Update DynamoDB with error status
                            await dynamodbClient.send(new UpdateItemCommand({
                                TableName: RESEARCH_REPORTS_TABLE,
                                Key: { reportId: { S: reportId } },
                                UpdateExpression: 'SET #status = :status, errorMessage = :error',
                                ExpressionAttributeNames: {
                                    '#status': 'status'
                                },
                                ExpressionAttributeValues: {
                                    ':status': { S: 'error' },
                                    ':error': { S: `Perplexity job failed: ${statusResponse.error_message || 'Unknown error'}` }
                                }
                            }));
                            
                            console.error(`Perplexity job failed for ${reportId}`);
                            completed = true;
                        }
                        
                    } catch (error) {
                        console.error(`Error polling Perplexity for ${reportId}:`, error);
                        
                        // On final attempt, mark as error
                        if (attempts >= maxAttempts - 1) {
                            await dynamodbClient.send(new UpdateItemCommand({
                                TableName: RESEARCH_REPORTS_TABLE,
                                Key: { reportId: { S: reportId } },
                                UpdateExpression: 'SET #status = :status, errorMessage = :error',
                                ExpressionAttributeNames: {
                                    '#status': 'status'
                                },
                                ExpressionAttributeValues: {
                                    ':status': { S: 'error' },
                                    ':error': { S: `Failed to poll Perplexity: ${error.message}` }
                                }
                            }));
                        }
                    }
                    
                    if (!completed) {
                        // Wait before next poll (5 seconds)
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        attempts++;
                    }
                }
                
                if (!completed) {
                    // Timeout
                    await dynamodbClient.send(new UpdateItemCommand({
                        TableName: RESEARCH_REPORTS_TABLE,
                        Key: { reportId: { S: reportId } },
                        UpdateExpression: 'SET #status = :status, errorMessage = :error',
                        ExpressionAttributeNames: {
                            '#status': 'status'
                        },
                        ExpressionAttributeValues: {
                            ':status': { S: 'error_timeout' },
                            ':error': { S: 'Research timed out after 15 minutes' }
                        }
                    }));
                    
                    console.error(`Research timed out for ${reportId} after ${attempts} attempts`);
                }
            }
            
        } catch (error) {
            console.error('Error processing stream record:', error);
            console.error('Record:', JSON.stringify(record, null, 2));
            // Don't throw - continue processing other records
        }
    });
    
    await Promise.all(promises);
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: `Processed ${event.Records.length} stream records`
        })
    };
};