/**
 * @fileoverview User Dashboard component for displaying all user entities (projects, reports, ideations, doubles, repositories).
 * 
 * Provides a comprehensive view of all user-related data with filtering and search capabilities.
 * Uses the authenticated user context to display only user-specific entities.
 * 
 * @author truflr.ai Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import { v2Api } from '../services/v2/api';
import type { Project, Report, Ideation, Double, PipelineRepo, PipelineIssue, PipelineReposResponse } from '../services/v2/api';

interface EntityCounts {
  projects: number;
  reports: number;
  ideations: number;
  doubles: number;
  repositories: number;
  issues: number;
}

interface UserDashboardProps {
  className?: string;
}

type EntityType = 'projects' | 'reports' | 'ideations' | 'doubles' | 'repositories' | 'issues';

const UserDashboard: React.FC<UserDashboardProps> = ({ className }) => {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<EntityType>('projects');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Entity data state
  const [projects, setProjects] = useState<Project[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [ideations, setIdeations] = useState<Ideation[]>([]);
  const [doubles, setDoubles] = useState<Double[]>([]);
  const [repositories, setRepositories] = useState<PipelineRepo[]>([]);
  const [issues, setIssues] = useState<PipelineIssue[]>([]);

  const [counts, setCounts] = useState<EntityCounts>({
    projects: 0,
    reports: 0,
    ideations: 0,
    doubles: 0,
    repositories: 0,
    issues: 0
  });

  // Load all user entities
  const loadAllEntities = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [projectsData, reportsData, ideationsData, doublesData, pipelineReposData] = await Promise.all([
        v2Api.listProjects(),
        v2Api.listReports(),
        v2Api.listIdeations(), 
        v2Api.listDoubles(),
        v2Api.listPipelineRepos('all') as Promise<PipelineReposResponse>
      ]);

      setProjects(projectsData || []);
      setReports(reportsData || []);
      setIdeations(ideationsData || []);
      setDoubles(doublesData || []);
      
      // Handle PipelineRepos response structure
      const reposData = pipelineReposData?.repositories || [];
      const issuesData = pipelineReposData?.issues || [];
      
      setRepositories(reposData);
      setIssues(issuesData);

      setCounts({
        projects: projectsData?.length || 0,
        reports: reportsData?.length || 0,
        ideations: ideationsData?.length || 0,
        doubles: doublesData?.length || 0,
        repositories: reposData.length,
        issues: issuesData.length
      });
    } catch (err) {
      console.error('Error loading user entities:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllEntities();
  }, [user]);

  // Filter entities based on search term
  const filterEntities = <T extends { title?: string; name?: string }>(entities: T[]): T[] => {
    if (!searchTerm) return entities;
    const term = searchTerm.toLowerCase();
    return entities.filter(entity => {
      const title = entity.title?.toLowerCase() || '';
      const name = (entity as any).name?.toLowerCase() || '';
      return title.includes(term) || name.includes(term);
    });
  };

  const getActiveEntities = () => {
    switch (activeTab) {
      case 'projects': return filterEntities(projects);
      case 'reports': return filterEntities(reports);
      case 'ideations': return filterEntities(ideations);
      case 'doubles': return filterEntities(doubles);
      case 'repositories': return filterEntities(repositories);
      case 'issues': return filterEntities(issues);
      default: return [];
    }
  };

  const formatDate = (timestamp: number | string) => {
    const date = new Date(typeof timestamp === 'number' ? timestamp : timestamp);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'failed': case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderEntityCard = (entity: any, type: EntityType) => {
    const getId = () => {
      switch (type) {
        case 'projects': return entity.projectId;
        case 'reports': return entity.reportId;
        case 'ideations': return entity.ideationId;
        case 'doubles': return entity.doubleId;
        case 'repositories': return entity.id;
        case 'issues': return entity.id;
        default: return 'unknown';
      }
    };

    const getTitle = () => {
      return entity.title || entity.name || `${type.slice(0, -1)} ${getId()}`;
    };

    const getSubtitle = () => {
      switch (type) {
        case 'reports': return `Team: ${entity.team || 'Unknown'} | Requester: ${entity.requester || 'Unknown'}`;
        case 'ideations': return `Job Type: ${entity.jobType || 'Unknown'} | Status: ${entity.status}`;
        case 'doubles': return `Idea: ${entity.ideaId}`;
        case 'repositories': return entity.description || entity.language || `Language: ${entity.language || 'Unknown'}`;
        case 'issues': return `Issue #${entity.number} | State: ${entity.state}`;
        default: return entity.domain;
      }
    };

    return (
      <div key={getId()} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-semibold text-gray-900 truncate">
            {getTitle()}
          </h3>
          {entity.status && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(entity.status)}`}>
              {entity.status}
            </span>
          )}
        </div>
        
        {getSubtitle() && (
          <p className="text-sm text-gray-600 mb-2">{getSubtitle()}</p>
        )}
        
        <div className="flex justify-between items-center text-xs text-gray-500">
          <span>
            {entity.createdAt ? formatDate(entity.createdAt) : entity.created_at ? formatDate(entity.created_at) : 'No date'}
          </span>
          <span className="text-gray-400">ID: {getId()}</span>
        </div>

        {/* Action links */}
        <div className="mt-3 flex space-x-2">
          {entity.reportUrl && (
            <a href={entity.reportUrl} target="_blank" rel="noopener noreferrer" 
               className="text-blue-600 hover:text-blue-800 text-sm">View Report</a>
          )}
          {entity.ideasUrl && (
            <a href={entity.ideasUrl} target="_blank" rel="noopener noreferrer"
               className="text-blue-600 hover:text-blue-800 text-sm">View Ideas</a>
          )}
          {entity.finalPdfUrl && (
            <a href={entity.finalPdfUrl} target="_blank" rel="noopener noreferrer"
               className="text-blue-600 hover:text-blue-800 text-sm">View PDF</a>
          )}
          {entity.html_url && (
            <a href={entity.html_url} target="_blank" rel="noopener noreferrer"
               className="text-blue-600 hover:text-blue-800 text-sm">View Repository</a>
          )}
        </div>
      </div>
    );
  };

  if (!user) {
    return (
      <div className={`p-6 text-center text-gray-500 ${className || ''}`}>
        Please log in to view your dashboard.
      </div>
    );
  }

  return (
    <div className={`p-6 ${className || ''}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome, {user.name}!
        </h1>
        <p className="text-gray-600">
          Here's an overview of all your projects, reports, ideations, and repositories.
        </p>
      </div>

      {/* Entity counts overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        {Object.entries(counts).map(([key, count]) => (
          <div key={key} className="bg-white border border-gray-200 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{count}</div>
            <div className="text-sm text-gray-600 capitalize">{key}</div>
          </div>
        ))}
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search your entities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tab navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {(['projects', 'reports', 'ideations', 'doubles', 'repositories', 'issues'] as EntityType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab} ({counts[tab]})
            </button>
          ))}
        </nav>
      </div>

      {/* Loading and error states */}
      {loading && (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading your data...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="text-red-800">
            {error}
            <button 
              onClick={loadAllEntities}
              className="ml-2 text-red-600 hover:text-red-800 underline"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Entity grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {getActiveEntities().map((entity) => renderEntityCard(entity, activeTab))}
          
          {getActiveEntities().length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500">
              {searchTerm 
                ? `No ${activeTab} found matching "${searchTerm}"`
                : `No ${activeTab} found`
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserDashboard;