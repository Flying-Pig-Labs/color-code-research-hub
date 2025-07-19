import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionWrapper from "@/components/SectionWrapper";
import TeamCard from "@/components/TeamCard";
import { Button } from "@/components/ui/button";
import { Target, Bug, Lightbulb, Shield, Zap, Search } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-baby-blue flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <SectionWrapper className="pt-20 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-corporate shadow-smooth-lg">
              <Shield className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Strategic Research
            <span className="block text-primary">Intelligence Labs</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            Advanced competitive intelligence across three specialized domains. Our teams provide strategic insights for marketplace disruption, vendor replacement, and white space opportunities.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button variant="corporate" size="xl" className="gap-2">
              <Zap className="h-5 w-5" />
              Explore Research Teams
            </Button>
            <Button variant="outline" size="xl" className="gap-2">
              <Search className="h-5 w-5" />
              View Methodologies
            </Button>
          </div>
        </div>
      </SectionWrapper>

      {/* Teams Overview */}
      <SectionWrapper className="bg-muted/30">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Research Team Specializations
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each team brings unique expertise and methodologies to deliver comprehensive competitive intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
      
      <Footer />
    </div>
  );
};

export default Index;
