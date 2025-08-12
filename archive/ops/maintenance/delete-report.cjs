#!/usr/bin/env node

/**
 * delete-report.cjs
 * 
 * Clean deletion of a single research report from both DynamoDB and S3
 * Handles all related files including raw and processed versions
 */

const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ 
  region: 'us-east-1',
  credentials: new AWS.SharedIniFileCredentials({ profile: 'mvp' })
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

// Constants
const DYNAMODB_TABLE = 'ResearchReports';
const S3_BUCKET = 'color-code-research-results-984906149037';

/**
 * Delete a single report and all its associated data
 * @param {string} reportId - The report ID to delete
 * @param {Object} options - Options for deletion
 * @param {boolean} options.dryRun - If true, only show what would be deleted
 * @param {boolean} options.verbose - If true, show detailed progress
 * @returns {Promise<Object>} - Deletion results
 */
async function deleteReport(reportId, options = {}) {
  const { dryRun = false, verbose = false } = options;
  const results = {
    reportId,
    dynamoDeleted: false,
    s3FilesDeleted: [],
    errors: []
  };

  try {
    if (verbose) console.log(`\n🔍 Processing report: ${reportId}`);

    // Step 1: Get report from DynamoDB to find associated S3 files
    if (verbose) console.log('📋 Fetching report metadata from DynamoDB...');
    
    const getParams = {
      TableName: DYNAMODB_TABLE,
      Key: { reportId }
    };

    const reportData = await dynamodb.get(getParams).promise();
    
    if (!reportData.Item) {
      // Try scanning by requestId as fallback
      const scanParams = {
        TableName: DYNAMODB_TABLE,
        FilterExpression: 'requestId = :rid',
        ExpressionAttributeValues: { ':rid': reportId }
      };
      
      const scanResult = await dynamodb.scan(scanParams).promise();
      
      if (scanResult.Items && scanResult.Items.length > 0) {
        reportData.Item = scanResult.Items[0];
      } else {
        console.log(`⚠️  Report ${reportId} not found in DynamoDB`);
      }
    }

    // Step 2: Delete from DynamoDB
    if (reportData.Item) {
      const actualReportId = reportData.Item.reportId;
      
      if (verbose) {
        console.log(`📊 Found report in DynamoDB:`);
        console.log(`   - Report ID: ${actualReportId}`);
        console.log(`   - Team: ${reportData.Item.team || 'unknown'}`);
        console.log(`   - Created: ${reportData.Item.createdAt}`);
        console.log(`   - S3 Key: ${reportData.Item.s3Key || 'none'}`);
      }

      if (!dryRun) {
        const deleteParams = {
          TableName: DYNAMODB_TABLE,
          Key: { reportId: actualReportId }
        };
        
        await dynamodb.delete(deleteParams).promise();
        results.dynamoDeleted = true;
        if (verbose) console.log('✅ Deleted from DynamoDB');
      } else {
        console.log('🔸 [DRY RUN] Would delete from DynamoDB');
      }
    }

    // Step 3: Find and delete all S3 files
    if (verbose) console.log('\n🗂️  Searching for S3 files...');
    
    // Search patterns for this report
    const searchPrefixes = [
      `research/`,  // Raw research files
      `processed-reports/`,  // Processed reports
      `reports/`  // Alternative location
    ];

    for (const prefix of searchPrefixes) {
      const listParams = {
        Bucket: S3_BUCKET,
        Prefix: prefix
      };

      const objects = await s3.listObjectsV2(listParams).promise();
      
      if (objects.Contents) {
        // Filter for files related to this report
        const relatedFiles = objects.Contents.filter(obj => 
          obj.Key.includes(reportId) || 
          (reportData.Item && reportData.Item.requestId && obj.Key.includes(reportData.Item.requestId))
        );

        for (const file of relatedFiles) {
          if (verbose) console.log(`   📄 Found: ${file.Key} (${(file.Size / 1024).toFixed(2)} KB)`);
          
          if (!dryRun) {
            try {
              await s3.deleteObject({
                Bucket: S3_BUCKET,
                Key: file.Key
              }).promise();
              
              results.s3FilesDeleted.push(file.Key);
              if (verbose) console.log(`   ✅ Deleted: ${file.Key}`);
            } catch (error) {
              results.errors.push(`Failed to delete S3 file ${file.Key}: ${error.message}`);
              if (verbose) console.log(`   ❌ Failed to delete: ${file.Key}`);
            }
          } else {
            console.log(`   🔸 [DRY RUN] Would delete: ${file.Key}`);
            results.s3FilesDeleted.push(file.Key);
          }
        }
      }
    }

    // Summary
    if (verbose) {
      console.log(`\n📊 Summary for report ${reportId}:`);
      console.log(`   - DynamoDB: ${results.dynamoDeleted ? 'Deleted' : dryRun ? 'Would delete' : 'Not found'}`);
      console.log(`   - S3 files: ${results.s3FilesDeleted.length} ${dryRun ? 'would be deleted' : 'deleted'}`);
      if (results.errors.length > 0) {
        console.log(`   - Errors: ${results.errors.length}`);
      }
    }

    return results;

  } catch (error) {
    console.error(`❌ Error deleting report ${reportId}:`, error.message);
    results.errors.push(error.message);
    return results;
  }
}

// Export for use in other scripts
module.exports = { deleteReport };

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
Usage: node delete-report.cjs <reportId> [options]

Options:
  --dry-run    Show what would be deleted without actually deleting
  --verbose    Show detailed progress
  --help       Show this help message

Examples:
  node delete-report.cjs abc12345
  node delete-report.cjs abc12345 --dry-run --verbose
    `);
    process.exit(0);
  }

  const reportId = args[0];
  const options = {
    dryRun: args.includes('--dry-run'),
    verbose: args.includes('--verbose') || args.includes('--dry-run')
  };

  deleteReport(reportId, options)
    .then(results => {
      if (results.errors.length === 0) {
        console.log('✅ Report deletion completed successfully');
      } else {
        console.log('⚠️  Report deletion completed with errors');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}