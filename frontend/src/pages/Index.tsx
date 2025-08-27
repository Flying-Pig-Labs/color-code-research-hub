/**
 * @fileoverview Main Research page for truflr.ai.
 * 
 * Streamlined research interface featuring a single unified form that combines
 * competitive intelligence and market research. Implements hash-based navigation
 * for switching between research form and information sections.
 * 
 * Features:
 * - Single streamlined research form (combines Red/White team capabilities)
 * - "Describe the forest" approach for comprehensive market analysis
 * - Real-time pipeline job monitoring
 * - Research report history and access
 * - Clean Swiss design with pig theming
 * - Hash-based navigation between sections
 * 
 * Research Focus:
 * - Market analysis and competitive intelligence
 * - Product opportunity discovery  
 * - Strategic positioning insights
 * 
 * @author truflr.ai Team
 * @version 2.0.0
 */

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import { ResearchReportHistory } from "@/components/ResearchReportHistory";
import { CircleHelp, Search, FileText, HelpCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * Main Research page component for streamlined product discovery.
 * 
 * Provides unified research interface, job monitoring, and navigation
 * between research form and help sections. Uses hash-based routing for
 * smooth transitions between content sections.
 * 
 * @returns {JSX.Element} Complete research interface with streamlined form
 */
const Index = () => {
  const [howModalOpen, setHowModalOpen] = useState(false);
  // Research type and form state
  const [researchType, setResearchType] = useState("innovation");
  const [researchTopology, setResearchTopology] = useState("federated");
  
  // Core Configuration (applies to all research types)
  const [investmentScale, setInvestmentScale] = useState("growth");
  const [timeline, setTimeline] = useState("medium-term");
  const [riskProfile, setRiskProfile] = useState("moderate");
  
  // Innovation form state
  const [forestDescription, setForestDescription] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [industryFocus, setIndustryFocus] = useState("");
  
  // Medical Device form state (Clinical Needs Navigator)
  const [clinicalArea, setClinicalArea] = useState("");
  const [fdaPathway, setFdaPathway] = useState("510k");
  const [careSetting, setCareSetting] = useState("outpatient");
  const [techMaturity, setTechMaturity] = useState("emerging");
  
  // Private Equity form state (Acquisition Thesis Generator)
  const [targetIndustry, setTargetIndustry] = useState("");
  const [targetProfile, setTargetProfile] = useState("add-on");
  const [valueDriver, setValueDriver] = useState("cost-synergies");
  const [sellerMotivation, setSellerMotivation] = useState("growth-partnership");
  
  // City Revitalization form state (Public Funding Strategist)
  const [targetLocation, setTargetLocation] = useState("");
  const [focusArea, setFocusArea] = useState("infrastructure");
  const [targetPopulation, setTargetPopulation] = useState("lmi");
  const [localContribution, setLocalContribution] = useState("cash-match");
  
  // Data Center form state (Site Selection Intelligence)
  const [targetRegion, setTargetRegion] = useState("");
  const [facilityType, setFacilityType] = useState("regional");
  const [latencyRequirement, setLatencyRequirement] = useState("standard");
  const [disasterRiskTolerance, setDisasterRiskTolerance] = useState("risk-neutral");
  
  const navItems = [
    { 
      path: "#", 
      label: "How", 
      icon: CircleHelp, 
      variant: "ghost" as const,
      onClick: () => setHowModalOpen(true)
    },
  ];

  // Handle research form submission (hits Red Team API)
  const handleSubmitResearch = async () => {
    // TODO: Implement API call to Red Team endpoint
    const baseData = { researchType, researchTopology };
    
    const coreData = { 
      ...baseData, 
      investmentScale, 
      timeline, 
      riskProfile 
    };
    
    let formData;
    switch (researchType) {
      case "innovation":
        formData = { ...coreData, forestDescription, companyName, industryFocus };
        break;
      case "medical-device":
        formData = { ...coreData, clinicalArea, fdaPathway, careSetting, techMaturity };
        break;
      case "private-equity":
        formData = { ...coreData, targetIndustry, targetProfile, valueDriver, sellerMotivation };
        break;
      case "city-revitalization":
        formData = { ...coreData, targetLocation, focusArea, targetPopulation, localContribution };
        break;
      case "data-center":
        formData = { ...coreData, targetRegion, facilityType, latencyRequirement, disasterRiskTolerance };
        break;
      default:
        formData = coreData;
    }
    
    console.log("Submitting research request:", formData);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        title="research"
        subtitle="product discovery intelligence"
        icon={<Search className="h-6 w-6" />}
        showHealthCheck={false}
        navItems={navItems}
      />
      

      {/* Streamlined Research Form - The main interface */}
        <section className="py-12 lg:py-20">
          <div className="max-w-4xl mx-auto px-6">
            <Card className="bg-card border-border shadow-card border-2 border-stone-300 dark:border-stone-600">
              <CardContent className="p-8">
                <div>
                  <Label className="text-lg font-heading font-semibold text-foreground mb-4 block">
                    launch a truffle hunt
                  </Label>
                  
                  <Tabs value={researchType} onValueChange={setResearchType} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 mb-8 bg-transparent border-b-2 border-border rounded-none p-0 h-auto">
                      <TabsTrigger value="innovation" className="text-sm px-4 py-3 border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none">innovation</TabsTrigger>
                      <TabsTrigger value="medical-device" className="text-sm px-4 py-3 border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none">medical device</TabsTrigger>
                      <TabsTrigger value="private-equity" className="text-sm px-4 py-3 border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none">private equity</TabsTrigger>
                      <TabsTrigger value="city-revitalization" className="text-sm px-4 py-3 border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none">city revitalization</TabsTrigger>
                      <TabsTrigger value="data-center" className="text-sm px-4 py-3 border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent rounded-none">data center</TabsTrigger>
                    </TabsList>

                    <TabsContent value={researchType} className="mt-0">
                      {/* Research type description */}
                      <div className="mb-6">
                        {researchType === "innovation" && (
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            MARKET LANDSCAPE AND COMPETITIVE INTELLIGENCE RESEARCH
                          </p>
                        )}
                        {researchType === "medical-device" && (
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            BENCH-TO-BEDSIDE MEDICAL DEVICE OPPORTUNITY ANALYSIS
                          </p>
                        )}
                        {researchType === "private-equity" && (
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            FRAGMENTED INDUSTRY ROLL-UP INVESTMENT OPPORTUNITIES
                          </p>
                        )}
                        {researchType === "city-revitalization" && (
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            MUNICIPAL DEVELOPMENT AND ECONOMIC REVITALIZATION RESEARCH
                          </p>
                        )}
                        {researchType === "data-center" && (
                          <p className="text-xs text-muted-foreground uppercase tracking-wider">
                            STRATEGIC DATA CENTER LOCATION AND INFRASTRUCTURE ANALYSIS
                          </p>
                        )}
                      </div>
                      
                      <form onSubmit={(e) => { e.preventDefault(); handleSubmitResearch(); }} className="space-y-8">

                        {/* Core Configuration - applies to all research types */}
                        <div className=\"border border-border rounded-lg p-6 bg-muted/20\">
                          <h3 className=\"text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider\">Core Configuration</h3>
                          
                          {/* Investment Scale */}
                          <div className=\"mb-6\">
                            <Label className=\"font-medium text-foreground mb-3 block\">Investment Scale</Label>
                            <div className=\"grid grid-cols-4 gap-2\">
                              {[
                                { value: 'seed', label: 'Seed', desc: '$0-1M' },
                                { value: 'growth', label: 'Growth', desc: '$1-25M' },
                                { value: 'scale', label: 'Scale', desc: '$25-100M' },
                                { value: 'enterprise', label: 'Enterprise', desc: '$100M+' }
                              ].map(option => (
                                <button
                                  key={option.value}
                                  type=\"button\"
                                  onClick={() => setInvestmentScale(option.value)}
                                  className={`p-3 rounded-md border text-sm text-center transition-colors ${
                                    investmentScale === option.value
                                      ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                  }`}
                                >
                                  <div className=\"font-medium\">{option.label}</div>
                                  <div className=\"text-xs text-muted-foreground\">{option.desc}</div>
                                </button>
                              ))}
                            </div>
                            <p className=\"text-xs text-muted-foreground mt-2\">Choose the investment size you're targeting.</p>
                          </div>

                          {/* Timeline */}
                          <div className=\"mb-6\">
                            <Label className=\"font-medium text-foreground mb-3 block\">Timeline</Label>
                            <div className=\"flex gap-3\">
                              {[
                                { value: 'short-term', label: 'Short-term', icon: '⏱', desc: '<2 years' },
                                { value: 'medium-term', label: 'Medium-term', icon: '📆', desc: '2-5 years' },
                                { value: 'long-term', label: 'Long-term', icon: '🗓', desc: '5+ years' }
                              ].map(option => (
                                <button
                                  key={option.value}
                                  type=\"button\"
                                  onClick={() => setTimeline(option.value)}
                                  className={`p-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                    timeline === option.value
                                      ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                  }`}
                                >
                                  <div className=\"text-lg mb-1\">{option.icon}</div>
                                  <div className=\"font-medium\">{option.label}</div>
                                  <div className=\"text-xs text-muted-foreground\">{option.desc}</div>
                                </button>
                              ))}
                            </div>
                            <p className=\"text-xs text-muted-foreground mt-2\">Select your planning horizon.</p>
                          </div>

                          {/* Risk Profile */}
                          <div className=\"mb-0\">
                            <Label className=\"font-medium text-foreground mb-3 block\">Risk Profile</Label>
                            <div className=\"flex gap-3\">
                              {[
                                { value: 'conservative', label: 'Conservative' },
                                { value: 'moderate', label: 'Moderate' },
                                { value: 'aggressive', label: 'Aggressive' }
                              ].map(option => (
                                <button
                                  key={option.value}
                                  type=\"button\"
                                  onClick={() => setRiskProfile(option.value)}
                                  className={`p-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                    riskProfile === option.value
                                      ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                            <p className=\"text-xs text-muted-foreground mt-2\">Adjust to reflect your risk appetite.</p>
                          </div>
                        </div>

                        {/* Dynamic form content based on research type */}
                        {researchType === "innovation" && (
                          <div>
                            <Textarea
                              value={forestDescription}
                              onChange={(e) => setForestDescription(e.target.value)}
                              placeholder="Tell us about the market landscape, competitive environment, or product space you want to explore..."
                              className="min-h-[120px] text-base"
                              required
                            />
                          </div>
                        )}

                        {researchType === "medical-device" && (
                          <div>
                            <Label htmlFor="clinicalArea" className="font-medium text-foreground mb-2 block">
                              clinical area or medical condition
                            </Label>
                            <Input
                              id="clinicalArea"
                              value={clinicalArea}
                              onChange={(e) => setClinicalArea(e.target.value)}
                              placeholder="e.g., Cardiology, orthopedic spine surgery, type 2 diabetes management, glaucoma"
                              className="text-base"
                              required
                            />
                          </div>
                        )}

                        {researchType === "private-equity" && (
                          <div>
                            <Label htmlFor="targetIndustry" className="font-medium text-foreground mb-2 block">
                              target fragmented industry
                            </Label>
                            <Input
                              id="targetIndustry"
                              value={targetIndustry}
                              onChange={(e) => setTargetIndustry(e.target.value)}
                              placeholder="e.g., HVAC services, veterinary clinics, dental practices, managed IT services"
                              className="text-base"
                              required
                            />
                          </div>
                        )}

                        {researchType === "city-revitalization" && (
                          <div>
                            <Label htmlFor="targetLocation" className="font-medium text-foreground mb-2 block">
                              city, municipality, or county
                            </Label>
                            <Input
                              id="targetLocation"
                              value={targetLocation}
                              onChange={(e) => setTargetLocation(e.target.value)}
                              placeholder="e.g., Richmond, Virginia; Franklin County, Ohio; Bronzeville neighborhood in Chicago"
                              className="text-base"
                              required
                            />
                          </div>
                        )}

                        {researchType === "data-center" && (
                          <div>
                            <Label htmlFor="targetRegion" className="font-medium text-foreground mb-2 block">
                              target geographic region
                            </Label>
                            <Input
                              id="targetRegion"
                              value={targetRegion}
                              onChange={(e) => setTargetRegion(e.target.value)}
                              placeholder="e.g., Northern Virginia, state of Arizona, Pacific Northwest, Dallas-Fort Worth metroplex"
                              className="text-base"
                              required
                            />
                          </div>
                        )}


                  {/* Additional fields for Innovation research type only */}
                  {researchType === "innovation" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="company" className="font-medium text-foreground mb-2 block">
                          company/project name
                        </Label>
                        <Input
                          id="company"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                          placeholder="Your company or project"
                          className="text-base"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="industry" className="font-medium text-foreground mb-2 block">
                          industry focus
                        </Label>
                        <Input
                          id="industry"
                          value={industryFocus}
                          onChange={(e) => setIndustryFocus(e.target.value)}
                          placeholder="e.g., SaaS, Healthcare, FinTech"
                          className="text-base"
                        />
                      </div>
                    </div>
                  )}

                        {/* Research topology selection - moved to bottom with special styling */}
                        <div className="border-2 border-amber-300 dark:border-amber-600 rounded-lg p-6 bg-amber-50/30 dark:bg-amber-900/10 text-center">
                          <Label className="font-medium text-foreground mb-4 block">
                            research topology
                          </Label>
                          <div className="flex gap-3 justify-center">
                            <button
                              type="button"
                              onClick={() => setResearchTopology('hierarchical')}
                              className={`px-3 py-2 rounded-md border transition-colors text-sm ${
                                researchTopology === 'hierarchical'
                                  ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              hierarchical
                            </button>
                            <button
                              type="button"
                              onClick={() => setResearchTopology('byzantine')}
                              className={`px-3 py-2 rounded-md border transition-colors text-sm ${
                                researchTopology === 'byzantine'
                                  ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              byzantine
                            </button>
                            <button
                              type="button"
                              onClick={() => setResearchTopology('federated')}
                              className={`px-3 py-2 rounded-md border transition-colors text-sm ${
                                researchTopology === 'federated'
                                  ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                  : 'bg-background border-border text-muted-foreground hover:bg-muted'
                              }`}
                            >
                              federated <span className="text-xs text-amber-600 dark:text-amber-400">(recommended)</span>
                            </button>
                          </div>
                        </div>

                        {/* Submit button */}
                        <div className="flex justify-center pt-4">
                          <Button 
                            type="submit" 
                            size="lg"
                            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8"
                            disabled={
                              (researchType === "innovation" && !forestDescription.trim()) ||
                              (researchType === "medical-device" && !clinicalArea.trim()) ||
                              (researchType === "private-equity" && !targetIndustry.trim()) ||
                              (researchType === "city-revitalization" && !targetLocation.trim()) ||
                              (researchType === "data-center" && !targetRegion.trim())
                            }
                          >
                            start research hunt
                          </Button>
                        </div>
                      </form>
                    </TabsContent>
                  </Tabs>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>


      {/* Research History Section - Clean, spacious layout */}
      <div className="max-w-6xl mx-auto px-6">
        <Card className="bg-card border-border shadow-card">
          <CardContent className="p-8">
            <ResearchReportHistory limit={10} />
          </CardContent>
        </Card>
      </div>


    </div>
  );
};

export default Index;
