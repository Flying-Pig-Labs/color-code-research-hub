const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { PHASE_GENERATOR_PROMPT } = require('../prompts/phase-generator.js');
const { EPIC_GENERATOR_PROMPT } = require('../prompts/epic-generator.js');
const { ISSUE_FORMATTER_PROMPT } = require('../prompts/issue-formatter.js');
const { buildSafePrompt } = require('./prompt-sanitizer.js');

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });

// Claude model configuration - using the exact same model as CLI
const CLAUDE_MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';

/**
 * Main orchestrator that follows the exact same 3-step process as the CLI
 */
class LLMOrchestrator {
  /**
   * Generate project plan following the exact CLI sequence:
   * 1. Generate phases based on README
   * 2. For each phase, generate epics/tasks with role assignments
   * 3. Format issues for GitHub
   */
  async generateProjectPlan(projectInfo, readmeContent) {
    console.log('🤖 Starting LLM orchestration...');
    
    // Step 1: Generate phases based on README
    console.log('🤖 Step 1: Generating project phases...');
    const phases = await this.generatePhases(projectInfo, readmeContent);
    
    // Step 2: For each phase, generate epics/tasks with role assignments
    console.log('👥 Step 2: Generating epics and assigning roles...');
    const phasesWithTasks = await this.generateEpicsForPhases(phases, projectInfo);
    
    // Step 3: Format issues for GitHub
    console.log('📝 Step 3: Formatting issues for GitHub...');
    const formattedPhases = await this.formatIssuesForGitHub(phasesWithTasks, projectInfo);
    
    return {
      summary: {
        title: projectInfo.title,
        description: projectInfo.description,
        domain: projectInfo.domain,
        repository: projectInfo.repository || 'unknown/unknown',
        branch: projectInfo.branch || 'main',
        targetUsers: projectInfo.targetUsers,
        techStack: projectInfo.techStack,
        features: projectInfo.features,
        complexity: projectInfo.complexity
      },
      phases: formattedPhases
    };
  }

  /**
   * Step 1: Generate phases using the exact same prompt as CLI
   */
  async generatePhases(projectInfo, readmeContent) {
    const prompt = buildSafePrompt(PHASE_GENERATOR_PROMPT, {
      domain: projectInfo.domain,
      readmeContent: readmeContent
    });

    const response = await this.callClaude(prompt);
    const phases = this.extractJSON(response);
    
    if (!phases || !phases.phases) {
      throw new Error('Failed to generate phases');
    }

    return phases.phases;
  }

  /**
   * Step 2: Generate epics for each phase with role assignments
   */
  async generateEpicsForPhases(phases, projectInfo) {
    const results = await Promise.all(
      phases.map(async (phase) => {
        const commonRoles = this.getCommonRolesForPhase(phase.title);
        
        const prompt = buildSafePrompt(EPIC_GENERATOR_PROMPT, {
          phaseTitle: phase.title,
          phaseDescription: phase.description,
          productContext: `${projectInfo.title}: ${projectInfo.description}`,
          commonRoles: commonRoles.join('\n'),
          phaseId: phase.id
        });

        const response = await this.callClaude(prompt);
        const epicGeneration = this.extractJSON(response);

        return {
          id: phase.id,
          title: phase.title,
          description: phase.description,
          roles: epicGeneration.roles,
          tasks: epicGeneration.tasks,
          issues: [],
          approved: false
        };
      })
    );

    return results;
  }

  /**
   * Step 3: Format issues for GitHub - process in batches like CLI
   */
  async formatIssuesForGitHub(phasesWithTasks, projectInfo) {
    const formattedPhases = [];
    const BATCH_SIZE = 3; // Same batch size as CLI

    for (const phase of phasesWithTasks) {
      const issues = [];
      
      console.log(`Processing ${phase.tasks.length} tasks for phase: ${phase.title}`);
      
      for (let i = 0; i < phase.tasks.length; i += BATCH_SIZE) {
        const batch = phase.tasks.slice(i, i + BATCH_SIZE);
        
        const batchResults = await Promise.all(
          batch.map(async (task) => {
            const prompt = buildSafePrompt(ISSUE_FORMATTER_PROMPT, {
              taskTitle: task.title,
              taskDescription: task.description,
              assignedRole: task.suggestedRole,
              phaseTitle: phase.title,
              productContext: projectInfo.title
            });

            try {
              const response = await this.callClaude(prompt);
              const formatted = this.extractJSON(response);

              return {
                title: formatted.title,
                description: formatted.body,
                role: task.suggestedRole
              };
            } catch (error) {
              console.warn('Failed to format issue, using fallback:', error);
              return {
                title: task.title,
                description: task.description,
                role: task.suggestedRole
              };
            }
          })
        );
        
        issues.push(...batchResults);
        
        // Add delay between batches to respect rate limits
        if (i + BATCH_SIZE < phase.tasks.length) {
          console.log(`Processed batch ${Math.floor(i / BATCH_SIZE) + 1}, waiting before next batch...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      formattedPhases.push({
        id: phase.id,
        title: phase.title,
        description: phase.description,
        roles: phase.roles,
        issues,
        approved: true
      });
      
      // Add delay between phases
      if (formattedPhases.length < phasesWithTasks.length) {
        console.log(`Completed phase ${phase.title}, waiting before next phase...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    return formattedPhases;
  }

  /**
   * Get common roles for phase - exact same mapping as CLI
   */
  getCommonRolesForPhase(phaseTitle) {
    const rolesByPhase = {
      'Discovery': [
        'Market Research Analyst - Conducts market research and competitive analysis',
        'User Research Specialist - Performs user interviews and creates personas',
        'Product Owner - Defines vision and prioritizes features'
      ],
      'Specification': [
        'Product Requirements Author - Creates comprehensive PRDs',
        'UI/UX Designer - Designs wireframes and user interfaces',
        'System Architect - Reviews technical feasibility'
      ],
      'Architecture': [
        'System Architect - Designs scalable system architecture',
        'Sprint Planner - Creates actionable sprint plans',
        'Tech Lead - Reviews and approves technical decisions'
      ],
      'Implementation': [
        'Frontend Developer - Implements UI components',
        'Backend Developer - Builds APIs and services',
        'Database Engineer - Designs data models',
        'DevOps Engineer - Sets up CI/CD pipelines'
      ],
      'Testing': [
        'Test Engineer - Creates test plans and automation',
        'Security Auditor - Identifies vulnerabilities',
        'Performance Tester - Validates system performance'
      ],
      'Deployment': [
        'Release Manager - Coordinates deployments',
        'DevOps Engineer - Manages infrastructure',
        'Technical Writer - Creates documentation'
      ],
      'Monitoring': [
        'Analytics Engineer - Implements tracking',
        'Site Reliability Engineer - Ensures system reliability',
        'Support Engineer - Handles user issues'
      ],
      'Enhancement': [
        'Feature Developer - Implements new features',
        'Refactoring Specialist - Improves code quality',
        'Product Owner - Prioritizes enhancements'
      ]
    };

    // Find matching phase
    for (const [key, roles] of Object.entries(rolesByPhase)) {
      if (phaseTitle.toLowerCase().includes(key.toLowerCase())) {
        return roles;
      }
    }

    // Default roles if no match
    return [
      'Product Owner - Defines requirements and priorities',
      'Software Engineer - Implements features and fixes',
      'QA Engineer - Ensures quality standards'
    ];
  }

  /**
   * Call Claude API using Bedrock with retry and exponential backoff
   */
  async callClaude(prompt, retries = 3) {
    const command = new InvokeModelCommand({
      modelId: CLAUDE_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: 4096,
        temperature: 0.7,
        stop_sequences: ["\n\nHuman:"]
      })
    });

    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const response = await bedrock.send(command);
        const responseData = JSON.parse(new TextDecoder().decode(response.body));
        return responseData.completion;
      } catch (error) {
        const isRateLimit = error.message?.includes('Too many requests') || 
                           error.message?.includes('rate limit') ||
                           error.$metadata?.httpStatusCode === 429;
        
        if (isRateLimit && attempt < retries - 1) {
          // Exponential backoff: 2s, 4s, 8s
          const waitTime = Math.pow(2, attempt + 1) * 1000;
          console.log(`Rate limited, waiting ${waitTime}ms before retry ${attempt + 1}/${retries}`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw error;
        }
      }
    }
  }

  /**
   * Extract JSON from Claude's response with better error handling
   */
  extractJSON(content) {
    try {
      // First, try to parse the entire response as JSON
      try {
        const parsed = JSON.parse(content);
        // If it's a pure array, wrap it appropriately
        return Array.isArray(parsed) ? { phases: parsed } : parsed;
      } catch (e) {
        // Not pure JSON, continue with extraction
      }

      // Try to find JSON between code blocks
      const codeBlockMatch = content.match(/```(?:json)?\s*([\{\[][\s\S]*?[\}\]])\s*```/);
      if (codeBlockMatch) {
        // Clean up common formatting issues
        let cleanJson = codeBlockMatch[1]
          .replace(/\n\s*\n/g, '\n')  // Remove extra newlines
          .replace(/,\s*}/g, '}')     // Remove trailing commas in objects
          .replace(/,\s*]/g, ']');    // Remove trailing commas in arrays
        
        const parsed = JSON.parse(cleanJson);
        return Array.isArray(parsed) ? { phases: parsed } : parsed;
      }

      // Try to find raw JSON object
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        let cleanJson = jsonMatch[0]
          .replace(/\n\s*\n/g, '\n')
          .replace(/,\s*}/g, '}')
          .replace(/,\s*]/g, ']');
        
        return JSON.parse(cleanJson);
      }

      // Try to find array
      const arrayMatch = content.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        let cleanArray = arrayMatch[0]
          .replace(/\n\s*\n/g, '\n')
          .replace(/,\s*]/g, ']');
        
        const parsed = JSON.parse(cleanArray);
        return Array.isArray(parsed) ? { phases: parsed } : parsed;
      }

      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Failed to extract JSON:', error);
      console.error('Content sample:', content.substring(0, 200));
      throw error;
    }
  }
}

// Export singleton function to match CLI pattern
async function generateProjectPlan(projectInfo, readmeContent) {
  const orchestrator = new LLMOrchestrator();
  return orchestrator.generateProjectPlan(projectInfo, readmeContent);
}

module.exports = {
  LLMOrchestrator,
  generateProjectPlan
};