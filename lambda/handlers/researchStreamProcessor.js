const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

// Initialize AWS clients
const sqsClient = new SQSClient({ region: 'us-east-1' });

// Environment variables
const QUEUE_URL = process.env.REPORT_PROCESSING_QUEUE_URL;

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
            
            // Check if status changed from non-completed to completed
            if (newStatus === 'completed' && oldStatus !== 'completed') {
                const reportId = newImage.reportId.S;
                const content = newImage.content?.S;
                
                // Only process if we have content
                if (!content) {
                    console.log(`Report ${reportId} marked completed but has no content, skipping`);
                    return;
                }
                
                console.log(`Report ${reportId} completed, sending to processing queue`);
                
                // Prepare message for SQS
                const messageBody = {
                    reportId: reportId,
                    rawContent: content,
                    team: newImage.team?.S || 'unknown',
                    objective: newImage.prompt?.S || newImage.task?.S || '',
                    metadata: {
                        title: newImage.title?.S,
                        requester: newImage.requester?.S,
                        vendorName: newImage.vendorName?.S,
                        companyName: newImage.companyName?.S,
                        model: newImage.model?.S,
                        createdAt: newImage.createdAt?.S,
                        completedAt: newImage.completedAt?.S
                    },
                    s3Files: newImage.s3Files?.M ? {
                        request: newImage.s3Files.M.request?.S,
                        response: newImage.s3Files.M.response?.S,
                        metadata: newImage.s3Files.M.metadata?.S
                    } : null
                };
                
                // Send to SQS
                const command = new SendMessageCommand({
                    QueueUrl: QUEUE_URL,
                    MessageBody: JSON.stringify(messageBody)
                    // Note: This is a standard queue, not FIFO, so no MessageGroupId or MessageDeduplicationId
                });
                
                await sqsClient.send(command);
                console.log(`Successfully sent report ${reportId} to processing queue`);
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