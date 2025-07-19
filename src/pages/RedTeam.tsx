import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SectionWrapper from "@/components/SectionWrapper";
import CompanyTile from "@/components/CompanyTile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Users, BarChart3, ArrowRight, Shield, Car, Building2, Truck } from "lucide-react";

const RedTeam = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Competitor Analysis */}
      <SectionWrapper className="py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Red Team - Marketplace Competitors</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <CompanyTile name="Carvana" icon={Car} theme="red" />
          <CompanyTile name="Vroom" icon={Car} theme="red" />
          <CompanyTile name="Shift (ex-Lithia)" icon={Building2} theme="red" />
          <CompanyTile name="AutoNation" icon={Building2} theme="red" />
          <CompanyTile name="Driveway (Lithia)" icon={Car} theme="red" />
          <CompanyTile name="Enterprise" icon={Truck} theme="red" />
        </div>
      </SectionWrapper>
      
      <Footer />
    </div>
  );
};

export default RedTeam;