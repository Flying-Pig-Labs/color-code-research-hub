/**
 * @fileoverview Advanced research form component for Red Team swarm coordination.
 * 
 * Comprehensive form interface for configuring and launching Red Team research
 * operations. Handles complex multi-field data collection including market analysis,
 * competitive intelligence, and disruption strategy parameters.
 * 
 * Form Categories:
 * - Company Analysis: Target company and focus areas
 * - Market Scope: Geographic and demographic targeting
 * - Timeline & Investment: Resource allocation parameters
 * - Competition: Market intensity and positioning
 * - Strategy: Disruption approach and industry verticals
 * 
 * Features:
 * - Multi-step form validation
 * - Real-time API integration
 * - Unique repository ID generation
 * - GitHub repository creation
 * - Error handling and user feedback
 * - Environment-aware operation
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

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
import { Target, Loader2, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { apiService, showApiError, ApiError } from "@/services/api";
import { useApiEnvironment } from "@/hooks/useApiEnvironment";
import { Badge } from "@/components/ui/badge";
import { generateRepoId, generateUniqueRepoId } from "@/utils/idGenerator";
import { githubService } from "@/services/githubService";
import { submitResearch, formatRedTeamPrompt } from "@/services/researchApi";

/**
 * Props interface for the ResearchSwarmForm component.
 */
interface ResearchSwarmFormProps {
  /** Trigger element (typically a button) to open the form dialog */
  children: React.ReactNode;
}

/**
 * Advanced research form component for Red Team operations.
 * 
 * Provides comprehensive data collection interface for market research,
 * competitive analysis, and disruption strategy planning. Integrates with
 * GitHub for repository creation and API services for research execution.
 * 
 * @param {ResearchSwarmFormProps} props - Component props
 * @returns {JSX.Element} Dialog-based form with multi-category data collection
 */
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
  
  const apiEnvironment = useApiEnvironment();

  // Remove polling - let the main table handle it

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

    try {
      // Format the research prompt for Red Team
      const researchPrompt = formatRedTeamPrompt(researchData);
      
      // Submit to EC2 research endpoint
      const response = await submitResearch({
        task: researchPrompt,
        team: 'red', // This is Red Team research
        companyName: companyName,
        vendorName: companyName, // Add vendor name for better tracking
        targetCompany: companyName // Specifically for red team target display
      });
      
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
            Launch Research Swarm
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
              disabled={!companyName || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Launching...
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
              <RotateCcw className="h-4 w-4 mr-1" />Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResearchSwarmForm;