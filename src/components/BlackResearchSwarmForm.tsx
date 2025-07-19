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
import { CalendarIcon, Bug } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BlackResearchSwarmFormProps {
  children: React.ReactNode;
}

const BlackResearchSwarmForm = ({ children }: BlackResearchSwarmFormProps) => {
  const [open, setOpen] = useState(false);
  const [vendorName, setVendorName] = useState("");
  const [researchWhy, setResearchWhy] = useState<string[]>([]);
  const [focusArea, setFocusArea] = useState<string[]>([]);
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [timePerPerson, setTimePerPerson] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [successSignal, setSuccessSignal] = useState("");
  const [referenceMaterial, setReferenceMaterial] = useState("");

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
    setTimePerPerson("");
    setDeadline(undefined);
    setSuccessSignal("");
    setReferenceMaterial("");
  };

  const handleLaunchSwarm = () => {
    // Create research task object
    const researchTask = {
      id: Date.now().toString(),
      team: 'black',
      vendorName,
      researchWhy,
      focusArea,
      deliverables,
      teamSize,
      roles,
      timePerPerson,
      deadline: deadline?.toISOString(),
      successSignal,
      referenceMaterial,
      createdAt: new Date().toISOString(),
      status: 'launched'
    };

    // Get existing tasks from localStorage
    const existingTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
    
    // Add new task
    existingTasks.push(researchTask);
    
    // Save back to localStorage
    localStorage.setItem('researchTasks', JSON.stringify(existingTasks));
    
    // Dispatch custom event to update tables
    window.dispatchEvent(new CustomEvent('taskAdded'));
    
    console.log("Black Team Research Swarm Launched:", researchTask);
    alert(`Research Swarm launched for ${vendorName || 'Unknown Tool'}!`);
    
    handleReset();
    setOpen(false);
  };

  const handleSaveDraft = () => {
    console.log("Saving draft...");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black-team-bg border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Bug className="h-5 w-5" />
            ⚫ Launch Research Swarm
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Explore replacing a third-party tool with internal software.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 1. What tool are we replacing? */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">1. What tool are we replacing?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vendor-name" className="text-white">Vendor or Product Name</Label>
                <Input
                  id="vendor-name"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Enter vendor or product name"
                  className="bg-black-team border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <Label className="text-white">Why?</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {["Too expensive", "Too rigid", "Poor integration", "We can build it better"].map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`why-${option}`}
                        checked={researchWhy.includes(option)}
                        onCheckedChange={() => handleCheckboxChange(option, researchWhy, setResearchWhy)}
                        className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                      />
                      <Label htmlFor={`why-${option}`} className="text-sm text-white">{option}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Focus Area */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">2. Focus Area</CardTitle>
              <CardDescription className="text-white/70">What part of the tool should the swarm dig into?</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {["Core features", "Pricing / cost", "API / integrations", "User experience", "Open-source alternatives"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`focus-${option}`}
                      checked={focusArea.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, focusArea, setFocusArea)}
                      className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <Label htmlFor={`focus-${option}`} className="text-sm text-white">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 3. What do you want back? */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">3. What do you want back?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {["Feature comparison", "MVP spec", "UX teardown", "Build feasibility", "Cost savings estimate"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`deliverable-${option}`}
                      checked={deliverables.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, deliverables, setDeliverables)}
                      className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                    />
                    <Label htmlFor={`deliverable-${option}`} className="text-sm text-white">{option}</Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 4. Swarm Settings */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">4. Swarm Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="team-size" className="text-white">Team size</Label>
                <Select value={teamSize} onValueChange={setTeamSize}>
                  <SelectTrigger className="bg-black-team border-white/20 text-white">
                    <SelectValue placeholder="Select team size (1-10)" />
                  </SelectTrigger>
                  <SelectContent className="bg-black-team-light border-white/20">
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <SelectItem key={num} value={num.toString()} className="text-white hover:bg-white/10">{num}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Needed roles</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {["Research", "Engineering", "Design", "Product"].map((role) => (
                    <div key={role} className="flex items-center space-x-2">
                      <Checkbox
                        id={`role-${role}`}
                        checked={roles.includes(role)}
                        onCheckedChange={() => handleCheckboxChange(role, roles, setRoles)}
                        className="border-white/20 data-[state=checked]:bg-white data-[state=checked]:text-black"
                      />
                      <Label htmlFor={`role-${role}`} className="text-sm text-white">{role}</Label>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="time-per-person" className="text-white">Time per person</Label>
                <Select value={timePerPerson} onValueChange={setTimePerPerson}>
                  <SelectTrigger className="bg-black-team border-white/20 text-white">
                    <SelectValue placeholder="Select time per person" />
                  </SelectTrigger>
                  <SelectContent className="bg-black-team-light border-white/20">
                    <SelectItem value="2h" className="text-white hover:bg-white/10">2h</SelectItem>
                    <SelectItem value="4h" className="text-white hover:bg-white/10">4h</SelectItem>
                    <SelectItem value="8h" className="text-white hover:bg-white/10">8h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Deadline</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-black-team border-white/20 text-white hover:bg-white/10",
                        !deadline && "text-white/50"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-black-team-light border-white/20" align="start">
                    <Calendar
                      mode="single"
                      selected={deadline}
                      onSelect={setDeadline}
                      initialFocus
                      className="p-3 pointer-events-auto text-white"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </CardContent>
          </Card>

          {/* 5. Success Signal */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">5. What's the success signal?</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={successSignal}
                onChange={(e) => setSuccessSignal(e.target.value)}
                placeholder='e.g. "A lean plan to replace Zendesk with a cheaper internal tool."'
                rows={3}
                className="bg-black-team border-white/20 text-white placeholder:text-white/50"
              />
            </CardContent>
          </Card>

          {/* 6. Reference Material */}
          <Card className="bg-black-team-light border-white/20">
            <CardHeader>
              <CardTitle className="text-lg text-white">6. Reference Material (optional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={referenceMaterial}
                onChange={(e) => setReferenceMaterial(e.target.value)}
                placeholder="Upload docs or notes, link to current tool"
                rows={4}
                className="bg-black-team border-white/20 text-white placeholder:text-white/50"
              />
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={handleLaunchSwarm}
              className="flex-1 bg-white text-black hover:bg-white/90"
            >
              🔘 Launch Swarm
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSaveDraft}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              💾 Save Draft
            </Button>
            <Button 
              variant="outline" 
              onClick={handleReset}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              ♻️ Reset
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BlackResearchSwarmForm;