import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { TagsInput } from "@/components/ui/tags-input";
import { Target, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { apiService, showApiError, ApiError, ResearchJob } from "@/services/api";
import { useApiEnvironment } from "@/hooks/useApiEnvironment";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { generateRepoId, generateUniqueRepoId } from "@/utils/idGenerator";
import { githubService } from "@/services/githubService";
import { submitResearch, formatRedTeamPrompt, checkResearchStatus } from "@/services/researchApi";

interface ResearchSwarmFormProps {
  children: React.ReactNode;
}

const ResearchSwarmForm = ({ children }: ResearchSwarmFormProps) => {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [analysisFocus, setAnalysisFocus] = useState<string[]>([]);
  const [marketScope, setMarketScope] = useState("");
  const [customCountries, setCustomCountries] = useState<string[]>([]);
  const [disruptionTimeline, setDisruptionTimeline] = useState([12]);
  const [investmentRange, setInvestmentRange] = useState([100000, 1000000]);
  const [targetMarketSize, setTargetMarketSize] = useState<string[]>([]);
  const [competitiveIntensity, setCompetitiveIntensity] = useState("");
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [industryVerticals, setIndustryVerticals] = useState<string[]>([]);
  const [disruptionStrategy, setDisruptionStrategy] = useState("");
  
  // API state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ResearchJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollProgress, setPollProgress] = useState(0);
  
  const apiEnvironment = useApiEnvironment();

  // Polling effect for status updates
  useEffect(() => {
    if (!jobId || !isPolling) return;

    const pollInterval = setInterval(async () => {
      try {
        const status = await checkResearchStatus(jobId);
        setJobStatus(status);
        
        // Update progress (simulate based on time elapsed)
        setPollProgress(prev => Math.min(prev + 10, 90));
        
        if (status.status === 'completed' || status.status === 'failed') {
          setIsPolling(false);
          setPollProgress(100);
          
          if (status.status === 'completed') {
            toast.success('Research completed successfully!', {
              description: 'Results are now available in the Research Requests table.',
            });
            handleReset();
            setOpen(false);
          } else {
            toast.error('Research failed', {
              description: status.error || 'Unknown error occurred',
            });
          }
          
          // Update the stored task status
          const tasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
          const updatedTasks = tasks.map((task: any) => 
            task.requestId === jobId 
              ? { ...task, status: status.status, result: status.result }
              : task
          );
          localStorage.setItem('researchTasks', JSON.stringify(updatedTasks));
          window.dispatchEvent(new CustomEvent('taskUpdated'));
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, isPolling]);

  const handleCheckboxChange = (value: string, currentValues: string[], setter: (values: string[]) => void) => {
    if (currentValues.includes(value)) {
      setter(currentValues.filter(v => v !== value));
    } else {
      setter([...currentValues, value]);
    }
  };

  const handleReset = () => {
    setCompanyName("");
    setAnalysisFocus([]);
    setMarketScope("");
    setCustomCountries([]);
    setDisruptionTimeline([12]);
    setInvestmentRange([100000, 1000000]);
    setTargetMarketSize([]);
    setCompetitiveIntensity("");
    setCustomKeywords([]);
    setIndustryVerticals([]);
    setDisruptionStrategy("");
  };

  const handleLaunchSwarm = async () => {
    const researchData = {
      targetCompany: companyName,
      analysisFocus,
      marketScope,
      customCountries,
      disruptionTimeline: disruptionTimeline[0],
      investmentRange,
      targetMarketSize,
      competitiveIntensity,
      customKeywords,
      industryVerticals,
      disruptionStrategy,
      analysisType: analysisFocus.join(', '),
      industry: industryVerticals.join(', '),
      specificRequirements: `Market: ${marketScope}, Timeline: ${disruptionTimeline[0]} months, Strategy: ${disruptionStrategy}`
    };

    setIsSubmitting(true);
    setJobId(null);
    setJobStatus(null);
    setPollProgress(0);

    try {
      // Format the research prompt for Red Team
      const researchPrompt = formatRedTeamPrompt(researchData);
      
      // Submit to EC2 research endpoint
      const response = await submitResearch({
        task: researchPrompt,
        teamType: 'red'
      });
      
      // Store the request ID for tracking
      setJobId(response.request_id);
      
      toast.success(`Research swarm launched for ${companyName || 'Unknown Company'}!`, {
        description: `Request ID: ${response.request_id}`,
      });
      
      // Store in localStorage for tracking
      const researchTask = {
        id: Date.now().toString(),
        requestId: response.request_id,
        team: 'red',
        vendorName: companyName,
        ...researchData,
        createdAt: new Date().toISOString(),
        status: response.status,
      };
      
      const existingTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
      existingTasks.push(researchTask);
      localStorage.setItem('researchTasks', JSON.stringify(existingTasks));
      window.dispatchEvent(new CustomEvent('taskAdded'));
      
      // Start polling for status updates
      setIsPolling(true);
      
      // Don't close dialog immediately - keep it open to show status
    } catch (error) {
      if (error instanceof ApiError) {
        showApiError(error);
      } else {
        toast.error('Failed to launch research swarm', {
          description: error instanceof Error ? error.message : 'Unknown error occurred',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const analysisFocusOptions = [
    "Market positioning analysis",
    "Competitive intelligence",
    "Technology assessment",
    "Business model evaluation",
    "Customer acquisition strategies",
    "Pricing strategies",
    "Partnership opportunities",
    "Market entry barriers"
  ];

  const marketSizeOptions = [
    "Small (<$100M)",
    "Medium ($100M-$1B)",
    "Large ($1B-$10B)",
    "Very Large (>$10B)"
  ];

  const industryVerticalOptions = [
    "Automotive",
    "Technology",
    "Financial Services",
    "Healthcare",
    "Retail",
    "Manufacturing",
    "Real Estate",
    "Transportation"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-team">
            <Target className="h-5 w-5" />
            🔴 Launch Research Swarm
          </DialogTitle>
          <DialogDescription>
            Aim: Reverse-engineer or replace a key third-party vendor.
          </DialogDescription>
        </DialogHeader>

        {/* Environment Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Environment:</span>
          <Badge variant={apiEnvironment.isHealthy ? "default" : "destructive"}>
            {apiEnvironment.environment === 'local' ? 'Local' : 'Unknown'}
          </Badge>
          {apiEnvironment.isChecking && <Loader2 className="h-3 w-3 animate-spin" />}
          {!apiEnvironment.isHealthy && !apiEnvironment.isChecking && (
            <span className="text-red-500 text-xs">Not connected</span>
          )}
        </div>

        {/* Job Status */}
        {(isPolling || jobStatus) && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Job Status:</span>
                  <Badge variant={
                    jobStatus?.status === 'completed' ? 'default' :
                    jobStatus?.status === 'failed' ? 'destructive' :
                    jobStatus?.status === 'processing' ? 'secondary' : 'outline'
                  }>
                    {jobStatus?.status || 'pending'}
                  </Badge>
                  {jobId && <span className="text-xs text-muted-foreground">ID: {jobId}</span>}
                </div>
                {isPolling && (
                  <div className="space-y-1">
                    <Progress value={pollProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground">Processing research request...</p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Company Name */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Company Name</CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter company name"
                required
              />
            </CardContent>
          </Card>

          {/* Analysis Focus */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Analysis Focus</CardTitle>
              <CardDescription>Select areas of analysis to focus on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {analysisFocusOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`analysis-${option}`}
                      checked={analysisFocus.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, analysisFocus, setAnalysisFocus)}
                    />
                    <Label htmlFor={`analysis-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Market Scope */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Market Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={marketScope} onValueChange={setMarketScope}>
                <SelectTrigger>
                  <SelectValue placeholder="Select market scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global</SelectItem>
                  <SelectItem value="north-america">North America</SelectItem>
                  <SelectItem value="europe">Europe</SelectItem>
                  <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                  <SelectItem value="custom">Custom Countries</SelectItem>
                </SelectContent>
              </Select>
              
              {marketScope === "custom" && (
                <div>
                  <Label>Custom Countries</Label>
                  <TagsInput
                    value={customCountries}
                    onChange={setCustomCountries}
                    placeholder="Type country and press Enter"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Disruption Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Disruption Timeline</CardTitle>
              <CardDescription>Expected timeline for market disruption (0-24 months)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Slider
                  value={disruptionTimeline}
                  onValueChange={setDisruptionTimeline}
                  max={24}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-sm text-muted-foreground">
                  {disruptionTimeline[0]} months
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Investment Range */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Investment Range</CardTitle>
              <CardDescription>Expected investment range ($)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Slider
                  value={investmentRange}
                  onValueChange={setInvestmentRange}
                  min={10000}
                  max={10000000}
                  step={10000}
                  className="w-full"
                />
                <div className="text-center text-sm text-muted-foreground">
                  ${investmentRange[0].toLocaleString()} - ${investmentRange[1].toLocaleString()}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Target Market Size */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Target Market Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {marketSizeOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`market-size-${option}`}
                      checked={targetMarketSize.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, targetMarketSize, setTargetMarketSize)}
                    />
                    <Label htmlFor={`market-size-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Competitive Intensity */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Competitive Intensity</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={competitiveIntensity} onValueChange={setCompetitiveIntensity}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="low" id="intensity-low" />
                  <Label htmlFor="intensity-low">Low</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="intensity-medium" />
                  <Label htmlFor="intensity-medium">Medium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="high" id="intensity-high" />
                  <Label htmlFor="intensity-high">High</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="very-high" id="intensity-very-high" />
                  <Label htmlFor="intensity-very-high">Very High</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Custom Keywords (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Custom Keywords (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <TagsInput
                value={customKeywords}
                onChange={setCustomKeywords}
                placeholder="Type keyword and press Enter"
              />
            </CardContent>
          </Card>

          {/* Industry Verticals (Optional) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Industry Verticals (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {industryVerticalOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`industry-${option}`}
                      checked={industryVerticals.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, industryVerticals, setIndustryVerticals)}
                    />
                    <Label htmlFor={`industry-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Disruption Strategy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Disruption Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={disruptionStrategy} onValueChange={setDisruptionStrategy}>
                <SelectTrigger>
                  <SelectValue placeholder="Select disruption strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="direct-competition">Direct Competition</SelectItem>
                  <SelectItem value="market-differentiation">Market Differentiation</SelectItem>
                  <SelectItem value="cost-leadership">Cost Leadership</SelectItem>
                  <SelectItem value="innovation">Innovation</SelectItem>
                  <SelectItem value="acquisition">Acquisition</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleLaunchSwarm}
              className="flex-1 bg-red-team hover:bg-red-team/90 text-white"
              disabled={!companyName || isSubmitting || isPolling}
            >
              {isSubmitting || isPolling ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isPolling ? 'Processing...' : 'Launching...'}
                </>
              ) : (
                '🔘 Launch Swarm'
              )}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="flex-1"
            >
              ♻️ Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResearchSwarmForm;