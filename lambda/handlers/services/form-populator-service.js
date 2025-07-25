const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
const { FORM_POPULATION_PROMPT } = require('../prompts/form-population.js');
const { PromptSanitizer, buildSafePrompt } = require('./prompt-sanitizer.js');

const bedrock = new BedrockRuntimeClient({ region: 'us-east-1' });

// Claude model configuration - using the exact same model as CLI
const CLAUDE_MODEL_ID = 'anthropic.claude-3-sonnet-20240229-v1:0';

class AIFormPopulator {
  /**
   * Populate form fields based on README content
   * Follows the exact same process as the CLI
   */
  async populateFormFields(readmeContent, existingData = {}) {
    // Sanitize inputs
    const sanitizedReadme = PromptSanitizer.sanitizeReadme(readmeContent);
    
    // Check for suspicious patterns
    if (PromptSanitizer.containsSuspiciousPatterns(readmeContent)) {
      throw new Error('Input contains potentially malicious patterns');
    }

    // Build the prompt with existing data as context
    const prompt = buildSafePrompt(FORM_POPULATION_PROMPT, {
      readmeContent: sanitizedReadme,
      title: existingData.title || 'Not provided',
      description: existingData.description || 'Not provided',
      basicFeatures: existingData.features?.join(', ') || 'None detected',
      basicTechStack: existingData.techStack?.join(', ') || 'None detected'
    });

    try {
      // Call Claude
      const response = await this.callClaude(prompt);
      const suggestions = this.extractJSON(response);

      // Post-process suggestions to ensure quality
      return {
        title: suggestions.title,
        description: suggestions.description,
        targetUsers: this.deduplicateAndClean(suggestions.targetUsers),
        techStack: this.deduplicateAndClean(suggestions.techStack),
        features: this.deduplicateAndClean(suggestions.features),
        domain: this.validateDomain(suggestions.domain),
        complexity: suggestions.complexity
      };
    } catch (error) {
      console.error('AI form population failed:', error);
      // Return fallback suggestions based on basic parsing
      return this.getFallbackSuggestions(existingData);
    }
  }

  /**
   * Deduplicate and clean array items
   */
  deduplicateAndClean(items) {
    if (!Array.isArray(items)) return [];
    
    const seen = new Set();
    return items
      .map(item => item.trim())
      .filter(item => item.length > 0 && item.length < 100)
      .filter(item => {
        const normalized = item.toLowerCase();
        if (seen.has(normalized)) return false;
        seen.add(normalized);
        return true;
      });
  }

  /**
   * Validate domain against allowed values
   */
  validateDomain(domain) {
    const validDomains = [
      'e-commerce', 'social-media', 'productivity', 'healthcare',
      'education', 'finance', 'entertainment', 'devtools',
      'iot', 'general', 'communication', 'analytics', 'gaming'
    ];

    const normalized = domain.toLowerCase().replace(/\s+/g, '-');
    return validDomains.includes(normalized) ? normalized : 'general';
  }

  /**
   * Get fallback suggestions if AI fails
   */
  getFallbackSuggestions(existingData = {}) {
    return {
      title: existingData.title || 'Untitled Project',
      description: existingData.description || 'A new project',
      targetUsers: ['developers', 'end-users'],
      techStack: existingData.techStack || ['JavaScript', 'Node.js'],
      features: existingData.features || ['Core functionality'],
      domain: 'general',
      complexity: 'moderate'
    };
  }

  /**
   * Call Claude API using Bedrock
   */
  async callClaude(prompt) {
    const command = new InvokeModelCommand({
      modelId: CLAUDE_MODEL_ID,
      contentType: 'application/json',
      accept: 'application/json',
      body: JSON.stringify({
        prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
        max_tokens_to_sample: 2048,
        temperature: 0.7,
        stop_sequences: ["\n\nHuman:"]
      })
    });

    const response = await bedrock.send(command);
    const responseData = JSON.parse(new TextDecoder().decode(response.body));
    return responseData.completion;
  }

  /**
   * Extract JSON from Claude's response
   */
  extractJSON(content) {
    try {
      // Try to find JSON between code blocks
      const codeBlockMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1]);
      }

      // Try to find raw JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      throw new Error('No JSON found in response');
    } catch (error) {
      console.error('Failed to extract JSON:', error);
      throw error;
    }
  }
}

// Singleton function for easy access
async function populateFormWithAI(readmeContent, existingData) {
  const populator = new AIFormPopulator();
  return populator.populateFormFields(readmeContent, existingData);
}

module.exports = {
  AIFormPopulator,
  populateFormWithAI
};