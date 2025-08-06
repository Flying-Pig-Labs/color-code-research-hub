#!/usr/bin/env node

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const { SQSClient, ReceiveMessageCommand, GetQueueAttributesCommand } = require('@aws-sdk/client-sqs');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Initialize AWS clients
const dynamoClient = new DynamoDBClient({ region: 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoClient);
const sqsClient = new SQSClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });

const RESEARCH_TABLE = 'ResearchReports';
const QUEUE_URL = 'https://sqs.us-east-1.amazonaws.com/984906149037/color-code-research-hub-ReportProcessingQueue';
const S3_BUCKET = 'color-code-research-results-984906149037';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

async function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkQueueMessages() {
    try {
        const command = new GetQueueAttributesCommand({
            QueueUrl: QUEUE_URL,
            AttributeNames: ['ApproximateNumberOfMessages', 'ApproximateNumberOfMessagesNotVisible']
        });
        const response = await sqsClient.send(command);
        return {
            visible: parseInt(response.Attributes.ApproximateNumberOfMessages),
            inFlight: parseInt(response.Attributes.ApproximateNumberOfMessagesNotVisible)
        };
    } catch (error) {
        console.error('Error checking queue:', error);
        return { visible: 0, inFlight: 0 };
    }
}

async function waitForProcessing(reportId, maxWaitTime = 60000) {
    const startTime = Date.now();
    let processed = false;
    
    log('\n⏳ Waiting for report processing...', 'yellow');
    
    while (Date.now() - startTime < maxWaitTime && !processed) {
        await new Promise(resolve => setTimeout(resolve, 3000)); // Check every 3 seconds
        
        try {
            // Check DynamoDB for processed summary
            const getCommand = new GetCommand({
                TableName: RESEARCH_TABLE,
                Key: { reportId }
            });
            const result = await dynamodb.send(getCommand);
            
            if (result.Item && result.Item.processedSummary) {
                processed = true;
                log('✅ Report processed successfully!', 'green');
                log(`📝 Summary: ${result.Item.processedSummary.substring(0, 100)}...`, 'cyan');
                
                // Check S3 for processed report
                if (result.Item.fullReportS3Key) {
                    log(`📦 Full report saved to S3: ${result.Item.fullReportS3Key}`, 'cyan');
                }
                
                return result.Item;
            } else {
                process.stdout.write('.');
            }
        } catch (error) {
            console.error('Error checking status:', error);
        }
    }
    
    if (!processed) {
        log('\n❌ Timeout waiting for processing', 'red');
    }
    
    return null;
}

async function runIntegrationTest() {
    log('\n🚀 Starting DynamoDB Streams → SQS → Lambda Integration Test', 'blue');
    log('=' .repeat(60), 'blue');
    
    const testReportId = `TEST-${uuidv4()}`;
    const testTeam = 'red';
    const testContent = `
# Test Research Report

This is a test report to verify the processing pipeline.

## Key Findings
1. The system is working correctly
2. DynamoDB Streams are triggering as expected
3. SQS is receiving messages
4. Lambda is processing reports

## Recommendations
- Continue monitoring the system
- Verify all components are functioning
    `;
    
    try {
        // Step 1: Check initial queue state
        log('\n📊 Step 1: Checking initial queue state...', 'cyan');
        const initialQueue = await checkQueueMessages();
        log(`   Messages in queue: ${initialQueue.visible} visible, ${initialQueue.inFlight} in-flight`, 'yellow');
        
        // Step 2: Insert a test report with status 'pending'
        log('\n📝 Step 2: Creating test report (status: pending)...', 'cyan');
        let putCommand = new PutCommand({
            TableName: RESEARCH_TABLE,
            Item: {
                reportId: testReportId,
                requestId: testReportId,
                team: testTeam,
                status: 'pending',
                title: 'Integration Test Report',
                prompt: 'Test the processing pipeline',
                content: testContent,
                createdAt: new Date().toISOString(),
                requester: 'integration-test',
                vendorName: 'test',
                companyName: 'Test Company',
                model: 'test-model'
            }
        });
        
        await dynamodb.send(putCommand);
        log(`   ✅ Created report: ${testReportId}`, 'green');
        
        // Step 3: Wait a bit to ensure no processing happens
        log('\n⏱️  Step 3: Waiting 5 seconds to ensure no processing on pending status...', 'cyan');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        const pendingQueue = await checkQueueMessages();
        log(`   Messages in queue: ${pendingQueue.visible} visible, ${pendingQueue.inFlight} in-flight`, 'yellow');
        
        if (pendingQueue.visible > initialQueue.visible) {
            log('   ❌ ERROR: Message sent to queue while status is pending!', 'red');
        } else {
            log('   ✅ Good: No message sent while status is pending', 'green');
        }
        
        // Step 4: Update status to 'completed' to trigger stream
        log('\n🔄 Step 4: Updating report status to completed...', 'cyan');
        putCommand = new PutCommand({
            TableName: RESEARCH_TABLE,
            Item: {
                reportId: testReportId,
                requestId: testReportId,
                team: testTeam,
                status: 'completed', // This should trigger the stream
                title: 'Integration Test Report',
                prompt: 'Test the processing pipeline',
                content: testContent,
                createdAt: new Date().toISOString(),
                completedAt: new Date().toISOString(),
                requester: 'integration-test',
                vendorName: 'test',
                companyName: 'Test Company',
                model: 'test-model',
                s3Files: {
                    response: `reports/${testReportId}/response.json`
                }
            }
        });
        
        await dynamodb.send(putCommand);
        log(`   ✅ Updated status to completed`, 'green');
        
        // Step 5: Check if message appears in queue
        log('\n📬 Step 5: Checking if message appears in SQS queue...', 'cyan');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Give time for stream to process
        
        const afterQueue = await checkQueueMessages();
        log(`   Messages in queue: ${afterQueue.visible} visible, ${afterQueue.inFlight} in-flight`, 'yellow');
        
        if (afterQueue.visible > initialQueue.visible || afterQueue.inFlight > initialQueue.inFlight) {
            log('   ✅ Message sent to queue!', 'green');
        } else {
            log('   ⚠️  No new messages detected in queue (might already be processed)', 'yellow');
        }
        
        // Step 6: Wait for processing to complete
        log('\n🔍 Step 6: Monitoring report processing...', 'cyan');
        const processedReport = await waitForProcessing(testReportId);
        
        if (processedReport) {
            log('\n🎉 Integration Test PASSED!', 'green');
            log('\nProcessed Report Details:', 'cyan');
            log(`   Report ID: ${processedReport.reportId}`, 'yellow');
            log(`   Status: ${processedReport.status}`, 'yellow');
            log(`   Processed At: ${processedReport.processedAt || 'N/A'}`, 'yellow');
            log(`   Summary Word Count: ${processedReport.summaryWordCount || 'N/A'}`, 'yellow');
            log(`   S3 Key: ${processedReport.fullReportS3Key || 'N/A'}`, 'yellow');
        } else {
            log('\n❌ Integration Test FAILED - Report not processed', 'red');
            log('\nTroubleshooting steps:', 'yellow');
            log('1. Check CloudWatch logs for ResearchStreamProcessorFunction', 'yellow');
            log('2. Check CloudWatch logs for ReportProcessingFunction', 'yellow');
            log('3. Check SQS Dead Letter Queue for failed messages', 'yellow');
            log('4. Verify IAM permissions for all services', 'yellow');
        }
        
        // Cleanup (optional - comment out to keep test data)
        log('\n🧹 Cleanup: Report left in DynamoDB for inspection', 'cyan');
        log(`   Report ID: ${testReportId}`, 'yellow');
        
    } catch (error) {
        log(`\n❌ Test failed with error: ${error.message}`, 'red');
        console.error(error);
    }
}

// Run the test
runIntegrationTest().catch(console.error);