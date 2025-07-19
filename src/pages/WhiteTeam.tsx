import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionWrapper from "@/components/SectionWrapper";
import OpportunityTile from "@/components/OpportunityTile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Compass, Sparkles, Map, ArrowRight, Shield, Bot, UserCheck, Truck, ScanLine, Route, CreditCard, Award, Battery, Leaf, Recycle } from "lucide-react";

const WhiteTeam = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Market Opportunities */}
      <SectionWrapper className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">White Team - Market Opportunities</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <OpportunityTile 
            title="AI-Powered Tools for Independent Dealers" 
            icon={Bot}
          />
          <OpportunityTile 
            title="Secure Peer-to-Peer Resale Platform" 
            icon={UserCheck}
          />
          <OpportunityTile 
            title="Fleet and Lease Operator Remarketing Services" 
            icon={Truck}
          />
          <OpportunityTile 
            title="AI-Based Vehicle Inspection and Valuation" 
            icon={ScanLine}
          />
          <OpportunityTile 
            title="Integrated Vehicle Logistics and Transport Services" 
            icon={Route}
          />
          <OpportunityTile 
            title="Used-Car Financing and Warranty Extensions" 
            icon={CreditCard}
          />
          <OpportunityTile 
            title="OEM-Certified Used Vehicle Sales Programs" 
            icon={Award}
          />
          <OpportunityTile 
            title="EV Battery Health and Resale Certification" 
            icon={Battery}
          />
          <OpportunityTile 
            title="Carbon Footprint and ESG Reporting Tools" 
            icon={Leaf}
          />
          <OpportunityTile 
            title="Circular Economy Programs for Vehicle Parts Reuse" 
            icon={Recycle}
          />
        </div>
      </SectionWrapper>
      
      <Footer />
    </div>
  );
};

export default WhiteTeam;