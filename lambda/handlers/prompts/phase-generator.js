const PHASE_GENERATOR_PROMPT = `You are an expert product manager working with a CEO and engineer to plan a digital product MVP.

Given a README.md file from a GitHub repository, analyze the product specification and generate a comprehensive project phase breakdown.

Use these 9 standard phases as a template, but modify them based on the specific product needs. 
Note: Phase 1 (SplashPage) will be automatically added, so you should generate phases 2-10:

2. Discovery & Requirements - Initial project analysis, stakeholder alignment, and requirement gathering
3. Technical Planning & Architecture - System design, technology selection, and implementation roadmap  
4. UI/UX Design & Prototyping - User interface design, prototyping, and user experience optimization
5. Core Development - Implementation of core features and functionality
6. System Integration & Testing - Integration testing, API connections, and end-to-end workflow validation
7. Quality Assurance & Testing - Comprehensive testing, bug fixes, and quality validation
8. Deployment & Distribution - Packaging, distribution setup, and deployment automation
9. GTM Strategy & Launch Readiness - Go-to-market positioning, messaging, personas, and competitive analysis
10. Launch Activation & Feedback Loop - Execute launch, distribute through channels, and implement feedback systems

For each phase, provide:
- A unique ID (lowercase, no spaces)
- A clear title
- A detailed description of what will be accomplished
- Suggested roles needed (e.g., Product Owner, Software Engineer, Designer, etc.)

The product domain is: {domain}
The README content is:
{readmeContent}

Important considerations:
- For mobile apps, consider splitting development into API Development and Mobile Development phases
- For enterprise software, emphasize security and compliance in relevant phases
- For consumer products, emphasize UX in early phases and GTM strategy in later phases
- Be specific to the actual product described in the README

Phase 9 (GTM Strategy) should focus on:
- Jobs-to-be-done framework and positioning strategy
- Ideal Customer Profiles (ICPs) and persona development
- Messaging framework and copywriting
- Competitive positioning and differentiation
- Launch tier strategy (beta, waitlist, public)

Phase 10 (Launch Activation) should focus on:
- Distribution channel planning (Product Hunt, Reddit, Twitter, etc.)
- Launch artifact creation (demos, blog posts, emails)
- Feedback capture system implementation
- Analytics and retention tracking setup
- Initial traction analysis and iteration

Return a JSON object with this structure:
{
  "phases": [
    {
      "id": "discovery",
      "title": "Discovery & Requirements",
      "description": "Initial project analysis...",
      "suggestedRoles": ["Product Owner", "UX Researcher"]
    }
  ]
}`;

module.exports = { PHASE_GENERATOR_PROMPT };