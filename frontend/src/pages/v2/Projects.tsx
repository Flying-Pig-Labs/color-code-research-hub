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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  
  // Tab state
  const [activeTab, setActiveTab] = useState('projects');
  
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
      
      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted/50 p-1 mb-8 rounded-lg">
          <TabsTrigger 
            value="projects" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-card text-muted-foreground transition-gentle font-medium"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Projects
          </TabsTrigger>
          <TabsTrigger 
            value="workflow" 
            className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-card text-muted-foreground transition-gentle font-medium"
          >
            <GitBranch className="h-4 w-4 mr-2" />
            Workflow
          </TabsTrigger>
        </TabsList>

        {/* Projects Tab Content */}
        <TabsContent value="projects" className="mt-0 space-y-8">

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
        </TabsContent>

        {/* Workflow Tab Content */}
        <TabsContent value="workflow" className="mt-0 space-y-8">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-accent" />
                Research-to-Patent Workflow
              </CardTitle>
              <CardDescription>
                Visual overview of the 3-phase research-to-patent process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <MermaidDiagram 
                  chart={`flowchart TD
    A[📋 PROJECT START] --> B[🔍 RESEARCH PHASE]
    
    %% Research Phase Details
    B --> B1[Market Research<br/>& Competitive Analysis]
    B1 --> B2[📊 Research Report Generated]
    B2 --> B3[✅ Phase 1 Complete<br/>1 Credit Used]
    
    %% Ideation Phase
    B3 --> C[💡 IDEATION PHASE]
    C --> C1[AI Analysis of<br/>Research Data]
    C1 --> C2[Generate & Rank<br/>10 Business Ideas]
    C2 --> C3[📋 Idea Evaluation<br/>with Market Scoring]
    C3 --> C4[✅ Phase 2 Complete<br/>1 Credit Used]
    
    %% Double-Down Phase
    C4 --> D[📄 DOUBLE-DOWN PHASE]
    D --> D1[Select Best Idea<br/>for Development]
    D1 --> D2[Generate Patent-Ready<br/>Documentation]
    D2 --> D3[📑 Final PDF Package<br/>& Provisional Filing]
    D3 --> D4[✅ Phase 3 Complete<br/>1 Credit Used]
    
    %% Final Output
    D4 --> E[🎯 PATENT-READY<br/>INTELLECTUAL PROPERTY]
    
    %% Sequential Flow Indicators
    F[Sequential Workflow] --> G[Each Phase Builds<br/>on Previous Phase]
    G --> H[Complete in Order<br/>Research → Ideation → Double-Down]
    
    %% Visual Styling
    classDef startEnd fill:#e1f5fe,stroke:#01579b,stroke-width:3px
    classDef research fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef ideation fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef doubledown fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef complete fill:#e0f2f1,stroke:#004d40,stroke-width:2px
    classDef info fill:#f5f5f5,stroke:#424242,stroke-width:1px
    
    class A,E startEnd
    class B,B1,B2,B3 research
    class C,C1,C2,C3,C4 ideation
    class D,D1,D2,D3,D4 doubledown
    class F,G,H info`}
                  id="projects-workflow"
                />
              </div>
            </CardContent>
          </Card>

          {/* Workflow Details */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Phase Details</CardTitle>
              <CardDescription>
                Understanding each phase of the research-to-patent workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Phase 1 Details */}
              <div className="flex items-start gap-4 p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 font-semibold text-sm">
                  1
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="h-4 w-4 text-purple-600" />
                    <h3 className="font-semibold text-foreground">Research Phase</h3>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                      1 Credit
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Comprehensive market research and competitive analysis to understand your domain landscape.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Market size and growth analysis</li>
                    <li>• Competitor landscape mapping</li>
                    <li>• Technology trends and opportunities</li>
                    <li>• Regulatory environment assessment</li>
                  </ul>
                </div>
              </div>

              {/* Phase 2 Details */}
              <div className="flex items-start gap-4 p-4 bg-green-50/50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-600 font-semibold text-sm">
                  2
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-green-600" />
                    <h3 className="font-semibold text-foreground">Ideation Phase</h3>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      1 Credit
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    AI-powered analysis generates and evaluates innovative business opportunities.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 10 ranked business ideas generated</li>
                    <li>• Market viability scoring</li>
                    <li>• Technical feasibility assessment</li>
                    <li>• Competitive differentiation analysis</li>
                  </ul>
                </div>
              </div>

              {/* Phase 3 Details */}
              <div className="flex items-start gap-4 p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 font-semibold text-sm">
                  3
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <h3 className="font-semibold text-foreground">Double-Down Phase</h3>
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300">
                      1 Credit
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Transform your best idea into patent-ready intellectual property documentation.
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Detailed technical specifications</li>
                    <li>• Patent application draft</li>
                    <li>• Prior art analysis</li>
                    <li>• Provisional filing package</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-4 border-t border-border">
                <AlertCircle className="h-4 w-4" />
                <span>
                  <strong>Total Investment:</strong> 3 credits per complete project workflow. 
                  Each phase must be completed sequentially to unlock the next phase.
                </span>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Projects;