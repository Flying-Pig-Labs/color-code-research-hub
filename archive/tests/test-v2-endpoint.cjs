// Test script to verify V2 endpoint returns 8 phases
const https = require('https');

const testData = {
  metadata: {
    title: "Test Project",
    description: "A test project to verify 8-phase generation",
    domain: "software",
    targetUsers: ["developers"],
    techStack: ["Node.js", "React"],
    features: ["User authentication", "Dashboard"],
    complexity: "moderate"
  },
  readmeContent: "# Test Project\n\nThis is a test project for verifying the 8-phase SDLC generation."
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'ojfpuao6c4.execute-api.us-east-1.amazonaws.com',
  path: '/production/api/plan/v2/generate-full-plan',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log(`\nNumber of phases returned: ${response.phases ? response.phases.length : 0}`);
      
      if (response.phases) {
        console.log('\nPhases:');
        response.phases.forEach((phase, index) => {
          console.log(`${index + 1}. ${phase.title} (${phase.epics ? phase.epics.length : 0} epics)`);
        });
      }
      
      if (response.error) {
        console.error('\nError:', response.error);
      }
    } catch (e) {
      console.error('Failed to parse response:', e);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(postData);
req.end();