import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { TagsInput } from "@/components/ui/tags-input";
import { Lightbulb } from "lucide-react";

interface WhiteResearchSwarmFormProps {
  children: React.ReactNode;
}

const WhiteResearchSwarmForm = ({ children }: WhiteResearchSwarmFormProps) => {
  const [open, setOpen] = useState(false);
  const [opportunityTypes, setOpportunityTypes] = useState<string[]>([]);
  const [targetCustomerSize, setTargetCustomerSize] = useState<string[]>([]);
  const [businessModelPreference, setBusinessModelPreference] = useState<string[]>([]);
  const [technicalApproach, setTechnicalApproach] = useState("");
  const [marketEntrySpeed, setMarketEntrySpeed] = useState("");
  const [competitiveLandscape, setCompetitiveLandscape] = useState("");
  const [successMetrics, setSuccessMetrics] = useState<string[]>([]);
  const [riskTolerance, setRiskTolerance] = useState([3]);
  const [minimumOpportunitySize, setMinimumOpportunitySize] = useState("");
  const [ecosystemIntegration, setEcosystemIntegration] = useState<string[]>([]);
  const [customSearchAreas, setCustomSearchAreas] = useState<string[]>([]);

  const handleCheckboxChange = (value: string, currentValues: string[], setter: (values: string[]) => void) => {
    if (currentValues.includes(value)) {
      setter(currentValues.filter(v => v !== value));
    } else {
      setter([...currentValues, value]);
    }
  };

  const handleSuccessMetricsChange = (value: string) => {
    if (successMetrics.includes(value)) {
      setSuccessMetrics(successMetrics.filter(v => v !== value));
    } else if (successMetrics.length < 4) {
      setSuccessMetrics([...successMetrics, value]);
    }
  };

  const handleReset = () => {
    setOpportunityTypes([]);
    setTargetCustomerSize([]);
    setBusinessModelPreference([]);
    setTechnicalApproach("");
    setMarketEntrySpeed("");
    setCompetitiveLandscape("");
    setSuccessMetrics([]);
    setRiskTolerance([3]);
    setMinimumOpportunitySize("");
    setEcosystemIntegration([]);
    setCustomSearchAreas([]);
  };

  const handleLaunchSwarm = () => {
    const researchTask = {
      id: Date.now().toString(),
      team: 'white',
      opportunityTypes,
      targetCustomerSize,
      businessModelPreference,
      technicalApproach,
      marketEntrySpeed,
      competitiveLandscape,
      successMetrics,
      riskTolerance: riskTolerance[0],
      minimumOpportunitySize,
      ecosystemIntegration,
      customSearchAreas,
      createdAt: new Date().toISOString(),
      status: 'launched'
    };

    const existingTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
    existingTasks.push(researchTask);
    localStorage.setItem('researchTasks', JSON.stringify(existingTasks));
    window.dispatchEvent(new CustomEvent('taskAdded'));
    
    console.log("White Team Research Swarm Launched:", researchTask);
    alert(`White Team Research Swarm launched for opportunity discovery!`);
    
    handleReset();
    setOpen(false);
  };

  const opportunityTypeOptions = [
    "Market gaps",
    "Underserved segments",
    "Technology disruptions",
    "Regulatory changes",
    "Workflow inefficiencies",
    "Platform opportunities",
    "Partnership opportunities",
    "New business models"
  ];

  const customerSizeOptions = [
    "Individual consumers",
    "Small businesses (1-50 employees)",
    "Medium businesses (51-500 employees)",
    "Large enterprises (500+ employees)"
  ];

  const businessModelOptions = [
    "SaaS/Subscription",
    "Marketplace",
    "Freemium",
    "One-time purchase",
    "Usage-based pricing",
    "Commission-based",
    "Advertising-supported",
    "Hybrid model"
  ];

  const successMetricOptions = [
    "Revenue potential",
    "User adoption rate",
    "Market penetration",
    "Customer satisfaction",
    "Time to profitability",
    "Competitive advantage",
    "Scalability potential",
    "Strategic alignment"
  ];

  const ecosystemOptions = [
    "CarMax ecosystem",
    "Third-party APIs",
    "Partner platforms",
    "Industry standards",
    "Open source tools",
    "Cloud services"
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white-team-dark">
            <Lightbulb className="h-5 w-5" />
            ⚪ Launch Research Swarm
          </DialogTitle>
          <DialogDescription>
            Find untapped opportunities near CarMax's market.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Opportunity Types */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">Opportunity Types</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {opportunityTypeOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`opportunity-${option}`}
                      checked={opportunityTypes.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, opportunityTypes, setOpportunityTypes)}
                    />
                    <Label htmlFor={`opportunity-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Target Customer Size */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">Target Customer Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {customerSizeOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`customer-${option}`}
                      checked={targetCustomerSize.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, targetCustomerSize, setTargetCustomerSize)}
                    />
                    <Label htmlFor={`customer-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Business Model Preference */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">Business Model Preference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {businessModelOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`business-${option}`}
                      checked={businessModelPreference.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, businessModelPreference, setBusinessModelPreference)}
                    />
                    <Label htmlFor={`business-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Technical Approach */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">Technical Approach</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={technicalApproach} onValueChange={setTechnicalApproach}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="build-from-scratch" id="tech-build" />
                  <Label htmlFor="tech-build">Build from scratch</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="leverage-existing" id="tech-leverage" />
                  <Label htmlFor="tech-leverage">Leverage existing platforms</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="hybrid-approach" id="tech-hybrid" />
                  <Label htmlFor="tech-hybrid">Hybrid approach</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no-code-low-code" id="tech-nocode" />
                  <Label htmlFor="tech-nocode">No-code/Low-code</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Market Entry Speed */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">Market Entry Speed</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={marketEntrySpeed} onValueChange={setMarketEntrySpeed}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preferred speed" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">Immediate (0-3 months)</SelectItem>
                  <SelectItem value="fast">Fast (3-6 months)</SelectItem>
                  <SelectItem value="moderate">Moderate (6-12 months)</SelectItem>
                  <SelectItem value="deliberate">Deliberate (12+ months)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Competitive Landscape */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">Competitive Landscape</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup value={competitiveLandscape} onValueChange={setCompetitiveLandscape}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="blue-ocean" id="comp-blue" />
                  <Label htmlFor="comp-blue">Blue ocean (little competition)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="emerging" id="comp-emerging" />
                  <Label htmlFor="comp-emerging">Emerging competition</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="established" id="comp-established" />
                  <Label htmlFor="comp-established">Established players</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="crowded" id="comp-crowded" />
                  <Label htmlFor="comp-crowded">Crowded market</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Success Metrics (Max 4) */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">Success Metrics (Max 4)</CardTitle>
              <CardDescription>Select up to 4 key success metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {successMetricOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`metric-${option}`}
                      checked={successMetrics.includes(option)}
                      onCheckedChange={() => handleSuccessMetricsChange(option)}
                      disabled={!successMetrics.includes(option) && successMetrics.length >= 4}
                    />
                    <Label htmlFor={`metric-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {successMetrics.length}/4 selected
              </div>
            </CardContent>
          </Card>

          {/* Risk Tolerance */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">Risk Tolerance</CardTitle>
              <CardDescription>Investment risk tolerance (1-5)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Slider
                  value={riskTolerance}
                  onValueChange={setRiskTolerance}
                  min={1}
                  max={5}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-sm text-muted-foreground">
                  Level {riskTolerance[0]} - {riskTolerance[0] === 1 ? "Very Conservative" : riskTolerance[0] === 2 ? "Conservative" : riskTolerance[0] === 3 ? "Moderate" : riskTolerance[0] === 4 ? "Aggressive" : "Very Aggressive"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Minimum Opportunity Size */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">Minimum Opportunity Size</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={minimumOpportunitySize} onValueChange={setMinimumOpportunitySize}>
                <SelectTrigger>
                  <SelectValue placeholder="Select minimum size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small ($100K-$1M revenue potential)</SelectItem>
                  <SelectItem value="medium">Medium ($1M-$10M revenue potential)</SelectItem>
                  <SelectItem value="large">Large ($10M-$100M revenue potential)</SelectItem>
                  <SelectItem value="very-large">Very Large ($100M+ revenue potential)</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Ecosystem Integration (Optional) */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">Ecosystem Integration (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {ecosystemOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`ecosystem-${option}`}
                      checked={ecosystemIntegration.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, ecosystemIntegration, setEcosystemIntegration)}
                    />
                    <Label htmlFor={`ecosystem-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Custom Search Areas (Optional) */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">Custom Search Areas (Optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <TagsInput
                value={customSearchAreas}
                onChange={setCustomSearchAreas}
                placeholder="Type search area and press Enter"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleLaunchSwarm}
              className="flex-1 bg-white-team-dark hover:bg-white-team-dark/90 text-white"
            >
              🔘 Launch Swarm
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

export default WhiteResearchSwarmForm;