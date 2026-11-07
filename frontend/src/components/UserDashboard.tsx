import React, { useState, useEffect } from 'react';

interface ResearchReport {
  reportId: string;
  username: string;
  team: string;
  objective: string;
  status: string;
  processedSummary: string;
  createdAt: string;
  downloadUrl?: string;
}

interface PipelineJob {
  jobId: string;
  username: string;
  researchId: string;
  status: string;
  githubRepoUrl?: string;
  githubRepoName?: string;
  currentStage: string;
  overallProgress: number;
  startTime: string;
  endTime?: string;
  issuesCreated?: number;
}

interface Repository {
  repoName: string;
  issues: Array<{
    issueId: string;
    issueNumber: number;
    title: string;
    labels: string[];
    url: string;
    createdAt: string;
    body: string;
  }>;
  totalIssues: number;
  latestActivity: string;
  githubUrl: string;
}

interface SharkReview {
  issue_id: string;
  review_timestamp: string;
  issue_title: string;
  issue_url: string;
  repo_name: string;
  shark_score?: number;
  investment_total?: number;
  investment_display?: string;
}

interface DashboardData {
  reports: ResearchReport[];
  pipelineJobs: PipelineJob[];
  repositories: Repository[];
  sharkReviews: SharkReview[];
}

export default function UserDashboard() {
  const [data, setData] = useState<DashboardData>({
    reports: [],
    pipelineJobs: [],
    repositories: [],
    sharkReviews: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      
      // Get JWT token from storage/context
      const token = localStorage.getItem('authToken') || '';
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [reportsRes, jobsRes, reposRes, sharkRes] = await Promise.all([
        fetch('/api/user/research/reports', { headers }),
        fetch('/api/user/pipeline/jobs', { headers }),
        fetch('/api/user/repositories', { headers }),
        fetch('/api/user/shark/reviews', { headers })
      ]);

      if (!reportsRes.ok || !jobsRes.ok || !reposRes.ok || !sharkRes.ok) {
        throw new Error('Failed to fetch user data');
      }

      const [reportsData, jobsData, reposData, sharkData] = await Promise.all([
        reportsRes.json(),
        jobsRes.json(), 
        reposRes.json(),
        sharkRes.json()
      ]);

      setData({
        reports: reportsData.data || [],
        pipelineJobs: jobsData.data || [],
        repositories: reposData.data || [],
        sharkReviews: sharkData.data || []
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const buildRepository = async (repoName: string, issueNumber: number) => {
    try {
      const token = localStorage.getItem('authToken') || '';
      
      const response = await fetch('/api/user/build/repository', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          repoName,
          issueNumber
        })
      });

      if (response.ok) {
        alert('Repository build triggered! Check your pipeline jobs for progress.');
        // Refresh data
        fetchUserData();
      } else {
        alert('Build failed. Please try again.');
      }
    } catch (err) {
      alert('Error triggering build. Please try again.');
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading your dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading dashboard: {error}</p>
        <button 
          onClick={fetchUserData} 
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">My Research Dashboard</h1>
        <p className="text-gray-600 mt-2">
          View all your research reports, pipeline jobs, and generated ideas in one place
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              📄
            </div>
            <div className="ml-4">
              <h3 className="font-semibold">Research Reports</h3>
              <div className="text-2xl font-bold">{data.reports.length}</div>
              <p className="text-gray-600 text-sm">Completed research studies</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              🔧
            </div>
            <div className="ml-4">
              <h3 className="font-semibold">Pipeline Jobs</h3>
              <div className="text-2xl font-bold">{data.pipelineJobs.length}</div>
              <p className="text-gray-600 text-sm">
                {data.pipelineJobs.filter(j => j.status === 'SUCCEEDED').length} successful
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              💡
            </div>
            <div className="ml-4">
              <h3 className="font-semibold">Generated Ideas</h3>
              <div className="text-2xl font-bold">
                {data.repositories.reduce((sum, repo) => sum + repo.totalIssues, 0)}
              </div>
              <p className="text-gray-600 text-sm">
                Across {data.repositories.length} repositories
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              🦈
            </div>
            <div className="ml-4">
              <h3 className="font-semibold">Shark Reviews</h3>
              <div className="text-2xl font-bold">{data.sharkReviews.length}</div>
              <p className="text-gray-600 text-sm">
                AI shark evaluations
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Research Reports Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Research Reports ({data.reports.length})</h2>
        <div className="grid gap-4">
          {data.reports.map((report) => (
            <div key={report.reportId} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{report.objective}</h3>
                  <p className="text-gray-600 text-sm">
                    Team: {report.team} • {new Date(report.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    report.status === 'completed' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {report.status}
                  </span>
                  {report.downloadUrl && (
                    <button
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      onClick={() => window.open(report.downloadUrl, '_blank')}
                    >
                      📥 Download
                    </button>
                  )}
                </div>
              </div>
              <p className="text-gray-700 mt-3">{report.processedSummary}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pipeline Jobs Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Pipeline Jobs ({data.pipelineJobs.length})</h2>
        <div className="grid gap-4">
          {data.pipelineJobs.map((job) => (
            <div key={job.jobId} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">
                    {job.githubRepoName || 'Pipeline Job'}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Started: {new Date(job.startTime).toLocaleDateString()} • 
                    Stage: {job.currentStage}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    job.status === 'SUCCEEDED' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {job.status}
                  </span>
                  <div className="text-sm text-gray-600">
                    {job.overallProgress}%
                  </div>
                  {job.githubRepoUrl && (
                    <button
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                      onClick={() => window.open(job.githubRepoUrl, '_blank')}
                    >
                      🔗 View Repo
                    </button>
                  )}
                </div>
              </div>
              {job.issuesCreated && (
                <p className="text-gray-700 mt-3">
                  Generated {job.issuesCreated} ideas in this repository
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Repositories & Ideas Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">
          Generated Ideas & Repositories ({data.repositories.length})
        </h2>
        <div className="space-y-6">
          {data.repositories.map((repo) => (
            <div key={repo.repoName} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{repo.repoName}</h3>
                  <p className="text-gray-600 text-sm">
                    {repo.totalIssues} ideas • Last activity: {new Date(repo.latestActivity).toLocaleDateString()}
                  </p>
                </div>
                <button
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                  onClick={() => window.open(repo.githubUrl, '_blank')}
                >
                  🔗 View on GitHub
                </button>
              </div>
              <div className="space-y-4">
                {repo.issues.map((issue) => (
                  <div key={issue.issueId} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{issue.title}</h4>
                      <div className="flex gap-1">
                        {issue.labels.map((label) => (
                          <span key={label} className="px-2 py-1 bg-gray-100 text-xs rounded">
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{issue.body}</p>
                    <div className="flex gap-2">
                      <button
                        className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                        onClick={() => window.open(issue.url, '_blank')}
                      >
                        🔗 View Issue
                      </button>
                      <button
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                        onClick={() => buildRepository(repo.repoName, issue.issueNumber)}
                      >
                        🏗️ Build Repository
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Shark Reviews Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Shark Tank Reviews ({data.sharkReviews.length})</h2>
        <div className="grid gap-4">
          {data.sharkReviews.map((review) => (
            <div key={review.issue_id + review.review_timestamp} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{review.issue_title}</h3>
                  <p className="text-gray-600 text-sm">
                    Repository: {review.repo_name} • 
                    Reviewed: {new Date(review.review_timestamp).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 items-center">
                  {review.shark_score && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded font-medium">
                      Score: {review.shark_score}/100
                    </span>
                  )}
                  {review.investment_display && (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded font-medium">
                      💰 {review.investment_display}
                    </span>
                  )}
                  <button
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    onClick={() => window.open(review.issue_url, '_blank')}
                  >
                    🔗 View Issue
                  </button>
                </div>
              </div>
            </div>
          ))}
          {data.sharkReviews.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No shark reviews found. Generate some ideas and submit them for review!
            </div>
          )}
        </div>
      </section>
    </div>
  );
}