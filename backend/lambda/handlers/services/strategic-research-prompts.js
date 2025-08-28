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
  
  return `🏥 STRATEGIC MEDICAL DEVICE RESEARCH - COMPREHENSIVE BENCH-TO-BEDSIDE OPPORTUNITY ASSESSMENT 🏥

MISSION: Execute COMPREHENSIVE medical device innovation analysis to identify and evaluate high-potential opportunities in **${formData.clinicalArea || 'medical device markets'}**. Systematically examine the intersection of clinical need, regulatory feasibility, and commercial viability to de-risk medical device development decisions targeting the **${formData.fdaPathway || '510(k)'}** regulatory pathway for **${formData.careSetting || 'outpatient'}** applications at Technology Readiness Level **${formData.techMaturity || 'TRL 4-6'}**.

⚖️ ETHICAL CONTEXT: Medical device innovation drives improved patient outcomes through evidence-based clinical research and regulatory compliance. This research enables better healthcare solutions while ensuring patient safety through rigorous development pathways.

${strategicContext}

🎯 PRIMARY RESEARCH OBJECTIVES:
• Identify medical device opportunities in ${formData.clinicalArea || 'target clinical areas'} with significant unmet clinical need and clear patient impact in ${formData.careSetting || 'clinical'} settings
• Map regulatory pathway alignment with ${formData.fdaPathway || '510(k)'} requirements and timeline expectations  
• Assess commercial viability through existing or obtainable reimbursement mechanisms for ${formData.careSetting || 'target'} procedures
• Evaluate technology landscape positioning appropriate for TRL ${formData.techMaturity || 'development'} stage development

SWARM ASSEMBLY DIRECTIVE:
Assemble specialized medical device intelligence team:
• Lead Clinical Research Strategist - Orchestrate comprehensive bench-to-bedside analysis
• FDA Regulatory Specialists - Navigate ${formData.fdaPathway || '510(k)'} pathway requirements and precedents
• Clinical Needs Assessment Team - Map unmet needs in ${formData.clinicalArea || 'target areas'} for ${formData.careSetting || 'clinical'} care delivery
• Reimbursement Analysis Team - Analyze economic viability for ${formData.careSetting || 'target'} procedures and device categories
• Technology & Patent Intelligence - Map competitive landscape and IP considerations for TRL ${formData.techMaturity || 'development'} innovations
• Key Opinion Leader Network - Gather insights from practicing ${formData.clinicalArea || 'specialists'} and ${formData.careSetting || 'clinical'} care experts
• Market Intelligence Analysts - Assess competitive dynamics and commercial positioning
• Clinical Trial Strategy Team - Design evidence generation pathways for ${formData.fdaPathway || '510(k)'} submissions

EXHAUSTIVE MEDICAL DEVICE RESEARCH REQUIREMENTS:

1. CLINICAL NEEDS ASSESSMENT - ${formData.clinicalArea?.toUpperCase() || 'TARGET CLINICAL AREA'}
   • COMPLETE mapping of unmet clinical needs in ${formData.clinicalArea || 'target specialty'} with attention to ${formData.careSetting || 'care delivery'} challenges
   • ALL specific clinical gaps identified by practicing ${formData.clinicalArea || 'specialists'} in past 24 months relevant to ${formData.careSetting || 'care delivery'}
   • EVERY patient population in ${formData.clinicalArea || 'target area'} underserved by current device offerings in ${formData.careSetting || 'care'} settings  
   • COMPLETE analysis of primary pain points in current ${formData.careSetting || 'procedural'} approaches leading to complications
   • ALL workflow inefficiencies in ${formData.careSetting || 'clinical'} ${formData.clinicalArea || 'procedures'} that TRL ${formData.techMaturity || 'level'} technology could address
   • EVERY patient advocacy group articulation of unmet needs specific to ${formData.careSetting || 'care delivery'}

2. FDA REGULATORY LANDSCAPE - ${(formData.fdaPathway || '510(k)').toUpperCase()} PATHWAY ANALYSIS
   • ALL ${formData.clinicalArea || 'target area'} devices approved via ${formData.fdaPathway || '510(k)'} pathway in last 36 months for ${formData.careSetting || 'target'} use
   ${formData.fdaPathway === '510k' || formData.fdaPathway === '510(k)' ? `• COMPLETE analysis of predicate devices most commonly cited for substantial equivalence claims in ${formData.clinicalArea || 'target area'} ${formData.careSetting || 'applications'}` : ''}
   ${formData.fdaPathway === 'PMA' ? `• ALL clinical endpoint requirements consistently demanded for ${formData.clinicalArea || 'target area'} PMA submissions targeting ${formData.careSetting || 'target'} use` : ''}
   ${formData.fdaPathway === 'De Novo' ? `• EVERY novel ${formData.clinicalArea || 'target area'} device classification established for ${formData.careSetting || 'applications'} and precedents set` : ''}
   • ALL frequent reasons for ${formData.fdaPathway || '510(k)'} rejections in ${formData.clinicalArea || 'target area'} devices for ${formData.careSetting || 'target'} use
   • COMPLETE assessment of ${formData.careSetting || 'care setting'} use considerations impact on ${formData.fdaPathway || 'regulatory'} review timelines
   • ALL special considerations for ${formData.careSetting || 'care setting'} ${formData.clinicalArea || 'target area'} devices at TRL ${formData.techMaturity || 'development level'}

3. REIMBURSEMENT LANDSCAPE - ${(formData.careSetting || 'CARE SETTING').toUpperCase()} ECONOMIC ANALYSIS  
   • ALL CPT and ICD-10 codes created/modified for ${formData.clinicalArea || 'target area'} procedures in ${formData.careSetting || 'target'} settings (past 5 years)
   • COMPLETE CMS reimbursement rates for relevant ${formData.careSetting || 'care setting'} ${formData.clinicalArea || 'procedural'} codes
   ${formData.careSetting === 'outpatient' ? `• ALL Ambulatory Surgery Center (ASC) payment rate comparisons to physician office reimbursement for ${formData.clinicalArea || 'target'} procedures` : ''}
   ${formData.careSetting === 'inpatient' ? `• COMPLETE DRG payments for ${formData.clinicalArea || 'target'} inpatient procedures and device cost impact on hospital margins` : ''}
   ${formData.careSetting === 'home' ? `• ALL remote patient monitoring and home health CPT codes applying to ${formData.clinicalArea || 'target'} devices with reimbursement rates` : ''}
   • EVERY private payer policy difference from Medicare coverage decisions for ${formData.clinicalArea || 'target'} devices in ${formData.careSetting || 'target'} settings
   • COMPLETE trend analysis of growing/shrinking reimbursement for device-based interventions in ${formData.careSetting || 'target'} ${formData.clinicalArea || 'care'}

4. TECHNOLOGY & PATENT LANDSCAPE - TRL ${(formData.techMaturity || 'DEVELOPMENT').toString().toUpperCase()} INNOVATION MAPPING
   • ALL patent activity concentration in ${formData.clinicalArea || 'target area'} devices for ${formData.careSetting || 'target'} applications
   • EVERY dominant patent holder (companies/institutions) in ${formData.clinicalArea || 'target area'} ${formData.careSetting || 'target'} technologies
   • COMPLETE technology cluster mapping and "white space" opportunities for TRL ${formData.techMaturity || 'level'} innovations
   • ALL technological trends from recent ${formData.clinicalArea || 'target area'} patent filings relevant to ${formData.careSetting || 'target'} use
   • EVERY potential freedom-to-operate concern for ${formData.clinicalArea || 'target area'} devices targeting ${formData.careSetting || 'target'} applications
   • COMPLETE technological sophistication analysis typical for successful ${formData.clinicalArea || 'target area'} devices at TRL ${formData.techMaturity || 'level'}

5. MARKET INTELLIGENCE & COMPETITIVE ANALYSIS
   • ALL dominant players in ${formData.clinicalArea || 'target area'} device markets, particularly for ${formData.careSetting || 'target'} applications
   • EVERY recent M&A transaction indicating ${formData.clinicalArea || 'target area'} market valuations for ${formData.careSetting || 'target'} focused companies
   • COMPLETE emerging company analysis gaining traction with novel ${formData.clinicalArea || 'target area'} approaches in ${formData.careSetting || 'target'} care
   • ALL key differentiating factors for successful ${formData.clinicalArea || 'target area'} device launches in ${formData.careSetting || 'target'} markets
   • EVERY digital health and AI integration effect on traditional ${formData.clinicalArea || 'target area'} device categories for ${formData.careSetting || 'target'} use
   • COMPLETE market entry strategy analysis for TRL ${formData.techMaturity || 'level'} ${formData.clinicalArea || 'target area'} technologies

6. CLINICAL VALIDATION PATHWAY DESIGN
   • ALL required clinical evidence for ${formData.fdaPathway || '510(k)'} submissions in ${formData.clinicalArea || 'target area'}
   • EVERY study design consideration for ${formData.careSetting || 'care setting'} ${formData.clinicalArea || 'applications'}
   • COMPLETE endpoint selection strategy aligned with ${formData.fdaPathway || 'regulatory'} expectations
   • ALL patient population identification requirements for ${formData.clinicalArea || 'target area'} studies
   • EVERY regulatory submission requirement specific to TRL ${formData.techMaturity || 'level'} development stage

7. CONTRARIAN MEDICAL DEVICE SCENARIOS
   • What if the leading ${formData.clinicalArea || 'specialty'} device company disappeared tomorrow?
   • Which "impossible" ${formData.careSetting || 'care'} innovation becomes inevitable in ${formData.clinicalArea || 'target area'}?
   • What taboo assumption about ${formData.clinicalArea || 'clinical'} practice needs challenging?
   • Which extinct medical device category deserves resurrection for ${formData.careSetting || 'modern care'}?
   • What physician behavior change would rewrite ${formData.clinicalArea || 'specialty'} device markets?

DELIVERABLE: Provide EXHAUSTIVE documentation enabling informed medical device investment decisions with:
• Top 5-7 ${formData.clinicalArea || 'target area'} opportunities for ${formData.careSetting || 'care setting'} applications via ${formData.fdaPathway || '510(k)'} pathway
• Clear TRL ${formData.techMaturity || 'development'} stage development timeline and resource requirements
• Risk-adjusted commercial projections for ${formData.clinicalArea || 'target area'} ${formData.careSetting || 'care setting'} applications
• Comprehensive regulatory strategy aligned with ${formData.fdaPathway || '510(k)'} pathway requirements
• Market positioning strategy for ${formData.clinicalArea || 'target area'} competitive landscape

═══════════════════════════════════════════════════════════════════════════
🏥 MEDICAL DEVICE CREATIVE DIVERGENCE DIRECTIVES
═══════════════════════════════════════════════════════════════════════════

Generate "impossible patient" scenarios: design medical devices for patients that don't exist yet but will emerge from demographic/technological changes.

Include regulatory rebellion thesis: identify which FDA requirement everyone accepts that should be challenged for ${formData.careSetting || 'care setting'} ${formData.clinicalArea || 'applications'}.

Provide physician behavior disruption analysis: describe how a breakthrough device would change fundamental ${formData.clinicalArea || 'clinical'} practice patterns.

Output clinical folklore: create a legend about the ${formData.clinicalArea || 'medical'} innovation that "could have been" but regulatory or reimbursement barriers prevented.`;
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