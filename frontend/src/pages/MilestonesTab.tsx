import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Github, ChevronRight, Search, Globe, Lock, AlertCircle, ShipWheel, CircleHelp, Hammer, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SectionWrapper from "@/components/SectionWrapper";
import Header from "@/components/Header";
import { BacklogGenerationHistory } from "@/components/BacklogGenerationHistory";

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

const MilestonesTab = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [howModalOpen, setHowModalOpen] = useState(false);
  const [backlogHistoryExpanded, setBacklogHistoryExpanded] = useState(false);
  
  const navItems = [
    { 
      path: "#", 
      label: "How", 
      icon: CircleHelp, 
      variant: "ghost" as const,
      onClick: () => setHowModalOpen(true)
    },
  ];

  useEffect(() => {
    fetchMvpBuilderRepos();
  }, []);

  const fetchMvpBuilderRepos = async () => {
    try {
      setLoading(true);
      // Use the GitHub service directly instead of a backend API
      const { githubService } = await import('../services/githubService');
      const repos = await githubService.listRecentRepos('', 50); // Get more repos, no prefix filter
      setRepos(repos);
    } catch (error) {
      console.error("Error fetching repos:", error);
      toast({
        title: "Error",
        description: "Failed to fetch truflr.ai repositories. Please check your GitHub token.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleRepoSelect = async (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    setSubmitting(true);
    
    try {
      // Submit job to our async plan generation endpoint
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plan/async/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metadata: {
            title: repo.name,
            description: repo.description || `${repo.name} repository`,
            domain: 'general',
            repository: repo.html_url,
            branch: 'main'
          },
          readmeContent: `# ${repo.name}\n\n${repo.description || 'No description available'}`,
          githubConfig: {
            createIssues: true,
            repository: repo.full_name,
            token: null // Will use the token from AWS Secrets Manager
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit job');
      }
      
      const data = await response.json();
      // Navigate to job runner with our async job ID
      navigate(`/milestones/${repo.full_name.split('/')[1]}/${data.jobId}`);
    } catch (error) {
      console.error('Error submitting job:', error);
      toast({
        title: "Error",
        description: "Failed to start project generation. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header 
          title="Build"
          subtitle="Dynamic Backlog Generation"
          icon={<Hammer className="h-6 w-6" />}
          navItems={navItems}
          showHealthCheck={false}
        />
        <div className="flex-1 flex items-center justify-center">
          <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm shadow-smooth-lg border-carmax-blue/20">
            <CardContent className="pt-8 pb-8">
              <div className="flex flex-col items-center">
                <Loader2 className="h-12 w-12 animate-spin text-carmax-blue mb-6" />
                <p className="text-lg text-muted-foreground">Loading repositories...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        title="plan"
        subtitle="dynamic backlog generation"
        icon={<Hammer className="h-6 w-6" />}
        navItems={navItems}
        showHealthCheck={false}
      />
      

      {/* Main Content */}
      <SectionWrapper className="pt-8 bg-background relative">
        
        <div className="relative z-10">
          <div className="space-y-6">
            {/* Collapsible Backlog Generation History Section */}
            <Card className="bg-card/90 backdrop-blur-sm shadow-smooth-lg border-carmax-blue/20 hover:border-carmax-blue/30 transition-all duration-300">
              <CardHeader 
                className="cursor-pointer hover:bg-carmax-blue/5 transition-all duration-300"
                onClick={() => setBacklogHistoryExpanded(!backlogHistoryExpanded)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-carmax-blue/10">
                      <Target className="h-5 w-5 text-carmax-blue" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-bold text-foreground">plan generation history</CardTitle>
                      <CardDescription className="text-muted-foreground">
                        track completed and running plan generation jobs
                      </CardDescription>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    {backlogHistoryExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardHeader>
              {backlogHistoryExpanded && (
                <CardContent className="pt-0">
                  <BacklogGenerationHistory limit={20} />
                </CardContent>
              )}
            </Card>

            {/* Repository Selection */}
          <Card className="bg-card/90 backdrop-blur-sm shadow-smooth-lg border-carmax-blue/20 hover:border-carmax-blue/30 transition-all duration-300">
            <CardHeader className="border-b border-carmax-blue/10 bg-gradient-to-r from-carmax-yellow/5 to-carmax-blue/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-carmax-blue/10">
                  <Github className="h-6 w-6 text-carmax-blue" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">plan gtm</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    choose a repository from truflr.ai to generate your project plan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="search repositories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 bg-background/80 border-carmax-blue/20 focus:border-carmax-blue focus:ring-2 focus:ring-carmax-blue/20 transition-all duration-300"
                  />
                </div>

                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-3">
                    {filteredRepos.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-center text-muted-foreground">
                            {searchTerm ? "No repositories found matching your search." : "No repositories found."}
                          </p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredRepos.map((repo) => (
                        <Card
                          key={repo.id}
                          className={`group cursor-pointer bg-card/80 border-carmax-blue/20 hover:border-carmax-blue/40 hover:bg-carmax-blue/5 shadow-smooth-md hover:shadow-smooth-lg transform hover:scale-[1.02] transition-all duration-300 ${submitting && selectedRepo?.id === repo.id ? 'opacity-50' : ''}`}
                          onClick={() => !submitting && handleRepoSelect(repo)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">{repo.name}</h3>
                                  <Badge variant={repo.private ? "secondary" : "outline"} className="text-xs bg-carmax-yellow/10 border-carmax-yellow/30 text-foreground">
                                    {repo.private ? (
                                      <>
                                        <Lock className="w-3 h-3 mr-1" />
                                        Private
                                      </>
                                    ) : (
                                      <>
                                        <Globe className="w-3 h-3 mr-1" />
                                        Public
                                      </>
                                    )}
                                  </Badge>
                                  {repo.language && (
                                    <Badge variant="outline" className="text-xs bg-carmax-blue/10 border-carmax-blue/30 text-foreground">
                                      {repo.language}
                                    </Badge>
                                  )}
                                </div>
                                {repo.description && (
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {repo.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                  <span>⭐ {repo.stargazers_count}</span>
                                  <span>Updated {new Date(repo.updated_at).toLocaleDateString()}</span>
                                </div>
                              </div>
                              {submitting && selectedRepo?.id === repo.id ? (
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                              ) : (
                                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      </SectionWrapper>

      {/* How Modal */}
      <Dialog open={howModalOpen} onOpenChange={setHowModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>how truflr.ai plan works</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-lg">hello world</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MilestonesTab;