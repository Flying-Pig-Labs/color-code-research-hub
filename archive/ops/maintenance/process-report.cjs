#!/usr/bin/env node

/**
 * Script to manually trigger report processing for a specific report
 * Usage: node process-report.js <reportId>
 */

const https = require('https');

const API_BASE_URL = 'https://zi612qxxv0.execute-api.us-east-1.amazonaws.com/production';
const REPORT_ID = process.argv[2] || 'b78e683f-3b5f-42e9-80f8-c12fa0b8ead5';

async function processReport(reportId) {
  const data = JSON.stringify({ reportId });

  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(`${API_BASE_URL}/api/reports/process`, options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Report processing triggered successfully');
          try {
            const parsed = JSON.parse(responseData);
            console.log('Response:', JSON.stringify(parsed, null, 2));
            resolve(parsed);
          } catch (e) {
            console.log('Response:', responseData);
            resolve(responseData);
          }
        } else {
          console.error(`❌ Failed with status ${res.statusCode}`);
          console.error('Response:', responseData);
          reject(new Error(`HTTP ${res.statusCode}: ${responseData}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error);
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function main() {
  console.log(`🔄 Processing report: ${REPORT_ID}`);
  
  try {
    await processReport(REPORT_ID);
    console.log('\n✅ Report processing completed!');
    console.log('The report should now have a processed summary.');
    console.log('Refresh the page to see the updated summary.');
  } catch (error) {
    console.error('\n❌ Failed to process report:', error.message);
    process.exit(1);
  }
}

main();