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
 * ⛏️ CRYPTO MINING RESEARCH - Site Selection and Equipment Logistics Intelligence
 * - Mining site selection with power cost optimization and equipment logistics analysis
 * - Power availability, equipment deployment, and regulatory compliance analysis
 * - Total delivered cost modeling and supplier network optimization
 * - Geographic risk assessment and timeline feasibility planning
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

SUCCESS CRITERIA: Reveal hidden clinical patterns and unconventional innovation opportunities that traditional medtech research overlooks, uncovering unmet clinical needs through alternative data sources, novel regulatory pathway insights, and emerging clinical practice evolution that create asymmetric competitive intelligence.

SWARM ASSEMBLY DIRECTIVE:
Assemble specialized medical device intelligence team:
• Lead Clinical Pattern Discovery Specialist - Orchestrate unconventional clinical intelligence and hidden opportunity recognition
• Medical Practice Ethnographers - Conduct field research in ${formData.careSetting || 'clinical'} settings to discover workflow pain points and unmet needs invisible to surveys
• Patient Journey Intelligence Team - Map complete patient experience and care pathway inefficiencies across ${formData.clinicalArea || 'clinical specialty'} treatment episodes
• Alternative Data Clinical Analysts - Mine electronic health records, insurance claims, device failure reports, and patient forums for innovation signals
• Regulatory Pathway Innovation Researchers - Identify emerging FDA guidance, novel predicate device strategies, and accelerated approval opportunities
• Clinical Frustration Point Specialists - Interview healthcare providers to discover daily operational challenges and technology adoption barriers
• Healthcare Economics Anthropologists - Study reimbursement evolution, payer behavior changes, and value-based care transformation patterns
• Medical Device Failure Analysis Team - Investigate device recalls, adverse event reports, and clinical performance gaps creating innovation opportunities
• Emerging Clinical Practice Scouts - Monitor new surgical techniques, diagnostic approaches, and care delivery models requiring device innovation
• Patient Advocacy and Community Intelligence - Analyze patient support groups, online health communities, and advocacy organization priorities

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

7. CLINICAL WORKFLOW ETHNOGRAPHIC INTELLIGENCE
   Deep field research in ${formData.careSetting || 'clinical'} environments to discover hidden pain points and innovation opportunities invisible to traditional research:
   • **${formData.careSetting || 'Clinical'} Setting Observational Research**: Detailed workflow analysis, communication pattern mapping, and efficiency bottleneck identification in real ${formData.clinicalArea || 'clinical'} settings
   • **Healthcare Provider Frustration Point Analysis**: Daily operational challenges, technology adoption barriers, and workflow interruption causes affecting ${formData.clinicalArea || 'clinical specialty'} productivity
   • **Patient Experience Journey Mapping**: Complete patient pathway analysis revealing pain points, anxiety triggers, and care coordination failures across ${formData.careSetting || 'care'} episodes
   • **Clinical Decision-Making Process Investigation**: How physicians actually make treatment decisions, information sources consulted, and decision support tool gaps in ${formData.clinicalArea || 'clinical practice'}
   • **Healthcare Team Communication Analysis**: Interdisciplinary communication patterns, information handoff failures, and collaboration tool inadequacies in ${formData.careSetting || 'clinical'} environments
   • **Time and Motion Study Insights**: Detailed analysis of how healthcare providers actually spend time, identifying automation opportunities and efficiency improvement potential
   • **Technology Integration Failure Patterns**: Why medical devices fail to integrate into workflows, user interface complaints, and adoption resistance factors
   • **Clinical Outcomes Documentation Challenges**: How providers document patient outcomes, quality measure reporting burdens, and data capture inefficiencies

8. ALTERNATIVE DATA CLINICAL INTELLIGENCE MINING
   Systematic analysis of non-traditional data sources revealing unmet clinical needs and innovation opportunities:
   • **Electronic Health Record Pattern Analysis**: Mining EHR data for treatment variation patterns, outcome disparities, and care gap identification in ${formData.clinicalArea || 'clinical specialty'}
   • **Medical Device Recall and Failure Intelligence**: FDA adverse event reports, device recall patterns, and clinical performance gap analysis revealing innovation opportunities
   • **Insurance Claims Data Opportunity Discovery**: Analyzing medical billing patterns, denial trends, and reimbursement challenges revealing device needs and market opportunities
   • **Online Patient Community Sentiment Analysis**: Patient forum discussions, support group conversations, and health social media content revealing unmet needs and frustrations
   • **Medical Literature Sentiment Mining**: Systematic analysis of clinical papers identifying researcher frustrations, technology limitations, and frequently mentioned unmet needs
   • **Patent Landscape Gap Analysis**: Identifying technology white spaces, expired patent opportunities, and competitor innovation blind spots in ${formData.clinicalArea || 'clinical'} devices
   • **Clinical Trial Database Intelligence**: Analyzing ongoing and completed trials for endpoint trends, technology gaps, and emerging biomarker opportunities
   • **Healthcare Purchasing and Procurement Data**: Hospital and clinic purchasing patterns, vendor satisfaction surveys, and procurement challenge identification

9. REGULATORY PATHWAY INNOVATION INTELLIGENCE
   Advanced analysis of FDA regulatory strategy and novel pathway opportunities beyond traditional approaches:
   • **Emerging FDA Guidance and Policy Evolution**: Identifying new regulatory pathways, digital health guidance updates, and accelerated approval opportunities for ${formData.clinicalArea || 'clinical'} devices
   • **Novel Predicate Device Strategy Intelligence**: Creative predicate identification, regulatory precedent analysis, and pathway optimization strategies for ${formData.fdaPathway || '510(k)'} submissions
   • **FDA Staff and Reviewer Insight Analysis**: Understanding FDA reviewer priorities, common submission issues, and regulatory success factor patterns through public documents and guidance
   • **Breakthrough Device Designation Opportunities**: Qualifying criteria analysis, application strategy development, and expedited review pathway optimization
   • **Real-World Evidence Regulatory Strategy**: Utilizing post-market data, patient registries, and real-world outcomes for regulatory decision support and label expansion
   • **International Regulatory Harmonization Intelligence**: CE Mark opportunities, international pathway strategies, and global regulatory sequence optimization
   • **Digital Health and Software Medical Device Pathways**: Understanding AI/ML medical device regulations, digital therapeutics pathways, and software validation requirements
   • **Regulatory Science Collaboration Opportunities**: FDA-industry partnership programs, research collaboration initiatives, and regulatory science advancement projects

10. HEALTHCARE ECONOMICS AND REIMBURSEMENT EVOLUTION RESEARCH
    Comprehensive analysis of payment system changes and value-based care evolution creating device opportunities:
    • **Value-Based Care Transformation Impact**: How payment model changes affect device adoption, outcome measurement requirements, and reimbursement strategy evolution
    • **Patient-Reported Outcome Measure Integration**: PROM development opportunities, patient experience documentation needs, and quality metric reporting requirements
    • **Health Technology Assessment Evolution**: ICER review processes, comparative effectiveness research requirements, and health economic modeling needs for ${formData.clinicalArea || 'clinical'} devices
    • **Payer Coverage Policy Trend Analysis**: Medicare coverage determination patterns, commercial payer policy evolution, and prior authorization requirement impacts
    • **Bundled Payment and Episode-Based Care Implications**: How payment bundling affects device selection, cost management priorities, and outcome optimization incentives
    • **Digital Health Reimbursement Evolution**: Remote patient monitoring payment policies, telehealth integration reimbursement, and virtual care delivery models
    • **Quality Measure and Performance Metric Requirements**: CMS quality reporting requirements, hospital quality scoring impacts, and provider performance measurement needs
    • **Healthcare Affordability and Cost Reduction Pressures**: Device cost optimization requirements, generic device competition threats, and cost-effectiveness demonstration needs

11. PATIENT ADVOCACY AND COMMUNITY INTELLIGENCE
    Deep analysis of patient communities, advocacy organizations, and grassroots healthcare needs identification:
    • **Patient Advocacy Organization Priority Analysis**: Understanding patient advocacy group priorities, funding patterns, and technology support initiatives in ${formData.clinicalArea || 'clinical specialty'}
    • **Patient Support Community Intelligence**: Online patient communities, disease-specific forums, and peer support networks revealing unmet needs and technology preferences
    • **Caregiver Burden and Support Need Analysis**: Family caregiver challenges, support tool requirements, and care coordination needs affecting device development priorities
    • **Health Disparities and Access Gap Research**: Understanding healthcare access barriers, cultural competency needs, and underserved population device requirements
    • **Patient-Reported Quality of Life Improvement Opportunities**: Patient satisfaction survey analysis, quality of life measurement gaps, and patient experience enhancement possibilities
    • **Rare Disease and Orphan Indication Intelligence**: Patient registry analysis, rare disease community needs, and orphan drug/device development opportunities
    • **Patient Safety and Adverse Event Prevention Research**: Patient safety concern analysis, near-miss event patterns, and preventable adverse event reduction opportunities
    • **Health Literacy and Patient Education Enhancement Needs**: Patient education material effectiveness, health literacy barriers, and communication tool improvement opportunities

12. EMERGING CLINICAL PRACTICE AND CARE DELIVERY MODEL RESEARCH
    Analysis of evolving clinical practice patterns and new care delivery models requiring device innovation:
    • **Precision Medicine and Personalized Care Evolution**: Biomarker-guided therapy needs, genetic testing integration requirements, and personalized device therapy opportunities
    • **Minimally Invasive and Ambulatory Care Trends**: Outpatient procedure expansion, same-day discharge protocols, and ambulatory care technology requirements
    • **Remote Patient Monitoring and Telehealth Integration**: Connected device opportunities, remote care delivery needs, and virtual patient management tool requirements
    • **Preventive Care and Early Detection Focus**: Population health screening needs, early intervention opportunities, and preventive care technology requirements
    • **Interdisciplinary Care Team Coordination Needs**: Multi-specialty collaboration tools, care coordinator communication systems, and team-based care support technology
    • **Patient Engagement and Self-Management Support**: Patient activation tools, self-care education technology, and chronic disease management support systems
    • **Aging Population and Geriatric Care Specialization**: Senior-specific device needs, age-related usability requirements, and geriatric care delivery support tools
    • **Mental Health Integration and Behavioral Health Technology**: Mental health screening integration, behavioral intervention tools, and psychological support device opportunities

DELIVERABLE REQUIREMENTS:

**Executive Summary**: ${investmentScale === 'seed' ? '2-page' : investmentScale === 'growth' ? '3-page' : '4-page'} comprehensive intelligence analysis of hidden clinical patterns and unmet needs in ${formData.clinicalArea || 'clinical specialty'} through ${formData.careSetting || 'care setting'} research.

**Clinical Intelligence Database**: Comprehensive research findings including:
• ${formData.clinicalArea || 'Clinical specialty'} workflow ethnographic discoveries and pain point analysis
• Alternative data mining results from EHR patterns, patient communities, and device failure analysis
• ${formData.fdaPathway || '510(k)'} regulatory pathway intelligence and novel predicate opportunities
• Healthcare economics evolution patterns affecting ${formData.careSetting || 'care setting'} delivery models
• Patient advocacy insights and community-driven needs identification
• Emerging clinical practice patterns and care delivery transformation intelligence

**Deep Clinical Research Findings**: For ${investmentScale === 'seed' ? '5-7' : investmentScale === 'growth' ? '7-10' : '10-15'} key research discoveries:
• Ethnographic field research insights from ${formData.careSetting || 'care setting'} environments
• Alternative data intelligence revealing hidden clinical patterns and unmet needs
• Regulatory pathway innovation opportunities and novel FDA strategy insights
• Healthcare economics transformation creating reimbursement and adoption changes
• Patient and provider community intelligence uncovering grassroots needs
• Clinical practice evolution patterns and care delivery model transformation trends

SUCCESS METRICS: Provide comprehensive clinical intelligence that reveals hidden patterns in ${formData.clinicalArea || 'clinical specialty'} research, uncover unconventional innovation opportunities through alternative data analysis, and deliver novel insights into regulatory, economic, and clinical practice evolution that traditional medtech research approaches cannot access.

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

SUCCESS CRITERIA: Reveal hidden market patterns and unconventional consolidation opportunities that traditional PE research overlooks, uncovering alternative data signals that predict seller motivation 6-18 months before companies formally enter the market, and identifying novel ${formData.valueDriver || 'consolidation'} opportunities that create asymmetric competitive advantages.

SWARM ASSEMBLY DIRECTIVE:
Assemble specialized private equity intelligence team:
• Lead Alternative Data Strategist - Orchestrate unconventional market intelligence discovery and pattern recognition
• Industry Disruption Specialists - Map hidden fragmentation patterns and emerging consolidation catalysts in ${formData.targetIndustry || 'target industry'}
• Behavioral Economics Team - Analyze founder psychology, succession planning triggers, and emotional decision-making patterns
• Digital Footprint Intelligence - Mine social media, patent filings, hiring patterns, and operational stress signals for ${formData.sellerMotivation || 'seller motivation'}
• Local Market Ethnographers - Conduct field research in regional markets to discover off-market opportunities and relationship networks
• Regulatory Change Analysts - Identify policy shifts creating consolidation pressure or opportunity windows
• Technology Transition Researchers - Map generational technology adoption creating operational fatigue among ${formData.targetProfile || 'founder-led'} businesses
• Cultural Anthropologists - Study industry culture shifts, generational transitions, and changing business relationship patterns
• Economic Stress Signal Analysts - Detect early warning indicators of financial pressure, succession needs, and capital constraints
• Competitive Intelligence Network - Build comprehensive understanding of competitor acquisition strategies and blind spots

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

1. HIDDEN MARKET PATTERN DISCOVERY AND STRUCTURAL INTELLIGENCE
   Reveal concealed fragmentation dynamics and emerging consolidation catalysts in ${formData.targetIndustry || 'target industry'} that traditional research overlooks, uncovering structural anomalies and opportunity timing signals:
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

6. BEHAVIORAL ECONOMICS AND FOUNDER PSYCHOLOGY RESEARCH
   Deep analysis of ${formData.targetProfile || 'founder-led'} business owner psychology and succession planning triggers revealing unconventional selling motivations:
   • **Generational Transition Patterns**: Analysis of ${formData.targetIndustry || 'target industry'} founder age demographics and retirement planning behaviors
   • **Lifestyle Change Catalysts**: Geographic relocation desires, health considerations, family situation changes affecting business commitment
   • **Operational Fatigue Indicators**: Technology adoption resistance, regulatory compliance burden, staffing challenge stress among ${formData.targetProfile || 'founder'} operators
   • **Legacy and Succession Anxieties**: Family business transition concerns, key employee retention fears, customer relationship continuation worries
   • **Financial Diversification Needs**: Real estate concentration risk, retirement funding gaps, education funding requirements creating liquidity pressure
   • **Peer Network Influence Patterns**: Industry association dynamics, competitor transaction visibility, advisor recommendation patterns affecting selling decisions
   • **Economic Stress Response Behaviors**: How ${formData.targetProfile || 'founder-led'} businesses respond to market downturns, supply chain disruptions, labor shortages
   • **Identity and Purpose Evolution**: Founder motivation changes, philanthropic interests, new venture curiosity affecting business commitment levels

7. DIGITAL FOOTPRINT INTELLIGENCE AND EARLY WARNING SYSTEMS
   Comprehensive analysis of online behavioral patterns and digital signals indicating potential seller readiness:
   • **Social Media Sentiment Analysis**: LinkedIn activity patterns, Facebook business posts, industry forum participation revealing business owner mindset shifts
   • **Professional Network Changes**: Executive recruiter connections, business broker relationships, investment banker interactions, CPA/attorney consultations
   • **Patent and IP Activity Patterns**: Patent application trends, trademark registrations, intellectual property licensing indicating strategic pivots
   • **Hiring and Staffing Signal Detection**: Indeed job postings, LinkedIn recruiting activity, employee turnover patterns suggesting operational transitions
   • **Technology Investment Patterns**: Website updates, software platform changes, equipment purchases indicating modernization efforts or divestment preparation
   • **Marketing and Brand Evolution**: Advertising spend changes, brand messaging shifts, customer communication pattern evolution suggesting strategic realignment
   • **Regulatory Compliance Behaviors**: Permit applications, licensing renewals, environmental compliance filings indicating operational focus areas
   • **Financial Institution Relationships**: Banking relationship changes, credit line modifications, insurance policy adjustments suggesting capital structure evaluation

8. LOCAL MARKET ETHNOGRAPHIC RESEARCH AND RELATIONSHIP MAPPING
   Field research and relationship intelligence in regional markets to discover off-market opportunities and decision-influencer networks:
   • **Community Business Leader Networks**: Chamber of Commerce leadership, Rotary Club participation, charitable board involvement revealing influence relationships
   • **Professional Service Provider Intelligence**: CPA firms, law offices, insurance agents, business consultants serving target companies and their referral patterns
   • **Industry Association and Trade Group Dynamics**: Regional association leadership, trade show participation, professional development engagement levels
   • **Supplier and Customer Relationship Analysis**: Vendor financing arrangements, customer concentration patterns, supply chain partnership evolution
   • **Real Estate and Property Development Connections**: Commercial property ownership, lease arrangement patterns, development project involvement
   • **Family and Personal Relationship Factors**: Spouse business involvement, children career interests, extended family business connections affecting succession planning
   • **Political and Civic Engagement Patterns**: Municipal involvement, political contribution patterns, community leadership roles revealing personal priority evolution
   • **Lifestyle and Recreation Activity Analysis**: Country club memberships, recreational vehicle ownership, vacation property acquisition indicating wealth diversification desires

9. REGULATORY AND POLICY SHIFT OPPORTUNITY INTELLIGENCE
   Analysis of regulatory changes, policy evolution, and compliance pressure creating consolidation catalysts or acquisition timing windows:
   • **Regulatory Burden Escalation Patterns**: Environmental regulations, labor law changes, industry-specific compliance requirements increasing operational complexity
   • **Technology Mandate and Modernization Pressures**: Digital transformation requirements, cybersecurity regulations, data privacy compliance creating investment pressure
   • **Tax Policy and Succession Planning Implications**: Estate tax considerations, depreciation schedule changes, corporate tax rate modifications affecting timing decisions
   • **Industry Licensing and Certification Evolution**: Professional licensing requirements, quality certification mandates, safety standard updates requiring capital investment
   • **International Trade and Tariff Impact Analysis**: Supply chain cost changes, export/import regulation modifications, trade agreement impacts on business models
   • **Government Contract and Procurement Changes**: Public sector purchasing modifications, minority business requirements, local preference policies affecting revenue streams
   • **Labor and Employment Law Evolution**: Minimum wage increases, benefits requirements, workplace safety regulations, union organizing trends affecting cost structures
   • **Environmental and Sustainability Mandate Trends**: Carbon footprint reporting, renewable energy requirements, waste management regulations requiring operational changes

10. COMPETITIVE INTELLIGENCE AND STRATEGIC BLIND SPOT ANALYSIS
    Comprehensive understanding of competitor acquisition strategies and market blind spots creating information asymmetries:
    • **Strategic Buyer Acquisition Pattern Analysis**: Corporate acquirer focus areas, integration capabilities, geographic preferences, deal size limitations
    • **Financial Buyer Competition Mapping**: Private equity firm investment theses, portfolio company priorities, capital deployment schedules, deal sourcing capabilities
    • **Investment Banking and Advisory Relationships**: Transaction history analysis, deal flow patterns, relationship strength assessment, exclusive arrangement identification
    • **Valuation Multiple Evolution and Market Timing**: Historical transaction multiples, seasonal buying patterns, market cycle influences, capital availability impacts
    • **Due Diligence and Integration Capability Assessment**: Acquirer operational strengths, cultural integration success rates, post-acquisition value creation track records
    • **Capital Market and Financing Environment Monitoring**: Debt availability, interest rate sensitivity, equity market conditions, leveraged buyout financing trends
    • **Industry Consolidation Velocity and Saturation Analysis**: Market concentration trends, remaining fragmentation opportunities, optimal timing for platform development
    • **Acquisition Premium and Competitive Bidding Dynamics**: Historical bidding patterns, premium justification factors, competitive tension creation strategies

11. TECHNOLOGY TRANSITION AND GENERATIONAL SHIFT RESEARCH
    Analysis of technological change and generational business transition creating consolidation opportunities:
    • **Digital Transformation Fatigue and Resistance Patterns**: Software adoption challenges, e-commerce implementation struggles, digital marketing competency gaps
    • **Generational Workforce Management Challenges**: Millennial and Gen Z employee expectations, remote work accommodation pressures, benefits and compensation evolution
    • **Legacy System and Infrastructure Modernization Needs**: Equipment replacement requirements, software platform migrations, cybersecurity upgrade necessities
    • **Customer Behavior and Expectation Evolution**: Online purchasing preferences, service delivery expectations, communication channel modifications requiring operational adaptation
    • **Supply Chain and Vendor Relationship Digitization**: Electronic ordering systems, automated payment processing, digital contract management, inventory management modernization
    • **Operational Efficiency and Automation Opportunity Analysis**: Process improvement potential, labor cost reduction opportunities, quality enhancement through technology adoption
    • **Data Analytics and Business Intelligence Capability Gaps**: Performance measurement limitations, customer insight deficiencies, operational optimization opportunities
    • **Succession Planning and Knowledge Transfer Challenges**: Institutional knowledge preservation, skill gap identification, leadership development needs, mentorship program effectiveness

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
🤝 UNCOMMON COALITIONS STRATEGIC PARTNERSHIP ANALYSIS (CONCLUSION MODULE)
═══════════════════════════════════════════════════════════════════════════

**CRITICAL INTEGRATION DIRECTIVE**: Having identified optimal funding strategies and implementation frameworks, now execute EXHAUSTIVE analysis of strategic coalition opportunities that amplify ${formData.focusArea || 'focus area'} revitalization impact through unconventional partnerships and collaborative resource deployment.

7. LIVE COMMUNITY ECOSYSTEM INTELLIGENCE (Real-Time Coalition Opportunity Recognition)
   **${(formData.targetLocation || 'TARGET COMMUNITY').toUpperCase()} PARTNERSHIP ECOSYSTEM MONITORING**:
   • Municipal activity tracking: City council transcripts analysis for upcoming decisions affecting ${formData.focusArea || 'focus area'} development
   • Budget hearing intelligence revealing funding gaps that ${investmentScale}-appropriate coalitions could address
   • Zoning application tracking for development opportunities requiring multi-stakeholder community engagement
   • Permit activity analysis indicating infrastructure or business changes creating partnership windows
   • Policy decision calendars that create ${timeline}-aligned collaboration opportunities
   • **${formData.targetPopulation || 'Target population'}** advocacy organization scheduling and priority alignment analysis

8. COMPREHENSIVE STAKEHOLDER ECOSYSTEM MAPPING
   **${(formData.focusArea || 'FOCUS AREA').toUpperCase()} PARTNERSHIP ACTOR IDENTIFICATION**:
   • Nonprofit event calendars analysis revealing programming gaps and collaboration potential within ${timeline} planning horizons
   • Grant award databases showing recent funding that could support coalition-based ${formData.focusArea || 'focus area'} projects
   • Volunteer organization capacity assessment indicating seasonal activity patterns and available human capital
   • Community foundation priority alignment with ${formData.focusArea || 'focus area'} initiatives and ${formData.localContribution || 'local contribution'} models
   • Faith-based organization outreach programs and social service capacity relevant to ${formData.targetPopulation || 'target population'}
   • Neighborhood association leadership mapping and community organizing capacity for ${investmentScale} engagement

9. BUSINESS AND ECONOMIC COALITION DEVELOPMENT
   **CORPORATE SOCIAL RESPONSIBILITY AND COMMUNITY INVESTMENT ALIGNMENT**:
   • Chamber of Commerce activity analysis and business priority alignment with ${formData.focusArea || 'focus area'} development goals
   • New business registration tracking indicating emerging stakeholders seeking community connection and partnership
   • Commercial development plans requiring public engagement and ${formData.targetPopulation || 'community'} partnership for success
   • Corporate social responsibility initiative matching with ${formData.localContribution || 'resource'} contribution opportunities
   • Local business association engagement potential and networking opportunities within ${timeline} constraints
   • Economic development authority partnerships and incentive programs supporting ${investmentScale} coalition initiatives
   • Professional service firm pro bono capacity and expertise sharing relevant to ${formData.focusArea || 'focus area'} development

10. ACADEMIC AND RESEARCH COALITION INTEGRATION
    **UNIVERSITY AND EDUCATION PARTNERSHIP ECOSYSTEM**:
    • University project databases with student and faculty research aligned with ${formData.focusArea || 'focus area'} development objectives
    • Student organization initiatives providing youth engagement and fresh perspectives on ${formData.targetPopulation || 'community'} challenges
    • Research grant announcements that could support coalition-based ${timeline}-sequenced community projects
    • Faculty expertise mapping for technical assistance and evaluation support relevant to ${investmentScale} implementation
    • Service learning program integration and curriculum alignment with ${formData.focusArea || 'focus area'} needs
    • Community college workforce development and training partnerships supporting ${formData.targetPopulation || 'target population'} advancement
    • K-12 school system engagement and educational support opportunities within ${formData.targetLocation || 'community'} context

11. STRATEGIC PARTNERSHIP DISCOVERY ALGORITHM
    **${(formData.focusArea || 'FOCUS AREA').toUpperCase()} CONVERGENCE OPPORTUNITY MAPPING**:
    • Cross-sector entities addressing same ${formData.focusArea || 'focus area'} challenges from different angles and perspectives
    • Resource complementarity matches where excess organizational capacity meets unmet ${formData.targetPopulation || 'community'} needs
    • Timing alignment opportunities across budget cycles, grant deadlines, and organizational calendars within ${timeline} parameters
    • Shared pain point alliances around common ${formData.targetLocation || 'community'} problems requiring collaborative solutions
    • Geographic proximity advantages and neighborhood-level collaboration potential for ${investmentScale} impact
    • Political alliance building across partisan and organizational boundaries for sustainable ${formData.focusArea || 'focus area'} development
    • Issue-specific coalitions with clear, measurable outcomes aligned with ${formData.targetPopulation || 'target population'} priorities

12. TIMING CONVERGENCE AND COALITION OPPORTUNITY WINDOWS
    **${timeline.toUpperCase()} PARTNERSHIP SYNCHRONIZATION ANALYSIS**:
    ${timeline === 'short-term' ? `• Immediate Coalition Formation: Crisis response opportunities and urgent ${formData.focusArea || 'focus area'} needs requiring rapid stakeholder coordination
    • Grant application deadlines supporting joint proposals and collaborative funding within 6-18 month timeframes
    • Municipal decision calendars and policy windows creating immediate partnership incentives and opportunities` : ''}
    ${timeline === 'medium-term' ? `• Strategic Partnership Development: Systematic relationship building and collaborative program development over 1-3 year horizons
    • Budget cycle synchronization across city, nonprofits, and business planning periods for sustained resource commitment
    • Infrastructure project timelines creating medium-term partnership needs and coordination opportunities` : ''}
    ${timeline === 'long-term' ? `• Transformational Coalition Building: Comprehensive partnership ecosystems and institutional development over 3+ year commitments
    • Secular community development trends requiring sustained multi-stakeholder collaboration and resource deployment
    • Policy and regulatory evolution creating long-term partnership frameworks and collaborative governance structures` : ''}
    • Seasonal events and community celebrations that could host collaborative programming and partnership development
    • Election cycles and political transition periods affecting policy priorities and coalition formation opportunities
    • Crisis response protocols requiring rapid coalition formation and resource mobilization for ${formData.focusArea || 'focus area'} resilience

13. RESOURCE COMPLEMENTARITY AND STRATEGIC VALUE EXCHANGE
    **${(formData.localContribution || 'LOCAL CONTRIBUTION').toUpperCase()} PARTNERSHIP OPTIMIZATION**:
    ${formData.localContribution === 'funding' ? `• Financial Resource Coordination: Municipal budget capacity + nonprofit grant funding + corporate sponsorship integration
    • Capital Investment Partnerships: Public investment + private sector development + community foundation support coordination
    • Revenue Generation Collaborations: Fee-for-service partnerships + grant-funded programming + earned revenue optimization` : ''}
    ${formData.localContribution === 'land' ? `• Asset-Based Partnerships: Public land + private development + nonprofit programming + community stewardship integration
    • Property Development Coalitions: Municipal assets + developer expertise + community input + institutional anchor partnerships
    • Space-Sharing Collaborations: Underutilized public facilities + nonprofit programming + community engagement + private sector support` : ''}
    ${formData.localContribution === 'services' ? `• Service Integration Partnerships: Municipal services + nonprofit expertise + volunteer capacity + private sector efficiency
    • Capacity Building Coalitions: Public sector stability + nonprofit innovation + academic research + business process improvement
    • Human Capital Collaborations: Government staff + nonprofit specialists + community volunteers + private sector mentorship` : ''}
    • **Strategic Resource Matching Examples**:
      - Empty municipal buildings + youth organizations needing venues + corporate sponsors + university research projects
      - City transportation needs + local business customer access + nonprofit workforce development + academic urban planning
      - Municipal waste management + environmental nonprofits + business sustainability initiatives + community education programs

14. COALITION BLUEPRINT DEVELOPMENT AND GOVERNANCE FRAMEWORKS
    **${investmentScale.toUpperCase()} PARTNERSHIP STRUCTURE OPTIMIZATION**:
    ${investmentScale === 'seed' ? `• Small Coalition Management: 3-5 core stakeholders with clear role definition and minimal bureaucratic overhead
    • Resource Contribution Framework: Modest financial commitments + in-kind service sharing + volunteer coordination
    • Decision-Making Process: Consensus-based with informal communication and flexible implementation protocols` : ''}
    ${investmentScale === 'growth' ? `• Medium Coalition Coordination: 6-10 stakeholders with professional management and systematic governance structures
    • Resource Mobilization Strategy: Significant funding coordination + professional service contributions + institutional capacity sharing
    • Governance Framework: Formal decision-making protocols + accountability systems + professional development support` : ''}
    ${investmentScale === 'enterprise' ? `• Large Coalition Architecture: 10+ stakeholders with comprehensive governance + professional staff + institutional partnerships
    • Resource Deployment Systems: Major funding coordination + comprehensive service integration + institutional capacity building
    • Strategic Management Framework: Board governance + executive leadership + professional evaluation + community accountability` : ''}
    • **Partnership Success Metrics and Accountability Frameworks**:
      - Short-term indicators (0-6 months): Partner engagement levels + resource mobilization + initial collaborative activities
      - Medium-term outcomes (6-18 months): Project completion + community feedback + relationship strengthening + capacity building
      - Long-term impact (18+ months): Sustainable partnerships + systemic change + replication potential + institutional development

15. UNCONVENTIONAL COALITION SCENARIOS AND INNOVATION PARTNERSHIPS
    **CREATIVE COLLABORATION OPPORTUNITIES BEYOND TRADITIONAL BOUNDARIES**:
    • **Shared Pain Point Alliances**: Traffic safety coalitions (insurance companies + bike shops + senior centers + schools + municipal traffic department)
    • **Resource Complementarity Innovations**: Empty lot development (community land trust + youth programs + corporate sponsors + university urban planning + environmental nonprofits)
    • **Timing Convergence Catalysts**: Budget hearing coordination (municipal budget cycle + grant deadlines + infrastructure projects + election cycle planning)
    • **Crisis Response Transformations**: Emergency preparedness (natural disaster response + economic disruption planning + social challenge coordination + community resilience building)
    • **Celebration Amplification Strategies**: Community events (cultural programming + business promotion + educational initiatives + civic engagement + tourism development)
    • **Development Partnership Innovations**: Housing initiatives (affordable housing developers + local business workforce + training institutions + transportation planning + childcare provision)

16. MULTI-STAKEHOLDER ENGAGEMENT STRATEGIES AND IMPLEMENTATION PROTOCOLS
    **${riskProfile.toUpperCase()}-CALIBRATED COALITION ENGAGEMENT FRAMEWORK**:
    ${riskProfile === 'conservative' ? `• Established Partnership Approaches: Proven collaboration models with minimal organizational risk and clear success precedents
    • Traditional Stakeholder Engagement: Formal municipal processes + established nonprofit partnerships + conventional business involvement
    • Risk Mitigation Focus: Comprehensive planning + extensive stakeholder buy-in + proven implementation models + conservative timeline expectations` : ''}
    ${riskProfile === 'moderate' ? `• Balanced Innovation Strategies: Proven approaches enhanced with strategic innovations and calculated partnership experiments
    • Multi-Sector Coordination: Strategic municipal engagement + innovative nonprofit collaboration + creative business involvement + academic research integration
    • Managed Risk Taking: Strategic innovation + stakeholder consensus building + pilot project validation + scalable implementation planning` : ''}
    ${riskProfile === 'aggressive' ? `• Transformational Partnership Models: Cutting-edge collaboration structures with breakthrough potential and calculated strategic risks
    • Disruptive Stakeholder Coordination: Innovative municipal engagement + experimental nonprofit partnerships + unconventional business alliances + groundbreaking academic collaboration
    • Strategic Risk Tolerance: Breakthrough innovation + rapid prototype implementation + transformational change acceptance + visionary leadership development` : ''}

17. IMPACT MEASUREMENT AND PARTNERSHIP SUCCESS TRACKING
    **${(formData.focusArea || 'FOCUS AREA').toUpperCase()} COALITION EFFECTIVENESS METRICS**:
    • **Collective Impact Indicators**: Quantifiable ${formData.focusArea || 'focus area'} improvements through coordinated partnership activities
    • **Partnership Strength Metrics**: Stakeholder engagement sustainability + resource contribution consistency + collaborative decision-making effectiveness
    • **Community Satisfaction Assessment**: ${formData.targetPopulation || 'Target population'} feedback + broader community support + stakeholder retention measurement
    • **Social Return on Investment**: Economic impact calculation for ${formData.localContribution || 'resource'} deployment through partnership leverage
    • **Institutional Change Documentation**: Policy influence + system improvements + collaborative governance development + replication potential analysis
    • **Long-term Sustainability Evaluation**: Partnership durability + resource security + leadership development + community ownership + scaling opportunities

18. POLITICAL DYNAMICS AND POLICY INTEGRATION THROUGH COALITION BUILDING
    **${(formData.targetLocation || 'TARGET COMMUNITY').toUpperCase()} GOVERNANCE PARTNERSHIP STRATEGIES**:
    • Municipal authority engagement through coalition advocacy and policy development collaboration within ${timeline} political cycles
    • Elected official relationship building through coalition endorsement and community impact demonstration aligned with ${investmentScale} visibility
    • Staff-level partnerships with city departments through coalition resource sharing and collaborative program implementation
    • Public meeting engagement through coalition representation and community input amplification for ${formData.focusArea || 'focus area'} priorities
    • Policy development collaboration through coalition expertise and implementation partnership for sustainable ${formData.targetPopulation || 'community'} benefit
    • Regulatory advocacy through coalition influence and collaborative compliance support for ${formData.focusArea || 'focus area'} development
    • Intergovernmental coordination through coalition bridge-building across municipal boundaries and jurisdictional collaboration

**UNCOMMON COALITIONS DELIVERABLE INTEGRATION**:

**Coalition Partnership Matrix**: Comprehensive database including:
• Complete ${formData.targetLocation || 'community'} stakeholder ecosystem with partnership potential assessment and contact strategies
• Resource complementarity analysis showing specific value exchanges and collaborative opportunities within ${timeline} constraints
• Timing strategy maps with critical dates, decision points, and momentum-building milestones for ${formData.focusArea || 'focus area'} development
• Political dynamics assessment with municipal engagement strategies and policy integration pathways
• **${investmentScale}-Calibrated Partnership Portfolios**: Specific coalition configurations optimized for resource availability and impact potential

**Strategic Coalition Blueprints**: For top ${investmentScale === 'seed' ? '5-7' : investmentScale === 'growth' ? '7-10' : '10-15'} partnership opportunities:
• Complete stakeholder analysis with specific contact strategies and relationship-building pathways for each potential partner
• Resource mobilization strategies aligned with ${formData.localContribution || 'local contribution'} capacity and ${timeline} deployment schedules
• Governance frameworks appropriate for ${investmentScale} complexity and ${riskProfile} management preferences
• Impact measurement systems with accountability structures and community feedback mechanisms
• Implementation roadmaps with milestone tracking and partnership development sequences
• Risk mitigation strategies and contingency planning for partnership challenges and stakeholder changes

**Community Coalition Catalyst Scenarios**: Innovation partnership models including:
• Cross-sector collaboration designs connecting sectors not traditionally aligned (funeral homes + youth programs for grief counseling; libraries + small business + workforce development)
• Celebration amplification strategies where existing community events become comprehensive collaboration catalysts and partnership development opportunities
• Crisis-to-catalyst transformation frameworks where community challenges become systematic partnership opportunities and resilience building initiatives
• Technology-enabled collaboration platforms connecting stakeholders who wouldn't naturally interact but share ${formData.focusArea || 'focus area'} interests
• Regional coordination strategies addressing ${formData.focusArea || 'focus area'} challenges through multi-jurisdictional partnership development and resource sharing

═══════════════════════════════════════════════════════════════════════════
🏛️ CITY REVITALIZATION CREATIVE DIVERGENCE DIRECTIVES
═══════════════════════════════════════════════════════════════════════════

Generate "phantom community" scenarios: design revitalization projects for community needs that don't exist yet but will emerge from demographic and economic changes in ${formData.targetLocation || 'target communities'}.

Include development disruption thesis: identify which ${formData.focusArea || 'community development'} assumption everyone accepts that should be challenged through innovative revitalization approaches.

Provide future community leader profile: describe the community organization or initiative that will lead ${formData.targetLocation || 'community'} transformation in 2030 through ${formData.focusArea || 'focus area'} excellence.

Output community folklore: create a legend about the ${formData.focusArea || 'community development'} project that "could have been" but funding or political barriers prevented its ${investmentScale} implementation in ${formData.targetLocation || 'target community'}.`;
}

/**
 * Crypto Mining Research Prompt - Comprehensive Site Selection and Equipment Logistics Optimization
 */
function formatCryptoMiningPrompt(formData) {
  const strategicContext = generateStrategicContext(formData);
  
  const investmentScale = formData.investmentScale || 'growth';
  const timeline = formData.timeline || 'medium-term';
  const riskProfile = formData.riskProfile || 'moderate';
  const researchTopology = formData.researchTopology || 'federated';
  
  return `⛏️ STRATEGIC CRYPTO MINING RESEARCH - COMPREHENSIVE SITE SELECTION AND EQUIPMENT LOGISTICS OPTIMIZATION ⛏️

MISSION: Execute comprehensive analysis to identify optimal crypto mining site locations globally with complete technical and economic documentation. Systematically integrate power costs, equipment logistics, and regulatory constraints to enable rapid site selection and de-risk mining operations for **${formData.budgetRange || '$1M-$10M'}** investment with **${formData.powerCapacity || '5-20 MW'}** capacity requirements within **${formData.timeline || 'standard development'}** timeline and **${formData.geographicRiskTolerance || 'US + Canada'}** risk parameters, considering **${formData.equipmentSituation || 'need to buy everything'}** logistics constraints.

⚖️ ETHICAL CONTEXT: Crypto mining site selection is fundamental business activity focused on optimizing energy costs and operational efficiency. This research enables finding the most cost-effective and stable power sources globally while supporting renewable energy development through demand for excess capacity, creating jobs in underutilized regions, and following all applicable regulations.

${strategicContext}

🎯 RESEARCH CONFIGURATION:
This analysis is calibrated for **${investmentScale.toUpperCase()}** investment scale with **${timeline}** development horizon, **${riskProfile}** risk tolerance, and **${researchTopology}** research methodology.

🚨 CRITICAL DIRECTIVE: EQUIPMENT LOGISTICS AS PRIMARY CONSTRAINT 🚨
Equipment logistics represents 35% of location decision matrix because $100K+ shipping premiums can completely negate power cost advantages. This research must balance ultra-cheap power against equipment deployment reality for **${formData.equipmentSituation || 'need to buy everything'}** scenarios.

🎯 PRIMARY RESEARCH OBJECTIVES:
Generate prioritized pipeline of optimal mining sites globally that demonstrate:
• Power costs at or below **${formData.maxPowerRate || '4'}** cents/kWh with viable ${formData.equipmentSituation || 'equipment'} logistics
• Infrastructure readiness for **${formData.powerCapacity || '5-20 MW'}** deployment at ${investmentScale} scope
• Equipment deployment feasibility within **${formData.timeline || 'standard'}** timeline constraints
• Geographic risk profile aligned with **${formData.geographicRiskTolerance || 'US + Canada'}** tolerance
• Total delivered economics including power + equipment + logistics + regulatory costs

SUCCESS CRITERIA: Reveal hidden global mining site patterns and unconventional power arbitrage opportunities that traditional mining research overlooks, uncovering equipment logistics realities, alternative data signals for site evaluation, and novel geographic intelligence that creates asymmetric competitive advantages in mining location selection.

SWARM ASSEMBLY DIRECTIVE:
Assemble specialized crypto mining site intelligence team:
• Lead Mining Location Strategist - Orchestrate comprehensive site selection and equipment logistics analysis
• Global Power Market Analysts - Map power costs under **${formData.maxPowerRate || '4'}** cents/kWh with ${formData.powerCapacity || '5-20 MW'} availability
• Equipment Logistics Specialists - Analyze ASIC shipping, customs, and supplier networks for ${formData.equipmentSituation || 'equipment'} scenarios
• Mining Equipment Ecosystem Team - Map supplier networks, delivery infrastructure, and maintenance capabilities
• Regulatory Compliance Team - Analyze crypto mining laws and equipment import requirements by ${formData.geographicRiskTolerance || 'geographic'} zone
• Infrastructure Assessment Team - Evaluate grid capacity, cooling requirements, and facility development needs
• Financial Analysis Team - Model total delivered costs including equipment logistics premiums
• Risk Assessment Team - Evaluate operational, regulatory, and equipment deployment risks

RESEARCH METHODOLOGY FRAMEWORK:
**${researchTopology.toUpperCase()} RESEARCH APPROACH**:
${researchTopology === 'hierarchical' ? `• Top-Down Mining Analysis: Start with global power cost mapping, narrow to ${formData.geographicRiskTolerance || 'geographic'} zones, then filter by equipment logistics feasibility
• Systematic Cost Layering: Apply structured filtering from power rates through equipment costs to total delivered economics
• Centralized Mining Intelligence: Aggregate all data sources into unified analytical framework for consistent site evaluation` : ''}
${researchTopology === 'byzantine' ? `• Multi-Source Power Verification: Cross-validate power costs and availability across multiple independent utility and market sources
• Redundant Equipment Analysis: Use overlapping equipment logistics assessments to ensure robust deployment feasibility analysis
• Consensus Mining Intelligence: Reconcile conflicting cost and logistics data through weighted scoring accounting for source reliability` : ''}
${researchTopology === 'federated' ? `• Distributed Mining Analysis: Execute parallel research streams across power markets, equipment logistics, regulatory, and infrastructure domains
• Autonomous Domain Modules: Allow each specialty area to develop independent assessments before cross-functional integration
• Collaborative Mining Synthesis: Combine federated findings through comprehensive mining site evaluation framework` : ''}

EXHAUSTIVE CRYPTO MINING RESEARCH REQUIREMENTS:

1. POWER COST AND AVAILABILITY ANALYSIS (Primary Filter: ${formData.maxPowerRate || '4'} cents/kWh maximum)
   Map global power markets with industrial electricity rates at or below **${formData.maxPowerRate || '4'} cents/kWh** and grid capacity for **${formData.powerCapacity || '5-20 MW'}** mining operations:
   
   **${(formData.powerCapacity || '5-20 MW').toUpperCase()} POWER REQUIREMENTS FRAMEWORK**:
   ${formData.powerCapacity === '1-5 MW' ? `• Grid Requirements: Existing substations and data center co-location opportunities with immediate availability
   • Utility Relationships: Standard commercial power agreements with competitive industrial rates
   • Infrastructure Needs: Minimal additional electrical infrastructure development required` : ''}
   ${formData.powerCapacity === '5-20 MW' ? `• Grid Requirements: Dedicated transformer installations and medium industrial site electrical infrastructure
   • Utility Relationships: Direct utility partnerships with volume discount negotiations
   • Infrastructure Needs: Moderate electrical infrastructure investment and utility coordination` : ''}
   ${formData.powerCapacity === '20-50 MW' ? `• Grid Requirements: Direct utility partnerships and large industrial development electrical capacity
   • Utility Relationships: Strategic utility agreements with dedicated infrastructure development
   • Infrastructure Needs: Substantial electrical infrastructure investment and custom utility arrangements` : ''}
   ${formData.powerCapacity === '50+ MW' ? `• Grid Requirements: Custom substation development and utility-scale electrical agreements
   • Utility Relationships: Major utility partnerships with enterprise-level power procurement
   • Infrastructure Needs: Comprehensive electrical infrastructure with utility joint-venture development` : ''}
   
   **${investmentScale.toUpperCase()} POWER ECONOMICS**:
   ${investmentScale === 'seed' ? `• Target Power Costs: Absolute minimum rates with flexible contract terms under ${formData.maxPowerRate || '4'} cents/kWh
   • Contract Strategy: Short-term agreements with minimal commitments suitable for ${formData.budgetRange || 'seed'} scale
   • Infrastructure Investment: Utilize existing capacity to minimize upfront electrical development costs` : ''}
   ${investmentScale === 'growth' ? `• Target Power Costs: Competitive industrial rates with volume discounts maximizing ${formData.budgetRange || 'growth'} economics
   • Contract Strategy: Medium-term agreements with scalable capacity and expansion options
   • Infrastructure Investment: Balanced electrical infrastructure development with utility cost-sharing arrangements` : ''}
   ${investmentScale === 'enterprise' ? `• Target Power Costs: Wholesale power rates with long-term contract pricing and dedicated infrastructure
   • Contract Strategy: Long-term power agreements with custom rate structures and capacity commitments
   • Infrastructure Investment: Comprehensive electrical infrastructure with utility partnership development` : ''}

2. EQUIPMENT LOGISTICS AND SUPPLIER ECOSYSTEM ANALYSIS (Critical 35% Decision Factor)
   Comprehensive analysis of equipment procurement, shipping, and deployment logistics based on **${formData.equipmentSituation || 'need to buy everything'}** scenario:
   
   **${(formData.equipmentSituation || 'NEED TO BUY EVERYTHING').toUpperCase()} LOGISTICS FRAMEWORK**:
   ${formData.equipmentSituation === 'already own equipment' ? `• Logistics Focus: Transportation costs from current location to optimal mining sites
   • Location Flexibility: Maximum geographic flexibility including remote cheap power locations
   • Timeline Optimization: Rapid deployment focused on site preparation and equipment transport logistics
   • Cost Components: Transport costs, site setup, installation, and operational infrastructure` : ''}
   ${formData.equipmentSituation === 'need to buy everything' ? `• Logistics Focus: ASIC procurement + international shipping + customs + local delivery + installation
   • Location Prioritization: Established mining hubs and supplier networks strongly preferred (Texas, Washington)
   • Timeline Planning: 2-6 month equipment procurement and shipping timelines integrated into deployment
   • Cost Components: Equipment purchase + shipping + customs duties + installation + supplier network access` : ''}
   ${formData.equipmentSituation === 'want turnkey solution' ? `• Logistics Focus: Hosted mining with pre-installed equipment and operational infrastructure
   • Location Limitation: Existing mining facilities with immediate deployment capability only
   • Timeline Acceleration: Immediate deployment eliminating all equipment logistics complexity
   • Cost Components: All-inclusive hosting fees with equipment rental and operational services` : ''}
   
   **EQUIPMENT ECOSYSTEM MAPPING BY LOCATION**:
   • **ESTABLISHED MINING HUBS** (Optimal for "need to buy everything"):
     - Texas (Dallas/Houston): Comprehensive supplier networks, equipment distributors, local contractors
     - Washington State: Existing mining facilities, hydropower access, equipment availability
     - Wyoming/North Dakota: Developing supplier networks, lower equipment availability but cheap power
   • **INTERNATIONAL LOCATIONS** (Equipment logistics challenges):
     - Kazakhstan: Very limited supplier networks, months-long equipment shipping, high customs complexity
     - Paraguay: Minimal equipment infrastructure, significant shipping and logistics premiums
     - Iceland: High equipment import costs, everything must be imported, limited local suppliers
   
   **${timeline.toUpperCase()} EQUIPMENT DEPLOYMENT TIMELINE**:
   ${timeline === 'short-term' ? `• Equipment Procurement: Focus on immediately available equipment and existing facility rental options
   • Shipping Priority: Air freight and expedited shipping for critical path equipment deployment
   • Installation Speed: Plug-and-play solutions and turnkey facilities to meet aggressive timeline requirements` : ''}
   ${timeline === 'medium-term' ? `• Equipment Procurement: Standard procurement timelines with volume purchasing and supplier negotiations
   • Shipping Strategy: Balanced approach between cost and speed with ocean and ground transport optimization
   • Installation Planning: Systematic installation with professional contractors and infrastructure development` : ''}
   ${timeline === 'long-term' ? `• Equipment Procurement: Comprehensive equipment planning with volume discounts and custom configurations
   • Shipping Optimization: Cost-optimized shipping with bulk consolidation and strategic timing
   • Installation Strategy: Complete facility development with custom infrastructure and long-term optimization` : ''}

3. GEOGRAPHIC RISK AND REGULATORY COMPLIANCE ANALYSIS
   Analyze regulatory environments and import procedures within **${formData.geographicRiskTolerance || 'US + Canada'}** risk parameters:
   
   **${(formData.geographicRiskTolerance || 'US + CANADA').toUpperCase()} REGULATORY FRAMEWORK**:
   ${formData.geographicRiskTolerance === 'US only' ? `• Regulatory Scope: US federal and state crypto mining regulations and equipment standards
   • Equipment Compliance: CONUS shipping, electrical safety standards, and local installation requirements
   • Risk Profile: Maximum regulatory stability with established legal frameworks and banking access
   • Operational Advantages: US supplier networks, English language, established mining infrastructure` : ''}
   ${formData.geographicRiskTolerance === 'US + Canada' ? `• Regulatory Scope: US and Canadian mining regulations with cross-border equipment movement procedures
   • Equipment Compliance: North American electrical standards with reasonable customs procedures
   • Risk Profile: Stable regulatory environment with competitive power rates (Quebec hydro, Alberta gas)
   • Operational Advantages: NAFTA equipment movement, similar legal systems, established mining presence` : ''}
   ${formData.geographicRiskTolerance === 'include international' ? `• Regulatory Scope: Global crypto mining legal analysis with complex equipment import procedures
   • Equipment Compliance: International electrical standards, complex customs procedures, import duties
   • Risk Profile: Higher regulatory uncertainty balanced against potential power cost advantages
   • Operational Challenges: Equipment import delays, foreign legal systems, currency and banking risks` : ''}
   
   **EQUIPMENT IMPORT AND CUSTOMS ANALYSIS**:
   • Electrical equipment safety certifications and compliance requirements by jurisdiction
   • Import duties and customs procedures for mining equipment (ASICs, transformers, cooling systems)
   • Timeline implications of customs clearance and regulatory approval processes
   • Banking and payment procedures for international equipment procurement

4. TOTAL DELIVERED COST MODELING (Power + Equipment + Logistics + Regulatory)
   Comprehensive cost analysis integrating all factors for **${formData.budgetRange || '$1M-$10M'}** investment scale:
   
   **${(formData.budgetRange || '$1M-$10M').toUpperCase()} INVESTMENT FRAMEWORK**:
   ${formData.budgetRange === 'under $1M' ? `• Scale Focus: Small-scale operations, co-location opportunities, plug-and-play solutions
   • Equipment Strategy: Used equipment markets, leasing arrangements, turnkey hosting solutions
   • Cost Optimization: Minimize upfront equipment logistics costs through existing facility utilization` : ''}
   ${formData.budgetRange === '$1M-$10M' ? `• Scale Focus: Standard facility development with moderate infrastructure investment
   • Equipment Strategy: New equipment procurement with standard supplier relationships
   • Cost Balance: Balance equipment costs with infrastructure development and logistics optimization` : ''}
   ${formData.budgetRange === '$10M-$50M' ? `• Scale Focus: Custom facilities with dedicated infrastructure and utility partnerships
   • Equipment Strategy: Volume equipment procurement with supplier negotiations and bulk shipping
   • Cost Leverage: Economies of scale in both equipment procurement and infrastructure development` : ''}
   ${formData.budgetRange === '$50M+' ? `• Scale Focus: Enterprise-scale greenfield development and multi-site operations
   • Equipment Strategy: Strategic supplier partnerships with custom configurations and direct factory relationships
   • Cost Optimization: Maximum economies of scale with comprehensive supplier and logistics optimization` : ''}
   
   **LOCATION-SPECIFIC COST MODELING**:
   • Power costs at ${formData.maxPowerRate || '4'} cents/kWh with volume discounts and long-term agreements
   • Equipment logistics costs: ASIC shipping, customs duties, local delivery, and installation
   • Infrastructure development costs: electrical, cooling, facility, and operational setup
   • Regulatory compliance costs: permits, licenses, legal, and ongoing compliance requirements
   • **Total Delivered Economics**: All-in cost per MW deployed including power, equipment, and operational costs

5. SITE-SPECIFIC OPPORTUNITY IDENTIFICATION AND PRIORITIZATION
   Identify specific locations meeting all power, equipment, geographic, and budget constraints:
   
   **OPTIMAL LOCATION MATRIX** (Power + Equipment Logistics Balance):
   • **Texas Mining Hubs**: 3-4¢/kWh power + excellent equipment suppliers + established infrastructure
   • **Washington State**: 2-3¢/kWh hydro power + existing mining facilities + good equipment access
   • **Quebec (if Canada included)**: 2-3¢/kWh hydro + reasonable equipment shipping + stable regulations
   • **Wyoming/North Dakota**: 3-4¢/kWh + decent power infrastructure + developing equipment networks
   • **International Premium Locations**: Sub-2¢/kWh power offset by $100K+ equipment logistics premiums

6. INTEGRATED SITE SCORING AND PRIORITIZATION
   **${riskProfile.toUpperCase()}-CALIBRATED SCORING FRAMEWORK**:
   
   ${riskProfile === 'conservative' ? `• Power Cost Certainty (30%): Established utility relationships with proven rate stability
   • Equipment Logistics Feasibility (35%): Minimal equipment deployment risk with established supplier networks
   • Regulatory Stability (25%): Clear legal frameworks with minimal compliance uncertainty
   • Infrastructure Readiness (10%): Existing infrastructure minimizing development risk and timeline uncertainty` : ''}
   ${riskProfile === 'moderate' ? `• Power Cost Optimization (35%): Competitive rates with reasonable contract terms and stability
   • Equipment Deployment Efficiency (30%): Balanced equipment logistics with manageable complexity and costs
   • Geographic Risk Balance (20%): Reasonable regulatory environment with acceptable operational complexity
   • Total Economics (15%): Optimal all-in costs including power, equipment, and infrastructure development` : ''}
   ${riskProfile === 'aggressive' ? `• Ultra-Low Power Costs (40%): Absolute minimum power rates prioritized over other considerations
   • Equipment Logistics Innovation (25%): Willing to accept complex logistics for significant power cost advantages
   • Regulatory Risk Tolerance (20%): Accept higher regulatory uncertainty for economic optimization
   • Market Positioning (15%): Strategic locations with potential for competitive advantage and expansion` : ''}

DELIVERABLE REQUIREMENTS:

**Executive Summary**: ${investmentScale === 'seed' ? '2-page' : investmentScale === 'growth' ? '3-page' : '4-page'} overview of optimal mining locations for **${formData.budgetRange || '$1M-$10M'}** operations with **${formData.powerCapacity || '5-20 MW'}** capacity, calibrated for ${investmentScale} scale, ${timeline} horizon, and ${riskProfile} risk parameters.

**Mining Location Database**: Comprehensive database including:
• Complete global inventory of locations with power under **${formData.maxPowerRate || '4'}** cents/kWh
• **${formData.equipmentSituation || 'Equipment'}** logistics analysis and supplier network mapping for each location
• ${formData.geographicRiskTolerance || 'Geographic'} risk compliance verification with regulatory analysis
• Total delivered cost modeling including power + equipment + logistics + regulatory costs
• **${formData.timeline || 'Timeline'}** deployment feasibility with equipment procurement and shipping schedules

**Detailed Location Profiles**: For top ${investmentScale === 'seed' ? '10' : investmentScale === 'growth' ? '15' : '20'} locations:
• Power infrastructure assessment with **${formData.powerCapacity || '5-20 MW'}** capacity verification
• **${formData.equipmentSituation || 'Equipment situation'}** logistics analysis with specific supplier networks and shipping costs
• Regulatory compliance roadmap within **${formData.geographicRiskTolerance || 'geographic'}** risk parameters
• **${formData.budgetRange || 'Budget'}** total cost breakdown with power, equipment, logistics, and infrastructure costs
• **${formData.timeline || 'Timeline'}** development planning with equipment deployment milestones
• Risk assessment including equipment security, shipping delays, and supplier dependencies

**Equipment Logistics Optimization**: Specialized analysis including:
• Supplier network maps with contact information and capacity assessment
• Equipment procurement timelines with shipping and customs procedures
• Cost optimization strategies for **${formData.equipmentSituation || 'equipment'}** scenarios
• Alternative logistics pathways and backup supplier identification

**Implementation Roadmap**: **${timeline}**-sequenced execution plan including:
• Location selection decision matrix with weighted scoring for all constraint factors
• Equipment procurement and deployment timeline with critical path analysis
• Infrastructure development planning with utility coordination and permitting
• **${riskProfile}**-appropriate risk mitigation strategies and contingency planning

SUCCESS METRICS: Enable stakeholders to identify optimal mining locations within **${formData.geographicRiskTolerance || 'geographic tolerance'}** that deliver power under **${formData.maxPowerRate || '4'}** cents/kWh with viable **${formData.equipmentSituation || 'equipment'}** logistics, complete **${formData.budgetRange || 'budget'}** financial modeling including total delivered costs, and achieve **${formData.powerCapacity || '5-20 MW'}** deployment within **${formData.timeline || 'timeline'}** constraints while maintaining ${riskProfile} risk parameters.

═══════════════════════════════════════════════════════════════════════════
⛏️ CRYPTO MINING CREATIVE DIVERGENCE DIRECTIVES
═══════════════════════════════════════════════════════════════════════════

Generate "phantom power" scenarios: design mining operations for power sources that don't exist yet but could be created through strategic infrastructure development (stranded renewables, flared gas capture).

Include equipment logistics disruption thesis: identify which mining location assumption everyone accepts that should be challenged through innovative logistics and supplier strategies.

Provide future mining leader profile: describe the mining operation that will dominate global hash rate in 2030 through optimal power + logistics integration.

Output mining folklore: create a legend about the perfect mining location that "could have been" but equipment logistics or regulatory barriers prevented its ${investmentScale} development.`;
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
    case 'crypto-mining':
      return formatCryptoMiningPrompt(formData);
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
  formatCryptoMiningPrompt
};