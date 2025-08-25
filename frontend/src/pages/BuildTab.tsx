import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Hammer, Clock, Sparkles, Mountain } from "lucide-react";
import SectionWrapper from "@/components/SectionWrapper";

const BuildTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
              <Hammer className="w-10 h-10 text-foreground" />
            </div>
            <h3 className="text-xl font-semibold">Build</h3>
            <p className="text-center text-muted-foreground max-w-md">
              The BUILD phase will enable AI agents to automatically execute projects, 
              implementing features, writing code, and creating pull requests.
            </p>
            <Badge variant="outline" className="mt-4">
              <Sparkles className="w-3 h-3 mr-1" />
              In Development
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuildTab;