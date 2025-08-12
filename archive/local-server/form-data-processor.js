/**
 * Form Data Processor for Competitive Intelligence Teams
 * Merges user form inputs with template defaults and generates dynamic configurations
 */

const templates = require('./CLAUDE_FLOW_COMPETITIVE_RESEARCH_TEMPLATES.json');

class FormDataProcessor {
  constructor() {
    this.templates = templates;
  }

  /**
   * Process form data and generate swarm configuration
   * @param {string} teamType - 'red', 'black', or 'white'
   * @param {object} formData - User form inputs
   * @returns {object} Complete swarm configuration
   */
  generateSwarmConfig(teamType, formData) {
    const template = this.getTemplateByTeam(teamType);
    if (!template) {
      throw new Error(`Invalid team type: ${teamType}`);
    }

    // Merge form data with template defaults
    const config = {
      ...template,
      customizations: this.extractCustomizations(teamType, formData),
      dynamic_prompts: this.generateDynamicPrompts(teamType, formData),
      grading_weights: this.adjustGradingWeights(teamType, formData),
      swarm_config: this.generateSwarmParameters(teamType, formData),
      company_name: formData.companyName,
      timestamp: new Date().toISOString()
    };

    return config;
  }

  /**
   * Get template by team type
   */
  getTemplateByTeam(teamType) {
    const teamMap = {
      'red': 'market_disruption',
      'black': 'tool_reverse_engineering',
      'white': 'whitespace_opportunity'
    };
    
    const templateId = teamMap[teamType];
    return this.templates.competitive_intelligence_templates.find(t => t.template_id === templateId);
  }

  /**
   * Extract customizations from form data
   */
  extractCustomizations(teamType, formData) {
    const customizations = {};

    switch (teamType) {
      case 'red':
        customizations.analysisFocus = formData.analysisFocus || ['revenue_unbundling'];
        customizations.marketScope = this.processMarketScope(formData);
        customizations.disruptionTimeline = formData.disruptionTimeline || 6;
        customizations.investmentRange = formData.investmentRange || ['small', 'medium'];
        customizations.targetMarketSize = formData.targetMarketSize || ['billion_plus'];
        customizations.competitiveIntensity = formData.competitiveIntensity || 'low_competition';
        customizations.customKeywords = formData.customKeywords || [];
        break;

      case 'black':
        customizations.toolCategories = formData.toolCategories || ['data_infrastructure'];
        customizations.informationSources = this.processInformationSources(formData);
        customizations.implementationComplexity = formData.implementationComplexity || 'core';
        customizations.teamSizeConstraint = formData.teamSizeConstraint || 'small';
        customizations.techStackPreference = formData.techStackPreference || ['javascript', 'python'];
        customizations.costComparisonBaseline = this.processCostBaseline(formData);
        customizations.evidenceThreshold = formData.evidenceThreshold || 3;
        break;

      case 'white':
        customizations.opportunityType = formData.opportunityType || ['integration_gaps'];
        customizations.targetCustomerSize = formData.targetCustomerSize || ['midmarket'];
        customizations.businessModelPreference = formData.businessModelPreference || ['saas_subscription'];
        customizations.technicalApproach = formData.technicalApproach || 'standalone';
        customizations.marketEntrySpeed = formData.marketEntrySpeed || '3_months';
        customizations.competitiveLandscape = formData.competitiveLandscape || 'low_competition';
        customizations.successMetrics = formData.successMetrics || ['revenue', 'users'];
        customizations.riskTolerance = formData.riskTolerance || 2;
        break;
    }

    return customizations;
  }

  /**
   * Generate dynamic prompts based on form data
   */
  generateDynamicPrompts(teamType, formData) {
    const prompts = [];

    switch (teamType) {
      case 'red':
        if (formData.analysisFocus?.includes('revenue_unbundling')) {
          prompts.push("Analyze the company's revenue streams and identify specific features or services that could be unbundled into standalone products.");
        }
        if (formData.analysisFocus?.includes('geographic_gaps')) {
          prompts.push("Identify geographic markets where the company has limited or no presence and assess entry opportunities.");
        }
        if (formData.customKeywords?.length > 0) {
          prompts.push(`Focus analysis on these specific areas: ${formData.customKeywords.join(', ')}`);
        }
        break;

      case 'black':
        const sources = this.processInformationSources(formData);
        prompts.push(`Prioritize information from these sources: ${sources.enabled.join(', ')}`);
        
        if (formData.implementationComplexity === 'mvp') {
          prompts.push("Focus on identifying the absolute minimum features needed for a functional alternative.");
        } else if (formData.implementationComplexity === 'enhanced') {
          prompts.push("Identify opportunities to improve upon the original tool's functionality.");
        }
        break;

      case 'white':
        const opportunities = formData.opportunityType || [];
        if (opportunities.includes('integration_gaps')) {
          prompts.push("Identify APIs and services that the target doesn't integrate with but their users need.");
        }
        if (opportunities.includes('vertical_solutions')) {
          prompts.push("Find industry-specific use cases that could benefit from specialized solutions.");
        }
        
        const entrySpeed = this.getEntrySpeedDays(formData.marketEntrySpeed);
        prompts.push(`Prioritize opportunities that can reach market within ${entrySpeed} days.`);
        break;
    }

    return prompts;
  }

  /**
   * Adjust grading weights based on form preferences
   */
  adjustGradingWeights(teamType, formData) {
    const template = this.getTemplateByTeam(teamType);
    const baseWeights = { ...template.grading_rubric };

    switch (teamType) {
      case 'red':
        // Adjust weights based on competitive intensity preference
        if (formData.competitiveIntensity === 'blue_ocean') {
          baseWeights.market_opportunity_score *= 1.5;
          baseWeights.disruption_potential_score *= 0.8;
        }
        // Adjust for investment range
        if (formData.investmentRange?.includes('micro')) {
          baseWeights.implementation_feasibility_score *= 1.3;
        }
        break;

      case 'black':
        // Adjust weights based on team size
        if (formData.teamSizeConstraint === 'solo') {
          baseWeights.implementation_complexity_score *= 1.5;
          baseWeights.cost_benefit_score *= 0.8;
        }
        // Adjust for evidence threshold
        if (formData.evidenceThreshold >= 3) {
          baseWeights.evidence_quality_score *= 1.2;
        }
        break;

      case 'white':
        // Adjust weights based on risk tolerance
        const riskMultiplier = 1 + (formData.riskTolerance - 2) * 0.2;
        baseWeights.innovation_score *= riskMultiplier;
        
        // Adjust for success metrics
        if (formData.successMetrics?.includes('strategic')) {
          baseWeights.strategic_value_score *= 1.3;
        }
        break;
    }

    // Normalize weights to sum to 100
    const total = Object.values(baseWeights).reduce((sum, weight) => sum + weight, 0);
    Object.keys(baseWeights).forEach(key => {
      baseWeights[key] = Math.round((baseWeights[key] / total) * 100);
    });

    return baseWeights;
  }

  /**
   * Generate swarm parameters based on form data
   */
  generateSwarmParameters(teamType, formData) {
    const params = {
      topology: 'hierarchical',
      maxAgents: 6,
      strategy: 'adaptive',
      memory_enabled: true
    };

    // Adjust agent count based on complexity
    switch (teamType) {
      case 'red':
        if (formData.analysisFocus?.length > 3) {
          params.maxAgents = 8;
        }
        if (formData.marketScope === 'global') {
          params.maxAgents += 2;
        }
        break;

      case 'black':
        params.maxAgents = Math.min(formData.toolCategories?.length * 2 || 6, 10);
        if (formData.implementationComplexity === 'enhanced') {
          params.strategy = 'parallel';
        }
        break;

      case 'white':
        params.maxAgents = Math.min(formData.opportunityType?.length * 1.5 || 6, 12);
        if (formData.riskTolerance >= 3) {
          params.strategy = 'exploratory';
        }
        break;
    }

    return params;
  }

  /**
   * Helper methods
   */
  processMarketScope(formData) {
    if (formData.marketScope === 'specific' && formData.specificCountries) {
      return {
        type: 'specific',
        countries: formData.specificCountries
      };
    }
    return formData.marketScope || 'global';
  }

  processInformationSources(formData) {
    const sources = formData.informationSources || {};
    return {
      enabled: Object.entries(sources)
        .filter(([_, enabled]) => enabled)
        .map(([source, _]) => source),
      disabled: Object.entries(sources)
        .filter(([_, enabled]) => !enabled)
        .map(([source, _]) => source)
    };
  }

  processCostBaseline(formData) {
    if (formData.costComparisonBaseline === 'custom' && formData.customCostThreshold) {
      return {
        type: 'custom',
        threshold: formData.customCostThreshold
      };
    }
    return formData.costComparisonBaseline || 'industry_avg';
  }

  getEntrySpeedDays(speed) {
    const speedMap = {
      '30_days': 30,
      '3_months': 90,
      '6_months': 180,
      '12_months': 365
    };
    return speedMap[speed] || 90;
  }

  /**
   * Validate form data
   */
  validateFormData(teamType, formData) {
    const errors = [];

    // Common validation
    if (!formData.companyName || formData.companyName.length < 2) {
      errors.push('Company name is required and must be at least 2 characters');
    }

    // Team-specific validation
    switch (teamType) {
      case 'red':
        if (!formData.analysisFocus || formData.analysisFocus.length === 0) {
          errors.push('At least one analysis focus area must be selected');
        }
        break;

      case 'black':
        if (!formData.toolCategories || formData.toolCategories.length === 0) {
          errors.push('At least one tool category must be selected');
        }
        break;

      case 'white':
        if (!formData.opportunityType || formData.opportunityType.length === 0) {
          errors.push('At least one opportunity type must be selected');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

module.exports = FormDataProcessor;