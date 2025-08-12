/**
 * Server Endpoint for Competitive Intelligence Form Processing
 * Receives form data and triggers remote swarm execution
 */

require('dotenv').config();
const express = require('express');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const FormDataProcessor = require('./form-data-processor');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers (adjust as needed)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

// Initialize form processor
const formProcessor = new FormDataProcessor();

// Temporary storage for job status
const jobStatus = new Map();

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', version: '1.0.0' });
});

/**
 * Get form configuration
 */
app.get('/api/form-config/:teamType', (req, res) => {
  const { teamType } = req.params;
  
  try {
    const formConfig = require('./form-customization-config.json');
    const teamConfig = formConfig.teams[teamType];
    
    if (!teamConfig) {
      return res.status(404).json({ error: 'Invalid team type' });
    }
    
    res.json(teamConfig);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load form configuration' });
  }
});

/**
 * Submit competitive intelligence analysis request
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { teamType, formData } = req.body;
    
    // Validate request
    if (!teamType || !formData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Validate form data
    const validation = formProcessor.validateFormData(teamType, formData);
    if (!validation.valid) {
      return res.status(400).json({ 
        error: 'Invalid form data', 
        details: validation.errors 
      });
    }
    
    // Generate job ID
    const jobId = crypto.randomBytes(16).toString('hex');
    
    // Process form data
    const swarmConfig = formProcessor.generateSwarmConfig(teamType, formData);
    
    // Save configuration to temporary file
    const configPath = path.join('/tmp', `ci-config-${jobId}.json`);
    await fs.writeFile(configPath, JSON.stringify(formData, null, 2));
    
    // Prepare output directory
    const outputDir = path.join('/tmp', `ci-output-${jobId}`);
    await fs.mkdir(outputDir, { recursive: true });
    
    // Initialize job status
    jobStatus.set(jobId, {
      status: 'running',
      teamType,
      company: formData.companyName,
      startTime: new Date().toISOString(),
      outputDir,
      logs: []
    });
    
    // Spawn the shell script
    const scriptPath = path.join(__dirname, 'remote-swarm-executor.sh');
    const args = [
      '--team', teamType,
      '--config', configPath,
      '--output', outputDir
    ];
    
    // Add optional arguments
    if (process.env.GITHUB_ORG) {
      args.push('--github');
    }
    
    if (process.env.WEBHOOK_URL) {
      args.push('--notify');
    }
    
    const child = spawn(scriptPath, args, {
      env: {
        ...process.env,
        CLAUDE_API_KEY: process.env.CLAUDE_API_KEY,
        GITHUB_ORG: process.env.GITHUB_ORG,
        GITHUB_TOKEN: process.env.GITHUB_TOKEN,
        WEBHOOK_URL: process.env.WEBHOOK_URL
      }
    });
    
    // Capture output
    const job = jobStatus.get(jobId);
    
    child.stdout.on('data', (data) => {
      const log = data.toString();
      job.logs.push({ type: 'stdout', message: log, timestamp: new Date().toISOString() });
      console.log(`[Job ${jobId}] ${log}`);
    });
    
    child.stderr.on('data', (data) => {
      const log = data.toString();
      job.logs.push({ type: 'stderr', message: log, timestamp: new Date().toISOString() });
      console.error(`[Job ${jobId}] ${log}`);
    });
    
    child.on('close', async (code) => {
      job.status = code === 0 ? 'completed' : 'failed';
      job.exitCode = code;
      job.endTime = new Date().toISOString();
      
      // Try to read results if successful
      if (code === 0) {
        try {
          const reportPath = path.join(outputDir, 'competitive-intelligence-report.json');
          const reportData = await fs.readFile(reportPath, 'utf8');
          job.results = JSON.parse(reportData);
          
          // Read markdown report
          const mdPath = path.join(outputDir, 'report.md');
          job.markdownReport = await fs.readFile(mdPath, 'utf8');
        } catch (error) {
          console.error('Failed to read results:', error);
        }
      }
      
      // Cleanup config file
      fs.unlink(configPath).catch(() => {});
    });
    
    // Return job ID immediately
    res.json({
      jobId,
      status: 'accepted',
      message: 'Analysis started',
      statusUrl: `/api/status/${jobId}`
    });
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ 
      error: 'Failed to start analysis',
      details: error.message 
    });
  }
});

/**
 * Get job status
 */
app.get('/api/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStatus.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  // Prepare response
  const response = {
    jobId,
    status: job.status,
    teamType: job.teamType,
    company: job.company,
    startTime: job.startTime,
    endTime: job.endTime,
    exitCode: job.exitCode
  };
  
  // Include results if completed
  if (job.status === 'completed' && job.results) {
    response.results = {
      overallScore: job.results.grading?.overall_score,
      recommendations: job.results.grading?.recommendations,
      reportUrl: `/api/report/${jobId}`
    };
  }
  
  // Include recent logs
  if (req.query.logs === 'true') {
    response.logs = job.logs.slice(-20); // Last 20 log entries
  }
  
  res.json(response);
});

/**
 * Get full report
 */
app.get('/api/report/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = jobStatus.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Job not completed' });
  }
  
  // Return format based on Accept header
  const acceptHeader = req.get('Accept');
  
  if (acceptHeader && acceptHeader.includes('text/markdown')) {
    res.type('text/markdown');
    res.send(job.markdownReport || 'Report not available');
  } else {
    res.json(job.results || {});
  }
});

/**
 * Download report files
 */
app.get('/api/download/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const job = jobStatus.get(jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  if (job.status !== 'completed') {
    return res.status(400).json({ error: 'Job not completed' });
  }
  
  try {
    // Create a zip file of the output directory
    const archiver = require('archiver');
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    res.attachment(`ci-report-${jobId}.zip`);
    archive.pipe(res);
    
    archive.directory(job.outputDir, false);
    await archive.finalize();
  } catch (error) {
    res.status(500).json({ error: 'Failed to create download' });
  }
});

/**
 * Clean up old jobs (run periodically)
 */
setInterval(() => {
  const now = Date.now();
  const maxAge = 24 * 60 * 60 * 1000; // 24 hours
  
  for (const [jobId, job] of jobStatus.entries()) {
    const jobAge = now - new Date(job.startTime).getTime();
    if (jobAge > maxAge) {
      // Clean up output directory
      fs.rm(job.outputDir, { recursive: true, force: true }).catch(() => {});
      jobStatus.delete(jobId);
      console.log(`Cleaned up old job: ${jobId}`);
    }
  }
}, 60 * 60 * 1000); // Run every hour

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Competitive Intelligence API server running on port ${PORT}`);
  console.log('Endpoints:');
  console.log(`  GET  /api/form-config/:teamType - Get form configuration`);
  console.log(`  POST /api/analyze - Submit analysis request`);
  console.log(`  GET  /api/status/:jobId - Check job status`);
  console.log(`  GET  /api/report/:jobId - Get analysis report`);
  console.log(`  GET  /api/download/:jobId - Download full results`);
});

module.exports = app;