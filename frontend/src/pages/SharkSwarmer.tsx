import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { MermaidDiagram } from "@/components/MermaidDiagram";
import { Fish, Users, Target, Trophy, AlertCircle, Table, Lightbulb, CircleHelp, Loader2, Github, ChevronRight, Search, Globe, Lock, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SectionWrapper from "@/components/SectionWrapper";
import Header from "@/components/Header";
import SharkLeaderboard from "@/components/SharkLeaderboard";
import { PipelineJobsTable } from "@/components/PipelineJobsTable";

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  html_url: string;
  language: string;
  updated_at: string;
  stargazers_count: number;
}

const SharkSwarmer = () => {
  const { toast } = useToast();
  const [pipelineJobsExpanded, setPipelineJobsExpanded] = useState(false);
  const [howModalOpen, setHowModalOpen] = useState(false);
  
  const navItems = [
    { 
      path: "#", 
      label: "How", 
      icon: CircleHelp, 
      variant: "ghost" as const,
      onClick: () => setHowModalOpen(true)
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        title="Ideate"
        subtitle="AI-Powered Idea Evaluation"
        icon={<Lightbulb className="h-6 w-6" />}
        navItems={navItems}
        showHealthCheck={false}
      />
      

      {/* Main Content */}
      <section className="py-12 lg:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="space-y-6">
            {/* Collapsible Pipeline Jobs Section */}
            <Card className="bg-card border-border shadow-card">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-gentle"
                onClick={() => setPipelineJobsExpanded(!pipelineJobsExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-accent/10">
                      <Target className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <CardDescription>Track running ideation processes and outputs</CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {pipelineJobsExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {pipelineJobsExpanded && (
                <CardContent className="pt-0">
                  <PipelineJobsTable />
                </CardContent>
              )}
            </Card>

            {/* Leaderboard */}
            <SharkLeaderboard />
          </div>
        </div>
      </section>

      {/* How Modal */}
      <Dialog open={howModalOpen} onOpenChange={setHowModalOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>How truflr.ai Ideation Works</DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-6">
            {/* Mermaid Diagram */}
            <div className="w-full overflow-x-auto">
              <MermaidDiagram 
                chart={`graph LR
    A["📄 RESEARCH<br/>ANALYSIS<br/><br/>• Market docs<br/>• Claude insights<br/>• Key themes"] --> B["🔍 DISCOVERY<br/><br/>• Reddit mining<br/>• Pain discovery<br/>• Jobs-to-be-done<br/>• User problems"]
    B --> C["🎯 ANALYSIS<br/><br/>• AI clustering<br/>• Zone scoring<br/>• Perplexity AI<br/>• Market intel"]
    C --> D["💡 IDEATION<br/><br/>• 10 product concepts<br/>• Strategic fit<br/>• Evidence-based<br/>• Validated ideas"]
    D --> E["📊 PORTFOLIO<br/><br/>• Market sizing<br/>• Risk analysis<br/>• Roadmaps<br/>• Exec summary"]
    F["Raw Research Data"] -.-> G["Authentic User Needs"]
    G -.-> H["Strategic Opportunities"]
    H -.-> I["Validated Ideas"]
    I -.-> J["Innovation Portfolio"]
    style A fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style B fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style C fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style D fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style E fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    style F fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style G fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style H fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style I fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    style J fill:#ffffff,stroke:#333333,stroke-width:1px,color:#000000
    classDef outcome fill:#ffffff,stroke:#333333,stroke-width:2px,color:#000000
    class J outcome`}
                id="ideation-flow"
              />
            </div>
            
            {/* Outcome Section */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="font-mono text-sm">
                <div className="border-b border-gray-300 pb-2 mb-2">
                  ┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
                </div>
                <div className="text-center py-2">
                  │  🚀 <strong>OUTCOME:</strong> From scattered market research to 10 prioritized, evidence-backed product opportunities in hours   │
                </div>
                <div className="border-t border-gray-300 pt-2">
                  └─────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                </div>
              </div>
            </div>

            {/* Key Value Propositions */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Key Value Propositions:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600">Speed:</span>
                  <span>Hours vs. months of traditional market research</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600">Authenticity:</span>
                  <span>Real user problems from Reddit conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600">Intelligence:</span>
                  <span>AI-powered strategic analysis with market validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600">Precision:</span>
                  <span>Exactly 10 prioritized opportunities with implementation guidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600">Evidence:</span>
                  <span>Every idea backed by quantified user demand and competitive analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharkSwarmer;