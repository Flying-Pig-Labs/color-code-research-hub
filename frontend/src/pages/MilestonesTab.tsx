import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Github, ChevronRight, Globe, Lock, AlertCircle, ShipWheel, CircleHelp, Hammer, ChevronDown, ChevronUp, Target, Lightbulb, GitBranch, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import SectionWrapper from "@/components/SectionWrapper";
import Header from "@/components/Header";
import { BacklogGenerationHistory } from "@/components/BacklogGenerationHistory";
import { useUser } from "@/contexts/UserContext";
import { v2Api } from '@/services/v2/api';

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
  body?: string; // README content from DynamoDB
}

const MilestonesTab = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, token } = useUser();
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [milestoneItems, setMilestoneItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Search removed per production UX; show all manifested ideas
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
  }, [user, token]);

  const fetchMvpBuilderRepos = async () => {
    try {
      setLoading(true);
      // Use v2 API backed by DoubleDowns
      const items = await v2Api.listDoubleDowns();
      const list: any[] = Array.isArray(items) ? items : [];
      // Also fetch issues to compute idea counts and primary titles per repo
      let issuesByRepo: Record<string, number> = {};
      let titleByRepo: Record<string, string> = {};
      let issueLinkByRepo: Record<string, string> = {};
      try {
        const issuesResp: any = await v2Api.listPipelineRepos('issue');
        const issues: any[] = (issuesResp?.issues || []) as any[];
        for (const it of issues) {
          let repo = it.repoName as string | undefined;
          if (!repo && it.url) {
            try {
              const u = new URL(it.url);
              const seg = u.pathname.split('/').filter(Boolean); // org, repo, issues, n
              repo = seg[1];
            } catch {}
          }
          if (repo) {
            issuesByRepo[repo] = (issuesByRepo[repo] || 0) + 1;
            if (!titleByRepo[repo]) {
              // Prefer explicit title; fallback to trimmed body
              const t = it.title || (it.body ? String(it.body).split('\n')[0].slice(0, 120) : 'Idea');
              titleByRepo[repo] = t;
              // Save a nice link path (repo/issues/N) if possible
              if (it.url) {
                try {
                  const u = new URL(it.url);
                  const seg = u.pathname.split('/').filter(Boolean);
                  if (seg.length >= 4) issueLinkByRepo[repo] = `${seg[1]}/issues/${seg[3]}`;
                } catch {}
              }
            }
          }
        }
      } catch {}
      // Normalize to GitHubRepo shape expected by UI
      const mapped: GitHubRepo[] = list.map((d: any) => ({
        id: d.doubleId ? d.doubleId.length : 0,
        name: d.repoName || d.title || 'repository',
        full_name: d.repoName || d.title || 'repository',
        description: d.description || d.body?.slice(0, 200) || '',
        private: false,
        html_url: d.repoUrl || '#',
        language: 'markdown',
        updated_at: d.updatedAt || d.created_at || d.createdAt || new Date().toISOString(),
        stargazers_count: 0,
        body: d.body,
      }));
      setRepos(mapped);
      // Enriched items for big Idea cards
      const enriched = list.map((d: any) => {
        // Parse a display title from the README body (first markdown heading) if present
        let parsedTitle: string | undefined;
        if (typeof d.body === 'string') {
          const m = d.body.match(/^\s*#\s+(.+)$/m);
          if (m) parsedTitle = m[1].trim();
        }
        const repo = d.repoName;
        const titleFromIssues = repo ? titleByRepo[repo] : undefined;
        return {
        repoName: d.repoName,
        repoUrl: d.repoUrl,
        createdAt: d.createdAt || d.created_at,
        status: d.status || 'completed',
        body: d.body,
        ideasCount: issuesByRepo[d.repoName] || 0,
        title: parsedTitle || titleFromIssues || d.repoName,
        ideaLink: repo && issueLinkByRepo[repo] ? issueLinkByRepo[repo] : undefined,
      }});
      setMilestoneItems(enriched);
    } catch (error) {
      console.error("Error fetching repos:", error);
      toast({
        title: "Error",
        description: "Failed to fetch your repositories. Please make sure you're logged in.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = milestoneItems;

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
          readmeContent: repo.body || `# ${repo.name}\n\n${repo.description || 'No description available'}`,
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
                      <CardTitle className="text-lg font-bold text-foreground">history</CardTitle>
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
                    choose from your created repositories to generate your project plan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <ScrollArea className="h-[600px] pr-4">
                  <div className="space-y-4">
                    {filteredItems.length === 0 ? (
                      <Card>
                        <CardContent className="pt-6">
                          <p className="text-center text-muted-foreground">No manifested ideas yet.</p>
                        </CardContent>
                      </Card>
                    ) : (
                      filteredItems.map((item) => {
                        const repo: GitHubRepo = {
                          id: item.repoName?.length || 0,
                          name: item.repoName,
                          full_name: item.repoName,
                          description: item.body?.slice(0, 200) || '',
                          private: false,
                          html_url: item.repoUrl,
                          language: 'markdown',
                          updated_at: item.createdAt || new Date().toISOString(),
                          stargazers_count: 0,
                          body: item.body,
                        };
                        return (
                          <Card
                            key={item.repoName}
                            className={`group cursor-pointer bg-gradient-to-r from-amber-50/70 to-blue-50/70 dark:from-zinc-900 dark:to-zinc-800 border border-border shadow-card hover:shadow-elevated transition-all duration-300 ${submitting && selectedRepo?.name === repo.name ? 'opacity-50' : ''}`}
                            onClick={() => !submitting && handleRepoSelect(repo)}
                          >
                            <CardContent className="p-6">
                              <div className="flex items-start justify-between gap-6">
                                <div className="flex-1 space-y-3">
                                  <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-md bg-amber-100 dark:bg-zinc-700"><Lightbulb className="h-4 w-4 text-amber-700 dark:text-amber-300"/></div>
                                    <h3 className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">{item.title || item.repoName}</h3>
                                    <Badge variant="outline" className="text-xs">{item.status || 'completed'}</Badge>
                                  </div>
                                  {item.body && (
                                    <p className="text-sm text-muted-foreground line-clamp-3">
                                      {item.body}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                                    <span className="inline-flex items-center gap-1"><GitBranch className="h-3 w-3"/> {item.ideasCount} ideas</span>
                                    <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3"/> {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}</span>
                                    {item.ideaLink && (
                                      <span className="inline-flex items-center gap-1">
                                        <a className="underline" href={`https://github.com/${item.ideaLink}`} target="_blank" rel="noreferrer">{item.ideaLink}</a>
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); window.open(item.repoUrl, '_blank'); }}
                                  >
                                    <Github className="h-4 w-4 mr-1"/> Open Repo
                                  </Button>
                                  <Button
                                    variant="default"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleRepoSelect(repo); }}
                                  >
                                    <Hammer className="h-4 w-4 mr-1"/> Generate Plan
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })
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
