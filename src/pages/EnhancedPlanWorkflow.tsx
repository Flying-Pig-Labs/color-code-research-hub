import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Github,
  Users,
  Calendar,
  Clock,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import { PlanGenerationProgress } from '@/components/plan/PlanGenerationProgress';

interface Phase {
  id: string;
  title: string;
  description: string;
  suggestedRoles: string[];
  epics: Epic[];
  selected?: boolean;
}

interface Epic {
  id: string;
  title: string;
  description: string;
  suggestedRole: string;
  issues: Issue[];
  selected?: boolean;
}

interface Issue {
  id?: string;
  title: string;
  body: string;
  labels: string[];
  epicId: string;
  epicTitle: string;
  phaseId: string;
  phaseTitle: string;
  estimatedHours: number;
  selected?: boolean;
}

const EnhancedPlanWorkflow = () => {
  const navigate = useNavigate();
  const { owner, repo } = useParams();
  const [currentStep, setCurrentStep] = useState<'initial' | 'generating' | 'preview' | 'creating' | 'complete'>('initial');
  const [phases, setPhases] = useState<Phase[]>([]);
  const [sampleIssues, setSampleIssues] = useState<Issue[]>([]);
  const [totalEstimatedIssues, setTotalEstimatedIssues] = useState(0);
  const [expandedPhases, setExpandedPhases] = useState<string[]>([]);
  const [expandedEpics, setExpandedEpics] = useState<string[]>([]);
  const [createdIssues, setCreatedIssues] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<'preview' | 'direct'>('preview');

  // Load project data from localStorage
  const projectData = JSON.parse(localStorage.getItem('projectSummary') || '{}');

  const startPlanGeneration = async (mode: 'preview' | 'direct' = 'preview') => {
    setGenerationMode(mode);
    setCurrentStep('generating');
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plan/async/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: projectData,
          readmeContent: localStorage.getItem('readmeContent') || '',
          repository: `${owner}/${repo}`,
          generateAndCreate: mode === 'direct' // If direct, create issues immediately
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start plan generation');
      }

      const data = await response.json();
      setJobId(data.jobId);
      
    } catch (error) {
      console.error('Failed to start plan generation:', error);
      setError('Failed to start plan generation. Please try again.');
      toast.error('Failed to start plan generation');
      setCurrentStep('initial');
    }
  };

  const handleAsyncComplete = (result: any) => {
    if (generationMode === 'direct') {
      // Direct mode - issues already created
      setCreatedIssues(result.createdIssues || []);
      setCurrentStep('complete');
      toast.success(`Created ${result.createdIssues?.length || 0} GitHub issues!`);
    } else {
      // Preview mode - show phases for selection
      if (result && result.phases) {
        const phasesWithSelection = result.phases.map((phase: Phase) => ({
          ...phase,
          selected: true,
          epics: phase.epics.map((epic: Epic) => ({
            ...epic,
            selected: true
          }))
        }));
        
        setPhases(phasesWithSelection);
        setSampleIssues(result.sampleIssues || []);
        setTotalEstimatedIssues(result.totalEstimatedIssues || 0);
        setCurrentStep('preview');
        
        // Expand first phase by default
        if (result.phases.length > 0) {
          setExpandedPhases([result.phases[0].id]);
        }
      }
    }
  };

  const handleAsyncError = (error: string) => {
    setError(error);
    toast.error('Failed to generate plan');
    setCurrentStep('initial');
  };

  const togglePhase = (phaseId: string) => {
    if (expandedPhases.includes(phaseId)) {
      setExpandedPhases(expandedPhases.filter(id => id !== phaseId));
    } else {
      setExpandedPhases([...expandedPhases, phaseId]);
    }
  };

  const toggleEpic = (epicId: string) => {
    if (expandedEpics.includes(epicId)) {
      setExpandedEpics(expandedEpics.filter(id => id !== epicId));
    } else {
      setExpandedEpics([...expandedEpics, epicId]);
    }
  };

  const togglePhaseSelection = (phaseId: string) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        const newSelected = !phase.selected;
        return {
          ...phase,
          selected: newSelected,
          epics: phase.epics.map(epic => ({ ...epic, selected: newSelected }))
        };
      }
      return phase;
    }));
  };

  const toggleEpicSelection = (phaseId: string, epicId: string) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          epics: phase.epics.map(epic => {
            if (epic.id === epicId) {
              return { ...epic, selected: !epic.selected };
            }
            return epic;
          })
        };
      }
      return phase;
    }));
  };

  const getSelectedCount = () => {
    let phaseCount = 0;
    let epicCount = 0;
    
    phases.forEach(phase => {
      if (phase.selected !== false) {
        phaseCount++;
        phase.epics.forEach(epic => {
          if (epic.selected !== false) {
            epicCount++;
          }
        });
      }
    });
    
    return { phaseCount, epicCount };
  };

  const createSelectedIssues = async () => {
    setCurrentStep('generating');
    
    try {
      // Start a new async job to create selected issues
      const selectedPhases = phases.filter(p => p.selected !== false);
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/plan/async/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: projectData,
          readmeContent: localStorage.getItem('readmeContent') || '',
          repository: `${owner}/${repo}`,
          generateAndCreate: true,
          selectedPhases: selectedPhases // Only create issues for selected phases/epics
        })
      });

      if (!response.ok) {
        throw new Error('Failed to start issue creation');
      }

      const data = await response.json();
      setJobId(data.jobId);
      setGenerationMode('direct'); // Switch to direct mode for completion
      
    } catch (error) {
      console.error('Failed to create issues:', error);
      setError('Failed to create GitHub issues. Please try again.');
      toast.error('Failed to create issues');
      setCurrentStep('preview');
    }
  };

  const renderInitial = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-6 h-6" />
          AI-Powered Project Planning
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <p className="text-muted-foreground">
          Our AI will analyze your project and generate a comprehensive development plan with phases, epics, and GitHub issues.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-2 hover:border-primary transition-colors cursor-pointer" 
                onClick={() => startPlanGeneration('preview')}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Preview & Customize</h3>
                  <Badge variant="outline">Recommended</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Review and customize the generated plan before creating GitHub issues
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Select specific phases and epics</li>
                  <li>• Preview issues before creation</li>
                  <li>• Full control over what gets created</li>
                </ul>
                <Button className="w-full" variant="default">
                  Generate with Preview
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 hover:border-primary transition-colors cursor-pointer"
                onClick={() => startPlanGeneration('direct')}>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">Direct Generation</h3>
                  <Badge variant="secondary">
                    <Zap className="w-3 h-3 mr-1" />
                    Fast
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Generate and create all GitHub issues in one go
                </p>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Fastest option</li>
                  <li>• Creates all recommended issues</li>
                  <li>• No preview step</li>
                </ul>
                <Button className="w-full" variant="outline">
                  Generate Directly
                  <Zap className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="flex justify-start">
          <Button
            variant="ghost"
            onClick={() => navigate(`/plan/${owner}/${repo}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Summary
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">Project Plan Preview</h2>
              <p className="text-muted-foreground mt-2">
                Review and customize your AI-generated project plan
              </p>
            </div>
            <Badge variant="outline" className="text-lg px-4 py-2">
              <Sparkles className="w-4 h-4 mr-2" />
              {totalEstimatedIssues} Estimated Issues
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">{phases.length}</div>
                <div className="text-sm text-muted-foreground">Development Phases</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">
                  {phases.reduce((sum, p) => sum + p.epics.length, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Epics</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-bold">
                  {getSelectedCount().epicCount * 3}
                </div>
                <div className="text-sm text-muted-foreground">Est. Issues (Selected)</div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Phases */}
      <Card>
        <CardHeader>
          <CardTitle>Development Phases</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select the phases and epics you want to include in your GitHub project
          </p>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {phases.map((phase, phaseIndex) => (
                <Card key={phase.id} className={phase.selected === false ? 'opacity-60' : ''}>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={phase.selected !== false}
                          onCheckedChange={() => togglePhaseSelection(phase.id)}
                        />
                        <div className="flex-1">
                          <button
                            onClick={() => togglePhase(phase.id)}
                            className="flex items-center gap-2 text-left w-full hover:text-primary transition-colors"
                          >
                            {expandedPhases.includes(phase.id) ? 
                              <ChevronDown className="w-4 h-4" /> : 
                              <ChevronRight className="w-4 h-4" />
                            }
                            <h3 className="font-semibold">
                              Phase {phaseIndex + 1}: {phase.title}
                            </h3>
                          </button>
                          <p className="text-sm text-muted-foreground mt-1">{phase.description}</p>
                          <div className="flex gap-2 mt-2">
                            {phase.suggestedRoles.map(role => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline">
                        {phase.epics.length} Epics
                      </Badge>
                    </div>
                    
                    {expandedPhases.includes(phase.id) && (
                      <div className="ml-8 mt-4 space-y-3">
                        {phase.epics.map((epic, epicIndex) => (
                          <Card key={epic.id} className={epic.selected === false ? 'opacity-60' : ''}>
                            <CardContent className="pt-3">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={epic.selected !== false}
                                  onCheckedChange={() => toggleEpicSelection(phase.id, epic.id)}
                                />
                                <div className="flex-1">
                                  <h4 className="font-medium">
                                    Epic {epicIndex + 1}: {epic.title}
                                  </h4>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {epic.description}
                                  </p>
                                  <div className="flex items-center gap-4 mt-2">
                                    <Badge variant="outline" className="text-xs">
                                      <Users className="w-3 h-3 mr-1" />
                                      {epic.suggestedRole}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      ~3 issues
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Sample Issues */}
      {sampleIssues.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sample Issues Preview</CardTitle>
            <p className="text-sm text-muted-foreground">
              Here's a preview of the issues that will be created
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sampleIssues.slice(0, 3).map((issue, index) => (
                <Card key={index}>
                  <CardContent className="pt-4">
                    <h4 className="font-medium mb-2">{issue.title}</h4>
                    <div className="flex gap-2 mb-2">
                      {issue.labels.map(label => (
                        <Badge key={label} variant="secondary" className="text-xs">
                          {label}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {issue.body.split('\n')[0]}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>{issue.phaseTitle}</span>
                      <span>•</span>
                      <span>{issue.epicTitle}</span>
                      <span>•</span>
                      <span>{issue.estimatedHours} hours</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep('initial')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Options
        </Button>
        <Button
          onClick={createSelectedIssues}
          disabled={getSelectedCount().epicCount === 0}
        >
          Create {getSelectedCount().epicCount * 3} GitHub Issues
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );

  const renderComplete = () => (
    <Card>
      <CardContent className="py-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <CheckCircle2 className="w-16 h-16 text-green-600" />
          <h3 className="text-2xl font-bold">Project Plan Created!</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Successfully created {createdIssues.length} issues in your GitHub repository
          </p>
          
          <div className="flex gap-4 mt-6">
            <Button
              variant="outline"
              onClick={() => window.open(`https://github.com/${owner}/${repo}/issues`, '_blank')}
            >
              <Github className="w-4 h-4 mr-2" />
              View on GitHub
            </Button>
            <Button
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <XCircle className="w-16 h-16 text-red-600" />
            <h3 className="text-xl font-semibold">Error</h3>
            <p className="text-muted-foreground text-center max-w-md">{error}</p>
            <Button onClick={() => setCurrentStep('initial')}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      {currentStep === 'initial' && renderInitial()}
      
      {currentStep === 'generating' && jobId && (
        <PlanGenerationProgress 
          jobId={jobId}
          onComplete={handleAsyncComplete}
          onError={handleAsyncError}
        />
      )}
      
      {currentStep === 'preview' && renderPreview()}
      {currentStep === 'complete' && renderComplete()}
    </div>
  );
};

export default EnhancedPlanWorkflow;