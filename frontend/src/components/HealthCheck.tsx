import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { apiService, getCurrentEnvironment } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type HealthStatus = 'checking' | 'healthy' | 'local' | 'error';

export function HealthCheck() {
  const [status, setStatus] = useState<HealthStatus>('checking');
  const [isChecking, setIsChecking] = useState(false);
  const environment = getCurrentEnvironment();

  const checkHealth = async () => {
    setIsChecking(true);
    setStatus('checking');
    
    try {
      const health = await apiService.checkHealth();
      
      if (health.status === 'ok' || health.status === 'healthy') {
        setStatus('healthy');
      } else if (environment === 'local') {
        setStatus('local');
      } else {
        setStatus('error');
      }
    } catch (error) {
      if (environment === 'local') {
        setStatus('local');
      } else {
        setStatus('error');
      }
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkHealth();
    
    // Re-check health every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'checking':
        return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />;
      case 'healthy':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'local':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'checking':
        return 'Checking connection...';
      case 'healthy':
        return 'Connected to backend';
      case 'local':
        return 'Connected to local backend';
      case 'error':
        return 'Backend connection failed';
    }
  };

  const getTooltipContent = () => {
    switch (status) {
      case 'healthy':
        return 'Successfully connected to the backend';
      case 'local':
        return 'Running in local mode with backend on port 3001';
      case 'error':
        return (
          <div className="space-y-2">
            <p>Unable to connect to backend. Please check:</p>
            <ul className="list-disc list-inside text-xs">
              <li>Backend server is running on port 3001</li>
              <li>Run: npm run start:backend</li>
            </ul>
          </div>
        );
      default:
        return 'Checking backend connection status...';
    }
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-2 text-sm">
              {getStatusIcon()}
              <span className="hidden sm:inline">{getStatusText()}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {getTooltipContent()}
          </TooltipContent>
        </Tooltip>
        
        {status === 'error' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={checkHealth}
            disabled={isChecking}
            className="h-8 px-2"
          >
            <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>
    </TooltipProvider>
  );
}