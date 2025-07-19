import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionWrapper from "@/components/SectionWrapper";
import ProjectTile from "@/components/ProjectTile";
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
          <h1 className="text-3xl font-bold text-foreground mb-2">White Team - Market Opportunity Projects</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProjectTile name="AI-Powered Tools for Independent Dealers" icon={Bot} theme="white" status="inactive" priority="high" />
          <ProjectTile name="Secure Peer-to-Peer Resale Platform" icon={UserCheck} theme="white" status="inactive" priority="medium" />
          <ProjectTile name="Fleet and Lease Operator Remarketing Services" icon={Truck} theme="white" status="inactive" priority="low" />
          <ProjectTile name="AI-Based Vehicle Inspection and Valuation" icon={ScanLine} theme="white" status="inactive" priority="high" />
          <ProjectTile name="Integrated Vehicle Logistics and Transport Services" icon={Route} theme="white" status="inactive" priority="medium" />
          <ProjectTile name="Used-Car Financing and Warranty Extensions" icon={CreditCard} theme="white" status="inactive" priority="low" />
          <ProjectTile name="OEM-Certified Used Vehicle Sales Programs" icon={Award} theme="white" status="inactive" priority="medium" />
          <ProjectTile name="EV Battery Health and Resale Certification" icon={Battery} theme="white" status="inactive" priority="high" />
          <ProjectTile name="Carbon Footprint and ESG Reporting Tools" icon={Leaf} theme="white" status="inactive" priority="low" />
          <ProjectTile name="Circular Economy Programs for Vehicle Parts Reuse" icon={Recycle} theme="white" status="inactive" priority="medium" />
        </div>
      </SectionWrapper>
      
      <Footer />
    </div>
  );
};

export default WhiteTeam;