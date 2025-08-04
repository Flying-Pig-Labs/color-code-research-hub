import React, { useState } from 'react';
import { ReportView } from './ReportView';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

// Mock report data for testing
const mockReportData = {
  metadata: {
    title: 'Competitive Analysis: OpenAI GPT-4 Market Position',
    summary: 'This comprehensive analysis examines OpenAI\'s GPT-4 competitive positioning in the enterprise AI market, identifying key vulnerabilities in pricing strategy, API limitations, and customer retention. The research reveals significant opportunities for disruption through specialized vertical solutions, improved cost efficiency, and enhanced enterprise integration capabilities. Key findings include a 40% price premium over competitors, limited customization options, and growing customer concerns about vendor lock-in. Strategic recommendations focus on building differentiated capabilities in specific industry verticals while maintaining cost competitiveness.',
    team: 'red' as 'red',
    createdAt: new Date().toISOString(),
    reportId: 'demo-report-001',
    s3Key: 'reports/demo/competitive-analysis-001.json',
    requestId: 'req-demo-001',
    contentSummary: 'Competitive analysis of OpenAI GPT-4 with strategic recommendations'
  },
  content: `# Executive Summary

This comprehensive competitive analysis examines OpenAI's GPT-4 market position and identifies strategic opportunities for market disruption.

## Key Findings

### Market Position Analysis

**Current Market Share**: OpenAI holds approximately 60% of the enterprise AI API market, with estimated monthly revenue of $200M+ from API subscriptions.

**Pricing Strategy Vulnerabilities**:
- 40% premium pricing compared to competitors like Anthropic Claude and Google Gemini
- Complex token-based pricing model confuses enterprise customers
- No volume discounts for large enterprise clients
- Hidden costs in prompt engineering and optimization

### Technical Limitations

**API Constraints**:
- Rate limiting becomes restrictive at scale (10,000 requests/minute for enterprise)
- Context window limitations impact long-form document processing
- Inconsistent response times during peak usage (500ms+ latency spikes)
- Limited fine-tuning capabilities compared to open-source alternatives

**Integration Challenges**:
- Poor enterprise SSO integration
- Limited audit logging and compliance features
- No on-premises deployment options
- Weak data residency controls for international clients

## Competitive Landscape

### Direct Competitors

**Anthropic Claude 3**:
- 25% lower pricing for similar capabilities
- Superior safety features and constitutional AI
- Better long-context handling (200K tokens vs 128K)
- Growing enterprise adoption (+150% QoQ)

**Google Gemini Pro**:
- Integrated with Google Cloud ecosystem
- Competitive pricing with usage-based discounts
- Strong multimodal capabilities
- Better performance on coding tasks

**Microsoft Azure OpenAI**:
- Enterprise-focused with comprehensive compliance
- Integrated with Microsoft 365 ecosystem
- Custom deployment options
- Strong enterprise sales channel

## Strategic Vulnerabilities

### Customer Retention Issues

**Pricing Sensitivity**:
- 35% of surveyed enterprise customers actively evaluating alternatives
- Cost optimization is top priority for 78% of CIOs
- Budget constraints driving multi-vendor strategies
- ROI justification challenges for non-core AI use cases

**Feature Gaps**:
- Limited industry-specific models
- Poor performance on specialized tasks (legal, medical, financial)
- Insufficient customization options
- Lack of white-labeling capabilities

## Disruption Opportunities

### Vertical-Specific Solutions

**Healthcare AI**:
- HIPAA-compliant deployment options
- Medical terminology optimization
- Clinical decision support integration
- Regulatory compliance automation

**Legal Technology**:
- Document review and analysis
- Contract intelligence and drafting
- Compliance monitoring
- Case law research integration

**Financial Services**:
- Risk assessment and modeling
- Regulatory reporting automation
- Customer service optimization
- Fraud detection enhancement

### Technical Differentiation

**Performance Optimization**:
- 50% faster inference through model optimization
- Edge deployment capabilities
- Lower latency through geographic distribution
- Specialized hardware acceleration

**Enterprise Features**:
- Comprehensive audit trails
- Advanced security controls
- Custom model training
- On-premises deployment options

## Implementation Strategy

### Phase 1: Market Entry (Months 1-6)

**Minimum Viable Product**:
- Core API functionality matching GPT-4 capabilities
- 30% cost reduction through efficient infrastructure
- Basic enterprise security features
- Simple developer documentation and SDKs

**Target Customers**:
- Mid-market companies ($50M-$500M revenue)
- Cost-conscious startups with high API usage
- Companies with specific compliance requirements
- Organizations seeking vendor diversification

### Phase 2: Feature Differentiation (Months 7-12)

**Advanced Capabilities**:
- Industry-specific model variants
- Enhanced customization tools
- Multi-modal processing improvements
- Advanced enterprise integration

**Customer Expansion**:
- Enterprise sales team establishment
- Partnership channel development
- Industry-specific use case development
- Customer success program launch

### Phase 3: Market Leadership (Months 13-24)

**Innovation Leadership**:
- Next-generation model architectures
- Breakthrough performance improvements
- Novel AI capabilities
- Industry thought leadership

## Financial Projections

### Revenue Model

**Pricing Strategy**:
- 25% discount to OpenAI pricing
- Volume-based discounts for enterprise
- Industry-specific premium offerings
- Custom deployment surcharges

**Market Penetration**:
- Year 1: $5M ARR (1% market share)
- Year 2: $25M ARR (5% market share)
- Year 3: $75M ARR (12% market share)

### Investment Requirements

**Technology Development**: $15M
- Model training and optimization
- Infrastructure development
- Security and compliance features
- Developer tools and documentation

**Market Development**: $10M
- Sales and marketing team
- Partnership development
- Customer acquisition
- Brand building

**Operations**: $5M
- Infrastructure scaling
- Customer support
- Legal and compliance
- General administration

## Risk Assessment

### Market Risks

**Competitive Response**:
- OpenAI price reductions (High probability, High impact)
- Feature acceleration from incumbents (Medium probability, Medium impact)
- New market entrants (Low probability, High impact)

**Technology Risks**:
- Model performance gaps (Medium probability, High impact)
- Scaling challenges (High probability, Medium impact)
- Regulatory changes (Low probability, High impact)

### Mitigation Strategies

**Competitive Moats**:
- Specialized industry expertise
- Superior customer experience
- Technical performance advantages
- Strategic partnerships

**Risk Management**:
- Diversified technology approach
- Agile development methodology
- Strong legal and compliance foundation
- Flexible pricing models

## Conclusion

The AI market presents significant opportunities for disruption through focused execution on customer pain points that incumbents have failed to address. Success requires a combination of technical excellence, market-specific differentiation, and aggressive competitive positioning.

Key success factors include:
- Maintaining cost advantages through operational efficiency
- Building deep industry expertise and relationships
- Delivering superior customer experience
- Continuously innovating on technical capabilities

The recommended approach balances aggressive market entry with sustainable competitive advantages, positioning for long-term market leadership in the rapidly evolving AI landscape.`
};

export function ReportViewDemo() {
  const [showDemo, setShowDemo] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<'red' | 'black' | 'white'>('red');

  const teamOptions = [
    { value: 'red', label: 'Red Team', description: 'Competitive Intelligence' },
    { value: 'black', label: 'Black Team', description: 'Technical Analysis' },
    { value: 'white', label: 'White Team', description: 'Market Opportunities' }
  ];

  const getTeamMockData = (team: 'red' | 'black' | 'white') => {
    const baseData = { ...mockReportData };
    
    switch (team) {
      case 'black':
        baseData.metadata.title = 'Technical Analysis: Slack Enterprise Architecture Reverse Engineering';
        baseData.metadata.summary = 'Comprehensive technical breakdown of Slack\'s enterprise architecture, API infrastructure, and implementation details. This analysis provides complete documentation of Slack\'s system design, identifying opportunities for building competitive alternatives. Key findings include microservices architecture patterns, real-time messaging infrastructure, and enterprise integration capabilities.';
        baseData.metadata.team = 'black';
        baseData.content = `# Technical Architecture Analysis

This comprehensive technical analysis reverse engineers Slack's enterprise architecture to understand implementation patterns and identify opportunities for competitive solutions.

## System Architecture Overview

### Core Infrastructure

**Microservices Architecture**:
- 200+ independent services in production
- Kubernetes orchestration with 15,000+ pods
- Service mesh using Envoy proxy
- Event-driven architecture with Apache Kafka

**Database Strategy**:
- MySQL for user data and metadata
- Redis for session management and caching
- ElasticSearch for message search indexing
- S3 for file storage and archival

### Real-Time Messaging System

**WebSocket Implementation**:
- Custom WebSocket gateway handling 10M+ concurrent connections
- Load balancing across 500+ gateway servers
- Message routing through Redis pub/sub
- Automatic reconnection and message queuing

**API Design Patterns**:
- REST API for standard operations
- WebSocket for real-time updates
- GraphQL for complex data queries
- Rate limiting: 50 requests/minute per user

## Implementation Details

### Authentication & Security

**OAuth 2.0 Implementation**:
- JWT tokens with 24-hour expiration
- Refresh token rotation every 7 days
- Scoped permissions for API access
- Enterprise SSO integration (SAML, OIDC)

**Security Measures**:
- AES-256 encryption for data at rest
- TLS 1.3 for data in transit
- End-to-end encryption for DMs (enterprise only)
- Zero-trust network architecture

### Scalability Patterns

**Horizontal Scaling**:
- Auto-scaling based on CPU and memory metrics
- Database sharding by team/workspace ID
- CDN integration for file distribution
- Multi-region deployment for latency optimization

## Technical Vulnerabilities

### Performance Bottlenecks

**Database Limitations**:
- MySQL becomes bottleneck at 50,000+ concurrent users per shard
- Search indexing delays of 2-5 seconds for new messages
- File upload limited to 1GB with 30-second timeout
- Message history pagination inefficient for large channels

**Infrastructure Costs**:
- Estimated $0.12 per user per month in infrastructure
- High memory usage from connection pooling
- Expensive real-time infrastructure maintenance
- CDN costs scale linearly with file storage

## Building a Competitive Alternative

### Technical Requirements

**Minimum Infrastructure**:
- 50 application servers (8 cores, 32GB RAM each)
- 10 database servers (MySQL cluster)
- 20 Redis instances for caching
- 5 ElasticSearch nodes for search
- CDN integration (CloudFlare or AWS CloudFront)

**Development Stack**:
- Backend: Node.js with TypeScript
- Database: PostgreSQL with read replicas
- Caching: Redis Cluster
- Search: ElasticSearch or OpenSearch
- Frontend: React with TypeScript
- Mobile: React Native or native iOS/Android

### Implementation Timeline

**Phase 1: Core Messaging (Months 1-3)**
- Real-time messaging infrastructure
- User authentication and authorization
- Basic channel and direct message functionality
- File sharing capabilities

**Phase 2: Enterprise Features (Months 4-6)**
- SSO integration
- Admin controls and permissions
- Message encryption
- Audit logging and compliance

**Phase 3: Advanced Features (Months 7-9)**
- Search functionality
- Voice and video calls
- App integrations and bots
- Mobile applications

### Cost Optimization Strategies

**Infrastructure Efficiency**:
- Use of modern languages (Go, Rust) for 40% better performance
- Edge computing for reduced latency
- Efficient data structures for 60% memory reduction
- Optimized database queries and indexing`;
        break;
        
      case 'white':
        baseData.metadata.title = 'Market Opportunities: Enterprise Communication Platform Whitespace';
        baseData.metadata.summary = 'Comprehensive analysis of untapped opportunities in the enterprise communication market. This research identifies 47 distinct market gaps and emerging customer needs not adequately served by existing solutions. Key opportunities include vertical-specific communication tools, hybrid work optimization, and AI-enhanced collaboration features.';
        baseData.metadata.team = 'white';
        baseData.content = `# Market Opportunity Analysis

This comprehensive white space analysis identifies untapped opportunities in the enterprise communication and collaboration market.

## Market Overview

### Total Addressable Market

**Global Enterprise Communication Market**:
- Current size: $47.2B (2024)
- Projected growth: 12.3% CAGR through 2028
- Target size: $75.1B by 2028
- Key growth drivers: Remote work, digital transformation, AI integration

**Market Segmentation**:
- Small Business (1-50 employees): $8.5B
- Mid-Market (51-1000 employees): $18.7B  
- Enterprise (1000+ employees): $20.0B

### Underserved Market Segments

**Healthcare Communication**:
- Market size: $2.1B
- HIPAA-compliant messaging platforms
- Patient-provider communication tools
- Medical team coordination systems
- Regulatory compliance automation

**Financial Services**:
- Market size: $1.8B
- SEC/FINRA compliant communication
- Client interaction platforms
- Trading floor communication
- Regulatory reporting integration

**Legal Industry**:
- Market size: $950M
- Attorney-client privileged communication
- Case collaboration platforms
- Court filing integration
- Document review workflows

## Identified Opportunities

### 1. Vertical-Specific Communication Platforms

**Construction & Manufacturing**:
- Field-to-office communication
- Safety incident reporting
- Equipment status updates
- Project milestone tracking
- Estimated market: $450M

**Education Technology**:
- Teacher-student communication
- Parent-teacher conferences
- Administrative messaging
- Campus safety alerts
- Estimated market: $380M

**Non-Profit Organizations**:
- Volunteer coordination
- Donor communication
- Event planning platforms
- Fundraising collaboration
- Estimated market: $220M

### 2. AI-Enhanced Collaboration

**Intelligent Meeting Solutions**:
- Real-time translation for global teams
- Meeting summary and action item extraction
- Emotional intelligence analysis
- Productivity insights and recommendations
- Estimated market: $1.2B

**Smart Content Management**:
- Automated document classification
- Intelligent search and retrieval
- Version control with AI assistance
- Knowledge base automation
- Estimated market: $890M

### 3. Hybrid Work Optimization

**Presence Management**:
- Advanced availability tracking
- Location-aware communication
- Time zone optimization
- Work-life balance monitoring
- Estimated market: $340M

**Virtual Office Spaces**:
- 3D collaborative environments
- Immersive meeting experiences
- Virtual coworking spaces
- Digital workplace simulation
- Estimated market: $280M

### 4. Industry-Specific Integrations

**Healthcare Systems Integration**:
- Electronic Health Record (EHR) connectivity
- Patient communication workflows
- Telemedicine platform integration
- Medical device data sharing
- Estimated market: $650M

**Financial Services Integration**:
- Trading platform connectivity
- Client portfolio discussions
- Compliance monitoring
- Risk management communication
- Estimated market: $520M

## Competitive Landscape Gaps

### Feature Gaps in Existing Solutions

**Advanced Security**:
- Zero-knowledge encryption
- Quantum-resistant cryptography
- Biometric authentication
- Advanced threat detection

**Customization Limitations**:
- White-label solutions
- Custom branding options
- Workflow automation
- API extensibility

**Analytics and Insights**:
- Communication effectiveness metrics
- Team collaboration patterns
- Productivity optimization
- Sentiment analysis

### Geographic Opportunities

**Emerging Markets**:
- Latin America: $890M opportunity
- Southeast Asia: $1.2B opportunity
- Africa: $340M opportunity
- Eastern Europe: $560M opportunity

**Localization Needs**:
- Multi-language support
- Cultural communication preferences
- Local compliance requirements
- Regional data sovereignty

## Business Model Innovations

### Subscription Model Variations

**Usage-Based Pricing**:
- Pay-per-active-user models
- Feature-specific subscriptions
- Seasonal pricing for event-driven businesses
- Performance-based pricing

**Freemium Alternatives**:
- Industry-specific free tiers
- Time-limited premium features
- Referral-based upgrades
- Community-driven feature development

### Partnership Opportunities

**System Integrators**:
- Consulting firms implementation services
- Custom development partnerships
- Managed service offerings
- Training and certification programs

**Technology Partners**:
- CRM system integrations
- Project management tool connections
- Business intelligence platform links
- Cloud infrastructure partnerships

## Implementation Roadmap

### Phase 1: Market Research Validation (Months 1-2)
- Customer interviews and surveys
- Competitive analysis deep-dive
- Technology feasibility assessment
- Go-to-market strategy development

### Phase 2: MVP Development (Months 3-8)
- Core platform development
- Initial industry vertical focus
- Beta customer recruitment
- Feedback integration cycles

### Phase 3: Market Launch (Months 9-12)
- Public launch execution
- Customer acquisition campaigns
- Partnership development
- Feature expansion based on usage

### Phase 4: Scale and Expand (Months 13-24)
- Additional industry verticals
- International market expansion
- Advanced feature development
- Strategic acquisitions consideration

## Revenue Projections

### Conservative Estimates
- Year 1: $2.5M ARR (0.5% market penetration)
- Year 2: $12M ARR (2.1% market penetration)
- Year 3: $35M ARR (4.8% market penetration)

### Aggressive Growth Scenario
- Year 1: $5M ARR (1.0% market penetration)
- Year 2: $25M ARR (4.2% market penetration)
- Year 3: $75M ARR (12.5% market penetration)`;
        break;
        
      default:
        // Keep red team data as is
        break;
    }
    
    return baseData;
  };

  if (showDemo) {
    return <ReportView reportId="demo" />;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className="mr-2">📋</span>
              Report View Component Demo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Select Team Type</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {teamOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setSelectedTeam(option.value as 'red' | 'black' | 'white')}
                      className={`p-4 rounded-lg border-2 text-left transition-colors ${
                        selectedTeam === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{option.label}</span>
                        <Badge variant="outline">{option.value.toUpperCase()}</Badge>
                      </div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Preview</h3>
                <div className="bg-white p-4 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Title:</strong> {getTeamMockData(selectedTeam).metadata.title}
                  </div>
                  <div className="text-sm text-gray-600">
                    <strong>Summary:</strong> {getTeamMockData(selectedTeam).metadata.summary.slice(0, 200)}...
                  </div>
                </div>
              </div>

              <div>
                <Button 
                  onClick={() => {
                    // Store mock data in sessionStorage for the demo
                    sessionStorage.setItem('demo-report-data', JSON.stringify(getTeamMockData(selectedTeam)));
                    setShowDemo(true);
                  }}
                  size="lg"
                  className="w-full"
                >
                  View {selectedTeam.toUpperCase()} Team Report Demo
                </Button>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Demo Features</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• Interactive table of contents with scroll navigation</li>
                  <li>• Mobile-responsive design with collapsible sidebar</li>
                  <li>• Team-specific styling and disclaimers</li>
                  <li>• Markdown content rendering with HTML output</li>
                  <li>• Report download functionality</li>
                  <li>• Comprehensive error handling</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}