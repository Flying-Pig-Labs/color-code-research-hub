import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  CheckCircle2, 
  Github, 
  ExternalLink, 
  Milestone, 
  ListTree, 
  Clock,
  AlertCircle,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface JobResults {
  summary: {
    totalMilestones: number;
    totalEpics: number;
    totalIssues: number;
    repository: string;
    generatedAt: string;
  };
  milestones: Array<{
    number: number;
    title: string;
    description: string;
    html_url: string;
    state: string;
  }>;
  epics: Array<{
    number: number;
    title: string;
    body: string;
    html_url: string;
    milestone: number;
    labels: string[];
  }>;
  issues: Array<{
    number: number;
    title: string;
    body: string;
    html_url: string;
    milestone: number;
    epic: number;
    labels: string[];
  }>;
}

const MilestonesJobComplete = () => {
  const { repo, jobId } = useParams<{ repo: string; jobId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [results, setResults] = useState<JobResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get results from navigation state first
    if (location.state?.results) {
      setResults(location.state.results);
      setLoading(false);
    } else {
      // Otherwise fetch from API
      fetchJobResults();
    }
  }, [location.state]);

  const fetchJobResults = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/job/${jobId}/status`);
      if (!response.ok) throw new Error('Failed to fetch job results');
      
      const data = await response.json();
      if (data.status === 'SUCCEEDED' && data.results) {
        setResults(data.results);
      } else {
        throw new Error('Job has not completed successfully');
      }
    } catch (error) {
      console.error('Error fetching job results:', error);
      toast({
        title: "Error",
        description: "Failed to load job results. Please try again.",
        variant: "destructive",
      });
      navigate('/milestones');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="animate-pulse space-y-4 w-full">
                <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <p className="text-lg font-semibold mb-2">No Results Found</p>
              <p className="text-muted-foreground mb-4">Unable to load the job results.</p>
              <Button onClick={() => navigate('/milestones')}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Repositories
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const repoFullName = `mvp-builder-app/${repo}`;
  const githubBaseUrl = `https://github.com/${repoFullName}`;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Success Header */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-2xl">Backlog Generated Successfully!</CardTitle>
              <CardDescription className="text-base">
                Your comprehensive backlog has been created in GitHub
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Milestones</p>
                <p className="text-3xl font-bold">{results.summary.totalMilestones}</p>
              </div>
              <Milestone className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Epics</p>
                <p className="text-3xl font-bold">{results.summary.totalEpics}</p>
              </div>
              <ListTree className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Issues</p>
                <p className="text-3xl font-bold">{results.summary.totalIssues}</p>
              </div>
              <Github className="h-8 w-8 text-gray-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repository Info */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Github className="h-5 w-5" />
              <CardTitle>Repository Details</CardTitle>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(githubBaseUrl, '_blank')}
            >
              View on GitHub
              <ExternalLink className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">Repository</dt>
              <dd className="font-mono">{repoFullName}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Generated At</dt>
              <dd className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-muted-foreground" />
                {new Date(results.summary.generatedAt).toLocaleString()}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Milestones List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Milestone className="h-5 w-5 text-purple-600" />
            Created Milestones
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {results.milestones.map((milestone) => (
                <Card key={milestone.number} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold flex items-center gap-2">
                          {milestone.title}
                          <Badge variant="secondary">#{milestone.number}</Badge>
                        </h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {milestone.description}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(milestone.html_url, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={() => navigate('/milestones')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Generate Another Backlog
        </Button>
        
        <div className="flex gap-2">
          <Button
            onClick={() => window.open(`${githubBaseUrl}/milestones`, '_blank')}
          >
            View All Milestones
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <Button
            variant="secondary"
            onClick={() => window.open(`${githubBaseUrl}/issues`, '_blank')}
          >
            View All Issues
            <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Success Message */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">What's Next?</h3>
              <p className="text-sm text-muted-foreground">
                Your backlog is now live in GitHub! You can start working on the issues, 
                assign team members, and track progress through the milestones. Each epic 
                and issue has been carefully crafted with detailed acceptance criteria.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MilestonesJobComplete;