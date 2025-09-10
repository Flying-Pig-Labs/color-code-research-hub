import React, { useEffect, useState } from 'react';
import { v2Api, PipelineRepo, PipelineIssue } from '@/services/v2/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { envConfig } from '@/config/environment';

export const PipelineOverview: React.FC = () => {
  const [repos, setRepos] = useState<PipelineRepo[]>([]);
  const [issues, setIssues] = useState<PipelineIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const [repoResp, issueResp] = await Promise.all([
          v2Api.listPipelineRepos('repo'),
          v2Api.listPipelineRepos('issue'),
        ]);
        if (!mounted) return;
        // Normalize basic fields for display fallbacks
        const repos = (repoResp.repositories || []).map((r: any) => ({
          ...r,
          name: r.name || r.repoName || r.full_name,
          html_url: r.html_url || r.repoUrl,
          created_at: r.created_at || r.createdAt,
        }));
        const issues = (issueResp.issues || []).map((i: any) => {
          const org = envConfig.githubOrg;
          const derivedUrl = (i.url || i.html_url) ||
            (org && (i.repoName && i.issueNumber) ? `https://github.com/${org}/${i.repoName}/issues/${i.issueNumber}` : undefined);
          // Derive clean link text like "repo/issues/123"
          let linkText: string | undefined;
          let repoName: string | undefined = i.repoName;
          let issueNumber: string | number | undefined = i.issueNumber || i.number || i.issue_number;
          if (!repoName && (i as any).repo && (i as any).repo.full_name) {
            const full: string = (i as any).repo.full_name;
            const parts = full.split('/');
            repoName = parts[1] || parts[0];
          }
          if ((!repoName || !issueNumber) && (i.url || derivedUrl)) {
            try {
              const u = new URL((i.url || derivedUrl) as string);
              const seg = u.pathname.split('/').filter(Boolean); // [org, repo, 'issues', n]
              if (seg.length >= 4) {
                repoName = repoName || seg[1];
                issueNumber = issueNumber || seg[3];
              }
            } catch {}
          }
          if (!issueNumber && i.itemType) {
            const m = String(i.itemType).match(/ISSUE#(\d+)/i);
            if (m) issueNumber = m[1];
          }
          if (repoName && issueNumber) {
            linkText = `${repoName}/issues/${issueNumber}`;
          }
          return {
            ...i,
            title: i.title || i.body?.slice(0, 60) || 'Issue',
            created_at: i.created_at || i.createdAt,
            url: derivedUrl,
            linkText,
          };
        });
        setRepos(repos);
        setIssues(issues);
      } catch (e: any) {
        if (!mounted) return;
        setError('Failed to load pipeline data');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const buildFromIssue = async (issue: any) => {
    try {
      // Derive repository owner/name and issue number from multiple possible shapes
      let repoFullName: string | undefined = issue.repository || issue.repo_name || (issue.repo && issue.repo.full_name);
      let issueNumber: number | string | undefined = issue.issueNumber || issue.issue_number || issue.number;
      const title = issue.title || 'Generated Idea';

      // Fallback: parse owner/repo/number from GitHub issue URL
      if ((!repoFullName || !issueNumber) && issue.url) {
        const m = String(issue.url).match(/github\.com\/(.+?)\/(.+?)\/issues\/(\d+)/i);
        if (m) {
          repoFullName = repoFullName || `${m[1]}/${m[2]}`;
          issueNumber = issueNumber || m[3];
        }
      }

      // Fallback: construct from org + repoName and parse itemType ISSUE#n
      if (!repoFullName && envConfig.githubOrg && issue.repoName) {
        repoFullName = `${envConfig.githubOrg}/${issue.repoName}`;
      }
      if (!issueNumber && issue.itemType) {
        const mm = String(issue.itemType).match(/ISSUE#(\d+)/i);
        if (mm) issueNumber = mm[1];
      }

      if (!repoFullName || !issueNumber) {
        toast.error('Missing repository or issue number for build');
        return;
      }

      // Trigger external build (existing API used elsewhere in app)
      const buildPayload = {
        repository: repoFullName,
        issue_number: issueNumber,
        title,
        score: issue.sharkScore || 0,
        investment_display: issue.investmentDisplay || '$0',
        rank: issue.rank || 0,
      };
      const resp = await fetch('https://9y4n7ifoql.execute-api.us-east-1.amazonaws.com/prod/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(buildPayload),
      });
      const text = await resp.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error('Invalid response from build API'); }
      if (!resp.ok || !data.success) {
        throw new Error(data?.error || 'Build failed');
      }

      // Persist to PipelineRepos via v2 API (ProjectsCreate hotfix)
      await fetch(`${(import.meta as any).env?.VITE_API_BASE_URL || ''}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${sessionStorage.getItem('id_token') || ''}` },
        body: JSON.stringify({
          action: 'save_repo',
          repoName: data.repo_name || (repoFullName.split('/')[1] || title.replace(/\s+/g, '-').toLowerCase()),
          repoUrl: data.repo_url,
          body: data.readme_content || `# ${title}`,
          createdAt: new Date().toISOString(),
        }),
      });

      toast.success('Repository build triggered');
      // Refresh lists
      const [repoResp, issueResp] = await Promise.all([
        v2Api.listPipelineRepos('repo'),
        v2Api.listPipelineRepos('issue'),
      ]);
      const reposNew = (repoResp.repositories || []).map((r: any) => ({
        ...r, name: r.name || r.repoName || r.full_name, html_url: r.html_url || r.repoUrl, created_at: r.created_at || r.createdAt,
      }));
      const issuesNew = (issueResp.issues || []).map((i: any) => ({
        ...i, title: i.title || i.body?.slice(0, 60) || 'Issue', created_at: i.created_at || i.createdAt,
      }));
      setRepos(reposNew);
      setIssues(issuesNew);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || 'Failed to build repository');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent" />
        Loading pipeline data…
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">{error}</div>
    );
  }

  if (repos.length === 0 && issues.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">No generated repositories or ideas yet.</div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Generated Repositories & Ideas</h3>
        <div className="text-sm text-muted-foreground">
          {repos.length} repos • {issues.length} ideas
        </div>
      </div>

      {repos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Repositories</h4>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Link</th>
                </tr>
              </thead>
              <tbody>
                {repos.slice(0, 5).map((r) => (
                  <tr key={`${r.name}-${r.created_at}`} className="border-t">
                    <td className="px-3 py-2">{r.name || r.repoName || r.id}</td>
                    <td className="px-3 py-2">{r.created_at ? new Date(r.created_at).toLocaleString() : (r.createdAt ? new Date(r.createdAt).toLocaleString() : '-')}</td>
                    <td className="px-3 py-2">
                      {r.html_url || (r as any).repoUrl ? (
                        <a href={(r.html_url || (r as any).repoUrl)!} className="text-blue-600 underline" target="_blank" rel="noreferrer">Open</a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {issues.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Ideas (Issues)</h4>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Title</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Link</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {issues.slice(0, 8).map((i) => (
                  <tr key={`${i.id || i.number || i.title}-${i.number || i.created_at}`} className="border-t">
                    <td className="px-3 py-2">{i.title}</td>
                    <td className="px-3 py-2">{i.created_at ? new Date(i.created_at).toLocaleString() : '-'}</td>
                    <td className="px-3 py-2 break-all">
                      {i.url ? (
                        <a href={i.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">{i.linkText || i.url}</a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <Button variant="outline" size="sm" onClick={() => buildFromIssue(i)}>Build</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineOverview;
