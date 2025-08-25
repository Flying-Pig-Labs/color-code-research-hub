/**
 * @fileoverview Main Research page for Truffle.
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
 * @author Truffle Team
 * @version 2.0.0
 */

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { ResearchReportHistory } from "@/components/ResearchReportHistory";
import { PipelineJobsTable } from "@/components/PipelineJobsTable";
import { CircleHelp, Search, FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";

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
  const [showHow, setShowHow] = useState(false);
  const [forestDescription, setForestDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industryFocus, setIndustryFocus] = useState("");
  
  // Toggle "How" section when hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setShowHow(window.location.hash === "#how");
    };
    
    handleHashChange(); // Check initial hash
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  
  const navItems = [
    { path: "#", label: "Research", icon: Search, variant: "ghost" as const },
    { path: "#how", label: "How", icon: CircleHelp, variant: "ghost" as const },
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
        icon="🔍"
        showHealthCheck={false}
        navItems={navItems}
      />
      
      {/* Clean, spacious hero section with pig theming */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-8">
            <span className="text-6xl animate-float">🔍</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-foreground mb-6 leading-tight tracking-tight">
            Research
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 leading-relaxed max-w-3xl mx-auto font-light">
            Discover hidden product opportunities through comprehensive market intelligence.
          </p>
        </div>
      </section>

      {/* Streamlined Research Form - The main interface */}
      {!showHow && (
        <section className="py-8 lg:py-16">
          <div className="max-w-4xl mx-auto px-6">
            <Card className="bg-card border-border shadow-card">
              <CardContent className="p-8">
                <form onSubmit={(e) => { e.preventDefault(); handleSubmitResearch(); }} className="space-y-8">
                  {/* Main "Describe the forest" field */}
                  <div>
                    <Label htmlFor="forest" className="text-lg font-heading font-semibold text-foreground mb-2 block">
                      Describe the forest
                    </Label>
                    <p className="text-muted-foreground mb-4 text-sm">
                      Truffle Pig performs best with a lay of the land
                    </p>
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
                      Start Research Hunt 🐷
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* How It Works Section - Clean and spacious */}
      {showHow && (
        <section className="py-16 bg-gradient-subtle">
          <div className="max-w-4xl mx-auto px-6">
            <Card className="bg-card border-border shadow-card">
              <CardContent className="pt-8 p-8">
                <div className="flex items-start gap-6">
                  <div className="p-3 rounded-lg bg-accent/10 flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground mb-6 text-2xl">How Truffle Research Works</h3>
                    <div className="space-y-6 text-muted-foreground">
                      <div>
                        <h4 className="font-heading font-semibold text-foreground mb-3 text-lg">1. Describe Your Forest</h4>
                        <p className="leading-relaxed">
                          Give Truffle a comprehensive view of your market landscape. The more context you provide about the competitive environment and opportunity space, the better insights you'll receive.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-heading font-semibold text-foreground mb-3 text-lg">2. AI-Powered Analysis</h4>
                        <p className="leading-relaxed">
                          Our advanced AI combines competitive intelligence techniques with market research to uncover hidden opportunities, competitive gaps, and strategic positioning insights.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-heading font-semibold text-foreground mb-3 text-lg">3. Actionable Intelligence</h4>
                        <p className="leading-relaxed">
                          Receive detailed reports with market analysis, competitor positioning, opportunity identification, and strategic recommendations you can act on immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Research History Section - Clean, spacious layout */}
      <section className="py-16 lg:py-20 bg-gradient-subtle">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-center mb-12 text-foreground">Recent Research Reports</h2>
          <Card className="bg-card border-border shadow-card">
            <CardContent className="p-8">
              <ResearchReportHistory limit={10} />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pipeline Jobs Section - Clean, consistent with rest of design */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <Card className="bg-card border-border shadow-card">
            <CardContent className="p-8">
              <PipelineJobsTable />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Index;
