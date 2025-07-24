import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Github, Loader2, Zap, Users, FileText, GitBranch, FolderOpen, Edit3, CheckCircle2, ArrowLeft, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

// Import adapted components from agent-team-composer
import ParseProduct from '@/components/plan/ParseProduct';
import LifecyclePhases from '@/components/plan/LifecyclePhases';
import EpicIssueView from '@/components/plan/EpicIssueView';
import ReviewSubmit from '@/components/plan/ReviewSubmit';

interface ProjectSummary {
  title: string;
  description: string;
  domain: string;
  targetUsers: string[];
  techStack: string[];
  features: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  objectives: string[];
}

interface Phase {
  id: string;
  name: string;
  description: string;
  duration: string;
  epics: Epic[];
}

interface Epic {
  id: string;
  title: string;
  description: string;
  issues: Issue[];
}

interface Issue {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: string;
  estimatedHours: number;
}

const PlanWorkflow = () => {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [readmeContent, setReadmeContent] = useState<string>('');
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 0, title: 'Parse Product', icon: FileText },
    { id: 1, title: 'Phase Generation', icon: GitBranch },
    { id: 2, title: 'Epic View', icon: FolderOpen },
    { id: 3, title: 'Issues View', icon: Edit3 },
    { id: 4, title: 'GitHub Sync', icon: CheckCircle2 }
  ];

  useEffect(() => {
    if (owner && repo) {
      fetchReadmeContent();
    }
  }, [owner, repo]);

  const fetchReadmeContent = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/github/repos/${owner}/${repo}/readme`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch README');
      }

      const data = await response.json();
      setReadmeContent(data.content);
      
      // Parse README to get initial metadata
      const parseResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/plan/parse-readme`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: data.content })
      });

      if (parseResponse.ok) {
        const parsed = await parseResponse.json();
        setProjectSummary({
          title: parsed.title || `${repo} Project Plan`,
          description: parsed.description || '',
          domain: parsed.domain || 'general',
          targetUsers: parsed.userTypes || [],
          techStack: parsed.techStack || [],
          features: parsed.features || [],
          complexity: parsed.complexity || 'moderate',
          objectives: []
        });
      }
    } catch (error) {
      console.error('Failed to load README:', error);
      setError('Failed to load repository README');
      toast({
        title: "Error",
        description: "Failed to load repository README. Please ensure the repository has a README file.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBack = () => {
    navigate('/plan');
  };

  const generatePhases = async () => {
    if (!projectSummary) return;
    
    setIsGeneratingPlan(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/plan/generate-phases`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: projectSummary,
          readmeContent: readmeContent,
          repository: `${owner}/${repo}`
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate phases');
      }

      const data = await response.json();
      setPhases(data.phases || []);
    } catch (error) {
      console.error('Failed to generate phases:', error);
      toast({
        title: "Error",
        description: "Failed to generate project phases. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const createGitHubIssues = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/plan/create-github-issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repository: `${owner}/${repo}`,
          summary: projectSummary,
          phases: phases
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create GitHub issues');
      }

      toast({
        title: "Success",
        description: "Project plan successfully created in GitHub!",
      });

      // Navigate back to repo selection
      navigate('/plan');
    } catch (error) {
      console.error('Failed to create GitHub issues:', error);
      toast({
        title: "Error",
        description: "Failed to create GitHub issues. Please try again.",
        variant: "destructive",
      });
    }
  };

  const renderStepContent = () => {
    if (loading) {
      return (
        <Card className="max-w-md mx-auto">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600">Loading repository data...</p>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card className="max-w-md mx-auto border-red-200">
          <CardContent className="py-12">
            <p className="text-red-600 text-center mb-4">Error: {error}</p>
            <div className="flex justify-center">
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Repository Selection
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    switch (currentStep) {
      case 0:
        return (
          <ParseProduct
            readmeContent={readmeContent}
            initialData={projectSummary}
            onNext={async (data) => {
              setProjectSummary({
                ...data,
                objectives: []
              });
              handleNext();
            }}
          />
        );
      case 1:
        if (phases.length === 0 && projectSummary && !isGeneratingPlan) {
          generatePhases();
        }
        
        return (
          <LifecyclePhases 
            phases={phases}
            setPhases={setPhases}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 2:
        return (
          <EpicIssueView
            phases={phases}
            setPhases={setPhases}
            onNext={handleNext}
            onPrevious={handlePrevious}
            viewMode="epic"
          />
        );
      case 3:
        return (
          <EpicIssueView
            phases={phases}
            setPhases={setPhases}
            onNext={handleNext}
            onPrevious={handlePrevious}
            viewMode="issue"
          />
        );
      case 4:
        return (
          <ReviewSubmit 
            summary={projectSummary}
            phases={phases}
            onPrevious={handlePrevious}
            onSubmit={createGitHubIssues}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Loading Overlay */}
      {isGeneratingPlan && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center">
          <Card className="max-w-md mx-auto">
            <CardContent className="flex flex-col items-center justify-center py-12 px-8">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Generating Project Plan</h3>
              <p className="text-gray-600 text-center">
                Analyzing your project requirements and creating a comprehensive delivery plan...
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Button onClick={handleBack} variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">{repo}</h1>
                  <p className="text-sm text-muted-foreground">{owner}/{repo}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Github className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <Users className="w-3 h-3 mr-1" />
                8 Roles Active
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Store current project data for enhanced workflow
                  localStorage.setItem('projectSummary', JSON.stringify(projectSummary));
                  localStorage.setItem('readmeContent', readmeContent);
                  navigate(`/plan/${owner}/${repo}/enhanced`);
                }}
                className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 hover:from-purple-100 hover:to-blue-100"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Enhanced Plan (Beta)
              </Button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  currentStep >= index 
                    ? 'bg-blue-600 border-blue-600 text-white' 
                    : 'border-gray-300 text-gray-400'
                }`}>
                  <step.icon className="w-5 h-5" />
                </div>
                <div className="ml-3">
                  <p className={`text-sm font-medium ${
                    currentStep >= index ? 'text-blue-600' : 'text-gray-400'
                  }`}>
                    Step {index + 1}
                  </p>
                  <p className={`text-xs ${
                    currentStep >= index ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {step.title}
                  </p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-20 h-0.5 mx-6 transition-all duration-300 ${
                    currentStep > index ? 'bg-blue-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <div className="transition-all duration-300">
        {renderStepContent()}
      </div>
    </div>
  );
};

export default PlanWorkflow;