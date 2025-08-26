/**
 * @fileoverview Main Research page for Truflr.ai.
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
 * @author Truflr.ai Team
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

      {/* How Modal */}
      <Dialog open={howModalOpen} onOpenChange={setHowModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>How Truflr.ai Research Works</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-lg">Hello world</p>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Index;
