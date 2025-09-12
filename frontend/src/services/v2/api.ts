import { envConfig } from '@/config/environment';

// Global redirect guard to prevent concurrent redirects
let isRedirecting = false;

function maybeRedirectToAuth() {
  if (typeof window === 'undefined') return;
  if (isRedirecting) return; // Already redirecting, don't fire again
  
  const path = window.location.pathname || '';
  // Never redirect from the auth routes themselves
  if (path.startsWith('/v2/auth')) {
    isRedirecting = false; // Reset flag when we're back on auth page
    return;
  }
  
  isRedirecting = true;
  console.log('Single redirect to auth initiated');
  window.location.assign('/v2/auth');
}

// API helper that attaches Cognito ID token and handles auth redirects.
// If no token is present (or token is rejected), we redirect to /v2/auth.
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('id_token') || sessionStorage.getItem('idToken');
  // If there's no token at all, force re-auth to acquire one
  if (!token) {
    sessionStorage.removeItem('isAuthenticated');
    maybeRedirectToAuth();
    throw new Error('Not authenticated: missing ID token');
  }
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${envConfig.apiBaseUrl}${path}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    // On 401, clear any stale session flags and redirect to auth
    if (res.status === 401) {
      sessionStorage.removeItem('isAuthenticated');
      // Do not remove id_token here; backend may be temporarily rejecting or token may be expired
      maybeRedirectToAuth();
    }
    throw new Error(`API error ${res.status}`);
  }
  if (res.status === 204) {
    return null;
  }
  return res.json();
}

// REST endpoints used by the V2 frontend
export const v2Api = {
  // Billing
  getBalance: () => apiFetch('/credits/balance'),
  createCheckoutSession: (quantity: number, successUrl: string, cancelUrl: string) =>
    apiFetch('/billing/stripe/session', {
      method: 'POST',
      body: JSON.stringify({ quantity, successUrl, cancelUrl }),
    }),

  // Projects
  listProjects: () => apiFetch('/projects'),
  createProject: (data: { title: string; domain?: string; inputs?: any }) =>
    apiFetch('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getProject: (projectId: string) => apiFetch(`/projects/${projectId}`),

  // Actions
  startReport: (projectId: string) =>
    apiFetch(`/projects/${projectId}/report/start`, { method: 'POST', body: JSON.stringify({}) }),
  getReport: (reportId: string) => apiFetch(`/reports/${reportId}`),
  listReports: () => apiFetch('/reports'),
  generateReportPdf: (reportId: string) => apiFetch(`/reports/${reportId}/pdf`, { method: 'POST' }),

  startIdeation: (projectId: string, body: { reportId: string }) =>
    apiFetch(`/projects/${projectId}/ideation/start`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getIdeation: (ideationId: string) => apiFetch(`/ideations/${ideationId}`),
  listIdeations: () => apiFetch('/ideations'),

  startDouble: (projectId: string, body: { ideationId: string; ideaId: string; feedback?: string }) =>
    apiFetch(`/projects/${projectId}/double-down/start`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getDouble: (doubleId: string) => apiFetch(`/double-downs/${doubleId}`),
  listDoubles: () => apiFetch('/double-downs'),

  // Pipeline Data (Real user data)
  listPipelineRepos: (itemType?: 'repo' | 'issue' | 'all') => 
    apiFetch(`/projects${itemType ? `?item_type=${itemType}` : ''}`),
  listPipelineJobs: () => apiFetch('/projects?item_type=jobs'),
  listDoubleDowns: () => apiFetch('/projects?item_type=doubles'),
  getRepositoryIssues: (repoId: string) => apiFetch(`/api/repositories/${repoId}/issues`),
  getRepositoryPulls: (repoId: string) => apiFetch(`/api/repositories/${repoId}/pulls`),
  getRepositoryBuilds: (repoId: string) => apiFetch(`/api/repositories/${repoId}/builds`),
  getIssueComments: (issueId: string) => apiFetch(`/api/issues/${issueId}/comments`),
  getRepositoriesFromIdeations: () => apiFetch('/api/repositories/from-ideations'),

  // Admin
  adminMetrics: () => apiFetch('/admin/metrics'),
  adminUsers: () => apiFetch('/admin/users'),
  adminUserDetail: (userId: string) => apiFetch(`/admin/users/${userId}`),
  adminAdjustCredits: (userId: string, body: { amount: number; reason: string }) =>
    apiFetch(`/admin/users/${userId}/credits`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
};

export type BalanceResponse = { credits: number };
export type Project = { projectId: string; title: string; domain?: string; createdAt: number };
export type ReportStatus = { status: string; reportUrl?: string };
export type IdeationStatus = { status: string; ideasUrl?: string };
export type DoubleStatus = { status: string; finalPdfUrl?: string; zipUrl?: string };

export type Report = {
  reportId: string;
  title: string;
  status: string;
  team?: string;
  requester?: string;
  createdAt: number | string;
  updatedAt?: number | string;
  reportUrl?: string;
  username?: string;
  tags?: string[];
  wordCount?: number;
  confidence?: number;
};

export type Ideation = {
  ideationId: string;
  title: string;
  status: string;
  description?: string;
  createdAt: number | string;
  updatedAt?: number | string;
  username?: string;
  jobType?: string;
  batchJobId?: string;
  inputs?: any;
  outputs?: any;
  duration?: number;
  error?: string;
};

export type Double = {
  doubleId: string;
  projectId: string;
  ideationId: string;
  ideaId: string;
  status: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  finalPdfUrl?: string;
  zipUrl?: string;
};

export type PipelineRepo = {
  id: string;
  name: string;
  full_name?: string;
  description?: string;
  body: string; // README content for repos, issue description for issues
  html_url?: string;
  language?: string;
  stargazers_count?: number;
  created_at: number | string;
  updated_at?: number | string;
  username: string;
  itemType: string; // 'REPO' or 'ISSUE#1', 'ISSUE#2', etc.
  repoId?: string;
  visibility?: string;
};

export type PipelineIssue = {
  id: string;
  number: number;
  title: string;
  body: string; // Issue description
  state: string;
  created_at: number | string;
  updated_at?: number | string;
  username: string;
  itemType: string; // 'ISSUE#1', 'ISSUE#2', etc.
  repoId?: string;
  repository_id?: string;
  labels?: string[];
  assignees?: string[];
};

export type PipelineReposResponse = {
  repositories: PipelineRepo[];
  issues: PipelineIssue[];
  total: {
    repositories: number;
    issues: number;
  };
};

export type Repository = {
  id: number;
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  language: string;
  stargazers_count: number;
  created_at: string;
  updated_at: string;
};

export type Issue = {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  repository_id: number;
};

export type PullRequest = {
  id: number;
  number: number;
  title: string;
  state: string;
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  repository_id: number;
};

export type BuildHistory = {
  id: number;
  status: string;
  start_time: string;
  end_time: string;
  logs_url: string;
  artifacts_url: string;
  repository_id: number;
};

export type IssueComment = {
  issue_id: string;
  shark_name: string;
  decision: string;
  review_content: string;
  investment_amount: number;
  equity_percentage: number;
  confidence_score: number;
  review_timestamp: string;
  repository: string;
};
