import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, GitBranch, Calendar, Users } from 'lucide-react';

interface Phase {
  id: string;
  name: string;
  description: string;
  duration: string;
  epics: any[];
}

interface LifecyclePhasesProps {
  phases: Phase[];
  setPhases: (phases: Phase[]) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const LifecyclePhases = ({ phases, setPhases, onNext, onPrevious }: LifecyclePhasesProps) => {
  // Default phases if none exist
  const defaultPhases: Phase[] = [
    {
      id: '1',
      name: 'Discovery & Planning',
      description: 'Initial research, requirements gathering, and project setup',
      duration: '2 weeks',
      epics: []
    },
    {
      id: '2', 
      name: 'Architecture & Design',
      description: 'System design, technology selection, and infrastructure planning',
      duration: '2 weeks',
      epics: []
    },
    {
      id: '3',
      name: 'Core Development',
      description: 'Building the main features and functionality',
      duration: '6 weeks',
      epics: []
    },
    {
      id: '4',
      name: 'Testing & QA',
      description: 'Comprehensive testing, bug fixes, and quality assurance',
      duration: '2 weeks',
      epics: []
    },
    {
      id: '5',
      name: 'Deployment & Launch',
      description: 'Production deployment, monitoring setup, and go-live',
      duration: '1 week',
      epics: []
    }
  ];

  // Use provided phases or default ones
  const displayPhases = phases.length > 0 ? phases : defaultPhases;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                <GitBranch className="w-5 h-5 mr-2" />
                Lifecycle Phases
              </CardTitle>
              <CardDescription className="text-blue-100">
                Review and customize your project phases
              </CardDescription>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              {displayPhases.length} Phases
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Phases Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayPhases.map((phase, index) => (
          <Card key={phase.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Phase {index + 1}: {phase.name}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {phase.description}
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  {phase.duration}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>{phase.epics.length || 0} Epics</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button onClick={onPrevious} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>
        <Button 
          onClick={onNext}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          Continue to Epics
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default LifecyclePhases;