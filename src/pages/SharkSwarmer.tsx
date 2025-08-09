import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Fish, Users, Target, Trophy, AlertCircle, Table, Lightbulb, CircleHelp, Loader2, Github, ChevronRight, Search, Globe, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SectionWrapper from "@/components/SectionWrapper";
import Header from "@/components/Header";
import SharkLeaderboard from "@/components/SharkLeaderboard";

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
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'ideas' | 'how'>('leaderboard');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null);
  
  // Handle navigation changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      if (hash === 'how') {
        setActiveTab('how');
      } else if (hash === 'ideas') {
        setActiveTab('ideas');
      } else {
        setActiveTab('leaderboard');
      }
    };
    
    handleHashChange(); // Check initial hash
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  
  const navItems = [
    { path: "#leaderboard", label: "Leaderboard", icon: Table, variant: activeTab === 'leaderboard' ? "default" as const : "ghost" as const },
    { path: "#ideas", label: "Ideas", icon: Lightbulb, variant: activeTab === 'ideas' ? "default" as const : "ghost" as const },
    { path: "#how", label: "How", icon: CircleHelp, variant: activeTab === 'how' ? "default" as const : "ghost" as const },
  ];

  useEffect(() => {
    fetchOceanStudioRepos();
  }, []);

  const fetchOceanStudioRepos = async () => {
    try {
      setLoading(true);
      // Fetch ocean-studio-repos organization repos
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/github/repos/ocean-studio-repos`, {
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
        description: "Failed to fetch Ocean Studio repositories. Please check your GitHub token.",
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

  const handleRepoSelect = (repo: GitHubRepo) => {
    setSelectedRepo(repo);
    toast({
      title: "Repository Selected",
      description: `Selected ${repo.name} for Shark Tank evaluation`,
    });
    // TODO: Implement Shark Tank evaluation functionality
  };

  return (
    <div className="min-h-screen bg-gradient-carmax-fade flex flex-col">
      <Header 
        title="Shark Swarmer"
        subtitle="Multi-Persona Refinement"
        icon="🦈"
        navItems={navItems}
        showHealthCheck={false}
      />
      
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

      {/* Tab Content */}
      <SectionWrapper className="py-8 bg-gradient-carmax-fade relative">
        {/* Subtle fading background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-64 h-64 bg-carmax-yellow rounded-full mix-blend-multiply filter blur-2xl"></div>
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-carmax-blue rounded-full mix-blend-multiply filter blur-2xl"></div>
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10">
          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <SharkLeaderboard />
          )}

          {/* Ideas Tab */}
          {activeTab === 'ideas' && (
            <Card className="bg-white/90 backdrop-blur-sm shadow-smooth-lg border-carmax-blue/20">
              <CardHeader className="border-b border-carmax-blue/10 bg-gradient-to-r from-carmax-yellow/5 to-carmax-blue/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-carmax-blue/10">
                    <Github className="h-6 w-6 text-carmax-blue" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-bold text-foreground">Select Repository</CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                      Choose a repository from ocean-studio-repos to evaluate with AI sharks
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex flex-col items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-carmax-blue mb-4" />
                    <p className="text-muted-foreground">Loading repositories...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search repositories..."
                        className="pl-10 border-carmax-blue/20 focus:border-carmax-blue/40"
                      />
                    </div>
                    <ScrollArea className="h-[400px] rounded-md border border-carmax-blue/20">
                      <div className="p-4 space-y-3">
                        {filteredRepos.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No repositories found. Try adjusting your search.
                          </p>
                        ) : (
                          filteredRepos.map((repo) => (
                            <Card 
                              key={repo.id} 
                              className="cursor-pointer hover:shadow-md transition-all hover:border-carmax-blue/40 group"
                              onClick={() => handleRepoSelect(repo)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-foreground group-hover:text-carmax-blue transition-colors truncate">
                                        {repo.name}
                                      </h3>
                                      {repo.private ? (
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                      ) : (
                                        <Globe className="h-3 w-3 text-muted-foreground" />
                                      )}
                                    </div>
                                    {repo.description && (
                                      <p className="text-sm text-muted-foreground line-clamp-2">
                                        {repo.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2">
                                      {repo.language && (
                                        <Badge variant="secondary" className="text-xs">
                                          {repo.language}
                                        </Badge>
                                      )}
                                      <span className="text-xs text-muted-foreground">
                                        Updated {new Date(repo.updated_at).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-carmax-blue transition-colors flex-shrink-0 ml-4" />
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{filteredRepos.length} repositories found</span>
                      <span>Organization: ocean-studio-repos</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* How Tab */}
          {activeTab === 'how' && (
            <Card className="bg-carmax-yellow/10 border-carmax-yellow/30 max-w-4xl mx-auto">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-carmax-yellow/20">
                    <AlertCircle className="h-6 w-6 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-4 text-xl">How Shark Swarmer Works</h3>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">1. AI Shark Evaluation</h4>
                        <p className="leading-relaxed">
                          Multiple AI "sharks" with different personas evaluate each idea, simulating a Shark Tank experience. Each shark has unique expertise and investment criteria.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">2. Comprehensive Scoring</h4>
                        <p className="leading-relaxed">
                          Ideas receive a composite Shark Score (0-100) based on investment amounts, confidence levels, and decision ratios. Higher scores indicate stronger investment potential.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">3. Investment Tracking</h4>
                        <p className="leading-relaxed">
                          Track total investment offers across all sharks. See which ideas attract the most funding and understand the reasoning behind each investment decision.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">4. One-Click Build</h4>
                        <p className="leading-relaxed">
                          Transform winning ideas into reality. Click the BUILD button to automatically create a new repository in ocean-studio-apps with a complete project structure and shark feedback.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-foreground mb-2">5. Real-Time Leaderboard</h4>
                        <p className="leading-relaxed">
                          View the top 10 ideas across all evaluated repositories. The leaderboard updates every 30 seconds, showing rankings, scores, and investment totals.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SectionWrapper>
    </div>
  );
};

export default SharkSwarmer;