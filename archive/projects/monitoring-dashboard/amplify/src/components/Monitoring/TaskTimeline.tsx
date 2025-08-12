import React from 'react';

interface Task {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  assignedTo?: string;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  subtasks?: Task[];
}

interface TaskTimelineProps {
  tasks?: Task[];
}

export const TaskTimeline: React.FC<TaskTimelineProps> = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="task-timeline empty">
        <p>No active tasks</p>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    const icons: { [key: string]: string } = {
      'pending': '⏳',
      'running': '🔄',
      'completed': '✅',
      'failed': '❌'
    };
    return icons[status] || '❓';
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

  const renderTask = (task: Task, level: number = 0) => (
    <div key={task.id} className={`task-item level-${level} status-${task.status}`}>
      <div className="task-header">
        <span className="task-icon">{getStatusIcon(task.status)}</span>
        <span className="task-name">{task.name}</span>
        {task.assignedTo && (
          <span className="task-assignee">→ {task.assignedTo}</span>
        )}
      </div>
      
      <div className="task-details">
        <div className="task-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <span className="progress-text">{task.progress}%</span>
        </div>
        
        <div className="task-timing">
          <span className="duration">{formatDuration(task.duration)}</span>
        </div>
      </div>
      
      {task.subtasks && task.subtasks.length > 0 && (
        <div className="subtasks">
          {task.subtasks.map(subtask => renderTask(subtask, level + 1))}
        </div>
      )}
    </div>
  );

  const activeTasks = tasks.filter(t => t.status === 'running');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');

  return (
    <div className="task-timeline">
      <h3>Task Timeline</h3>
      
      <div className="task-summary">
        <div className="summary-item">
          <span className="summary-count">{activeTasks.length}</span>
          <span className="summary-label">Active</span>
        </div>
        <div className="summary-item">
          <span className="summary-count">{completedTasks.length}</span>
          <span className="summary-label">Completed</span>
        </div>
        <div className="summary-item">
          <span className="summary-count">{failedTasks.length}</span>
          <span className="summary-label">Failed</span>
        </div>
      </div>
      
      <div className="tasks-container">
        {tasks.map(task => renderTask(task))}
      </div>
    </div>
  );
};