import React, { useEffect, useState } from 'react';
import { v2Api, PipelineRepo, PipelineIssue } from '@/services/v2/api';
import { Button } from '@/components/ui/button';

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
        const issues = (issueResp.issues || []).map((i: any) => ({
          ...i,
          title: i.title || i.body?.slice(0, 60) || 'Issue',
          created_at: i.created_at || i.createdAt,
        }));
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
                </tr>
              </thead>
              <tbody>
                {issues.slice(0, 8).map((i) => (
                  <tr key={`${i.id}-${i.number}`} className="border-t">
                    <td className="px-3 py-2">{i.title}</td>
                    <td className="px-3 py-2">{i.created_at ? new Date(i.created_at).toLocaleString() : '-'}</td>
                    <td className="px-3 py-2">
                      {i.repository_id || i.id ? (
                        <Button variant="link" className="h-auto p-0" onClick={() => {
                          const url = (i as any).url || (i as any).html_url;
                          if (url) window.open(url, '_blank');
                        }}>Open</Button>
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
    </div>
  );
};

export default PipelineOverview;
