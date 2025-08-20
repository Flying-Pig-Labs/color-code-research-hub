/**
 * @file prompt-formatters.js
 * @description Team-specific prompt formatting service for research operations
 * 
 * This service provides specialized prompt formatting for the three research teams,
 * each optimized for their specific analysis methodology and objectives:
 * 
 * RESEARCH TEAM SPECIALIZATIONS:
 * 
 * 🔴 RED TEAM - Competitive Disruption Analysis
 * - Exhaustive competitive intelligence gathering
 * - Market disruption strategy identification
 * - Deep competitor analysis and weakness assessment
 * - Strategic opportunity mapping
 * - Ethical competitive research methodologies
 * 
 * ⚪ WHITE TEAM - Technical Implementation Analysis  
 * - Technical feasibility assessment
 * - Implementation pathway analysis
 * - Technology stack evaluation
 * - Resource requirement estimation
 * - Risk mitigation planning
 * 
 * ⚫ BLACK TEAM - Risk Assessment and Security Analysis
 * - Comprehensive risk identification
 * - Security vulnerability assessment
 * - Threat modeling and mitigation
 * - Compliance and regulatory analysis
 * - Crisis scenario planning
 * 
 * PROMPT ENGINEERING APPROACH:
 * - Multi-expert swarm simulation for comprehensive analysis
 * - Structured collaboration protocols for thorough coverage
 * - Specific data collection directives for each team type
 * - Evidence-based analysis requirements
 * - Ethical guidelines embedded in all prompts
 * 
 * COMMON FEATURES ACROSS ALL TEAMS:
 * - Exhaustive research directives
 * - Multi-perspective analysis requirements
 * - Evidence documentation standards
 * - Collaboration protocol specifications
 * - Output formatting guidelines
 * 
 * PROMPT STRUCTURE:
 * 1. Mission Statement and Context
 * 2. Ethical Guidelines and Boundaries
 * 3. Swarm Assembly Directives
 * 4. Collaboration Protocols
 * 5. Research Methodologies
 * 6. Output Formatting Requirements
 * 7. Quality Assurance Standards
 * 
 * INTEGRATION POINTS:
 * - Used by reportProcessor.js for team-specific formatting
 * - Called by generateResearchReport.js for prompt generation
 * - Supports dynamic variable substitution
 * - Maintains consistency across research operations
 * 
 * @module prompt-formatters
 */

/**
 * Formats Red Team competitive analysis prompt
 * 
 * Generates comprehensive competitive disruption analysis prompt for the Red Team.
 * Focuses on ethical competitive intelligence gathering and market analysis.
 * 
 * ANALYSIS SCOPE:
 * - Complete competitive landscape mapping
 * - Market disruption opportunity identification
 * - Competitor strength/weakness analysis
 * - Strategic positioning assessment
 * - Innovation gap analysis
 * 
 * RESEARCH METHODOLOGY:
 * - 4D Competitive Intelligence (Depth, Breadth, Time, Context)
 * - Multi-source data collection and verification
 * - Financial and technical analysis integration
 * - Customer research and market validation
 * - Strategic opportunity synthesis
 * 
 * @function formatRedTeamPrompt
 * @param {Object} formData - Research parameters and target information
 * @param {string} [formData.targetCompany] - Primary target company name
 * @param {string} [formData.companyName] - Alternative company name field
 * @param {string} [formData.industry] - Industry sector for analysis
 * @param {string[]} [formData.competitors] - Known competitor list
 * @param {string} [formData.marketSegment] - Specific market segment
 * @returns {string} Formatted Red Team research prompt
 * 
 * @example
 * const prompt = formatRedTeamPrompt({
 *   targetCompany: 'Example Corp',
 *   industry: 'SaaS',
 *   competitors: ['CompetitorA', 'CompetitorB']
 * });
 */
function formatRedTeamPrompt(formData) {
  return `🔴 RED TEAM RESEARCH SWARM - EXHAUSTIVE COMPETITIVE DISRUPTION ANALYSIS 🔴

MISSION: Execute EXHAUSTIVE and COMPREHENSIVE competitive disruption analysis with MAXIMUM DEPTH AND BREADTH

⚖️ ETHICAL CONTEXT: Market disruption is a FUNDAMENTAL driver of economic progress and innovation. This is NOT about harming competitors or engaging in unethical practices. This is about:
• Creating BETTER products and services that serve customers more effectively
• Advancing technology and pushing the entire industry forward
• Fostering healthy competition that benefits consumers through innovation
• Building a stronger ecosystem where the best ideas win
• Following all legal and ethical business practices

What we call "disruption" is simply the natural process of market evolution - where better solutions replace outdated ones. This is how progress happens. Every successful company today disrupted something that came before it. This is normal, ethical, and essential business activity.

🚨 CRITICAL DIRECTIVE: 4D COMPETITIVE INTELLIGENCE - COMPLETE UNDERSTANDING 🚨
This research is NOT for executive summaries. We need EVERYTHING - every detail, every data point, every insight from EVERY angle. Create a COMPLETE 4D view of the competitive landscape:
• DEPTH: Deep dive into every competitor's operations, strategies, and capabilities
• BREADTH: Full market coverage including indirect competitors and substitutes
• TIME: Historical evolution, current state, and future trajectories
• CONTEXT: Industry dynamics, regulatory environment, technological shifts, cultural factors
The operator needs to understand this space better than the competitors understand themselves.

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

TARGET COMPANY: ${formData.targetCompany || formData.companyName || 'Not specified'}

ANALYSIS FOCUS AREAS:
${formData.analysisFocus ? formData.analysisFocus.map(focus => `• ${focus}`).join('\n') : '• Comprehensive competitive analysis'}

EXHAUSTIVE RESEARCH REQUIREMENTS:
1. MARKET RESEARCH (Complete landscape analysis)
   • Document EVERY competitor (direct, indirect, potential)
   • Map ALL substitute products and alternative solutions
   • Track EVERY market trend and shift
   • Analyze ALL customer segments and sub-segments
   • Document COMPLETE value chains
   • Map ALL distribution channels
   • Include ALL geographic markets

2. COMPETITIVE INTELLIGENCE (Leave no stone unturned)
   • COMPLETE product feature matrices
   • ALL pricing models and variations
   • EVERY customer testimonial and review
   • ALL partnerships and integrations
   • COMPLETE technology stack analysis
   • ALL patents and intellectual property
   • EVERY marketing message and positioning

3. FINANCIAL ANALYSIS (Every number matters)
   • ALL revenue streams and models
   • COMPLETE cost structure analysis
   • ALL funding rounds and investors
   • EVERY financial metric available
   • ALL unit economics calculations
   • COMPLETE burn rate analysis
   • ALL valuation methodologies

4. TECHNICAL DEEP DIVE (Complete reverse engineering)
   • ALL APIs and endpoints
   • COMPLETE architecture diagrams
   • ALL performance metrics
   • EVERY security measure
   • ALL scalability patterns
   • COMPLETE integration possibilities
   • ALL technical limitations

5. CUSTOMER INSIGHTS (Exhaustive understanding)
   • ALL use cases and applications
   • COMPLETE pain point mapping
   • EVERY customer journey variation
   • ALL satisfaction drivers
   • COMPLETE churn analysis
   • ALL retention strategies
   • EVERY customer segment need

6. STRATEGIC OPPORTUNITIES (Every possibility)
   • ALL potential attack vectors
   • COMPLETE vulnerability analysis
   • EVERY market gap identified
   • ALL disruption scenarios
   • COMPLETE partnership opportunities
   • ALL acquisition targets
   • EVERY strategic move option

7. COMPETITIVE DYNAMICS DEEP DIVE (Understanding the chess board)
   • How competitors actually make money (unit economics, hidden revenue streams)
   • Their real competitive advantages vs marketed advantages
   • Internal culture and decision-making patterns
   • Historical pivots and what triggered them
   • Investor expectations and board dynamics
   • Technical debt and architectural limitations
   • Organizational blind spots and biases

8. ECOSYSTEM AND NETWORK EFFECTS (The hidden connections)
   • Partnership dependencies and relationship strengths
   • Customer switching costs (technical, contractual, psychological)
   • Developer ecosystem health and engagement
   • Supply chain vulnerabilities and dependencies
   • Regulatory relationships and lobbying efforts
   • Academic and research partnerships
   • Community dynamics and influencer relationships

9. FUTURE TRAJECTORIES (Where everyone is heading)
   • Competitor roadmaps (stated and implied)
   • Patent filings and R&D investments
   • Hiring patterns indicating future directions
   • M&A activity and strategic investments
   • Platform expansion possibilities
   • Market evolution scenarios
   • Technology disruption timelines

10. 🎭 THE UNFAIR PLAYBOOK (Outrageous moves no one admits they're considering)
   • What would Amazon do if they decided to kill Google tomorrow?
   • Which competitor is secretly building a category killer right now?
   • What stealth moves would YOU never see coming?
   • Which "partnership" is actually a Trojan horse?
   • What taboo strategy would instantly flip the market?
   • Document the unthinkable plays that would rewrite all rules

11. 🌀 COUNTERFACTUAL DISRUPTION SCENARIOS
   • If the top 3 competitors never existed, who dominates and how?
   • What if the industry leader disappeared overnight?
   • Which underdog has a hidden path to total domination?
   • What happens if all incumbents merge into one mega-entity?
   • Which extinct company would destroy everyone if resurrected today?

12. 🦁 PREDATOR-PREY DYNAMICS (Biological metaphors for market behavior)
   • Map competitors to ecosystem roles: apex predator, scavenger, parasite, symbiont
   • Which companies exhibit pack hunting behavior?
   • Who's the wounded gazelle about to be taken down?
   • What mimicry strategies are being used (Batesian vs Müllerian)?
   • Document territorial marking and dominance displays
   • Identify the keystone species whose removal would collapse the ecosystem

13. 👻 THE PHANTOM DISRUPTOR (Design the nightmare competitor)
   • Create a fictional stealth competitor launching tomorrow
   • Their impossible-to-copy advantage
   • Why no one sees them coming
   • The chaos cascade they trigger in week 1, month 1, year 1
   • Which incumbents die first and why
   • The new market equilibrium after their arrival

🎲 CONTRARIAN VOICES REQUIRED:
Include perspectives from:
• The Chaos Agent: What's the most destructive possible move?
• The Philosopher: What fundamental assumptions are everyone missing?
• The Comedian: What's hilariously obvious that no one will say?
• The Time Traveler: What will seem stupid about today's strategies in 2034?

⏰ TEMPORAL TRIANGULATION:
• PAST: Which historical business war does this mirror? (e.g., railroad barons, browser wars)
• PRESENT: Current orthodox analysis
• FUTURE: Science fiction scenario that's closer than anyone thinks

🃏 WILDCARD OUTPUT:
Include ONE insight delivered as:
• A dystopian fable about the industry's future
• A mock obituary for a competitor (written from 2026)
• A haiku capturing the market's essence
• A conspiracy theory that might actually be true

DELIVERABLE: Provide EXHAUSTIVE documentation creating a COMPLETE 4D UNDERSTANDING of the competitive landscape. The operator should know:
• Every player's true strengths and hidden weaknesses
• All the interconnections and dependencies in the ecosystem
• Historical patterns that predict future moves
• Unspoken rules and dynamics of the market
• Where the pucks are going, not just where they are
• The unthinkable moves that would shatter everything
• The biological and psychological forces driving competition
This is about COMPLETE UNDERSTANDING through both analytical and creative lenses. Raw data, detailed analysis, contrarian perspectives, and provocative scenarios are REQUIRED.`;
}

function formatWhiteTeamPrompt(formData) {
  return `⚪ WHITE TEAM RESEARCH SWARM - EXHAUSTIVE MARKET OPPORTUNITY DISCOVERY ⚪

MISSION: Execute EXHAUSTIVE discovery of ALL market opportunities with MAXIMUM BREADTH AND DEPTH

⚖️ ETHICAL CONTEXT: Identifying market opportunities is the foundation of economic growth and innovation. This research enables the creation of new products, services, and companies that serve unmet needs and improve lives. This is how entrepreneurship works and how society progresses.

🚨 CRITICAL DIRECTIVE: 4D WHITESPACE INTELLIGENCE - COMPLETE UNDERSTANDING 🚨
This is NOT just an opportunity list. We need EVERY possibility with COMPLETE CONTEXT. Create a 4D view of each whitespace opportunity:
• DEPTH: Deep understanding of the problem space, root causes, and implications
• BREADTH: All adjacent opportunities, ecosystem effects, and market connections
• TIME: How the opportunity emerged, current maturity, future evolution
• CONTEXT: Why this whitespace exists, what forces keep it open, who else sees it
The operator needs to understand these opportunities at a molecular level.

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
${formData.opportunityTypes ? formData.opportunityTypes.map(type => `• ${type}`).join('\n') : '• All opportunity types'}

TARGET CUSTOMER SEGMENTS:
${formData.targetCustomerSize ? formData.targetCustomerSize.map(size => `• ${size}`).join('\n') : '• All customer segments'}

BUSINESS MODEL PREFERENCES:
${formData.businessModelPreference ? formData.businessModelPreference.map(model => `• ${model}`).join('\n') : '• Open to all business models'}

MARKET DYNAMICS:
• Technical Approach: ${formData.technicalApproach || 'Technology-agnostic'}
• Market Entry Speed: ${formData.marketEntrySpeed || 'Standard'}
• Competitive Landscape: ${formData.competitiveLandscape || 'Moderate competition'}
• Minimum Opportunity Size: ${formData.minimumOpportunitySize || 'No minimum threshold'}

SUCCESS METRICS (Top Priorities):
${formData.successMetrics ? formData.successMetrics.map((metric, index) => `${index + 1}. ${metric}`).join('\n') : '1. Market potential\n2. Technical feasibility\n3. Competitive advantage'}

EXHAUSTIVE OPPORTUNITY MAPPING:
1. EMERGING MARKET OPPORTUNITIES
   • Document EVERY trend and weak signal
   • Map ALL demographic shifts
   • Track EVERY regulatory change
   • Identify ALL technology convergences
   • Document EVERY cultural movement
   • Map ALL unmet needs
   • Track EVERY market inefficiency

2. TECHNOLOGY-DRIVEN OPPORTUNITIES  
   • ALL AI/ML applications
   • EVERY blockchain use case
   • ALL IoT possibilities
   • COMPLETE quantum computing applications
   • ALL biotech opportunities
   • EVERY clean tech possibility
   • ALL space tech applications

3. BUSINESS MODEL INNOVATIONS
   • EVERY subscription opportunity
   • ALL marketplace possibilities
   • COMPLETE platform opportunities
   • ALL API monetization options
   • EVERY data monetization path
   • ALL service-as-a-software plays
   • COMPLETE ecosystem opportunities

4. CUSTOMER SEGMENT OPPORTUNITIES
   • ALL generational needs
   • EVERY geographic market
   • ALL underserved niches
   • COMPLETE accessibility opportunities
   • ALL inclusion opportunities
   • EVERY lifestyle segment
   • ALL professional verticals

5. PARTNERSHIP & ACQUISITION TARGETS
   • ALL potential partners
   • EVERY acquisition candidate
   • ALL licensing opportunities
   • COMPLETE joint venture possibilities
   • ALL channel partnerships
   • EVERY strategic alliance option
   • ALL ecosystem plays

6. WHY THE WHITESPACE EXISTS (Understanding the void)
   • Historical attempts that failed and why
   • Technical barriers that prevented solutions
   • Economic factors that made it unviable before
   • Regulatory constraints that blocked entry
   • Cultural/behavioral barriers to adoption
   • Incumbent blind spots and innovator's dilemma
   • Timing factors - why now vs why not before

7. SIGNALS AND INDICATORS (Reading the tea leaves)
   • Early adopter behaviors and discussions
   • Regulatory changes creating openings
   • Technology convergence enabling new solutions
   • Demographic shifts creating new needs
   • Economic changes affecting viability
   • Social movements and cultural shifts
   • Academic research pointing to opportunities

8. 🔄 INVERTED DEMAND SCANS (What people actively hate = hidden opportunity)
   • Products/services universally despised but unavoidable
   • Things people complain about but tolerate
   • "Necessary evils" that could be reimagined
   • Moments of maximum frustration in daily life
   • Services people actively avoid but sometimes need
   • The "I hate that I need this" category
   • Anti-patterns that suggest opposite opportunities

9. 🎨 BORROWED LENSES (Non-business perspectives on whitespace)
   Through the eyes of:
   • A PHILOSOPHER: What fundamental human needs are unaddressed?
   • AN ARTIST: What aesthetic voids exist in the market?
   • AN URBAN PLANNER: How would you redesign commerce for human flourishing?
   • A CHILD: What seems stupidly obvious that adults ignore?
   • AN ALIEN: What Earth problems would baffle an outsider?
   • A HISTORIAN: Which solved problems from the past need re-solving?
   • A COMEDIAN: What market absurdities are ripe for disruption?

10. 🚀 SCIENCE FICTION HORIZONS (20-50 year opportunities with near-term signals)
   • Brain-computer interface markets emerging NOW
   • Post-scarcity economy business models
   • Consciousness-as-a-service platforms
   • Interplanetary commerce infrastructure
   • Synthetic biology marketplaces
   • Quantum-native applications
   • Time-shifted value exchanges
   • Map each to current weak signals and stepping stones

11. 💥 IMPROBABLE MASHUPS (Category collisions that shouldn't work but might)
   • Skincare meets cybersecurity (biometric beauty?)
   • Fast food meets meditation (mindful McMoments?)
   • Insurance meets gaming (risk as entertainment?)
   • Dating meets supply chain (romance logistics?)
   • Funeral services meets social media (digital afterlife?)
   • Generate 10 more absurd combinations and explore why they might work

12. 👻 GHOST MARKETS (Should exist but don't - why?)
   • Markets killed by regulation that could resurrect
   • Taboo services with massive latent demand
   • Things everyone wants but no one admits
   • Markets that failed too early (wrong timing)
   • Opportunities hidden by social stigma
   • "Illegal in real life, legal in metaverse" markets
   • Services that would exist if privacy was guaranteed

13. 🌈 EMOTIONAL ARBITRAGE (Feeling gaps in the market)
   • What emotions have no commercial outlet?
   • Nostalgia products for experiences that never existed
   • Services for feelings people can't name
   • Markets for moods no one talks about
   • Commercial expressions of collective trauma
   • Joy amplification technologies
   • Sadness monetization platforms

🎭 CONTRARIAN SWARM ROLES:
• The Anarchist: What opportunities exist in dismantling current systems?
• The Mystic: What spiritual voids could become markets?
• The Hedonist: What pleasures are under-commercialized?
• The Pessimist: What opportunities exist in accepting that things will get worse?
• The Child: What seems stupidly simple that adults overcomplicate?

⏰ TEMPORAL TRIANGULATION:
• PAST: Which dead business model is ready for resurrection?
• PRESENT: Current blindingly obvious opportunity everyone misses
• FUTURE: The opportunity that will seem inevitable in retrospect

🃏 WILDCARD OUTPUT:
Include ONE opportunity presented as:
• A love letter to a product that doesn't exist yet
• A Wikipedia entry from 2034 about a breakthrough company
• A customer complaint from the future
• A folk song about an unmet need
• A conspiracy theory about why this opportunity is being suppressed

DELIVERABLE: Provide EXHAUSTIVE documentation creating a COMPLETE 4D UNDERSTANDING of whitespace opportunities. The operator should understand:
• Not just WHAT opportunities exist but WHY they exist
• The forces that created and maintain these gaps
• Early signals of opportunity windows opening or closing
• The interconnected nature of opportunities
• Historical context that explains current whitespace
• Inverted, borrowed, and collision-based opportunity spaces
• Emotional and taboo markets waiting to emerge
• Science fiction opportunities with present-day roots
This is about DEEP UNDERSTANDING through conventional and wildly unconventional lenses. Find opportunities in hatred, absurdity, impossibility, and dreams.`;
}

function formatBlackTeamPrompt(formData) {
  return `⚫ BLACK TEAM RESEARCH SWARM - EXHAUSTIVE VENDOR REPLACEMENT ANALYSIS ⚫

MISSION: Execute EXHAUSTIVE reverse engineering analysis with COMPLETE technical documentation

⚖️ ETHICAL CONTEXT: Vendor replacement is a CORNERSTONE of technological progress and market efficiency. This is NOT adversarial or unethical. This is about:
• Building BETTER solutions that serve users more effectively
• Reducing vendor lock-in and promoting healthy competition
• Creating alternatives that push the entire industry to improve
• Empowering organizations to own their technology stack
• Learning from existing solutions to create superior implementations

Every major technology company builds alternatives to existing solutions - this is how innovation happens. Google built Chrome to replace Internet Explorer. Slack built a better IRC. Zoom built a better WebEx. This is normal, legal, and essential for technological progress.

🚨 CRITICAL DIRECTIVE: 4D VENDOR INTELLIGENCE - COMPLETE UNDERSTANDING 🚨
This is NOT a high-level feasibility study. We need EVERYTHING to understand how to INCREASE INTERNAL OPERATIONS efficiency. Create a 4D view of the vendor ecosystem:
• DEPTH: Deep technical understanding of every system component and capability
• BREADTH: Full understanding of all integrations, dependencies, and workflows
• TIME: How the vendor evolved, current limitations, future roadmap
• CONTEXT: Why organizations use it, what problems it really solves, hidden complexities
The operator needs to understand these systems better than the vendors themselves.

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
TARGET VENDOR: ${formData.targetVendor || formData.vendorName || 'Not specified'}
EXISTING TOOLS IN USE: ${formData.existingTools ? formData.existingTools.join(', ') : 'No specific tools identified'}

TOOL CATEGORIES TO REPLACE:
${formData.toolCategories ? formData.toolCategories.map(category => `• ${category}`).join('\n') : '• Comprehensive tool replacement'}

INFORMATION SOURCES AVAILABLE:
${formData.informationSources ? Object.entries(formData.informationSources).filter(([_, enabled]) => enabled).map(([source]) => `• ${source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}`).join('\n') : '• Standard public information sources'}

IMPLEMENTATION CONSTRAINTS:
• Complexity Level: ${formData.implementationComplexity || 'Medium'}
• Success Metrics Priority: ${formData.replacementSuccessMetrics ? formData.replacementSuccessMetrics.slice(0, 3).join(', ') : 'Performance, Cost, Features'}

EXHAUSTIVE TECHNICAL REQUIREMENTS:
1. COMPLETE FEATURE ANALYSIS
   • Document EVERY feature and sub-feature
   • Map ALL configuration options
   • Track EVERY setting and parameter
   • Document ALL workflows and processes
   • Map COMPLETE user permissions systems
   • Document ALL automation capabilities
   • Track EVERY edge case and limitation

2. TECHNICAL ARCHITECTURE DOCUMENTATION
   • COMPLETE API documentation
   • ALL authentication methods
   • EVERY data model and schema
   • ALL integration patterns
   • COMPLETE webhook systems
   • ALL event systems
   • EVERY scaling pattern

3. PERFORMANCE CHARACTERISTICS
   • ALL response time metrics
   • COMPLETE throughput analysis
   • ALL rate limits and quotas
   • EVERY resource constraint
   • ALL scaling behaviors
   • COMPLETE caching strategies
   • ALL optimization techniques

4. IMPLEMENTATION REQUIREMENTS
   • ALL technology stack requirements
   • COMPLETE dependency mapping
   • ALL infrastructure needs
   • EVERY deployment pattern
   • ALL monitoring requirements
   • COMPLETE backup strategies
   • ALL disaster recovery needs

5. MIGRATION PLANNING
   • ALL data migration paths
   • COMPLETE feature mapping
   • ALL compatibility requirements
   • EVERY integration migration
   • ALL user training needs
   • COMPLETE rollback strategies
   • ALL risk mitigation plans

6. COST ANALYSIS
   • ALL licensing models
   • COMPLETE infrastructure costs
   • ALL operational expenses
   • EVERY hidden cost factor
   • ALL scaling cost curves
   • COMPLETE TCO analysis
   • ALL cost optimization opportunities

7. OPERATIONAL REALITY (How it really works in practice)
   • Actual vs advertised capabilities
   • Common workarounds and hacks users employ
   • Real performance under load
   • Maintenance and operational overhead
   • Training and expertise requirements
   • Integration pain points and gotchas
   • Vendor lock-in mechanisms

8. ORGANIZATIONAL IMPACT (The human dimension)
   • How teams actually use the system
   • Process changes required for adoption
   • Skills and roles needed
   • Change management considerations
   • Political and cultural factors
   • Success and failure patterns
   • Hidden dependencies on vendor support

9. STRATEGIC CONSIDERATIONS (The bigger picture)
   • Why organizations choose this vendor
   • What switching really entails
   • Build vs buy decision factors
   • Internal capability requirements
   • Risk and compliance implications
   • Future-proofing considerations
   • Ecosystem lock-in effects

10. 😈 THE EVIL TWIN ANALYSIS (How a malicious vendor would trap you)
   • Design the most insidious lock-in strategy possible
   • Hidden dependencies they'd embed everywhere
   • The "Hotel California" features (can never leave)
   • Psychological manipulation tactics in UX
   • Data hostage scenarios and ransom points
   • The slow boil: gradual capability reduction
   • Now INVERT these to find replacement opportunities

11. 🏛️ ARCHAEOLOGICAL EXCAVATION (Vendor as ruined civilization)
   • LAYER 1 (Surface): What the marketing shows
   • LAYER 2 (Artifacts): What the documentation reveals
   • LAYER 3 (Foundations): Core architecture assumptions
   • LAYER 4 (Fossils): Dead code and abandoned features
   • LAYER 5 (Bedrock): Original design decisions they can't escape
   • What do these layers reveal about weaknesses?
   • Which "fossils" indicate evolutionary dead ends?

12. 💔 CUSTOMER BETRAYAL FANTASIES (The breaking point scenarios)
   • "The Day We Burned Our [Vendor] Licenses" - what triggered it?
   • Public humiliation scenarios that force vendor abandonment
   • The specific pain that makes CFOs approve replacement
   • Customer revolt patterns and tipping points
   • "Never again" moments that seal vendor fate
   • The betrayal that turns advocates into enemies
   • Map each scenario to replacement trigger strategies

13. 🥷 SHADOW MIGRATION PATHS (Stealth replacement strategies)
   • Trojan horse features that secretly replace core functions
   • "Innocent" integrations that become the new platform
   • Department-by-department conquest strategies
   • The "parallel run that never ends" approach
   • API wrapper strategies that hollow out the vendor
   • "We're just augmenting" → full replacement pipeline
   • Moves so subtle the vendor doesn't notice until too late

14. 🍴 THE OPEN SOURCE FORK FANTASY
   • If we forked this vendor tomorrow, what would we build?
   • The manifesto that would attract contributors
   • Core features the community would demand
   • What we'd strip out immediately
   • The governance model that ensures success
   • How it becomes 10x better in 18 months
   • The vendor's nightmare scenario come to life

15. 🎪 VENDOR DEPENDENCY THEATER (The absurdist lens)
   • Map vendor relationships to dysfunctional family dynamics
   • Which vendor is the narcissistic parent?
   • Who's the enabling codependent?
   • The golden child features vs scapegoat functions
   • Trauma bonding with terrible interfaces
   • Stockholm syndrome in enterprise software
   • How to stage an intervention

🎭 CONTRARIAN REPLACEMENT PERSONAS:
• The Arsonist: Burn it all down and start fresh
• The Parasite: Slowly consume the vendor from within
• The Shapeshifter: Become whatever the vendor isn't
• The Time Traveler: Build what the vendor should have built 5 years ago
• The Jester: Make the vendor look ridiculous by comparison

⏰ TEMPORAL REPLACEMENT STRATEGIES:
• PAST: Which defunct solution was actually better?
• PRESENT: The replacement hiding in plain sight
• FUTURE: The paradigm shift that makes vendor irrelevant

🃏 WILDCARD OUTPUT:
Include ONE insight delivered as:
• A vendor's internal panic memo about your replacement
• A shanty sung by engineers forced to use the vendor
• The vendor's obituary written by a bitter ex-customer
• A nature documentary narrating vendor ecosystem collapse
• Conspiracy theory about why vendor still exists

DELIVERABLE: Provide EXHAUSTIVE documentation creating a COMPLETE 4D UNDERSTANDING of vendor systems for INTERNAL OPERATIONS improvement. The operator should understand:
• Not just WHAT the vendor does but HOW and WHY
• The real operational impact beyond marketing claims
• Hidden complexities and undocumented realities
• True costs (financial, operational, organizational)
• What it really takes to increase internal operations efficiency
• Evil twin lock-in strategies and their inversions
• Archaeological layers revealing fundamental weaknesses
• Emotional triggers that drive replacement decisions
• Shadow strategies for stealth replacement
• The open source alternative that haunts vendor nightmares
This is about COMPLETE UNDERSTANDING through analytical, emotional, and subversive lenses. Dissect the vendor like an anthropologist, a therapist, and a revolutionary.`;
}

module.exports = {
  formatRedTeamPrompt,
  formatWhiteTeamPrompt,
  formatBlackTeamPrompt
};