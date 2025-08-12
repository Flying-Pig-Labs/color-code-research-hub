export function buildWhiteTeamPrompt(formData: any): string {
   return `# MARKET OPPORTUNITY DISCOVERY FRAMEWORK
  
  ## MISSION
  Execute comprehensive market research and whitespace analysis for **${formData.companyName || 'Not specified'}** to identify industry opportunities, market gaps, and emerging trends.
  
  ## ETHICAL FRAMEWORK
  Market opportunity identification drives economic growth and innovation through:
  - Discovery of underserved market segments
  - Recognition of industry inefficiencies
  - Identification of technological convergence opportunities
  - Understanding of macro trends creating new markets
  
  ## CONTEXT & PARAMETERS
  
  **Company:** ${formData.companyName || 'Not specified'}
  **Opportunity Types:** ${formData.opportunityTypes ? formData.opportunityTypes.join(', ') : 'All opportunity types'}
  **Target Segments:** ${formData.targetCustomerSize ? formData.targetCustomerSize.join(', ') : 'All market segments'}
  **Business Models:** ${formData.businessModelPreference ? formData.businessModelPreference.join(', ') : 'Open to all models'}
  
  **Strategic Parameters:**
  - Technical Approach: ${formData.technicalApproach || 'Technology-agnostic'}
  - Market Entry Speed: ${formData.marketEntrySpeed || 'Standard'}
  - Competitive Landscape: ${formData.competitiveLandscape || 'Moderate competition'}
  - Minimum Opportunity Size: ${formData.minimumOpportunitySize || 'No minimum threshold'}
  
  **Success Priorities:**
  ${formData.successMetrics ? formData.successMetrics.map((metric: string, index: number) => `${index + 1}. ${metric}`).join('\n') : '1. Market potential\n2. Technical feasibility\n3. Competitive advantage'}
  
  ## MARKET INTELLIGENCE FRAMEWORK
  
  ### DIMENSION 1: INDUSTRY LANDSCAPE ANALYSIS
  
  **4D Market Understanding:**
  - **Depth:** Deep analysis of industry structure, value chains, and economics
  - **Breadth:** All adjacent industries, cross-sector opportunities, ecosystem effects
  - **Time:** Historical evolution, current inflection points, future trajectories
  - **Context:** Macro forces, regulatory environment, technological shifts
  
  **Industry Structure Mapping:**
  - Value chain analysis and profit pools
  - Market size and growth trajectories
  - Segment dynamics and evolution
  - Geographic market variations
  - Distribution channel analysis
  - Pricing and business model trends
  
  ### DIMENSION 2: MACRO TREND INTELLIGENCE
  
  **Global Megatrends:**
  - Demographic shifts and aging populations
  - Urbanization and smart city development
  - Climate change and sustainability imperatives
  - Digital transformation acceleration
  - Geopolitical realignment
  - Supply chain reconfiguration
  - Energy transition
  
  **Economic Indicators:**
  - Capital flow patterns
  - Investment thesis evolution
  - Market cycle positioning
  - Interest rate impacts
  - Inflation effects on markets
  - Currency and trade dynamics
  - Economic policy shifts
  
  **Societal Movements:**
  - Workforce transformation
  - Education evolution
  - Healthcare system changes
  - Social equity initiatives
  - Consumer behavior shifts
  - Digital native expectations
  - Trust and privacy concerns
  
  ### DIMENSION 3: TECHNOLOGY CONVERGENCE OPPORTUNITIES
  
  **Emerging Technology Markets:**
  - AI/ML market applications and gaps
  - Blockchain beyond cryptocurrency
  - IoT and edge computing opportunities
  - Quantum computing commercialization
  - Biotech and synthetic biology markets
  - Clean tech and carbon markets
  - Space economy expansion
  
  **Technology Maturity Analysis:**
  - Gartner hype cycle positioning
  - Technology readiness levels
  - Infrastructure requirements
  - Adoption barriers and catalysts
  - Cost curve projections
  - Standardization progress
  - Patent landscape evolution
  
  **Platform & Ecosystem Opportunities:**
  - API economy expansion
  - Data marketplace opportunities
  - Platform business models
  - Network effects potential
  - Ecosystem orchestration plays
  - Developer community opportunities
  
  ### DIMENSION 4: REGULATORY & POLICY LANDSCAPE
  
  **Regulatory Shifts Creating Markets:**
  - New compliance requirements
  - Deregulation opportunities
  - Cross-border regulatory harmonization
  - Data protection and privacy laws
  - Environmental regulations
  - Financial services modernization
  - Healthcare policy changes
  
  **Government Initiatives:**
  - Infrastructure investment programs
  - Digital transformation initiatives
  - Green economy incentives
  - Innovation funding programs
  - Public-private partnership opportunities
  - Trade agreement impacts
  - Tax policy implications
  
  ### DIMENSION 5: MARKET GAP ANALYSIS
  
  **Industry Whitespace Identification:**
  - Underserved market segments
  - Geographic expansion opportunities
  - Channel gaps and inefficiencies
  - Price point gaps in market
  - Feature/capability gaps
  - Service level gaps
  - Integration opportunities
  
  **Market Failure Points:**
  - Information asymmetries
  - Transaction cost inefficiencies
  - Coordination failures
  - Monopolistic bottlenecks
  - Regulatory gaps
  - Technology adoption barriers
  - Capital access constraints
  
  **Cross-Industry Opportunities:**
  - Industry convergence points
  - Business model transplantation
  - Technology transfer opportunities
  - Cross-sector partnerships
  - Adjacent market expansion
  - Value chain reconfiguration
  
  ### DIMENSION 6: COMPETITIVE DYNAMICS
  
  **Market Structure Evolution:**
  - Consolidation trends
  - Disruption patterns
  - New entrant strategies
  - Incumbent vulnerabilities
  - Partnership ecosystems
  - M&A activity patterns
  - Exit and failure analysis
  
  **Innovation Patterns:**
  - R&D investment trends
  - Patent filing patterns
  - Academic research directions
  - Startup formation rates
  - Venture capital flows
  - Corporate venture activity
  - Innovation cluster development
  
  ### DIMENSION 7: MARKET TIMING ANALYSIS
  
  **Why Now Factors:**
  - Technology cost curves reaching viability
  - Regulatory windows opening
  - Infrastructure reaching critical mass
  - Consumer behavior tipping points
  - Competitive dynamics creating openings
  - Economic conditions enabling new models
  - Social acceptance thresholds crossed
  
  **Market Signals & Leading Indicators:**
  - Early adopter market formation
  - Investment pattern shifts
  - Media coverage evolution
  - Search trend analysis
  - Conference and event themes
  - Academic publication trends
  - Patent application surges
  - Regulatory consultation papers
  
  ### DIMENSION 8: MARKET SIZING & VALIDATION
  
  **Addressable Market Analysis:**
  - Total Addressable Market (TAM) by segment
  - Market growth projections
  - Penetration rate analysis
  - Market share possibilities
  - Revenue pool distribution
  - Margin structure analysis
  - Customer concentration
  
  **Market Attractiveness Factors:**
  - Growth rate vs. market maturity
  - Competitive intensity
  - Barriers to entry
  - Customer switching costs
  - Regulatory complexity
  - Capital requirements
  - Technical difficulty
  
  ## OPPORTUNITY CATEGORIZATION
  
  ### By Market Type
  - Greenfield opportunities (new markets)
  - Market expansion plays
  - Market share capture
  - Business model innovation
  - Technology substitution
  - Geographic expansion
  - Channel development
  
  ### By Time Horizon
  - Immediate opportunities (market ready)
  - Near-term opportunities (1-2 year development)
  - Medium-term opportunities (2-5 year horizon)
  - Long-term bets (5+ year horizon)
  
  ### By Investment Required
  - Low capital opportunities
  - Moderate investment plays
  - Capital intensive ventures
  - Partnership-dependent opportunities
  
  ## RESEARCH METHODOLOGY
  
  ### Primary Intelligence Sources
  - Industry reports (Gartner, Forrester, IDC, CB Insights)
  - Market research firms (McKinsey, BCG, Bain, Deloitte)
  - Trade associations and industry groups
  - Government statistics and databases
  - Financial analyst reports
  - Patent databases
  - Academic research repositories
  - Conference proceedings
  
  ### Secondary Intelligence
  - Startup ecosystem monitoring
  - Venture capital investment tracking
  - M&A activity analysis
  - Regulatory filing analysis
  - Industry news and trade publications
  - Social media trend analysis
  - Search trend data
  - Job posting analysis
  
  ### Analysis Frameworks
  - Porter's Five Forces
  - PESTLE analysis
  - Technology S-curves
  - Crossing the Chasm model
  - Blue Ocean Strategy
  - Disruptive Innovation theory
  - Platform economy principles
  - Network effects analysis
  
  ## DELIVERABLES
  
  1. **Market Opportunity Catalog**
    - Comprehensive list of identified opportunities
    - Market size and growth projections
    - Competitive landscape assessment
    - Entry barrier analysis
  
  2. **Industry Trend Report**
    - Macro trends and implications
    - Technology convergence opportunities
    - Regulatory shift impacts
    - Timing and readiness assessment
  
  3. **Whitespace Analysis**
    - Market gap identification
    - Underserved segment mapping
    - Cross-industry opportunities
    - Market failure points
  
  4. **Market Intelligence Brief**
    - Key market signals
    - Leading indicators
    - Investment patterns
    - Competitive movements
  
  5. **Opportunity Prioritization Matrix**
    - Scoring and ranking
    - Risk-return profiles
    - Resource requirements
    - Strategic fit assessment
  
  ## SUCCESS METRICS
  
  - **Market Coverage:** Breadth of industries and segments analyzed
  - **Signal Detection:** Number of early indicators identified
  - **Whitespace Discovery:** Novel opportunities uncovered
  - **Data Quality:** Verification and triangulation of findings
  - **Trend Accuracy:** Alignment with market evolution
  - **Actionability:** Clarity of opportunity definition
  
  ## CRITICAL OUTPUT REQUIREMENTS
  
  - **Comprehensive Coverage:** Document all market opportunities
  - **Industry Context:** Macro forces and market dynamics
  - **Evidence-Based:** Data-driven opportunity identification
  - **Timing Analysis:** Why opportunities exist now
  - **Competitive Context:** Who else sees these opportunities
  - **Market Validation:** Size, growth, and accessibility metrics`;
  }