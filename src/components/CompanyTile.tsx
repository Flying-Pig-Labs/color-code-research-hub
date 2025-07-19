import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface CompanyTileProps {
  name: string;
  description?: string;
  icon: LucideIcon;
  theme: "red" | "black" | "white";
}

const CompanyTile = ({ name, description, icon: Icon, theme }: CompanyTileProps) => {
  const themeClasses = {
    red: "border-red-team/30 hover:border-red-team/50 hover:bg-red-team-light/10 hover:shadow-smooth-md",
    black: "bg-black-team-bg-dark border-gray-600 hover:border-gray-500 hover:bg-gray-800/50 hover:shadow-smooth-md",
    white: "border-white-team-accent/40 hover:border-white-team-accent/70 hover:bg-white-team/30 hover:shadow-smooth-md"
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

  const descriptionClasses = {
    red: "text-muted-foreground",
    black: "text-gray-400",
    white: "text-muted-foreground"
  };

  return (
    <Card className={`group cursor-pointer transition-all duration-300 transform hover:scale-[1.02] ${themeClasses[theme]}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${iconClasses[theme]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <CardTitle className={`text-lg ${textClasses[theme]} group-hover:text-primary transition-colors`}>
            {name}
          </CardTitle>
        </div>
      </CardHeader>
      {description && (
        <CardContent className="pt-0">
          <p className={`text-sm leading-relaxed ${descriptionClasses[theme]}`}>
            {description}
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default CompanyTile;