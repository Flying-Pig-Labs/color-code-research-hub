import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Play,
  User,
  Timer
} from 'lucide-react';
import { Task } from './types';

interface TaskTimelineProps {
  tasks?: Task[];
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Task Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active tasks</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'running': return <Play className="h-4 w-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'pending': return "secondary";
      case 'running': return "default";
      case 'completed': return "outline";
      case 'failed': return "destructive";
      default: return "outline";
    }
  };

  const getPriorityVariant = (priority?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'high': return "destructive";
      case 'medium': return "secondary";
      case 'low': return "outline";
      default: return "outline";
    }
  };

  const formatDuration = (ms?: number) => {
    if (!ms) return '-';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString();
  };

  const renderTask = (task: Task, level: number = 0) => (
    <div key={task.id} className={`space-y-3 ${level > 0 ? 'ml-6 border-l pl-4' : ''}`}>
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            {getStatusIcon(task.status)}
            <div className="flex-1">
              <div className="font-medium text-sm">{task.name}</div>
              {task.assignedTo && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <User className="h-3 w-3" />
                  {task.assignedTo}
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {task.priority && (
              <Badge variant={getPriorityVariant(task.priority)} className="text-xs">
                {task.priority}
              </Badge>
            )}
            <Badge variant={getStatusVariant(task.status)} className="text-xs">
              {task.status}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{task.progress}%</span>
          </div>
          <Progress value={task.progress} className="h-2" />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            {task.startedAt && (
              <div className="flex items-center gap-1">
                <Play className="h-3 w-3" />
                Started: {formatTime(task.startedAt)}
              </div>
            )}
            {task.completedAt && (
              <div className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Completed: {formatTime(task.completedAt)}
              </div>
            )}
          </div>
          
          {task.duration && (
            <div className="flex items-center gap-1">
              <Timer className="h-3 w-3" />
              {formatDuration(task.duration)}
            </div>
          )}
        </div>
      </div>
      
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="space-y-2">
          {task.subtasks.map(subtask => renderTask(subtask, level + 1))}
        </div>
      )}
    </div>
  );

  // Calculate summary statistics
  const activeTasks = tasks.filter(t => t.status === 'running');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');
  const pendingTasks = tasks.filter(t => t.status === 'pending');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Task Timeline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-blue-600">{activeTasks.length}</div>
            <div className="text-xs text-muted-foreground">Running</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-yellow-600">{pendingTasks.length}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-green-600">{completedTasks.length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
          <div className="text-center space-y-1">
            <div className="text-2xl font-bold text-red-600">{failedTasks.length}</div>
            <div className="text-xs text-muted-foreground">Failed</div>
          </div>
        </div>
        
        {/* Task List */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {tasks
            .sort((a, b) => {
              // Sort by status priority: running > pending > completed > failed
              const statusOrder = { 'running': 0, 'pending': 1, 'completed': 2, 'failed': 3 };
              return statusOrder[a.status as keyof typeof statusOrder] - statusOrder[b.status as keyof typeof statusOrder];
            })
            .map(task => renderTask(task))
          }
        </div>
      </CardContent>
    </Card>
  );
};