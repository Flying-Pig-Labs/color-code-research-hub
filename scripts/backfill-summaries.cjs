/**
 * Script to backfill summaries for existing research reports
 * This processes all reports in DynamoDB that don't have processedSummary
 */

const AWS = require('aws-sdk');
const { ReportProcessingService } = require('../lambda/handlers/services/report-processing-service');

// Configure AWS
AWS.config.update({ 
  region: 'us-east-1',
  profile: 'mvp' // Force MVP profile
});

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

async function downloadReportFromS3(s3Key) {
  console.log(`  📥 Downloading ${s3Key}...`);
  
  try {
    const params = {
      Bucket: S3_BUCKET,
      Key: s3Key
    };
    
    const data = await s3.getObject(params).promise();
    return JSON.parse(data.Body.toString());
  } catch (error) {
    console.error(`  ❌ Failed to download ${s3Key}:`, error.message);
    return null;
  }
}

async function processReport(report) {
  console.log(`\n🔄 Processing report ${report.reportId}`);
  console.log(`  📅 Created: ${report.createdAt}`);
  console.log(`  🏢 Team: ${report.team}`);
  
  // Download the raw report from S3
  const rawReport = await downloadReportFromS3(report.s3Key);
  if (!rawReport) {
    console.log('  ⚠️  Skipping - could not download raw report');
    return false;
  }
  
  // Extract the raw content
  const rawContent = rawReport.task || rawReport.result || rawReport.content;
  if (!rawContent) {
    console.log('  ⚠️  Skipping - no content found in report');
    return false;
  }
  
  console.log(`  📏 Raw content length: ${rawContent.length} characters`);
  
  try {
    // Use the report processing service
    const reportService = new ReportProcessingService();
    
    console.log('  🤖 Generating summary with Claude 3.5 Sonnet...');
    const startTime = Date.now();
    
    const result = await reportService.processReport({
      reportId: report.reportId,
      rawContent: rawContent,
      team: report.team || 'unknown',
      objective: report.title || report.vendorName || report.companyName || 'Research analysis',
      metadata: {
        vendorName: report.vendorName,
        companyName: report.companyName,
        createdAt: report.createdAt
      },
      secrets: {}, // Will use environment variables
      timeoutMs: 60000 // 60 second timeout
    });
    
    const processingTime = Date.now() - startTime;
    
    console.log(`  ✅ Summary generated in ${(processingTime / 1000).toFixed(2)}s`);
    console.log(`  📝 Word count: ${result.wordCount}`);
    console.log(`  💾 Saved to S3: ${result.s3Key}`);
    
    // Update DynamoDB with the processed summary
    const updateParams = {
      TableName: RESEARCH_REPORTS_TABLE,
      Key: { reportId: report.reportId },
      UpdateExpression: 'SET processedSummary = :summary, summaryWordCount = :wc, processedAt = :pa, processedS3Key = :s3key',
      ExpressionAttributeValues: {
        ':summary': result.summary,
        ':wc': result.wordCount,
        ':pa': new Date().toISOString(),
        ':s3key': result.s3Key
      }
    };
    
    await dynamodb.update(updateParams).promise();
    console.log('  📋 Updated DynamoDB with summary');
    
    return true;
  } catch (error) {
    console.error(`  ❌ Error processing report:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting summary backfill process...\n');
  
  try {
    // Get all reports without summaries
    const reports = await getAllReportsWithoutSummaries();
    
    if (reports.length === 0) {
      console.log('✨ All reports already have summaries!');
      return;
    }
    
    // Process each report
    let successCount = 0;
    let failureCount = 0;
    
    for (const report of reports) {
      const success = await processReport(report);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add a longer delay to avoid rate limiting (10 seconds between reports)
      await new Promise(resolve => setTimeout(resolve, 10000));
    }
    
    console.log('\n📊 Backfill Summary:');
    console.log(`  ✅ Successfully processed: ${successCount}`);
    console.log(`  ❌ Failed: ${failureCount}`);
    console.log(`  📋 Total: ${reports.length}`);
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);