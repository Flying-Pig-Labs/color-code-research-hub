/**
 * Script to review remaining research reports without summaries
 * This fetches report details from DynamoDB to help identify duplicates
 */

const AWS = require('aws-sdk');

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
    console.log(`📊 Found ${result.Items.length} reports without summaries\n`);
    return result.Items;
  } catch (error) {
    console.error('Error scanning DynamoDB:', error);
    throw error;
  }
}

async function getReportContent(s3Key) {
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key
    };
    
    const data = await s3.getObject(params).promise();
    const content = JSON.parse(data.Body.toString());
    
    // Extract key info from the content
    const rawContent = content.task || content.result || content.content || '';
    const firstLine = rawContent.split('\n')[0] || '';
    const wordCount = rawContent.split(/\s+/).length;
    
    return {
      contentLength: rawContent.length,
      wordCount: wordCount,
      firstLine: firstLine.substring(0, 150) + (firstLine.length > 150 ? '...' : ''),
      hasTask: !!content.task,
      hasResult: !!content.result,
      hasContent: !!content.content
    };
  } catch (error) {
    return {
      error: error.message,
      contentLength: 0,
      wordCount: 0,
      firstLine: 'Error loading content'
    };
  }
}

async function reviewReports() {
  try {
    const reports = await getAllReportsWithoutSummaries();
    
    if (reports.length === 0) {
      console.log('✨ All reports already have summaries!');
      return;
    }
    
    console.log('📋 DETAILED REPORT REVIEW:\n');
    console.log('=' .repeat(120));
    
    for (let i = 0; i < reports.length; i++) {
      const report = reports[i];
      
      console.log(`\n📄 REPORT ${i + 1}/${reports.length}`);
      console.log('─'.repeat(80));
      console.log(`🆔 ID: ${report.reportId}`);
      console.log(`📅 Created: ${report.createdAt}`);
      console.log(`🏢 Team: ${report.team || 'unknown'}`);
      console.log(`🔑 S3 Key: ${report.s3Key}`);
      
      if (report.vendorName) console.log(`🏪 Vendor: ${report.vendorName}`);
      if (report.companyName) console.log(`🏢 Company: ${report.companyName}`);
      if (report.title) console.log(`📝 Title: ${report.title}`);
      
      // Get content preview
      console.log(`\n📥 Fetching content preview...`);
      const contentInfo = await getReportContent(report.s3Key);
      
      if (contentInfo.error) {
        console.log(`❌ Error: ${contentInfo.error}`);
      } else {
        console.log(`📏 Content Length: ${contentInfo.contentLength.toLocaleString()} chars`);
        console.log(`📊 Word Count: ${contentInfo.wordCount.toLocaleString()} words`);
        console.log(`🔍 Structure: task=${contentInfo.hasTask}, result=${contentInfo.hasResult}, content=${contentInfo.hasContent}`);
        console.log(`📖 First Line: ${contentInfo.firstLine}`);
      }
      
      // Add a small delay to avoid overwhelming S3
      if (i < reports.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    console.log('\n' + '='.repeat(120));
    console.log(`\n📊 SUMMARY:`);
    console.log(`  📋 Total reports: ${reports.length}`);
    
    // Group by team
    const teamCounts = {};
    reports.forEach(report => {
      const team = report.team || 'unknown';
      teamCounts[team] = (teamCounts[team] || 0) + 1;
    });
    
    console.log(`  🏢 By team:`);
    Object.entries(teamCounts).forEach(([team, count]) => {
      console.log(`     ${team}: ${count} reports`);
    });
    
    // Group by hour
    const hourCounts = {};
    reports.forEach(report => {
      const hour = report.createdAt ? report.createdAt.substring(11, 13) : 'unknown';
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    console.log(`  🕐 By hour:`);
    Object.entries(hourCounts).sort().forEach(([hour, count]) => {
      console.log(`     ${hour}:xx - ${count} reports`);
    });
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the review
reviewReports().catch(console.error);