/**
 * Script to deduplicate research reports by content hash
 * Keeps one copy of each unique report and deletes duplicates
 */

const AWS = require('aws-sdk');
const crypto = require('crypto');

// Configure AWS
AWS.config.update({ 
  region: 'us-east-1'
});

// Use the MVP profile if running locally
const credentials = new AWS.SharedIniFileCredentials({ profile: 'mvp' });
AWS.config.credentials = credentials;

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const RESEARCH_REPORTS_TABLE = 'ResearchReports';
const S3_BUCKET = 'color-code-research-results-984906149037';

async function getAllReportsWithoutSummaries() {
  console.log('🔍 Scanning DynamoDB for reports without summaries...');
  
  const params = {
    TableName: RESEARCH_REPORTS_TABLE,
    FilterExpression: 'attribute_not_exists(processedSummary) OR processedSummary = :empty',
    ExpressionAttributeValues: {
      ':empty': ''
    }
  };
  
  try {
    const result = await dynamodb.scan(params).promise();
    console.log(`📊 Found ${result.Items.length} reports without summaries`);
    return result.Items;
  } catch (error) {
    console.error('Error scanning DynamoDB:', error);
    throw error;
  }
}

async function getReportContentHash(s3Key) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key
    };
    
    const data = await s3.getObject(params).promise();
    const content = data.Body.toString();
    
    // Create hash of the content
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    
    return {
      hash: hash,
      content: content,
      size: content.length
    };
  } catch (error) {
    console.error(`❌ Failed to get content for ${s3Key}:`, error.message);
    return {
      hash: null,
      content: null,
      size: 0,
      error: error.message
    };
  }
}

async function deleteReport(report) {
  console.log(`  🗑️ Deleting duplicate report ${report.reportId}`);
  
  try {
    // Delete from DynamoDB
    await dynamodb.delete({
      TableName: RESEARCH_REPORTS_TABLE,
      Key: { reportId: report.reportId }
    }).promise();
    
    // Delete from S3
    await s3.deleteObject({
      Bucket: S3_BUCKET,
      Key: report.s3Key
    }).promise();
    
    console.log(`  ✅ Deleted ${report.reportId} from both DynamoDB and S3`);
    return true;
  } catch (error) {
    console.error(`  ❌ Failed to delete ${report.reportId}:`, error.message);
    return false;
  }
}

async function deduplicateReports() {
  const isDryRun = process.argv.includes('--dry-run');
  
  console.log(`🚀 Starting report deduplication${isDryRun ? ' (DRY RUN)' : ''}...\n`);
  
  try {
    const reports = await getAllReportsWithoutSummaries();
    
    if (reports.length === 0) {
      console.log('✨ No reports to deduplicate!');
      return;
    }
    
    console.log(`\n📥 Analyzing content hashes for ${reports.length} reports...`);
    
    const hashGroups = new Map(); // hash -> array of reports
    const processedReports = [];
    
    // Process each report and group by content hash
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      console.log(`  📄 ${i + 1}/${reports.length}: Analyzing ${report.reportId}...`);
      
      const contentInfo = await getReportContentHash(report.s3Key);
      
      if (contentInfo.hash) {
        const reportWithHash = {
          ...report,
          contentHash: contentInfo.hash,
          contentSize: contentInfo.size
        };
        
        if (!hashGroups.has(contentInfo.hash)) {
          hashGroups.set(contentInfo.hash, []);
        }
        hashGroups.get(contentInfo.hash).push(reportWithHash);
        processedReports.push(reportWithHash);
      } else {
        console.log(`    ⚠️ Skipping ${report.reportId} - couldn't read content`);
      }
      
      // Small delay to avoid overwhelming S3
      if (i < reports.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`\n📊 Content Analysis Complete:`);
    console.log(`  📋 Total reports analyzed: ${processedReports.length}`);
    console.log(`  🔍 Unique content hashes: ${hashGroups.size}`);
    
    // Find duplicates
    let duplicateGroups = 0;
    let totalDuplicates = 0;
    const reportsToDelete = [];
    
    console.log(`\n🔍 Duplicate Analysis:`);
    
    for (const [hash, reportsWithSameHash] of hashGroups.entries()) {
      if (reportsWithSameHash.length > 1) {
        duplicateGroups++;
        const duplicatesInGroup = reportsWithSameHash.length - 1; // Keep one, delete the rest
        totalDuplicates += duplicatesInGroup;
        
        console.log(`\n  📁 Duplicate Group ${duplicateGroups}:`);
        console.log(`     🔐 Hash: ${hash.substring(0, 16)}...`);
        console.log(`     📏 Content Size: ${reportsWithSameHash[0].contentSize.toLocaleString()} bytes`);
        console.log(`     📊 Duplicates: ${reportsWithSameHash.length} copies (keeping 1, deleting ${duplicatesInGroup})`);
        
        // Sort by creation date and keep the oldest (first created)
        reportsWithSameHash.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        const keepReport = reportsWithSameHash[0];
        const deleteReports = reportsWithSameHash.slice(1);
        
        console.log(`     ✅ KEEPING: ${keepReport.reportId} (${keepReport.createdAt}) - team: ${keepReport.team}`);
        
        deleteReports.forEach(report => {
          console.log(`     🗑️ DELETE: ${report.reportId} (${report.createdAt}) - team: ${report.team}`);
          reportsToDelete.push(report);
        });
      }
    }
    
    console.log(`\n📊 Deduplication Summary:`);
    console.log(`  🔍 Duplicate groups found: ${duplicateGroups}`);
    console.log(`  🗑️ Total duplicates to delete: ${totalDuplicates}`);
    console.log(`  ✅ Unique reports to keep: ${hashGroups.size}`);
    
    if (totalDuplicates === 0) {
      console.log(`\n✨ No duplicates found! All reports are unique.`);
      return;
    }
    
    if (isDryRun) {
      console.log(`\n💡 This was a dry run. Run without --dry-run to actually delete duplicates.`);
      return;
    }
    
    // Delete duplicates
    console.log(`\n🗑️ Deleting ${totalDuplicates} duplicate reports...`);
    
    let successCount = 0;
    let failureCount = 0;
    
    for (const report of reportsToDelete) {
      const success = await deleteReport(report);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Small delay between deletions
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n🎉 Deduplication Complete:`);
    console.log(`  ✅ Successfully deleted: ${successCount} duplicates`);
    console.log(`  ❌ Failed to delete: ${failureCount} duplicates`);
    console.log(`  📋 Remaining unique reports: ${hashGroups.size}`);
    
    if (successCount > 0) {
      console.log(`\n💡 You can now run the backfill script on the remaining ${hashGroups.size} unique reports.`);
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the deduplication
deduplicateReports().catch(console.error);