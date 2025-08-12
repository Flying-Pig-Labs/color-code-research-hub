import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TeamCardProps {
  title: string;
  description: string;
  focus: string;
  path: string;
  icon: LucideIcon;
  variant: "red-team" | "black-team" | "white-team";
  theme: "red" | "black" | "white";
}

const TeamCard = ({ title, description, focus, path, icon: Icon, variant, theme }: TeamCardProps) => {
  const navigate = useNavigate();

  const themeClasses = {
    red: "border-red-team/20 hover:border-red-team/40 hover:bg-red-team-light/20",
    black: "border-black-team/20 hover:border-black-team/40 hover:bg-black-team-light/20", 
    white: "border-white-team-accent/30 hover:border-white-team-accent/60 hover:bg-white-team/40"
  };

  return (
    <Card className={`group cursor-pointer transition-all duration-300 hover:shadow-smooth-lg transform hover:scale-[1.02] ${themeClasses[theme]}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className={`p-2 rounded-lg ${
            theme === "red" ? "bg-red-team/10" :
            theme === "black" ? "bg-black-team/10" :
            "bg-white-team-accent/20"
          }`}>
            <Icon className={`h-6 w-6 ${
              theme === "red" ? "text-red-team" :
              theme === "black" ? "text-black-team" :
              "text-white-team-dark"
            }`} />
          </div>
          <CardTitle className="text-xl group-hover:text-primary transition-colors">
            {title}
          </CardTitle>
        </div>
        <CardDescription className="text-sm text-muted-foreground">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className="text-sm text-foreground/80 mb-6 leading-relaxed">
          {focus}
        </p>
        
        <Button 
          variant={variant}
          className="w-full"
          onClick={() => navigate(path)}
        >
          <Icon className="h-4 w-4 mr-2" />
          Explore {title}
        </Button>
      </CardContent>
    </Card>
  );
};

export default TeamCard;