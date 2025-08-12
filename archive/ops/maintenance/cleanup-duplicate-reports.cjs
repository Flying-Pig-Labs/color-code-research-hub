const AWS = require('aws-sdk');

// Configure AWS SDK
AWS.config.update({
  region: 'us-east-1',
  credentials: new AWS.SharedIniFileCredentials({ profile: 'mvp' })
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'ResearchReports';

async function getReports() {
  try {
    const params = {
      TableName: TABLE_NAME
    };
    
    const result = await dynamodb.scan(params).promise();
    return result.Items || [];
  } catch (error) {
    console.error('Error scanning table:', error);
    return [];
  }
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
    console.log(`Deleted report: ${reportId}`);
  } catch (error) {
    console.error(`Error deleting report ${reportId}:`, error);
  }
}

async function cleanupDuplicates() {
  console.log('Fetching all reports...');
  const reports = await getReports();
  console.log(`Found ${reports.length} total reports`);
  
  // Group reports by title/vendor name
  const reportGroups = {};
  
  reports.forEach(report => {
    const key = report.vendorName || report.companyName || report.title || 'unknown';
    if (!reportGroups[key]) {
      reportGroups[key] = [];
    }
    reportGroups[key].push(report);
  });
  
  console.log('\nReport groups:');
  Object.entries(reportGroups).forEach(([key, group]) => {
    console.log(`- ${key}: ${group.length} reports`);
  });
  
  // Keep only specific Ippon examples
  const ipponKeepList = [
    'b8d08908-a3c1-4d0f-b02b-6b029c955091', // Latest Ippon report with summary
    'b8d08908' // Original Ippon report ID if different
  ];
  
  let deleteCount = 0;
  
  for (const [key, group] of Object.entries(reportGroups)) {
    if (key.toLowerCase().includes('ippon')) {
      // For Ippon, keep only specific IDs
      const toDelete = group.filter(report => !ipponKeepList.includes(report.reportId));
      console.log(`\nFor Ippon reports, keeping ${ipponKeepList.length}, deleting ${toDelete.length}`);
      
      for (const report of toDelete) {
        await deleteReport(report.reportId);
        deleteCount++;
      }
    } else {
      // For non-Ippon reports, keep the most recent one (with summary if available)
      if (group.length > 1) {
        // Sort by createdAt descending and prefer reports with summaries
        group.sort((a, b) => {
          // Prefer reports with processedSummary
          if (a.processedSummary && !b.processedSummary) return -1;
          if (!a.processedSummary && b.processedSummary) return 1;
          
          // Then sort by creation date
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        const toKeep = group[0];
        const toDelete = group.slice(1);
        
        console.log(`\nFor ${key}, keeping 1 report (${toKeep.reportId}), deleting ${toDelete.length} duplicates`);
        
        for (const report of toDelete) {
          await deleteReport(report.reportId);
          deleteCount++;
        }
      }
    }
  }
  
  console.log(`\nCleanup complete. Deleted ${deleteCount} duplicate reports.`);
  
  // Show final state
  console.log('\nFetching final report count...');
  const finalReports = await getReports();
  console.log(`Final report count: ${finalReports.length}`);
  
  console.log('\nRemaining reports:');
  finalReports.forEach(report => {
    const name = report.vendorName || report.companyName || report.title || 'unknown';
    const hasSummary = report.processedSummary ? 'WITH SUMMARY' : 'NO SUMMARY';
    console.log(`- ${name} (${report.reportId}) - ${hasSummary}`);
  });
}

// Run the cleanup
cleanupDuplicates().catch(console.error);