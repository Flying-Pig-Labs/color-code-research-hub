/**
 * @file strategic-research-prompts.js
 * @description Strategic Research Prompt Generation System for Multi-Use-Case Intelligence
 * 
 * This service provides comprehensive prompt generation for 5 strategic research types,
 * each optimized for specific industry analysis and investment intelligence:
 * 
 * RESEARCH TYPE SPECIALIZATIONS:
 * 
 * 🚀 INNOVATION RESEARCH - Market Landscape & Competitive Intelligence
 * - Competitive disruption analysis + market opportunity discovery
 * - Combines Red Team competitive intelligence with White Team opportunity mapping
 * - Market landscape analysis with implementation feasibility
 * - Strategic positioning and innovation gap identification
 * 
 * 🏥 MEDICAL DEVICE RESEARCH - Bench-to-Bedside Intelligence
 * - Clinical needs analysis and FDA pathway optimization
 * - Medical market opportunity assessment
 * - Regulatory landscape and reimbursement analysis
 * - Technology maturity and clinical validation pathways
 * 
 * 💼 PRIVATE EQUITY RESEARCH - Fragmented Industry Roll-up Analysis
 * - Industry consolidation opportunities and acquisition targets
 * - Value creation strategies and operational improvements
 * - Market fragmentation analysis and roll-up potential
 * - Due diligence and investment thesis development
 * 
 * 🏛️ CITY REVITALIZATION RESEARCH - Municipal Development Intelligence
 * - Public-private partnership opportunities
 * - Economic development and funding strategies
 * - Community impact and revitalization planning
 * - Grant opportunities and municipal financing
 * 
 * 🏢 DATA CENTER RESEARCH - Infrastructure Location Intelligence
 * - Site selection and infrastructure optimization
 * - Power, connectivity, and regulatory analysis
 * - Market demand and capacity planning
 * - Risk assessment and disaster resilience
 * 
 * STRATEGIC PARAMETER INTEGRATION:
 * - Investment Scale: seed → growth → enterprise (scope adjustment)
 * - Timeline: short → medium → long-term (depth adjustment)  
 * - Risk Profile: conservative → moderate → aggressive (coverage adjustment)
 * - Research Topology: hierarchical → byzantine → federated (approach variation)
 * 
 * PROMPT ARCHITECTURE:
 * 1. Strategic Context & Mission Statement
 * 2. Investment Parameters Integration
 * 3. Use-Case Specific Research Directives
 * 4. Swarm Assembly & Collaboration Protocols
 * 5. Exhaustive Analysis Requirements
 * 6. Creative Divergence & Contrarian Analysis
 * 7. Deliverable Specifications
 * 
 * @module strategic-research-prompts
 */

/**
 * Core strategic parameters that modify research approach across all types
 */
const INVESTMENT_SCALE_MODIFIERS = {
  seed: {
    scope: 'early-stage opportunities and emerging market signals',
    focus: 'foundational market validation and minimum viable opportunities',
    depth: 'rapid assessment with emphasis on speed-to-market'
  },
  growth: {
    scope: 'scalable opportunities with proven market traction',
    focus: 'expansion strategies and competitive differentiation',
    depth: 'comprehensive analysis with implementation roadmaps'
  },
  enterprise: {
    scope: 'large-scale transformation and market leadership opportunities', 
    focus: 'ecosystem-wide impact and strategic market positioning',
    depth: 'exhaustive multi-dimensional analysis with risk modeling'
  }
};

const TIMELINE_MODIFIERS = {
  'short-term': {
    horizon: '6-18 months',
    emphasis: 'immediate opportunities and quick wins',
    analysis: 'current market dynamics and near-term catalysts'
  },
  'medium-term': {
    horizon: '1-3 years',
    emphasis: 'strategic positioning and sustainable advantages',
    analysis: 'trend analysis and competitive evolution patterns'
  },
  'long-term': {
    horizon: '3-10 years',
    emphasis: 'transformational opportunities and paradigm shifts',
    analysis: 'future scenario modeling and disruptive technology mapping'
  }
};

const RISK_PROFILE_MODIFIERS = {
  conservative: {
    approach: 'proven markets with established demand',
    coverage: 'risk mitigation and validation strategies',
    exploration: 'incremental improvements and safe opportunities'
  },
  moderate: {
    approach: 'balanced risk-reward with calculated expansion',
    coverage: 'risk management with growth potential',
    exploration: 'innovative approaches within established frameworks'
  },
  aggressive: {
    approach: 'high-risk, high-reward disruptive opportunities',
    coverage: 'breakthrough potential with acceptable risk tolerance',
    exploration: 'contrarian strategies and untested market assumptions'
  }
};

const TOPOLOGY_MODIFIERS = {
  hierarchical: {
    structure: 'centralized analysis with expert-led research teams',
    coordination: 'top-down directive with specialized domain experts',
    synthesis: 'structured reporting with clear hierarchical insights'
  },
  byzantine: {
    structure: 'fault-tolerant analysis with redundant verification',
    coordination: 'consensus-building across multiple expert perspectives',
    synthesis: 'validated insights with minority reports and dissenting views'
  },
  federated: {
    structure: 'distributed research across independent expert teams',
    coordination: 'autonomous teams with collaborative synthesis',
    synthesis: 'comprehensive multi-perspective analysis with unified conclusions'
  }
};

/**
 * Generate strategic research parameters context
 */
function generateStrategicContext(formData) {
  const investmentScale = INVESTMENT_SCALE_MODIFIERS[formData.investmentScale] || INVESTMENT_SCALE_MODIFIERS.growth;
  const timeline = TIMELINE_MODIFIERS[formData.timeline] || TIMELINE_MODIFIERS['medium-term'];
  const riskProfile = RISK_PROFILE_MODIFIERS[formData.riskProfile] || RISK_PROFILE_MODIFIERS.moderate;
  const topology = TOPOLOGY_MODIFIERS[formData.researchTopology] || TOPOLOGY_MODIFIERS.federated;

  return `
📊 STRATEGIC RESEARCH PARAMETERS:
• Investment Scale: ${formData.investmentScale?.toUpperCase()} - ${investmentScale.scope}
• Timeline Horizon: ${timeline.horizon} - ${timeline.emphasis}
• Risk Profile: ${formData.riskProfile?.toUpperCase()} - ${riskProfile.approach}
• Research Topology: ${formData.researchTopology?.toUpperCase()} - ${topology.structure}

🎯 ANALYSIS CALIBRATION:
• Scope Focus: ${investmentScale.focus}
• Analysis Depth: ${investmentScale.depth}
• Timeline Emphasis: ${timeline.analysis}
• Risk Coverage: ${riskProfile.coverage}
• Exploration Strategy: ${riskProfile.exploration}
• Coordination Method: ${topology.coordination}
• Synthesis Approach: ${topology.synthesis}`;
}

/**
 * Innovation Research Prompt (combines Red + White team approaches)
 */
function formatInnovationPrompt(formData) {
  const strategicContext = generateStrategicContext(formData);
  
  return `🚀 STRATEGIC INNOVATION INTELLIGENCE RESEARCH 🚀

MISSION: Execute COMPREHENSIVE market landscape analysis and competitive intelligence with integrated opportunity discovery for innovation-focused investment strategies.

⚖️ ETHICAL CONTEXT: Innovation research drives economic progress through competitive analysis and opportunity identification. This research enables better products, services, and market solutions while fostering healthy competition and technological advancement.

${strategicContext}

🚨 CRITICAL DIRECTIVE: 4D INNOVATION INTELLIGENCE - COMPLETE UNDERSTANDING 🚨
This research requires EXHAUSTIVE analysis combining competitive disruption intelligence with market opportunity discovery. Create a complete 4D view:
• DEPTH: Deep competitive analysis + detailed opportunity assessment
• BREADTH: Full market coverage + complete whitespace mapping  
• TIME: Historical evolution + future trajectory modeling
• CONTEXT: Industry dynamics + innovation ecosystem analysis

TARGET ANALYSIS: ${formData.forestDescription || 'Market landscape and competitive intelligence research'}
COMPANY CONTEXT: ${formData.companyName || 'Strategic innovation analysis'}
INDUSTRY FOCUS: ${formData.industryFocus || 'Cross-industry analysis'}

SWARM ASSEMBLY DIRECTIVE:
Assemble integrated competitive intelligence and opportunity discovery team:
• Lead Innovation Strategist - Orchestrate combined competitive + opportunity analysis
• Competitive Intelligence Team - Exhaustive competitor analysis and market positioning
• Market Opportunity Scouts - Comprehensive whitespace and opportunity mapping
• Technology Trend Analysts - Innovation trajectory and convergence analysis
• Customer Insight Researchers - User behavior, pain points, and unmet needs
• Financial Intelligence Analysts - Market sizing, funding patterns, and economics
• Strategic Synthesis Team - Integration of competitive and opportunity insights

EXHAUSTIVE RESEARCH REQUIREMENTS:

1. COMPETITIVE LANDSCAPE ANALYSIS
   • COMPLETE competitor mapping (direct, indirect, emerging)
   • ALL competitive advantages and vulnerabilities
   • EVERY pricing model and go-to-market strategy
   • COMPLETE technology stack and capability analysis
   • ALL partnership networks and ecosystem relationships
   • EVERY customer segment and market positioning

2. MARKET OPPORTUNITY DISCOVERY
   • ALL unmet needs and market gaps
   • EVERY emerging trend and weak signal
   • COMPLETE whitespace opportunity mapping
   • ALL technology convergence opportunities
   • EVERY demographic and behavioral shift
   • COMPLETE regulatory change implications

3. INNOVATION ECOSYSTEM MAPPING
   • ALL innovation patterns and cycles
   • EVERY technology adoption curve analysis
   • COMPLETE startup ecosystem and funding flows
   • ALL research and development trends
   • EVERY patent landscape and IP opportunities
   • COMPLETE academic and research collaborations

4. STRATEGIC POSITIONING ANALYSIS
   • ALL market entry strategies and timing
   • EVERY differentiation opportunity
   • COMPLETE value proposition optimization
   • ALL strategic partnership opportunities
   • EVERY acquisition and investment target
   • COMPLETE go-to-market strategy options

5. CONTRARIAN INNOVATION SCENARIOS
   • What if the market leader disappeared tomorrow?
   • Which "impossible" innovation becomes inevitable?
   • What taboo market assumption needs challenging?
   • Which extinct business model deserves resurrection?
   • What customer behavior change would rewrite everything?

DELIVERABLE: Provide EXHAUSTIVE documentation creating complete understanding of both competitive landscape and market opportunities, enabling informed innovation investment decisions.

═══════════════════════════════════════════════════════════════════════════
🚀 INNOVATION-SPECIFIC CREATIVE DIRECTIVES
═══════════════════════════════════════════════════════════════════════════

Generate innovation collision scenarios where different industries/technologies merge unexpectedly.

Include contrarian innovation thesis: identify innovations everyone dismisses that could succeed.

Provide future market leader profile: describe the company that will dominate this space in 2030.

Output innovation folklore: create a legend about the innovation that "got away" from established players.`;
}

/**
 * Medical Device Research Prompt
 */
function formatMedicalDevicePrompt(formData) {
  const strategicContext = generateStrategicContext(formData);
  
  return `🏥 STRATEGIC MEDICAL DEVICE RESEARCH - BENCH-TO-BEDSIDE INTELLIGENCE 🏥

MISSION: Execute COMPREHENSIVE clinical needs analysis and medical device opportunity assessment with regulatory pathway optimization.

${strategicContext}

TARGET ANALYSIS: Clinical area focus on ${formData.clinicalArea || 'medical device opportunities'}
FDA PATHWAY: ${formData.fdaPathway || '510(k)'} regulatory strategy
CARE SETTING: ${formData.careSetting || 'outpatient'} implementation focus  
TECHNOLOGY MATURITY: Level ${formData.techMaturity || 'TRL 4-6'} development stage

EXHAUSTIVE MEDICAL RESEARCH REQUIREMENTS:

1. CLINICAL NEEDS ASSESSMENT
   • COMPLETE unmet medical needs identification
   • ALL clinical workflow pain points
   • EVERY patient outcome optimization opportunity
   • ALL care coordination inefficiencies
   • COMPLETE cost reduction possibilities

2. REGULATORY LANDSCAPE ANALYSIS  
   • ALL FDA pathway requirements and timelines
   • EVERY regulatory precedent and guidance
   • COMPLETE reimbursement pathway analysis
   • ALL quality system and validation requirements
   • EVERY international regulatory consideration

3. MARKET OPPORTUNITY MAPPING
   • ALL market sizing and segmentation
   • EVERY competitive device analysis
   • COMPLETE technology differentiation opportunities
   • ALL key opinion leader insights
   • EVERY adoption barrier and enabler

4. CLINICAL VALIDATION PATHWAY
   • ALL required clinical evidence
   • EVERY study design consideration
   • COMPLETE endpoint selection strategy
   • ALL patient population identification
   • EVERY regulatory submission requirement

DELIVERABLE: Complete bench-to-bedside analysis enabling informed medical device investment decisions.`;
}

/**
 * Private Equity Research Prompt
 */
function formatPrivateEquityPrompt(formData) {
  const strategicContext = generateStrategicContext(formData);
  
  return `💼 STRATEGIC PRIVATE EQUITY RESEARCH - FRAGMENTED INDUSTRY ROLL-UP ANALYSIS 💼

MISSION: Execute COMPREHENSIVE industry fragmentation analysis and consolidation opportunity assessment for private equity investment strategies.

${strategicContext}

TARGET INDUSTRY: ${formData.targetIndustry || 'Industry consolidation analysis'}
TARGET PROFILE: ${formData.targetProfile || 'founder-led'} company characteristics
VALUE DRIVER: ${formData.valueDriver || 'consolidation'} strategy focus
SELLER MOTIVATION: ${formData.sellerMotivation || 'Various exit scenarios'}

EXHAUSTIVE PE RESEARCH REQUIREMENTS:

1. INDUSTRY FRAGMENTATION ANALYSIS
   • COMPLETE market fragmentation mapping
   • ALL consolidation precedents and outcomes
   • EVERY value creation opportunity
   • ALL operational improvement potential
   • COMPLETE roll-up strategy optimization

2. ACQUISITION TARGET IDENTIFICATION
   • ALL potential acquisition candidates
   • EVERY company valuation and metrics
   • COMPLETE seller motivation analysis
   • ALL due diligence requirements
   • EVERY integration complexity assessment

3. VALUE CREATION STRATEGY
   • ALL operational improvement opportunities
   • EVERY synergy realization pathway
   • COMPLETE margin expansion possibilities
   • ALL market expansion strategies
   • EVERY technology integration opportunity

DELIVERABLE: Complete industry roll-up analysis enabling informed private equity investment decisions.`;
}

/**
 * City Revitalization Research Prompt
 */
function formatCityRevitalizationPrompt(formData) {
  const strategicContext = generateStrategicContext(formData);
  
  return `🏛️ STRATEGIC CITY REVITALIZATION RESEARCH - MUNICIPAL DEVELOPMENT INTELLIGENCE 🏛️

MISSION: Execute COMPREHENSIVE municipal development analysis and public-private partnership opportunity assessment.

${strategicContext}

TARGET LOCATION: ${formData.targetLocation || 'Municipal development area'}
FOCUS AREA: ${formData.focusArea || 'Comprehensive revitalization'}
TARGET POPULATION: ${formData.targetPopulation || 'existing'} community focus
LOCAL CONTRIBUTION: ${formData.localContribution || 'funding'} partnership model

EXHAUSTIVE MUNICIPAL RESEARCH REQUIREMENTS:

1. ECONOMIC DEVELOPMENT ANALYSIS
   • COMPLETE local economic assessment
   • ALL revitalization precedents and outcomes
   • EVERY public-private partnership model
   • ALL funding source identification
   • COMPLETE community impact measurement

2. REGULATORY AND POLICY LANDSCAPE
   • ALL zoning and development regulations
   • EVERY grant and funding opportunity
   • COMPLETE permit and approval processes
   • ALL stakeholder engagement requirements
   • EVERY compliance and oversight consideration

3. COMMUNITY AND INFRASTRUCTURE ANALYSIS
   • ALL demographic and socioeconomic factors
   • EVERY infrastructure improvement need
   • COMPLETE transportation and connectivity analysis
   • ALL environmental and sustainability considerations
   • EVERY quality of life enhancement opportunity

DELIVERABLE: Complete municipal development analysis enabling informed city revitalization investment decisions.`;
}

/**
 * Data Center Research Prompt
 */
function formatDataCenterPrompt(formData) {
  const strategicContext = generateStrategicContext(formData);
  
  return `🏢 STRATEGIC DATA CENTER RESEARCH - INFRASTRUCTURE LOCATION INTELLIGENCE 🏢

MISSION: Execute COMPREHENSIVE data center location analysis and infrastructure optimization assessment.

${strategicContext}

TARGET REGION: ${formData.targetRegion || 'Data center location analysis'}
FACILITY TYPE: ${formData.facilityType || 'hyperscale'} data center focus
LATENCY REQUIREMENT: ${formData.latencyRequirement || 'ultra-low'} performance needs
DISASTER RISK TOLERANCE: Level ${formData.disasterRiskTolerance || '2'} risk acceptance

EXHAUSTIVE DATA CENTER RESEARCH REQUIREMENTS:

1. LOCATION AND INFRASTRUCTURE ANALYSIS
   • COMPLETE site selection criteria optimization
   • ALL power grid capacity and reliability assessment
   • EVERY connectivity and network analysis
   • ALL cooling and environmental considerations
   • COMPLETE regulatory and zoning evaluation

2. MARKET DEMAND AND CAPACITY ANALYSIS
   • ALL regional demand patterns and growth
   • EVERY competitor capacity and positioning
   • COMPLETE pricing and market dynamics
   • ALL customer segment requirements
   • EVERY technology trend impact assessment

3. RISK AND RESILIENCE ASSESSMENT
   • ALL natural disaster and climate risks
   • EVERY security and compliance requirement
   • COMPLETE business continuity planning
   • ALL regulatory and policy considerations
   • EVERY operational risk mitigation strategy

DELIVERABLE: Complete data center location analysis enabling informed infrastructure investment decisions.`;
}

/**
 * Main prompt generation function - routes to appropriate research type
 */
function generateResearchPrompt(formData) {
  const researchType = formData.researchType || 'innovation';
  
  switch (researchType) {
    case 'innovation':
      return formatInnovationPrompt(formData);
    case 'medical-device':
      return formatMedicalDevicePrompt(formData);
    case 'private-equity':
      return formatPrivateEquityPrompt(formData);
    case 'city-revitalization':
      return formatCityRevitalizationPrompt(formData);
    case 'data-center':
      return formatDataCenterPrompt(formData);
    default:
      return formatInnovationPrompt(formData);
  }
}

module.exports = {
  generateResearchPrompt,
  formatInnovationPrompt,
  formatMedicalDevicePrompt,
  formatPrivateEquityPrompt,
  formatCityRevitalizationPrompt,
  formatDataCenterPrompt
};