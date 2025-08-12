const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const https = require('https');

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
      SecretId: 'arn:aws:secretsmanager:us-east-1:984906149037:secret:github_token-sIuriy'
    });
    
    const response = await secretsClient.send(command);
    
    // The secret is stored as a plain string, not JSON
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
    
    // Get API key from environment (you should use Secrets Manager in production)
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    
    if (!anthropicApiKey) {
      throw new Error('Anthropic API key not configured');
    }

    // Handle different plan generation endpoints
    if (pathSegments.includes('parse-readme')) {
      // Parse README content
      const { content } = body;
      
      const prompt = `Analyze this README content and extract the following information in JSON format:
      - title: Project title
      - description: Brief description (max 200 chars)
      - domain: One of [e-commerce, social-media, productivity, healthcare, education, finance, entertainment, devtools, iot, general]
      - userTypes: Array of target user types
      - techStack: Array of technologies mentioned
      - features: Array of key features (max 5)
      - complexity: One of [simple, moderate, complex]
      
      README content:
      ${content}
      
      Return only valid JSON, no additional text.`;

      const response = await callClaude(prompt, anthropicApiKey);
      
      try {
        const parsed = JSON.parse(response);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(parsed)
        };
      } catch (e) {
        // Fallback if JSON parsing fails
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({
            title: 'Project',
            description: 'A new project',
            domain: 'general',
            userTypes: ['developers'],
            techStack: [],
            features: [],
            complexity: 'moderate'
          })
        };
      }
    } else if (pathSegments.includes('populate-form')) {
      // AI form population
      const { readmeContent, existingData } = body;
      
      const prompt = `Based on this README, suggest improvements and additions to the project metadata.
      
      Current data:
      ${JSON.stringify(existingData, null, 2)}
      
      README:
      ${readmeContent}
      
      Return improved metadata in the same JSON format with better title, description, targetUsers, techStack, features, domain, and complexity.
      Return only valid JSON.`;

      const response = await callClaude(prompt, anthropicApiKey);
      
      try {
        const suggestions = JSON.parse(response);
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(suggestions)
        };
      } catch (e) {
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify(existingData)
        };
      }
    } else if (pathSegments.includes('generate-phases')) {
      // Generate project phases
      const { metadata, readmeContent } = body;
      
      // Log request for debugging
      console.log('Generating phases for:', metadata.title);
      
      try {
        const prompt = `Create a project plan with 3 phases for: ${metadata.title}
        
Tech: ${metadata.techStack.join(', ')}
Features: ${metadata.features.join(', ')}

Return a JSON array with 3 phase objects. Each phase should have:
- id (string)
- name (string) 
- description (string)
- duration (string like "2 weeks")
- epics (array with 2 epics, each having: id, title, description, issues array)
- each issue should have: id, title, description, assignee (from: architect, backend-dev, frontend-dev, tester), priority (high/medium/low), estimatedHours (number 2-40)

Keep descriptions concise. Return ONLY valid JSON, no explanation.`;

        const response = await callClaude(prompt, anthropicApiKey);
        
        // Clean response to ensure it's valid JSON
        const cleanedResponse = response.trim();
        const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        const jsonStr = jsonMatch ? jsonMatch[0] : cleanedResponse;
        
        try {
          const phases = JSON.parse(jsonStr);
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ phases })
          };
        } catch (parseError) {
          console.error('Failed to parse Claude response:', parseError);
          console.error('Response was:', response);
          
          // Return a default structure if parsing fails
          return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({
              phases: [
                {
                  id: '1',
                  name: 'Foundation',
                  description: 'Set up project structure and core functionality',
                  duration: '2 weeks',
                  epics: [
                    {
                      id: '1-1',
                      title: 'Project Setup',
                      description: 'Initialize project and set up development environment',
                      issues: [
                        {
                          id: '1-1-1',
                          title: 'Initialize repository',
                          description: 'Set up Git repository and initial project structure',
                          assignee: 'backend-dev',
                          priority: 'high',
                          estimatedHours: 4
                        }
                      ]
                    }
                  ]
                },
                {
                  id: '2',
                  name: 'Core Development',
                  description: 'Build main features and functionality',
                  duration: '4 weeks',
                  epics: []
                },
                {
                  id: '3',
                  name: 'Polish & Deploy',
                  description: 'Testing, optimization, and deployment',
                  duration: '2 weeks',
                  epics: []
                }
              ]
            })
          };
        }
      } catch (error) {
        console.error('Error in generate-phases:', error);
        
        // Always return CORS headers even on error
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({
            error: 'Failed to generate phases',
            phases: [] // Return empty array so UI can handle gracefully
          })
        };
      }
    } else if (pathSegments.includes('create-github-issues')) {
      // Create actual GitHub issues
      const { repository, phases, summary } = body;
      
      if (!repository) {
        throw new Error('Invalid request: repository required');
      }
      
      // Extract issues from phases structure
      let issues = [];
      if (phases && Array.isArray(phases)) {
        phases.forEach(phase => {
          if (phase.epics && Array.isArray(phase.epics)) {
            phase.epics.forEach(epic => {
              if (epic.issues && Array.isArray(epic.issues)) {
                epic.issues.forEach(issue => {
                  issues.push({
                    title: `[${phase.name}] ${issue.title}`,
                    description: `**Phase:** ${phase.name}\n**Epic:** ${epic.title}\n\n${issue.description}\n\n**Estimated Hours:** ${issue.estimatedHours}\n**Priority:** ${issue.priority}\n**Assignee Role:** ${issue.assignee}`,
                    labels: [phase.name.toLowerCase().replace(/\s+/g, '-'), issue.priority],
                    assignees: []
                  });
                });
              }
            });
          }
        });
      }
      
      if (issues.length === 0) {
        throw new Error('No issues found to create');
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
            body: issue.description,
            labels: issue.labels || [],
            assignees: issue.assignees || []
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
        } catch (issueError) {
          console.error(`Failed to create issue "${issue.title}":`, issueError);
          errors.push({
            title: issue.title,
            error: issueError.message
          });
        }
      }
      
      // Log summary
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