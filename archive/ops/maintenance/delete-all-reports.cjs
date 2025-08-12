#!/usr/bin/env node

/**
 * Script to delete ALL research reports from DynamoDB and S3
 * WARNING: This will permanently delete all reports!
 */

const { execSync } = require('child_process');

async function getAllReportIds() {
  console.log('📋 Fetching all report IDs from DynamoDB...');
  const command = `aws dynamodb scan --table-name ResearchReports --profile mvp --region us-east-1 --query "Items[*].reportId.S" --output json`;
  const result = execSync(command, { encoding: 'utf8' });
  return JSON.parse(result);
}

async function deleteReport(reportId) {
  try {
    // Delete from DynamoDB
    const deleteCommand = `aws dynamodb delete-item --table-name ResearchReports --key '{"reportId":{"S":"${reportId}"}}' --profile mvp --region us-east-1`;
    execSync(deleteCommand);
    return true;
  } catch (error) {
    console.error(`❌ Failed to delete ${reportId}:`, error.message);
    return false;
  }
}

async function deleteAllReports() {
  try {
    const reportIds = await getAllReportIds();
    console.log(`\n🗑️  Found ${reportIds.length} reports to delete\n`);

    if (reportIds.length === 0) {
      console.log('✅ No reports to delete');
      return;
    }

    // Confirm deletion
    console.log('⚠️  WARNING: This will permanently delete ALL reports!');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    await new Promise(resolve => setTimeout(resolve, 5000));

    let deleted = 0;
    let failed = 0;

    // Process in batches to avoid rate limiting
    const batchSize = 25;
    for (let i = 0; i < reportIds.length; i += batchSize) {
      const batch = reportIds.slice(i, i + batchSize);
      
      console.log(`\nProcessing batch ${Math.floor(i/batchSize) + 1} of ${Math.ceil(reportIds.length/batchSize)}...`);
      
      await Promise.all(batch.map(async (reportId) => {
        const success = await deleteReport(reportId);
        if (success) {
          deleted++;
          process.stdout.write('.');
        } else {
          failed++;
          process.stdout.write('x');
        }
      }));
      
      // Small delay between batches
      if (i + batchSize < reportIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log('\n\n📊 Deletion Summary:');
    console.log(`✅ Successfully deleted: ${deleted} reports`);
    if (failed > 0) {
      console.log(`❌ Failed to delete: ${failed} reports`);
    }
    console.log(`\n✨ Total processed: ${reportIds.length} reports`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

// Run the deletion
deleteAllReports();