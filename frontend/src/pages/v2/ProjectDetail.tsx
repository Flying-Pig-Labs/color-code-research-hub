import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useProject, useStartReport, useReport, useStartIdeation, useIdeation, useStartDouble, useDouble, useBalance } from '@/hooks/v2';
import { useAuth } from '@/contexts/AuthContext';
import { isJwtValid } from '@/lib/jwt.ts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { v2Api } from '@/services/v2/api';
import { listResearchReports } from '@/services/researchApi';
import { FeedbackDialog } from '@/components/v2/FeedbackDialog';
import { 
  FileText, 
  Lightbulb, 
  GitBranch, 
  TrendingUp, 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  BarChart3,
  Download,
  ExternalLink,
  Zap,
  Target,
  Brain
} from 'lucide-react';

interface Idea { ideaId: string; title: string; score: number; }

interface ActivityEvent {
  id: string;
  type: 'report' | 'ideation' | 'double';
  title: string;
  timestamp: Date;
  status: 'completed' | 'running' | 'failed';
}

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

  // Enhanced dashboard data
  const [summary, setSummary] = useState<{reports:number; ideas:number; jobs:number; repos:{name:string; url:string}[]}>({reports:0,ideas:0,jobs:0,repos:[]});
  const [projectReports, setProjectReports] = useState<any[]>([]);
  const [activity, setActivity] = useState<ActivityEvent[]>([]);
  const [performanceData, setPerformanceData] = useState([
    { name: 'Reports', value: 0, growth: 0 },
    { name: 'Ideas', value: 0, growth: 0 },
    { name: 'Repos', value: 0, growth: 0 }
  ]);

  const { isAuthenticated } = useAuth();
  const hasValidToken = isJwtValid(sessionStorage.getItem('id_token'));
  const [authStabilized, setAuthStabilized] = useState(false);

  useEffect(() => {
    if (isAuthenticated && hasValidToken) {
      const t = setTimeout(() => setAuthStabilized(true), 2000);
      return () => clearTimeout(t);
    }
    setAuthStabilized(false);
  }, [isAuthenticated, hasValidToken]);

  useEffect(() => {
    if (!projectId || !isAuthenticated || !hasValidToken || !authStabilized) return;
    (async () => {
      try {
        const [allResearchReports, issuesResp, jobs, doubles] = await Promise.all([
          listResearchReports(undefined, 500).catch(() => [] as any[]),
          v2Api.listPipelineRepos('issue').catch(() => ({ issues: [] })),
          v2Api.listPipelineJobs().catch(() => [] as any[]),
          v2Api.listDoubleDowns().catch(() => [] as any[]),
        ]);
        const filteredReports = Array.isArray(allResearchReports)
          ? (allResearchReports as any[]).filter(r => (r?.projectId || '') === projectId)
          : [];
        setProjectReports(filteredReports);
        const repos = Array.isArray(doubles) ? (doubles as any[])
          .filter(d => (d?.projectId || '') === projectId)
          .filter(d => d?.repoUrl && d?.repoName)
          .map(d => ({ name: d.repoName as string, url: d.repoUrl as string })) : [];
        
        const summaryData = {
          reports: filteredReports.length,
          ideas: Array.isArray((issuesResp as any).issues) ? (issuesResp as any).issues.length : 0,
          jobs: Array.isArray(jobs) ? jobs.length : 0,
          repos,
        };
        setSummary(summaryData);

        // Generate performance data with simulated growth
        setPerformanceData([
          { name: 'Reports', value: summaryData.reports, growth: 15 },
          { name: 'Ideas', value: summaryData.ideas, growth: 23 },
          { name: 'Repos', value: summaryData.repos.length, growth: 8 }
        ]);

        // Generate recent activity (mock data for demonstration)
        const recentActivity: ActivityEvent[] = [
          { id: '1', type: 'report', title: 'Research Report Generated', timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), status: 'completed' },
          { id: '2', type: 'ideation', title: 'Ideation Session Completed', timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), status: 'completed' },
          { id: '3', type: 'double', title: 'Repository Created', timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), status: 'completed' },
          { id: '4', type: 'report', title: 'Analysis in Progress', timestamp: new Date(Date.now() - 30 * 60 * 1000), status: 'running' },
        ];
        setActivity(recentActivity);
      } catch {
        setSummary({ reports: 0, ideas: 0, jobs: 0, repos: [] });
      }
    })();
  }, [projectId, isAuthenticated, hasValidToken, authStabilized]);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'running': return <Activity className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const chartConfig = {
    reports: { label: "Reports", color: "hsl(var(--primary))" },
    ideas: { label: "Ideas", color: "hsl(var(--accent))" },
    repos: { label: "Repos", color: "hsl(var(--muted-foreground))" },
  };

  const pieData = [
    { name: 'Reports', value: summary.reports, fill: 'hsl(var(--primary))' },
    { name: 'Ideas', value: summary.ideas, fill: 'hsl(var(--accent))' },
    { name: 'Jobs', value: summary.jobs, fill: 'hsl(var(--muted-foreground))' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
                {project?.title || 'Project Dashboard'}
              </h1>
              <p className="text-muted-foreground mt-2">AI-powered research and development insights</p>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="px-3 py-1">
                <Zap className="h-3 w-3 mr-1" />
                {balance?.credits ?? 0} credits
              </Badge>
            </div>
          </div>
          
          {(balance?.credits ?? 0) === 0 && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">No credits available. Please purchase credits to continue.</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Reports</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{summary.reports}</p>
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15%
                    </Badge>
                  </div>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Ideas Generated</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{summary.ideas}</p>
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +23%
                    </Badge>
                  </div>
                </div>
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Lightbulb className="h-6 w-6 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{summary.jobs}</p>
                    <Badge variant="secondary" className="text-xs">
                      <Activity className="h-3 w-3 mr-1" />
                      Running
                    </Badge>
                  </div>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Repositories</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold">{summary.repos.length}</p>
                    <Badge variant="secondary" className="text-xs">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8%
                    </Badge>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <GitBranch className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Charts and Analytics */}
          <div className="lg:col-span-2 space-y-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Overview
                </CardTitle>
                <CardDescription>
                  Research output and productivity metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={performanceData}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="value" fill="hsl(var(--primary))" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Research Pipeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Research Pipeline
                </CardTitle>
                <CardDescription>
                  Current project workflow and progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="ideas">Ideas</TabsTrigger>
                    <TabsTrigger value="repos">Repositories</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="overview" className="space-y-4 mt-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium">Research Reports</p>
                            <p className="text-sm text-muted-foreground">{summary.reports} completed</p>
                          </div>
                        </div>
                        {report?.data?.status === 'done' && report.data.reportUrl ? (
                          <Button variant="outline" size="sm" asChild>
                            <a href={report.data.reportUrl} target="_blank" rel="noopener">
                              <Download className="h-4 w-4 mr-2" />
                              Download
                            </a>
                          </Button>
                        ) : (
                          <Button onClick={triggerReport} variant="outline" size="sm">
                            Generate Report
                          </Button>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-accent" />
                          <div>
                            <p className="font-medium">Ideation Process</p>
                            <p className="text-sm text-muted-foreground">{summary.ideas} ideas • {summary.jobs} runs</p>
                          </div>
                        </div>
                        <Button 
                          onClick={triggerIdeation} 
                          variant="outline" 
                          size="sm"
                          disabled={!reportId}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          Start Ideation
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="ideas" className="mt-6">
                    {ideas.length > 0 ? (
                      <div className="space-y-3">
                        {ideas.slice(0, 5).map((idea, idx) => (
                          <div
                            key={idea.ideaId}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => setSelectedIdea(idea)}
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                #{idx + 1}
                              </Badge>
                              <div>
                                <p className="font-medium">{idea.title}</p>
                                <p className="text-sm text-muted-foreground">Score: {idea.score}</p>
                              </div>
                            </div>
                            <Progress value={(idea.score / 100) * 100} className="w-20" />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No ideas generated yet. Run an ideation session to get started.</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="repos" className="mt-6">
                    {summary.repos.length > 0 ? (
                      <div className="space-y-3">
                        {summary.repos.slice(0, 3).map((repo, idx) => (
                          <div key={repo.url} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <GitBranch className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="font-medium">{repo.name}</p>
                                <p className="text-sm text-muted-foreground">Repository #{idx + 1}</p>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <a href={repo.url} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No repositories created yet. Complete the double-down process to create repositories.</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity and Status */}
          <div className="space-y-6">
            {/* Activity Feed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Latest project updates and actions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activity.map((event) => (
                  <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                    {getStatusIcon(event.status)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {event.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Output Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Output Distribution</CardTitle>
                <CardDescription>
                  Breakdown of research outputs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={chartConfig} className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common workflow operations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={triggerReport} className="w-full" variant="outline">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
                <Button 
                  onClick={triggerIdeation} 
                  className="w-full" 
                  variant="outline"
                  disabled={!reportId}
                >
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Start Ideation
                </Button>
                <Button 
                  onClick={() => triggerDouble()} 
                  className="w-full" 
                  variant="outline"
                  disabled={!ideationId || !selectedIdea}
                >
                  <GitBranch className="h-4 w-4 mr-2" />
                  Create Repository
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
