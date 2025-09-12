/**
 * @fileoverview Projects page with comprehensive onboarding for new users.
 * 
 * Features:
 * - First-time user onboarding with clear explanations
 * - Proper form styling consistent with the application
 * - Workflow explanation with visual cues
 * - Project creation with validation
 * - Project list with navigation to details
 * 
 * @author truflr.ai Team
 * @version 2.0.0
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useProjects, useCreateProject } from '@/hooks/v2';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  FolderPlus, 
  Lightbulb, 
  FileText, 
  ChevronRight, 
  AlertCircle,
  Loader2,
  Calendar,
  ArrowRight,
  BookOpen,
  Target,
  Zap,
  GitBranch,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v2Api } from '@/services/v2/api';
import { useUser } from '@/contexts/UserContext';

/**
 * Format timestamp to readable date.
 */
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Projects page component with onboarding and project management.
 */
const Projects: React.FC = () => {
  const { data: projects, isLoading } = useProjects();
  const createProject = useCreateProject();
  const { toast } = useToast();
  const { user } = useUser();
  const { isAuthenticated } = useAuth();
  
  // Gate all rendering and fetching on authentication
  const hasValidToken = !!sessionStorage.getItem('id_token');
  if (!isAuthenticated || !hasValidToken) return null;
  
  // Form state
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [errors, setErrors] = useState<{ title?: string; domain?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [ideaCounts, setIdeaCounts] = useState<Record<string, number>>({});
  const [doubleLinks, setDoubleLinks] = useState<Record<string, string>>({});
  const [topIdeaTitle, setTopIdeaTitle] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<Record<string, number>>({});
  
  // Layout state
  const [workflowExpanded, setWorkflowExpanded] = useState(false);
  const [advancedExpanded, setAdvancedExpanded] = useState(false);

  // Enrich projects with ideas count & final repo (DoubleDowns)
  React.useEffect(() => {

    (async () => {
      try {
        const [issuesResp, doubles] = await Promise.all([
          v2Api.listPipelineRepos('issue'),
          v2Api.listDoubleDowns().catch(() => []),
        ]);
        const issues: any[] = (issuesResp?.issues || []) as any[];
        const counts: Record<string, number> = {};
        const titles: Record<string, string> = {};
        const lastIdea: Record<string, number> = {};
        for (const it of issues) {
          const rn = (it.repoName || '').toString();
          if (!rn) continue;
          counts[rn] = (counts[rn] || 0) + 1;
          if (!titles[rn]) titles[rn] = it.title || (it.body ? String(it.body).split('\n')[0].slice(0, 100) : 'Idea');
          const dt = new Date(it.created_at || it.createdAt || Date.now()).getTime();
          lastIdea[rn] = Math.max(lastIdea[rn] || 0, dt);
        }
        setIdeaCounts(counts);
        setTopIdeaTitle(titles);
        const links: Record<string, string> = {};
        const lastRepo: Record<string, number> = {};
        if (Array.isArray(doubles)) {
          for (const d of doubles as any[]) {
            if (d?.repoName && d?.repoUrl) links[d.repoName] = d.repoUrl;
            if (d?.repoName && (d?.createdAt || d?.created_at)) {
              lastRepo[d.repoName] = Math.max(lastRepo[d.repoName] || 0, new Date(d.createdAt || d.created_at).getTime());
            }
          }
        }
        setDoubleLinks(links);
        const lu: Record<string, number> = {};
        const keys = new Set<string>([...Object.keys(lastIdea), ...Object.keys(lastRepo)]);
        keys.forEach(k => lu[k] = Math.max(lastIdea[k] || 0, lastRepo[k] || 0));
        setLastUpdated(lu);
      } catch {
        setIdeaCounts({});
        setDoubleLinks({});
        setTopIdeaTitle({});
        setLastUpdated({});
      }
    })();
  }, []);

  /**
   * Validate form inputs.
   */
  const validateForm = (): boolean => {
    const newErrors: { title?: string; domain?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Project title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Project title must be at least 3 characters';
    } else if (title.trim().length > 100) {
      newErrors.title = 'Project title cannot exceed 100 characters';
    }

    if (domain.trim().length > 0) {
      if (domain.trim().length < 3) {
        newErrors.domain = 'Domain must be at least 3 characters if provided';
      } else if (domain.trim().length > 200) {
        newErrors.domain = 'Domain cannot exceed 200 characters';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission.
   */
  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await createProject.mutateAsync({ 
        title: title.trim(), 
        domain: domain.trim() || undefined 
      });

      // Clear form
      setTitle('');
      setDomain('');
      setErrors({});

      toast({
        title: "Project Created",
        description: `"${title.trim()}" has been created successfully.`,
        duration: 3000,
      });
    } catch (error) {
      console.error('Failed to create project:', error);
      toast({
        title: "Error",
        description: "Failed to create project. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle input changes with validation.
   */
  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (errors.title) {
      setErrors(prev => ({ ...prev, title: undefined }));
    }
  };

  const handleDomainChange = (value: string) => {
    setDomain(value);
    if (errors.domain) {
      setErrors(prev => ({ ...prev, domain: undefined }));
    }
  };

  /**
   * Handle keyboard shortcuts.
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleCreate();
    }
  };

  const hasProjects = projects && projects.length > 0;

  if (isLoading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading projects...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Projects</h1>
        <p className="text-muted-foreground text-lg">
          Organize your research-to-patent workflow
        </p>
        {user?.email && (
          <p className="text-sm text-muted-foreground">Workspace: {user.email}</p>
        )}
      </div>

      {/* Compact Onboarding for new users */}
      {!hasProjects && (
        <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-accent" />
                <CardTitle className="text-base">How It Works</CardTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setWorkflowExpanded(!workflowExpanded)}>
                {workflowExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            <CardDescription>
              Research → Ideas → Patents. Three simple steps.
            </CardDescription>
          </CardHeader>
          {workflowExpanded && (
            <CardContent className="pt-0">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Research (1 credit)
                </div>
                <ArrowRight className="h-3 w-3" />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  Ideation (1 credit)
                </div>
                <ArrowRight className="h-3 w-3" />
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  Patent Prep (1 credit)
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Compact Workflow Overview - Always Visible */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="h-4 w-4 text-accent" />
              <CardTitle className="text-base">Research-to-Patent Workflow</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setWorkflowExpanded(!workflowExpanded)}>
              {workflowExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        {workflowExpanded && (
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                Research (1 credit)
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                Ideation (1 credit)
              </div>
              <ArrowRight className="h-3 w-3" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Patent Prep (1 credit)
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Streamlined Create Project Bar */}
      <Card className="bg-accent/5 border-accent/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <FolderPlus className="h-5 w-5 text-accent flex-shrink-0" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
              <Input
                placeholder="Project title (required)"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`bg-background ${errors.title ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
                maxLength={100}
              />
              <Input
                placeholder="Domain/Industry (optional)"
                value={domain}
                onChange={(e) => handleDomainChange(e.target.value)}
                onKeyDown={handleKeyDown}
                className={`bg-background ${errors.domain ? 'border-destructive' : ''}`}
                disabled={isSubmitting}
                maxLength={200}
              />
            </div>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !title.trim()}
              size="sm"
              className="bg-accent hover:bg-accent/90 flex-shrink-0"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setAdvancedExpanded(!advancedExpanded)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Advanced options - collapsible */}
          {advancedExpanded && (
            <div className="mt-4 p-3 bg-muted/20 rounded-md space-y-2">
              <Label className="text-sm font-medium">Advanced Options</Label>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Press Ctrl+Enter (Cmd+Enter on Mac) to create</div>
                {(errors.title || errors.domain) && (
                  <div className="text-destructive">
                    {errors.title && <div>• {errors.title}</div>}
                    {errors.domain && <div>• {errors.domain}</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Context Line */}
      {hasProjects && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Track your research-to-patent projects and their progress through each workflow phase.
          </p>
          <Badge variant="secondary" className="font-mono">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      {/* Streamlined Projects List */}
      {hasProjects && (
        <div className="grid gap-4">
          {projects.map((project) => {
            const hasReports = true; // Assume reports exist for simplicity
            const ideaCount = ideaCounts[project.title] || 0;
            const hasRepos = doubleLinks[project.title];
            
            return (
              <Card
                key={project.projectId}
                className="bg-card border-border shadow-card hover:shadow-elevated transition-all cursor-pointer group"
              >
                <Link to={`/v2/projects/${project.projectId}`}>
                  <CardContent className="p-6">
                    {/* Header with title and dates */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg text-foreground group-hover:text-accent transition-colors line-clamp-2">
                          {project.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Created {formatDate(project.createdAt)}
                          </span>
                          {lastUpdated[project.title] && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                Updated {formatDate(lastUpdated[project.title])}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {project.domain && (
                        <Badge variant="outline" className="text-xs shrink-0">
                          {project.domain}
                        </Badge>
                      )}
                    </div>

                    {/* Inline count badges */}
                    <div className="flex items-center gap-4 mb-4 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">📑</span>
                        <span className="text-xs text-muted-foreground">Reports:</span>
                        <Badge variant="secondary" className="h-5 px-2 text-xs font-mono">
                          {hasReports ? '1' : '0'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">💡</span>
                        <span className="text-xs text-muted-foreground">Ideations:</span>
                        <Badge variant="secondary" className="h-5 px-2 text-xs font-mono">
                          {ideaCount}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">🛠️</span>
                        <span className="text-xs text-muted-foreground">Planning:</span>
                        <Badge variant="secondary" className="h-5 px-2 text-xs font-mono">
                          {hasRepos ? '1' : '0'}
                        </Badge>
                      </div>
                    </div>

                    {/* Single CTA */}
                    <div className="flex items-center justify-between pt-3 border-t border-border/30">
                      <div className="text-xs text-muted-foreground">
                        {hasRepos ? 'Completed all phases' : ideaCount > 0 ? 'Ready for planning' : hasReports ? 'Ready for ideation' : 'Ready to start'}
                      </div>
                      <div className="flex items-center gap-2 text-accent group-hover:text-accent-foreground transition-colors">
                        <span className="text-sm font-medium">View Project</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            );
          })}
        </div>
      )}

      {/* Enhanced Empty State */}
      {!hasProjects && (
        <Card className="bg-muted/20 border-dashed border-2 border-muted-foreground/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-foreground">No projects yet — create one above to get started.</h3>
              <div className="text-sm text-muted-foreground space-y-1 max-w-md">
                <p>Once you have projects, you'll see:</p>
                <p>• <strong>No ideations yet</strong> — run one from Ideate tab</p>
                <p>• <strong>No repos created</strong> — use DoubleDown to build</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Projects;
