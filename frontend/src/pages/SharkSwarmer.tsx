import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>How Truflr.ai Ideate Works</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-lg">Hello world</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SharkSwarmer;