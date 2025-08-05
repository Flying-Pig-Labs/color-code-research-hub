#!/usr/bin/env node

/**
 * Batch delete all research reports from DynamoDB
 * Uses BatchWriteItem for efficient deletion
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

// Configure AWS SDK
const client = new DynamoDBClient({ 
  region: 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    sessionToken: process.env.AWS_SESSION_TOKEN
  }
});
const dynamodb = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'ResearchReports';
const BATCH_SIZE = 25; // DynamoDB limit for batch operations

async function getAllReportIds() {
  console.log('📋 Scanning DynamoDB for all report IDs...');
  const items = [];
  let lastEvaluatedKey = null;

  do {
    const params = {
      TableName: TABLE_NAME,
      ProjectionExpression: 'reportId',
      ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
    };

    const result = await dynamodb.send(new ScanCommand(params));
    items.push(...result.Items);
    lastEvaluatedKey = result.LastEvaluatedKey;
    
    process.stdout.write(`\rScanned ${items.length} reports...`);
  } while (lastEvaluatedKey);

  console.log(`\n✅ Found ${items.length} reports total\n`);
  return items;
}

async function batchDeleteReports(reports) {
  console.log(`🗑️  Starting batch deletion of ${reports.length} reports...\n`);
  
  let totalDeleted = 0;
  let totalFailed = 0;

  // Process in batches of 25 (DynamoDB limit)
  for (let i = 0; i < reports.length; i += BATCH_SIZE) {
    const batch = reports.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(reports.length / BATCH_SIZE);
    
    process.stdout.write(`\rProcessing batch ${batchNumber}/${totalBatches} (${totalDeleted} deleted)...`);

    const deleteRequests = batch.map(item => ({
      DeleteRequest: {
        Key: { reportId: item.reportId }
      }
    }));

    try {
      const params = {
        RequestItems: {
          [TABLE_NAME]: deleteRequests
        }
      };

      const result = await dynamodb.send(new BatchWriteCommand(params));
      
      // Check for unprocessed items
      if (result.UnprocessedItems && result.UnprocessedItems[TABLE_NAME]) {
        totalFailed += result.UnprocessedItems[TABLE_NAME].length;
        totalDeleted += batch.length - result.UnprocessedItems[TABLE_NAME].length;
      } else {
        totalDeleted += batch.length;
      }

      // Small delay to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 50));
      
    } catch (error) {
      console.error(`\n❌ Error in batch ${batchNumber}:`, error.message);
      totalFailed += batch.length;
    }
  }

  console.log('\n\n📊 Deletion Summary:');
  console.log(`✅ Successfully deleted: ${totalDeleted} reports`);
  if (totalFailed > 0) {
    console.log(`❌ Failed to delete: ${totalFailed} reports`);
  }
  console.log(`\n✨ Batch deletion complete!`);
}

async function main() {
  try {
    // Check for AWS credentials
    const { execSync } = require('child_process');
    try {
      execSync('aws sts get-caller-identity --profile mvp', { stdio: 'pipe' });
    } catch (error) {
      console.error('❌ AWS credentials not found. Please run: aws configure --profile mvp');
      process.exit(1);
    }

    // Set AWS profile environment variables
    process.env.AWS_PROFILE = 'mvp';
    
    const reports = await getAllReportIds();
    
    if (reports.length === 0) {
      console.log('✅ No reports to delete');
      return;
    }

    console.log('⚠️  WARNING: This will permanently delete ALL reports!');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 3000));

    await batchDeleteReports(reports);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}