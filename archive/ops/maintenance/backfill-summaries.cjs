/**
 * Script to backfill summaries for existing research reports
 * This processes all reports in DynamoDB that don't have processedSummary
 */

const AWS = require('aws-sdk');
const https = require('https');

// Configure AWS - Use environment variables or shared credentials
AWS.config.update({ 
  region: 'us-east-1'
});

// Use the MVP profile if running locally
const credentials = new AWS.SharedIniFileCredentials({ profile: 'mvp' });
AWS.config.credentials = credentials;

const dynamodb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();
const secretsManager = new AWS.SecretsManager();

const RESEARCH_REPORTS_TABLE = 'ResearchReports';
const S3_BUCKET = 'color-code-research-results-984906149037';
const OPENAI_SECRET_ARN = 'arn:aws:secretsmanager:us-east-1:984906149037:secret:openai_key-PkoBXY';

let OPENAI_API_KEY = null;

async function loadSecrets() {
  console.log('🔑 Loading OpenAI API key from AWS Secrets Manager...');
  
  try {
    const result = await secretsManager.getSecretValue({ SecretId: OPENAI_SECRET_ARN }).promise();
    const secrets = JSON.parse(result.SecretString);
    
    OPENAI_API_KEY = secrets.openai_key;
    
    if (!OPENAI_API_KEY) {
      throw new Error('openai_key not found in secrets');
    }
    
    console.log('✅ OpenAI API key loaded successfully');
    return secrets;
  } catch (error) {
    console.error('❌ Failed to load OpenAI API key:', error.message);
    throw error;
  }
}

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

async function generateSummaryWithOpenAI(content) {
  console.log('  🤖 Generating 120-word summary with OpenAI GPT-4...');
  
  const prompt = `Please create a concise, professional 120-word executive summary of the following research report. Focus on key findings, opportunities, and actionable insights. Make it engaging and informative:

${content.substring(0, 15000)}`; // Limit content to avoid token limits

  const payload = JSON.stringify({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: prompt
      }
    ],
    max_tokens: 200,
    temperature: 0.3
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response.error) {
            reject(new Error(`OpenAI API error: ${response.error.message}`));
          } else {
            const summary = response.choices[0].message.content.trim();
            const wordCount = summary.split(/\s+/).length; 
        resolve({
              summary: summary,
              wordCount: wordCount
            });
          }
        } catch (error) {
          reject(new Error(`Failed to parse OpenAI response: ${error.message}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(new Error(`OpenAI API request failed: ${error.message}`));
    });

    req.write(payload);
    req.end();
  });
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
    const startTime = Date.now();
    
    // Generate summary with OpenAI
    const result = await generateSummaryWithOpenAI(rawContent);
    
    const processingTime = Date.now() - startTime;
    
    console.log(`  ✅ Summary generated in ${(processingTime / 1000).toFixed(2)}s`);
    console.log(`  📝 Word count: ${result.wordCount}`);
    
    // Update DynamoDB with the processed summary
    const updateParams = {
      TableName: RESEARCH_REPORTS_TABLE,
      Key: { reportId: report.reportId },
      UpdateExpression: 'SET processedSummary = :summary, summaryWordCount = :wc, processedAt = :pa',
      ExpressionAttributeValues: {
        ':summary': result.summary,
        ':wc': result.wordCount,
        ':pa': new Date().toISOString()
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
  const isDryRun = process.argv.includes('--dry-run');
  const batchSizeArg = process.argv.find(arg => arg.startsWith('--batch='));
  const batchSize = batchSizeArg ? parseInt(batchSizeArg.split('=')[1]) : 10;
  
  console.log(`🚀 Starting summary backfill process${isDryRun ? ' (DRY RUN)' : ''}...\n`);
  
  try {
    // Load secrets if not dry run
    if (!isDryRun) {
      await loadSecrets();
    }
    // Get all reports without summaries
    const reports = await getAllReportsWithoutSummaries();
    
    if (reports.length === 0) {
      console.log('✨ All reports already have summaries!');
      return;
    }
    
    if (isDryRun) {
      console.log('\n📋 DRY RUN - Reports that would be processed:');
      reports.forEach((report, index) => {
        console.log(`  ${index + 1}. ${report.reportId} (${report.team}) - ${report.createdAt}`);
      });
      console.log(`\n📊 Total reports to process: ${reports.length}`);
      console.log(`⏱️  Estimated time: ${Math.ceil(reports.length * 30 / 60)} minutes`);
      console.log(`\n💡 Options:`);
      console.log(`   • Run without --dry-run to process all reports`);
      console.log(`   • Use --batch=N to process only N reports (default: 10)`);
      console.log(`   • Example: node scripts/backfill-summaries.cjs --batch=5`);
      return;
    }
    
    // Limit batch size if specified
    const reportsToProcess = batchSize ? reports.slice(0, batchSize) : reports;
    
    if (batchSize && reports.length > batchSize) {
      console.log(`📦 Processing first ${batchSize} reports (out of ${reports.length} total)\n`);
    }
    
    // Process each report
    let successCount = 0;
    let failureCount = 0;
    
    for (const report of reportsToProcess) {
      const success = await processReport(report);
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
      
      // Add delay to avoid rate limiting (5 seconds between reports - OpenAI has better limits)
      if (report !== reportsToProcess[reportsToProcess.length - 1]) { // Skip delay after last report
        console.log('  ⏳ Waiting 5 seconds before next report...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    console.log('\n📊 Backfill Summary:');
    console.log(`  ✅ Successfully processed: ${successCount}`);
    console.log(`  ❌ Failed: ${failureCount}`);
    console.log(`  📋 Total processed: ${reportsToProcess.length}`);
    
    if (batchSize && reports.length > batchSize) {
      const remaining = reports.length - batchSize;
      console.log(`  ⏸️  Remaining: ${remaining} reports`);
      console.log(`\n💡 To process more reports, run:`);
      console.log(`   AWS_PROFILE=mvp node scripts/backfill-summaries.cjs --batch=${batchSize}`);
    }
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);