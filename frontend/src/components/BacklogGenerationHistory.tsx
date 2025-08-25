/**
 * @file BacklogGenerationHistory.tsx
 * @description History component for displaying plan generation jobs
 * 
 * Shows a table of recent backlog/milestone generation jobs with their status,
 * repository information, issue counts, and relevant actions.
 */

import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { 
  RefreshCw, 
  ExternalLink, 
  Github, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  GitBranch,
  Hash
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  listPlanGenerationJobs, 
  PlanGenerationJob, 
  calculateDuration, 
  formatDuration,
  getStatusBadgeClasses,
  parseRepositoryName
} from '../services/planApi';

interface BacklogGenerationHistoryProps {
  status?: 'INITIATED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  limit?: number;
}

export function BacklogGenerationHistory({ 
  status, 
  limit = 50 
}: BacklogGenerationHistoryProps) {
  const [jobs, setJobs] = useState<PlanGenerationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadJobs();
  }, [status, limit]);

  const loadJobs = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const response = await listPlanGenerationJobs({ status, limit });
      setJobs(response.jobs);
      
      if (isRefresh) {
        toast.success(`Loaded ${response.jobs.length} plan generation jobs`);
      }
    } catch (err) {
      console.error('Failed to load plan generation jobs:', err);
      setError('Failed to load backlog generation history');
      toast.error('Failed to load backlog generation history');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadJobs(true);
  };

  const getStatusIcon = (status: PlanGenerationJob['status']) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'FAILED':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'PROCESSING':
        return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'INITIATED':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleViewRepository = (repositoryName?: string) => {
    if (!repositoryName) {
      toast.error('Repository information not available');
      return;
    }
    
    const repoInfo = parseRepositoryName(repositoryName);
    if (!repoInfo) {
      toast.error('Invalid repository name format');
      return;
    }
    
    const githubUrl = `https://github.com/${repositoryName}`;
    window.open(githubUrl, '_blank', 'noopener,noreferrer');
  };

  const handleViewIssues = (repositoryName?: string) => {
    if (!repositoryName) {
      toast.error('Repository information not available');
      return;
    }
    
    const repoInfo = parseRepositoryName(repositoryName);
    if (!repoInfo) {
      toast.error('Invalid repository name format');
      return;
    }
    
    const issuesUrl = `https://github.com/${repositoryName}/issues`;
    window.open(issuesUrl, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="sr-only">Loading...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={() => loadJobs()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <GitBranch className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No backlog generation jobs found</h3>
        <p className="text-gray-500 mb-4">
          {status ? `No jobs with status "${status}" found` : 'Start generating your first project backlog'}
        </p>
        <button
          onClick={() => loadJobs()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">
          Backlog Generation History
          {status && (
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({status.toLowerCase()})
            </span>
          )}
        </h3>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`h-3 w-3 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Project
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Repository
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issues
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.map((job) => (
                <tr key={job.jobId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(job.status)}
                      <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeClasses(job.status)}`}>
                        {job.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 font-medium">
                      {job.projectTitle || 'Untitled Project'}
                    </div>
                    {job.error && (
                      <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={job.error}>
                        Error: {job.error}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <Github className="h-4 w-4 mr-2 text-gray-400" />
                      <span className="font-mono">
                        {job.repositoryName || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center">
                      <Hash className="h-4 w-4 mr-1 text-gray-400" />
                      <span className="font-mono">
                        {job.status === 'COMPLETED' 
                          ? `${job.issuesCreated}/${job.totalIssues}`
                          : job.totalIssues > 0 
                            ? `${job.totalIssues} planned`
                            : '-'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(() => {
                      if (!job.createdAt) return 'N/A';
                      const date = new Date(job.createdAt);
                      return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'M/d/yyyy h:mma');
                    })()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="font-mono">
                      {(() => {
                        if (job.status === 'PROCESSING' || job.status === 'INITIATED') {
                          // For in-progress jobs, show time elapsed
                          const duration = calculateDuration(job.createdAt, new Date().toISOString());
                          return formatDuration(duration);
                        } else if (job.completedAt) {
                          // For completed/failed jobs, show total duration
                          const duration = calculateDuration(job.createdAt, job.completedAt);
                          return formatDuration(duration);
                        }
                        return '-';
                      })()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewRepository(job.repositoryName)}
                        disabled={!job.repositoryName}
                        className={`inline-flex items-center px-3 py-1 rounded-lg transition-colors ${
                          job.repositoryName
                            ? 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200 cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 border border-gray-200'
                        }`}
                        title={!job.repositoryName ? 'Repository not available' : 'View repository on GitHub'}
                      >
                        <Github className="h-3 w-3 mr-1" />
                        Repo
                      </button>
                      <button
                        onClick={() => handleViewIssues(job.repositoryName)}
                        disabled={!job.repositoryName || job.status !== 'COMPLETED' || job.issuesCreated === 0}
                        className={`inline-flex items-center px-3 py-1 rounded-lg transition-colors ${
                          job.repositoryName && job.status === 'COMPLETED' && job.issuesCreated > 0
                            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 cursor-pointer'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-60 border border-gray-200'
                        }`}
                        title={
                          !job.repositoryName 
                            ? 'Repository not available' 
                            : job.status !== 'COMPLETED'
                              ? 'Issues not yet created'
                              : job.issuesCreated === 0
                                ? 'No issues were created'
                                : 'View issues on GitHub'
                        }
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Issues
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="flex justify-between items-center text-sm text-gray-500 px-1">
        <span>Showing {jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
        <span>Updated {format(new Date(), 'h:mm:ss a')}</span>
      </div>
    </div>
  );
}