import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hammer, Clock, Sparkles, Mountain } from "lucide-react";
import SectionWrapper from "@/components/SectionWrapper";

const BuildTab = () => {
  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <SectionWrapper className="pt-16 bg-gradient-to-br from-orange-900/20 via-red-900/20 to-orange-900/20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-orange-600 to-red-600 shadow-smooth-lg">
              <Mountain className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Archipelago
            <span className="block text-white/90">AI-Powered Build Execution</span>
          </h1>
          
          <p className="text-xl text-white/80 mb-8 leading-relaxed">
            Transform your project plan into reality with autonomous AI agents that implement features, write code, and create pull requests based on your specifications.
          </p>
        </div>
      </SectionWrapper>

      <Card>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 flex items-center justify-center">
              <Clock className="w-10 h-10 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold">Coming Soon</h3>
            <p className="text-center text-muted-foreground max-w-md">
              The BUILD phase will enable AI agents to automatically execute projects, 
              implementing features, writing code, and creating pull requests.
            </p>
            <Badge variant="outline" className="mt-4">
              <Sparkles className="w-3 h-3 mr-1" />
              In Development
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h4 className="font-semibold">Task Selection</h4>
              <p className="text-sm text-muted-foreground">
                Select tasks for AI execution
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                <span className="text-xl font-bold text-purple-600">2</span>
              </div>
              <h4 className="font-semibold">Agent Execution</h4>
              <p className="text-sm text-muted-foreground">
                Specialized AI agents work on assigned tasks
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-dashed">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
                <span className="text-xl font-bold text-pink-600">3</span>
              </div>
              <h4 className="font-semibold">PR Creation</h4>
              <p className="text-sm text-muted-foreground">
                Review and merge AI-generated pull requests
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BuildTab;