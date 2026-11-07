/**
 * @file ResearchRequestTableEnhanced.tsx
 * @description Enhanced research request table component with GitHub integration and real-time status tracking
 * 
 * This component displays research tasks for different teams (Red, Black, White) with:
 * - Real-time job status updates from EC2 Claude Flow
 * - GitHub repository status checking
 * - Local storage persistence with API sync
 * - Automatic polling for job updates
 * 
 * @module ResearchRequestTableEnhanced
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { apiService } from "@/services/api";
import { Loader2, RefreshCw, ExternalLink, Github, Clock } from "lucide-react";
import { toast } from "sonner";
import { githubService } from "@/services/githubService";
import { jobService } from "@/services/jobService";
import { getExpectedRepoName } from "@/utils/idGenerator";

/**
 * Research task data structure
 * @interface ResearchTask
 */
interface ResearchTask {
  id: string;
  repoId: string; // Unique identifier for GitHub repository tracking
  jobId?: string; // EC2 Claude Flow job ID for status tracking
  team: string;
  vendorName?: string; // For Black Team vendor replacement
  whitespaceType?: string[]; // For White Team opportunity types
  targetUser?: string[]; // Target user segments
  createdAt: string;
  deadline?: string;
  status: string;
  teamSize?: string;
  roles?: string[];
  githubUrl?: string; // Full GitHub repository URL
  githubStatus?: 'pending' | 'checking' | 'found' | 'not-found'; // Repository existence status
  jobStatus?: 'submitted' | 'processing' | 'completed' | 'failed'; // EC2 job processing status
  estimatedTime?: string; // Expected completion time
  customizations?: Record<string, any>; // Team-specific form data
}

/**
 * Props for ResearchRequestTable component
 * @interface ResearchRequestTableProps
 */
interface ResearchRequestTableProps {
  teamType: 'red' | 'black' | 'white';
}

/**
 * Enhanced research request table with real-time updates and GitHub integration
 * 
 * @component
 * @param {ResearchRequestTableProps} props - Component props
 * @returns {JSX.Element} Research request table component
 */
const ResearchRequestTable = ({ teamType }: ResearchRequestTableProps) => {
  const [tasks, setTasks] = useState<ResearchTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUsingApi, setIsUsingApi] = useState(false);
  const [checkingRepos, setCheckingRepos] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const health = await apiService.checkHealth();
        if (health.status === 'healthy') {
          setIsUsingApi(true);
        }
      } catch (error) {
        setIsUsingApi(false);
      }
      
      const existingTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
      const teamTasks = existingTasks.filter((task: ResearchTask) => task.team === teamType);
      setTasks(teamTasks.reverse());
      setIsLoading(false);
    };

    loadTasks();
    
    const handleStorageChange = () => loadTasks();
    const handleTaskAdded = () => loadTasks();
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('taskAdded', handleTaskAdded);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('taskAdded', handleTaskAdded);
    };
  }, [teamType]);

  const checkJobStatus = async (task: ResearchTask) => {
    if (!task.jobId) {
      toast.error('No job ID available for this task');
      return;
    }

    setCheckingRepos(prev => new Set(prev).add(task.id));
    
    try {
      const jobStatus = await jobService.getJobStatus(task.jobId);
      
      if (jobStatus) {
        // Update task with job status
        const allTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
        const updatedTasks = allTasks.map((t: ResearchTask) => 
          t.id === task.id 
            ? { 
                ...t, 
                jobStatus: jobStatus.status,
                status: jobStatus.status === 'completed' ? 'completed' : jobStatus.status,
                githubUrl: jobStatus.status === 'completed' ? jobStatus.githubUrl : t.githubUrl
              }
            : t
        );
        localStorage.setItem('researchTasks', JSON.stringify(updatedTasks));
        window.dispatchEvent(new Event('storage'));
        
        if (jobStatus.status === 'completed') {
          toast.success('Research completed!', {
            description: 'Click the GitHub icon to view results',
            action: {
              label: 'View',
              onClick: () => window.open(jobStatus.githubUrl, '_blank')
            }
          });
        } else if (jobStatus.status === 'failed') {
          toast.error('Research failed', {
            description: jobStatus.error || 'Unknown error occurred'
          });
        } else {
          toast.info(`Job status: ${jobStatus.status}`, {
            description: jobStatus.status === 'processing' ? 'Analysis in progress...' : 'Request submitted'
          });
        }
      } else {
        toast.error('Job not found');
      }
    } catch (error) {
      toast.error('Failed to check job status', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setCheckingRepos(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

  const checkGitHub = async (task: ResearchTask) => {
    if (!task.repoId) {
      toast.error('No tracking ID available for this task');
      return;
    }

    setCheckingRepos(prev => new Set(prev).add(task.id));
    
    try {
      const expectedRepoName = getExpectedRepoName(
        task.team as 'red' | 'black' | 'white',
        task.repoId
      );
      
      const repo = await githubService.checkRepoExists(expectedRepoName);
      
      if (repo) {
        // Update task with GitHub URL
        const allTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
        const updatedTasks = allTasks.map((t: ResearchTask) => 
          t.id === task.id 
            ? { ...t, githubUrl: repo.html_url, githubStatus: 'found', status: 'completed' }
            : t
        );
        localStorage.setItem('researchTasks', JSON.stringify(updatedTasks));
        
        // Trigger reload
        window.dispatchEvent(new Event('storage'));
        
        toast.success('Repository found!', {
          description: 'Click the GitHub icon to view your research results',
          action: {
            label: 'View',
            onClick: () => window.open(repo.html_url, '_blank')
          }
        });
      } else {
        // Update status to not-found (temporarily)
        const allTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
        const updatedTasks = allTasks.map((t: ResearchTask) => 
          t.id === task.id 
            ? { ...t, githubStatus: 'not-found' }
            : t
        );
        localStorage.setItem('researchTasks', JSON.stringify(updatedTasks));
        window.dispatchEvent(new Event('storage'));
        
        toast.info('Repository not found yet', {
          description: `EC2 is still processing. Expected repo: ${expectedRepoName}`
        });
      }
    } catch (error) {
      toast.error('Failed to check GitHub', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setCheckingRepos(prev => {
        const next = new Set(prev);
        next.delete(task.id);
        return next;
      });
    }
  };

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
    if (task.repoId) {
      return `Tracking ID: ${task.repoId}`;
    }
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
              <TableHead className={teamType === 'black' ? 'text-white' : ''}>Status</TableHead>
              <TableHead className={teamType === 'black' ? 'text-white' : ''}>Created</TableHead>
              <TableHead className={teamType === 'black' ? 'text-white' : ''}>Job Status</TableHead>
              <TableHead className={teamType === 'black' ? 'text-white' : ''}>GitHub</TableHead>
              <TableHead className={teamType === 'black' ? 'text-white' : ''}>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map((task) => (
              <TableRow key={task.id} className={teamType === 'black' ? 'border-white/20' : ''}>
                <TableCell className={teamType === 'black' ? 'text-white' : ''}>
                  <div>
                    <div className="font-medium">{getTaskTitle(task)}</div>
                    <div className={`text-sm font-mono ${teamType === 'black' ? 'text-white/70' : 'text-muted-foreground'}`}>
                      {getTaskDescription(task)}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    className={task.status === 'completed' ? 'bg-green-500 text-white' : getTeamColor(task.team)}
                    variant={task.status === 'completed' ? 'default' : 'secondary'}
                  >
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className={teamType === 'black' ? 'text-white' : ''}>
                  {format(new Date(task.createdAt), 'MMM dd, HH:mm')}
                </TableCell>
                <TableCell>
                  {task.jobStatus ? (
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={
                          task.jobStatus === 'completed' ? 'default' :
                          task.jobStatus === 'failed' ? 'destructive' :
                          task.jobStatus === 'processing' ? 'secondary' : 'outline'
                        }
                        className={
                          task.jobStatus === 'completed' ? 'bg-green-500 text-white' :
                          task.jobStatus === 'failed' ? 'bg-red-500 text-white' :
                          task.jobStatus === 'processing' ? 'bg-blue-500 text-white' : ''
                        }
                      >
                        {task.jobStatus === 'processing' && <Clock className="h-3 w-3 mr-1" />}
                        {task.jobStatus}
                      </Badge>
                      {task.estimatedTime && task.jobStatus === 'submitted' && (
                        <span className={`text-xs ${teamType === 'black' ? 'text-white/70' : 'text-muted-foreground'}`}>
                          (~{task.estimatedTime})
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className={`text-sm ${teamType === 'black' ? 'text-white/50' : 'text-muted-foreground'}`}>
                      No job
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {task.githubUrl ? (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="p-1"
                      asChild
                    >
                      <a 
                        href={task.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <Github className="h-4 w-4" />
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  ) : (
                    <span className={`text-sm ${teamType === 'black' ? 'text-white/50' : 'text-muted-foreground'}`}>
                      {task.githubStatus === 'checking' ? 'Checking...' : 'Not yet'}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {/* Job Status Check Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => checkJobStatus(task)}
                      disabled={!task.jobId || checkingRepos.has(task.id)}
                      className={`p-2 ${!task.jobId ? 'opacity-50' : ''}`}
                      title={
                        !task.jobId 
                          ? 'No job ID available' 
                          : checkingRepos.has(task.id)
                          ? 'Checking...'
                          : 'Check job status'
                      }
                    >
                      <Clock className={`h-4 w-4 ${
                        checkingRepos.has(task.id) ? 'animate-spin' : ''
                      }`} />
                    </Button>
                    
                    {/* GitHub Check Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => checkGitHub(task)}
                      disabled={checkingRepos.has(task.id) || !!task.githubUrl}
                      className={`p-2 ${!task.repoId ? 'opacity-50' : ''}`}
                      title={
                        !!task.githubUrl
                          ? 'Repository already found'
                          : checkingRepos.has(task.id)
                          ? 'Checking...'
                          : !task.repoId
                          ? 'No tracking ID available'
                          : 'Check GitHub repository'
                      }
                    >
                      <RefreshCw className={`h-4 w-4 ${
                        checkingRepos.has(task.id) ? 'animate-spin' : ''
                      }`} />
                    </Button>
                  </div>
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