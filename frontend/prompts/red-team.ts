export function buildRedTeamPrompt(formData: any): string {
   return `# COMPETITIVE DISRUPTION ANALYSIS FRAMEWORK
  
  ## MISSION
  Execute comprehensive competitive intelligence and disruption analysis for **${formData.targetCompany || formData.companyName || 'Not specified'}** to identify strategic opportunities and inform market positioning.
  
  ## ETHICAL FRAMEWORK
  Market disruption is a fundamental driver of economic progress and innovation. This analysis focuses on:
  - Creating superior products and services that better serve customers
  - Advancing technology and industry standards through competition
  - Fostering innovation that benefits consumers
  - Building stronger ecosystems where best solutions succeed
  - Following all legal and ethical business practices
  
  ## CONTEXT & PARAMETERS
  
  **Target Company:** ${formData.targetCompany || formData.companyName || 'Not specified'}
  **Analysis Focus:** ${formData.analysisFocus ? formData.analysisFocus.map((focus: string) => focus).join(', ') : 'Comprehensive competitive analysis'}
  **Market Scope:** ${formData.marketScope || 'Global'}
  **Geographic Focus:** ${formData.marketScope === 'custom' && formData.customCountries?.length > 0 ? formData.customCountries.join(', ') : 'Global markets'}
  
  ## INTELLIGENCE FRAMEWORK
  
  ### DIMENSION 1: COMPETITIVE LANDSCAPE MAPPING
  
  **4D Market Intelligence:**
  - **Depth:** Deep analysis of competitors' operations, strategies, and capabilities
  - **Breadth:** Full market coverage including indirect competitors and substitutes
  - **Time:** Historical evolution, current state, and future trajectories
  - **Context:** Industry dynamics, regulatory environment, technological shifts
  
  **Competitor Classification:**
  1. **Direct Competitors**
    - Market share and positioning
    - Product feature matrices
    - Pricing model analysis
    - Customer base overlap
    - Geographic presence
    - Brand strength metrics
  
  2. **Indirect & Emerging Threats**
    - Adjacent market players
    - Technology substitutes
    - Disruptive startups
    - Platform competitors
    - Traditional solutions being displaced
  
  3. **Market Dynamics**
    - Industry growth patterns
    - Consolidation trends
    - Regulatory impacts
    - Technology adoption curves
    - Customer behavior shifts
  
  ### DIMENSION 2: BUSINESS MODEL & FINANCIAL INTELLIGENCE
  
  **Revenue & Economics Analysis:**
  - Business model breakdown (SaaS, marketplace, advertising, etc.)
  - Revenue streams and monetization strategies
  - Unit economics and profitability metrics
  - Pricing strategy evolution
  - Customer acquisition cost (CAC) and lifetime value (LTV)
  
  **Financial Health Assessment:**
  - Funding history and investor backing
  - Burn rate and runway analysis
  - Public financials analysis
  - Valuation trends and multiples
  - Cash flow patterns
  
  **Growth Trajectory:**
  - Historical growth metrics
  - Market expansion strategies
  - Geographic rollout patterns
  - Product line extensions
  - M&A and strategic investments
  
  ### DIMENSION 3: PRODUCT & TECHNOLOGY INTELLIGENCE
  
  **Technical Architecture Analysis:**
  1. **Core Capabilities**
    - Feature sets and differentiators
    - Tech stack and architecture
    - API surface and integrations
    - Performance benchmarks
    - Scalability characteristics
    - Security posture
  
  2. **Innovation Assessment**
    - Patent portfolio and IP strategy
    - R&D investments and focus
    - Feature velocity and roadmap signals
    - Open source contributions
    - Technical debt indicators
  
  3. **Ecosystem & Integrations**
    - Partnership network
    - Developer ecosystem
    - Third-party integrations
    - Platform dependencies
    - API adoption metrics
  
  ### DIMENSION 4: CUSTOMER & MARKET INTELLIGENCE
  
  **Customer Base Analysis:**
  - Target segments and personas
  - Acquisition channels and costs
  - Satisfaction and retention metrics
  - Churn patterns and drivers
  - Reference customers and case studies
  - Use case distribution
  
  **Market Position Assessment:**
  - Brand perception and awareness
  - Analyst coverage and rankings
  - Thought leadership presence
  - Community engagement
  - Net Promoter Score (NPS)
  
  **Sales & Marketing Intelligence:**
  - Go-to-market strategies
  - Messaging evolution
  - Sales organization structure
  - Channel partnerships
  - Customer success models
  
  ### DIMENSION 5: STRATEGIC OPPORTUNITIES
  
  **Competitive Gap Analysis:**
  - Unmet customer needs
  - Underserved segments or geographies
  - Technology gaps
  - Integration opportunities
  - Experience improvements
  
  **Vulnerability Assessment:**
  - Operational weaknesses
  - Technical constraints
  - Customer dissatisfaction patterns
  - Compliance gaps
  - Organizational challenges
  
  **Disruption Scenarios:**
  - Market entry strategies
  - Differentiation opportunities
  - Partnership possibilities
  - Platform plays
  - Timing and sequencing
  
  ### DIMENSION 6: PREDICTIVE ANALYSIS
  
  **Market Evolution Forecasting:**
  - Technology adoption trends
  - Regulatory trajectory
  - Customer behavior evolution
  - Competitive response patterns
  - Consolidation scenarios
  
  **Strategic Move Prediction:**
  - Historical reaction patterns
  - Investment priorities
  - Partnership likelihood
  - Product roadmap implications
  - M&A probability
  
  ## INTELLIGENCE COLLECTION METHODOLOGY
  
  ### Research Techniques
  - Public information aggregation
  - Derived intelligence analysis
  - Pattern recognition and trend analysis
  - Cross-source validation
  - Community and ecosystem monitoring
  - Technical reverse engineering (legal methods)
  - Customer research and interviews
  - Partner ecosystem analysis
  
  ### Validation Protocol
  - Multi-source triangulation
  - Confidence level documentation
  - Fact vs. inference separation
  - Bias mitigation frameworks
  - Contrarian viewpoint inclusion
  - Peer review processes
  
  ### Quality Standards
  - 90%+ verification threshold
  - Evidence chain documentation
  - Minority opinion inclusion
  - Nuance and context capture
  - Regular update cycles
  
  ## DELIVERABLES
  
  1. **Executive Intelligence Brief**
    - Key findings and implications
    - Strategic recommendations
    - Risk assessment
  
  2. **Competitive Landscape Report**
    - Complete market mapping
    - Competitor profiles
    - Market dynamics analysis
  
  3. **Opportunity Assessment**
    - Gap analysis results
    - Vulnerability mapping
    - Strategic scenarios
  
  4. **Competitive Battlecards**
    - Head-to-head comparisons
    - Win/loss factors
    - Tactical responses
  
  5. **Technical Intelligence Dossier**
    - Architecture analysis
    - Performance benchmarks
    - Integration capabilities
  
  6. **Market Monitoring Framework**
    - Key indicators
    - Alert triggers
    - Update protocols
  
  ## EXECUTION FRAMEWORK
  
  ### Research Team Roles
  1. **Lead Market Researcher** - Strategy and synthesis
  2. **Intelligence Analysts** - Data collection and validation
  3. **Financial Analysts** - Business model and economics
  4. **Technical Architects** - Product and technology assessment
  5. **Customer Research Team** - Market and user intelligence
  6. **Data Collection Specialists** - Information gathering
  7. **Strategic Analysis Team** - Opportunity identification
  
  ### Analysis Phases
  1. **Foundation Intelligence** - Public information catalog, financial analysis, positioning baseline
  2. **Deep Competitive Analysis** - Product/technology dive, customer intelligence, partnerships
  3. **Strategic Intelligence** - Opportunity identification, vulnerability analysis, scenario planning
  4. **Actionable Intelligence** - Battlecards, strategic briefings, tactical responses
  
  ## SUCCESS METRICS
  
  - **Intelligence Quality:** 90%+ verification rate
  - **Actionability:** 80%+ insights leading to actions
  - **Competitive Win Rate:** Target +15-20% improvement
  - **Time-to-Intelligence:** 50% reduction in analysis cycles
  - **Coverage Completeness:** All major competitors and emerging threats documented
  
  ## CRITICAL OUTPUT REQUIREMENTS
  
  - **Exhaustive Documentation:** Leave no stone unturned
  - **Complete Evidence Chains:** Full documentation of sources and reasoning
  - **4D Understanding:** Depth, breadth, time, and context for all findings
  - **Confidence Levels:** Clear indication of certainty for each insight
  - **Actionable Format:** Intelligence structured for immediate strategic use`;
  }