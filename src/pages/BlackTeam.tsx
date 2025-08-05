import Header from "@/components/Header";

import SectionWrapper from "@/components/SectionWrapper";
import ResearchRequestTableActive from "@/components/ResearchRequestTableActive";
import { ResearchReportHistory } from "@/components/ResearchReportHistory";
import BlackResearchSwarmForm from "@/components/BlackResearchSwarmForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bug, Code, Wrench, Database, ArrowRight, Shield } from "lucide-react";

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
            <span className="block text-gray-200">Vendor Replacement Engineering</span>
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Specialized reverse engineering and vendor replacement strategies through technical analysis and systematic implementation pathways.
          </p>
          
          <BlackResearchSwarmForm>
            <Button size="xl" className="gap-2 bg-white text-gray-900 hover:bg-gray-100 shadow-lg">
              <Bug className="h-5 w-5" />
              ⚫ Launch Research Swarm
            </Button>
          </BlackResearchSwarmForm>
        </div>
      </SectionWrapper>

      {/* Active Research Jobs */}
      <SectionWrapper className="bg-white py-6">
        <ResearchRequestTableActive teamType="black" />
      </SectionWrapper>

      {/* Research History */}
      <SectionWrapper className="bg-white py-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <ResearchReportHistory team="black" />
        </div>
      </SectionWrapper>


      {/* Methodologies */}
      <SectionWrapper className="bg-gray-100">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Engineering Methodologies</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Our systematic approach to vendor replacement engineering
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center border-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-gray-900">
                  <Bug className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-white">System Analysis</CardTitle>
              <CardDescription className="text-gray-400">
                Comprehensive reverse engineering and system architecture analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                Learn More <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-gray-900">
                  <Code className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-white">Code Engineering</CardTitle>
              <CardDescription className="text-gray-400">
                Advanced code analysis and alternative implementation development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                Learn More <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-gray-300 bg-gray-800 hover:bg-gray-700 transition-colors">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-gray-900">
                  <Wrench className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-white">Implementation</CardTitle>
              <CardDescription className="text-gray-400">
                Strategic implementation planning and migration pathway development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="gap-2 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white">
                Learn More <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
      
      
    </div>
  );
};

export default BlackTeam;