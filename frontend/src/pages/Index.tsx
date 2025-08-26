/**
 * @fileoverview Main Research page for truflr.ai.
 * 
 * Streamlined research interface featuring a single unified form that combines
 * competitive intelligence and market research. Implements hash-based navigation
 * for switching between research form and information sections.
 * 
 * Features:
 * - Single streamlined research form (combines Red/White team capabilities)
 * - "Describe the forest" approach for comprehensive market analysis
 * - Real-time pipeline job monitoring
 * - Research report history and access
 * - Clean Swiss design with pig theming
 * - Hash-based navigation between sections
 * 
 * Research Focus:
 * - Market analysis and competitive intelligence
 * - Product opportunity discovery  
 * - Strategic positioning insights
 * 
 * @author truflr.ai Team
 * @version 2.0.0
 */

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { ResearchReportHistory } from "@/components/ResearchReportHistory";
import { CircleHelp, Search, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from "lucide-react";
import { MermaidDiagram } from "@/components/MermaidDiagram";

/**
 * Main Research page component for streamlined product discovery.
 * 
 * Provides unified research interface, job monitoring, and navigation
 * between research form and help sections. Uses hash-based routing for
 * smooth transitions between content sections.
 * 
 * @returns {JSX.Element} Complete research interface with streamlined form
 */
const Index = () => {
  const [howModalOpen, setHowModalOpen] = useState(false);
  const [forestDescription, setForestDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industryFocus, setIndustryFocus] = useState("");
  
  const navItems = [
    { 
      path: "#", 
      label: "How", 
      icon: CircleHelp, 
      variant: "ghost" as const,
      onClick: () => setHowModalOpen(true)
    },
  ];

  // Handle research form submission (hits Red Team API)
  const handleSubmitResearch = async () => {
    // TODO: Implement API call to Red Team endpoint
    console.log("Submitting research request:", {
      forestDescription,
      companyName,
      industryFocus
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        title="Research"
        subtitle="Product Discovery Intelligence"
        icon={<Search className="h-6 w-6" />}
        showHealthCheck={false}
        navItems={navItems}
      />
      

      {/* Streamlined Research Form - The main interface */}
        <section className="py-12 lg:py-20">
          <div className="max-w-4xl mx-auto px-6">
            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-8">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmitResearch(); }} className="space-y-8">
                  {/* Main "Describe the forest" field */}
                  <div>
                    <Label htmlFor="forest" className="text-lg font-heading font-semibold text-foreground mb-2 block">
                      Launch a truffle hunt
                    </Label>
                    <Textarea
                      id="forest"
                      value={forestDescription}
                      onChange={(e) => setForestDescription(e.target.value)}
                      placeholder="Tell us about the market landscape, competitive environment, or product space you want to explore..."
                      className="min-h-[120px] text-base"
                      required
                    />
                  </div>

                  {/* Key data points - streamlined */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="company" className="font-medium text-foreground mb-2 block">
                        Company/Project Name
                      </Label>
                      <Input
                        id="company"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Your company or project"
                        className="text-base"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="industry" className="font-medium text-foreground mb-2 block">
                        Industry Focus
                      </Label>
                      <Input
                        id="industry"
                        value={industryFocus}
                        onChange={(e) => setIndustryFocus(e.target.value)}
                        placeholder="e.g., SaaS, Healthcare, FinTech"
                        className="text-base"
                      />
                    </div>
                  </div>

                  {/* Submit button */}
                  <div className="flex justify-center pt-4">
                    <Button 
                      type="submit" 
                      size="lg"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground px-8"
                      disabled={!forestDescription.trim()}
                    >
                      Start Research Hunt
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>


      {/* Research History Section - Clean, spacious layout */}
      <div className="max-w-6xl mx-auto px-6">
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-8">
            <ResearchReportHistory limit={10} />
          </CardContent>
        </Card>
      </div>

      {/* How Modal */}
      <Dialog open={howModalOpen} onOpenChange={setHowModalOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How truflr.ai Ideation Works</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Mermaid Diagram */}
            <div className="w-full overflow-x-auto">
              <MermaidDiagram 
                chart={`graph LR
    A["📄 RESEARCH<br/>ANALYSIS<br/><br/>• Market docs<br/>• Claude insights<br/>• Key themes"] --> B["🔍 DISCOVERY<br/><br/>• Reddit mining<br/>• Pain discovery<br/>• Jobs-to-be-done<br/>• User problems"]
    B --> C["🎯 ANALYSIS<br/><br/>• AI clustering<br/>• Zone scoring<br/>• Perplexity AI<br/>• Market intel"]
    C --> D["💡 IDEATION<br/><br/>• 10 product concepts<br/>• Strategic fit<br/>• Evidence-based<br/>• Validated ideas"]
    D --> E["📊 PORTFOLIO<br/><br/>• Market sizing<br/>• Risk analysis<br/>• Roadmaps<br/>• Exec summary"]
    F["Raw Research Data"] -.-> G["Authentic User Needs"]
    G -.-> H["Strategic Opportunities"]
    H -.-> I["Validated Ideas"]
    I -.-> J["Innovation Portfolio"]
    style A fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style B fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style C fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style D fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style E fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style F fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style G fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style H fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style I fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style J fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    classDef outcome fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    class J outcome`}
                id="ideation-flow"
              />
            </div>
            
            {/* Outcome Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="font-mono text-sm">
                <div className="border-b border-gray-300 pb-2 mb-2">
                  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
                </div>
                <div className="text-center py-2">
                  │  🚀 <strong>OUTCOME:</strong> From scattered market research to 10 prioritized, evidence-backed product opportunities in hours   │
                </div>
                <div className="border-t border-gray-300 pt-2">
                  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                </div>
              </div>
            </div>

            {/* Key Value Propositions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Key Value Propositions:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600">Speed:</span>
                  <span>Hours vs. months of traditional market research</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600">Authenticity:</span>
                  <span>Real user problems from Reddit conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600">Intelligence:</span>
                  <span>AI-powered strategic analysis with market validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600">Precision:</span>
                  <span>Exactly 10 prioritized opportunities with implementation guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600">Evidence:</span>
                  <span>Every idea backed by quantified user demand and competitive analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Index;
