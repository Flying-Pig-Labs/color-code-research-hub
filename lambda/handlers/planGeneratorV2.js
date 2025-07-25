const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const https = require('https');
const { 
  PHASE_GENERATOR_PROMPT, 
  EPIC_GENERATOR_PROMPT, 
  ISSUE_FORMATTER_PROMPT,
  PHASE_ROLE_MAPPING 
} = require('./prompts');

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
      SecretId: 'arn:aws:secretsmanager:us-east-1:418272766513:secret:github/personal_token-7lbje4'
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
      SecretId: 'arn:aws:secretsmanager:us-east-1:418272766513:secret:feel-forward/openai-api-key-zezdyv'
    });
    
    const response = await secretsClient.send(command);
    cachedOpenAIKey = response.SecretString;
    
    if (!cachedOpenAIKey) {
      throw new Error('OpenAI key not found in secret');
    }
    
    return cachedOpenAIKey;
  } catch (error) {
    console.error('Failed to retrieve OpenAI key:', error);
    // Return null instead of throwing - OpenAI is optional fallback
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
              // Rate limit error - will retry
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
        // Exponential backoff: 2s, 4s, 8s
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
          throw error; // Throw original Claude error
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
  // First, try to parse the entire response as JSON
  try {
    const parsed = JSON.parse(response);
    // If it's a pure array, wrap it in an object
    return Array.isArray(parsed) ? { phases: parsed } : parsed;
  } catch (e) {
    // Not pure JSON, continue with extraction
  }
  
  // Try to find JSON object in the response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      // Clean up common formatting issues
      let cleanJson = jsonMatch[0]
        .replace(/\n\s*\n/g, '\n') // Remove extra newlines
        .replace(/,\s*}/g, '}')    // Remove ALL trailing commas (added 'g' flag)
        .replace(/,\s*]/g, ']');   // Remove ALL trailing commas in arrays (added 'g' flag)
      
      return JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse JSON object:', e);
      console.error('Raw match:', jsonMatch[0].substring(0, 200));
    }
  }
  
  // Try array format
  const arrayMatch = response.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      let cleanArray = arrayMatch[0]
        .replace(/\n\s*\n/g, '\n')
        .replace(/,\s*]/g, ']');  // Added 'g' flag for consistency
      
      const parsed = JSON.parse(cleanArray);
      // If it's an array, wrap it in an object
      return Array.isArray(parsed) ? { phases: parsed } : parsed;
    } catch (e) {
      console.error('Failed to parse array:', e);
      console.error('Raw match:', arrayMatch[0].substring(0, 200));
    }
  }
  
  // Try to extract structured data even if not perfect JSON
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

// Step 1: Generate phases based on README
const generatePhases = async (projectInfo, readmeContent, apiKey, openAIKey) => {
  console.log('Step 1: Generating phases...');
  
  const prompt = buildPrompt(PHASE_GENERATOR_PROMPT, {
    domain: projectInfo.domain || 'software',
    readmeContent: readmeContent.substring(0, 3000) // Limit README length
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

// Step 3: Format issues for GitHub
const formatIssue = async (task, phase, projectInfo, apiKey, openAIKey) => {
  const prompt = buildPrompt(ISSUE_FORMATTER_PROMPT, {
    taskTitle: task.title,
    taskDescription: task.description,
    assignedRole: task.suggestedRole,
    phaseTitle: phase.title,
    productContext: projectInfo.title
  });
  
  const response = await callAI(prompt, apiKey, openAIKey);
  const result = extractJSON(response);
  
  return {
    title: result.title,
    body: result.body,
    labels: [
      `phase:${phase.id}`,
      `role:${task.suggestedRole.toLowerCase().replace(/\s+/g, '-')}`,
      'sparc-enabled'
    ],
    assignee: task.suggestedRole,
    phaseId: phase.id,
    phaseTitle: phase.title,
    epicTitle: task.title,
    estimatedHours: Math.floor(Math.random() * 32) + 8 // 8-40 hours
  };
};

// Wrap the main handler with timeout protection
const executeWithTimeout = async (promise, timeoutMs) => {
  const timeout = new Promise((_, reject) => 
    setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
  );
  return Promise.race([promise, timeout]);
};

exports.handler = async (event) => {
  const corsHeaders = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Api-Key',
    'Access-Control-Allow-Methods': 'POST,OPTIONS'
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
    const body = JSON.parse(event.body);
    const pathSegments = event.path.split('/').filter(Boolean);
    
    // Get API keys
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }
    
    // Get OpenAI key for fallback (optional)
    const openAIKey = await getOpenAIKey();

    // Route: Generate full project plan
    if (pathSegments.includes('generate-full-plan')) {
      const { metadata, readmeContent } = body;
      
      console.log('Starting full plan generation for:', metadata.title);
      
      try {
        // Quick response to avoid timeout - generate minimal data
        console.log('Generating quick response for:', metadata.title);
        
        // Step 1: Generate phases only (fastest operation)
        const phases = await generatePhases(metadata, readmeContent, anthropicApiKey, openAIKey);
        console.log(`Generated ${phases.length} phases`);
        
        // Step 2: Return phases with placeholder epics
        const phasesWithEpics = phases.map((phase, index) => ({
          ...phase,
          epics: index === 0 ? [
            {
              id: `${phase.id}-epic-1`,
              title: 'Requirements Gathering',
              description: 'Gather and document all requirements',
              suggestedRole: 'Product Owner',
              issues: []
            },
            {
              id: `${phase.id}-epic-2`,
              title: 'Technical Planning',
              description: 'Plan technical implementation approach',
              suggestedRole: 'Tech Lead',
              issues: []
            }
          ] : [],
          pending: index > 0 // Mark all but first as pending
        }));
        
        // Step 3: Create one sample issue
        const sampleIssues = [{
          title: '[Product Owner] Gather Initial Requirements',
          body: '## Context\nGather and document initial project requirements.\n\n## Tasks\n- [ ] Interview stakeholders\n- [ ] Document requirements\n- [ ] Get approval\n\n## Acceptance Criteria\n- Requirements documented\n- Stakeholder approval received',
          labels: ['phase:phase-1', 'role:product-owner', 'sparc-enabled'],
          assignee: 'Product Owner',
          phaseId: phases[0]?.id || 'phase-1',
          phaseTitle: phases[0]?.title || 'Phase 1',
          epicId: `${phases[0]?.id || 'phase-1'}-epic-1`,
          epicTitle: 'Requirements Gathering',
          estimatedHours: 16
        }];
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            phases: phasesWithEpics,
            sampleIssues: sampleIssues,
            totalEstimatedIssues: phasesWithEpics.reduce((sum, phase) => 
              sum + phase.epics.length * 3, 0) // Estimate 3 issues per epic
          })
        };
        
      } catch (error) {
        console.error('Error in full plan generation:', error);
        
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Failed to generate full plan',
            message: error.message
          })
        };
      }
    }
    
    // Route: Generate issues for selected epics
    else if (pathSegments.includes('generate-issues')) {
      const { phases, metadata } = body;
      
      console.log('Generating issues for selected epics...');
      
      const allIssues = [];
      
      try {
        // First, generate real epics for phases that need them
        const updatedPhases = [];
        let epicsGenerated = 0;
        const maxEpicsToGenerate = 3; // Limit to avoid timeout
        
        for (const phase of phases) {
          if (phase.pending && phase.epics.length === 0 && epicsGenerated < maxEpicsToGenerate) {
            // Generate epics for pending phases
            console.log(`Generating epics for pending phase: ${phase.title}`);
            try {
              const epics = await generateEpics(phase, metadata, anthropicApiKey, openAIKey);
              updatedPhases.push({
                ...phase,
                epics: epics.map((epic, index) => ({
                  id: `${phase.id}-epic-${index + 1}`,
                  title: epic.title,
                  description: epic.description,
                  suggestedRole: epic.suggestedRole,
                  selected: true
                }))
              });
              epicsGenerated++;
              
              // Add delay between generations
              if (epicsGenerated < maxEpicsToGenerate) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (error) {
              console.error(`Failed to generate epics for ${phase.title}:`, error);
              updatedPhases.push(phase); // Keep original
            }
          } else {
            updatedPhases.push(phase);
          }
        }
        
        // Now generate issues - but simplified to avoid timeout
        let issueId = 1;
        for (const phase of updatedPhases) {
          for (const epic of phase.epics) {
            if (epic.selected !== false) {
              // Create 2 simple issues per epic
              for (let i = 1; i <= 2; i++) {
                allIssues.push({
                  id: `issue-${issueId++}`,
                  title: `[${epic.suggestedRole}] ${epic.title} - Task ${i}`,
                  body: `## Context\n${epic.description}\n\n## Role\n${epic.suggestedRole}\n\n## Phase\n${phase.title}\n\n## Tasks\n- [ ] Implement ${epic.title.toLowerCase()} requirements\n- [ ] Document approach\n- [ ] Test implementation\n- [ ] Get review and approval\n\n## Acceptance Criteria\n- Implementation complete\n- Tests passing\n- Documentation updated\n- Reviewed and approved`,
                  labels: [
                    `phase:${phase.id}`,
                    `role:${epic.suggestedRole.toLowerCase().replace(/\s+/g, '-')}`,
                    'sparc-enabled'
                  ],
                  assignee: epic.suggestedRole,
                  phaseId: phase.id,
                  phaseTitle: phase.title,
                  epicId: epic.id,
                  epicTitle: epic.title,
                  estimatedHours: 8 + Math.floor(Math.random() * 24) // 8-32 hours
                });
              }
            }
          }
        }
        
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            issues: allIssues
          })
        };
        
      } catch (error) {
        console.error('Error generating issues:', error);
        
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Failed to generate issues',
            message: error.message
          })
        };
      }
    }
    
    // Route: Create GitHub issues
    else if (pathSegments.includes('create-github-issues')) {
      const { repository, issues } = body;
      
      if (!repository || !issues || !Array.isArray(issues)) {
        throw new Error('Invalid request: repository and issues array required');
      }
      
      // Get GitHub token
      const githubToken = await getGitHubToken();
      
      // Parse repository format (owner/repo)
      const [owner, repo] = repository.split('/');
      
      if (!owner || !repo) {
        throw new Error('Invalid repository format. Use owner/repo');
      }
      
      console.log(`Creating ${issues.length} issues for repository ${repository}`);
      
      const createdIssues = [];
      const errors = [];
      
      // Create each issue
      for (const issue of issues) {
        try {
          const issueData = JSON.stringify({
            title: issue.title,
            body: issue.body,
            labels: issue.labels || []
          });
        
          const response = await new Promise((resolve, reject) => {
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
          
          createdIssues.push({
            id: response.id,
            number: response.number,
            title: response.title,
            url: response.html_url
          });
          
          // Rate limiting - GitHub allows 5000 requests per hour
          await new Promise(resolve => setTimeout(resolve, 100));
          
        } catch (issueError) {
          console.error(`Failed to create issue "${issue.title}":`, issueError);
          errors.push({
            title: issue.title,
            error: issueError.message
          });
        }
      }
      
      console.log(`Created ${createdIssues.length} issues, ${errors.length} failed`);
      
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          success: createdIssues.length > 0,
          message: errors.length > 0 
            ? `Created ${createdIssues.length} issues, ${errors.length} failed`
            : `Created ${createdIssues.length} GitHub issues`,
          issues: createdIssues,
          errors: errors
        })
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
      statusCode: error.message.includes('Configuration') ? 500 : 400,
      headers: corsHeaders,
      body: JSON.stringify({
        error: error.message || 'An error occurred'
      })
    };
  }
};