import React, { useEffect, useState } from 'react';
import { v2Api } from '@/services/v2/api';

type Job = {
  jobId: string;
  researchId?: string;
  status?: string;
  currentStage?: string;
  created_at?: string;
  startTime?: string;
  endTime?: string;
};

export const IdeationOverview: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const resp = await v2Api.listPipelineJobs();
        if (!mounted) return;
        const rows = (Array.isArray(resp) ? resp : []).map((j: any) => ({
          jobId: j.jobId,
          researchId: j.researchId,
          status: j.status,
          currentStage: j.currentStage,
          created_at: j.created_at || j.createdAt || j.startTime,
          startTime: j.startTime,
          endTime: j.endTime,
        }));
        setJobs(rows);
      } catch (e: any) {
        if (!mounted) return;
        setError('Failed to load ideation jobs');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  if (loading) return <div className="text-sm text-muted-foreground">Loading ideations…</div>;
  if (error) return <div className="text-sm text-destructive">{error}</div>;
  if (jobs.length === 0) return <div className="text-sm text-muted-foreground">No ideations yet.</div>;

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold text-foreground">Ideations</h3>
      <div className="border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-3 py-2 text-left">Started</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-left">Stage</th>
              <th className="px-3 py-2 text-left">Job ID</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(j => (
              <tr key={j.jobId} className="border-t">
                <td className="px-3 py-2">{j.created_at ? new Date(j.created_at).toLocaleString() : '-'}</td>
                <td className="px-3 py-2">{j.status || '-'}</td>
                <td className="px-3 py-2">{j.currentStage || '-'}</td>
                <td className="px-3 py-2 font-mono text-xs">{j.jobId}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default IdeationOverview;

