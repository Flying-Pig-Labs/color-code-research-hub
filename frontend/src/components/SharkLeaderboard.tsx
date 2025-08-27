import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, TrendingUp, DollarSign, ExternalLink, Rocket, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeaderboardIdea {
  rank: number;
  issueNumber: number;
  issueTitle: string;
  description?: string;
  repository: string;
  repositoryUrl?: string;
  issueUrl: string;
  labels?: string[];
  investment?: number;
  investmentDisplay?: string;
  sharkScore: number;
  scoreBreakdown?: {
    avgInvestment: number;
    avgConfidence: number;
    decisionRatio: number;
  };
  reviews?: Array<{
    shark: string;
    investment: number;
    confidence: number;
    decision: 'Invest' | 'Pass';
    reasoning: string;
  }>;
  createdAt?: string;
  state?: 'open' | 'closed';
  medal?: string;
}

interface BuildResponse {
  success: boolean;
  repository: {
    name: string;
    full_name: string;
    html_url: string;
    description: string;
  };
  message: string;
}

const SharkLeaderboard = () => {
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<LeaderboardIdea[]>([]);
  const [allIdeas, setAllIdeas] = useState<LeaderboardIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [buildingIdea, setBuildingIdea] = useState<number | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);

  const fetchLeaderboard = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await fetch('https://9y4n7ifoql.execute-api.us-east-1.amazonaws.com/prod/leaderboard');
      
      if (!response.ok) {
        throw new Error('Failed to fetch leaderboard');
      }

      const data = await response.json();
      
      // Map the API response to the expected format
      const mappedIdeas = (data.ideas || []).map((idea: any) => ({
        rank: idea.rank,
        issueNumber: idea.issue_number || idea.issueNumber,
        issueTitle: idea.title || idea.issueTitle,
        description: idea.description,
        repository: idea.repository,
        repositoryUrl: idea.repository ? `https://github.com/${idea.repository}` : undefined,
        issueUrl: idea.github_url || idea.issueUrl,
        labels: idea.labels || [],
        investment: idea.investment_total || idea.investment || 0,
        investmentDisplay: idea.investment_display || idea.investmentDisplay || '$0',
        sharkScore: idea.score || idea.sharkScore || 0,
        scoreBreakdown: idea.scoreBreakdown,
        reviews: idea.reviews || [],
        createdAt: idea.created_at || idea.createdAt,
        state: idea.state || 'open',
        medal: idea.medal
      }));
      
      // Store all ideas for stats calculation
      setAllIdeas(mappedIdeas);
      
      // Filter to only show ideas with valid scores in table
      const validIdeas = mappedIdeas.filter((idea: LeaderboardIdea) => 
        idea.sharkScore > 0
      );
      
      setIdeas(validIdeas);
      setLastRefreshed(new Date());
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shark leaderboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchLeaderboard(true);
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const handleBuild = async (idea: LeaderboardIdea) => {
    try {
      setBuildingIdea(idea.issueNumber);
      
      // Build API contract - only repository and issue_number are required
      const buildPayload = {
        repository: idea.repository,           // Required: Full repository name (owner/repo)
        issue_number: idea.issueNumber,        // Required: GitHub issue number
        // Optional fields for README generation
        title: idea.issueTitle,                
        score: idea.sharkScore,                
        investment_display: idea.investmentDisplay || '$0',  
        rank: idea.rank,                       
        medal: idea.medal                      
      };
      
      console.log('BUILD button clicked for:', {
        repository: idea.repository,
        issueNumber: idea.issueNumber,
        payload: buildPayload,
        payloadString: JSON.stringify(buildPayload)
      });
      
      const response = await fetch('https://9y4n7ifoql.execute-api.us-east-1.amazonaws.com/prod/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(buildPayload),
      });

      const responseText = await response.text();
      console.log('Build API raw response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Failed to parse response:', responseText);
        throw new Error('Invalid response from build API');
      }
      
      if (!response.ok || !responseData.success) {
        console.error('Build API error:', responseData);
        throw new Error(responseData.error || 'Failed to build repository');
      }
      
      toast({
        title: "Success! 🚀",
        description: (
          <div className="space-y-2">
            <p>New repository created successfully!</p>
            <a 
              href={responseData.repo_url || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              View Repository: {responseData.repo_name || 'New Repo'} <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ),
      });
    } catch (error) {
      console.error('Error building repository:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create repository';
      
      // Provide specific error messages for known issues
      let userMessage = errorMessage;
      if (errorMessage.includes("'repository'")) {
        userMessage = "The build API Lambda has a bug - it's not reading the 'repository' field from the request body correctly. The frontend is sending the data properly. This needs to be fixed in the Lambda handler.";
      } else if (errorMessage.includes("'issue_number'")) {
        userMessage = "The build API couldn't find the issue number. Please ensure the idea has a valid issue number.";
      } else if (errorMessage.includes("Invalid response")) {
        userMessage = "The build API returned an invalid response. Please check the Lambda function logs.";
      }
      
      toast({
        title: "Build Failed",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setBuildingIdea(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-yellow-600';
    if (score >= 60) return 'text-blue-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return { text: 'HOT', color: 'bg-green-100 text-green-800' };
    if (score >= 60) return { text: 'STRONG', color: 'bg-blue-100 text-blue-800' };
    if (score >= 40) return { text: 'MIXED', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 20) return { text: 'LIMITED', color: 'bg-orange-100 text-orange-800' };
    return { text: 'NO DEAL', color: 'bg-red-100 text-red-800' };
  };

  const getMedalEmoji = (rank: number) => {
    switch(rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-carmax-blue mb-4" />
        <p className="text-muted-foreground">Locating truffles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Refresh button only */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchLeaderboard(true)}
          disabled={refreshing}
        >
          {refreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          refresh
        </Button>
      </div>

      {/* Leaderboard Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-carmax-yellow/10 to-carmax-blue/10 text-center">
          <CardTitle className="text-lg">leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">rank</TableHead>
                <TableHead>idea</TableHead>
                <TableHead className="text-center">investment</TableHead>
                <TableHead className="text-center">score</TableHead>
                <TableHead className="text-center">action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ideas.map((idea) => {
                const medal = getMedalEmoji(idea.rank);
                const scoreLabel = getScoreLabel(idea.sharkScore);
                
                return (
                  <TableRow key={idea.issueNumber} className="hover:bg-muted/50">
                    <TableCell className="text-center font-bold">
                      <div className="flex items-center justify-center gap-1">
                        {medal && <span className="text-2xl">{medal}</span>}
                        <span className={medal ? 'text-lg' : ''}>{idea.rank}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="space-y-1">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <a 
                                href={idea.issueUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium hover:underline text-yellow-600 dark:text-yellow-400 block"
                              >
                                {idea.issueTitle}
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{idea.issueTitle}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <span className="font-bold text-lg">{idea.investmentDisplay || '$0'}</span>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-bold text-2xl ${getScoreColor(idea.sharkScore)}`}>
                                {idea.sharkScore}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-2 p-2">
                              <p className="font-semibold">Score Breakdown</p>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between gap-4">
                                  <span>Avg Investment:</span>
                                  <span className="font-mono">{(idea.scoreBreakdown?.avgInvestment || 0).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Avg Confidence:</span>
                                  <span className="font-mono">{(idea.scoreBreakdown?.avgConfidence || 0).toFixed(1)}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                  <span>Decision Ratio:</span>
                                  <span className="font-mono">{(idea.scoreBreakdown?.decisionRatio || 0).toFixed(1)}</span>
                                </div>
                              </div>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <Button
                        size="sm"
                        onClick={() => handleBuild(idea)}
                        disabled={buildingIdea === idea.issueNumber}
                        className="bg-white dark:bg-gray-800 border-2 border-yellow-500 text-gray-800 dark:text-gray-200 hover:bg-gradient-to-r hover:from-yellow-400 hover:to-yellow-500 hover:text-black font-semibold transition-all duration-200"
                      >
                        {buildingIdea === idea.issueNumber ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Rocket className="h-4 w-4 mr-1" />
                            build
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {ideas.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No shark-evaluated ideas available yet. Process some repositories first!
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary */}
      {allIdeas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">total investment pool</p>
                  <p className="text-2xl font-bold">
                    ${(allIdeas.reduce((sum, idea) => sum + (idea.investment || 0), 0) / 1000000).toFixed(1)}M
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">average score</p>
                  <p className="text-2xl font-bold">
                    {(allIdeas.filter(idea => idea.sharkScore > 0).reduce((sum, idea) => sum + idea.sharkScore, 0) / allIdeas.filter(idea => idea.sharkScore > 0).length).toFixed(1)}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">hot ideas (80+)</p>
                  <p className="text-2xl font-bold">
                    {allIdeas.filter(idea => idea.sharkScore >= 80).length}
                  </p>
                </div>
                <Trophy className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SharkLeaderboard;