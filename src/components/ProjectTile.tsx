import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface ProjectTileProps {
  name: string;
  icon: LucideIcon;
  theme: "red" | "black" | "white";
  status: "inactive" | "active" | "completed" | "on-hold";
  priority: "high" | "medium" | "low";
}

const ProjectTile = ({ name, icon: Icon, theme, status, priority }: ProjectTileProps) => {
  const themeClasses = {
    red: "border-red-team/30 hover:border-red-team/50",
    black: "bg-black-team-bg-dark border-gray-600 hover:border-gray-500",
    white: "border-white-team-accent/40 hover:border-white-team-accent/70"
  };

  const iconClasses = {
    red: "bg-red-team/10 text-red-team",
    black: "bg-gray-800 text-gray-300",
    white: "bg-white-team-accent/20 text-white-team-dark"
  };

  const textClasses = {
    red: "text-foreground",
    black: "text-gray-200",
    white: "text-foreground"
  };

  const statusColors = {
    inactive: "bg-gray-500",
    active: "bg-green-500",
    completed: "bg-blue-500",
    "on-hold": "bg-orange-500"
  };

  const priorityColors = {
    high: "bg-red-500",
    medium: "bg-orange-500", 
    low: "bg-yellow-500"
  };

  const priorityLabels = {
    high: "High",
    medium: "Medium",
    low: "Low"
  };

  return (
    <Card className={`transition-all duration-300 hover:shadow-smooth-md ${themeClasses[theme]}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${iconClasses[theme]}`}>
              <Icon className="h-5 w-5" />
            </div>
            <CardTitle className={`text-lg ${textClasses[theme]} leading-tight`}>
              {name}
            </CardTitle>
          </div>
          <div className="flex flex-col gap-2">
            <Badge 
              variant="secondary" 
              className={`${priorityColors[priority]} text-white text-xs px-2 py-1`}
            >
              {priorityLabels[priority]}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusColors[status]}`}></div>
            <span className={`text-sm capitalize ${theme === 'black' ? 'text-gray-400' : 'text-muted-foreground'}`}>
              {status.replace('-', ' ')}
            </span>
          </div>
          <div className={`text-xs ${theme === 'black' ? 'text-gray-500' : 'text-muted-foreground'}`}>
            Last updated: --
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProjectTile;