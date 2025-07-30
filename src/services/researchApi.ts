interface ResearchRequest {
  task: string;
}

interface ResearchResponse {
  request_id: string;
  status: 'processing' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

// Use API Gateway proxy to avoid CORS/private network issues
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function submitResearch(request: ResearchRequest): Promise<ResearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/claude-flow/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Research submission failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error submitting research:', error);
    throw error;
  }
}

export async function checkResearchStatus(requestId: string): Promise<ResearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/claude-flow/execution/${requestId}`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking research status:', error);
    throw error;
  }
}

export function formatRedTeamPrompt(formData: any): string {
  return `🔴 RED TEAM RESEARCH SWARM - COMPETITIVE DISRUPTION ANALYSIS 🔴

MISSION: Execute comprehensive competitive disruption analysis for strategic market positioning

SWARM ASSEMBLY DIRECTIVE:
Assemble a world-class team of competitive intelligence experts including:
• Lead Market Researcher - Orchestrate the analysis and synthesize findings
• Intelligence Librarian - Identify and catalog information sources (patents, SEC filings, industry reports, academic papers)
• Data Collection Specialists - Gather intelligence from Reddit, Twitter, LinkedIn, Glassdoor, HackerNews, industry forums, arXiv, Google Scholar
• Web Scraping Engineers - Extract pricing data, feature comparisons, customer reviews, job postings
• Financial Analysts - Analyze revenue models, funding rounds, burn rates, unit economics
• Technical Architects - Reverse engineer tech stacks, identify vulnerabilities, assess scalability
• Customer Research Team - Interview users, analyze reviews, map pain points, track churn patterns
• Content Synthesis Team - Consolidate findings into actionable intelligence reports
• Strategic Advisor - Challenge assumptions, verify facts, ensure actionable recommendations

COLLABORATION PROTOCOL:
• Cross-validate all findings across multiple sources
• Challenge each other's assumptions with data
• Fact-check competitive claims against primary sources
• Debate strategic implications before finalizing recommendations
• Ensure all intelligence is legally and ethically sourced

TARGET COMPANY: ${formData.targetCompany || 'Not specified'}

ANALYSIS FOCUS AREAS:
${formData.analysisFocus?.map((focus: string) => `• ${focus}`).join('\n') || '• Comprehensive competitive analysis'}

MARKET SCOPE: ${formData.marketScope || 'Global'}
${formData.marketScope === 'custom' && formData.customCountries?.length > 0 ? `CUSTOM COUNTRIES: ${formData.customCountries.join(', ')}` : ''}

DISRUPTION PARAMETERS:
• Timeline: ${formData.disruptionTimeline || 12} months
• Investment Range: $${formData.investmentRange?.[0]?.toLocaleString() || '100,000'} - $${formData.investmentRange?.[1]?.toLocaleString() || '1,000,000'}
• Target Market Size: ${formData.targetMarketSize?.join(', ') || 'All market sizes'}
• Competitive Intensity: ${formData.competitiveIntensity || 'Medium'}
• Disruption Strategy: ${formData.disruptionStrategy || 'Market differentiation'}

INDUSTRY VERTICALS:
${formData.industryVerticals?.map((vertical: string) => `• ${vertical}`).join('\n') || '• Cross-industry analysis'}

CUSTOM KEYWORDS & FOCUS:
${formData.customKeywords?.length > 0 ? formData.customKeywords.map((keyword: string) => `• ${keyword}`).join('\n') : '• No custom keywords specified'}

RESEARCH OBJECTIVES:
1. Identify key vulnerabilities in target company's market position
2. Map competitive landscape and identify disruption opportunities
3. Analyze technology gaps and innovation opportunities
4. Evaluate customer acquisition strategies and pain points
5. Assess pricing strategies and market positioning
6. Identify potential partnership or acquisition targets
7. Analyze market entry barriers and mitigation strategies
8. Develop actionable disruption roadmap with timeline

OUTPUT REQUIREMENTS:
• Executive Summary with key findings and recommendations
• Detailed competitive analysis matrix
• Technology stack assessment and gaps
• Customer segment analysis with acquisition strategies
• Financial projections and ROI analysis
• Risk assessment and mitigation strategies
• Implementation roadmap with milestones
• Partnership/acquisition opportunity matrix

ANALYSIS DEPTH: Deep dive with quantitative metrics and actionable insights
TIME SENSITIVITY: ${formData.disruptionTimeline <= 6 ? 'URGENT - Fast track analysis required' : 'Standard timeline'}
DECISION CRITERIA: Data-driven with emphasis on ROI and market impact

SWARM EXECUTION INSTRUCTIONS:
1. Lead Researcher: Define research questions and success criteria
2. Librarian: Map information landscape and identify key sources
3. Data Teams: Fan out across the internet gathering intelligence
4. Synthesis Team: Organize findings into coherent narratives
5. Analysis Teams: Deep dive into specific areas (tech, finance, customers)
6. Quality Control: Verify all claims, check sources, validate assumptions
7. Strategic Team: Develop disruption strategy recommendations
8. Lead Researcher: Final synthesis and executive recommendations

IMPORTANT: This is a RESEARCH AND ANALYSIS mission only. DO NOT build, code, or prototype anything. Focus exclusively on gathering intelligence, analyzing data, and providing strategic recommendations for executive decision-making.

Generate comprehensive disruption strategy with specific, actionable recommendations backed by verified data.`;
}

export function formatWhiteTeamPrompt(formData: any): string {
  return `⚪ WHITE TEAM RESEARCH SWARM - MARKET OPPORTUNITY DISCOVERY ⚪

MISSION: Identify untapped market opportunities and white space for innovative product development

SWARM ASSEMBLY DIRECTIVE:
Assemble a world-class team of market opportunity researchers including:
• Lead Innovation Strategist - Orchestrate discovery and synthesize opportunities
• Trend Librarian - Identify emerging trends from Gartner, Forrester, CB Insights, industry reports
• Social Listening Team - Monitor Reddit, Twitter, Discord, Slack communities for unmet needs
• Academic Researchers - Scan arXiv, PubMed, IEEE for breakthrough technologies
• Patent Analysts - Identify technology convergence opportunities and white spaces
• Regulatory Experts - Track new regulations creating market opportunities
• Customer Ethnographers - Deep dive into user behaviors and unspoken needs
• Venture Analysts - Monitor startup activity, funding patterns, exit strategies
• Content Aggregation Team - Organize discoveries into opportunity clusters
• Innovation Advisor - Challenge assumptions, validate market size, ensure feasibility

COLLABORATION PROTOCOL:
• Triangulate opportunities from multiple independent sources
• Challenge market size assumptions with real data
• Verify technical feasibility with domain experts
• Debate competitive moats before recommending opportunities
• Ensure opportunities align with capability and resources

OPPORTUNITY TYPES TARGETED:
${formData.opportunityTypes?.map((type: string) => `• ${type}`).join('\n') || '• All opportunity types'}

TARGET CUSTOMER SEGMENTS:
${formData.targetCustomerSize?.map((size: string) => `• ${size}`).join('\n') || '• All customer segments'}

BUSINESS MODEL PREFERENCES:
${formData.businessModelPreference?.map((model: string) => `• ${model}`).join('\n') || '• Open to all business models'}

MARKET DYNAMICS:
• Technical Approach: ${formData.technicalApproach || 'Technology-agnostic'}
• Market Entry Speed: ${formData.marketEntrySpeed || 'Standard'}
• Competitive Landscape: ${formData.competitiveLandscape || 'Moderate competition'}
• Minimum Opportunity Size: ${formData.minimumOpportunitySize || 'No minimum threshold'}

SUCCESS METRICS (Top Priorities):
${formData.successMetrics?.map((metric: string, index: number) => `${index + 1}. ${metric}`).join('\n') || '1. Market potential\n2. Technical feasibility\n3. Competitive advantage'}

RISK PARAMETERS:
• Risk Tolerance Level: ${formData.riskTolerance || 3}/5
• Risk Profile: ${formData.riskTolerance <= 2 ? 'Conservative - Proven markets preferred' : formData.riskTolerance >= 4 ? 'Aggressive - Willing to pioneer new markets' : 'Balanced - Mix of proven and emerging opportunities'}

ECOSYSTEM INTEGRATION REQUIREMENTS:
${formData.ecosystemIntegration?.map((integration: string) => `• ${integration}`).join('\n') || '• No specific integration requirements'}

CUSTOM SEARCH AREAS & FOCUS:
${formData.customSearchAreas?.length > 0 ? formData.customSearchAreas.map((area: string) => `• ${area}`).join('\n') : '• No custom search areas specified'}

RESEARCH OBJECTIVES:
1. Identify unserved or underserved market segments
2. Analyze emerging trends and future market needs
3. Map technology convergence opportunities
4. Evaluate regulatory changes creating new markets
5. Identify cross-industry innovation opportunities
6. Analyze customer pain points without current solutions
7. Assess platform and ecosystem play opportunities
8. Evaluate geographic expansion white spaces

OUTPUT REQUIREMENTS:
• Executive Summary with top 5 opportunities ranked by potential
• Detailed market analysis for each opportunity
• Customer persona and journey mapping
• Competitive void analysis (why no one is serving this)
• Technical feasibility assessment
• Go-to-market strategy recommendations
• Financial projections and market sizing
• Risk assessment and mitigation strategies
• MVP roadmap and validation approach

INNOVATION FOCUS: ${formData.technicalApproach === 'cutting_edge' ? 'Bleeding edge technology opportunities' : formData.technicalApproach === 'proven' ? 'Proven technology in new applications' : 'Balanced innovation approach'}
TIME TO MARKET: ${formData.marketEntrySpeed === 'immediate' ? 'URGENT - Quick wins needed' : formData.marketEntrySpeed === 'long_term' ? 'Strategic - Long-term plays acceptable' : 'Standard timeline'}
OPPORTUNITY SCALE: Focus on opportunities with ${formData.minimumOpportunitySize || 'any'} market potential

SWARM EXECUTION INSTRUCTIONS:
1. Lead Strategist: Define opportunity criteria and search parameters
2. Trend Librarian: Map emerging technologies and market shifts
3. Research Teams: Fan out across academic, social, and industry sources
4. Patent Team: Identify technology white spaces and convergence points
5. Customer Team: Deep ethnographic research on unmet needs
6. Synthesis Team: Cluster findings into opportunity themes
7. Validation Team: Size markets, assess feasibility, check competition
8. Strategic Team: Prioritize opportunities by potential and fit
9. Lead Strategist: Final synthesis with top 5 actionable opportunities

IMPORTANT: This is a RESEARCH AND ANALYSIS mission only. DO NOT build, create, or prototype anything. Focus exclusively on identifying opportunities, analyzing market potential, and providing strategic recommendations for executive decision-making.

Generate comprehensive white space analysis with specific, actionable product opportunities validated by multiple sources.`;
}

export function formatBlackTeamPrompt(formData: any): string {
  return `⚫ BLACK TEAM RESEARCH SWARM - VENDOR REPLACEMENT ENGINEERING ⚫

MISSION: Reverse engineer and replace critical third-party vendor dependencies with custom solutions

SWARM ASSEMBLY DIRECTIVE:
Assemble a world-class team of vendor analysis experts including:
• Lead Technical Analyst - Orchestrate analysis and feasibility assessment
• Documentation Librarian - Gather API docs, GitHub repos, Stack Overflow, technical blogs
• Feature Analysis Team - Document capabilities, limitations, integration points
• Open Source Researchers - Find similar projects to understand implementation complexity
• Patent Researchers - Identify IP constraints and legal considerations
• Architecture Analysts - Study system design, scalability patterns, tech stack
• Performance Analysts - Understand response times, load patterns, scalability limits
• Cost Analysts - Break down vendor pricing, estimate build costs, calculate ROI
• Effort Estimation Team - Assess development time, team size, skill requirements
• Risk Assessment Team - Identify technical, legal, and business risks

COLLABORATION PROTOCOL:
• Cross-reference findings from multiple analysis approaches
• Challenge cost and effort assumptions with industry benchmarks
• Verify legal compliance for any reverse engineering activities
• Debate build vs. buy with hard data on costs and timelines
• Focus on feasibility assessment, not implementation

TARGET VENDOR: ${formData.targetVendor || 'Not specified'}
EXISTING TOOLS IN USE: ${formData.existingTools?.join(', ') || 'No specific tools identified'}

TOOL CATEGORIES TO REPLACE:
${formData.toolCategories?.map((category: string) => `• ${category}`).join('\n') || '• Comprehensive tool replacement'}

INFORMATION SOURCES AVAILABLE:
${Object.entries(formData.informationSources || {}).filter(([_, enabled]) => enabled).map(([source]) => `• ${source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`).join('\n') || '• Standard public information sources'}

IMPLEMENTATION CONSTRAINTS:
• Complexity Level: ${formData.implementationComplexity || 'Medium'}
• Team Size: ${formData.teamSizeConstraint || 'Standard team'}
• Time to Market: ${formData.timeToMarket || 'Standard timeline'}
• Evidence Threshold: ${formData.evidenceThreshold || 3}/5 confidence required

TECHNICAL STACK PREFERENCES:
${formData.techStackPreference?.map((tech: string) => `• ${tech}`).join('\n') || '• Technology-agnostic approach'}

COST PARAMETERS:
• Baseline: ${formData.costComparisonBaseline || 'Current vendor costs'}
${formData.costComparisonBaseline === 'custom_threshold' ? `• Custom Threshold: $${formData.customCostThreshold?.toLocaleString() || '0'}` : ''}
• Target: ${formData.costComparisonBaseline === 'percentage_reduction' ? '30% cost reduction' : formData.costComparisonBaseline === 'zero_ongoing' ? 'Zero ongoing costs (one-time build)' : formData.costComparisonBaseline === 'custom_threshold' ? 'Below custom threshold' : 'Match or beat current costs'}

REVERSE ENGINEERING OBJECTIVES:
1. Analyze core functionality and feature set of target vendor
2. Identify technical architecture and implementation patterns
3. Map API endpoints, data models, and integration points
4. Evaluate performance benchmarks and scalability requirements
5. Identify unique features and competitive differentiators
6. Analyze security model and compliance requirements
7. Understand pricing model and cost drivers
8. Document migration path from vendor to custom solution

ANALYSIS REQUIREMENTS:
• Feature Coverage: ${formData.implementationComplexity === 'minimal' ? 'Core features only (MVP scope)' : formData.implementationComplexity === 'comprehensive' ? 'Full feature parity analysis' : 'Essential features with iteration roadmap'}
• Architecture Assessment: Evaluate complexity, maintainability, scalability needs
• Security Analysis: Identify security requirements and compliance needs
• Performance Benchmarks: Document current vendor performance baseline
• Integration Analysis: Map all touchpoints and migration complexity

OUTPUT REQUIREMENTS:
• Executive Summary with feasibility assessment and go/no-go recommendation
• Technical complexity analysis (not implementation details)
• Feature comparison matrix (vendor capabilities vs. requirements)
• Effort estimation (person-months, team size, timeline)
• Skill requirements and team composition analysis
• Cost analysis (build vs. buy, TCO comparison over 3-5 years)
• Risk assessment matrix (technical, legal, business risks)
• Migration complexity assessment (data, integrations, downtime)
• Make vs. buy recommendation with confidence level
• Alternative vendor comparison if replacement not recommended

TEAM CONFIGURATION: ${formData.teamSizeConstraint === 'solo_developer' ? 'Single developer implementation' : formData.teamSizeConstraint === 'small_team' ? 'Small team (2-5 developers)' : formData.teamSizeConstraint === 'large_team' ? 'Large team (10+ developers)' : 'Standard team size (5-10 developers)'}
BUILD COMPLEXITY: ${formData.implementationComplexity === 'minimal' ? 'MVP - Quick prototype' : formData.implementationComplexity === 'moderate' ? 'Production-ready with core features' : formData.implementationComplexity === 'comprehensive' ? 'Enterprise-grade full replacement' : 'Balanced approach'}
EVIDENCE REQUIREMENT: ${formData.evidenceThreshold >= 4 ? 'High confidence - Extensive proof required' : formData.evidenceThreshold <= 2 ? 'Low threshold - Rapid prototyping acceptable' : 'Standard evidence - Balanced approach'}

SWARM EXECUTION INSTRUCTIONS:
1. Lead Analyst: Define analysis criteria and key questions
2. Documentation Team: Gather all available vendor information
3. Feature Analysis: Document capabilities and limitations
4. Open Source Team: Research similar solutions for complexity baseline
5. Architecture Team: Analyze technical complexity and dependencies
6. Cost Team: Detailed pricing analysis and build cost estimates
7. Effort Team: Estimate development timeline and resources
8. Risk Team: Identify all potential risks and blockers
9. Lead Analyst: Final synthesis with executive recommendation

CRITICAL: This is a RESEARCH AND FEASIBILITY ANALYSIS mission only. DO NOT build, code, prototype, or implement ANYTHING. Your job is to analyze whether replacing this vendor makes business sense, estimate the effort required, and provide data for executive decision-making. Leave ALL implementation to the product team.

Generate comprehensive vendor replacement feasibility study with clear go/no-go recommendation based on data.`;
}