/**
 * @fileoverview Main dashboard page for the Wayfinder tab (formerly Research).
 * 
 * Central hub for research team coordination featuring team selection cards,
 * pipeline job monitoring, and historical report access. Implements hash-based
 * navigation for seamless switching between team overview and how-to content.
 * 
 * Features:
 * - Three research teams (Red, Black, White) with distinct capabilities
 * - Real-time pipeline job status monitoring
 * - Research report history and access
 * - Responsive CarMax-themed design
 * - Hash-based navigation between sections
 * 
 * Teams Overview:
 * - Red Team: Market disruption and competitive analysis
 * - Black Team: Deep technical research and vulnerability assessment  
 * - White Team: Go-to-market strategy and user adoption
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import SectionWrapper from "@/components/SectionWrapper";
import TeamCard from "@/components/TeamCard";
import { ResearchReportHistory } from "@/components/ResearchReportHistory";
import { PipelineJobsTable } from "@/components/PipelineJobsTable";
import { Target, Bug, Lightbulb, CircleHelp, ShipWheel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

/**
 * Main dashboard page component for research team coordination.
 * 
 * Provides team selection interface, job monitoring, and navigation
 * between different functional areas. Uses hash-based routing for
 * smooth transitions between content sections.
 * 
 * @returns {JSX.Element} Complete dashboard interface with team cards and monitoring
 */
const Index = () => {
  const [showHow, setShowHow] = useState(false);
  
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
    { path: "#", label: "Teams", icon: ShipWheel, variant: "ghost" as const },
    { path: "#how", label: "How", icon: CircleHelp, variant: "ghost" as const },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        showHealthCheck={false}
        navItems={navItems}
      />
      
      {/* Clean, spacious hero section - Swiss design principles */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <div className="flex justify-center mb-8">
            <span className="text-6xl animate-float">🌌</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-heading font-bold text-foreground mb-6 leading-tight tracking-tight">
            Wayfinder
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-4 leading-relaxed max-w-3xl mx-auto font-light">
            Advanced competitive intelligence across three specialized domains.
          </p>
        </div>
      </section>

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
                    <h3 className="font-heading font-semibold text-foreground mb-4 text-2xl">How Wayfinder Works</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <p className="leading-relaxed text-lg">
                        [How It Works content will be added here]
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* Teams Overview - Clean grid with lots of breathing room */}
      <section className="py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            <TeamCard
              title="Red Team"
              description="Competitive Disruption Specialists"
              focus="Focused on analyzing marketplace competitors and identifying disruption opportunities through strategic competitive intelligence and market positioning analysis."
              path="/red-team"
              icon={Target}
              variant="red-team"
              theme="red"
            />
            
            <TeamCard
              title="Black Team"
              description="Vendor Replacement Engineers"
              focus="Specialized in reverse engineering software solutions and identifying vendor replacement strategies through technical analysis and implementation pathways."
              path="/black-team"
              icon={Bug}
              variant="black-team"
              theme="black"
            />
            
            <TeamCard
              title="White Team"
              description="Market Opportunity Researchers"
              focus="Dedicated to identifying competitive white space and developing new product opportunities through market gap analysis and innovation research, so you can get to the puck before your competition."
              path="/white-team"
              icon={Lightbulb}
              variant="white-team"
              theme="white"
            />
          </div>
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
