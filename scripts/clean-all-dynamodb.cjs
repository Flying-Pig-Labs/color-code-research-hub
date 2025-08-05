const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1',
  credentials: new AWS.SharedIniFileCredentials({ profile: 'mvp' })
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'ResearchReports';

async function getAllReports() {
  const items = [];
  let lastEvaluatedKey = null;
  
  do {
    const params = {
      TableName: TABLE_NAME
    };
    
    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = lastEvaluatedKey;
    }
    
    try {
      const result = await dynamodb.scan(params).promise();
      items.push(...(result.Items || []));
      lastEvaluatedKey = result.LastEvaluatedKey;
    } catch (error) {
      console.error('Error scanning table:', error);
      break;
    }
  } while (lastEvaluatedKey);
  
  return items;
}

async function deleteReport(reportId) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        reportId: reportId
      }
    };
    
    await dynamodb.delete(params).promise();
    return true;
  } catch (error) {
    console.error(`Error deleting report ${reportId}:`, error);
    return false;
  }
}

async function cleanAllReports() {
  console.log('🗑️  Starting complete DynamoDB cleanup...\n');
  
  // Get all reports
  console.log('📋 Fetching all reports from DynamoDB...');
  const reports = await getAllReports();
  console.log(`Found ${reports.length} total reports\n`);
  
  if (reports.length === 0) {
    console.log('✅ No reports to delete. Table is already empty.');
    return;
  }
  
  // Show what will be deleted
  console.log('Reports to be deleted:');
  reports.forEach((report, index) => {
    const name = report.vendorName || report.companyName || report.title || 'unknown';
    const team = report.team || 'no-team';
    console.log(`  ${index + 1}. ${report.reportId} - ${name} (${team})`);
  });
  
  console.log('\n⚠️  WARNING: This will delete ALL reports from DynamoDB!');
  console.log('Press Ctrl+C within 5 seconds to cancel...\n');
  
  // Give user time to cancel
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Delete all reports
  console.log('🔥 Deleting all reports...\n');
  let deleteCount = 0;
  let errorCount = 0;
  
  for (const report of reports) {
    process.stdout.write(`Deleting ${deleteCount + 1}/${reports.length}: ${report.reportId}...`);
    
    const success = await deleteReport(report.reportId);
    if (success) {
      deleteCount++;
      process.stdout.write(' ✓\n');
    } else {
      errorCount++;
      process.stdout.write(' ✗\n');
    }
  }
  
  console.log('\n📊 Cleanup Summary:');
  console.log(`  - Total reports found: ${reports.length}`);
  console.log(`  - Successfully deleted: ${deleteCount}`);
  console.log(`  - Failed to delete: ${errorCount}`);
  
  // Verify cleanup
  console.log('\n🔍 Verifying cleanup...');
  const remainingReports = await getAllReports();
  console.log(`Remaining reports in table: ${remainingReports.length}`);
  
  if (remainingReports.length === 0) {
    console.log('\n✅ DynamoDB cleanup complete! All reports have been deleted.');
  } else {
    console.log('\n⚠️  Some reports could not be deleted. Please check the errors above.');
  }
}

// Run the cleanup
cleanAllReports().catch(console.error);