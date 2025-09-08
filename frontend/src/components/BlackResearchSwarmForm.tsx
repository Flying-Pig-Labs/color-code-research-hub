import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { TagsInput } from "@/components/ui/tags-input";
import { Bug, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { apiService, showApiError, ApiError, ResearchJob } from "@/services/api";
import { useApiEnvironment } from "@/hooks/useApiEnvironment";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { generateRepoId, generateUniqueRepoId } from "@/utils/idGenerator";
import { githubService } from "@/services/githubService";
import { submitResearch, formatBlackTeamPrompt } from "@/services/researchApi";
import { useUser } from "@/contexts/UserContext";

interface BlackResearchSwarmFormProps {
  children: React.ReactNode;
}

const BlackResearchSwarmForm = ({ children }: BlackResearchSwarmFormProps) => {
  const [open, setOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [toolCategories, setToolCategories] = useState<string[]>([]);
  const [informationSources, setInformationSources] = useState<Record<string, boolean>>({});
  const [implementationComplexity, setImplementationComplexity] = useState("");
  const [teamSizeConstraint, setTeamSizeConstraint] = useState("");
  const [techStackPreference, setTechStackPreference] = useState<string[]>([]);
  const [costComparisonBaseline, setCostComparisonBaseline] = useState("");
  const [customCostThreshold, setCustomCostThreshold] = useState("");
  const [evidenceThreshold, setEvidenceThreshold] = useState([3]);
  const [existingTools, setExistingTools] = useState<string[]>([]);
  const [timeToMarket, setTimeToMarket] = useState("");
  
  // API state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useUser();
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<ResearchJob | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollProgress, setPollProgress] = useState(0);
  const [showLogs, setShowLogs] = useState(false);
  
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
            toast.success('Black Team research completed successfully!', {
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
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(pollInterval);
  }, [jobId, isPolling]);

  const handleCheckboxChange = (value: string, currentValues: string[], setter: (values: string[]) => void) => {
    if (currentValues.includes(value)) {
      setter(currentValues.filter(v => v !== value));
    } else {
      setter([...currentValues, value]);
    }
  };

  const handleSwitchChange = (key: string, checked: boolean) => {
    setInformationSources(prev => ({ ...prev, [key]: checked }));
  };

  const handleReset = () => {
    setCompanyName("");
    setToolCategories([]);
    setInformationSources({});
    setImplementationComplexity("");
    setTeamSizeConstraint("");
    setTechStackPreference([]);
    setCostComparisonBaseline("");
    setCustomCostThreshold("");
    setEvidenceThreshold([3]);
    setExistingTools([]);
    setTimeToMarket("");
  };

  const handleManualRefresh = async () => {
    if (!jobId) return;
    
    try {
      const status = await checkResearchStatus(jobId);
      setJobStatus(status);
      toast.info('Status refreshed');
    } catch (error) {
      console.error('Error refreshing status:', error);
      toast.error('Failed to refresh status');
    }
  };

  const handleLaunchSwarm = async () => {
    // Find the selected vendor from existing tools
    const targetVendor = existingTools.length > 0 ? existingTools[0] : 'Vendor tool';
    
    const researchData = {
      companyName: companyName || 'Not specified',
      targetVendor,
      productService: toolCategories.join(', '),
      engineeringFocus: `${implementationComplexity} complexity, ${teamSizeConstraint} team`,
      technicalRequirements: `Tech stack: ${techStackPreference.join(', ')}, Time to market: ${timeToMarket}, Cost baseline: ${costComparisonBaseline}`,
      toolCategories,
      informationSources,
      implementationComplexity,
      teamSizeConstraint,
      techStackPreference,
      costComparisonBaseline,
      customCostThreshold: costComparisonBaseline === "custom_threshold" ? parseFloat(customCostThreshold) : undefined,
      evidenceThreshold: evidenceThreshold[0],
      existingTools,
      timeToMarket,
    };

    setIsSubmitting(true);
    setJobId(null);
    setJobStatus(null);
    setPollProgress(0);

    try {
      // Format the research prompt for Black Team
      const researchPrompt = formatBlackTeamPrompt(researchData);
      
      // Submit to EC2 research endpoint
      const response = await submitResearch({
        task: researchPrompt,
        team: 'black',
        companyName: companyName || 'Not specified',
        vendorName: targetVendor,
        targetVendor: targetVendor, // Specifically for black team target display
        username: user?.name || "fprior" // Use authenticated user's name, fallback to "fprior"
      });
      
      // Store the request ID for tracking
      setJobId(response.request_id);
      
      toast.success('Black Team Research Swarm launched!', {
        description: `Request ID: ${response.request_id}`,
      });
      
      // Store in localStorage for tracking
      const researchTask = {
        id: Date.now().toString(),
        requestId: response.request_id,
        team: 'black',
        vendorName: targetVendor,
        ...researchData,
        createdAt: new Date().toISOString(),
        status: response.status,
      };
      
      const existingTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
      existingTasks.push(researchTask);
      localStorage.setItem('researchTasks', JSON.stringify(existingTasks));
      window.dispatchEvent(new CustomEvent('taskAdded'));
      
      // Close dialog and let the main page handle polling
      handleReset();
      setOpen(false);
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

  const toolCategoryOptions = [
    "Analytics & Monitoring",
    "Development Tools",
    "Customer Support",
    "Marketing Automation",
    "Data Management",
    "Security Tools",
    "Communication",
    "Project Management"
  ];

  const informationSourceOptions = [
    "Public Documentation",
    "User Reviews",
    "Competitor Analysis",
    "Technical Specs",
    "Pricing Information",
    "User Interviews",
    "Market Research",
    "Industry Reports"
  ];

  const techStackOptions = [
    "React/Next.js",
    "Vue.js",
    "Angular",
    "Node.js",
    "Python",
    "Java",
    "C#/.NET",
    "Go",
    "Cloud Native",
    "Microservices"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-gray-200">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <Bug className="h-5 w-5" />
            Launch Research Swarm
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Explore replacing a third-party tool with internal software.
          </DialogDescription>
        </DialogHeader>

        {/* Environment Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-white/70">Environment:</span>
          <Badge variant={apiEnvironment.isHealthy ? "default" : "destructive"} className="bg-white/20">
            {apiEnvironment.environment === 'local' ? 'Local' : 'Unknown'}
          </Badge>
          {apiEnvironment.isChecking && <Loader2 className="h-3 w-3 animate-spin text-white" />}
          {!apiEnvironment.isHealthy && !apiEnvironment.isChecking && (
            <span className="text-red-400 text-xs">Not connected</span>
          )}
        </div>

        {/* Job Status */}
        {(isPolling || jobStatus) && (
          <Alert className="bg-white/10 border-white/20">
            <AlertCircle className="h-4 w-4 text-white" />
            <AlertDescription className="text-white">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Job Status:</span>
                    <Badge variant={
                      jobStatus?.status === 'completed' ? 'default' :
                      jobStatus?.status === 'failed' ? 'destructive' :
                      jobStatus?.status === 'processing' ? 'secondary' : 'outline'
                    } className="bg-white/20">
                      {jobStatus?.status || 'pending'}
                    </Badge>
                    {jobId && <span className="text-xs text-white/70">ID: {jobId}</span>}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleManualRefresh}
                      disabled={isPolling}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <RefreshCw className="h-3 w-3 mr-1" />
                      Refresh
                    </Button>
                    {jobId && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowLogs(true)}
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      >
                        <Terminal className="h-3 w-3 mr-1" />
                        View Logs
                      </Button>
                    )}
                  </div>
                </div>
                {isPolling && (
                  <div className="space-y-1">
                    <Progress value={pollProgress} className="h-2 bg-white/20" />
                    <p className="text-xs text-white/70">Processing research request...</p>
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-6">
          {/* Company Name */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Company Name</CardTitle>
              <CardDescription className="text-white/70">Enter the company name for this research</CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., CarMax, Tesla, Amazon"
                className="bg-black-team border-white/20 text-white placeholder:text-white/50"
              />
            </CardContent>
          </Card>

          {/* Tool Categories */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Tool Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {toolCategoryOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tool-${option}`}
                      checked={toolCategories.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, toolCategories, setToolCategories)}
                      className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <Label htmlFor={`tool-${option}`} className="text-sm text-white">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Information Sources */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Information Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {informationSourceOptions.map((option) => (
                  <div key={option} className="flex items-center justify-between">
                    <Label htmlFor={`source-${option}`} className="text-white">{option}</Label>
                    <Switch
                      id={`source-${option}`}
                      checked={informationSources[option] || false}
                      onCheckedChange={(checked) => handleSwitchChange(option, checked)}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Implementation Complexity */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Implementation Complexity</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={implementationComplexity} onValueChange={setImplementationComplexity}>
                <SelectTrigger className="bg-black-team border-white/20 text-white">
                  <SelectValue placeholder="Select complexity level" />
                </SelectTrigger>
                <SelectContent className="bg-black-team-light border-white/20">
                  <SelectItem value="low" className="text-white hover:bg-white/10">Low</SelectItem>
                  <SelectItem value="medium" className="text-white hover:bg-white/10">Medium</SelectItem>
                  <SelectItem value="high" className="text-white hover:bg-white/10">High</SelectItem>
                  <SelectItem value="very-high" className="text-white hover:bg-white/10">Very High</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Team Size Constraint */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Team Size Constraint</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={teamSizeConstraint} onValueChange={setTeamSizeConstraint}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="small" id="team-small" className="border-white/20 text-white" />
                  <Label htmlFor="team-small" className="text-white">Small (1-3 people)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="medium" id="team-medium" className="border-white/20 text-white" />
                  <Label htmlFor="team-medium" className="text-white">Medium (4-8 people)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="large" id="team-large" className="border-white/20 text-white" />
                  <Label htmlFor="team-large" className="text-white">Large (9+ people)</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Tech Stack Preference (Optional) */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Tech Stack Preference (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {techStackOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`tech-${option}`}
                      checked={techStackPreference.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, techStackPreference, setTechStackPreference)}
                      className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <Label htmlFor={`tech-${option}`} className="text-sm text-white">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Cost Comparison Baseline */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Cost Comparison Baseline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={costComparisonBaseline} onValueChange={setCostComparisonBaseline}>
                <SelectTrigger className="bg-black-team border-white/20 text-white">
                  <SelectValue placeholder="Select baseline" />
                </SelectTrigger>
                <SelectContent className="bg-black-team-light border-white/20">
                  <SelectItem value="current_tool" className="text-white hover:bg-white/10">Current Tool Cost</SelectItem>
                  <SelectItem value="industry_average" className="text-white hover:bg-white/10">Industry Average</SelectItem>
                  <SelectItem value="budget_limit" className="text-white hover:bg-white/10">Budget Limit</SelectItem>
                  <SelectItem value="custom_threshold" className="text-white hover:bg-white/10">Custom Threshold</SelectItem>
                </SelectContent>
              </Select>
              
              {costComparisonBaseline === "custom_threshold" && (
                <div>
                  <Label className="text-white">Custom Cost Threshold ($)</Label>
                  <Input
                    type="number"
                    value={customCostThreshold}
                    onChange={(e) => setCustomCostThreshold(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-black-team border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence Threshold */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Evidence Threshold</CardTitle>
              <CardDescription className="text-white/70">Quality of evidence required (1-4)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Slider
                  value={evidenceThreshold}
                  onValueChange={setEvidenceThreshold}
                  min={1}
                  max={4}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-sm text-white/70">
                  Level {evidenceThreshold[0]} - {evidenceThreshold[0] === 1 ? "Basic" : evidenceThreshold[0] === 2 ? "Good" : evidenceThreshold[0] === 3 ? "Strong" : "Comprehensive"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Existing Tools (Optional) */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Existing Tools (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <TagsInput
                value={existingTools}
                onChange={setExistingTools}
                placeholder="Type tool name and press Enter"
                className="bg-black-team border-white/20"
              />
            </CardContent>
          </Card>

          {/* Time to Market */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">Time to Market</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={timeToMarket} onValueChange={setTimeToMarket}>
                <SelectTrigger className="bg-black-team border-white/20 text-white">
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent className="bg-black-team-light border-white/20">
                  <SelectItem value="immediate" className="text-white hover:bg-white/10">Immediate (0-1 month)</SelectItem>
                  <SelectItem value="short" className="text-white hover:bg-white/10">Short (1-3 months)</SelectItem>
                  <SelectItem value="medium" className="text-white hover:bg-white/10">Medium (3-6 months)</SelectItem>
                  <SelectItem value="long" className="text-white hover:bg-white/10">Long (6+ months)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleLaunchSwarm}
              className="flex-1 bg-white text-black hover:bg-white/90"
              disabled={isSubmitting || isPolling}
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
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              <RotateCcw className="h-4 w-4 mr-1" />Reset
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Logs Viewer Dialog */}
      {showLogs && jobId && (
        <Dialog open={showLogs} onOpenChange={setShowLogs}>
          <DialogContent className="max-w-6xl max-h-[90vh] h-[80vh] flex flex-col bg-black-team-light border-white/20">
            <DialogHeader>
              <DialogTitle className="text-white">Swarm Execution Logs</DialogTitle>
              <DialogDescription className="text-gray-600">
                Real-time logs from the research swarm execution
              </DialogDescription>
            </DialogHeader>
            <div className="flex-grow overflow-hidden">
              <SwarmLogsViewer 
                swarmId={jobId} 
                onClose={() => setShowLogs(false)}
                autoRefresh={true}
                refreshInterval={3000}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
};

export default BlackResearchSwarmForm;
