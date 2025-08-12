import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Code, 
  Search, 
  TestTube, 
  Target, 
  Building, 
  Eye,
  Bot,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle 
} from 'lucide-react';
import { Agent } from './types';

interface AgentGridProps {
  agents?: Agent[];
}

export const AgentGrid: React.FC<AgentGridProps> = ({ agents }) => {
  if (!agents || agents.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Active Agents (0)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <Bot className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active agents</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAgentIcon = (type: string) => {
    const iconMap = {
      'coder': Code,
      'researcher': Search,
      'tester': TestTube,
      'coordinator': Target,
      'architect': Building,
      'reviewer': Eye
    };
    return iconMap[type as keyof typeof iconMap] || Bot;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'idle': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'offline': return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'active': return "default";
      case 'idle': return "secondary";
      case 'error': return "destructive";
      case 'offline': return "outline";
      default: return "outline";
    }
  };

  const getTimeSince = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'coder': 'bg-blue-500',
      'researcher': 'bg-green-500',
      'tester': 'bg-purple-500',
      'coordinator': 'bg-orange-500',
      'architect': 'bg-cyan-500',
      'reviewer': 'bg-pink-500'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Active Agents ({agents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents.map(agent => {
            const IconComponent = getAgentIcon(agent.type);
            
            return (
              <div 
                key={agent.id} 
                className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={`${getTypeColor(agent.type)} text-white`}>
                        <IconComponent className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium text-sm">{agent.name}</div>
                      <div className="text-xs text-muted-foreground capitalize">
                        {agent.type}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(agent.status)}
                    <Badge variant={getStatusVariant(agent.status)} className="text-xs">
                      {agent.status}
                    </Badge>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {agent.currentTask && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">Current Task:</span>
                      <div className="font-mono text-xs bg-muted p-1 rounded mt-1 truncate">
                        {agent.currentTask}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-xs text-muted-foreground">
                    Last seen: {getTimeSince(agent.lastHeartbeat)}
                  </div>
                </div>
                
                {agent.metrics && (
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div className="text-center">
                      <div className="text-sm font-medium">{agent.metrics.tasksCompleted}</div>
                      <div className="text-xs text-muted-foreground">Tasks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{agent.metrics.successRate}%</div>
                      <div className="text-xs text-muted-foreground">Success</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium">{agent.metrics.avgExecutionTime}s</div>
                      <div className="text-xs text-muted-foreground">Avg Time</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};