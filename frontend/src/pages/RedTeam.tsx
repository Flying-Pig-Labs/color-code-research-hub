import Header from "@/components/Header";

import SectionWrapper from "@/components/SectionWrapper";
import ResearchSwarmForm from "@/components/ResearchSwarmForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, TrendingUp, Users, BarChart3, ArrowRight, Shield, Flame, Clock, Ghost } from "lucide-react";

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
            <span className="block text-white/90">4D Competitive Intelligence</span>
          </h1>
          
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            Assemble a world-class swarm of market researchers, intelligence librarians, and strategic analysts. We don't just analyze competitors – we map <span className="font-semibold text-white">predator-prey dynamics</span>, design <span className="font-semibold text-white">phantom disruptors</span>, and run <span className="font-semibold text-white">counterfactual scenarios</span> that reveal paths to total market domination.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
              <Flame className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Unfair Playbook</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
              <Clock className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Temporal Triangulation</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full border border-white/20">
              <Ghost className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">Phantom Disruptors</span>
            </div>
          </div>
          
          <ResearchSwarmForm>
            <Button variant="red-team" size="xl" className="gap-2">
              <Target className="h-5 w-5" />
              🔴 Launch Research Swarm
            </Button>
          </ResearchSwarmForm>
        </div>
      </SectionWrapper>


      {/* What Makes This Special */}
      <SectionWrapper theme="red">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">Not Your Father's Competitive Analysis</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We go beyond SWOT analysis with <span className="font-semibold">biological metaphors</span>, <span className="font-semibold">chaos agents</span>, and <span className="font-semibold">dystopian fables</span> that expose vulnerabilities competitors don't even know they have.
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-gray-200 hover:border-red-team/60 transition-all hover:shadow-lg bg-white">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-3 shadow-md">
                <span className="text-white text-lg">🎭</span>
              </div>
              <CardTitle className="text-gray-900">Unfair Playbook</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                What would Amazon do to kill Google tomorrow? Which "partnership" is actually a Trojan horse? The taboo strategies that would instantly flip the market.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 hover:border-red-team/60 transition-all hover:shadow-lg bg-white">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-3 shadow-md">
                <span className="text-white text-lg">🦁</span>
              </div>
              <CardTitle className="text-gray-900">Predator-Prey Maps</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Who's the apex predator? The wounded gazelle? Which companies hunt in packs? Map competitors to ecosystem roles that reveal true market dynamics.
              </p>
            </CardContent>
          </Card>
          
          <Card className="border-gray-200 hover:border-red-team/60 transition-all hover:shadow-lg bg-white">
            <CardHeader>
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-3 shadow-md">
                <span className="text-white text-lg">🌀</span>
              </div>
              <CardTitle className="text-gray-900">Counterfactuals</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                What if the top 3 competitors never existed? If the leader vanished overnight? Design phantom disruptors that trigger chaos cascades in the market.
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
      
      
    </div>
  );
};

export default RedTeam;