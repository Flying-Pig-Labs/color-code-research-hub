import Header from "@/components/Header";

import SectionWrapper from "@/components/SectionWrapper";
import WhiteResearchSwarmForm from "@/components/WhiteResearchSwarmForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Compass, Sparkles, Map, ArrowRight, Shield } from "lucide-react";

const WhiteTeam = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      {/* Hero Section */}
      <SectionWrapper theme="white" className="pt-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-white-team-accent shadow-smooth-lg border border-white-team-accent/20">
              <Lightbulb className="h-12 w-12 text-white-team-dark" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
            White Team Research
            <span className="block text-white-team-dark">Market Opportunity Discovery</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Dedicated research into competitive white space identification and new product opportunity development through systematic market gap analysis.
          </p>
          
          <WhiteResearchSwarmForm>
            <Button variant="white-team" size="xl" className="gap-2">
              <Lightbulb className="h-5 w-5" />
              ⚪ Launch Research Swarm
            </Button>
          </WhiteResearchSwarmForm>
        </div>
      </SectionWrapper>


      {/* Methodologies */}
      <SectionWrapper theme="white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Research Methodologies</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our systematic approach to white space identification and opportunity development
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center border-white-team-accent/30">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-white-team-accent/20">
                  <Lightbulb className="h-8 w-8 text-white-team-dark" />
                </div>
              </div>
              <CardTitle className="text-white-team-dark">Opportunity Mapping</CardTitle>
              <CardDescription>
                Comprehensive mapping of market gaps and unexplored opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="gap-2">
                Learn More <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-white-team-accent/30">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-white-team-accent/20">
                  <Sparkles className="h-8 w-8 text-white-team-dark" />
                </div>
              </div>
              <CardTitle className="text-white-team-dark">Innovation Research</CardTitle>
              <CardDescription>
                Advanced research methodologies for product innovation and development
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="gap-2">
                Learn More <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center border-white-team-accent/30">
            <CardHeader>
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-xl bg-white-team-accent/20">
                  <Map className="h-8 w-8 text-white-team-dark" />
                </div>
              </div>
              <CardTitle className="text-white-team-dark">Strategic Planning</CardTitle>
              <CardDescription>
                Strategic positioning and go-to-market planning for new opportunities
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

export default WhiteTeam;