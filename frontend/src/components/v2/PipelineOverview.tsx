import React, { useEffect, useState } from 'react';
import { v2Api, PipelineRepo, PipelineIssue } from '@/services/v2/api';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/apiFetch';
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
        const repos = (repoResp.repositories || []).map((r: any) => {
          const org = envConfig.githubOrg;
          const repoName = r.repoName || r.name || (r.full_name ? String(r.full_name).split('/')[1] : undefined) || r.id;
          // Always prefer repoUrl per data model
          const repoUrl = r.repoUrl || r.html_url || r.url || (org && repoName ? `https://github.com/${org}/${repoName}` : undefined);
          return {
            ...r,
            name: repoName,
            repoUrl,
            created_at: r.created_at || r.createdAt || r.timestamp,
          } as any;
        });
        const issues = (issueResp.issues || []).map((i: any) => {
          const org = envConfig.githubOrg;
          // Always prefer native url per data model
          const derivedUrl = i.url || i.html_url || (i as any).github_url || (i as any).issueUrl ||
            (org && (i.repoName && i.issueNumber) ? `https://github.com/${org}/${i.repoName}/issues/${i.issueNumber}` : undefined);
          // Derive clean link text like "repo/issues/123"
          let linkText: string | undefined;
          let repoName: string | undefined = i.repoName || (i as any).repo_name;
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

      // Fallback: construct from id (e.g., "ISSUE#2:reponame") and itemType
      if (!repoFullName && envConfig.githubOrg && typeof issue.id === 'string' && issue.id.includes(':')) {
        try {
          const after = issue.id.split(':')[1];
          if (after) repoFullName = `${envConfig.githubOrg}/${after}`;
        } catch {}
      }
      // Fallback: construct from org + repoName if provided by payload
      if (!repoFullName && envConfig.githubOrg && issue.repoName) {
        repoFullName = `${envConfig.githubOrg}/${issue.repoName}`;
      }
      // Derive issue number from itemType if missing
      if (!issueNumber && issue.itemType) {
        const mm = String(issue.itemType).match(/ISSUE#(\d+)/i);
        if (mm) issueNumber = mm[1];
      }

      if (!repoFullName || !issueNumber) {
        toast.error('Missing repository or issue number for build');
        return;
      }

      // Normalize org to desired build org
      try {
        const desiredOrg = envConfig.githubOrg || (repoFullName?.split('/')[0] || 'ocean-studio-apps');
        const repoOnly = (repoFullName || '').includes('/') ? repoFullName!.split('/')[1] : (issue.repoName || title.replace(/\s+/g, '-').toLowerCase());
        if (desiredOrg && repoOnly) repoFullName = `${desiredOrg}/${repoOnly}`;
      } catch {}

      // Collect Shark review comments and refine README via backend
      let refinedReadme = issue.body || `# ${title}`;
      try {
        const desiredOrg = envConfig.githubOrg || 'ocean-studio-apps';
        const repoOnly = (repoFullName || '').includes('/') ? (repoFullName as string).split('/')[1] : (issue.repoName || title.replace(/\s+/g, '-').toLowerCase());
        const issueId = `${desiredOrg}/${repoOnly}#${issueNumber}`;
        const reviewsResp: any = await v2Api.getIssueComments(issueId);
        const reviews: any[] = Array.isArray(reviewsResp) ? reviewsResp : (Array.isArray(reviewsResp?.items) ? reviewsResp.items : []);
        const refineRes = await fetch(`${envConfig.apiBaseUrl}/api/ideas/refine`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repository: repoFullName, issue_number: issueNumber, title, issue_body: issue.body || `# ${title}`, reviews }),
        });
        const refineData = await refineRes.json().catch(() => ({}));
        if (refineRes.ok && refineData?.refined_markdown) {
          refinedReadme = refineData.refined_markdown;
        }
      } catch {}

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
      try { data = JSON.parse(text); } catch { /* ignore parse; may be non-JSON error */ }
      if (!resp.ok || !data?.success) {
        // Handle repo already exists gracefully
        const alreadyExists = (resp.status === 422) && /name already exists/i.test(text) || /name already exists/i.test(String(data?.error));
        const repoNameFromData = data?.repo_name || (repoFullName?.split('/')[1]);
        const link = repoFullName ? `https://github.com/${repoFullName}` : undefined;
        if (alreadyExists && repoNameFromData && link) {
          // Ensure refined README is saved
          try {
            await fetch(`${envConfig.apiBaseUrl}/api/github/repos/readme`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ repository: repoFullName as string, content: refinedReadme, message: 'refine: update README.md' }),
            });
          } catch {}
          // Save a record into Repositories table so it appears in data layer
          try {
            const full = repoFullName || `${envConfig.githubOrg}/${repoNameFromData}`;
            await apiFetch('/api/repositories', {
              method: 'POST',
              body: JSON.stringify({
                name: repoNameFromData,
                full_name: full,
                html_url: link,
                description: '',
                language: 'Unknown',
                stargazers_count: 0,
                private: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                body: refinedReadme || `# ${repoNameFromData}\n\nRepository already existed; linked to existing repo.`,
              }),
            });
          } catch { /* non-fatal */ }
          toast.info(
            (
              <span>
                Repository already exists. <a href={link} target="_blank" rel="noreferrer" className="underline">Open {repoNameFromData}</a>
              </span>
            ) as any
          );
          // Continue to refresh lists
        } else {
          throw new Error(data?.error || `Build failed (${resp.status})`);
        }
      }

      // Ensure refined README is saved for newly created repo
      try {
        await fetch(`${envConfig.apiBaseUrl}/api/github/repos/readme`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ repository: repoFullName as string, content: refinedReadme, message: 'refine: update README.md' }),
        });
      } catch {}

      // Persist a repository record to Repositories table
      try {
        const repoName = data.repo_name || (repoFullName.split('/')[1] || title.replace(/\s+/g, '-').toLowerCase());
        await apiFetch('/api/repositories', {
          method: 'POST',
          body: JSON.stringify({
            name: repoName,
            full_name: repoFullName,
            html_url: data.repo_url,
            description: data.description || '',
            language: data.language || 'Unknown',
            stargazers_count: 0,
            private: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            body: refinedReadme || data.readme_content || `# ${title}`,
          }),
        });
      } catch {}

      if (resp.ok && data?.success) {
        toast.success('Repository build triggered');
      }
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

  const generatePdf = async (itemId: string) => {
    try {
      const token = sessionStorage.getItem('id_token') || sessionStorage.getItem('access_token') || '';
      if (!token) { toast.error('Not authenticated'); return; }
      const res = await fetch(`${envConfig.apiBaseUrl}/pipeline-items/${encodeURIComponent(itemId)}/pdf`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok || !data?.pdf_url) throw new Error(data?.error || 'Failed to generate PDF');
      window.open(data.pdf_url, '_blank');
    } catch (e: any) {
      toast.error(e?.message || 'Failed to generate PDF');
    }
  };

  const reviewIssue = async (issue: any) => {
    try {
      const token = sessionStorage.getItem('id_token') || sessionStorage.getItem('access_token') || '';
      if (!token) { toast.error('Not authenticated'); return; }
      // Derive owner/repo and number strictly from the issue URL
      if (!issue?.url) { toast.error('Missing issue URL'); return; }
      let repository = '';
      let number: number | undefined;
      try {
        const u = new URL(issue.url as string);
        const seg = u.pathname.split('/').filter(Boolean); // [owner, repo, 'issues', n]
        if (seg.length < 4 || seg[2] !== 'issues') throw new Error('Invalid issue URL');
        repository = `${seg[0]}/${seg[1]}`;
        number = Number(seg[3]);
      } catch {
        toast.error('Invalid issue URL');
        return;
      }
      const res = await fetch(`${envConfig.apiBaseUrl}/api/github/issues/label`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ repository, issue_number: number!, label: 'shark ready :shark:' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || data?.error || 'Failed to mark as Review');
      if (data?.message === 'Already reviewed') {
        toast.info('Already reviewed');
      } else {
        toast.success('Marked for Shark review');
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to mark review');
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

      {repos.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Opportunity Maps</h4>
          <div className="border rounded-md overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-3 py-2 text-left">Name</th>
                  <th className="px-3 py-2 text-left">Created</th>
                  <th className="px-3 py-2 text-left">Link</th>
                  <th className="px-3 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {repos.slice(0, 5).map((r) => (
                  <tr key={`${r.name}-${r.created_at}`} className="border-t">
                    <td className="px-3 py-2">{r.name || (r as any).repoName || r.id}</td>
                    <td className="px-3 py-2">{r.created_at ? new Date(r.created_at).toLocaleString() : (r.createdAt ? new Date(r.createdAt).toLocaleString() : '-')}</td>
                    <td className="px-3 py-2">
                      {(r as any).repoUrl || r.html_url || (r as any).url ? (
                        <a href={((r as any).repoUrl || r.html_url || (r as any).url)!} className="text-blue-600 underline" target="_blank" rel="noreferrer">Open</a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {(r as any).id ? (
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => generatePdf((r as any).id)}>PDF</Button>
                        </div>
                      ) : <span className="text-muted-foreground">—</span>}
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
                        <a href={i.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open</a>
                      ) : <span className="text-muted-foreground">—</span>}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {(i as any).id && (
                          <Button variant="outline" size="sm" onClick={() => generatePdf((i as any).id)}>PDF</Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => reviewIssue(i)}>Review</Button>
                        <Button variant="outline" size="sm" onClick={() => buildFromIssue(i)}>Build</Button>
                      </div>
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
