import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface OpportunityTileProps {
  title: string;
  description?: string;
  icon: LucideIcon;
}

const OpportunityTile = ({ title, description, icon: Icon }: OpportunityTileProps) => {
  return (
    <Card className="group cursor-pointer transition-all duration-300 transform hover:scale-[1.02] border-white-team-accent/40 hover:border-white-team-accent/70 hover:bg-white-team/30 hover:shadow-smooth-md">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white-team-accent/20">
            <Icon className="h-5 w-5 text-white-team-dark" />
          </div>
          <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors leading-tight">
            {title}
          </CardTitle>
        </div>
      </CardHeader>
      {description && (
        <CardContent className="pt-0">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </CardContent>
      )}
    </Card>
  );
};

export default OpportunityTile;