import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProject, useStartReport, useReport, useStartIdeation, useIdeation, useStartDouble, useDouble, useBalance } from '@/hooks/v2';
import { Button } from '@/components/ui/button';
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

      {/* Report Section (actions removed for production-only view) */}
      <section className="space-y-2">
        <h2 className="font-medium">Report</h2>
        {report?.data?.status === 'done' && report.data.reportUrl ? (
          <a href={report.data.reportUrl} target="_blank" rel="noopener" className="text-blue-600 underline">Download Report</a>
        ) : (
          <p className="text-sm text-muted-foreground">No report available yet.</p>
        )}
      </section>

      {/* Ideations Section (actions removed) */}
      <section className="space-y-2">
        <h2 className="font-medium">Ideations</h2>
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
        ) : (<p className="text-sm text-muted-foreground">No ideation available yet.</p>)}
      </section>

      {/* Double Down Section */}
      <section className="space-y-2">
        <h2 className="font-medium">Double-Down</h2>
        {double?.data?.status === 'done' ? (
          <div className="space-y-1">
            {double.data.finalPdfUrl && <a href={double.data.finalPdfUrl} target="_blank" rel="noopener" download className="text-blue-600 underline">Download PDF</a>}
            {double.data.zipUrl && <a href={double.data.zipUrl} target="_blank" rel="noopener" download className="text-blue-600 underline">Download ZIP</a>}
            <p className="text-xs text-muted-foreground">Informational only; not legal advice; user must file & pay fees via USPTO Patent Center.</p>
          </div>
        ) : (<p className="text-sm text-muted-foreground">No double-down artifacts yet.</p>)}
      </section>
    </div>
  );
};

export default ProjectDetail;
