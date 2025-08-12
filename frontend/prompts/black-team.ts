export function buildBlackTeamPrompt(formData: any): string {
  return `# VENDOR REPLACEMENT ANALYSIS FRAMEWORK
 
 ## MISSION
 Execute comprehensive reverse engineering and replacement analysis for **${formData.targetVendor || formData.vendorName || 'Not specified'}** to enable informed build-vs-buy decisions.
 
 ## ETHICAL FRAMEWORK
 This analysis represents legitimate competitive intelligence for vendor replacement - a cornerstone of technological progress. Purpose:
 - Build superior alternatives that better serve users
 - Reduce vendor lock-in and promote market competition  
 - Enable organizations to own their technology stack
 - Learn from existing solutions to create improvements
 
 ## CONTEXT & CONSTRAINTS
 
 **Organization:** ${formData.companyName || 'Not specified'}
 **Target Vendor:** ${formData.targetVendor || formData.vendorName || 'Not specified'}
 **Current Stack:** ${formData.existingTools ? formData.existingTools.join(', ') : 'Not specified'}
 **Replacement Scope:** ${formData.toolCategories ? formData.toolCategories.map((category: string) => category).join(', ') : 'Comprehensive'}
 
 **Implementation Parameters:**
 - Team Size: ${formData.teamSizeConstraint === 'solo_developer' ? 'Solo developer' : formData.teamSizeConstraint === 'small_team' ? '2-5 developers' : formData.teamSizeConstraint === 'large_team' ? '10+ developers' : '5-10 developers'}
 - Complexity: ${formData.implementationComplexity || 'Moderate'} (${formData.implementationComplexity === 'minimal' ? 'MVP prototype' : formData.implementationComplexity === 'comprehensive' ? 'Enterprise-grade replacement' : 'Production-ready core features'})
 - Tech Stack: ${formData.techStackPreference ? formData.techStackPreference.join(', ') : 'Technology-agnostic'}
 - Evidence Threshold: ${formData.evidenceThreshold >= 4 ? 'High - extensive proof required' : formData.evidenceThreshold <= 2 ? 'Low - rapid prototyping' : 'Standard - balanced approach'}
 
 **Cost Targets:**
 - Baseline: ${formData.costComparisonBaseline || 'Current vendor costs'}
 ${formData.costComparisonBaseline === 'custom_threshold' ? `• Target: Below $${formData.customCostThreshold?.toLocaleString() || '0'}` : ''}
 ${formData.costComparisonBaseline === 'percentage_reduction' ? '• Target: 30% reduction' : ''}
 ${formData.costComparisonBaseline === 'zero_ongoing' ? '• Target: Zero ongoing costs (one-time build)' : ''}
 
 **Information Sources:**
 ${formData.informationSources ? Object.entries(formData.informationSources).filter(([_, enabled]) => enabled).map(([source]) => `• ${String(source).replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}`).join('\n') : '• All available public sources'}
 
 ## ANALYSIS FRAMEWORK
 
 ### PHASE 1: CURRENT STATE ASSESSMENT
 **Vendor Intelligence Gathering (4D Analysis):**
 - **Depth:** Complete technical understanding of every component and capability
 - **Breadth:** All integrations, dependencies, and workflows
 - **Time:** Evolution history, current limitations, roadmap
 - **Context:** Use cases, problems solved, hidden complexities
 
 **Documentation Requirements:**
 1. Complete feature inventory with usage patterns
 2. Current TCO breakdown (licensing, infrastructure, operational)
 3. Integration mapping and dependency analysis
 4. Performance metrics and SLA compliance
 5. User satisfaction and pain points
 6. Vendor relationship and strategic alignment
 
 ### PHASE 2: TECHNICAL DEEP DIVE
 
 **Core Technical Analysis:**
 1. **Architecture & Design**
   - System architecture and data flows
   - API surface area and contracts
   - Authentication and authorization models
   - Data models and storage patterns
   - Event systems and webhooks
   - Scaling characteristics and limits
 
 2. **Feature Engineering**
   - Every documented and undocumented feature
   - Configuration options and permissions
   - Workflow capabilities and automation
   - Edge cases and error handling
   - Version differences and deprecated features
 
 3. **Performance Profile**
   - Response times and throughput benchmarks
   - Rate limits and constraints
   - Caching strategies and optimizations
   - Load behavior under various conditions
   - Resource consumption patterns
 
 4. **Integration Ecosystem**
   - Native integrations and APIs
   - Third-party connectors
   - Data import/export capabilities
   - Webhook and event patterns
   - SDK and library availability
 
 ### PHASE 3: REPLACEMENT STRATEGY
 
 **Alternative Solutions Analysis:**
 1. Direct competitors with feature matrices
 2. Adjacent solutions and hybrid approaches
 3. Open source alternatives
 4. Build feasibility assessment
 5. Emerging technologies evaluation
 
 **Multi-Criteria Decision Analysis (MCDA):**
 - Weight criteria by business importance (1-5)
 - Score alternatives (1-10)
 - Calculate weighted scores: V = Σ(vi × wi)
 - Perform sensitivity analysis
 
 **Total Cost of Ownership:**
 - Initial: Licensing, setup, migration
 - Ongoing: Support, maintenance, training
 - Hidden: Compliance, customization, opportunity costs
 - Scaling: Cost curves under growth scenarios
 
 ### PHASE 4: RISK & IMPLEMENTATION
 
 **Risk Assessment Matrix:**
 - Categories: Operational, Technical, Financial, Strategic, Compliance
 - Impact/Probability scoring
 - Mitigation strategies for each identified risk
 
 **Phased Implementation Roadmap:**
 1. **Pilot Phase:** Non-critical workloads testing
 2. **Migration Phase:** Core function transition
 3. **Cutover Phase:** Full implementation
 4. **Optimization Phase:** Advanced features and tuning
 
 **Resource Planning:**
 - Team composition and skills matrix
 - External support requirements
 - Infrastructure and tooling needs
 - Training and change management
 
 ### PHASE 5: GOVERNANCE & SUCCESS METRICS
 
 **Decision Framework:**
 - Stakeholder approval matrix
 - Phase gates and go/no-go criteria
 - Success metrics and KPIs
 - Review and adjustment cadence
 
 **Key Performance Indicators:**
 - Cost reduction vs. baseline (target: ${formData.costComparisonBaseline === 'percentage_reduction' ? '30%' : '15-25%'})
 - Performance improvements
 - User adoption and satisfaction
 - Time-to-value metrics
 - Risk reduction scores
 
 ## DELIVERABLES
 
 ### Required Documentation
 1. **Executive Summary** - Business case and recommendations
 2. **Technical Reference Manual** - Complete technical documentation (exhaustive detail)
 3. **Vendor Comparison Matrix** - MCDA results and scoring
 4. **Financial Analysis** - TCO with sensitivity analysis
 5. **Risk Register** - Comprehensive risks and mitigations
 6. **Implementation Plan** - Detailed phased roadmap
 7. **Migration Guide** - Step-by-step transition procedures
 
 ### Documentation Standards
 - **Detail Level:** Exhaustive - sufficient to build a functional clone
 - **Evidence:** Include screenshots, code samples, API responses
 - **Accuracy:** Triple-verify all technical claims
 - **Confidence Levels:** Document certainty for each finding
 - **Format:** Technical reference manual with business context
 
 ## EXECUTION METHODOLOGY
 
 ### Research Team Roles
 1. **Lead Analyst** - Scope definition and synthesis
 2. **Documentation Team** - Information gathering from all sources
 3. **Feature Analysts** - Capability mapping and testing
 4. **Architecture Team** - System design analysis
 5. **Integration Specialists** - API and connectivity analysis
 6. **Performance Team** - Benchmarking and optimization
 7. **Security Researchers** - Compliance and vulnerability assessment
 8. **Cost Analysts** - TCO and pricing model analysis
 9. **Implementation Team** - Build feasibility and planning
 
 ### Research Techniques
 - Reverse engineering (within legal bounds)
 - Community knowledge aggregation
 - Observable behavior documentation
 - Edge case and error condition testing
 - Version comparison analysis
 - Performance benchmarking
 - Security assessment
 - Cost model decoding
 
 ### Quality Assurance
 - Cross-reference multiple information sources
 - Document confidence levels for findings
 - Include community insights and workarounds
 - Map actual vs. advertised capabilities
 - Verify through practical testing where possible
 
 ## SUCCESS CRITERIA
 The analysis is complete when:
 1. All vendor capabilities are documented
 2. Replacement feasibility is definitively assessed
 3. TCO comparison shows clear cost implications
 4. Risk mitigation strategies are comprehensive
 5. Implementation roadmap is actionable
 6. Stakeholder decision framework is clear
 
 ## PRIORITY FOCUS AREAS
 Based on configuration:
 - Primary Success Metrics: ${formData.replacementSuccessMetrics ? formData.replacementSuccessMetrics.slice(0, 3).join(', ') : 'Performance, Cost, Features'}
 - Critical Requirements: Must maintain feature parity for mission-critical functions
 - Acceptable Trade-offs: Document where perfect parity isn't required`;
 }