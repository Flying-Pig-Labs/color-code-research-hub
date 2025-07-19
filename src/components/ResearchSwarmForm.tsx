import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Target } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ResearchSwarmFormProps {
  children: React.ReactNode;
}

const ResearchSwarmForm = ({ children }: ResearchSwarmFormProps) => {
  const [open, setOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [researchWhy, setResearchWhy] = useState<string[]>([]);
  const [focusArea, setFocusArea] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date>();
  const [maxHours, setMaxHours] = useState("");
  const [allowTesting, setAllowTesting] = useState(false);
  const [successCriteria, setSuccessCriteria] = useState("");
  const [referenceMaterials, setReferenceMaterials] = useState("");

  const handleCheckboxChange = (value: string, currentValues: string[], setter: (values: string[]) => void) => {
    if (currentValues.includes(value)) {
      setter(currentValues.filter(v => v !== value));
    } else {
      setter([...currentValues, value]);
    }
  };

  const handleReset = () => {
    setVendorName("");
    setResearchWhy([]);
    setFocusArea([]);
    setDeliverables([]);
    setTeamSize("");
    setRoles([]);
    setDeadline(undefined);
    setMaxHours("");
    setAllowTesting(false);
    setSuccessCriteria("");
    setReferenceMaterials("");
  };

  const handleLaunchSwarm = () => {
    // Handle form submission
    console.log("Launching Research Swarm...");
    setOpen(false);
  };

  const handleSaveDraft = () => {
    // Handle saving draft
    console.log("Saving draft...");
  };

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

        <div className="space-y-6">
          {/* 1. What are we researching? */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">1. What are we researching?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vendor-name">Vendor Name</Label>
                <Input
                  id="vendor-name"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Enter vendor name"
                />
              </div>
              <div>
                <Label>Why?</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {["Replace with internal tool", "Learn how it works", "Identify weak spots", "Find cheaper alternatives"].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`why-${option}`}
                        checked={researchWhy.includes(option)}
                        onCheckedChange={() => handleCheckboxChange(option, researchWhy, setResearchWhy)}
                      />
                      <Label htmlFor={`why-${option}`} className="text-sm">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Focus Area */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">2. Focus Area</CardTitle>
              <CardDescription>Choose the part of the product to investigate:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {["APIs / Integrations", "Pricing / Licensing", "Core Features", "UX / Onboarding", "Business Model"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`focus-${option}`}
                      checked={focusArea.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, focusArea, setFocusArea)}
                    />
                    <Label htmlFor={`focus-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3. Deliverables */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">3. Deliverables</CardTitle>
              <CardDescription>What should the swarm come back with?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {["Feature comparison table", "Code scaffold or prototype", "UX teardown slides", "Notes + SWOT summary", "Recommendation memo"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`deliverable-${option}`}
                      checked={deliverables.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, deliverables, setDeliverables)}
                    />
                    <Label htmlFor={`deliverable-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 4. Team Setup */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">4. Team Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="team-size">Team Size</Label>
                <Select value={teamSize} onValueChange={setTeamSize}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select team size (1-10)" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Needed Roles</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {["Research", "Engineering", "Design", "Data"].map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={roles.includes(role)}
                        onCheckedChange={() => handleCheckboxChange(role, roles, setRoles)}
                      />
                      <Label htmlFor={`role-${role}`} className="text-sm">{role}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 5. Constraints */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">5. Constraints</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !deadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="max-hours">Max hours per person</Label>
                <Select value={maxHours} onValueChange={setMaxHours}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select max hours" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2h">2h</SelectItem>
                    <SelectItem value="4h">4h</SelectItem>
                    <SelectItem value="8h">8h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allow-testing"
                  checked={allowTesting}
                  onCheckedChange={(checked) => setAllowTesting(checked === true)}
                />
                <Label htmlFor="allow-testing">Allow testing/prototyping?</Label>
              </div>
            </CardContent>
          </Card>

          {/* 6. Success Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">6. Success Criteria</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={successCriteria}
                onChange={(e) => setSuccessCriteria(e.target.value)}
                placeholder="What would make this swarm a win? (1–2 sentences)"
                rows={3}
              />
            </CardContent>
          </Card>

          {/* 7. Reference Materials */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">7. Reference Materials (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={referenceMaterials}
                onChange={(e) => setReferenceMaterials(e.target.value)}
                placeholder="Free text to add contextual docs or notes from past efforts"
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleLaunchSwarm}
              className="flex-1 bg-red-team hover:bg-red-team/90 text-white"
            >
              🔘 Launch Swarm
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              className="flex-1"
            >
              💾 Save Draft
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