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
  const [loading, setLoading] = useState(false);
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

  // Fetch repos only when Ideas tab is active
  useEffect(() => {
    if (activeTab === 'ideas' && repos.length === 0 && !loading) {
      fetchOceanStudioRepos();
    }
  }, [activeTab]);

  const fetchOceanStudioRepos = async () => {
    try {
      setLoading(true);
      // Note: This endpoint may not work if ocean-studio-repos doesn't exist or GitHub token is invalid
      // For now, we'll use mock data as a fallback
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/github/repos/ocean-studio-repos`, {
        credentials: 'omit'
      });
      
      if (!response.ok) {
        // Use fallback mock data for demo purposes
        console.warn("Failed to fetch repos, using demo data");
        setRepos([
          {
            id: 1,
            name: "innovation-hub",
            full_name: "ocean-studio-repos/innovation-hub",
            description: "Central repository for innovative ideas and shark-evaluated concepts",
            private: false,
            html_url: "https://github.com/ocean-studio-repos/innovation-hub",
            language: "TypeScript",
            updated_at: new Date().toISOString(),
            stargazers_count: 42
          },
          {
            id: 2,
            name: "shark-tank-winners",
            full_name: "ocean-studio-repos/shark-tank-winners",
            description: "Collection of winning ideas from Shark Tank evaluations",
            private: false,
            html_url: "https://github.com/ocean-studio-repos/shark-tank-winners",
            language: "JavaScript",
            updated_at: new Date().toISOString(),
            stargazers_count: 28
          }
        ]);
        return;
      }

      const data = await response.json();
      setRepos(data);
    } catch (error) {
      console.error("Error fetching repos:", error);
      // Use fallback data instead of showing error
      setRepos([
        {
          id: 1,
          name: "innovation-hub",
          full_name: "ocean-studio-repos/innovation-hub",
          description: "Central repository for innovative ideas and shark-evaluated concepts",
          private: false,
          html_url: "https://github.com/ocean-studio-repos/innovation-hub",
          language: "TypeScript",
          updated_at: new Date().toISOString(),
          stargazers_count: 42
        }
      ]);
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
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        title="Ideate"
        subtitle="AI-Powered Idea Evaluation"
        icon="💡"
        navItems={navItems}
        showHealthCheck={false}
      />
      

      {/* Tab Content - Clean layout */}
      <section className="py-12 lg:py-20">
        <div className="max-w-6xl mx-auto px-6">
        
          {/* Leaderboard Tab */}
          {activeTab === 'leaderboard' && (
            <SharkLeaderboard />
          )}

          {/* Ideas Tab */}
          {activeTab === 'ideas' && (
            <Card className="bg-card border-border shadow-card">
              <CardHeader className="border-b border-border bg-gradient-subtle">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-accent/10">
                    <Github className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-heading font-bold text-foreground">Select Repository</CardTitle>
                    <CardDescription className="text-muted-foreground mt-1">
                      Choose a repository from ocean-studio-repos to evaluate with AI sharks
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {loading ? (
                  <div className="flex flex-col items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-accent mb-4" />
                    <p className="text-muted-foreground">Loading repositories...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search repositories..."
                        className="pl-10"
                      />
                    </div>
                    <ScrollArea className="h-[400px] rounded-md border border-border">
                      <div className="p-4 space-y-3">
                        {filteredRepos.length === 0 ? (
                          <p className="text-center text-muted-foreground py-8">
                            No repositories found. Try adjusting your search.
                          </p>
                        ) : (
                          filteredRepos.map((repo) => (
                            <Card 
                              key={repo.id} 
                              className="cursor-pointer hover:shadow-card transition-gentle hover:border-accent/20 group"
                              onClick={() => handleRepoSelect(repo)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h3 className="font-semibold text-foreground group-hover:text-accent transition-gentle truncate">
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
                                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-accent transition-gentle flex-shrink-0 ml-4" />
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
            <Card className="bg-card border-border shadow-card max-w-4xl mx-auto">
              <CardContent className="p-8">
                <div className="flex items-start gap-6">
                  <div className="p-3 rounded-lg bg-accent/10 flex-shrink-0">
                    <AlertCircle className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-foreground mb-6 text-2xl">How Truffle Ideate Works</h3>
                    <div className="space-y-6 text-muted-foreground">
                      <div>
                        <h4 className="font-heading font-semibold text-foreground mb-3 text-lg">1. Multi-Perspective Evaluation</h4>
                        <p className="leading-relaxed">
                          Diverse AI evaluators with different expertise assess each idea from multiple angles - technical feasibility, market potential, competitive positioning, and more.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-heading font-semibold text-foreground mb-3 text-lg">2. Comprehensive Scoring</h4>
                        <p className="leading-relaxed">
                          Ideas receive detailed scores across key dimensions like market size, implementation complexity, competitive advantage, and investment potential. Higher scores indicate stronger opportunities.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-heading font-semibold text-foreground mb-3 text-lg">3. Insight Aggregation</h4>
                        <p className="leading-relaxed">
                          Combine insights from all AI evaluators to understand consensus views, identify concerns, and surface the most promising aspects of each idea.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-heading font-semibold text-foreground mb-3 text-lg">4. Development Recommendations</h4>
                        <p className="leading-relaxed">
                          Get specific recommendations for turning promising ideas into reality, including suggested next steps, potential challenges, and strategic approaches.
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-heading font-semibold text-foreground mb-3 text-lg">5. Real-Time Rankings</h4>
                        <p className="leading-relaxed">
                          Track top-performing ideas across all evaluations with live rankings that update as new ideas are assessed and refined.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>
    </div>
  );
};

export default SharkSwarmer;