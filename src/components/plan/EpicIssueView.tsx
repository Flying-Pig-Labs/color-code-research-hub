import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, FolderOpen, Edit3, Clock, User } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Issue {
  id: string;
  title: string;
  description: string;
  assignee: string;
  priority: string;
  estimatedHours: number;
}

interface Epic {
  id: string;
  title: string;
  description: string;
  issues: Issue[];
}

interface Phase {
  id: string;
  name: string;
  description: string;
  duration: string;
  epics: Epic[];
}

interface EpicIssueViewProps {
  phases: Phase[];
  setPhases: (phases: Phase[]) => void;
  onNext: () => void;
  onPrevious: () => void;
  viewMode?: 'epic' | 'issue';
}

const EpicIssueView = ({ phases, setPhases, onNext, onPrevious, viewMode = 'epic' }: EpicIssueViewProps) => {
  const isEpicView = viewMode === 'epic';
  
  // Extract all epics from all phases
  const allEpics: Epic[] = phases.flatMap(phase => phase.epics || []);
  
  // Sample data for demonstration (ONLY used if no real data)
  const sampleEpics: Epic[] = [
    {
      id: '1',
      title: 'User Authentication System',
      description: 'Implement secure user authentication with JWT tokens',
      issues: [
        {
          id: '1-1',
          title: 'Design authentication schema',
          description: 'Create database schema for users and sessions',
          assignee: 'architect',
          priority: 'high',
          estimatedHours: 4
        },
        {
          id: '1-2',
          title: 'Implement JWT token generation',
          description: 'Create JWT token generation and validation logic',
          assignee: 'backend-dev',
          priority: 'high',
          estimatedHours: 8
        }
      ]
    },
    {
      id: '2',
      title: 'API Development',
      description: 'Build RESTful API endpoints for core functionality',
      issues: [
        {
          id: '2-1',
          title: 'Design API endpoints',
          description: 'Document all API endpoints and request/response formats',
          assignee: 'architect',
          priority: 'high',
          estimatedHours: 6
        },
        {
          id: '2-2',
          title: 'Implement CRUD operations',
          description: 'Build create, read, update, delete endpoints',
          assignee: 'backend-dev',
          priority: 'medium',
          estimatedHours: 12
        }
      ]
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'architect': return 'bg-purple-100 text-purple-800';
      case 'backend-dev': return 'bg-blue-100 text-blue-800';
      case 'frontend-dev': return 'bg-green-100 text-green-800';
      case 'tester': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center">
                {isEpicView ? (
                  <>
                    <FolderOpen className="w-5 h-5 mr-2" />
                    Epic View
                  </>
                ) : (
                  <>
                    <Edit3 className="w-5 h-5 mr-2" />
                    Issues View
                  </>
                )}
              </CardTitle>
              <CardDescription className="text-blue-100">
                {isEpicView 
                  ? `Review and edit project epics (${allEpics.length > 0 ? allEpics.length : 2} epics total)`
                  : `Review all issues across epics (${allEpics.length > 0 ? allEpics.reduce((sum, epic) => sum + epic.issues.length, 0) : 4} issues total)`
                }
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Content */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4 pr-4">
          {isEpicView ? (
            // Epic View
            (allEpics.length > 0 ? allEpics : sampleEpics).map((epic) => (
              <Card key={epic.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{epic.title}</CardTitle>
                      <CardDescription className="mt-2">{epic.description}</CardDescription>
                    </div>
                    <Badge variant="outline">
                      {epic.issues.length} Issues
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {epic.issues.slice(0, 2).map((issue) => (
                      <div key={issue.id} className="text-sm text-muted-foreground">
                        • {issue.title}
                      </div>
                    ))}
                    {epic.issues.length > 2 && (
                      <div className="text-sm text-muted-foreground">
                        • And {epic.issues.length - 2} more...
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            // Issues View
            (allEpics.length > 0 ? allEpics : sampleEpics).flatMap(epic => 
              epic.issues.map(issue => (
                <Card key={issue.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{issue.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{issue.description}</p>
                        <div className="flex items-center gap-4 mt-3">
                          <Badge className={getRoleColor(issue.assignee)}>
                            <User className="w-3 h-3 mr-1" />
                            {issue.assignee}
                          </Badge>
                          <Badge variant={getPriorityColor(issue.priority)}>
                            {issue.priority}
                          </Badge>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="w-3 h-3 mr-1" />
                            {issue.estimatedHours}h
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )
          )}
        </div>
      </ScrollArea>

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
          {isEpicView ? 'Continue to Issues' : 'Review & Submit'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default EpicIssueView;