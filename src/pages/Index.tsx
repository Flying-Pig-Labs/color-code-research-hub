import Header from "@/components/Header";

import SectionWrapper from "@/components/SectionWrapper";
import TeamCard from "@/components/TeamCard";
import ResearchSubTabs from "@/components/ResearchSubTabs";
import RunsDashboard from "@/components/runs/RunsDashboard";
import { Button } from "@/components/ui/button";
import { Target, Bug, Lightbulb, Shield, Zap, Search } from "lucide-react";

const Index = () => {
  const teamsContent = (
    <>
      {/* Hero Section with CarMax Fading */}
      <SectionWrapper className="pt-20 pb-16 bg-gradient-carmax-hero relative overflow-hidden">
        {/* Decorative fading elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-carmax-blue rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-carmax-yellow rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-carmax-blue rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        </div>
        
        <div className="text-center max-w-4xl mx-auto relative z-10">
          <div className="flex justify-center mb-6">
            <span className="text-8xl">🧬</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Strategic Research
          </h1>
          <pre className="text-primary font-mono text-xs sm:text-sm md:text-base lg:text-lg mx-auto whitespace-pre mb-6">
{`▗▄▄▄▖▗▖  ▗▖▗▄▄▄▖▗▄▄▄▖▗▖   ▗▖   ▗▄▄▄▖ ▗▄▄▖▗▄▄▄▖▗▖  ▗▖ ▗▄▄▖▗▄▄▄▖    ▗▖    ▗▄▖ ▗▄▄▖ 
  █  ▐▛▚▖▐▌  █  ▐▌   ▐▌   ▐▌     █  ▐▌   ▐▌   ▐▛▚▖▐▌▐▌   ▐▌       ▐▌   ▐▌ ▐▌▐▌ ▐▌
  █  ▐▌ ▝▜▌  █  ▐▛▀▀▘▐▌   ▐▌     █  ▐▌▝▜▌▐▛▀▀▘▐▌ ▝▜▌▐▌   ▐▛▀▀▘    ▐▌   ▐▛▀▜▌▐▛▀▚▖
▗▄█▄▖▐▌  ▐▌  █  ▐▙▄▄▖▐▙▄▄▖▐▙▄▄▖▗▄█▄▖▝▚▄▞▘▐▙▄▄▖▐▌  ▐▌▝▚▄▄▖▐▙▄▄▖    ▐▙▄▄▖▐▌ ▐▌▐▙▄▞▘`}
          </pre>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            Advanced competitive intelligence across three specialized domains. Our teams provide strategic insights for marketplace disruption, vendor replacement, and white space opportunities.
          </p>
          
        </div>
      </SectionWrapper>

      {/* Teams Overview */}
      <SectionWrapper className="bg-gradient-carmax-fade relative">
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
            focus="Dedicated to identifying competitive white space and developing new product opportunities through market gap analysis and innovation research."
            path="/white-team"
            icon={Lightbulb}
            variant="white-team"
            theme="white"
          />
        </div>
      </SectionWrapper>
    </>
  );

  return (
    <div className="min-h-screen bg-gradient-carmax-fade flex flex-col">
      <Header />
      
      <ResearchSubTabs 
        teamsContent={teamsContent}
        runsContent={<RunsDashboard />}
      />
    </div>
  );
};

export default Index;
