import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProject, useStartReport, useReport, useStartIdeation, useIdeation, useStartDouble, useDouble, useBalance } from '@/hooks/v2';
import { Button } from '@/components/ui/button';
import { v2Api } from '@/services/v2/api';
import { FeedbackDialog } from '@/components/v2/FeedbackDialog';

interface Idea { ideaId: string; title: string; score: number; }

const ProjectDetail: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { data: project } = useProject(projectId!);
  const { data: balance } = useBalance();

  // Report
  const [reportId, setReportId] = useState<string>();
  const startReport = useStartReport(projectId!);
  const report = useReport(reportId);

  // Ideation
  const [ideationId, setIdeationId] = useState<string>();
  const startIdeation = useStartIdeation(projectId!);
  const ideation = useIdeation(ideationId);
  const [ideas, setIdeas] = useState<Idea[]>([]);

  useEffect(() => {
    if (ideation.data?.ideasUrl) {
      fetch(ideation.data.ideasUrl).then(r => r.json()).then(setIdeas).catch(() => setIdeas([]));
    }
  }, [ideation.data?.ideasUrl]);

  // Double down
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
  const [doubleId, setDoubleId] = useState<string>();
  const startDouble = useStartDouble(projectId!);
  const double = useDouble(doubleId);

  // Holistic summary (account-level overview)
  const [summary, setSummary] = useState<{reports:number; ideas:number; jobs:number; repos:{name:string; url:string}[]}>({reports:0,ideas:0,jobs:0,repos:[]});
  useEffect(() => {
    (async () => {
      try {
        const [reports, issuesResp, jobs, doubles] = await Promise.all([
          v2Api.listReports().catch(() => [] as any[]),
          v2Api.listPipelineRepos('issue').catch(() => ({ issues: [] })),
          v2Api.listPipelineJobs().catch(() => [] as any[]),
          v2Api.listDoubleDowns().catch(() => [] as any[]),
        ]);
        const repos = Array.isArray(doubles) ? (doubles as any[])
          .filter(d => d?.repoUrl && d?.repoName)
          .map(d => ({ name: d.repoName as string, url: d.repoUrl as string })) : [];
        setSummary({
          reports: Array.isArray(reports) ? reports.length : 0,
          ideas: Array.isArray((issuesResp as any).issues) ? (issuesResp as any).issues.length : 0,
          jobs: Array.isArray(jobs) ? jobs.length : 0,
          repos,
        });
      } catch {
        setSummary({ reports: 0, ideas: 0, jobs: 0, repos: [] });
      }
    })();
  }, []);

  const triggerReport = async () => {
    const res: any = await startReport.mutateAsync();
    setReportId(res.reportId);
  };

  const triggerIdeation = async () => {
    if (!reportId) return;
    const res: any = await startIdeation.mutateAsync({ reportId });
    setIdeationId(res.ideationId);
  };

  const triggerDouble = async (feedback?: string) => {
    if (!ideationId || !selectedIdea) return;
    const res: any = await startDouble.mutateAsync({ ideationId, ideaId: selectedIdea.ideaId, feedback });
    setDoubleId(res.doubleId);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">{project?.title || 'Project'}</h1>
      {(balance?.credits ?? 0) === 0 && (
        <p className="text-sm text-red-600">No credits available. Please purchase credits.</p>
      )}

      {/* Report Section (production-only overview) */}
      <section className="space-y-2">
        <h2 className="font-medium">Report</h2>
        <div className="text-sm text-muted-foreground">Research reports: {summary.reports}</div>
        {report?.data?.status === 'done' && report.data.reportUrl ? (
          <a href={report.data.reportUrl} target="_blank" rel="noopener" className="text-blue-600 underline">Download Latest</a>
        ) : null}
      </section>

      {/* Ideations Section (production-only overview) */}
      <section className="space-y-2">
        <h2 className="font-medium">Ideations</h2>
        <div className="text-sm text-muted-foreground">Ideas generated: {summary.ideas} • Runs: {summary.jobs}</div>
        {ideas.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr><th>Rank</th><th>Title</th><th>Score</th><th></th></tr></thead>
              <tbody>
                {ideas.map((idea, idx) => (
                  <tr key={idea.ideaId} className="border-t">
                    <td className="p-1">{idx + 1}</td>
                    <td className="p-1">{idea.title}</td>
                    <td className="p-1">{idea.score}</td>
                    <td className="p-1" />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>

      {/* Double Down Section (production-only overview) */}
      <section className="space-y-2">
        <h2 className="font-medium">Double-Down</h2>
        {summary.repos.length > 0 ? (
          <ul className="list-disc pl-5 text-sm">
            {summary.repos.slice(0,3).map(r => (
              <li key={r.url}><a href={r.url} target="_blank" rel="noreferrer" className="underline">{r.name}</a></li>
            ))}
          </ul>
        ) : (<p className="text-sm text-muted-foreground">No final repositories yet.</p>)}
      </section>
    </div>
  );
};

export default ProjectDetail;
