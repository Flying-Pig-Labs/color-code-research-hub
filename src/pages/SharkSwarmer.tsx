import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fish, Users, Target, Trophy, AlertCircle } from 'lucide-react';
import SectionWrapper from "@/components/SectionWrapper";

const SharkSwarmer = () => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <SectionWrapper className="pt-16 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-blue-900/20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 shadow-smooth-lg">
              <Fish className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Shark Swarmer
            <span className="block text-white/90">Agent-Driven Idea Vetting</span>
          </h1>
          
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            Harness the power of diverse AI agent personas to systematically evaluate, score, and select the most promising ideas through multi-perspective analysis.
          </p>
        </div>
      </SectionWrapper>

      {/* Coming Soon Card */}
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <div className="w-20 h-20 rounded-full bg-blue-600/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-10 h-10 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Coming Soon</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              The Shark Swarmer feature is currently under development. This will allow you to:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 max-w-3xl mx-auto">
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="pt-4">
                  <Users className="w-8 h-8 text-blue-400 mb-2" />
                  <h4 className="font-medium mb-1">Agent Personas</h4>
                  <p className="text-sm text-gray-400">
                    Multiple AI agents with different perspectives
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="pt-4">
                  <Target className="w-8 h-8 text-purple-400 mb-2" />
                  <h4 className="font-medium mb-1">Idea Scoring</h4>
                  <p className="text-sm text-gray-400">
                    Systematic evaluation of each idea
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-800/50 border-gray-700/50">
                <CardContent className="pt-4">
                  <Trophy className="w-8 h-8 text-yellow-400 mb-2" />
                  <h4 className="font-medium mb-1">Best Selection</h4>
                  <p className="text-sm text-gray-400">
                    Data-driven selection of winning ideas
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SharkSwarmer;