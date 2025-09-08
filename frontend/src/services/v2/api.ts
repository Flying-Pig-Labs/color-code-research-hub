import { envConfig } from '@/config/environment';

// Simplified API helper with Authorization header taken from sessionStorage.
// In production this would use Amplify fetchAuthSession to get the id token.
async function apiFetch(path: string, options: RequestInit = {}) {
  const token = sessionStorage.getItem('id_token') || sessionStorage.getItem('idToken');
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

  // Repositories (DynamoDB-backed)
  listRepositories: () => apiFetch('/api/repositories'),
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
  projectId: string;
  status: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  reportUrl?: string;
};

export type Ideation = {
  ideationId: string;
  projectId: string;
  reportId: string;
  status: string;
  title?: string;
  createdAt: number;
  updatedAt: number;
  ideasUrl?: string;
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
