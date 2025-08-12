interface GitHubRepo {
  name: string;
  html_url: string;
  created_at: string;
  private: boolean;
  description?: string;
}

interface GitHubError {
  message: string;
  documentation_url?: string;
}

const GITHUB_API_BASE = 'https://api.github.com';
const GITHUB_ORG = import.meta.env.VITE_GITHUB_ORG || '';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';

export const githubService = {
  /**
   * Check if a repository exists
   */
  async checkRepoExists(repoName: string): Promise<GitHubRepo | null> {
    if (!GITHUB_ORG) {
      console.warn('GITHUB_ORG not configured in environment');
      return null;
    }

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      
      if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      }

      const response = await fetch(
        `${GITHUB_API_BASE}/repos/${GITHUB_ORG}/${repoName}`,
        { headers }
      ).catch((error) => {
        console.debug(`GitHub API check for ${repoName}: Network error`, error);
        throw error;
      });
      
      if (response.status === 404) {
        // This is expected when checking if a repo exists before creation
        console.debug(`Repository ${repoName} not found (404) - this is expected for new repos`);
        return null;
      }
      
      if (response.status === 401) {
        throw new Error('GitHub authentication failed. Check your token.');
      }
      
      if (response.status === 403) {
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        if (rateLimitRemaining === '0') {
          throw new Error('GitHub API rate limit exceeded. Try again later.');
        }
        throw new Error('GitHub API access forbidden. Check your permissions.');
      }
      
      if (!response.ok) {
        const error: GitHubError = await response.json();
        throw new Error(`GitHub API error: ${error.message}`);
      }
      
      return await response.json();
    } catch (error) {
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Unable to connect to GitHub. Check your internet connection.');
      }
      throw error;
    }
  },

  /**
   * List recent repositories in the organization
   */
  async listRecentRepos(prefix: string = 'ci-', limit: number = 10): Promise<GitHubRepo[]> {
    if (!GITHUB_ORG) {
      return [];
    }

    try {
      const headers: HeadersInit = {
        'Accept': 'application/vnd.github.v3+json',
      };
      
      if (GITHUB_TOKEN) {
        headers['Authorization'] = `token ${GITHUB_TOKEN}`;
      }

      const response = await fetch(
        `${GITHUB_API_BASE}/orgs/${GITHUB_ORG}/repos?sort=created&direction=desc&per_page=${limit}`,
        { headers }
      );
      
      if (!response.ok) {
        console.error('Failed to list repos:', response.status);
        return [];
      }
      
      const repos: GitHubRepo[] = await response.json();
      return repos.filter(repo => repo.name.startsWith(prefix));
    } catch (error) {
      console.error('Error listing repos:', error);
      return [];
    }
  },

  /**
   * Poll for repository creation with exponential backoff
   */
  async pollForRepo(
    repoName: string,
    options: {
      maxAttempts?: number;
      initialInterval?: number;
      maxInterval?: number;
      onProgress?: (attempt: number, nextInterval: number) => void;
    } = {}
  ): Promise<GitHubRepo | null> {
    const {
      maxAttempts = 60, // Total ~5 minutes with exponential backoff
      initialInterval = 2000, // Start with 2 seconds
      maxInterval = 10000, // Cap at 10 seconds
      onProgress
    } = options;
    
    let interval = initialInterval;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (onProgress) {
        onProgress(attempt, interval);
      }
      
      const repo = await this.checkRepoExists(repoName);
      if (repo) {
        return repo;
      }
      
      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, interval));
        // Exponential backoff with max cap
        interval = Math.min(interval * 1.5, maxInterval);
      }
    }
    
    return null;
  },

  /**
   * Get repository contents (useful for checking if research is complete)
   */
  async getRepoContents(repoName: string, path: string = ''): Promise<any> {
    if (!GITHUB_ORG) {
      throw new Error('GITHUB_ORG not configured');
    }

    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
    };
    
    if (GITHUB_TOKEN) {
      headers['Authorization'] = `token ${GITHUB_TOKEN}`;
    }

    const response = await fetch(
      `${GITHUB_API_BASE}/repos/${GITHUB_ORG}/${repoName}/contents/${path}`,
      { headers }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to get repo contents: ${response.status}`);
    }
    
    return await response.json();
  },

  /**
   * Simple check if repo exists (returns boolean)
   */
  async repoExists(repoName: string): Promise<boolean> {
    try {
      const repo = await this.checkRepoExists(repoName);
      return repo !== null;
    } catch (error) {
      // If we can't check, assume it doesn't exist
      return false;
    }
  }
};