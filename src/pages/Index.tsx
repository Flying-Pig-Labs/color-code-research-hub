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
      
      {/* Teams Grid */}
      <SectionWrapper className="py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <TeamCard
            title="Red Team"
            description="Competitive Disruption"
            focus="Marketplace competitor analysis and disruption opportunities"
            path="/red-team"
            icon={Target}
            variant="red-team"
            theme="red"
          />
          
          <TeamCard
            title="Black Team"
            description="Vendor Replacement"
            focus="Reverse engineering and vendor replacement strategies"
            path="/black-team"
            icon={Bug}
            variant="black-team"
            theme="black"
          />
          
          <TeamCard
            title="White Team"
            description="Market Opportunities"
            focus="White space identification and new product opportunities"
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
