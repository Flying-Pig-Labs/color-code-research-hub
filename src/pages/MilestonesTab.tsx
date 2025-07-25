import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Milestone, Calendar, ChevronRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Phase {
  id: string;
  name: string;
  description: string;
  duration: string;
  order: number;
}

const MilestonesTab = () => {
  const { toast } = useToast();
  const [projectInfo, setProjectInfo] = useState({
    title: '',
    description: '',
    readmeContent: ''
  });
  const [phases, setPhases] = useState<Phase[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Default milestone phases for software projects
  const defaultPhases: Phase[] = [
    {
      id: '1',
      name: 'Discovery & Planning',
      description: 'Initial research, requirements gathering, and project setup',
      duration: '2 weeks',
      order: 1
    },
    {
      id: '2', 
      name: 'Architecture & Design',
      description: 'System design, technology selection, and infrastructure planning',
      duration: '2 weeks',
      order: 2
    },
    {
      id: '3',
      name: 'Core Development',
      description: 'Building the main features and functionality',
      duration: '6 weeks',
      order: 3
    },
    {
      id: '4',
      name: 'Testing & QA',
      description: 'Comprehensive testing, bug fixes, and quality assurance',
      duration: '2 weeks',
      order: 4
    },
    {
      id: '5',
      name: 'Deployment & Launch',
      description: 'Production deployment, monitoring setup, and go-live',
      duration: '1 week',
      order: 5
    }
  ];

  const generateMilestones = async () => {
    if (!projectInfo.title && !projectInfo.readmeContent) {
      toast({
        title: "Missing Information",
        description: "Please provide either a project title or README content",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      // For now, use default phases with slight customization based on input
      // In a real implementation, this would call an API to generate custom milestones
      const customizedPhases = defaultPhases.map(phase => ({
        ...phase,
        id: `${Date.now()}-${phase.id}`,
        name: phase.name,
        description: `${phase.description} for ${projectInfo.title || 'the project'}`
      }));

      setPhases(customizedPhases);
      
      toast({
        title: "Milestones Generated",
        description: `Generated ${customizedPhases.length} project milestones`,
      });
    } catch (error) {
      console.error('Failed to generate milestones:', error);
      toast({
        title: "Error",
        description: "Failed to generate milestones. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const exportMilestones = () => {
    const milestoneData = {
      project: projectInfo.title || 'Untitled Project',
      generatedAt: new Date().toISOString(),
      phases: phases.map(phase => ({
        name: phase.name,
        description: phase.description,
        duration: phase.duration,
        order: phase.order
      }))
    };

    const blob = new Blob([JSON.stringify(milestoneData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${projectInfo.title || 'project'}-milestones.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Exported Successfully",
      description: "Milestones exported to JSON file",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center">
              <Milestone className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle>Project Milestones</CardTitle>
              <CardDescription>
                Generate high-level project milestones and phases for your development timeline
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Project Information</CardTitle>
          <CardDescription>
            Provide project details to generate customized milestones
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              placeholder="e.g., E-commerce Platform"
              value={projectInfo.title}
              onChange={(e) => setProjectInfo(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          
          <div>
            <Label htmlFor="description">Project Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of your project..."
              value={projectInfo.description}
              onChange={(e) => setProjectInfo(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="readme">README Content (Optional)</Label>
            <Textarea
              id="readme"
              placeholder="Paste your README content here for more accurate milestone generation..."
              value={projectInfo.readmeContent}
              onChange={(e) => setProjectInfo(prev => ({ ...prev, readmeContent: e.target.value }))}
              rows={6}
            />
          </div>

          <Button 
            onClick={generateMilestones}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating Milestones...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Milestones
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Milestones */}
      {phases.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Generated Milestones</h2>
            <Button onClick={exportMilestones} variant="outline" size="sm">
              Export as JSON
            </Button>
          </div>

          <div className="space-y-4">
            {phases.map((phase, index) => (
              <Card key={phase.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center">
                        <span className="text-lg font-bold text-green-700">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{phase.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {phase.description}
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-4">
                          <Calendar className="w-3 h-3 mr-1" />
                          {phase.duration}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Timeline Visualization */}
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold mb-1">Total Timeline</h3>
                  <p className="text-sm text-muted-foreground">
                    Estimated project duration: {phases.reduce((total, phase) => {
                      const weeks = parseInt(phase.duration) || 0;
                      return total + weeks;
                    }, 0)} weeks
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default MilestonesTab;