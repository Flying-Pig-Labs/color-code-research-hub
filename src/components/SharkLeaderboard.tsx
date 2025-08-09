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
      // Filter to only show ideas with scores and investments
      const validIdeas = (data.ideas || []).filter((idea: LeaderboardIdea) => 
        idea.sharkScore > 0 && (idea.investment || 0) > 0
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
      
      const response = await fetch('https://9y4n7ifoql.execute-api.us-east-1.amazonaws.com/prod/build', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          issueNumber: idea.issueNumber,
          repository: idea.repository,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to build repository');
      }

      const data: BuildResponse = await response.json();
      
      toast({
        title: "Success! 🚀",
        description: (
          <div className="space-y-2">
            <p>New repository created successfully!</p>
            <a 
              href={data.repository.html_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:underline"
            >
              View Repository <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        ),
      });
    } catch (error) {
      console.error('Error building repository:', error);
      toast({
        title: "Error",
        description: "Failed to create repository. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBuildingIdea(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
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
        <p className="text-muted-foreground">Loading top ideas from all reports...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-yellow-500" />
            Top 10 Ideas Across All Reports
          </h2>
          {lastRefreshed && (
            <p className="text-sm text-muted-foreground mt-1">
              Last updated: {lastRefreshed.toLocaleTimeString()}
            </p>
          )}
        </div>
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
          Refresh
        </Button>
      </div>

      {/* Leaderboard Table */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-carmax-yellow/10 to-carmax-blue/10">
          <CardTitle className="text-lg">Shark Tank Leaderboard</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16 text-center">Rank</TableHead>
                <TableHead>Idea Name</TableHead>
                <TableHead className="max-w-[300px]">Description</TableHead>
                <TableHead className="text-center">Investment</TableHead>
                <TableHead className="text-center">Score</TableHead>
                <TableHead className="text-center">Action</TableHead>
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
                                className="font-medium hover:underline text-blue-600 block truncate max-w-[250px]"
                              >
                                {idea.issueTitle}
                              </a>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">{idea.issueTitle}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <span>{idea.repository}</span>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      </div>
                    </TableCell>
                    
                    <TableCell className="max-w-[300px]">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {idea.description || 'No description available'}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-md">{idea.description || 'No description available'}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <div className="flex flex-col items-center gap-1">
                        <span className="font-bold text-lg">{idea.investmentDisplay || '$0'}</span>
                        <Badge variant="secondary" className="text-xs">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Total
                        </Badge>
                      </div>
                    </TableCell>
                    
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-bold text-2xl ${getScoreColor(idea.sharkScore)}`}>
                                {idea.sharkScore}
                              </span>
                              <Badge className={`text-xs ${scoreLabel.color}`}>
                                {scoreLabel.text}
                              </Badge>
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
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        {buildingIdea === idea.issueNumber ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Rocket className="h-4 w-4 mr-1" />
                            BUILD
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
      {ideas.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Investment Pool</p>
                  <p className="text-2xl font-bold">
                    ${(ideas.reduce((sum, idea) => sum + (idea.investment || 0), 0) / 1000000).toFixed(1)}M
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
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-2xl font-bold">
                    {(ideas.reduce((sum, idea) => sum + idea.sharkScore, 0) / ideas.length).toFixed(1)}
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
                  <p className="text-sm text-muted-foreground">Hot Ideas (80+)</p>
                  <p className="text-2xl font-bold">
                    {ideas.filter(idea => idea.sharkScore >= 80).length}
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