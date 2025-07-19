import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionWrapper from "@/components/SectionWrapper";
import CompanyTile from "@/components/CompanyTile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Code, Wrench, Database, ArrowRight, Shield, Cloud, Scan, Cpu, FileText, Zap, Home, Settings, Truck, Archive, Network } from "lucide-react";

const BlackTeam = () => {
  return (
    <div className="min-h-screen bg-black-team-bg-dark text-black-team-text-light flex flex-col">
      <Header />
      
      {/* Vendor Analysis */}
      <SectionWrapper className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black-team-text-light mb-2">Black Team - Vendor Systems</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <CompanyTile name="Salesforce" icon={Cloud} theme="black" />
          <CompanyTile name="UVeye" icon={Scan} theme="black" />
          <CompanyTile name="Alfa Systems" icon={Cpu} theme="black" />
          <CompanyTile name="Experian AutoCheck" icon={FileText} theme="black" />
          <CompanyTile name="Recurrent" icon={Zap} theme="black" />
          <CompanyTile name="Treehouse" icon={Home} theme="black" />
          <CompanyTile name="RepairPal" icon={Settings} theme="black" />
          <CompanyTile name="Oracle OTM" icon={Truck} theme="black" />
          <CompanyTile name="Cass Information Services" icon={Archive} theme="black" />
          <CompanyTile name="Reltio" icon={Network} theme="black" />
        </div>
      </SectionWrapper>
      
      <Footer />
    </div>
  );
};

export default BlackTeam;