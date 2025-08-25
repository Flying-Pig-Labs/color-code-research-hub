import Header from "@/components/Header";

import SectionWrapper from "@/components/SectionWrapper";
import BlackResearchSwarmForm from "@/components/BlackResearchSwarmForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Code, Wrench, Database, ArrowRight, Shield, Skull, Layers, KeyRound, Building } from "lucide-react";

const BlackTeam = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <SectionWrapper className="pt-16 bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gray-900 shadow-xl">
              <Bug className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Black Team Research
            <span className="block text-gray-200">4D Vendor Archaeology</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Deploy an elite swarm of code archaeologists, architecture analysts, and security researchers. We don't just analyze vendors – we <span className="font-semibold text-white">excavate their fossils</span>, design <span className="font-semibold text-white">evil twin lock-ins</span>, and craft <span className="font-semibold text-white">shadow migration paths</span> so stealthy the vendor won't know until it's too late.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
              <Skull className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Evil Twin Analysis</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
              <Layers className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">5-Layer Excavation</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
              <KeyRound className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Trojan Horse Features</span>
            </div>
          </div>
          
          <BlackResearchSwarmForm>
            <Button size="xl" className="gap-2 bg-white text-gray-900 hover:bg-gray-100 shadow-lg">
              <Bug className="h-5 w-5" />
              Launch Research Swarm
            </Button>
          </BlackResearchSwarmForm>
        </div>
      </SectionWrapper>


      {/* What Makes This Special */}
      <SectionWrapper className="bg-gray-100">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Beyond Traditional Vendor Analysis</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We don't just document features – we perform <span className="font-semibold">archaeological excavations</span>, design <span className="font-semibold">customer betrayal fantasies</span>, and engineer <span className="font-semibold">open-source fork manifestos</span> that reveal true replacement paths.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-gray-300 hover:border-gray-500 transition-all hover:shadow-xl bg-white">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mb-3 shadow-md">
                <Skull className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-gray-900">Evil Twin Lock-ins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Design the most insidious vendor trap possible. Hidden dependencies, Hotel California features, data hostage scenarios. Then INVERT to find escape routes.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-gray-300 hover:border-gray-500 transition-all hover:shadow-xl bg-white">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mb-3 shadow-md">
                <Building className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-gray-900">5-Layer Archaeology</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Surface marketing lies. Documentation artifacts. Core architecture. Dead code fossils. Original design prisons they can't escape. Each layer reveals weaknesses.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-gray-300 hover:border-gray-500 transition-all hover:shadow-xl bg-white">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center mb-3 shadow-md">
                <span className="text-white text-lg">🥷</span>
              </div>
              <CardTitle className="text-gray-900">Shadow Migrations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Trojan horse features that secretly replace core functions. Department-by-department conquest. API wrappers that hollow out vendors. Stealth until it's too late.
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
      
      
    </div>
  );
};

export default BlackTeam;