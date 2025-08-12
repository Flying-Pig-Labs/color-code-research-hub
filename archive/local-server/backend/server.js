import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import { publishToSQS } from './sqs-publisher.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory storage for jobs
const jobs = new Map();

// Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Optional API key validation
const validateApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const expectedKey = process.env.API_KEY;
  
  if (expectedKey && apiKey !== expectedKey) {
    return res.status(401).json({ message: 'Invalid API key' });
  }
  
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: 'production'
  });
});

// Get available teams
app.get('/teams', (req, res) => {
  res.json(['red', 'black', 'white']);
});

// Get fields for a specific team
app.get('/teams/:teamType/fields', (req, res) => {
  const { teamType } = req.params;
  
  const fields = {
    red: [
      { name: 'objective', label: 'Red Team Objective', type: 'textarea', required: true },
      { name: 'scope', label: 'Scope', type: 'textarea', required: true },
      { name: 'timeline', label: 'Timeline', type: 'text', required: false },
      { name: 'methodology', label: 'Methodology', type: 'select', required: true, 
        options: ['Penetration Testing', 'Social Engineering', 'Physical Security', 'Combined'] },
      { name: 'targetSystems', label: 'Target Systems', type: 'textarea', required: true },
      { name: 'constraints', label: 'Constraints', type: 'textarea', required: false }
    ],
    black: [
      { name: 'vendorName', label: 'Vendor Name', type: 'text', required: true },
      { name: 'productName', label: 'Product Name', type: 'text', required: true },
      { name: 'version', label: 'Version', type: 'text', required: false },
      { name: 'analysisType', label: 'Analysis Type', type: 'select', required: true,
        options: ['Vulnerability Research', 'Exploit Development', 'Patch Analysis', 'Full Assessment'] },
      { name: 'priority', label: 'Priority', type: 'select', required: true,
        options: ['Critical', 'High', 'Medium', 'Low'] },
      { name: 'notes', label: 'Additional Notes', type: 'textarea', required: false }
    ],
    white: [
      { name: 'whitespaceType', label: 'Whitespace Type', type: 'select', required: true,
        options: ['Market Analysis', 'Competitive Intelligence', 'Technology Trends', 'Strategic Planning'] },
      { name: 'targetMarket', label: 'Target Market', type: 'text', required: true },
      { name: 'competitors', label: 'Key Competitors', type: 'textarea', required: false },
      { name: 'timeframe', label: 'Analysis Timeframe', type: 'select', required: true,
        options: ['Immediate (1-3 months)', 'Short-term (3-6 months)', 'Medium-term (6-12 months)', 'Long-term (12+ months)'] },
      { name: 'deliverables', label: 'Expected Deliverables', type: 'textarea', required: true },
      { name: 'budget', label: 'Budget Range', type: 'text', required: false }
    ]
  };
  
  if (!fields[teamType]) {
    return res.status(404).json({ message: 'Team type not found' });
  }
  
  res.json(fields[teamType]);
});

// Submit research request
app.post('/research/submit', async (req, res) => {
  const { teamType, fields } = req.body;
  
  if (!teamType || !fields) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  
  const jobId = uuidv4();
  const job = {
    jobId,
    teamType,
    fields,
    status: 'pending',
    createdAt: new Date().toISOString(),
    completedAt: null,
    error: null,
    results: null
  };
  
  jobs.set(jobId, job);
  
  // Publish to SQS queue
  try {
    const sqsPayload = {
      jobId,
      teamType,
      fields,
      repository: `${process.env.VITE_GITHUB_ORG || 'Flying-Pig-Labs'}/ci-${teamType}-${jobId}`,
      researchConfig: {
        teamType,
        researchSpecs: fields,
        metadata: {
          timestamp: new Date().toISOString(),
          client: process.env.CLIENT_COMPANY_NAME || 'Unknown'
        }
      }
    };
    
    const sqsResult = await publishToSQS(sqsPayload);
    console.log(`Published job ${jobId} to SQS: ${sqsResult.messageId}`);
    
    // Update job status to processing
    job.status = 'processing';
    job.sqsMessageId = sqsResult.messageId;
    
    // Note: In production, you would have a separate process consuming from SQS
    // and updating job status. For now, we'll simulate completion.
    setTimeout(() => {
      const job = jobs.get(jobId);
      if (job) {
        job.status = 'completed';
        job.completedAt = new Date().toISOString();
        job.results = generateMockResults(teamType, fields);
      }
    }, 5000 + Math.random() * 5000);
    
  } catch (error) {
    console.error('Failed to publish to SQS:', error);
    job.status = 'failed';
    job.error = error.message;
    return res.status(500).json({ 
      message: 'Failed to submit research request',
      error: error.message 
    });
  }
  
  res.json({ jobId });
});

// Get job status
app.get('/research/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  res.json({
    jobId: job.jobId,
    status: job.status,
    createdAt: job.createdAt,
    completedAt: job.completedAt,
    error: job.error
  });
});

// Get job results
app.get('/research/results/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);
  
  if (!job) {
    return res.status(404).json({ message: 'Job not found' });
  }
  
  if (job.status !== 'completed') {
    return res.status(400).json({ message: 'Job not completed yet' });
  }
  
  res.json(job.results);
});

// Generate mock results based on team type
function generateMockResults(teamType, fields) {
  const baseResults = {
    summary: `Analysis completed for ${teamType} team request`,
    timestamp: new Date().toISOString(),
    confidence: 0.85 + Math.random() * 0.15,
    teamType,
    requestedFields: fields
  };
  
  switch (teamType) {
    case 'red':
      return {
        ...baseResults,
        vulnerabilities: [
          { severity: 'High', description: 'SQL Injection in login form', cvss: 8.5 },
          { severity: 'Medium', description: 'Cross-Site Scripting in comments', cvss: 6.1 },
          { severity: 'Low', description: 'Information disclosure in error messages', cvss: 3.7 }
        ],
        recommendations: [
          'Implement input validation and parameterized queries',
          'Enable Content Security Policy headers',
          'Sanitize error messages in production'
        ],
        exploitability: 'Medium',
        impactAnalysis: 'Potential for data breach and unauthorized access'
      };
      
    case 'black':
      return {
        ...baseResults,
        vendorAnalysis: {
          vendor: fields.vendorName,
          product: fields.productName,
          knownVulnerabilities: Math.floor(Math.random() * 10) + 1,
          patchingFrequency: 'Quarterly',
          securityPosture: 'Moderate'
        },
        exploits: [
          { cve: 'CVE-2024-1234', description: 'Remote Code Execution', poc: 'Available' },
          { cve: 'CVE-2024-5678', description: 'Privilege Escalation', poc: 'Theoretical' }
        ],
        mitigations: [
          'Apply latest security patches',
          'Implement network segmentation',
          'Enable advanced threat detection'
        ]
      };
      
    case 'white':
      return {
        ...baseResults,
        marketAnalysis: {
          marketSize: '$' + (Math.random() * 100 + 50).toFixed(1) + 'B',
          growthRate: (Math.random() * 20 + 5).toFixed(1) + '%',
          keyPlayers: ['Company A', 'Company B', 'Company C'],
          marketTrends: ['AI Integration', 'Cloud Migration', 'Zero Trust Architecture']
        },
        opportunities: [
          'Emerging market segment with limited competition',
          'Technology differentiation potential',
          'Strategic partnership opportunities'
        ],
        risks: [
          'Regulatory compliance requirements',
          'Established competitor dominance',
          'Technology adoption barriers'
        ],
        recommendations: [
          'Focus on niche market initially',
          'Develop strategic partnerships',
          'Invest in R&D for differentiation'
        ]
      };
      
    default:
      return baseResults;
  }
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

// SQS endpoint for direct submission (replaces EC2 proxy)
app.post('/api/sqs/submit', async (req, res) => {
  const { teamType, formData, repoId } = req.body;
  
  if (!teamType || !formData || !repoId) {
    return res.status(400).json({ 
      error: 'Missing required fields',
      required: ['teamType', 'formData', 'repoId']
    });
  }
  
  try {
    const repoName = `ci-${teamType}-${repoId}`;
    const repository = `${process.env.VITE_GITHUB_ORG || 'Flying-Pig-Labs'}/${repoName}`;
    
    const sqsPayload = {
      repository,
      teamType,
      formData,
      repoId,
      branch: 'main',
      researchConfig: {
        teamType,
        researchSpecs: formData,
        metadata: {
          timestamp: new Date().toISOString(),
          client: process.env.CLIENT_COMPANY_NAME || 'Unknown',
          source: 'research-hub-ui'
        }
      }
    };
    
    const result = await publishToSQS(sqsPayload);
    
    res.json({ 
      status: 'accepted',
      message: 'Research request submitted to queue successfully',
      repoId,
      repository,
      expectedRepoName: repoName,
      githubUrl: `https://github.com/${repository}`,
      sqsMessageId: result.messageId,
      estimatedTime: '2-5 minutes'
    });
    
  } catch (error) {
    console.error('SQS submission error:', error);
    res.status(500).json({ 
      error: 'Failed to submit to queue',
      message: error.message 
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Local backend server running on http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /teams');
  console.log('  GET  /teams/:teamType/fields');
  console.log('  POST /api/sqs/submit');
  console.log('  POST /research/submit');
  console.log('  GET  /research/status/:jobId');
  console.log('  GET  /research/results/:jobId');
});