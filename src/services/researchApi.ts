interface ResearchRequest {
  task: string;
}

interface ResearchResponse {
  request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: any;
  s3_key?: string;
  download_url?: string;
  error?: string;
}

interface AsyncJobResponse {
  success: boolean;
  request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  metadata?: {
    title: string;
    requester: string;
    tags: string[];
    model: string;
    reasoning_effort: string;
  };
  timestamp: string;
}

interface StatusCheckResponse {
  success: boolean;
  request_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  content?: string;
  s3_location?: string;
  s3_key?: string;
  download_url?: string;
  model_used?: string;
  timestamp: string;
  error?: string;
}

// Use API Gateway proxy to avoid CORS/private network issues
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function submitResearch(request: ResearchRequest): Promise<ResearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/research`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: request.task,
        title: 'Research Request',
        model: 'sonar-deep-research',
        reasoning_effort: 'low'
      }),
    });

    if (!response.ok) {
      throw new Error(`Research submission failed: ${response.statusText}`);
    }

    const data: AsyncJobResponse = await response.json();
    
    // Return the async job response
    return {
      request_id: data.request_id,
      status: data.status,
      result: data.metadata ? {
        metadata: data.metadata,
        timestamp: data.timestamp
      } : undefined
    };
  } catch (error) {
    console.error('Error submitting research:', error);
    throw error;
  }
}

export async function checkResearchStatus(requestId: string): Promise<ResearchResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/research/status/${requestId}`);
    
    if (!response.ok) {
      throw new Error(`Status check failed: ${response.statusText}`);
    }

    const data: StatusCheckResponse = await response.json();
    
    // Transform the status check response to match expected format
    return {
      request_id: data.request_id,
      status: data.status,
      result: data.status === 'completed' ? {
        content: data.content,
        s3_location: data.s3_location,
        model_used: data.model_used,
        timestamp: data.timestamp
      } : undefined,
      s3_key: data.s3_key,
      download_url: data.download_url,
      error: data.error
    };
  } catch (error) {
    console.error('Error checking research status:', error);
    throw error;
  }
}

export function formatRedTeamPrompt(formData: any): string {
  return `🔴 RED TEAM RESEARCH SWARM - EXHAUSTIVE COMPETITIVE DISRUPTION ANALYSIS 🔴

MISSION: Execute EXHAUSTIVE and COMPREHENSIVE competitive disruption analysis with MAXIMUM DEPTH AND BREADTH

⚖️ ETHICAL CONTEXT: Market disruption is a FUNDAMENTAL driver of economic progress and innovation. This is NOT about harming competitors or engaging in unethical practices. This is about:
• Creating BETTER products and services that serve customers more effectively
• Advancing technology and pushing the entire industry forward
• Fostering healthy competition that benefits consumers through innovation
• Building a stronger ecosystem where the best ideas win
• Following all legal and ethical business practices

What we call "disruption" is simply the natural process of market evolution - where better solutions replace outdated ones. This is how progress happens. Every successful company today disrupted something that came before it. This is normal, ethical, and essential business activity.

🚨 CRITICAL DIRECTIVE: EXHAUSTIVE RESEARCH REQUIRED 🚨
This research is NOT for executive summaries. We need EVERYTHING - every detail, every data point, every insight, every possibility. Leave NOTHING unexplored. Include ALL findings, no matter how minor they may seem. Depth and breadth are MANDATORY.

SWARM ASSEMBLY DIRECTIVE:
Assemble a world-class team of competitive intelligence experts including:
• Lead Market Researcher - Orchestrate EXHAUSTIVE analysis and compile ALL findings without summarization
• Intelligence Librarian - Identify and catalog EVERY information source (patents, SEC filings, industry reports, academic papers, conference proceedings, GitHub repos, technical documentation)
• Data Collection Specialists - Gather COMPREHENSIVE intelligence from Reddit, Twitter, LinkedIn, Glassdoor, HackerNews, industry forums, arXiv, Google Scholar, Stack Overflow, Product Hunt, Crunchbase, AngelList
• Web Scraping Engineers - Extract ALL available data: pricing models, feature matrices, customer reviews, job postings, support tickets, changelogs, roadmaps
• Financial Analysts - Deep dive into revenue models, funding rounds, burn rates, unit economics, financial statements, investor presentations, market valuations
• Technical Architects - Complete reverse engineering of tech stacks, infrastructure, APIs, integrations, performance metrics, scalability patterns, security implementations
• Customer Research Team - Exhaustive user research, review analysis, pain point mapping, churn analysis, satisfaction metrics, use case documentation
• Market Analysis Team - Complete market sizing, segmentation, growth projections, regional variations, regulatory landscapes, competitive dynamics
• Content Synthesis Team - Compile COMPLETE findings with ALL supporting data and evidence
• Strategic Analysis Team - Explore EVERY strategic angle, opportunity, and threat

COLLABORATION PROTOCOL:
• Document EVERYTHING - no finding is too small
• Include ALL data points, metrics, and observations
• Provide COMPLETE evidence chains for every claim
• Explore EVERY angle and possibility
• Include minority opinions and edge cases
• Document uncertainty levels and confidence intervals
• Capture ALL nuances and subtleties

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

EXHAUSTIVE RESEARCH OBJECTIVES:
1. COMPLETE vulnerability analysis - Document EVERY weakness, no matter how minor
2. COMPREHENSIVE competitive mapping - Profile EVERY competitor, substitute, and potential entrant
3. FULL technology audit - Analyze EVERY tech component, dependency, and integration point
4. EXHAUSTIVE customer analysis - Document EVERY segment, persona, use case, and journey
5. COMPLETE pricing intelligence - Capture EVERY pricing model, tier, discount, and variation
6. FULL partnership ecosystem - Map EVERY current and potential partner relationship
7. COMPREHENSIVE barrier analysis - Document EVERY obstacle with detailed mitigation strategies
8. DETAILED disruption scenarios - Model EVERY possible approach with full implementation details

OUTPUT REQUIREMENTS - MAXIMUM DETAIL MANDATORY:
• NO EXECUTIVE SUMMARIES - Full, unabridged research reports only
• COMPLETE competitive intelligence dossiers on EVERY competitor
• EXHAUSTIVE technology documentation with architecture diagrams
• COMPREHENSIVE customer research with raw data and full transcripts
• DETAILED financial models with ALL assumptions documented
• FULL risk matrices with probability and impact assessments
• GRANULAR implementation plans with day-by-day breakdowns
• EXHAUSTIVE opportunity analysis with ALL possibilities explored
• Include ALL raw data, sources, and evidence
• Document EVERY assumption and uncertainty
• Provide COMPLETE methodology descriptions
• Include minority viewpoints and contrarian analyses

CRITICAL OUTPUT INSTRUCTIONS:
• LENGTH: Aim for 100+ pages of detailed findings (NOT summaries)
• DETAIL LEVEL: Include EVERYTHING - assume reader wants to become an expert
• DATA: Provide ALL numbers, metrics, and measurements found
• EVIDENCE: Include direct quotes, screenshots, and source links
• BREADTH: Cover EVERY angle, no matter how tangential
• DEPTH: Drill down to the most granular level possible

ANALYSIS DEPTH: EXHAUSTIVE - Leave no stone unturned
TIME SENSITIVITY: ${formData.disruptionTimeline <= 6 ? 'URGENT - But DO NOT sacrifice completeness for speed' : 'Take all time needed for COMPLETE analysis'}
RESEARCH CRITERIA: COMPREHENSIVE data collection with ZERO filtering or summarization

SWARM EXECUTION INSTRUCTIONS FOR EXHAUSTIVE RESEARCH:
1. Lead Researcher: Define COMPREHENSIVE research scope - no limitations on breadth
2. Librarian: Map ENTIRE information landscape - include obscure and niche sources
3. Data Teams: EXHAUSTIVE collection - gather EVERYTHING, filter NOTHING
4. Documentation Team: Record ALL findings in FULL DETAIL with complete context
5. Analysis Teams: DEEP exploration of EVERY aspect - no surface-level analysis
6. Evidence Team: Compile COMPLETE evidence packages for EVERY claim
7. Quality Control: Verify accuracy but DO NOT condense or summarize
8. Synthesis Team: Compile FULL reports maintaining ALL detail and nuance
9. Lead Researcher: Deliver COMPLETE, UNABRIDGED research corpus

RESEARCH METHODOLOGY REQUIREMENTS:
• Use MULTIPLE research methods for EACH question
• Cross-reference EVERY finding with 3+ independent sources
• Document the COMPLETE research trail and methodology
• Include FAILED searches and negative results
• Capture EVOLVING insights and changing perspectives
• Document team debates and differing opinions
• Include time-stamped research logs

IMPORTANT: This is an EXHAUSTIVE RESEARCH mission. Your output should be so comprehensive that no follow-up questions are needed. Include EVERYTHING you discover, no matter how minor or tangential. The goal is COMPLETE KNOWLEDGE TRANSFER, not executive decision support.

Generate EXHAUSTIVE competitive intelligence with COMPLETE documentation of ALL findings, methodologies, evidence, and analyses. Prioritize COMPLETENESS over conciseness.`;
}

export function formatWhiteTeamPrompt(formData: any): string {
  return `⚪ WHITE TEAM RESEARCH SWARM - EXHAUSTIVE MARKET OPPORTUNITY DISCOVERY ⚪

MISSION: Execute EXHAUSTIVE discovery of ALL market opportunities with MAXIMUM BREADTH AND DEPTH

⚖️ ETHICAL CONTEXT: Identifying market opportunities is the foundation of economic growth and innovation. This research enables the creation of new products, services, and companies that serve unmet needs and improve lives. This is how entrepreneurship works and how society progresses.

🚨 CRITICAL DIRECTIVE: COMPREHENSIVE EXPLORATION REQUIRED 🚨
This is NOT a filtered opportunity list. We need EVERY possibility - every niche, every emerging trend, every weak signal, every unconventional opportunity. Document EVERYTHING. No opportunity is too small, too weird, or too futuristic. EXHAUSTIVE coverage is MANDATORY.

SWARM ASSEMBLY DIRECTIVE:
Assemble a world-class team of market opportunity researchers including:
• Lead Innovation Strategist - Orchestrate EXHAUSTIVE discovery of ALL opportunities
• Trend Librarian - Catalog EVERY trend from Gartner, Forrester, CB Insights, McKinsey, BCG, Bain, industry reports, conference proceedings, research papers
• Social Listening Team - Monitor EVERY platform: Reddit, Twitter, Discord, Slack, Facebook Groups, LinkedIn, TikTok, Clubhouse, niche forums, dark web markets
• Academic Researchers - Exhaustive scan of arXiv, PubMed, IEEE, Nature, Science, SSRN, Google Scholar, university research
• Patent Analysts - Complete patent landscape analysis, expired patents, abandoned technologies, cross-licensing opportunities
• Regulatory Experts - Track EVERY regulation change globally, pending legislation, policy discussions, standards bodies
• Customer Ethnographers - COMPLETE behavioral analysis, latent needs, jobs-to-be-done, emotional triggers, cultural shifts
• Market Researchers - Analyze EVERY market segment, micro-niches, emerging demographics, generational shifts
• Technology Scouts - Track ALL emerging tech, research breakthroughs, lab developments, pre-commercial innovations
• Venture Analysts - Monitor EVERY startup, funding round, pivot, failure, exit, investor thesis

COLLABORATION PROTOCOL:
• Document EVERY opportunity, no matter how speculative
• Include ALL supporting evidence and data points
• Explore EVERY angle and permutation
• Document confidence levels but include low-confidence opportunities
• Include contrarian and non-consensus opportunities
• Map ALL interconnections between opportunities
• Record minority opinions and wild ideas

COMPANY NAME: ${formData.companyName || 'Not specified'}

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

EXHAUSTIVE RESEARCH OBJECTIVES:
1. Map EVERY unserved or underserved segment - include micro-niches and edge cases
2. Document ALL emerging trends - from weak signals to megatrends
3. Identify EVERY technology convergence possibility - explore all combinations
4. Track ALL regulatory changes globally - include proposed and discussed changes
5. Explore EVERY cross-industry opportunity - map all possible intersections
6. Document ALL customer pain points - including minor irritations and latent needs
7. Map COMPLETE platform/ecosystem possibilities - every configuration
8. Analyze ALL geographic opportunities - every country, region, and city

OUTPUT REQUIREMENTS - EXHAUSTIVE DOCUMENTATION MANDATORY:
• NO FILTERING - Present ALL opportunities discovered, not just "top" ones
• COMPLETE market analysis for EVERY opportunity found
• EXHAUSTIVE customer research with all personas, journeys, and use cases
• FULL competitive landscape for each opportunity area
• DETAILED technical feasibility for all approaches
• COMPREHENSIVE go-to-market options for each opportunity
• GRANULAR financial models with sensitivity analyses
• COMPLETE risk cataloging with mitigation strategies
• Include ALL raw research data and sources
• Document EVERY assumption and hypothesis
• Present ALL team member insights and opinions
• Include failed hypotheses and dead ends

CRITICAL OUTPUT INSTRUCTIONS:
• QUANTITY: Aim to identify 100+ distinct opportunities
• DETAIL: Each opportunity gets 5-10 pages of analysis minimum
• EVIDENCE: Include all supporting data, quotes, and sources
• BREADTH: Cover conventional AND unconventional opportunities
• DEPTH: Analyze each opportunity from multiple angles
• FORMAT: Full research dossier, not executive brief

INNOVATION FOCUS: ${formData.technicalApproach === 'cutting_edge' ? 'Bleeding edge technology opportunities' : formData.technicalApproach === 'proven' ? 'Proven technology in new applications' : 'Balanced innovation approach'}
TIME TO MARKET: ${formData.marketEntrySpeed === 'immediate' ? 'URGENT - Quick wins needed' : formData.marketEntrySpeed === 'long_term' ? 'Strategic - Long-term plays acceptable' : 'Standard timeline'}
OPPORTUNITY SCALE: Focus on opportunities with ${formData.minimumOpportunitySize || 'any'} market potential

SWARM EXECUTION INSTRUCTIONS FOR EXHAUSTIVE DISCOVERY:
1. Lead Strategist: Set EXPANSIVE search parameters - no boundaries
2. Trend Librarian: Map ENTIRE landscape of change and innovation
3. Research Teams: EXHAUSTIVE exploration across ALL sources
4. Patent Team: Complete white space mapping - every possibility
5. Customer Team: DEEP ethnography - every segment and behavior
6. Technology Team: Track ALL emerging capabilities and breakthroughs
7. Market Team: Analyze EVERY niche and micro-segment
8. Synthesis Team: Compile ALL findings - no filtering or ranking
9. Documentation Team: Create COMPLETE opportunity encyclopedia
10. Lead Strategist: Deliver FULL corpus of ALL opportunities

RESEARCH METHODOLOGY FOR MAXIMUM COVERAGE:
• Use 10+ different research methodologies
• Explore both quantitative AND qualitative signals
• Include weak signals and early indicators
• Document negative space (what's NOT happening)
• Map opportunity interconnections and clusters
• Include time-based opportunities (seasonal, cyclical)
• Explore geography-specific opportunities
• Document platform and ecosystem plays

IMPORTANT: This is an EXHAUSTIVE DISCOVERY mission. Your output should be encyclopedic in nature - a complete catalog of EVERY opportunity you can identify. Include marginal, speculative, and long-shot opportunities. The goal is MAXIMUM OPTIONALITY, not filtered recommendations.

Generate EXHAUSTIVE white space analysis documenting EVERY possible opportunity with COMPLETE supporting research. Prioritize BREADTH and DEPTH over executive summary.`;
}

export function formatBlackTeamPrompt(formData: any): string {
  return `⚫ BLACK TEAM RESEARCH SWARM - EXHAUSTIVE VENDOR REPLACEMENT ANALYSIS ⚫

MISSION: Execute EXHAUSTIVE reverse engineering analysis with COMPLETE technical documentation

⚖️ ETHICAL CONTEXT: Vendor replacement is a CORNERSTONE of technological progress and market efficiency. This is NOT adversarial or unethical. This is about:
• Building BETTER solutions that serve users more effectively
• Reducing vendor lock-in and promoting healthy competition
• Creating alternatives that push the entire industry to improve
• Empowering organizations to own their technology stack
• Learning from existing solutions to create superior implementations

Every major technology company builds alternatives to existing solutions - this is how innovation happens. Google built Chrome to replace Internet Explorer. Slack built a better IRC. Zoom built a better WebEx. This is normal, legal, and essential for technological progress.

🚨 CRITICAL DIRECTIVE: COMPREHENSIVE TECHNICAL ANALYSIS REQUIRED 🚨
This is NOT a high-level feasibility study. We need EVERYTHING - every API endpoint, every feature, every edge case, every implementation detail. Document ALL technical aspects. Leave NO functionality unexplored. COMPLETE technical documentation is MANDATORY.

SWARM ASSEMBLY DIRECTIVE:
Assemble a world-class team of vendor analysis experts including:
• Lead Technical Analyst - Orchestrate EXHAUSTIVE analysis of ALL vendor aspects
• Documentation Librarian - Gather EVERY piece of documentation: API docs, GitHub, Stack Overflow, forums, support tickets, changelogs, migration guides
• Feature Analysis Team - Document EVERY feature, option, configuration, and capability
• Code Archeologists - Analyze ALL available code samples, snippets, and implementations
• Integration Specialists - Map EVERY integration point, webhook, API, and data flow
• Architecture Analysts - Complete system reverse engineering with detailed diagrams
• Performance Analysts - Comprehensive benchmarking of ALL operations and limits
• Security Researchers - Full security audit of authentication, authorization, encryption
• Cost Analysts - DETAILED pricing analysis including hidden costs and scaling factors
• Implementation Team - Document EVERY technical requirement and dependency

COLLABORATION PROTOCOL:
• Document EVERY technical detail discovered
• Include ALL edge cases and corner scenarios
• Map COMPLETE feature parity requirements
• Document ALL undocumented features
• Include workarounds and hacks used by community
• Capture ALL performance characteristics
• Document EVERY integration scenario

COMPANY NAME: ${formData.companyName || 'Not specified'}
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

EXHAUSTIVE REVERSE ENGINEERING OBJECTIVES:
1. Document EVERY feature - including hidden, deprecated, and undocumented ones
2. Map COMPLETE technical architecture - every service, component, and dependency
3. Catalog ALL APIs - REST, GraphQL, WebSocket, gRPC, internal APIs
4. Benchmark EVERY operation - latency, throughput, concurrency, limits
5. Identify ALL differentiators - including minor convenience features
6. Analyze COMPLETE security implementation - every auth flow and permission
7. Decode ENTIRE pricing model - including edge cases and hidden costs
8. Document EVERY migration consideration - no detail too small

EXHAUSTIVE ANALYSIS REQUIREMENTS:
• Feature Coverage: COMPLETE feature inventory with ALL variations and options
• Code Analysis: Examine ALL available code - SDKs, examples, community projects
• API Forensics: Document EVERY endpoint, parameter, header, and response
• Performance Profiling: Benchmark ALL operations under ALL conditions
• Security Audit: Complete penetration testing mindset (legally compliant)
• Integration Mapping: Document EVERY possible integration scenario
• Data Model: Reverse engineer COMPLETE data schemas and relationships
• Business Logic: Understand ALL rules, validations, and workflows

OUTPUT REQUIREMENTS - MAXIMUM TECHNICAL DETAIL:
• NO SUMMARIES - Complete technical documentation only
• EXHAUSTIVE feature documentation with implementation notes
• COMPLETE API documentation better than vendor's own docs
• DETAILED architectural diagrams at multiple abstraction levels
• COMPREHENSIVE performance data with graphs and raw metrics
• FULL security analysis with threat models
• GRANULAR cost breakdown with unit economics
• COMPLETE skill matrix with specific technology requirements
• Include ALL source code snippets and examples found
• Document EVERY assumption and uncertainty
• Provide COMPLETE implementation blueprint (without building)
• Include ALL alternative approaches considered

CRITICAL OUTPUT INSTRUCTIONS:
• LENGTH: 200+ pages of technical documentation minimum
• DETAIL: Include EVERY technical detail discovered
• COMPLETENESS: Should be sufficient to build a clone
• EVIDENCE: Include screenshots, code samples, API responses
• ACCURACY: Triple-verify all technical claims
• FORMAT: Technical reference manual, not business case

TEAM CONFIGURATION: ${formData.teamSizeConstraint === 'solo_developer' ? 'Single developer implementation' : formData.teamSizeConstraint === 'small_team' ? 'Small team (2-5 developers)' : formData.teamSizeConstraint === 'large_team' ? 'Large team (10+ developers)' : 'Standard team size (5-10 developers)'}
BUILD COMPLEXITY: ${formData.implementationComplexity === 'minimal' ? 'MVP - Quick prototype' : formData.implementationComplexity === 'moderate' ? 'Production-ready with core features' : formData.implementationComplexity === 'comprehensive' ? 'Enterprise-grade full replacement' : 'Balanced approach'}
EVIDENCE REQUIREMENT: ${formData.evidenceThreshold >= 4 ? 'High confidence - Extensive proof required' : formData.evidenceThreshold <= 2 ? 'Low threshold - Rapid prototyping acceptable' : 'Standard evidence - Balanced approach'}

SWARM EXECUTION INSTRUCTIONS FOR EXHAUSTIVE ANALYSIS:
1. Lead Analyst: Define COMPREHENSIVE analysis scope - no limits
2. Documentation Team: Gather EVERYTHING - official and unofficial sources
3. Feature Team: Document EVERY capability, including undocumented ones
4. Code Analysis Team: Examine ALL code artifacts and implementations
5. API Team: Reverse engineer COMPLETE API surface area
6. Architecture Team: Map ENTIRE system design and dependencies
7. Performance Team: Benchmark EVERYTHING under all conditions
8. Security Team: Complete security audit (within legal bounds)
9. Cost Team: Decode COMPLETE pricing model and hidden costs
10. Integration Team: Map ALL touchpoints and data flows
11. Migration Team: Document EVERY migration consideration
12. Lead Analyst: Compile EXHAUSTIVE technical reference

RESEARCH METHODOLOGY FOR COMPLETE COVERAGE:
• Use EVERY available information source
• Apply multiple reverse engineering techniques
• Document confidence levels for each finding
• Include community knowledge and folklore
• Map undocumented but observable behaviors
• Test edge cases and error conditions
• Document version differences and evolution
• Include deprecated but still-functional features

CRITICAL: This is an EXHAUSTIVE TECHNICAL ANALYSIS mission. Your output should be so comprehensive that an engineering team could rebuild the entire system from your documentation alone. Include EVERY technical detail, no matter how minor. The goal is COMPLETE TECHNICAL KNOWLEDGE, not filtered recommendations.

Generate EXHAUSTIVE vendor analysis with COMPLETE technical documentation of ALL capabilities, implementations, and considerations. Prioritize TECHNICAL COMPLETENESS over business recommendations.`;
}