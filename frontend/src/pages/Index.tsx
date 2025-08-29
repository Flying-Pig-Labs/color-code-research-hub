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
import { CircleHelp, Search, FileText, HelpCircle, Clock, Calendar, CalendarDays, Shield, TrendingUp, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MermaidDiagram } from "@/components/MermaidDiagram";
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
  
  // Form page navigation state
  const [currentFormPage, setCurrentFormPage] = useState(1);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
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
  const [techMaturity, setTechMaturity] = useState(1);
  
  // Private Equity form state (Acquisition Thesis Generator)
  const [targetIndustry, setTargetIndustry] = useState("");
  const [targetProfile, setTargetProfile] = useState("founder-led");
  const [valueDriver, setValueDriver] = useState("consolidation");
  const [sellerMotivation, setSellerMotivation] = useState("");
  
  // City Revitalization form state (Public Funding Strategist)
  const [targetLocation, setTargetLocation] = useState("");
  const [focusArea, setFocusArea] = useState("");
  const [targetPopulation, setTargetPopulation] = useState("existing");
  const [localContribution, setLocalContribution] = useState("funding");
  
  // Data Center form state (Site Selection Intelligence)
  const [targetRegion, setTargetRegion] = useState("");
  const [facilityType, setFacilityType] = useState("hyperscale");
  const [latencyRequirement, setLatencyRequirement] = useState("ultra-low");
  const [disasterRiskTolerance, setDisasterRiskTolerance] = useState(1);
  
  const navItems = [
    { 
      path: "#", 
      label: "How", 
      icon: CircleHelp, 
      variant: "ghost" as const,
      onClick: () => setHowModalOpen(true)
    },
  ];

  // Handle research form submission (hits Research API)
  const handleSubmitResearch = async () => {
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
    
    try {
      console.log("Submitting research request:", formData);
      
      // Call the research API with proper base URL
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
      const response = await fetch(`${API_BASE_URL}/api/research/v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const result = await response.json();
      
      if (response.ok) {
        console.log("Research job started:", result);
        alert(`Research job started successfully! Request ID: ${result.request_id}`);
        
        // Reset form or redirect as needed
        // Could add toast notification here instead of alert
        
      } else {
        console.error("Research submission failed:", result);
        alert(`Failed to start research: ${result.message || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.error("Error submitting research request:", error);
      alert("Failed to submit research request. Please try again.");
    }
  };

  // Page navigation functions
  const handleNextPage = () => {
    if (!validatePage1()) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentFormPage(2);
      setIsTransitioning(false);
    }, 150);
  };

  const handlePrevPage = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentFormPage(1);
      setIsTransitioning(false);
    }, 150);
  };

  // Validation for Page 1 (use-case specific fields)
  const validatePage1 = () => {
    switch (researchType) {
      case "innovation":
        return forestDescription.trim() !== "";
      case "medical-device":
        return clinicalArea.trim() !== "";
      case "private-equity":
        return targetIndustry.trim() !== "";
      case "city-revitalization":
        return targetLocation.trim() !== "";
      case "data-center":
        return targetRegion.trim() !== "";
      default:
        return true;
    }
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
        <section className="py-12 lg:py-20 min-h-screen flex-1">
          <div className="max-w-4xl mx-auto px-6 h-full">
            <Card className="bg-card border-border shadow-card border-2 border-stone-300 dark:border-stone-600 h-full">
              <CardContent className="p-8 h-full overflow-y-auto">
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
                      
                      <form onSubmit={(e) => { e.preventDefault(); currentFormPage === 2 ? handleSubmitResearch() : handleNextPage(); }} className="space-y-8 pb-8">

                        {/* Progress Indicator */}
                        <div className="flex items-center justify-center mb-8">
                          <div className="flex items-center space-x-4">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                              currentFormPage >= 1 
                                ? 'bg-stone-600 dark:bg-stone-400 text-white dark:text-black' 
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                            }`}>
                              1
                            </div>
                            <div className={`h-1 w-16 rounded-full ${
                              currentFormPage >= 2 
                                ? 'bg-stone-600 dark:bg-stone-400' 
                                : 'bg-stone-200 dark:bg-stone-700'
                            }`} />
                            <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                              currentFormPage >= 2 
                                ? 'bg-stone-600 dark:bg-stone-400 text-white dark:text-black' 
                                : 'bg-stone-200 dark:bg-stone-700 text-stone-500'
                            }`}>
                              2
                            </div>
                          </div>
                        </div>

                        {/* Page Container with Slide Transition */}
                        <div className="relative overflow-x-hidden overflow-y-auto" style={{ minHeight: '400px' }}>
                          {/* Page 1 Container */}
                          <div 
                            className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                              currentFormPage === 1 ? 'translate-x-0' : '-translate-x-full'
                            } ${isTransitioning ? 'pointer-events-none' : ''}`}
                            style={{ minHeight: 'fit-content' }}
                          >
                            {/* Page 1: Use-Case Specific Configuration */}
                            {currentFormPage === 1 && (
                              <div className="space-y-6">
                              <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-foreground mb-2">Research Configuration</h3>
                                <p className="text-sm text-muted-foreground">Tell us about your specific research needs</p>
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
                          <div className="space-y-6">
                            {/* Clinical Area - existing field */}
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

                            {/* FDA Pathway - 2 button selector */}
                            <div>
                              <Label className="font-medium text-foreground mb-3 block">FDA Regulatory Pathway</Label>
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setFdaPathway('510k')}
                                  className={`px-4 py-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                    fdaPathway === '510k'
                                      ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                  }`}
                                >
                                  <div className="font-medium">510(k) Clearance</div>
                                  <div className="text-xs text-muted-foreground mt-1">Predicate device exists</div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFdaPathway('pma')}
                                  className={`px-4 py-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                    fdaPathway === 'pma'
                                      ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                  }`}
                                >
                                  <div className="font-medium">PMA Approval</div>
                                  <div className="text-xs text-muted-foreground mt-1">Novel/high-risk device</div>
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">Choose the expected FDA regulatory path.</p>
                            </div>

                            {/* Care Setting - 3 pill buttons */}
                            <div>
                              <Label className="font-medium text-foreground mb-3 block">Primary Care Setting</Label>
                              <div className="flex gap-2 flex-wrap">
                                {[
                                  { value: 'outpatient', label: 'Outpatient' },
                                  { value: 'inpatient', label: 'Inpatient' },
                                  { value: 'home', label: 'Home Care' }
                                ].map(option => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setCareSetting(option.value)}
                                    className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                                      careSetting === option.value
                                        ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">Where will the device primarily be used?</p>
                            </div>

                            {/* Technology Maturity - 3-step slider */}
                            <div>
                              <Label className="font-medium text-foreground mb-3 block">Technology Maturity Level</Label>
                              <div className="relative">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs text-muted-foreground">Concept</span>
                                  <span className="text-xs text-muted-foreground">Prototype</span>
                                  <span className="text-xs text-muted-foreground">Validated</span>
                                </div>
                                <div className="flex gap-1">
                                  {[1, 2, 3].map(level => (
                                    <button
                                      key={level}
                                      type="button"
                                      onClick={() => setTechMaturity(level)}
                                      className={`flex-1 h-3 rounded-full transition-colors ${
                                        techMaturity >= level
                                          ? 'bg-stone-400 dark:bg-stone-500'
                                          : 'bg-stone-200 dark:bg-stone-700'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <div className="flex justify-between mt-2">
                                  <span className={`text-xs ${
                                    techMaturity >= 1 ? 'text-foreground font-medium' : 'text-muted-foreground'
                                  }`}>Early stage</span>
                                  <span className={`text-xs ${
                                    techMaturity >= 2 ? 'text-foreground font-medium' : 'text-muted-foreground'
                                  }`}>Working prototype</span>
                                  <span className={`text-xs ${
                                    techMaturity >= 3 ? 'text-foreground font-medium' : 'text-muted-foreground'
                                  }`}>Clinical validation</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">How mature is the underlying technology?</p>
                            </div>
                          </div>
                        )}

                        {researchType === "private-equity" && (
                          <div className="space-y-6">
                            {/* Target Profile - Industry field + 3 vertical buttons */}
                            <div>
                              <Label htmlFor="targetIndustry" className="font-medium text-foreground mb-2 block">
                                target fragmented industry
                              </Label>
                              <Input
                                id="targetIndustry"
                                value={targetIndustry}
                                onChange={(e) => setTargetIndustry(e.target.value)}
                                placeholder="e.g., HVAC services, veterinary clinics, dental practices, managed IT services"
                                className="text-base mb-4"
                                required
                              />
                              
                              <Label className="font-medium text-foreground mb-3 block">Target Company Profile</Label>
                              <div className="flex flex-col gap-2">
                                {[
                                  { value: 'founder-led', label: 'Founder-Led', desc: 'Original founder still involved' },
                                  { value: 'family-owned', label: 'Family-Owned', desc: 'Multi-generational business' },
                                  { value: 'management-owned', label: 'Management-Owned', desc: 'Professional management team' }
                                ].map(option => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setTargetProfile(option.value)}
                                    className={`px-4 py-3 rounded-md border text-sm text-left transition-colors ${
                                      targetProfile === option.value
                                        ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                  >
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">What type of ownership structure are you targeting?</p>
                            </div>

                            {/* Value Driver - 4 pill buttons */}
                            <div>
                              <Label className="font-medium text-foreground mb-3 block">Primary Value Driver</Label>
                              <div className="flex gap-2 flex-wrap">
                                {[
                                  { value: 'consolidation', label: 'Consolidation' },
                                  { value: 'digitization', label: 'Digitization' },
                                  { value: 'expansion', label: 'Geographic Expansion' },
                                  { value: 'operational', label: 'Operational Excellence' }
                                ].map(option => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setValueDriver(option.value)}
                                    className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                                      valueDriver === option.value
                                        ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                  >
                                    {option.label}
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">What's your main strategy for value creation?</p>
                            </div>

                            {/* Seller Motivation - dropdown */}
                            <div>
                              <Label htmlFor="sellerMotivation" className="font-medium text-foreground mb-2 block">
                                Seller Motivation
                              </Label>
                              <select
                                id="sellerMotivation"
                                value={sellerMotivation}
                                onChange={(e) => setSellerMotivation(e.target.value)}
                                className="w-full px-3 py-2 text-base border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                              >
                                <option value="">Select seller motivation...</option>
                                <option value="retirement">Founder Retirement</option>
                                <option value="succession">Succession Planning</option>
                                <option value="growth-capital">Growth Capital Needs</option>
                                <option value="liquidity">Liquidity Event</option>
                                <option value="strategic-pivot">Strategic Pivot</option>
                                <option value="market-pressure">Market Pressure</option>
                              </select>
                              <p className="text-xs text-muted-foreground mt-2">Why might sellers be motivated to exit?</p>
                            </div>
                          </div>
                        )}

                        {researchType === "city-revitalization" && (
                          <div className="space-y-6">
                            {/* Target Location - existing field */}
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

                            {/* Focus Area - dropdown */}
                            <div>
                              <Label htmlFor="focusArea" className="font-medium text-foreground mb-2 block">
                                Development Focus Area
                              </Label>
                              <select
                                id="focusArea"
                                value={focusArea}
                                onChange={(e) => setFocusArea(e.target.value)}
                                className="w-full px-3 py-2 text-base border border-border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                              >
                                <option value="">Select focus area...</option>
                                <option value="downtown">Downtown Revitalization</option>
                                <option value="residential">Residential Development</option>
                                <option value="mixed-use">Mixed-Use Districts</option>
                                <option value="industrial">Industrial Redevelopment</option>
                                <option value="waterfront">Waterfront Development</option>
                                <option value="historic">Historic Preservation</option>
                                <option value="transit">Transit-Oriented Development</option>
                              </select>
                              <p className="text-xs text-muted-foreground mt-2">What type of development are you focusing on?</p>
                            </div>

                            {/* Target Population - 2 buttons */}
                            <div>
                              <Label className="font-medium text-foreground mb-3 block">Target Population</Label>
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setTargetPopulation('existing')}
                                  className={`px-4 py-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                    targetPopulation === 'existing'
                                      ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                  }`}
                                >
                                  <div className="font-medium">Existing Residents</div>
                                  <div className="text-xs text-muted-foreground mt-1">Improve current community</div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTargetPopulation('new')}
                                  className={`px-4 py-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                    targetPopulation === 'new'
                                      ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                  }`}
                                >
                                  <div className="font-medium">New Residents</div>
                                  <div className="text-xs text-muted-foreground mt-1">Attract new population</div>
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">Who is the primary beneficiary of this development?</p>
                            </div>

                            {/* Local Contribution - 3-option selector */}
                            <div>
                              <Label className="font-medium text-foreground mb-3 block">Local Government Contribution</Label>
                              <div className="flex gap-3">
                                {[
                                  { value: 'funding', label: 'Funding', desc: 'Financial investment' },
                                  { value: 'land', label: 'Land', desc: 'Property contribution' },
                                  { value: 'regulatory', label: 'Regulatory', desc: 'Policy support' }
                                ].map(option => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setLocalContribution(option.value)}
                                    className={`px-4 py-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                      localContribution === option.value
                                        ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                  >
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">What can local government contribute to the project?</p>
                            </div>
                          </div>
                        )}

                        {researchType === "data-center" && (
                          <div className="space-y-6">
                            {/* Target Region - existing field */}
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

                            {/* Facility Type - 2 buttons */}
                            <div>
                              <Label className="font-medium text-foreground mb-3 block">Facility Type</Label>
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => setFacilityType('hyperscale')}
                                  className={`px-4 py-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                    facilityType === 'hyperscale'
                                      ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                  }`}
                                >
                                  <div className="font-medium">Hyperscale</div>
                                  <div className="text-xs text-muted-foreground mt-1">Large-scale cloud providers</div>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setFacilityType('colocation')}
                                  className={`px-4 py-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                    facilityType === 'colocation'
                                      ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                  }`}
                                >
                                  <div className="font-medium">Colocation</div>
                                  <div className="text-xs text-muted-foreground mt-1">Multi-tenant facilities</div>
                                </button>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">What type of data center are you targeting?</p>
                            </div>

                            {/* Latency Requirement - 3 buttons */}
                            <div>
                              <Label className="font-medium text-foreground mb-3 block">Latency Requirement</Label>
                              <div className="flex gap-3">
                                {[
                                  { value: 'ultra-low', label: 'Ultra-Low', desc: '<5ms' },
                                  { value: 'low', label: 'Low', desc: '<20ms' },
                                  { value: 'standard', label: 'Standard', desc: '<50ms' }
                                ].map(option => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setLatencyRequirement(option.value)}
                                    className={`px-4 py-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                      latencyRequirement === option.value
                                        ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                  >
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground mt-1">{option.desc}</div>
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">What latency performance do you need?</p>
                            </div>

                            {/* Disaster Risk Tolerance - 3-step slider */}
                            <div>
                              <Label className="font-medium text-foreground mb-3 block">Disaster Risk Tolerance</Label>
                              <div className="relative">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs text-muted-foreground">Low Risk</span>
                                  <span className="text-xs text-muted-foreground">Medium Risk</span>
                                  <span className="text-xs text-muted-foreground">High Risk</span>
                                </div>
                                <div className="flex gap-1">
                                  {[1, 2, 3].map(level => (
                                    <button
                                      key={level}
                                      type="button"
                                      onClick={() => setDisasterRiskTolerance(level)}
                                      className={`flex-1 h-3 rounded-full transition-colors ${
                                        disasterRiskTolerance >= level
                                          ? 'bg-stone-400 dark:bg-stone-500'
                                          : 'bg-stone-200 dark:bg-stone-700'
                                      }`}
                                    />
                                  ))}
                                </div>
                                <div className="flex justify-between mt-2">
                                  <span className={`text-xs ${
                                    disasterRiskTolerance >= 1 ? 'text-foreground font-medium' : 'text-muted-foreground'
                                  }`}>Stable regions</span>
                                  <span className={`text-xs ${
                                    disasterRiskTolerance >= 2 ? 'text-foreground font-medium' : 'text-muted-foreground'
                                  }`}>Some risk acceptable</span>
                                  <span className={`text-xs ${
                                    disasterRiskTolerance >= 3 ? 'text-foreground font-medium' : 'text-muted-foreground'
                                  }`}>Cost over stability</span>
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">How much disaster risk can you tolerate for lower costs?</p>
                            </div>
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
                              </div>
                            )}

                          {/* Page 2: Strategic Configuration */}
                          {currentFormPage === 2 && (
                            <div className="space-y-6">
                              <div className="text-center mb-6">
                                <h3 className="text-lg font-semibold text-foreground mb-2">Strategic Configuration</h3>
                                <p className="text-sm text-muted-foreground">Configure investment parameters and research approach</p>
                              </div>

                        {/* Core Configuration - applies to all research types */}
                        <div className="border border-border rounded-lg p-6 bg-muted/20">
                          <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Core Configuration</h3>
                          
                          {/* Investment Scale */}
                          <div className="mb-6">
                            <Label className="font-medium text-foreground mb-3 block">Investment Scale</Label>
                            <div className="grid grid-cols-4 gap-2">
                              {[
                                { value: 'seed', label: 'Seed', desc: '$0-1M' },
                                { value: 'growth', label: 'Growth', desc: '$1-25M' },
                                { value: 'scale', label: 'Scale', desc: '$25-100M' },
                                { value: 'enterprise', label: 'Enterprise', desc: '$100M+' }
                              ].map(option => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => setInvestmentScale(option.value)}
                                  className={`p-3 rounded-md border text-sm text-center transition-colors ${
                                    investmentScale === option.value
                                      ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                      : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                  }`}
                                >
                                  <div className="font-medium">{option.label}</div>
                                  <div className="text-xs text-muted-foreground">{option.desc}</div>
                                </button>
                              ))}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Choose the investment size you're targeting.</p>
                          </div>

                          {/* Timeline */}
                          <div className="mb-6">
                            <Label className="font-medium text-foreground mb-3 block">Timeline</Label>
                            <div className="flex gap-3">
                              {[
                                { value: 'short-term', label: 'Short-term', icon: Clock, desc: '<2 years' },
                                { value: 'medium-term', label: 'Medium-term', icon: Calendar, desc: '2-5 years' },
                                { value: 'long-term', label: 'Long-term', icon: CalendarDays, desc: '5+ years' }
                              ].map(option => {
                                const IconComponent = option.icon;
                                return (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setTimeline(option.value)}
                                    className={`p-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                      timeline === option.value
                                        ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                  >
                                    <div className="mb-1">
                                      <IconComponent className="h-5 w-5 mx-auto" />
                                    </div>
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                                  </button>
                                );
                              })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">Select your planning horizon.</p>
                          </div>

                          {/* Risk Profile */}
                          <div className="mb-0">
                            <Label className="font-medium text-foreground mb-3 block">Risk Profile</Label>
                            <div className="flex gap-3">
                              {[
                                { value: 'conservative', label: 'Conservative' },
                                { value: 'moderate', label: 'Moderate' },
                                { value: 'aggressive', label: 'Aggressive' }
                              ].map(option => (
                                <button
                                  key={option.value}
                                  type="button"
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
                            <p className="text-xs text-muted-foreground mt-2">Adjust to reflect your risk appetite.</p>
                          </div>
                        </div>

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
                            </div>
                          )}
                          </div>

                          {/* Page 2 Container */}
                          <div 
                            className={`absolute inset-0 transition-transform duration-300 ease-in-out ${
                              currentFormPage === 2 ? 'translate-x-0' : 'translate-x-full'
                            } ${isTransitioning ? 'pointer-events-none' : ''}`}
                            style={{ minHeight: 'fit-content' }}
                          >
                            {/* Page 2: Strategic Configuration */}
                            {currentFormPage === 2 && (
                              <div className="space-y-6">
                                <div className="text-center mb-6">
                                  <h3 className="text-lg font-semibold text-foreground mb-2">Strategic Configuration</h3>
                                  <p className="text-sm text-muted-foreground">Configure investment parameters and research approach</p>
                                </div>

                          {/* Core Configuration - applies to all research types */}
                          <div className="border border-border rounded-lg p-6 bg-muted/20">
                            <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">Core Configuration</h3>
                            
                            {/* Investment Scale */}
                            <div className="mb-6">
                              <Label className="font-medium text-foreground mb-3 block">Investment Scale</Label>
                              <div className="grid grid-cols-4 gap-2">
                                {[
                                  { value: 'seed', label: 'Seed', desc: '$0-1M' },
                                  { value: 'growth', label: 'Growth', desc: '$1-25M' },
                                  { value: 'scale', label: 'Scale', desc: '$25-100M' },
                                  { value: 'enterprise', label: 'Enterprise', desc: '$100M+' }
                                ].map(option => (
                                  <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setInvestmentScale(option.value)}
                                    className={`p-3 rounded-md border text-sm text-center transition-colors ${
                                      investmentScale === option.value
                                        ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                        : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                    }`}
                                  >
                                    <div className="font-medium">{option.label}</div>
                                    <div className="text-xs text-muted-foreground">{option.desc}</div>
                                  </button>
                                ))}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">Choose the investment size you're targeting.</p>
                            </div>

                            {/* Timeline */}
                            <div className="mb-6">
                              <Label className="font-medium text-foreground mb-3 block">Timeline</Label>
                              <div className="flex gap-3">
                                {[
                                  { value: 'short-term', label: 'Short-term', icon: Clock, desc: '<2 years' },
                                  { value: 'medium-term', label: 'Medium-term', icon: Calendar, desc: '2-5 years' },
                                  { value: 'long-term', label: 'Long-term', icon: CalendarDays, desc: '5+ years' }
                                ].map(option => {
                                  const IconComponent = option.icon;
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => setTimeline(option.value)}
                                      className={`p-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                        timeline === option.value
                                          ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                          : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                      }`}
                                    >
                                      <div className="mb-1">
                                        <IconComponent className="h-5 w-5 mx-auto" />
                                      </div>
                                      <div className="font-medium">{option.label}</div>
                                      <div className="text-xs text-muted-foreground">{option.desc}</div>
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">What's your investment timeline?</p>
                            </div>

                            {/* Risk Profile */}
                            <div className="mb-6">
                              <Label className="font-medium text-foreground mb-3 block">Risk Profile</Label>
                              <div className="flex gap-3">
                                {[
                                  { value: 'conservative', label: 'Conservative', icon: Shield, desc: 'Lower risk' },
                                  { value: 'moderate', label: 'Moderate', icon: TrendingUp, desc: 'Balanced' },
                                  { value: 'aggressive', label: 'Aggressive', icon: Zap, desc: 'Higher risk' }
                                ].map(option => {
                                  const IconComponent = option.icon;
                                  return (
                                    <button
                                      key={option.value}
                                      type="button"
                                      onClick={() => setRiskProfile(option.value)}
                                      className={`p-3 rounded-md border text-sm flex-1 text-center transition-colors ${
                                        riskProfile === option.value
                                          ? 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-600 text-foreground'
                                          : 'bg-background border-border text-muted-foreground hover:bg-muted'
                                      }`}
                                    >
                                      <div className="mb-1">
                                        <IconComponent className="h-5 w-5 mx-auto" />
                                      </div>
                                      <div className="font-medium">{option.label}</div>
                                      <div className="text-xs text-muted-foreground">{option.desc}</div>
                                    </button>
                                  );
                                })}
                              </div>
                              <p className="text-xs text-muted-foreground mt-2">How much risk can you tolerate?</p>
                            </div>

                            {/* Research Topology */}
                            <div className="mb-0">
                              <Label className="font-medium text-foreground mb-3 block">Research Topology</Label>
                              <div className="flex gap-3">
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
                          </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Navigation Controls */}
                        <div className="flex justify-between items-center pt-6">
                          {currentFormPage === 1 ? (
                            <div></div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              onClick={handlePrevPage}
                              disabled={isTransitioning}
                            >
                              Back
                            </Button>
                          )}
                          
                          <Button 
                            type="submit" 
                            size="lg"
                            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8"
                            disabled={isTransitioning || (currentFormPage === 1 && !validatePage1())}
                          >
                            {currentFormPage === 1 ? 'Next' : 'Start Research Hunt'}
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

      {/* How Research Works Modal */}
      <Dialog open={howModalOpen} onOpenChange={setHowModalOpen}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>how truflr.ai research works</DialogTitle>
          </DialogHeader>
          <div className="px-6 pb-6 space-y-4">
            {/* Mermaid Diagram */}
            <div className="w-full overflow-x-auto">
              <MermaidDiagram 
                chart={`flowchart TD
    %% Top Level Categories
    A[🚀 INNOVATION RESEARCH]
    B[⛏️ CRYPTO MINING RESEARCH]
    C[🏥 MEDICAL DEVICE RESEARCH]
    D[💼 PRIVATE EQUITY RESEARCH]
    E[🏙️ CITY REVITALIZATION RESEARCH]
    
    %% Second Level Research Focus
    A1[Market Disruption Analysis<br/>Competitive Blind Spots<br/>Innovation Gap Identification]
    B1[Site Selection Intelligence<br/>Equipment Logistics Modeling<br/>Power Arbitrage Patterns]
    C1[Clinical Workflow Ethnography<br/>Alternative Data Mining<br/>Regulatory Pathway Innovation]
    D1[Off-Market Pipeline Development<br/>Behavioral Economics Analysis<br/>Seller Motivation Prediction]
    E1[Municipal Funding Optimization<br/>Coalition Partnership Analysis<br/>Multi-Stakeholder Ecosystem Mapping]
    
    %% Connections to parent categories
    A --> A1
    B --> B1
    C --> C1
    D --> D1
    E --> E1
    
    %% Core Methodologies (converging layer)
    F[Alternative Data Sources]
    G[Ethnographic Intelligence]
    H[Hidden Pattern Recognition]
    I[Strategic Timing Analysis]
    J[Network Relationship Mapping]
    K[Behavioral Economics Integration]
    
    %% Convergence point for all research areas
    CONV[METHODOLOGY CONVERGENCE]
    
    %% All research areas flow to convergence point
    A1 --> CONV
    B1 --> CONV
    C1 --> CONV
    D1 --> CONV
    E1 --> CONV
    
    %% Final output
    L[OPPORTUNITY ZONE INTELLIGENCE<br/>Novel Research Package]
    
    %% Convergence point connects to methodologies
    CONV --> F
    CONV --> G
    CONV --> H
    CONV --> I
    CONV --> J
    CONV --> K
    
    %% Methodologies converge to final output
    F --> L
    G --> L
    H --> L
    I --> L
    J --> L
    K --> L
    
    %% Styling - Let component handle colors based on theme
    classDef topLevel stroke-width:3px
    classDef research stroke-width:2px
    classDef convergence stroke-width:3px
    classDef methodology stroke-width:2px
    classDef output stroke-width:4px
    
    class A,B,C,D,E topLevel
    class A1,B1,C1,D1,E1 research
    class CONV convergence
    class F,G,H,I,J,K methodology
    class L output`}
                id="research-flow"
              />
            </div>
            
            {/* Key Value Propositions */}
            <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              <h3 className="text-lg font-semibold mb-3 dark:text-white">Research Intelligence Advantages:</h3>
              <ul className="space-y-3 text-gray-700 dark:text-gray-300">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600 dark:text-stone-400">Alternative Data:</span>
                  <span className="dark:text-white">Behavioral signals, digital footprints, and ethnographic intelligence</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600 dark:text-stone-400">Pattern Recognition:</span>
                  <span className="dark:text-white">Uncover hidden market dynamics and unconventional opportunities others miss</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600 dark:text-stone-400">Timing Intelligence:</span>
                  <span className="dark:text-white">Strategic convergence analysis revealing optimal opportunity windows</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600 dark:text-stone-400">Deep Context:</span>
                  <span className="dark:text-white">Comprehensive ecosystem mapping and stakeholder relationship intelligence</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-stone-600 dark:text-stone-400">Novel Insights:</span>
                  <span className="dark:text-white">Research approaches that reveal opportunity zones invisible to traditional analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Index;
