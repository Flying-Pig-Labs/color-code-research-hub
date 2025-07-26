import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Milestone, Github, ChevronRight, Sparkles, Search, Globe, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

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

  useEffect(() => {
    fetchMvpBuilderRepos();
  }, []);

  const fetchMvpBuilderRepos = async () => {
    try {
      setLoading(true);
      // Fetch mvp-builder-app repos
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/github/repos/mvp-builder-app`, {
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GITHUB_TOKEN || ''}`,
        }
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
        description: "Failed to fetch MVP Builder repositories. Please check your GitHub token.",
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
      // Submit job to Batch
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/submit-job`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repo: repo.full_name
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit job');
      }
      
      const data = await response.json();
      // Navigate to job runner with the actual Batch job ID
      navigate(`/milestones/${repo.full_name.split('/')[1]}/${data.jobId}`);
    } catch (error) {
      console.error('Error submitting job:', error);
      toast({
        title: "Error",
        description: "Failed to start backlog generation. Please try again.",
        variant: "destructive",
      });
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
              <p className="text-sm text-muted-foreground">Loading repositories...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>MVP Backlog Generator</CardTitle>
              <CardDescription>
                Select a repository from mvp-builder-app to generate a comprehensive backlog with milestones, epics, and issues
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Repository Selection */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5" />
            <CardTitle className="text-lg">Select Repository</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search repositories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
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
                      className={`cursor-pointer hover:shadow-md transition-shadow ${submitting && selectedRepo?.id === repo.id ? 'opacity-50' : ''}`}
                      onClick={() => !submitting && handleRepoSelect(repo)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">{repo.name}</h3>
                              <Badge variant={repo.private ? "secondary" : "outline"} className="text-xs">
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
                                <Badge variant="outline" className="text-xs">
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
                            <ChevronRight className="h-5 w-5 text-muted-foreground" />
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

      {/* Info Card */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Milestone className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">How it works</h3>
              <p className="text-sm text-muted-foreground">
                Select a repository to generate a comprehensive backlog. The system will create milestones, 
                epics, and issues automatically using AWS Batch processing. View live logs as your backlog is generated.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MilestonesTab;