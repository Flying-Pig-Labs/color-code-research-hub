// Maximum lengths for different input types
const MAX_LENGTHS = {
  title: 256,
  description: 2048,
  readme: 50000,
  domain: 100,
  role: 100,
  phase: 200
};

class PromptSanitizer {
  /**
   * Sanitize user input for safe inclusion in prompts
   * Prevents prompt injection attacks
   */
  static sanitizeInput(input, maxLength = 1000) {
    if (!input || typeof input !== 'string') {
      return '';
    }

    return input
      // Remove potential prompt injection patterns
      .replace(/\{[^}]*\}/g, '') // Remove template syntax
      .replace(/\$\{[^}]*\}/g, '') // Remove template literals
      .replace(/<%[^%>]*%>/g, '') // Remove ERB-style tags
      .replace(/\{\{[^}]*\}\}/g, '') // Remove mustache templates
      
      // Remove potential command sequences
      .replace(/\n\s*Human:/gi, '\n[User]:')
      .replace(/\n\s*Assistant:/gi, '\n[Agent]:')
      .replace(/\n\s*System:/gi, '\n[Note]:')
      
      // Limit consecutive newlines
      .replace(/\n{3,}/g, '\n\n')
      
      // Remove control characters
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      
      // Truncate to max length
      .substring(0, maxLength);
  }

  /**
   * Build safe prompt with template replacement
   */
  static buildSafePrompt(template, variables) {
    let prompt = template;
    
    for (const [key, value] of Object.entries(variables)) {
      const sanitized = this.sanitizeInput(value, MAX_LENGTHS[key] || 5000);
      prompt = prompt.replace(new RegExp(`\\{${key}\\}`, 'g'), sanitized);
    }
    
    return prompt;
  }

  /**
   * Sanitize project info object
   */
  static sanitizeProjectInfo(projectInfo) {
    return {
      title: this.sanitizeInput(projectInfo.title, MAX_LENGTHS.title),
      description: this.sanitizeInput(projectInfo.description, MAX_LENGTHS.description),
      domain: this.sanitizeInput(projectInfo.domain, MAX_LENGTHS.domain),
      features: projectInfo.features?.map(f => this.sanitizeInput(f, 200)) || []
    };
  }

  /**
   * Sanitize README content
   */
  static sanitizeReadme(readme) {
    return this.sanitizeInput(readme, MAX_LENGTHS.readme);
  }

  /**
   * Check for suspicious patterns
   */
  static containsSuspiciousPatterns(input) {
    const suspiciousPatterns = [
      /ignore.*previous.*instructions/i,
      /disregard.*above/i,
      /new.*instructions.*:/i,
      /system.*prompt/i,
      /\[INST\]/i,
      /<\|im_start\|>/i
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }
}

function buildSafePrompt(template, variables) {
  return PromptSanitizer.buildSafePrompt(template, variables);
}

module.exports = {
  PromptSanitizer,
  buildSafePrompt
};