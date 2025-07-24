import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle2, Github, Loader2, Calendar, Users, FileText } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ReviewSubmitProps {
  summary: any;
  phases: any[];
  onPrevious: () => void;
  onSubmit: () => Promise<void>;
}

const ReviewSubmit = ({ summary, phases, onPrevious, onSubmit }: ReviewSubmitProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onSubmit();
    } catch (error) {
      console.error('Submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate totals
  const totalEpics = phases.reduce((sum, phase) => sum + (phase.epics?.length || 0), 0);
  const totalIssues = phases.reduce((sum, phase) => 
    sum + phase.epics?.reduce((epicSum: number, epic: any) => epicSum + (epic.issues?.length || 0), 0) || 0, 0
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Review & Submit
              </CardTitle>
              <CardDescription className="text-blue-100">
                Review your project plan before creating GitHub issues
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              <Github className="w-4 h-4 mr-2" />
              Ready to Push
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Phases</p>
                <p className="text-2xl font-bold">{phases.length}</p>
              </div>
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Epics</p>
                <p className="text-2xl font-bold">{totalEpics}</p>
              </div>
              <FileText className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Issues</p>
                <p className="text-2xl font-bold">{totalIssues}</p>
              </div>
              <Github className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Roles</p>
                <p className="text-2xl font-bold">8</p>
              </div>
              <Users className="w-8 h-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Project Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-1">{summary?.title || 'Untitled Project'}</h3>
            <p className="text-sm text-muted-foreground">{summary?.description || 'No description provided'}</p>
          </div>
          
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <p className="text-sm font-medium mb-2">Target Users</p>
              <div className="flex flex-wrap gap-1">
                {(summary?.targetUsers || []).map((user: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {user}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Tech Stack</p>
              <div className="flex flex-wrap gap-1">
                {(summary?.techStack || []).map((tech: string, index: number) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium mb-2">Complexity</p>
              <Badge className="capitalize">{summary?.complexity || 'moderate'}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Phase Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Phase Summary</CardTitle>
          <CardDescription>
            Overview of all phases that will be created as GitHub milestones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {phases.map((phase, index) => (
                <div key={phase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">
                      Phase {index + 1}: {phase.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {phase.epics?.length || 0} epics • {phase.duration}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {phase.epics?.reduce((sum: number, epic: any) => sum + (epic.issues?.length || 0), 0) || 0} issues
                  </Badge>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* What will be created */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-3 flex items-center">
            <Github className="w-5 h-5 mr-2" />
            What will be created in GitHub:
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 mt-0.5" />
              <span>{phases.length} Milestones (one for each phase)</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 mt-0.5" />
              <span>{totalEpics} Epic issues with detailed descriptions</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 mt-0.5" />
              <span>{totalIssues} Task issues assigned to appropriate roles</span>
            </li>
            <li className="flex items-start">
              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600 mt-0.5" />
              <span>All issues labeled with phase, role, and priority</span>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button onClick={onPrevious} variant="outline" disabled={isSubmitting}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating GitHub Issues...
            </>
          ) : (
            <>
              <Github className="w-4 h-4 mr-2" />
              Create GitHub Issues
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default ReviewSubmit;