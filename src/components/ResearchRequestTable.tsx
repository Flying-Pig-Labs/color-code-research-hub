import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { apiService } from "@/services/api";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ResearchTask {
  id: string;
  team: string;
  vendorName?: string;
  whitespaceType?: string[];
  targetUser?: string[];
  createdAt: string;
  deadline?: string;
  status: string;
  teamSize?: string;
  roles?: string[];
}

interface ResearchRequestTableProps {
  teamType: 'red' | 'black' | 'white';
}

const ResearchRequestTable = ({ teamType }: ResearchRequestTableProps) => {
  const [tasks, setTasks] = useState<ResearchTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingApi, setIsUsingApi] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      // First, try to get tasks from API
      setIsLoading(true);
      try {
        // Check if API is available
        const health = await apiService.checkHealth();
        if (health.status === 'healthy') {
          setIsUsingApi(true);
          // TODO: Implement API endpoint to fetch research tasks
          // For now, we'll still use localStorage
        }
      } catch (error) {
        setIsUsingApi(false);
        // API not available, continue with localStorage
      }
      
      // Load from localStorage (fallback or primary for now)
      const existingTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
      const teamTasks = existingTasks.filter((task: ResearchTask) => task.team === teamType);
      setTasks(teamTasks.reverse()); // Show newest first
      setIsLoading(false);
    };

    loadTasks();
    
    // Listen for storage changes
    const handleStorageChange = () => {
      loadTasks();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom event when tasks are added
    const handleTaskAdded = () => {
      loadTasks();
    };
    
    window.addEventListener('taskAdded', handleTaskAdded);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('taskAdded', handleTaskAdded);
    };
  }, [teamType]);

  const getTeamColor = (team: string) => {
    switch (team) {
      case 'red': return 'bg-red-team text-white';
      case 'black': return 'bg-black-team text-white';
      case 'white': return 'bg-white-team-dark text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getTaskTitle = (task: ResearchTask) => {
    if (task.vendorName) return task.vendorName;
    if (task.whitespaceType && task.whitespaceType.length > 0) {
      return task.whitespaceType[0];
    }
    return 'Research Task';
  };

  const getTaskDescription = (task: ResearchTask) => {
    if (task.targetUser && task.targetUser.length > 0) {
      return `Target: ${task.targetUser.join(', ')}`;
    }
    if (task.roles && task.roles.length > 0) {
      return `Roles: ${task.roles.join(', ')}`;
    }
    return 'Research in progress';
  };

  if (isLoading) {
    return (
      <Card className={`${teamType === 'black' ? 'bg-black-team-light border-white/20' : 'border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`text-lg ${teamType === 'black' ? 'text-white' : 'text-foreground'}`}>
            Recent Research Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className={`h-6 w-6 animate-spin ${teamType === 'black' ? 'text-white' : 'text-muted-foreground'}`} />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tasks.length === 0) {
    return (
      <Card className={`${teamType === 'black' ? 'bg-black-team-light border-white/20' : 'border-gray-200'}`}>
        <CardHeader>
          <CardTitle className={`text-lg ${teamType === 'black' ? 'text-white' : 'text-foreground'} flex items-center justify-between`}>
            <span>Recent Research Requests</span>
            {isUsingApi && (
              <Badge variant="outline" className="text-xs">
                API Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-center py-8 ${teamType === 'black' ? 'text-white/70' : 'text-muted-foreground'}`}>
            No research requests yet. Launch your first swarm above!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`${teamType === 'black' ? 'bg-black-team-light border-white/20' : 'border-gray-200'}`}>
      <CardHeader>
        <CardTitle className={`text-lg ${teamType === 'black' ? 'text-white' : 'text-foreground'} flex items-center justify-between`}>
          <span>Recent Research Requests</span>
          {isUsingApi && (
            <Badge variant="outline" className="text-xs">
              API Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className={teamType === 'black' ? 'border-white/20' : ''}>
              <TableHead className={teamType === 'black' ? 'text-white' : ''}>Request</TableHead>
              <TableHead className={teamType === 'black' ? 'text-white' : ''}>Team Size</TableHead>
              <TableHead className={teamType === 'black' ? 'text-white' : ''}>Deadline</TableHead>
              <TableHead className={teamType === 'black' ? 'text-white' : ''}>Status</TableHead>
              <TableHead className={teamType === 'black' ? 'text-white' : ''}>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} className={teamType === 'black' ? 'border-white/20' : ''}>
                <TableCell className={teamType === 'black' ? 'text-white' : ''}>
                  <div>
                    <div className="font-medium">{getTaskTitle(task)}</div>
                    <div className={`text-sm ${teamType === 'black' ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {getTaskDescription(task)}
                    </div>
                  </div>
                </TableCell>
                <TableCell className={teamType === 'black' ? 'text-white' : ''}>
                  {task.teamSize || 'N/A'}
                </TableCell>
                <TableCell className={teamType === 'black' ? 'text-white' : ''}>
                  {task.deadline ? format(new Date(task.deadline), 'MMM dd') : 'No deadline'}
                </TableCell>
                <TableCell>
                  <Badge className={getTeamColor(task.team)}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className={teamType === 'black' ? 'text-white' : ''}>
                  {format(new Date(task.createdAt), 'MMM dd, HH:mm')}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ResearchRequestTable;