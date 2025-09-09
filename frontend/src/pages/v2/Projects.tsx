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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MermaidDiagram } from '@/components/MermaidDiagram';
import { 
  FolderPlus, 
  Search, 
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
  GitBranch
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import PipelineOverview from '@/components/v2/PipelineOverview';

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
  
  // Form state
  const [title, setTitle] = useState('');
  const [domain, setDomain] = useState('');
  const [errors, setErrors] = useState<{ title?: string; domain?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      </div>

      {/* Onboarding for new users */}
      {!hasProjects && (
        <div className="space-y-6">
          {/* Welcome Message */}
          <Card className="bg-gradient-to-r from-accent/5 to-accent/10 border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent" />
                Welcome to truflr.ai Projects
              </CardTitle>
              <CardDescription className="text-base">
                Projects organize your complete journey from market research to patent filing.
                Each project contains three phases that build upon each other.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Workflow Explanation */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-xl">How Projects Work</CardTitle>
              <CardDescription>
                Each project follows a structured 3-phase workflow to transform research into intellectual property.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Phase 1 */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 font-semibold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Search className="h-4 w-4 text-blue-600" />
                    <h3 className="font-semibold text-foreground">Research Phase</h3>
                    <Badge variant="secondary">1 Credit</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate comprehensive market research and competitive analysis for your domain.
                    Creates detailed research reports with insights and data.
                  </p>
                </div>
              </div>

              {/* Phase 2 */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 font-semibold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Lightbulb className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold text-foreground">Ideation Phase</h3>
                    <Badge variant="secondary">1 Credit</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AI analyzes your research to generate and rank 10 innovative business ideas.
                    Each idea includes market scoring and strategic analysis.
                  </p>
                </div>
              </div>

              {/* Phase 3 */}
              <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-600 font-semibold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-foreground">Double-Down Phase</h3>
                    <Badge variant="secondary">1 Credit</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Select your best idea and generate patent-ready documentation including
                    final PDF and provisional filing package.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t border-border">
                <AlertCircle className="h-4 w-4" />
                <span>Each phase builds on the previous one. You'll need to complete them in order.</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compact Workflow Diagram */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-accent" />
            Workflow Overview
          </CardTitle>
          <CardDescription>
            The 3-phase research-to-patent process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <MermaidDiagram 
              chart={`flowchart LR
    A[🔍 Research] --> B[💡 Ideation]
    B --> C[📄 Double-Down]
    C --> D[🎯 Patent]
    
    classDef phase fill:#f8f9fa,stroke:#6c757d,stroke-width:2px,font-size:11px
    classDef final fill:#d4edda,stroke:#28a745,stroke-width:2px,font-size:11px
    
    class A,B,C phase
    class D final`}
              id="compact-workflow"
            />
          </div>
        </CardContent>
      </Card>

      {/* Create Project Form */}
      <Card className="bg-card border-border shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5 text-accent" />
            Create New Project
          </CardTitle>
          <CardDescription>
            Start a new research-to-patent workflow. Give your project a clear, descriptive title.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Title Field */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Project Title *
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => handleTitleChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., AI-Powered E-commerce Analytics"
                className={`bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent ${
                  errors.title ? 'border-destructive focus:border-destructive' : ''
                }`}
                disabled={isSubmitting}
                maxLength={100}
              />
              {errors.title && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.title}
                </div>
              )}
            </div>

            {/* Domain Field */}
            <div className="space-y-2">
              <Label htmlFor="domain" className="text-sm font-medium">
                Domain/Industry
                <span className="text-muted-foreground ml-1">(Optional)</span>
              </Label>
              <Input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => handleDomainChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g., E-commerce, Healthcare, FinTech"
                className={`bg-background border-border text-foreground placeholder:text-muted-foreground focus:border-accent ${
                  errors.domain ? 'border-destructive focus:border-destructive' : ''
                }`}
                disabled={isSubmitting}
                maxLength={200}
              />
              {errors.domain && (
                <div className="flex items-center gap-1 text-sm text-destructive">
                  <AlertCircle className="h-3 w-3" />
                  {errors.domain}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              Press Ctrl+Enter (Cmd+Enter on Mac) to create
            </div>
            <Button
              onClick={handleCreate}
              disabled={isSubmitting || !title.trim()}
              className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-card hover:shadow-elevated transition-all"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create Project
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Projects List */}
      {hasProjects && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Your Projects</h2>
            <Badge variant="secondary" className="font-mono">
              {projects.length} project{projects.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          <div className="grid gap-4">
            {projects.map((project) => (
              <Card
                key={project.projectId}
                className="bg-card border-border shadow-card hover:shadow-elevated transition-all cursor-pointer group"
              >
                <Link to={`/v2/projects/${project.projectId}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                            {project.title}
                          </h3>
                          {project.domain && (
                            <Badge variant="outline" className="text-xs">
                              {project.domain}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          Created {formatDate(project.createdAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                          View Project
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Pipeline overview (repos and ideas) */}
      <div className="mt-8">
        <PipelineOverview />
      </div>

      {/* Empty State */}
      {!hasProjects && (
        <Card className="bg-muted/20 border-dashed border-2 border-muted-foreground/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">No projects yet</h3>
              <p className="text-muted-foreground max-w-md">
                Create your first project above to begin your research-to-patent journey.
                Each project will guide you through research, ideation, and patent preparation.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Projects;
