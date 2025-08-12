const { DynamoDBClient, PutItemCommand, GetItemCommand, UpdateItemCommand } = require('@aws-sdk/client-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const { 
  PHASE_GENERATOR_PROMPT, 
  EPIC_GENERATOR_PROMPT, 
  ISSUE_FORMATTER_PROMPT,
  PHASE_ROLE_MAPPING 
} = require('./prompts');

const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const secretsClient = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });

// Cache secrets to avoid repeated calls
let cachedSecrets = null;
let cachedGitHubToken = null;
let cachedOpenAIKey = null;

const getSecrets = async () => {
  if (cachedSecrets) {
    return cachedSecrets;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: process.env.SECRETS_ARN
    });
    
    const response = await secretsClient.send(command);
    cachedSecrets = JSON.parse(response.SecretString);
    return cachedSecrets;
  } catch (error) {
    console.error('Failed to retrieve secrets:', error);
    throw new Error('Configuration error');
  }
};

// Get GitHub PAT from Secrets Manager
const getGitHubToken = async () => {
  if (cachedGitHubToken) {
    return cachedGitHubToken;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: 'arn:aws:secretsmanager:us-east-1:984906149037:secret:github_token-sIuriy'
    });
    
    const response = await secretsClient.send(command);
    cachedGitHubToken = response.SecretString;
    
    if (!cachedGitHubToken) {
      throw new Error('GitHub token not found in secret');
    }
    
    return cachedGitHubToken;
  } catch (error) {
    console.error('Failed to retrieve GitHub token:', error);
    throw new Error('GitHub token configuration error');
  }
};

// Get OpenAI API key from Secrets Manager
const getOpenAIKey = async () => {
  if (cachedOpenAIKey) {
    return cachedOpenAIKey;
  }

  try {
    const command = new GetSecretValueCommand({
      SecretId: 'arn:aws:secretsmanager:us-east-1:984906149037:secret:openai_key-PkoBXY'
    });
    
    const response = await secretsClient.send(command);
    cachedOpenAIKey = response.SecretString;
    
    if (!cachedOpenAIKey) {
      throw new Error('OpenAI key not found in secret');
    }
    
    return cachedOpenAIKey;
  } catch (error) {
    console.error('Failed to retrieve OpenAI key:', error);
    return null;
  }
};

// Call Claude API with retry logic
const callClaude = async (prompt, apiKey, retries = 3) => {
  const data = JSON.stringify({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 4000,
    temperature: 0.7,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ]
  });

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.anthropic.com',
          path: '/v1/messages',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Length': Buffer.byteLength(data)
          }
        };

        const req = https.request(options, (res) => {
          let responseData = '';

          res.on('data', (chunk) => {
            responseData += chunk;
          });

          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
              const response = JSON.parse(responseData);
              resolve(response.content[0].text);
            } else if (res.statusCode === 529) {
              reject(new Error(`RATE_LIMIT: ${responseData}`));
            } else {
              reject(new Error(`Claude API error: ${res.statusCode} ${responseData}`));
            }
          });
        });

        req.on('error', reject);
        req.write(data);
        req.end();
      });
      
      return response;
    } catch (error) {
      if (error.message.startsWith('RATE_LIMIT') && attempt < retries - 1) {
        const waitTime = Math.pow(2, attempt + 1) * 1000;
        console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        throw error;
      }
    }
  }
};

// Call OpenAI API as fallback
const callOpenAI = async (prompt, apiKey) => {
  const data = JSON.stringify({
    model: 'gpt-4-turbo-preview',
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that always responds with valid JSON. Never include markdown formatting or code blocks in your response.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: "json_object" }
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      path: '/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const response = JSON.parse(responseData);
            resolve(response.choices[0].message.content);
          } catch (e) {
            reject(new Error(`OpenAI parse error: ${e.message}`));
          }
        } else {
          reject(new Error(`OpenAI API error: ${res.statusCode} ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

// Call AI with automatic fallback to OpenAI
const callAI = async (prompt, claudeKey, openAIKey = null) => {
  try {
    console.log('Attempting to call Claude API...');
    return await callClaude(prompt, claudeKey);
  } catch (error) {
    if (error.message.includes('529') || error.message.includes('RATE_LIMIT') || error.message.includes('Overloaded')) {
      console.log('Claude API overloaded, attempting OpenAI fallback...');
      
      if (!openAIKey) {
        openAIKey = await getOpenAIKey();
      }
      
      if (openAIKey) {
        try {
          const response = await callOpenAI(prompt, openAIKey);
          console.log('OpenAI fallback successful');
          return response;
        } catch (openAIError) {
          console.error('OpenAI fallback failed:', openAIError);
          throw error;
        }
      } else {
        console.log('OpenAI key not available for fallback');
        throw error;
      }
    } else {
      throw error;
    }
  }
};

// Extract JSON from Claude response
const extractJSON = (response) => {
  try {
    return JSON.parse(response);
  } catch (e) {
    // Not pure JSON, continue with extraction
  }
  
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      let cleanJson = jsonMatch[0]
        .replace(/\n\s*\n/g, '\n')
        .replace(/,\s*}/, '}')
        .replace(/,\s*]/, ']');
      
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse JSON object:', e);
    }
  }
  
  const arrayMatch = response.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      let cleanArray = arrayMatch[0]
        .replace(/\n\s*\n/g, '\n')
        .replace(/,\s*]/, ']');
      
      const parsed = JSON.parse(cleanArray);
      return Array.isArray(parsed) ? { phases: parsed } : parsed;
    } catch (e) {
      console.error('Failed to parse array:', e);
    }
  }
  
  console.error('Could not parse response as JSON, raw response:', response.substring(0, 500));
  throw new Error('Could not extract valid JSON from response');
};

// Replace template variables
const buildPrompt = (template, variables) => {
  let prompt = template;
  for (const [key, value] of Object.entries(variables)) {
    prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return prompt;
};

// Update job status in DynamoDB
const updateJobStatus = async (jobId, status, data = {}) => {
  const params = {
    TableName: process.env.JOBS_TABLE || 'color-code-jobs',
    Key: {
      jobId: { S: jobId }
    },
    UpdateExpression: 'SET #status = :status, #stage = :stage, #updatedAt = :updatedAt',
    ExpressionAttributeNames: {
      '#status': 'status',
      '#stage': 'stage',
      '#updatedAt': 'updatedAt'
    },
    ExpressionAttributeValues: {
      ':status': { S: status },
      ':stage': { S: data.stage || 'Unknown' },
      ':updatedAt': { S: new Date().toISOString() }
    }
  };

  // Add additional data fields if provided
  if (data.progress !== undefined) {
    params.UpdateExpression += ', #progress = :progress';
    params.ExpressionAttributeNames['#progress'] = 'progress';
    params.ExpressionAttributeValues[':progress'] = { N: data.progress.toString() };
  }

  if (data.completedStages) {
    params.UpdateExpression += ', #completedStages = :completedStages';
    params.ExpressionAttributeNames['#completedStages'] = 'completedStages';
    params.ExpressionAttributeValues[':completedStages'] = { L: data.completedStages.map(s => ({ S: s })) };
  }

  if (data.issuesCreated !== undefined) {
    params.UpdateExpression += ', #issuesCreated = :issuesCreated';
    params.ExpressionAttributeNames['#issuesCreated'] = 'issuesCreated';
    params.ExpressionAttributeValues[':issuesCreated'] = { N: data.issuesCreated.toString() };
  }

  if (data.totalIssues !== undefined) {
    params.UpdateExpression += ', #totalIssues = :totalIssues';
    params.ExpressionAttributeNames['#totalIssues'] = 'totalIssues';
    params.ExpressionAttributeValues[':totalIssues'] = { N: data.totalIssues.toString() };
  }

  if (data.result) {
    params.UpdateExpression += ', #result = :result';
    params.ExpressionAttributeNames['#result'] = 'result';
    params.ExpressionAttributeValues[':result'] = { S: JSON.stringify(data.result) };
  }

  if (data.error) {
    params.UpdateExpression += ', #error = :error';
    params.ExpressionAttributeNames['#error'] = 'error';
    params.ExpressionAttributeValues[':error'] = { S: data.error };
  }

  await dynamoClient.send(new UpdateItemCommand(params));
};

// Get job status from DynamoDB
const getJobStatus = async (jobId) => {
  const params = {
    TableName: process.env.JOBS_TABLE || 'color-code-jobs',
    Key: {
      jobId: { S: jobId }
    }
  };

  const result = await dynamoClient.send(new GetItemCommand(params));
  
  if (!result.Item) {
    return null;
  }

  return {
    jobId: result.Item.jobId.S,
    status: result.Item.status.S,
    stage: result.Item.stage?.S || 'Unknown',
    progress: parseInt(result.Item.progress?.N || '0'),
    completedStages: result.Item.completedStages?.L?.map(item => item.S) || [],
    issuesCreated: parseInt(result.Item.issuesCreated?.N || '0'),
    totalIssues: parseInt(result.Item.totalIssues?.N || '0'),
    createdAt: result.Item.createdAt.S,
    updatedAt: result.Item.updatedAt?.S,
    result: result.Item.result?.S ? JSON.parse(result.Item.result.S) : null,
    error: result.Item.error?.S
  };
};

// Step 1: Generate phases based on README
const generatePhases = async (projectInfo, readmeContent, apiKey, openAIKey) => {
  console.log('Step 1: Generating phases...');
  
  const prompt = buildPrompt(PHASE_GENERATOR_PROMPT, {
    domain: projectInfo.domain || 'software',
    readmeContent: readmeContent.substring(0, 3000)
  });
  
  const response = await callAI(prompt, apiKey, openAIKey);
  const result = extractJSON(response);
  
  return result.phases;
};

// Step 2: Generate epics for each phase
const generateEpics = async (phase, projectInfo, apiKey, openAIKey) => {
  console.log(`Step 2: Generating epics for phase: ${phase.title}`);
  
  const commonRoles = PHASE_ROLE_MAPPING[phase.id] || 
    ['Product Owner', 'Software Engineer', 'Designer', 'QA Engineer'];
  
  const prompt = buildPrompt(EPIC_GENERATOR_PROMPT, {
    phaseId: phase.id,
    phaseTitle: phase.title,
    phaseDescription: phase.description,
    productContext: `${projectInfo.title}: ${projectInfo.description}`,
    commonRoles: commonRoles.join(', ')
  });
  
  const response = await callAI(prompt, apiKey, openAIKey);
  const result = extractJSON(response);
  
  return result.tasks || [];
};

// Create GitHub issue
const createGitHubIssue = async (issue, owner, repo, githubToken) => {
  const issueData = JSON.stringify({
    title: issue.title,
    body: issue.body,
    labels: issue.labels || []
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: `/repos/${owner}/${repo}/issues`,
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Color-Code-Research-Hub',
        'Content-Length': Buffer.byteLength(issueData)
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`GitHub API error: ${res.statusCode} ${data}`));
        }
      });
    });
    
    req.on('error', reject);
    req.write(issueData);
    req.end();
  });
};

// Main handler
exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
    'Access-Control-Allow-Methods': 'POST,GET,OPTIONS'
  };

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const pathSegments = event.path.split('/').filter(Boolean);
    
    // Route: Start plan generation (returns job ID)
    if (pathSegments.includes('start-plan-generation')) {
      const body = JSON.parse(event.body);
      const { metadata, readmeContent, repository } = body;
      
      // Create job entry in DynamoDB
      const jobId = uuidv4();
      const timestamp = new Date().toISOString();
      
      const params = {
        TableName: process.env.JOBS_TABLE || 'color-code-jobs',
        Item: {
          jobId: { S: jobId },
          status: { S: 'processing' },
          stage: { S: 'Form Analysis' },
          progress: { N: '0' },
          completedStages: { L: [] },
          issuesCreated: { N: '0' },
          totalIssues: { N: '0' },
          metadata: { S: JSON.stringify(metadata) },
          readmeContent: { S: readmeContent },
          repository: { S: repository },
          createdAt: { S: timestamp },
          updatedAt: { S: timestamp }
        }
      };
      
      await dynamoClient.send(new PutItemCommand(params));
      
      // Trigger async processing (in production, this would be an SQS message or Step Function)
      // For now, we'll use Lambda async invocation
      setImmediate(async () => {
        try {
          await processJob(jobId);
        } catch (error) {
          console.error('Error processing job:', error);
          await updateJobStatus(jobId, 'failed', { 
            error: error.message,
            stage: 'Error'
          });
        }
      });
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          jobId,
          status: 'processing',
          message: 'Plan generation started'
        })
      };
    }
    
    // Route: Get job status
    else if (pathSegments.includes('job-status')) {
      const jobId = event.pathParameters?.jobId;
      
      if (!jobId) {
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Job ID required' })
        };
      }
      
      const jobStatus = await getJobStatus(jobId);
      
      if (!jobStatus) {
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Job not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(jobStatus)
      };
    }
    
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Endpoint not found' })
    };
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: error.message || 'An error occurred'
      })
    };
  }
};

// Process job asynchronously
const processJob = async (jobId) => {
  const job = await getJobStatus(jobId);
  if (!job) {
    throw new Error('Job not found');
  }
  
  const metadata = JSON.parse(job.metadata);
  const readmeContent = job.readmeContent;
  const repository = job.repository;
  
  // Get API keys
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not configured');
  }
  
  const openAIKey = await getOpenAIKey();
  const githubToken = await getGitHubToken();
  
  const [owner, repo] = repository.split('/');
  
  try {
    // Stage 1: Form Analysis (10%)
    await updateJobStatus(jobId, 'processing', {
      stage: 'Form Analysis',
      progress: 10,
      completedStages: []
    });
    
    // Stage 2: Phase Generation (30%)
    await updateJobStatus(jobId, 'processing', {
      stage: 'Phase Generation',
      progress: 20,
      completedStages: ['Form Analysis']
    });
    
    const phases = await generatePhases(metadata, readmeContent, anthropicApiKey, openAIKey);
    console.log(`Generated ${phases.length} phases`);
    
    await updateJobStatus(jobId, 'processing', {
      stage: 'Phase Generation',
      progress: 30,
      completedStages: ['Form Analysis']
    });
    
    // Stage 3: Epic Generation (50%)
    await updateJobStatus(jobId, 'processing', {
      stage: 'Epic Generation',
      progress: 40,
      completedStages: ['Form Analysis', 'Phase Generation']
    });
    
    const phasesWithEpics = [];
    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const epics = await generateEpics(phase, metadata, anthropicApiKey, openAIKey);
      
      phasesWithEpics.push({
        ...phase,
        epics: epics.map((epic, index) => ({
          id: `${phase.id}-epic-${index + 1}`,
          title: epic.title,
          description: epic.description,
          suggestedRole: epic.suggestedRole,
          selected: true
        }))
      });
      
      const progress = 40 + (10 * (i + 1) / phases.length);
      await updateJobStatus(jobId, 'processing', {
        stage: 'Epic Generation',
        progress: Math.round(progress),
        completedStages: ['Form Analysis', 'Phase Generation']
      });
    }
    
    // Stage 4: Issue Formatting (70%)
    await updateJobStatus(jobId, 'processing', {
      stage: 'Issue Formatting',
      progress: 60,
      completedStages: ['Form Analysis', 'Phase Generation', 'Epic Generation']
    });
    
    const allIssues = [];
    let totalIssues = 0;
    
    for (const phase of phasesWithEpics) {
      for (const epic of phase.epics) {
        // Create 3 issues per epic
        for (let i = 1; i <= 3; i++) {
          allIssues.push({
            title: `[${epic.suggestedRole}] ${epic.title} - Task ${i}`,
            body: `## Context\n${epic.description}\n\n## Role\n${epic.suggestedRole}\n\n## Phase\n${phase.title}\n\n## Tasks\n- [ ] Implement ${epic.title.toLowerCase()} requirements\n- [ ] Document approach\n- [ ] Test implementation\n- [ ] Get review and approval\n\n## Acceptance Criteria\n- Implementation complete\n- Tests passing\n- Documentation updated\n- Reviewed and approved`,
            labels: [
              `phase:${phase.id}`,
              `role:${epic.suggestedRole.toLowerCase().replace(/\s+/g, '-')}`,
              'sparc-enabled'
            ],
            phaseId: phase.id,
            phaseTitle: phase.title,
            epicId: epic.id,
            epicTitle: epic.title
          });
          totalIssues++;
        }
      }
    }
    
    await updateJobStatus(jobId, 'processing', {
      stage: 'Issue Formatting',
      progress: 70,
      completedStages: ['Form Analysis', 'Phase Generation', 'Epic Generation'],
      totalIssues: totalIssues
    });
    
    // Stage 5: GitHub Creation (100%)
    await updateJobStatus(jobId, 'processing', {
      stage: 'GitHub Creation',
      progress: 80,
      completedStages: ['Form Analysis', 'Phase Generation', 'Epic Generation', 'Issue Formatting'],
      totalIssues: totalIssues
    });
    
    const createdIssues = [];
    let issuesCreated = 0;
    
    for (const issue of allIssues) {
      try {
        const createdIssue = await createGitHubIssue(issue, owner, repo, githubToken);
        createdIssues.push({
          id: createdIssue.id,
          number: createdIssue.number,
          title: createdIssue.title,
          url: createdIssue.html_url
        });
        issuesCreated++;
        
        const progress = 80 + (20 * issuesCreated / totalIssues);
        await updateJobStatus(jobId, 'processing', {
          stage: 'GitHub Creation',
          progress: Math.round(progress),
          completedStages: ['Form Analysis', 'Phase Generation', 'Epic Generation', 'Issue Formatting'],
          issuesCreated: issuesCreated,
          totalIssues: totalIssues
        });
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Failed to create issue: ${error.message}`);
      }
    }
    
    // Complete
    await updateJobStatus(jobId, 'completed', {
      stage: 'Complete',
      progress: 100,
      completedStages: ['Form Analysis', 'Phase Generation', 'Epic Generation', 'Issue Formatting', 'GitHub Creation'],
      issuesCreated: issuesCreated,
      totalIssues: totalIssues,
      result: {
        phases: phasesWithEpics,
        createdIssues: createdIssues,
        repository: repository
      }
    });
    
  } catch (error) {
    console.error('Error processing job:', error);
    await updateJobStatus(jobId, 'failed', {
      error: error.message,
      stage: 'Error'
    });
    throw error;
  }
};