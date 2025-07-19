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
import { CalendarIcon, Lightbulb } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WhiteResearchSwarmFormProps {
  children: React.ReactNode;
}

const WhiteResearchSwarmForm = ({ children }: WhiteResearchSwarmFormProps) => {
  const [open, setOpen] = useState(false);
  const [whitespaceType, setWhitespaceType] = useState<string[]>([]);
  const [otherWhitespace, setOtherWhitespace] = useState("");
  const [targetUser, setTargetUser] = useState<string[]>([]);
  const [otherTargetUser, setOtherTargetUser] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [teamSize, setTeamSize] = useState("");
  const [roles, setRoles] = useState<string[]>([]);
  const [timePerPerson, setTimePerPerson] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [successDefinition, setSuccessDefinition] = useState("");
  const [backgroundInfo, setBackgroundInfo] = useState("");

  const handleCheckboxChange = (value: string, currentValues: string[], setter: (values: string[]) => void) => {
    if (currentValues.includes(value)) {
      setter(currentValues.filter(v => v !== value));
    } else {
      setter([...currentValues, value]);
    }
  };

  const handleReset = () => {
    setWhitespaceType([]);
    setOtherWhitespace("");
    setTargetUser([]);
    setOtherTargetUser("");
    setDeliverables([]);
    setTeamSize("");
    setRoles([]);
    setTimePerPerson("");
    setDeadline(undefined);
    setSuccessDefinition("");
    setBackgroundInfo("");
  };

  const handleLaunchSwarm = () => {
    // Create research task object
    const researchTask = {
      id: Date.now().toString(),
      team: 'white',
      whitespaceType: [...whitespaceType, ...(otherWhitespace ? [`Other: ${otherWhitespace}`] : [])],
      targetUser: [...targetUser, ...(otherTargetUser ? [`Other: ${otherTargetUser}`] : [])],
      deliverables,
      teamSize,
      roles,
      timePerPerson,
      deadline: deadline?.toISOString(),
      successDefinition,
      backgroundInfo,
      createdAt: new Date().toISOString(),
      status: 'launched'
    };

    // Get existing tasks from localStorage
    const existingTasks = JSON.parse(localStorage.getItem('researchTasks') || '[]');
    
    // Add new task
    existingTasks.push(researchTask);
    
    // Save back to localStorage
    localStorage.setItem('researchTasks', JSON.stringify(existingTasks));
    
    console.log("White Team Research Swarm Launched:", researchTask);
    alert(`Research Swarm launched for whitespace opportunity discovery!`);
    
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
          {/* 1. What kind of whitespace? */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">1. What kind of whitespace?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                {[
                  "Pre-buy or pre-sell tools",
                  "Post-purchase services", 
                  "Side hustler or niche user needs",
                  "Workflow fixes (reminders, calculators, etc.)",
                  "Community tools (referrals, tips, etc.)"
                ].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`whitespace-${option}`}
                      checked={whitespaceType.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, whitespaceType, setWhitespaceType)}
                    />
                    <Label htmlFor={`whitespace-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="whitespace-other"
                    checked={otherWhitespace !== ""}
                    onCheckedChange={(checked) => {
                      if (!checked) setOtherWhitespace("");
                    }}
                  />
                  <Label htmlFor="whitespace-other" className="text-sm">Other:</Label>
                  <Input
                    value={otherWhitespace}
                    onChange={(e) => setOtherWhitespace(e.target.value)}
                    placeholder="Specify other whitespace type"
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. Who is it for? */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">2. Who is it for?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {["Buyers", "Sellers", "Parents or families", "Small dealers", "Car owners"].map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`target-${option}`}
                      checked={targetUser.includes(option)}
                      onCheckedChange={() => handleCheckboxChange(option, targetUser, setTargetUser)}
                    />
                    <Label htmlFor={`target-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="target-other"
                  checked={otherTargetUser !== ""}
                  onCheckedChange={(checked) => {
                    if (!checked) setOtherTargetUser("");
                  }}
                />
                <Label htmlFor="target-other" className="text-sm">Other:</Label>
                <Input
                  value={otherTargetUser}
                  onChange={(e) => setOtherTargetUser(e.target.value)}
                  placeholder="Specify other target user"
                  className="flex-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* 3. What do you want delivered? */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">3. What do you want delivered?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {["1-pager idea summary", "Basic mockup", "MVP feature set", "Market guess", "Opportunity score"].map((option) => (
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

          {/* 4. Swarm Setup */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">4. Swarm Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="team-size">Team size</Label>
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
                <Label>Roles needed</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {["Research", "Product", "Design", "Data"].map((role) => (
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
              <div>
                <Label htmlFor="time-per-person">Time per person</Label>
                <Select value={timePerPerson} onValueChange={setTimePerPerson}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time per person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2h">2h</SelectItem>
                    <SelectItem value="4h">4h</SelectItem>
                    <SelectItem value="8h">8h</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </CardContent>
          </Card>

          {/* 5. How do we define success? */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">5. How do we define success?</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={successDefinition}
                onChange={(e) => setSuccessDefinition(e.target.value)}
                placeholder='e.g. "An idea we could test in a weekend that builds a new relationship with future sellers."'
                rows={3}
              />
            </CardContent>
          </Card>

          {/* 6. Any background to share? */}
          <Card className="border-white-team-accent/30">
            <CardHeader>
              <CardTitle className="text-lg text-white-team-dark">6. Any background to share?</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={backgroundInfo}
                onChange={(e) => setBackgroundInfo(e.target.value)}
                placeholder="Upload notes or paste links"
                rows={4}
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

export default WhiteResearchSwarmForm;