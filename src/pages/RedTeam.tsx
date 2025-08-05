import Header from "@/components/Header";

import SectionWrapper from "@/components/SectionWrapper";
import ResearchRequestTableActive from "@/components/ResearchRequestTableActive";
import { ResearchReportHistory } from "@/components/ResearchReportHistory";
import ResearchSwarmForm from "@/components/ResearchSwarmForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Users, BarChart3, ArrowRight, Shield } from "lucide-react";

const RedTeam = () => {
  return (
    <div className="min-h-screen bg-red-team-pink flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <SectionWrapper theme="red" className="pt-16 bg-gradient-red-pink">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-red-team shadow-smooth-lg">
              <Target className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Red Team Research
            <span className="block text-white/90">Competitive Disruption</span>
          </h1>
          
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            Strategic analysis of marketplace competitors and identification of disruption opportunities through advanced competitive intelligence methodologies.
          </p>
          
          <ResearchSwarmForm>
            <Button variant="red-team" size="xl" className="gap-2">
              <Target className="h-5 w-5" />
              🔴 Launch Research Swarm
            </Button>
          </ResearchSwarmForm>
        </div>
      </SectionWrapper>

      {/* Active Research Jobs */}
      <SectionWrapper className="py-6">
        <ResearchRequestTableActive teamType="red" />
      </SectionWrapper>

      {/* Research History */}
      <SectionWrapper className="py-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <ResearchReportHistory team="red" />
        </div>
      </SectionWrapper>


      {/* Methodologies */}
      <SectionWrapper theme="red">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Research Methodologies</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our systematic approach to competitive disruption analysis
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center border-red-team/20">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-red-team/10">
                  <Target className="h-8 w-8 text-red-team" />
                </div>
              </div>
              <CardTitle className="text-red-team">Competitive Mapping</CardTitle>
              <CardDescription>
                Comprehensive mapping of competitive landscape and market positioning
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="gap-2">
                Learn More <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-red-team/20">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-red-team/10">
                  <TrendingUp className="h-8 w-8 text-red-team" />
                </div>
              </div>
              <CardTitle className="text-red-team">Market Analysis</CardTitle>
              <CardDescription>
                Deep dive analysis of market trends and competitive dynamics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="gap-2">
                Learn More <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-red-team/20">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-red-team/10">
                  <BarChart3 className="h-8 w-8 text-red-team" />
                </div>
              </div>
              <CardTitle className="text-red-team">Strategic Modeling</CardTitle>
              <CardDescription>
                Advanced modeling of disruption scenarios and strategic responses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="gap-2">
                Learn More <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
      
      
    </div>
  );
};

export default RedTeam;