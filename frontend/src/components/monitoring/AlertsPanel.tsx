import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  Info, 
  XCircle, 
  CheckCircle, 
  Clock,
  AlertCircle,
  Bell
} from 'lucide-react';
import { Alert } from './types';

interface AlertsPanelProps {
  alerts?: Alert[];
  onAcknowledge?: (alertId: string) => void;
}

export const AlertsPanel: React.FC<AlertsPanelProps> = ({ alerts, onAcknowledge }) => {
  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p>No active alerts</p>
            <p className="text-xs mt-1">All systems operational</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertVariant = (type: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (type) {
      case 'error': return "destructive";
      case 'warning': return "secondary";
      case 'info': return "outline";
      default: return "outline";
    }
  };

  const getPriorityVariant = (priority?: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority) {
      case 'critical': return "destructive";
      case 'high': return "destructive";
      case 'medium': return "secondary";
      case 'low': return "outline";
      default: return "outline";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  // Sort alerts by priority and timestamp
  const sortAlerts = (alertsToSort: Alert[]) => {
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    return alertsToSort.sort((a, b) => {
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 4;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 4;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alerts
          </div>
          {unacknowledgedAlerts.length > 0 && (
            <Badge variant="destructive" className="text-xs">
              {unacknowledgedAlerts.length} new
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-96">
          <div className="space-y-4">
            {/* Active Alerts */}
            {unacknowledgedAlerts.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  Active Alerts ({unacknowledgedAlerts.length})
                </h4>
                
                <div className="space-y-3">
                  {sortAlerts(unacknowledgedAlerts).map(alert => (
                    <div 
                      key={alert.id} 
                      className="border rounded-lg p-3 space-y-2 bg-card"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{alert.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {alert.source} • {formatTime(alert.timestamp)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {alert.priority && (
                            <Badge variant={getPriorityVariant(alert.priority)} className="text-xs">
                              {alert.priority}
                            </Badge>
                          )}
                          <Badge variant={getAlertVariant(alert.type)} className="text-xs">
                            {alert.type}
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                      
                      {onAcknowledge && (
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onAcknowledge(alert.id)}
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Acknowledge
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Recent Alerts */}
            {acknowledgedAlerts.length > 0 && (
              <div className="space-y-3">
                {unacknowledgedAlerts.length > 0 && <hr />}
                
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent Alerts ({acknowledgedAlerts.length})
                </h4>
                
                <div className="space-y-2">
                  {sortAlerts(acknowledgedAlerts.slice(0, 5)).map(alert => (
                    <div 
                      key={alert.id} 
                      className="border rounded-lg p-3 opacity-60 hover:opacity-80 transition-opacity"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          {getAlertIcon(alert.type)}
                          <div className="flex-1">
                            <div className="font-medium text-sm">{alert.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {alert.source} • {formatTime(alert.timestamp)}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <Badge variant="outline" className="text-xs">
                            Resolved
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};