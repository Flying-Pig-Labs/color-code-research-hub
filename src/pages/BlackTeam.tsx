import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionWrapper from "@/components/SectionWrapper";
import ProjectTile from "@/components/ProjectTile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Code, Wrench, Database, ArrowRight, Shield, Cloud, Scan, Cpu, FileText, Zap, Home, Settings, Truck, Archive, Network } from "lucide-react";

const BlackTeam = () => {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />
      
      {/* Vendor Analysis */}
      <SectionWrapper theme="black" className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Black Team - Vendor Replacement Projects</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <ProjectTile name="Salesforce" icon={Cloud} theme="black" status="inactive" priority="high" />
          <ProjectTile name="UVeye" icon={Scan} theme="black" status="inactive" priority="medium" />
          <ProjectTile name="Alfa Systems" icon={Cpu} theme="black" status="inactive" priority="low" />
          <ProjectTile name="Experian AutoCheck" icon={FileText} theme="black" status="inactive" priority="high" />
          <ProjectTile name="Recurrent" icon={Zap} theme="black" status="inactive" priority="medium" />
          <ProjectTile name="Treehouse" icon={Home} theme="black" status="inactive" priority="low" />
          <ProjectTile name="RepairPal" icon={Settings} theme="black" status="inactive" priority="medium" />
          <ProjectTile name="Oracle OTM" icon={Truck} theme="black" status="inactive" priority="high" />
          <ProjectTile name="Cass Information Services" icon={Archive} theme="black" status="inactive" priority="low" />
          <ProjectTile name="Reltio" icon={Network} theme="black" status="inactive" priority="medium" />
        </div>
      </SectionWrapper>
      
      <Footer />
    </div>
  );
};

export default BlackTeam;