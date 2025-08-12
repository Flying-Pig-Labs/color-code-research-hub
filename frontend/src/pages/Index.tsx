import { useState, useEffect } from "react";
import Header from "@/components/Header";
import SectionWrapper from "@/components/SectionWrapper";
import TeamCard from "@/components/TeamCard";
import { ResearchReportHistory } from "@/components/ResearchReportHistory";
import { PipelineJobsTable } from "@/components/PipelineJobsTable";
import { Target, Bug, Lightbulb, CircleHelp, ShipWheel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

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
    <div className="min-h-screen bg-gradient-carmax-fade flex flex-col">
      <Header 
        showHealthCheck={false}
        navItems={navItems}
      />
      
      {/* Hero Section with CarMax Fading */}
      <SectionWrapper className="pt-8 pb-8 bg-gradient-carmax-hero relative overflow-hidden">
        {/* Decorative fading elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-carmax-blue rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-carmax-yellow rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-carmax-blue rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        </div>
        
        <div className="text-center max-w-4xl mx-auto relative z-10">
          <div className="flex justify-center mb-6">
            <span className="text-8xl">🌌</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            Wayfinder
          </h1>
          
          <p className="text-xl text-muted-foreground mb-4 leading-relaxed max-w-3xl mx-auto">
            Advanced competitive intelligence across three specialized domains.
          </p>
          
        </div>
      </SectionWrapper>

      {/* How It Works Section - Revealed on toggle */}
      {showHow && (
        <SectionWrapper className="py-8 bg-gradient-carmax-fade">
          <Card className="bg-carmax-yellow/10 border-carmax-yellow/30 max-w-4xl mx-auto">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-carmax-yellow/20">
                  <AlertCircle className="h-6 w-6 text-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2 text-xl">How Wayfinder Works</h3>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    {/* Content to be filled in later */}
                    <p className="leading-relaxed">
                      [How It Works content will be added here]
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </SectionWrapper>
      )}

      {/* Teams Overview */}
      <SectionWrapper className="pt-4 bg-gradient-carmax-fade relative">
        {/* Subtle fading background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-carmax-yellow rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-carmax-blue rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
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
      </SectionWrapper>

      {/* Research History Section */}
      <SectionWrapper className="py-12 bg-gradient-carmax-fade">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-8 text-foreground">Recent Research Reports</h2>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <ResearchReportHistory limit={10} />
          </div>
        </div>
      </SectionWrapper>

      {/* Pipeline Jobs Section */}
      <SectionWrapper className="py-12 bg-gradient-carmax-fade">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <PipelineJobsTable />
          </div>
        </div>
      </SectionWrapper>
    </div>
  );
};

export default Index;
