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
 * Medical Device Research Prompt - Comprehensive Bench-to-Bedside Analysis
 */
function formatMedicalDevicePrompt(formData) {
  const strategicContext = generateStrategicContext(formData);
  
  const investmentScale = formData.investmentScale || 'growth';
  const timeline = formData.timeline || 'medium-term';
  const riskProfile = formData.riskProfile || 'moderate';
  const researchTopology = formData.researchTopology || 'federated';
  
  return `🏥 STRATEGIC MEDICAL DEVICE RESEARCH - COMPREHENSIVE BENCH-TO-BEDSIDE OPPORTUNITY ASSESSMENT 🏥

MISSION: Execute comprehensive analysis to identify and evaluate high-potential medical device innovation opportunities in **${formData.clinicalArea || 'clinical specialties'}**. Systematically examine the intersection of clinical need, regulatory feasibility, and commercial viability to de-risk medical device development decisions targeting the **${formData.fdaPathway || '510(k)'}** regulatory pathway for **${formData.careSetting || 'outpatient'}** applications at Technology Readiness Level **${formData.techMaturity || 'TRL 4-6'}**.

⚖️ ETHICAL CONTEXT: Medical device innovation drives improved patient outcomes through evidence-based clinical research and regulatory compliance. This research enables better healthcare solutions while ensuring patient safety through rigorous development pathways.

${strategicContext}

🎯 RESEARCH CONFIGURATION:
This analysis is calibrated for **${investmentScale.toUpperCase()}** investment scale with **${timeline}** development horizon, **${riskProfile}** risk tolerance, and **${researchTopology}** research methodology.

🎯 PRIMARY RESEARCH OBJECTIVES:
Identify medical device opportunities in ${formData.clinicalArea || 'target clinical areas'} that demonstrate:
• Significant unmet clinical need with clear patient impact in ${formData.careSetting || 'clinical'} settings aligned with ${investmentScale} market opportunity size
• Regulatory pathway alignment with ${formData.fdaPathway || '510(k)'} requirements achievable within ${timeline} development horizons
• Strong commercial viability through existing or obtainable reimbursement mechanisms consistent with ${riskProfile} investment parameters
• Technology landscape positioning appropriate for TRL ${formData.techMaturity || 'TRL 4-6'} development stage and ${investmentScale} resource requirements

SUCCESS CRITERIA: Produce actionable intelligence that can guide ${investmentScale} resource allocation toward ${formData.clinicalArea || 'clinical'} innovations with the highest probability of clinical adoption and commercial success through the ${formData.fdaPathway || '510(k)'} pathway over ${timeline} timeframes.

SWARM ASSEMBLY DIRECTIVE:
Assemble specialized medical device intelligence team:
• Lead Clinical Research Strategist - Orchestrate comprehensive bench-to-bedside analysis
• FDA Regulatory Specialists - Navigate ${formData.fdaPathway || '510(k)'} pathway requirements and precedents aligned with ${timeline} development planning
• Clinical Needs Assessment Team - Map unmet needs in ${formData.clinicalArea || 'target areas'} for ${formData.careSetting || 'clinical'} care delivery at ${investmentScale} market scale
• Reimbursement Analysis Team - Analyze economic viability for ${formData.careSetting || 'target'} procedures consistent with ${riskProfile} investment parameters
• Technology & Patent Intelligence - Map competitive landscape and IP considerations for TRL ${formData.techMaturity || 'TRL 4-6'} innovations at ${investmentScale} scope
• Key Opinion Leader Network - Gather insights from practicing ${formData.clinicalArea || 'specialists'} and ${formData.careSetting || 'clinical'} care experts
• Market Intelligence Analysts - Assess competitive dynamics and commercial positioning for ${investmentScale} market entry
• Clinical Trial Strategy Team - Design evidence generation pathways for ${formData.fdaPathway || '510(k)'} submissions within ${timeline} constraints

RESEARCH METHODOLOGY FRAMEWORK:
**${researchTopology.toUpperCase()} RESEARCH APPROACH**:
${researchTopology === 'hierarchical' ? `• Top-Down Clinical Analysis: Start with macro ${formData.clinicalArea || 'clinical specialty'} disease burden, narrow to specific ${formData.careSetting || 'care setting'} care gaps, then identify device intervention opportunities
• Structured Regulatory Pathway: Systematically evaluate ${formData.fdaPathway || '510(k)'} requirements from Class determination through clinical trial design
• Centralized Market Intelligence: Aggregate reimbursement, competitive, and technology data into unified commercial assessment framework` : ''}
${researchTopology === 'byzantine' ? `• Multi-Source Clinical Validation: Cross-verify clinical need insights across physician surveys, patient advocacy, and clinical literature sources
• Redundant Regulatory Analysis: Use overlapping regulatory intelligence sources to ensure comprehensive ${formData.fdaPathway || '510(k)'} requirement understanding
• Triangulated Commercial Assessment: Reconcile market size estimates, reimbursement projections, and competitive positioning through weighted analytical consensus` : ''}
${researchTopology === 'federated' ? `• Parallel Domain Expertise: Execute simultaneous research streams across clinical, regulatory, commercial, and technology domains
• Independent Analytical Modules: Allow each expertise area to develop autonomous insights before cross-functional integration
• Collaborative Innovation Assessment: Synthesize federated findings through interdisciplinary medical device development framework` : ''}

EXHAUSTIVE MEDICAL DEVICE RESEARCH REQUIREMENTS:

1. CLINICAL NEEDS ASSESSMENT - ${(formData.clinicalArea || 'TARGET CLINICAL AREA').toUpperCase()}
   Map current landscape of unmet clinical needs in ${formData.clinicalArea || 'target clinical areas'} with particular attention to ${formData.careSetting || 'care delivery'} challenges and gaps scaled for ${investmentScale} market opportunities:
   
   **${investmentScale.toUpperCase()} MARKET OPPORTUNITY SIZING**:
   ${investmentScale === 'seed' ? `• Target Market Size: $10M-$100M total addressable market for niche ${formData.clinicalArea || 'clinical'} applications
   • Patient Population: Focused sub-populations or rare conditions with high unmet need density
   • Clinical Impact Threshold: Clear clinical benefit demonstration sufficient for early adoption and physician advocacy` : ''}
   ${investmentScale === 'growth' ? `• Target Market Size: $100M-$1B total addressable market for scalable ${formData.clinicalArea || 'clinical'} solutions
   • Patient Population: Broader ${formData.clinicalArea || 'clinical'} populations with established care pathways and reimbursement
   • Clinical Impact Threshold: Significant clinical improvement with health economic value demonstration` : ''}
   ${investmentScale === 'enterprise' ? `• Target Market Size: $1B+ total addressable market for transformative ${formData.clinicalArea || 'clinical'} innovations
   • Patient Population: Large-scale ${formData.clinicalArea || 'clinical'} populations with systemic care delivery challenges
   • Clinical Impact Threshold: Paradigm-shifting clinical outcomes with comprehensive health system impact` : ''}
   
   • Specific clinical gaps identified by practicing ${formData.clinicalArea || 'specialists'} in past 24 months relevant to ${formData.careSetting || 'care delivery'} at ${investmentScale} market scale
   • ${timeline} clinical development timelines alignment with evolving ${formData.clinicalArea || 'clinical'} standard of care and competitive landscape changes
   • ${riskProfile}-appropriate clinical endpoints demonstrating meaningful improvement in ${formData.clinicalArea || 'clinical'} ${formData.careSetting || 'care'} outcomes
   • Workflow inefficiencies in ${formData.careSetting || 'clinical'} ${formData.clinicalArea || 'procedures'} that TRL ${formData.techMaturity || 'TRL 4-6'} technology could address within ${timeline} development horizon

2. FDA REGULATORY LANDSCAPE ANALYSIS - ${(formData.fdaPathway || '510(K)').toUpperCase()} PATHWAY
   Comprehensively map FDA regulatory landscape for ${formData.clinicalArea || 'clinical'} devices pursuing ${formData.fdaPathway || '510(k)'} pathway, with emphasis on ${formData.careSetting || 'care setting'} use considerations and ${timeline} development planning:
   
   **${(formData.fdaPathway || '510(K)').toUpperCase()} DEVELOPMENT TIMELINE ALIGNMENT**:
   ${formData.fdaPathway === '510k' || formData.fdaPathway === '510(k)' ? `• ${timeline.charAt(0).toUpperCase() + timeline.slice(1)} 510(k) Pathway: ${timeline === 'short-term' ? 'Target predicate devices with clear substantial equivalence for 6-12 month clearance' : timeline === 'medium-term' ? 'Allow for potential FDA questions and additional testing within 12-24 month timeline' : 'Plan for potential predicate challenges or De Novo reclassification scenarios'}` : ''}
   ${formData.fdaPathway === 'PMA' ? `• ${timeline.charAt(0).toUpperCase() + timeline.slice(1)} PMA Pathway: ${timeline === 'short-term' ? 'Aggressive clinical trial design with streamlined endpoints (challenging for PMA)' : timeline === 'medium-term' ? 'Standard PMA timeline with pivotal trial and 12-18 month review' : 'Comprehensive clinical development with multiple studies and regulatory interaction'}` : ''}
   ${formData.fdaPathway === 'De Novo' ? `• ${timeline.charAt(0).toUpperCase() + timeline.slice(1)} De Novo Pathway: ${timeline === 'short-term' ? 'Focus on existing classification precedents with minimal novel risk assessment' : timeline === 'medium-term' ? 'Standard novel device classification with moderate clinical evidence requirements' : 'Comprehensive novel classification establishment with extensive regulatory precedent setting'}` : ''}
   
   **${investmentScale.toUpperCase()} REGULATORY RESOURCE REQUIREMENTS**:
   ${investmentScale === 'seed' ? `• Regulatory Strategy: Lean regulatory approach with consultant-led FDA interaction and streamlined clinical development
   • Clinical Evidence: Focused studies with efficient endpoints and minimal patient enrollment requirements
   • Quality Systems: Scalable QSR implementation appropriate for limited manufacturing scope` : ''}
   ${investmentScale === 'growth' ? `• Regulatory Strategy: Professional regulatory team with systematic FDA engagement and comprehensive development planning
   • Clinical Evidence: Well-powered studies with clinically meaningful endpoints and appropriate statistical design
   • Quality Systems: Robust QSR implementation supporting commercial-scale manufacturing and distribution` : ''}
   ${investmentScale === 'enterprise' ? `• Regulatory Strategy: Full regulatory organization with multiple pathway management and global regulatory coordination
   • Clinical Evidence: Comprehensive clinical development program with multiple studies and extensive post-market commitments
   • Quality Systems: Enterprise-grade QSR implementation with global harmonization and advanced manufacturing compliance` : ''}

3. REIMBURSEMENT LANDSCAPE ASSESSMENT - ${(formData.careSetting || 'CARE SETTING').toUpperCase()} ECONOMIC ANALYSIS
   Analyze economic environment surrounding ${formData.clinicalArea || 'clinical'} procedures in ${formData.careSetting || 'care'} settings to identify financially viable device opportunities scaled for ${investmentScale} commercial deployment:
   
   **${investmentScale.toUpperCase()} COMMERCIAL VIABILITY FRAMEWORK**:
   ${investmentScale === 'seed' ? `• Reimbursement Strategy: Target existing CPT codes with clear reimbursement precedent and minimal payer policy risk
   • Pricing Strategy: Cost-plus pricing model with focus on physician adoption and early market penetration
   • Market Access: Direct physician sales with minimal payer negotiation requirements` : ''}
   ${investmentScale === 'growth' ? `• Reimbursement Strategy: Balanced approach between existing codes and new code development with managed care contracting
   • Pricing Strategy: Value-based pricing with health economic evidence and competitive positioning analysis
   • Market Access: Multi-channel distribution with payer engagement and formulary positioning strategies` : ''}
   ${investmentScale === 'enterprise' ? `• Reimbursement Strategy: Comprehensive reimbursement portfolio including new CPT codes, coverage policy development, and global market access
   • Pricing Strategy: Premium pricing supported by comprehensive clinical and economic evidence with risk-sharing arrangements
   • Market Access: Full market access organization with payer partnerships, health system contracting, and international expansion` : ''}
   
   ${formData.careSetting === 'outpatient' ? `• ASC payment rates for ${formData.clinicalArea || 'clinical'} procedures supporting ${investmentScale} commercial viability over ${timeline} market development` : ''}
   ${formData.careSetting === 'inpatient' ? `• DRG payment dynamics in ${formData.clinicalArea || 'clinical'} creating ${investmentScale} device adoption incentives within ${timeline} market cycles` : ''}
   ${formData.careSetting === 'home' ? `• Remote monitoring reimbursement trends in ${formData.clinicalArea || 'clinical'} supporting ${investmentScale} home-based device strategies over ${timeline} horizons` : ''}

4. TECHNOLOGY AND PATENT LANDSCAPE MAPPING - TRL ${(formData.techMaturity || 'TRL 4-6').toString().toUpperCase()} 
   Create comprehensive view of competitive technology landscape in ${formData.clinicalArea || 'clinical areas'} to identify innovation opportunities appropriate for TRL ${formData.techMaturity || 'TRL 4-6'} development at ${investmentScale} resource deployment:
   
   **${investmentScale.toUpperCase()} IP STRATEGY FRAMEWORK**:
   ${investmentScale === 'seed' ? `• Patent Strategy: Focused IP portfolio with core invention protection and freedom-to-operate analysis
   • Competitive Intelligence: Monitor key patents and potential infringement risks with cost-effective IP management
   • Technology Positioning: Identify white space opportunities with minimal competitive patent interference` : ''}
   ${investmentScale === 'growth' ? `• Patent Strategy: Comprehensive IP portfolio with offensive and defensive patent development and licensing opportunities
   • Competitive Intelligence: Systematic patent landscape monitoring with competitive intelligence and strategic IP acquisition
   • Technology Positioning: Build patent thickets around core technologies with strategic filing and prosecution management` : ''}
   ${investmentScale === 'enterprise' ? `• Patent Strategy: Global IP portfolio with comprehensive patent prosecution, strategic licensing, and IP monetization
   • Competitive Intelligence: Full competitive intelligence organization with patent analytics, acquisition targeting, and litigation management
   • Technology Positioning: Establish dominant IP position with industry-leading patent portfolio and standard-setting participation` : ''}

5. MARKET INTELLIGENCE AND COMPETITIVE ANALYSIS
   Understand broader market dynamics, key players, and competitive positioning opportunities in ${formData.clinicalArea || 'clinical areas'} for ${formData.careSetting || 'care'} applications scaled for ${investmentScale} market entry:
   
   **${investmentScale.toUpperCase()} COMPETITIVE STRATEGY FRAMEWORK**:
   ${investmentScale === 'seed' ? `• Market Entry: Niche market focus with specialized physician adoption and minimal competitive confrontation
   • Competitive Positioning: Differentiated value proposition with clear clinical advantage and cost-effective implementation
   • Strategic Partnerships: Component supplier relationships and physician advisor networks for market validation` : ''}
   ${investmentScale === 'growth' ? `• Market Entry: Broad market penetration with multi-channel distribution and competitive displacement strategies
   • Competitive Positioning: Superior clinical outcomes with comprehensive value proposition and market share capture
   • Strategic Partnerships: Key opinion leader engagement, health system partnerships, and potential acquisition positioning` : ''}
   ${investmentScale === 'enterprise' ? `• Market Entry: Market leadership establishment with comprehensive competitive strategy and ecosystem development
   • Competitive Positioning: Industry transformation through breakthrough innovation and market category creation
   • Strategic Partnerships: Global strategic alliances, health system integration, and industry consortium leadership` : ''}

6. INTEGRATED OPPORTUNITY ASSESSMENT
   **${investmentScale.toUpperCase()}-CALIBRATED SCORING FRAMEWORK** (weighted for ${riskProfile} and ${timeline}):
   
   ${riskProfile === 'conservative' ? `• Clinical Validation Certainty (35%): Well-established clinical endpoints with high regulatory success probability
   • ${formData.fdaPathway || '510(k)'} Regulatory Feasibility (30%): Clear pathway with precedent and minimal development risk
   • Reimbursement Security (25%): Existing code utilization with established payer coverage
   • Technology Readiness (10%): Proven technology platform with minimal development risk` : ''}
   ${riskProfile === 'moderate' ? `• Clinical Impact Potential (30%): Meaningful clinical improvement with reasonable validation requirements
   • Market Opportunity Size (25%): Significant ${investmentScale} market with sustainable competitive positioning
   • Regulatory Pathway Clarity (25%): Manageable ${formData.fdaPathway || '510(k)'} requirements within ${timeline} constraints
   • Competitive Advantage (20%): Differentiated technology position with defensible market entry strategy` : ''}
   ${riskProfile === 'aggressive' ? `• Market Transformation Potential (35%): Breakthrough clinical outcomes with paradigm-shifting market impact
   • Competitive Disruption Opportunity (30%): Novel technology approach with significant competitive advantage potential
   • Revenue Scale Potential (20%): Large ${investmentScale} market opportunity with premium pricing sustainability
   • Strategic Value Creation (15%): Platform technology with multiple application and expansion opportunities` : ''}

DELIVERABLE REQUIREMENTS:

**Executive Summary**: ${investmentScale === 'seed' ? '2-page' : investmentScale === 'growth' ? '3-page' : '4-page'} overview of most promising ${formData.clinicalArea || 'clinical'} opportunities for ${formData.careSetting || 'care'} applications via ${formData.fdaPathway || '510(k)'} pathway, calibrated for ${investmentScale} scale, ${timeline} horizon, and ${riskProfile} risk parameters.

**Detailed Opportunity Profiles**: For top ${investmentScale === 'seed' ? '5-7' : investmentScale === 'growth' ? '7-10' : '10-15'} opportunities:
• ${formData.clinicalArea || 'Clinical'} need description and ${investmentScale}-appropriate market sizing
• ${formData.fdaPathway || '510(k)'} regulatory pathway assessment with ${timeline} development planning and ${riskProfile} risk mitigation
• ${formData.careSetting || 'Care setting'} reimbursement analysis calibrated for ${investmentScale} commercial deployment
• Competitive landscape positioning for ${investmentScale} market entry over ${timeline} horizon
• TRL ${formData.techMaturity || 'TRL 4-6'} to market development timeline with ${investmentScale} resource requirements
• ${riskProfile}-adjusted commercial projections and investment merit assessment

**Development Roadmap**: ${timeline}-sequenced implementation plan including:
• Clinical development milestones aligned with ${formData.fdaPathway || '510(k)'} requirements
• ${investmentScale} resource deployment and funding requirement projections
• ${riskProfile}-appropriate risk mitigation strategies and contingency planning
• Market entry strategy calibrated for ${investmentScale} commercial deployment

SUCCESS METRICS: Enable stakeholders to prioritize ${formData.clinicalArea || 'clinical'} R&D investments based on ${investmentScale} market opportunity assessment and ${riskProfile} risk tolerance, develop ${formData.fdaPathway || '510(k)'} regulatory strategies optimized for ${timeline} development horizons, and position ${formData.clinicalArea || 'clinical'} innovations for sustainable competitive advantage.

═══════════════════════════════════════════════════════════════════════════
🏥 MEDICAL DEVICE CREATIVE DIVERGENCE DIRECTIVES
═══════════════════════════════════════════════════════════════════════════

Generate "impossible patient" scenarios: design medical devices for patients that don't exist yet but will emerge from demographic/technological changes in ${formData.clinicalArea || 'healthcare'}.

Include regulatory rebellion thesis: identify which FDA requirement everyone accepts that should be challenged for ${formData.careSetting || 'care setting'} ${formData.clinicalArea || 'clinical'} applications.

Provide physician behavior disruption analysis: describe how a breakthrough device would change fundamental ${formData.clinicalArea || 'clinical'} practice patterns in ${formData.careSetting || 'care'} environments.

Output clinical folklore: create a legend about the ${formData.clinicalArea || 'medical'} innovation that "could have been" but regulatory or reimbursement barriers prevented its ${investmentScale} commercialization.`;
}

/**
 * Private Equity Research Prompt - Comprehensive Off-Market Acquisition Analysis
 */
function formatPrivateEquityPrompt(formData) {
  const strategicContext = generateStrategicContext(formData);
  
  // Helper function to generate conditional content based on form parameters
  const generateConditionalContent = (field, value, content) => {
    return formData[field] === value ? content : '';
  };
  
  const investmentScale = formData.investmentScale || 'growth';
  const timeline = formData.timeline || 'medium-term';
  const riskProfile = formData.riskProfile || 'moderate';
  const researchTopology = formData.researchTopology || 'federated';
  
  return `💼 STRATEGIC PRIVATE EQUITY RESEARCH - COMPREHENSIVE OFF-MARKET ACQUISITION PIPELINE 💼

MISSION: Execute comprehensive analysis to identify and evaluate high-potential acquisition targets for Private Equity roll-up strategy in the **${formData.targetIndustry || 'target industry'}** sector. Systematically combine traditional financial data with alternative data signals to build proprietary pipeline of **${formData.targetProfile || 'founder-led'}** companies with strong fundamentals and high propensity to sell, with value creation opportunities driven by **${formData.valueDriver || 'consolidation'}** and motivated by **${formData.sellerMotivation || 'seller motivation factors'}**.

⚖️ ETHICAL CONTEXT: Private equity research drives economic growth through strategic consolidation and operational improvements. This research enables better capital allocation while creating value for portfolio companies, employees, and stakeholders through professional management and strategic resources.

${strategicContext}

🎯 RESEARCH CONFIGURATION:
This analysis is calibrated for **${investmentScale.toUpperCase()}** investment scale with **${timeline}** strategic horizon, **${riskProfile}** risk tolerance, and **${researchTopology}** research methodology.

🎯 PRIMARY RESEARCH OBJECTIVES:
Generate proprietary pipeline of "off-market" acquisition targets in ${formData.targetIndustry || 'target industry'} that demonstrate:
• Financial attractiveness as ${formData.targetProfile || 'founder-led'} businesses suitable for ${investmentScale} roll-up consolidation
• Clear value creation opportunities through ${formData.valueDriver || 'consolidation'} strategies aligned with ${timeline} value creation horizon
• Strong alternative data signals indicating receptivity to sale motivated by ${formData.sellerMotivation || 'seller motivation'}
• Risk-return profiles consistent with ${riskProfile} investment parameters
• Operational characteristics that align with ${investmentScale} PE value creation playbooks

SUCCESS CRITERIA: Produce actionable intelligence enabling proactive outreach to high-probability acquisition targets before they formally enter the market, with clear rationale for ${formData.valueDriver || 'consolidation'}-focused value creation over ${timeline} timeframes.

SWARM ASSEMBLY DIRECTIVE:
Assemble specialized private equity intelligence team:
• Lead PE Research Strategist - Orchestrate comprehensive roll-up opportunity analysis
• Industry Analysis Team - Map ${formData.targetIndustry || 'target industry'} fragmentation and consolidation dynamics for ${investmentScale} opportunities
• Target Universe Generation Team - Build comprehensive database of ${formData.targetProfile || 'founder-led'} companies within ${investmentScale} parameters
• Alternative Data Intelligence - Detect ${formData.sellerMotivation || 'seller motivation'} signals using non-traditional data sources calibrated for ${timeline} transaction timing
• ${formData.valueDriver || 'Consolidation'} Value Creation Analysts - Evaluate improvement potential across targets for ${investmentScale} resource deployment
• Financial Due Diligence Team - Assess risk-return profiles consistent with ${riskProfile} investment parameters
• Market Intelligence Analysts - Provide competitive dynamics and positioning analysis
• Deal Execution Strategists - Develop ${timeline}-sequenced engagement and acquisition roadmaps

RESEARCH METHODOLOGY FRAMEWORK:
**${researchTopology.toUpperCase()} RESEARCH APPROACH**:
${researchTopology === 'hierarchical' ? `• Top-Down Analysis: Start with macro ${formData.targetIndustry || 'industry'} trends, narrow to segment opportunities, then identify specific targets
• Structured Decision Trees: Use systematic filtering criteria to eliminate unsuitable targets at each analytical level  
• Centralized Data Integration: Aggregate all data sources into unified analytical framework for consistent evaluation` : ''}
${researchTopology === 'byzantine' ? `• Multi-Source Triangulation: Cross-validate findings across multiple independent data sources and analytical approaches
• Redundant Verification: Use overlapping research methodologies to ensure robust target identification and risk assessment
• Consensus-Building Analysis: Reconcile conflicting signals through weighted scoring that accounts for source reliability` : ''}
${researchTopology === 'federated' ? `• Distributed Research Modules: Execute parallel research streams across different aspects (financial, operational, market, regulatory)
• Autonomous Sub-Analyses: Allow each research domain to develop independent insights before integration
• Collaborative Synthesis: Combine federated findings through cross-functional analytical integration` : ''}

EXHAUSTIVE PRIVATE EQUITY RESEARCH REQUIREMENTS:

1. INDUSTRY FRAGMENTATION AND MARKET STRUCTURE ANALYSIS
   Map fragmentation landscape of ${formData.targetIndustry || 'target industry'} and validate structural characteristics for ${investmentScale} roll-up strategy focused on ${formData.valueDriver || 'consolidation'} over ${timeline} horizons:
   • Market share concentration in ${formData.targetIndustry || 'target industry'} using relevant NAICS codes supporting ${investmentScale} investment opportunities
   • Typical characteristics of ${formData.targetProfile || 'founder-led'} businesses in ${formData.targetIndustry || 'target industry'} aligning with ${investmentScale} deal size parameters
   • Industry dynamics supporting ${formData.valueDriver || 'consolidation'} as primary value creation strategy achievable within ${timeline} timeframes
   ${timeline === 'short-term' ? `• Immediate consolidation opportunities generating returns within 2-3 years through ${formData.valueDriver || 'consolidation'} strategies` : ''}
   ${timeline === 'medium-term' ? `• Structural transformation opportunities in ${formData.targetIndustry || 'target industry'} captured over 3-7 year investment horizons through ${formData.valueDriver || 'consolidation'} approaches` : ''}
   ${timeline === 'long-term' ? `• Secular industry evolution trends creating long-term value creation opportunities through ${formData.valueDriver || 'consolidation'} strategies over 7+ year periods` : ''}
   • ${riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)} risk parameters alignment with typical volatility and cyclical patterns in ${formData.targetIndustry || 'target industry'}

2. TARGET UNIVERSE GENERATION AND SCREENING - ${investmentScale.toUpperCase()} SCALE
   Build comprehensive universe of ${formData.targetProfile || 'founder-led'} companies in ${formData.targetIndustry || 'target industry'} within ${investmentScale}-appropriate size parameters:
   ${investmentScale === 'seed' ? `• Target Revenue Range: $1M-$10M for platform and add-on acquisitions
   • Target EBITDA Range: $200K-$2M with growth trajectory analysis
   • Market Position: Early-stage market participants with expansion potential` : ''}
   ${investmentScale === 'growth' ? `• Target Revenue Range: $5M-$50M for scalable platform development
   • Target EBITDA Range: $1M-$10M with proven business model validation
   • Market Position: Established regional players ready for geographic or service expansion` : ''}
   ${investmentScale === 'enterprise' ? `• Target Revenue Range: $25M-$250M for large-scale consolidation platforms
   • Target EBITDA Range: $5M-$50M with institutional-grade operations
   • Market Position: Market leaders or strong regional players suitable for national platform development` : ''}
   • Total addressable universe of ${formData.targetProfile || 'founder-led'} companies meeting ${investmentScale} size criteria
   • Geographic markets offering optimal target density for ${investmentScale} ${formData.targetIndustry || 'target industry'} roll-up strategies
   • ${timeline} growth trajectories among ${formData.targetProfile || 'founder-led'} businesses at ${investmentScale} scale

3. ALTERNATIVE DATA SIGNAL DETECTION - ${(formData.sellerMotivation || 'SELLER MOTIVATION').toUpperCase()} ANALYSIS
   Identify ${formData.targetProfile || 'founder-led'} companies exhibiting strong alternative data signals of willingness to sell driven by **${formData.sellerMotivation || 'seller motivation'}**, calibrated for ${timeline} transaction timing:
   ${timeline === 'short-term' ? `• Immediate Indicators: Active succession planning, retirement announcements, financial distress signals
   • Urgency Markers: Recent ownership changes, regulatory pressures, competitive threats requiring immediate response
   • Transaction Readiness: Formal advisor engagements, management presentations, data room preparations` : ''}
   ${timeline === 'medium-term' ? `• Developing Trends: Gradual ownership transition planning, strategic review processes, management succession discussions
   • Market Position Shifts: Competitive pressure building, technology adoption lag, market share erosion trends
   • Operational Inflection Points: Growth plateau indicators, capital investment needs, professionalization requirements` : ''}
   ${timeline === 'long-term' ? `• Secular Trend Indicators: Industry transformation pressures, generational transition planning, strategic repositioning needs
   • Foundational Changes: Technology disruption early signals, demographic shifts, regulatory evolution impacts
   • Strategic Repositioning: Long-term competitive positioning challenges, market evolution adaptation requirements` : ''}
   • Primary Motivation Indicators: Direct signals related to ${formData.sellerMotivation || 'seller motivation'} in news, interviews, trade publications
   • Supporting Behavioral Signals: Operational patterns consistent with ${formData.sellerMotivation || 'seller motivation'} drivers
   • Contextual Environment Factors: External conditions that amplify ${formData.sellerMotivation || 'seller motivation'} pressures

4. VALUE CREATION OPPORTUNITY ASSESSMENT - ${(formData.valueDriver || 'CONSOLIDATION').toUpperCase()} STRATEGY
   Evaluate ${formData.valueDriver || 'consolidation'} value creation potential across identified targets, calibrated for ${investmentScale} resource deployment and ${timeline} execution horizons:
   ${formData.valueDriver === 'consolidation' ? `• ${investmentScale.charAt(0).toUpperCase() + investmentScale.slice(1)} Consolidation Model: ${investmentScale === 'seed' ? 'Local/regional consolidation with organic growth' : investmentScale === 'growth' ? 'Multi-market platform development with systematic add-on acquisitions' : 'National platform creation through large-scale consolidation'}
   • ${timeline.charAt(0).toUpperCase() + timeline.slice(1)} Execution Roadmap: ${timeline === 'short-term' ? 'Rapid integration with immediate synergy capture' : timeline === 'medium-term' ? 'Systematic platform building with measured integration phases' : 'Strategic transformation with comprehensive market repositioning'}` : ''}
   ${formData.valueDriver === 'operational-improvement' ? `• ${investmentScale.charAt(0).toUpperCase() + investmentScale.slice(1)} Improvement Scope: ${investmentScale === 'seed' ? 'Foundational systems and process implementation' : investmentScale === 'growth' ? 'Scalable infrastructure and professional management implementation' : 'Enterprise-grade transformation and optimization initiatives'}
   • ${timeline.charAt(0).toUpperCase() + timeline.slice(1)} Implementation Plan: ${timeline === 'short-term' ? 'Quick-win operational enhancements' : timeline === 'medium-term' ? 'Systematic process reengineering and capability building' : 'Complete operational transformation and market repositioning'}` : ''}
   • ${formData.valueDriver || 'Consolidation'} opportunities among ${formData.targetProfile || 'founder-led'} companies aligning with ${investmentScale} resource capabilities
   • ${timeline} execution requirements for ${formData.valueDriver || 'consolidation'} strategies matching target readiness and market conditions
   • ${riskProfile}-appropriate ${formData.valueDriver || 'consolidation'} approaches offering optimal risk-adjusted returns in ${formData.targetIndustry || 'target industry'}

5. OPPORTUNITY ZONE IDENTIFICATION AND PRIORITIZATION
   Integrated scoring framework weighted for ${riskProfile} profile:
   ${riskProfile === 'conservative' ? `• Financial Stability (40%): Cash flow predictability, margin consistency, balance sheet strength
   • ${formData.valueDriver || 'Consolidation'} Certainty (30%): Proven improvement opportunities with high success probability
   • Acquisition Readiness (20%): Clear ${formData.sellerMotivation || 'seller motivation'} signals with straightforward transaction structure
   • Integration Risk (10%): Low operational complexity and cultural alignment` : ''}
   ${riskProfile === 'moderate' ? `• Financial Performance (35%): Growth trajectory, margin improvement potential, cash generation
   • ${formData.valueDriver || 'Consolidation'} Opportunity (30%): Balanced improvement potential with reasonable execution risk
   • Market Position (20%): Competitive advantages and market share defensibility
   • Transaction Readiness (15%): ${formData.sellerMotivation || 'Seller motivation'} signals with manageable complexity` : ''}
   ${riskProfile === 'aggressive' ? `• Growth Potential (30%): Revenue expansion opportunities and market positioning upside
   • ${formData.valueDriver || 'Consolidation'} Upside (35%): High-impact transformation opportunities with outsized returns
   • Competitive Advantage (20%): Unique positioning or disruption potential
   • Strategic Value (15%): Platform potential and long-term positioning benefits` : ''}

DELIVERABLE REQUIREMENTS:

**Executive Summary**: ${investmentScale === 'seed' ? '2-page' : investmentScale === 'growth' ? '3-page' : '4-page'} overview of ${formData.targetIndustry || 'target industry'} roll-up opportunity with ${formData.valueDriver || 'consolidation'} value creation thesis calibrated for ${investmentScale} scale, ${timeline} horizon, and ${riskProfile} risk parameters.

**Target Pipeline Database**: Comprehensive database including:
• Complete target universe with ${investmentScale}-appropriate financial screening
• ${riskProfile}-calibrated opportunity scoring for all qualified targets
• ${timeline}-sequenced alternative data signals and engagement timing recommendations
• ${formData.sellerMotivation || 'Seller motivation'} assessment with optimal approach strategies
• ${formData.valueDriver || 'Consolidation'} value creation opportunity quantification at ${investmentScale} scope

**Detailed Target Profiles**: For top ${investmentScale === 'seed' ? '10-15' : investmentScale === 'growth' ? '15-20' : '20-25'} targets:
• Company overview with ${formData.targetProfile || 'founder-led'} characteristics and ${investmentScale} fit assessment
• ${riskProfile}-adjusted financial performance analysis and investment merit evaluation
• ${formData.valueDriver || 'Consolidation'} value creation roadmap with ${timeline}-appropriate milestones
• ${formData.sellerMotivation || 'Seller motivation'} analysis with tailored approach messaging and timing
• Integration risk assessment calibrated for ${investmentScale} resource deployment

**Implementation Roadmap**: ${timeline}-sequenced execution plan including:
• Target engagement prioritization and timing optimization
• ${formData.valueDriver || 'Consolidation'} value creation implementation timeline and resource requirements
• ${riskProfile}-appropriate risk mitigation strategies and contingency planning
• ${investmentScale} portfolio construction and capital deployment scheduling

SUCCESS METRICS: Enable stakeholders to execute ${investmentScale}-appropriate ${formData.targetIndustry || 'target industry'} roll-up strategy with optimal target selection, achieve ${riskProfile}-calibrated returns through systematic ${formData.valueDriver || 'consolidation'} value creation, time market engagement optimally for ${timeline} strategic horizons, and build sustainable competitive advantages in ${formData.targetIndustry || 'target industry'} deal sourcing.

═══════════════════════════════════════════════════════════════════════════
💼 PRIVATE EQUITY CREATIVE DIVERGENCE DIRECTIVES
═══════════════════════════════════════════════════════════════════════════

Generate "phantom platform" scenarios: design acquisition targets that don't exist yet but could be created through strategic combination of existing ${formData.targetProfile || 'founder-led'} companies.

Include industry disruption thesis: identify which ${formData.targetIndustry || 'industry'} assumption everyone accepts that should be challenged through roll-up consolidation.

Provide future market leader profile: describe the consolidated platform that will dominate ${formData.targetIndustry || 'target industry'} in 2030 through ${formData.valueDriver || 'consolidation'} strategy.

Output deal folklore: create a legend about the ${formData.targetIndustry || 'industry'} roll-up opportunity that "could have been" but timing or execution prevented.`;
}

/**
 * City Revitalization Research Prompt - Comprehensive Community Development and Funding Optimization
 */
function formatCityRevitalizationPrompt(formData) {
  const strategicContext = generateStrategicContext(formData);
  
  const investmentScale = formData.investmentScale || 'growth';
  const timeline = formData.timeline || 'medium-term';
  const riskProfile = formData.riskProfile || 'moderate';
  const researchTopology = formData.researchTopology || 'federated';
  
  return `🏛️ STRATEGIC CITY REVITALIZATION RESEARCH - COMPREHENSIVE COMMUNITY DEVELOPMENT AND FUNDING OPTIMIZATION 🏛️

MISSION: Execute comprehensive analysis to identify optimal revitalization strategies and funding opportunities for **${formData.targetLocation || 'target communities'}** with specific focus on **${formData.focusArea || 'community development'}** development. Systematically align community needs with available grant opportunities to create data-driven revitalization programs targeting **${formData.targetPopulation || 'existing residents'}** with **${formData.localContribution || 'funding'}** partnership models.

⚖️ ETHICAL CONTEXT: City revitalization research drives community development through strategic planning and responsible resource allocation. This research enables better outcomes for residents while ensuring equitable development that preserves community character and promotes inclusive economic growth.

${strategicContext}

🎯 RESEARCH CONFIGURATION:
This analysis is calibrated for **${investmentScale.toUpperCase()}** project scale with **${timeline}** implementation horizon, **${riskProfile}** risk tolerance, and **${researchTopology}** research methodology.

🎯 PRIMARY RESEARCH OBJECTIVES:
Generate comprehensive revitalization strategy for ${formData.targetLocation || 'target communities'} that demonstrates:
• Quantified community needs in ${formData.focusArea || 'community development'} aligned with ${investmentScale} intervention scope
• Matched funding opportunities with ${formData.targetPopulation || 'target population'} eligibility and ${formData.localContribution || 'funding'} partnership requirements
• Implementation roadmap feasible within ${timeline} execution horizons
• Risk management approach consistent with ${riskProfile} municipal capacity and community expectations
• Evidence-based project design informed by successful peer community best practices

SUCCESS CRITERIA: Transform community development planning into systematic, fundable initiatives that maximize grant capture success while delivering measurable impact to ${formData.targetPopulation || 'target populations'} in ${formData.targetLocation || 'target community'} ${formData.focusArea || 'focus areas'}.

SWARM ASSEMBLY DIRECTIVE:
Assemble specialized city revitalization intelligence team:
• Lead Community Development Strategist - Orchestrate comprehensive revitalization analysis and funding optimization
• Grant Research Specialists - Map federal, state, and foundation funding opportunities aligned with ${formData.focusArea || 'community development'} priorities
• Community Needs Assessment Team - Quantify ${formData.focusArea || 'development'} challenges and opportunities for ${formData.targetPopulation || 'target populations'} in ${formData.targetLocation || 'target communities'}
• Best Practices Research Team - Analyze successful peer community revitalization projects at ${investmentScale} scope with ${timeline} implementation
• Municipal Capacity Analysis Team - Assess ${formData.targetLocation || 'municipal'} institutional capacity and ${formData.localContribution || 'funding'} partnership potential
• Stakeholder Engagement Strategists - Design ${formData.targetPopulation || 'community'} participation frameworks and partnership development
• Implementation Planning Team - Create ${timeline}-sequenced project roadmaps with ${riskProfile} risk management
• Performance Measurement Analysts - Develop success metrics and evaluation frameworks for sustained community impact

RESEARCH METHODOLOGY FRAMEWORK:
**${researchTopology.toUpperCase()} RESEARCH APPROACH**:
${researchTopology === 'hierarchical' ? `• Top-Down Community Assessment: Start with ${formData.targetLocation || 'community'} demographic analysis, narrow to ${formData.focusArea || 'focus area'} specific needs, then identify targeted interventions
• Systematic Funding Alignment: Apply structured filtering from federal programs through state initiatives to local partnership opportunities
• Centralized Grant Strategy: Aggregate all funding sources into unified application strategy with coordinated submission planning` : ''}
${researchTopology === 'byzantine' ? `• Multi-Source Need Validation: Cross-verify community needs across census data, public input, and local government assessments
• Redundant Funding Verification: Use overlapping grant databases and funding announcements to ensure comprehensive opportunity identification
• Consensus Development Strategy: Reconcile competing community priorities through weighted scoring that balances resident input with funding availability` : ''}
${researchTopology === 'federated' ? `• Distributed Stakeholder Analysis: Execute parallel research streams across community needs, funding landscape, regulatory requirements, and implementation capacity
• Autonomous Domain Expertise: Allow each area (housing, infrastructure, economic development, social services) to develop independent assessments
• Collaborative Community Strategy: Synthesize federated findings through cross-sector community development integration` : ''}

EXHAUSTIVE CITY REVITALIZATION RESEARCH REQUIREMENTS:

1. COMMUNITY NEED ASSESSMENT AND QUANTIFICATION
   Comprehensively assess ${formData.focusArea || 'focus area'} development needs in ${formData.targetLocation || 'target communities'} to establish quantified baseline conditions and identify priority intervention areas for ${formData.targetPopulation || 'target population'} benefit:
   
   **${investmentScale.toUpperCase()} PROJECT SCOPE FRAMEWORK**:
   ${investmentScale === 'seed' ? `• Project Investment Range: $50K-$500K for focused pilot programs and demonstration projects
   • Geographic Scope: Targeted intervention in specific ${formData.focusArea || 'focus area'} neighborhoods or districts
   • Impact Metrics: Measurable improvements in specific community indicators with potential for replication` : ''}
   ${investmentScale === 'growth' ? `• Project Investment Range: $500K-$5M for comprehensive ${formData.focusArea || 'focus area'} transformation initiatives
   • Geographic Scope: Multi-neighborhood or city-wide ${formData.focusArea || 'focus area'} development programs
   • Impact Metrics: Significant community transformation with measurable economic and social impact` : ''}
   ${investmentScale === 'enterprise' ? `• Project Investment Range: $5M+ for large-scale ${formData.focusArea || 'focus area'} redevelopment and comprehensive community transformation
   • Geographic Scope: City-wide or regional ${formData.focusArea || 'focus area'} development with multi-jurisdictional coordination
   • Impact Metrics: Transformational community change with regional economic development impact` : ''}
   
   **${(formData.targetPopulation || 'TARGET POPULATION').toUpperCase()} NEEDS ANALYSIS**:
   ${formData.targetPopulation === 'existing' ? `• Population Focus: Current ${formData.targetLocation || 'community'} residents with emphasis on retention and quality of life improvement
   • Need Priorities: Housing preservation, neighborhood stabilization, local business support, and community services enhancement
   • Engagement Strategy: Extensive resident input through surveys, public meetings, and community advisory participation` : ''}
   ${formData.targetPopulation === 'new' ? `• Population Focus: Attract new residents and businesses to ${formData.targetLocation || 'target community'} through ${formData.focusArea || 'focus area'} improvements
   • Need Priorities: Housing development, business attraction, infrastructure modernization, and amenity development
   • Engagement Strategy: Market analysis, regional competitor assessment, and prospective resident/business surveys` : ''}
   ${formData.targetPopulation === 'mixed' ? `• Population Focus: Balance existing resident needs with new resident/business attraction strategies
   • Need Priorities: Integrated approach balancing preservation with growth and development
   • Engagement Strategy: Comprehensive stakeholder engagement including current and prospective community members` : ''}

2. FEDERAL AND STATE FUNDING LANDSCAPE ANALYSIS
   Systematically map available federal and state grant opportunities aligned with ${formData.focusArea || 'focus area'} development needs and ${formData.targetLocation || 'community'} eligibility criteria:
   
   **${(formData.localContribution || 'LOCAL CONTRIBUTION').toUpperCase()} PARTNERSHIP MODEL INTEGRATION**:
   ${formData.localContribution === 'funding' ? `• Local Match Requirements: Identify grants with favorable local match ratios and flexible match source requirements
   • Municipal Capacity: Assess ${formData.targetLocation || 'community'} budget capacity for required local contributions and in-kind match
   • Funding Strategy: Optimize grant portfolio to minimize local cash requirements while maximizing funding capture` : ''}
   ${formData.localContribution === 'land' ? `• Asset Leverage: Utilize ${formData.targetLocation || 'community'} publicly owned land and property as match contribution for development projects
   • Property Assessment: Inventory municipal assets suitable for ${formData.focusArea || 'focus area'} development and grant match requirements
   • Development Strategy: Structure projects to maximize public asset utilization for community benefit` : ''}
   ${formData.localContribution === 'services' ? `• Service Integration: Leverage ${formData.targetLocation || 'community'} municipal services and staff time as in-kind match for grant applications
   • Capacity Assessment: Evaluate municipal department capability to provide required services and program support
   • Partnership Strategy: Coordinate municipal services with grant-funded activities for maximum community impact` : ''}
   
   **${timeline.toUpperCase()} FUNDING ALIGNMENT**:
   ${timeline === 'short-term' ? `• Grant Timeline: Focus on grants with immediate application deadlines and rapid deployment timelines (6-18 months)
   • Implementation Speed: Prioritize funding opportunities supporting quick-start projects with visible community impact
   • Capacity Requirements: Ensure ${formData.targetLocation || 'community'} administrative capacity can manage accelerated project timelines` : ''}
   ${timeline === 'medium-term' ? `• Grant Timeline: Target strategic grants with standard development timelines and comprehensive planning phases (1-5 years)
   • Implementation Planning: Balance thorough planning with reasonable implementation timelines for ${formData.focusArea || 'focus area'} development
   • Capacity Building: Include capacity development components to strengthen long-term project sustainability` : ''}
   ${timeline === 'long-term' ? `• Grant Timeline: Pursue comprehensive funding strategies with multi-phase implementation and long-term sustainability (5+ years)
   • Implementation Vision: Develop transformational ${formData.focusArea || 'focus area'} strategies with sustained community development impact
   • Institutional Development: Build ${formData.targetLocation || 'community'} institutional capacity for ongoing community development leadership` : ''}

3. BEST PRACTICES AND PEER COMMUNITY ANALYSIS
   Research successful ${formData.focusArea || 'focus area'} revitalization projects in peer communities to identify proven strategies, implementation approaches, and measurable outcomes applicable to ${formData.targetLocation || 'target communities'}:
   
   **PEER COMMUNITY SELECTION CRITERIA**:
   • Demographic Similarity: Communities with comparable population size, economic base, and demographic characteristics to ${formData.targetLocation || 'target community'}
   • ${formData.focusArea || 'Focus Area'} Focus: Successful projects specifically addressing similar ${formData.focusArea || 'development'} challenges
   • ${investmentScale} Scope: Projects with comparable investment scale and resource deployment
   • ${formData.targetPopulation || 'Target Population'} Alignment: Initiatives serving similar population demographics and community development objectives

4. LOCAL ASSET AND CAPACITY ASSESSMENT
   Comprehensively assess ${formData.targetLocation || 'community'} existing assets, institutional capacity, and partnership potential to support ${formData.focusArea || 'focus area'} development initiatives:
   
   **MUNICIPAL CAPACITY ANALYSIS**:
   • Administrative Capacity: ${formData.targetLocation || 'Community'} staff expertise, project management capability, and grant administration experience
   • Financial Capacity: Municipal budget analysis, debt capacity, and ability to provide ${formData.localContribution || 'funding'} match requirements
   • Political Capacity: Community leadership support, political stability, and consensus-building capability for ${formData.focusArea || 'focus area'} development

5. GRANT APPLICATION STRATEGY AND PORTFOLIO DEVELOPMENT
   Develop comprehensive grant application strategy with prioritized funding targets, coordinated submission timeline, and maximized success probability:
   
   **${investmentScale.toUpperCase()} PORTFOLIO STRATEGY**:
   ${investmentScale === 'seed' ? `• Grant Mix: 3-5 smaller grants ($50K-$200K) with high success probability and manageable administrative requirements
   • Application Strategy: Focus on straightforward applications with clear eligibility and proven community need
   • Implementation Approach: Pilot project strategy with demonstration value and potential for scaling` : ''}
   ${investmentScale === 'growth' ? `• Grant Mix: 2-4 medium grants ($200K-$2M) with strategic community development impact
   • Application Strategy: Comprehensive applications with strong evidence base and professional development approach
   • Implementation Approach: Multi-phase development with measurable outcomes and sustainability planning` : ''}
   ${investmentScale === 'enterprise' ? `• Grant Mix: 1-3 major grants ($2M+) with transformational community impact potential
   • Application Strategy: Flagship applications with extensive partnerships, professional consultation, and comprehensive planning
   • Implementation Approach: Large-scale transformation with regional impact and long-term sustainability commitment` : ''}

6. IMPLEMENTATION ROADMAP AND SUCCESS METRICS
   **${riskProfile.toUpperCase()}-CALIBRATED IMPLEMENTATION FRAMEWORK**:
   
   ${riskProfile === 'conservative' ? `• Project Selection (40%): Proven interventions with established success records and minimal complexity
   • Implementation Planning (30%): Comprehensive planning with extensive risk mitigation and contingency preparation
   • Community Support (20%): Strong community consensus with broad stakeholder engagement and support
   • Financial Sustainability (10%): Conservative financial planning with diversified funding and minimal financial risk` : ''}
   ${riskProfile === 'moderate' ? `• Community Impact (35%): Balance of innovation with proven effectiveness and reasonable implementation complexity
   • Implementation Feasibility (30%): Realistic project scope with manageable complexity and appropriate resource requirements
   • Partnership Strength (20%): Strong local partnerships with reasonable external collaboration requirements
   • Financial Viability (15%): Balanced financial planning with reasonable risk and sustainable funding approach` : ''}
   ${riskProfile === 'aggressive' ? `• Transformational Potential (40%): High-impact projects with significant community transformation potential
   • Innovation Value (30%): Cutting-edge approaches with potential for significant community advancement
   • Strategic Positioning (20%): Projects positioning ${formData.targetLocation || 'community'} for regional leadership and recognition
   • Long-term Vision (10%): Visionary projects with potential for sustained community transformation` : ''}

DELIVERABLE REQUIREMENTS:

**Executive Summary**: ${investmentScale === 'seed' ? '2-page' : investmentScale === 'growth' ? '3-page' : '5-page'} overview of optimal ${formData.focusArea || 'focus area'} revitalization strategy for ${formData.targetLocation || 'target community'}, calibrated for ${investmentScale} scope, ${timeline} horizon, and ${riskProfile} implementation approach.

**Grant Opportunity Portfolio**: Comprehensive funding strategy including:
• Prioritized grant target list with application timeline and success probability assessment
• ${formData.localContribution || 'Local contribution'} optimization strategy with municipal resource deployment planning
• Application preparation roadmap with required documentation and partnership development
• ${timeline}-sequenced submission strategy with coordinated application management

**Community Development Plan**: Detailed ${formData.focusArea || 'focus area'} revitalization strategy including:
• Evidence-based need assessment with quantitative and qualitative community data
• ${formData.targetPopulation || 'Target population'} engagement strategy with ongoing participation and feedback mechanisms
• Implementation timeline with ${timeline}-appropriate milestones and success metrics
• ${riskProfile}-calibrated risk management and contingency planning

**Best Practices Integration**: Peer community analysis with:
• Successful project case studies applicable to ${formData.targetLocation || 'target community'} ${formData.focusArea || 'focus area'} development
• Implementation strategies adapted for local context and municipal capacity
• Partnership models and funding approaches with demonstrated effectiveness
• Innovation opportunities with appropriate risk assessment and mitigation planning

**Implementation Toolkit**: Practical resources for project execution including:
• Grant application templates customized for ${formData.focusArea || 'focus area'} development projects
• Community engagement protocols designed for ${formData.targetPopulation || 'target population'} participation
• Performance measurement framework with appropriate metrics and reporting systems
• Partnership development strategy with stakeholder engagement and coordination planning

SUCCESS METRICS: Enable stakeholders to maximize grant capture success rate through strategic application portfolio development, implement evidence-based ${formData.focusArea || 'focus area'} revitalization projects with measurable community impact, optimize ${formData.localContribution || 'local contribution'} partnership models for sustainable community development, and build ${formData.targetLocation || 'community'} institutional capacity for ongoing community development leadership.

═══════════════════════════════════════════════════════════════════════════
🏛️ CITY REVITALIZATION CREATIVE DIVERGENCE DIRECTIVES
═══════════════════════════════════════════════════════════════════════════

Generate "phantom community" scenarios: design revitalization projects for community needs that don't exist yet but will emerge from demographic and economic changes in ${formData.targetLocation || 'target communities'}.

Include development disruption thesis: identify which ${formData.focusArea || 'community development'} assumption everyone accepts that should be challenged through innovative revitalization approaches.

Provide future community leader profile: describe the community organization or initiative that will lead ${formData.targetLocation || 'community'} transformation in 2030 through ${formData.focusArea || 'focus area'} excellence.

Output community folklore: create a legend about the ${formData.focusArea || 'community development'} project that "could have been" but funding or political barriers prevented its ${investmentScale} implementation in ${formData.targetLocation || 'target community'}.`;
}

/**
 * Data Center Research Prompt - Comprehensive Geospatial and Regulatory Site Optimization
 */
function formatDataCenterPrompt(formData) {
  const strategicContext = generateStrategicContext(formData);
  
  const investmentScale = formData.investmentScale || 'growth';
  const timeline = formData.timeline || 'medium-term';
  const riskProfile = formData.riskProfile || 'moderate';
  const researchTopology = formData.researchTopology || 'federated';
  
  return `🏢 STRATEGIC DATA CENTER RESEARCH - COMPREHENSIVE GEOSPATIAL AND REGULATORY SITE OPTIMIZATION 🏢

MISSION: Execute comprehensive analysis to identify and evaluate optimal data center site locations in **${formData.targetRegion || 'target regions'}** for **${formData.facilityType || 'hyperscale'}** deployment. Systematically integrate geospatial, regulatory, and infrastructure data to enable rapid site identification and de-risk location strategies for facilities requiring **${formData.latencyRequirement || 'ultra-low'}** performance with disaster risk tolerance level **${formData.disasterRiskTolerance || '2'}**.

⚖️ ETHICAL CONTEXT: Data center infrastructure research drives digital economy growth through strategic site selection and responsible infrastructure development. This research enables better connectivity solutions while ensuring environmental stewardship and community benefit through optimized resource utilization.

${strategicContext}

🎯 RESEARCH CONFIGURATION:
This analysis is calibrated for **${investmentScale.toUpperCase()}** investment scale with **${timeline}** development horizon, **${riskProfile}** risk tolerance, and **${researchTopology}** research methodology.

🎯 PRIMARY RESEARCH OBJECTIVES:
Generate prioritized pipeline of optimal data center sites in ${formData.targetRegion || 'target regions'} that demonstrate:
• Infrastructure readiness appropriate for ${formData.facilityType || 'hyperscale'} deployment at ${investmentScale} scope
• Power availability and cost structure aligned with ${investmentScale} economic requirements
• Connectivity infrastructure supporting ${formData.latencyRequirement || 'ultra-low'} performance specifications
• Environmental and regulatory compliance consistent with disaster risk tolerance level ${formData.disasterRiskTolerance || '2'}
• Development timeline feasibility matching ${timeline} project horizons with ${riskProfile} risk parameters

SUCCESS CRITERIA: Transform months-long manual site selection into efficient, data-driven location strategy enabling proactive site acquisition and development planning for ${formData.facilityType || 'hyperscale'} facilities in ${formData.targetRegion || 'target regions'}.

SWARM ASSEMBLY DIRECTIVE:
Assemble specialized data center site intelligence team:
• Lead Infrastructure Research Strategist - Orchestrate comprehensive geospatial and regulatory analysis
• Power Infrastructure Specialists - Analyze grid capacity and utility partnerships in ${formData.targetRegion || 'target regions'} for ${formData.facilityType || 'hyperscale'} deployment at ${investmentScale} scope
• Connectivity Analysis Team - Map fiber infrastructure and network capabilities supporting ${formData.latencyRequirement || 'ultra-low'} performance requirements
• Environmental Risk Assessment Team - Evaluate disaster risks and compliance aligned with tolerance level ${formData.disasterRiskTolerance || '2'}
• Regulatory and Incentive Intelligence - Analyze zoning, permitting, and economic incentive programs for ${investmentScale} investment optimization
• Geospatial Analysis Team - Conduct site-specific parcel analysis and GIS-enabled location optimization
• Market Intelligence Analysts - Assess competitive dynamics and market positioning for ${investmentScale} market entry
• Development Strategy Team - Design ${timeline}-sequenced site development and acquisition roadmaps

RESEARCH METHODOLOGY FRAMEWORK:
**${researchTopology.toUpperCase()} RESEARCH APPROACH**:
${researchTopology === 'hierarchical' ? `• Top-Down Geographic Analysis: Start with ${formData.targetRegion || 'target region'} macro infrastructure assessment, narrow to optimal sub-markets, then identify specific parcels
• Systematic Infrastructure Layering: Apply structured filtering from power grid capacity through connectivity infrastructure to site-specific characteristics
• Centralized GIS Integration: Aggregate all geospatial datasets into unified analytical framework for consistent site evaluation` : ''}
${researchTopology === 'byzantine' ? `• Multi-Source Infrastructure Verification: Cross-validate power, connectivity, and regulatory data across multiple independent sources
• Redundant Site Assessment: Use overlapping analytical methodologies to ensure robust site identification and risk evaluation
• Consensus Geographic Intelligence: Reconcile conflicting infrastructure data through weighted scoring that accounts for source reliability and currency` : ''}
${researchTopology === 'federated' ? `• Distributed Infrastructure Analysis: Execute parallel research streams across power, connectivity, regulatory, and environmental domains
• Autonomous Geographic Modules: Allow each infrastructure category to develop independent site assessments before integration
• Collaborative Site Synthesis: Combine federated geographic findings through cross-functional spatial analytical integration` : ''}

EXHAUSTIVE DATA CENTER RESEARCH REQUIREMENTS:

1. POWER INFRASTRUCTURE AND GRID CAPACITY ANALYSIS
   Map power availability, cost structures, and grid expansion capacity in ${formData.targetRegion || 'target regions'} to identify optimal electrical infrastructure for ${formData.facilityType || 'hyperscale'} deployment at ${investmentScale} power requirements:
   
   **${(formData.facilityType || 'HYPERSCALE').toUpperCase()} POWER REQUIREMENTS FRAMEWORK**:
   ${formData.facilityType === 'hyperscale' ? `• Power Density: 50-100+ MW capacity requirements with scalable expansion capability
   • Grid Interconnection: Direct transmission-level interconnection (345kV+) with redundant feed capabilities
   • Utility Partnership: Strategic utility relationships with committed capacity allocation and preferential pricing` : ''}
   ${formData.facilityType === 'enterprise' ? `• Power Density: 10-50 MW capacity with enterprise-grade reliability requirements
   • Grid Interconnection: Distribution-level interconnection with utility-grade redundancy and backup systems
   • Utility Partnership: Commercial utility relationships with standard enterprise power procurement agreements` : ''}
   ${formData.facilityType === 'edge' ? `• Power Density: 1-10 MW capacity with distributed deployment scalability
   • Grid Interconnection: Standard commercial interconnection with local grid tie-in capabilities
   • Utility Partnership: Standard commercial utility relationships with competitive rate negotiation` : ''}
   
   **${investmentScale.toUpperCase()} POWER ECONOMICS**:
   ${investmentScale === 'seed' ? `• Target Power Costs: <$0.06/kWh with minimal demand charges and flexible contract terms
   • Infrastructure Investment: Minimize upfront electrical infrastructure costs through existing capacity utilization
   • Utility Incentives: Leverage available utility rebates and incentives for efficient power deployment` : ''}
   ${investmentScale === 'growth' ? `• Target Power Costs: <$0.05/kWh with negotiated demand structures and scalable rate agreements
   • Infrastructure Investment: Balanced infrastructure development with utility-shared costs and expansion capabilities
   • Utility Incentives: Strategic utility partnerships with custom rate structures and development support` : ''}
   ${investmentScale === 'enterprise' ? `• Target Power Costs: <$0.04/kWh with long-term contract pricing and dedicated infrastructure development
   • Infrastructure Investment: Comprehensive electrical infrastructure with utility joint-venture development
   • Utility Incentives: Major economic development incentives with custom utility programs and preferential treatment` : ''}

2. CONNECTIVITY INFRASTRUCTURE AND NETWORK ANALYSIS
   Map fiber optic infrastructure, internet exchange points, and network connectivity capacity in ${formData.targetRegion || 'target regions'} to support ${formData.latencyRequirement || 'ultra-low'} performance for ${formData.facilityType || 'hyperscale'} applications:
   
   **${(formData.latencyRequirement || 'ULTRA-LOW').toUpperCase()} NETWORK PERFORMANCE FRAMEWORK**:
   ${formData.latencyRequirement === 'ultra-low' ? `• Target Latency: <1ms to major population centers and <5ms to regional financial/cloud hubs
   • Fiber Requirements: Direct fiber paths with minimal intermediate routing and premium carrier diversity
   • Network Architecture: Proximity to major IXPs and subsea cable landing stations for global connectivity` : ''}
   ${formData.latencyRequirement === 'low' ? `• Target Latency: <5ms to major population centers and <15ms to regional business hubs
   • Fiber Requirements: High-quality fiber routes with carrier diversity and redundant path options
   • Network Architecture: Access to regional network aggregation points and major carrier presence` : ''}
   ${formData.latencyRequirement === 'standard' ? `• Target Latency: <15ms to major population centers and <30ms to regional connectivity hubs
   • Fiber Requirements: Standard fiber access with commercial carrier options and reasonable diversity
   • Network Architecture: Regional network presence with access to major internet backbones` : ''}
   
   **${(formData.facilityType || 'HYPERSCALE').toUpperCase()} CONNECTIVITY REQUIREMENTS**:
   ${formData.facilityType === 'hyperscale' ? `• Bandwidth Capacity: Multi-terabit capacity with direct peering arrangements and premium connectivity
   • Carrier Diversity: Minimum 4-6 diverse fiber providers with geographically separated entry points
   • Network Ecosystem: Proximity to cloud on-ramps, content delivery networks, and major internet exchanges` : ''}

3. ENVIRONMENTAL RISK AND DISASTER TOLERANCE ASSESSMENT
   Analyze environmental hazards, natural disaster risks, and regulatory constraints in ${formData.targetRegion || 'target regions'} to identify sites meeting disaster risk tolerance level ${formData.disasterRiskTolerance || '2'} for ${formData.facilityType || 'hyperscale'} deployment:
   
   **DISASTER RISK TOLERANCE LEVEL ${formData.disasterRiskTolerance || '2'} FRAMEWORK**:
   ${(formData.disasterRiskTolerance || 2) <= 2 ? `• Environmental Exclusions: Avoid all flood zones, seismic risk areas, and extreme weather patterns
   • Site Selection: Premium locations with minimal natural disaster exposure and maximum environmental stability
   • Risk Mitigation: Comprehensive environmental due diligence with extensive mitigation planning` : ''}
   ${(formData.disasterRiskTolerance || 2) === 3 ? `• Environmental Considerations: Moderate risk areas acceptable with appropriate mitigation and engineering solutions
   • Site Selection: Balanced environmental assessment with manageable risk exposure and mitigation costs
   • Risk Mitigation: Standard environmental assessment with reasonable mitigation and insurance strategies` : ''}
   ${(formData.disasterRiskTolerance || 2) >= 4 ? `• Environmental Acceptance: Higher risk locations acceptable with comprehensive mitigation and operational planning
   • Site Selection: Risk-tolerant approach with focus on cost optimization and engineering solutions
   • Risk Mitigation: Aggressive environmental risk management with innovative mitigation technologies` : ''}
   
   **${riskProfile.toUpperCase()} ENVIRONMENTAL ASSESSMENT**:
   • ${riskProfile.charAt(0).toUpperCase() + riskProfile.slice(1)} Risk Evaluation: ${riskProfile === 'conservative' ? 'Comprehensive environmental due diligence with extensive risk mitigation planning' : riskProfile === 'moderate' ? 'Balanced environmental assessment with reasonable risk mitigation strategies' : 'Risk-tolerant environmental evaluation with innovative mitigation approaches'}

4. REGULATORY AND INCENTIVE LANDSCAPE ANALYSIS
   Map regulatory environment, zoning requirements, and economic incentive programs in ${formData.targetRegion || 'target regions'} to optimize financial structure and development feasibility for ${formData.facilityType || 'hyperscale'} projects:
   
   **${investmentScale.toUpperCase()} INCENTIVE OPTIMIZATION**:
   ${investmentScale === 'seed' ? `• Target Incentives: Sales tax exemptions, property tax abatements, and utility rebates with minimal job creation requirements
   • Regulatory Strategy: Streamlined permitting with standard zoning compliance and minimal regulatory complexity
   • Economic Impact: Demonstrate local economic benefit while managing incentive qualification requirements` : ''}
   ${investmentScale === 'growth' ? `• Target Incentives: Comprehensive incentive packages including property tax abatements, job creation credits, and infrastructure support
   • Regulatory Strategy: Professional regulatory management with systematic permitting and zoning optimization
   • Economic Impact: Significant local economic development with strategic incentive negotiation and long-term commitment` : ''}
   ${investmentScale === 'enterprise' ? `• Target Incentives: Major economic development packages with custom incentive structures, infrastructure investments, and long-term commitments
   • Regulatory Strategy: Comprehensive regulatory strategy with government partnership and streamlined approval processes
   • Economic Impact: Transformative regional economic development with major job creation and long-term community investment` : ''}

5. SITE-SPECIFIC PARCEL ANALYSIS
   Identify specific land parcels in ${formData.targetRegion || 'target regions'} that meet all infrastructure, environmental, and regulatory criteria for ${formData.facilityType || 'hyperscale'} development at ${investmentScale} scope:
   
   **${(formData.facilityType || 'HYPERSCALE').toUpperCase()} SITE REQUIREMENTS**:
   ${formData.facilityType === 'hyperscale' ? `• Minimum Acreage: 100+ acres with expansion capability for campus-style development
   • Zoning Requirements: Industrial or technology park zoning with data center-specific use permissions
   • Infrastructure Access: Direct access to transmission-level power and fiber infrastructure within 1-2 miles` : ''}
   ${formData.facilityType === 'enterprise' ? `• Minimum Acreage: 40-100 acres with flexible development options and expansion capability
   • Zoning Requirements: Industrial, commercial, or mixed-use zoning with technology infrastructure support
   • Infrastructure Access: Reasonable access to distribution-level power and carrier-grade fiber within 2-5 miles` : ''}
   ${formData.facilityType === 'edge' ? `• Minimum Acreage: 5-40 acres with urban/suburban accessibility and flexible zoning options
   • Zoning Requirements: Commercial, light industrial, or mixed-use zoning with minimal restriction complexity
   • Infrastructure Access: Standard commercial power and fiber access within urban/suburban infrastructure networks` : ''}

6. INTEGRATED SITE SCORING AND PRIORITIZATION
   **${investmentScale.toUpperCase()}-CALIBRATED SCORING FRAMEWORK** (weighted for ${riskProfile} and ${timeline}):
   
   ${riskProfile === 'conservative' ? `• Infrastructure Certainty (35%): Proven power and connectivity with established utility relationships
   • Environmental Stability (30%): Low disaster risk with minimal environmental mitigation requirements
   • Regulatory Clarity (25%): Clear permitting pathways with established incentive programs
   • Development Feasibility (10%): Straightforward site preparation with minimal development risk` : ''}
   ${riskProfile === 'moderate' ? `• Infrastructure Quality (30%): Robust power and connectivity with reasonable development requirements
   • Market Positioning (25%): Strategic location with competitive advantages and market access
   • Financial Optimization (25%): Strong incentive programs with favorable total cost structure
   • Operational Efficiency (20%): Site characteristics supporting efficient ${formData.facilityType || 'hyperscale'} operations` : ''}
   ${riskProfile === 'aggressive' ? `• Strategic Value Potential (35%): Market-leading location with significant competitive advantages
   • Infrastructure Innovation (30%): Advanced infrastructure capabilities with future expansion potential
   • Financial Maximization (20%): Premium incentive packages with optimal cost structure
   • Market Transformation (15%): Location positioning for market category leadership and expansion` : ''}

DELIVERABLE REQUIREMENTS:

**Executive Summary**: ${investmentScale === 'seed' ? '2-page' : investmentScale === 'growth' ? '3-page' : '4-page'} overview of optimal ${formData.targetRegion || 'target region'} site opportunities for ${formData.facilityType || 'hyperscale'} deployment, calibrated for ${investmentScale} scale, ${timeline} horizon, and ${riskProfile} risk parameters.

**Site Priority Database**: Comprehensive GIS-enabled database including:
• Complete ${formData.targetRegion || 'target region'} parcel inventory meeting ${formData.facilityType || 'hyperscale'} minimum requirements
• ${riskProfile}-calibrated site scoring with infrastructure, environmental, and regulatory assessment
• ${formData.latencyRequirement || 'Ultra-low'} performance modeling and connectivity analysis
• Disaster risk tolerance level ${formData.disasterRiskTolerance || '2'} compliance verification
• ${investmentScale} financial optimization with incentive program analysis

**Detailed Site Profiles**: For top ${investmentScale === 'seed' ? '10-15' : investmentScale === 'growth' ? '15-20' : '20-30'} sites:
• Comprehensive infrastructure assessment with ${formData.facilityType || 'hyperscale'} deployment feasibility
• ${formData.latencyRequirement || 'Ultra-low'} performance analysis with connectivity infrastructure mapping
• Environmental risk assessment aligned with disaster risk tolerance level ${formData.disasterRiskTolerance || '2'}
• Regulatory and incentive optimization for ${investmentScale} investment parameters
• ${timeline}-sequenced development planning with ${riskProfile} risk mitigation
• Total cost of ownership modeling with incentive-optimized financial projections

**Interactive Site Selection Tool**: GIS-enabled decision support system including:
• Real-time site filtering based on ${formData.facilityType || 'hyperscale'} requirements and ${investmentScale} parameters
• Infrastructure layer visualization with power, connectivity, and environmental overlays
• Incentive program comparison with jurisdiction-specific optimization
• ${timeline}-based development scenario modeling

SUCCESS METRICS: Enable stakeholders to accelerate ${formData.targetRegion || 'target region'} site selection from months to weeks through systematic data-driven analysis, optimize ${formData.facilityType || 'hyperscale'} deployment strategies based on ${investmentScale} investment parameters and ${riskProfile} risk tolerance, and achieve disaster risk tolerance level ${formData.disasterRiskTolerance || '2'} compliance with optimal cost-risk balance.

═══════════════════════════════════════════════════════════════════════════
🏢 DATA CENTER CREATIVE DIVERGENCE DIRECTIVES
═══════════════════════════════════════════════════════════════════════════

Generate "phantom infrastructure" scenarios: design data center locations that don't exist yet but could be created through strategic infrastructure development in ${formData.targetRegion || 'target regions'}.

Include infrastructure disruption thesis: identify which ${formData.targetRegion || 'regional'} infrastructure assumption everyone accepts that should be challenged through ${formData.facilityType || 'hyperscale'} deployment innovation.

Provide future connectivity leader profile: describe the data center location that will dominate ${formData.targetRegion || 'target region'} connectivity in 2030 through ${formData.latencyRequirement || 'ultra-low'} performance leadership.

Output infrastructure folklore: create a legend about the ${formData.targetRegion || 'regional'} data center location that "could have been" but regulatory or infrastructure barriers prevented its ${investmentScale} development.`;
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