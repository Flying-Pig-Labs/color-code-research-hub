import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronUp, ChevronDown, RefreshCw, Clock, CheckCircle2, Circle, Github } from 'lucide-react';

interface PipelineJob {
  id: string;
  title: string;
  type: string;
  status: 'pending' | 'in-progress' | 'completed';
  progress: number;
  stages: PipelineStage[];
  estimatedTimeRemaining?: string;
  elapsedTime: string;
  currentStage?: string;
}

interface PipelineStage {
  id: number;
  name: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed';
  icon?: React.ComponentType<any>;
}

// Mock data - replace with actual API calls
const mockPipelineJob: PipelineJob = {
  id: 'pipeline-123',
  title: 'Market Opportunity Discovery',
  type: 'innovation',
  status: 'in-progress',
  progress: 1,
  estimatedTimeRemaining: '54m 58s',
  elapsedTime: '0m 21s',
  currentStage: 'JTBD & Reddit Discovery',
  stages: [
    {
      id: 1,
      name: 'Initial Setup',
      description: 'Setting up research parameters',
      status: 'completed'
    },
    {
      id: 2,
      name: 'Research Analysis',
      description: 'Conducting comprehensive analysis',
      status: 'completed'
    },
    {
      id: 3,
      name: 'JTBD & Reddit Discovery',
      description: 'Extracting Jobs-to-be-Done from analysis...',
      status: 'in-progress'
    },
    {
      id: 4,
      name: 'Opportunity Zone Analysis',
      description: 'Analyzing market opportunities',
      status: 'pending'
    },
    {
      id: 5,
      name: 'Product Idea Generation',
      description: 'Generating product concepts',
      status: 'pending'
    },
    {
      id: 6,
      name: 'Quick Consolidation',
      description: 'Consolidating findings',
      status: 'pending'
    },
    {
      id: 7,
      name: 'GitHub Repository Creation',
      description: 'Creating project repository',
      status: 'pending',
      icon: Github
    }
  ]
};

export function PipelineTracker() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [pipelineJobs, setPipelineJobs] = useState<PipelineJob[]>([]);
  
  // Mock data for demonstration - replace with actual API call
  useEffect(() => {
    // Simulate having an active job
    setPipelineJobs([mockPipelineJob]);
  }, []);

  // Auto-refresh logic (when actual API is connected)
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      // TODO: Fetch pipeline status from API
      console.log('Refreshing pipeline status...');
    }, 5000);
    
    return () => clearInterval(interval);
  }, [autoRefresh]);

  if (pipelineJobs.length === 0) {
    return null; // Don't show if no active pipelines
  }

  const getStageIcon = (stage: PipelineStage) => {
    if (stage.icon) {
      const Icon = stage.icon;
      return <Icon className="h-4 w-4" />;
    }
    
    switch (stage.status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'pending':
      default:
        return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStageTextColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-700 dark:text-green-400';
      case 'in-progress':
        return 'text-blue-700 dark:text-blue-400 font-medium';
      case 'pending':
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <section className="py-8">
      <div className="max-w-6xl mx-auto px-6">
        <Card className="bg-slate-900 border-slate-700 text-white">
          <CardContent className="p-0">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <Circle className="h-5 w-5 text-amber-500" />
                </div>
                <h3 className="text-lg font-semibold text-slate-100">
                  track running ideation processes and outputs
                </h3>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                    autoRefresh 
                      ? 'bg-slate-800 text-slate-100' 
                      : 'bg-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                  <span>Auto-refresh {autoRefresh ? 'ON' : 'OFF'}</span>
                </button>
                <button
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="p-1 hover:bg-slate-800 rounded transition-colors"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                  )}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="p-4">
                <h4 className="text-lg font-semibold text-slate-100 mb-4">Active Pipeline Jobs</h4>
                
                {pipelineJobs.map((job) => (
                  <div key={job.id} className="space-y-4">
                    {/* Job Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-slate-400 text-sm">Pipeline in progress</span>
                        </div>
                        <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-400/10">
                          {job.progress}%
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-slate-400">
                        <div className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Estimated time remaining: {job.estimatedTimeRemaining}</span>
                        </div>
                        <div>Elapsed: {job.elapsedTime}</div>
                      </div>
                    </div>

                    {/* Job Title */}
                    <h5 className="text-xl font-semibold text-slate-100 mb-4">{job.title}</h5>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-2 mb-6">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-400 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${(job.progress / job.stages.length) * 100}%` }}
                      />
                    </div>

                    {/* Pipeline Stages */}
                    <div className="grid grid-cols-7 gap-4 mb-6">
                      {job.stages.map((stage, index) => (
                        <div key={stage.id} className="text-center">
                          <div className={`
                            w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 transition-all
                            ${stage.status === 'completed' 
                              ? 'bg-green-500/20 text-green-400' 
                              : stage.status === 'in-progress'
                              ? 'bg-blue-500/20 text-blue-400 ring-2 ring-blue-500/50'
                              : 'bg-slate-800 text-slate-500'
                            }
                          `}>
                            {getStageIcon(stage)}
                          </div>
                          <div className="text-xs font-medium text-slate-300 mb-1">
                            {stage.name}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Current Activity */}
                    {job.currentStage && (
                      <div className="bg-slate-800/50 rounded-lg p-4 border-l-4 border-blue-500">
                        <div className="flex items-center space-x-2 mb-1">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-slate-200">
                            {job.stages.find(s => s.name === job.currentStage)?.name}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400">
                          {job.stages.find(s => s.name === job.currentStage)?.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}