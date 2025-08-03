import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Fish, Users, Target, Trophy, AlertCircle } from 'lucide-react';

const SharkSwarmer = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gray-900/50 backdrop-blur-sm border-gray-800/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
              <Fish className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">🦈 Shark Swarmer</CardTitle>
              <CardDescription className="text-gray-400">
                Vet ideas using agent personas to score and select the best one
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

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