/**
 * One-time fix script to update reports with null status but completed summaries
 * This fixes the issue where completed reports show as "processing" in the frontend
 */

const { DynamoDBClient, ScanCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');

const dynamodb = new DynamoDBClient({ region: 'us-east-1' });
const RESEARCH_REPORTS_TABLE = process.env.RESEARCH_REPORTS_TABLE || 'ResearchReports';

exports.handler = async (event) => {
    console.log('Starting fix for reports with null status...');
    
    try {
        // Scan for all reports
        const scanParams = {
            TableName: RESEARCH_REPORTS_TABLE,
            ProjectionExpression: 'reportId, #status, processedSummary',
            ExpressionAttributeNames: {
                '#status': 'status'
            }
        };
        
        const scanCommand = new ScanCommand(scanParams);
        const scanResult = await dynamodb.send(scanCommand);
        
        let fixedCount = 0;
        let errorCount = 0;
        
        // Process each report
        for (const item of scanResult.Items || []) {
            const reportId = item.reportId?.S;
            const status = item.status?.S;
            const hasSummary = item.processedSummary?.S ? true : false;
            
            // Fix reports with null status but completed summary
            if (!status && hasSummary && reportId) {
                try {
                    console.log(`Fixing report ${reportId} - has summary but null status`);
                    
                    const updateParams = {
                        TableName: RESEARCH_REPORTS_TABLE,
                        Key: { reportId: { S: reportId } },
                        UpdateExpression: 'SET #status = :status, statusFixedAt = :fixedAt',
                        ExpressionAttributeNames: {
                            '#status': 'status'
                        },
                        ExpressionAttributeValues: {
                            ':status': { S: 'completed' },
                            ':fixedAt': { S: new Date().toISOString() }
                        }
                    };
                    
                    const updateCommand = new UpdateItemCommand(updateParams);
                    await dynamodb.send(updateCommand);
                    
                    fixedCount++;
                    console.log(`✅ Fixed report ${reportId}`);
                } catch (updateError) {
                    console.error(`❌ Failed to fix report ${reportId}:`, updateError);
                    errorCount++;
                }
            }
        }
        
        const summary = {
            totalReports: scanResult.Items?.length || 0,
            reportsFixed: fixedCount,
            errors: errorCount
        };
        
        console.log('Fix completed:', summary);
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Status fix completed',
                ...summary
            })
        };
        
    } catch (error) {
        console.error('Failed to fix null status reports:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Failed to fix reports',
                message: error.message
            })
        };
    }
};