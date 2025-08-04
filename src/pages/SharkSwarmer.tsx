import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fish, Users, Target, Trophy, AlertCircle } from 'lucide-react';
import SectionWrapper from "@/components/SectionWrapper";
import Header from "@/components/Header";

const SharkSwarmer = () => {
  return (
    <div className="min-h-screen bg-gradient-carmax-fade flex flex-col">
      <Header />
      
      {/* Hero Section with CarMax Fading */}
      <SectionWrapper className="pt-8 pb-8 bg-gradient-carmax-hero relative overflow-hidden">
        {/* Decorative fading elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-carmax-blue rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-carmax-yellow rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-96 h-96 bg-carmax-blue rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-500"></div>
        </div>
        
        <div className="text-center max-w-4xl mx-auto relative z-10">
          <div className="flex justify-center mb-6">
            <span className="text-8xl">🦈</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
            Shark Swarmer
          </h1>
          
          <p className="text-xl text-muted-foreground mb-4 leading-relaxed max-w-3xl mx-auto">
            Harness the power of diverse AI agent personas to systematically evaluate, score, and select the most promising ideas through multi-perspective analysis.
          </p>
        </div>
      </SectionWrapper>

      {/* Features Overview */}
      <SectionWrapper className="pt-4 bg-gradient-carmax-fade relative">
        {/* Subtle fading background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-carmax-yellow rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-carmax-blue rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>
        
        {/* Coming Soon Notice */}
        <div className="max-w-4xl mx-auto mb-8 relative z-10">
          <Card className="bg-carmax-yellow/10 border-carmax-yellow/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <AlertCircle className="w-6 h-6 text-carmax-yellow flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Coming Soon</h3>
                  <p className="text-sm text-muted-foreground">
                    The Shark Swarmer feature is currently under development and will be available in the next release.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          <Card className="group transition-all duration-300 hover:shadow-smooth-lg transform hover:scale-[1.02] border-carmax-blue/20 hover:border-carmax-blue/40 hover:bg-carmax-blue/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-carmax-blue/10">
                  <Users className="h-6 w-6 text-carmax-blue" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  Agent Personas
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Diverse AI Perspectives
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-foreground/80 leading-relaxed">
                Multiple AI agents with different viewpoints and expertise to evaluate your ideas from every angle.
              </p>
            </CardContent>
          </Card>
          
          <Card className="group transition-all duration-300 hover:shadow-smooth-lg transform hover:scale-[1.02] border-carmax-yellow/20 hover:border-carmax-yellow/40 hover:bg-carmax-yellow/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-carmax-yellow/10">
                  <Target className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  Idea Scoring
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Systematic Evaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-foreground/80 leading-relaxed">
                Data-driven scoring framework that evaluates ideas based on feasibility, impact, and innovation potential.
              </p>
            </CardContent>
          </Card>
          
          <Card className="group transition-all duration-300 hover:shadow-smooth-lg transform hover:scale-[1.02] border-carmax-blue/20 hover:border-carmax-blue/40 hover:bg-carmax-blue/5">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-carmax-blue/10">
                  <Trophy className="h-6 w-6 text-carmax-blue" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  Best Selection
                </CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Smart Recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-foreground/80 leading-relaxed">
                AI-powered selection process that identifies the most promising ideas for implementation.
              </p>
            </CardContent>
          </Card>
        </div>
      </SectionWrapper>
    </div>
  );
};

export default SharkSwarmer;