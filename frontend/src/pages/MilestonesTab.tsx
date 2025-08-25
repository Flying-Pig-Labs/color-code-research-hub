import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Milestone, Github, ChevronRight, Sparkles, Search, Globe, Lock, AlertCircle, ShipWheel, CircleHelp, Hammer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SectionWrapper from "@/components/SectionWrapper";
import Header from "@/components/Header";

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
      // Fetch ocean-studio-apps repos (where BUILD button creates new repos)
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/github/repos/ocean-studio-apps`, {
        credentials: 'omit'
      });
      
      if (!response.ok) {
        throw new Error("Failed to fetch repositories");
      }

      const data = await response.json();
      setRepos(data);
    } catch (error) {
      console.error("Error fetching repos:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Ocean Studio Apps repositories. Please check your GitHub token.",
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
          <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-smooth-lg border-carmax-blue/20">
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
        title="Build"
        subtitle="Dynamic Backlog Generation"
        icon={<Hammer className="h-6 w-6" />}
        navItems={navItems}
        showHealthCheck={false}
      />
      

      {/* Main Content */}
      <SectionWrapper className="pt-8 bg-background relative">
        
        <div className="relative z-10">
          {/* Repository Selection */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-smooth-lg border-carmax-blue/20 hover:border-carmax-blue/30 transition-all duration-300">
            <CardHeader className="border-b border-carmax-blue/10 bg-gradient-to-r from-carmax-yellow/5 to-carmax-blue/5">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-carmax-blue/10">
                  <Github className="h-6 w-6 text-carmax-blue" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">Select Repository</CardTitle>
                  <CardDescription className="text-muted-foreground mt-1">
                    Choose a repository from ocean-studio-apps to generate your project plan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
                  <Input
                    placeholder="Search repositories..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-12 bg-white/80 border-carmax-blue/20 focus:border-carmax-blue focus:ring-2 focus:ring-carmax-blue/20 transition-all duration-300"
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
                          className={`group cursor-pointer bg-white/80 border-carmax-blue/20 hover:border-carmax-blue/40 hover:bg-carmax-blue/5 shadow-smooth-md hover:shadow-smooth-lg transform hover:scale-[1.02] transition-all duration-300 ${submitting && selectedRepo?.id === repo.id ? 'opacity-50' : ''}`}
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

          
          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <Card className="group transition-all duration-300 hover:shadow-smooth-lg transform hover:scale-[1.02] border-carmax-blue/20 hover:border-carmax-blue/40 hover:bg-carmax-blue/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-carmax-blue/10">
                    <Milestone className="h-6 w-6 text-carmax-blue" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    AI Milestones
                  </CardTitle>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  Smart Project Phases
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Automatically generates project milestones tailored to your repository structure and goals.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group transition-all duration-300 hover:shadow-smooth-lg transform hover:scale-[1.02] border-carmax-yellow/20 hover:border-carmax-yellow/40 hover:bg-carmax-yellow/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-carmax-yellow/10">
                    <Sparkles className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    Epic Generation
                  </CardTitle>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  Comprehensive Epics
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Creates detailed epics and user stories based on your codebase analysis and project requirements.
                </p>
              </CardContent>
            </Card>
            
            <Card className="group transition-all duration-300 hover:shadow-smooth-lg transform hover:scale-[1.02] border-carmax-blue/20 hover:border-carmax-blue/40 hover:bg-carmax-blue/5">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded-lg bg-carmax-blue/10">
                    <Github className="h-6 w-6 text-carmax-blue" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    GitHub Ready
                  </CardTitle>
                </div>
                <CardDescription className="text-sm text-muted-foreground">
                  Issue Management
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-foreground/80 leading-relaxed">
                  Exports formatted issues ready for GitHub, complete with labels and assignee recommendations.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SectionWrapper>

      {/* How Modal */}
      <Dialog open={howModalOpen} onOpenChange={setHowModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>How Truffle Plan Works</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-lg">Hello world</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MilestonesTab;