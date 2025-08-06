/**
 * Script to clean up all reports from the ResearchReports DynamoDB table
 * This will delete ALL items in the table to allow starting fresh
 */

const { DynamoDBClient, ScanCommand, DeleteItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');

const dynamodbClient = new DynamoDBClient({ region: 'us-east-1' });
const s3Client = new S3Client({ region: 'us-east-1' });

const TABLE_NAME = 'ResearchReports';
const BUCKET_NAME = 'color-code-research-results-984906149037';

async function deleteS3Objects(prefix) {
    try {
        // List all objects with the prefix
        const listParams = {
            Bucket: BUCKET_NAME,
            Prefix: prefix
        };
        
        const listCommand = new ListObjectsV2Command(listParams);
        const listResponse = await s3Client.send(listCommand);
        
        if (!listResponse.Contents || listResponse.Contents.length === 0) {
            return 0;
        }
        
        // Delete the objects
        const deleteParams = {
            Bucket: BUCKET_NAME,
            Delete: {
                Objects: listResponse.Contents.map(obj => ({ Key: obj.Key }))
            }
        };
        
        const deleteCommand = new DeleteObjectsCommand(deleteParams);
        await s3Client.send(deleteCommand);
        
        return listResponse.Contents.length;
    } catch (error) {
        console.error(`Failed to delete S3 objects with prefix ${prefix}:`, error);
        return 0;
    }
}

async function cleanupDynamoDB() {
    console.log('🧹 Starting DynamoDB cleanup...');
    console.log(`📊 Table: ${TABLE_NAME}`);
    console.log(`🪣 S3 Bucket: ${BUCKET_NAME}`);
    console.log('');
    
    try {
        // Scan all items from the table
        const scanParams = {
            TableName: TABLE_NAME
        };
        
        const scanCommand = new ScanCommand(scanParams);
        const scanResult = await dynamodbClient.send(scanCommand);
        
        if (!scanResult.Items || scanResult.Items.length === 0) {
            console.log('✅ Table is already empty!');
            return;
        }
        
        console.log(`📋 Found ${scanResult.Items.length} reports to delete`);
        console.log('');
        
        let deletedCount = 0;
        let s3DeletedCount = 0;
        let errorCount = 0;
        
        // Delete each item
        for (const item of scanResult.Items) {
            const reportId = item.reportId?.S;
            const team = item.team?.S || 'unknown';
            const createdAt = item.createdAt?.S || 'unknown';
            
            if (!reportId) {
                console.log('⚠️  Skipping item without reportId');
                continue;
            }
            
            try {
                // Delete from DynamoDB
                const deleteParams = {
                    TableName: TABLE_NAME,
                    Key: {
                        reportId: { S: reportId }
                    }
                };
                
                const deleteCommand = new DeleteItemCommand(deleteParams);
                await dynamodbClient.send(deleteCommand);
                
                deletedCount++;
                console.log(`✅ Deleted report ${reportId} (${team} team, created ${createdAt})`);
                
                // Try to delete associated S3 objects
                // Check for different S3 path patterns
                const s3Paths = [];
                
                // New unified structure
                if (item.s3BasePath?.S) {
                    s3Paths.push(item.s3BasePath.S);
                }
                
                // Old structure with s3Prefix
                if (item.s3Prefix?.S) {
                    s3Paths.push(item.s3Prefix.S);
                }
                
                // Direct file paths
                if (item.rawS3Key?.S) {
                    s3Paths.push(item.rawS3Key.S);
                }
                
                // Try standard paths if no specific paths found
                if (s3Paths.length === 0) {
                    s3Paths.push(`users/fprior/research/${team}/${reportId}/`);
                    s3Paths.push(`reports/${reportId}/`);
                }
                
                // Delete S3 objects for each path
                for (const path of s3Paths) {
                    const count = await deleteS3Objects(path);
                    if (count > 0) {
                        s3DeletedCount += count;
                        console.log(`   🗑️  Deleted ${count} S3 objects from ${path}`);
                    }
                }
                
            } catch (error) {
                console.error(`❌ Failed to delete report ${reportId}:`, error.message);
                errorCount++;
            }
        }
        
        console.log('');
        console.log('📊 Cleanup Summary:');
        console.log(`   ✅ Deleted ${deletedCount} reports from DynamoDB`);
        console.log(`   🗑️  Deleted ${s3DeletedCount} objects from S3`);
        if (errorCount > 0) {
            console.log(`   ❌ Failed to delete ${errorCount} reports`);
        }
        console.log('');
        console.log('🎉 Cleanup completed!');
        
    } catch (error) {
        console.error('💥 Cleanup failed:', error);
        process.exit(1);
    }
}

// Run the cleanup
cleanupDynamoDB()
    .then(() => {
        console.log('✨ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('Fatal error:', error);
        process.exit(1);
    });