import Header from "@/components/Header";

import SectionWrapper from "@/components/SectionWrapper";
import WhiteResearchSwarmForm from "@/components/WhiteResearchSwarmForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, Compass, Sparkles, Map, ArrowRight, Shield, Ghost, RotateCcw, Zap } from "lucide-react";

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
            <span className="block text-white-team-dark">4D Whitespace Intelligence</span>
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Unleash a world-class swarm of innovation strategists, trend librarians, patent analysts, and customer ethnographers. We don't just find opportunities – we excavate <span className="font-semibold text-white-team-dark">ghost markets</span>, decode <span className="font-semibold text-white-team-dark">emotional arbitrage</span>, and spot <span className="font-semibold text-white-team-dark">science fiction horizons</span> with present-day signals.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white-team-accent/10 rounded-full border border-white-team-accent/20">
              <Sparkles className="h-4 w-4 text-white-team-dark" />
              <span className="text-sm font-medium">Inverted Demand Scans</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white-team-accent/10 rounded-full border border-white-team-accent/20">
              <Map className="h-4 w-4 text-white-team-dark" />
              <span className="text-sm font-medium">Category Collision Markets</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white-team-accent/10 rounded-full border border-white-team-accent/20">
              <Compass className="h-4 w-4 text-white-team-dark" />
              <span className="text-sm font-medium">Borrowed Lens Analysis</span>
            </div>
          </div>
          
          <WhiteResearchSwarmForm>
            <Button variant="white-team" size="xl" className="gap-2">
              <Lightbulb className="h-5 w-5" />
              Launch Research Swarm
            </Button>
          </WhiteResearchSwarmForm>
        </div>
      </SectionWrapper>


      {/* What Makes This Special */}
      <SectionWrapper theme="white">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Not Your Average Market Research</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We go beyond traditional analysis with <span className="font-semibold">contrarian personas</span>, <span className="font-semibold">temporal triangulation</span>, and <span className="font-semibold">wildcard artifacts</span> that reveal opportunities others can't see.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-gray-200 hover:border-white-team-accent/60 transition-all hover:shadow-lg bg-white">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-3 shadow-md">
                <Ghost className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-gray-900">Ghost Markets</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Markets that should exist but don't. Taboo services with massive latent demand. Things everyone wants but no one admits. We excavate these buried opportunities.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 hover:border-white-team-accent/60 transition-all hover:shadow-lg bg-white">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3 shadow-md">
                <RotateCcw className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-gray-900">Inverted Demands</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                What people actively hate = hidden opportunity. Products universally despised but unavoidable. The "I hate that I need this" category reveals gold mines.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 hover:border-white-team-accent/60 transition-all hover:shadow-lg bg-white">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center mb-3 shadow-md">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-gray-900">Improbable Mashups</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Skincare meets cybersecurity? Dating meets supply chain? We explore category collisions that shouldn't work but might create billion-dollar markets.
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
      
      
    </div>
  );
};

export default WhiteTeam;