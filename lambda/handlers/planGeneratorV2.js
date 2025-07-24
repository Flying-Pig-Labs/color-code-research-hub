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

// Call Claude API
const callClaude = async (prompt, apiKey) => {
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

  return new Promise((resolve, reject) => {
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
        } else {
          reject(new Error(`Claude API error: ${res.statusCode} ${responseData}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
};

// Extract JSON from Claude response
const extractJSON = (response) => {
  // Try to find JSON in the response
  const jsonMatch = response.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
    }
  }
  
  // Try array format
  const arrayMatch = response.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return { phases: JSON.parse(arrayMatch[0]) };
    } catch (e) {
      console.error('Failed to parse array:', e);
    }
  }
  
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
const generatePhases = async (projectInfo, readmeContent, apiKey) => {
  console.log('Step 1: Generating phases...');
  
  const prompt = buildPrompt(PHASE_GENERATOR_PROMPT, {
    domain: projectInfo.domain || 'software',
    readmeContent: readmeContent.substring(0, 3000) // Limit README length
  });
  
  const response = await callClaude(prompt, apiKey);
  const result = extractJSON(response);
  
  return result.phases;
};

// Step 2: Generate epics for each phase
const generateEpics = async (phase, projectInfo, apiKey) => {
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
  
  const response = await callClaude(prompt, apiKey);
  const result = extractJSON(response);
  
  return result.tasks || [];
};

// Step 3: Format issues for GitHub
const formatIssue = async (task, phase, projectInfo, apiKey) => {
  const prompt = buildPrompt(ISSUE_FORMATTER_PROMPT, {
    taskTitle: task.title,
    taskDescription: task.description,
    assignedRole: task.suggestedRole,
    phaseTitle: phase.title,
    productContext: projectInfo.title
  });
  
  const response = await callClaude(prompt, apiKey);
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
    
    // Get API key
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Route: Generate full project plan
    if (pathSegments.includes('generate-full-plan')) {
      const { metadata, readmeContent } = body;
      
      console.log('Starting full plan generation for:', metadata.title);
      
      try {
        // Step 1: Generate phases
        const phases = await generatePhases(metadata, readmeContent, anthropicApiKey);
        console.log(`Generated ${phases.length} phases`);
        
        // Step 2: Generate epics for each phase (with rate limiting)
        const phasesWithEpics = [];
        
        for (const phase of phases) {
          // Add delay between phases to avoid rate limiting
          if (phasesWithEpics.length > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
          const epics = await generateEpics(phase, metadata, anthropicApiKey);
          phasesWithEpics.push({
            ...phase,
            epics: epics.map((epic, index) => ({
              id: `${phase.id}-epic-${index + 1}`,
              title: epic.title,
              description: epic.description,
              suggestedRole: epic.suggestedRole,
              issues: [] // Will be populated if user proceeds
            }))
          });
        }
        
        // Step 3: Format a sample of issues (first 3) to show preview
        const sampleIssues = [];
        let issueCount = 0;
        
        for (const phase of phasesWithEpics.slice(0, 2)) { // First 2 phases only
          for (const epic of phase.epics.slice(0, 2)) { // First 2 epics only
            if (issueCount >= 3) break;
            
            const issue = await formatIssue(
              { 
                title: epic.title, 
                description: epic.description, 
                suggestedRole: epic.suggestedRole 
              },
              phase,
              metadata,
              anthropicApiKey
            );
            
            sampleIssues.push({
              ...issue,
              epicId: epic.id
            });
            
            issueCount++;
            
            // Rate limiting
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        
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
        for (const phase of phases) {
          for (const epic of phase.epics) {
            if (epic.selected !== false) { // Include by default unless explicitly deselected
              // Generate 2-4 issues per epic
              const issueCount = Math.floor(Math.random() * 3) + 2;
              
              for (let i = 0; i < issueCount; i++) {
                const issue = await formatIssue(
                  {
                    title: `${epic.title} - Task ${i + 1}`,
                    description: epic.description,
                    suggestedRole: epic.suggestedRole
                  },
                  phase,
                  metadata,
                  anthropicApiKey
                );
                
                allIssues.push({
                  ...issue,
                  epicId: epic.id,
                  epicTitle: epic.title
                });
                
                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 500));
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