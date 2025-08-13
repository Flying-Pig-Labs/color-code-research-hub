/**
 * @fileoverview Reusable team selection card component with theme-based styling.
 * 
 * Interactive card component for displaying research team capabilities and
 * navigation. Features hover animations, theme-based color schemes, and
 * consistent design patterns across all team types.
 * 
 * Team Types:
 * - Red Team: Market disruption and competitive analysis
 * - Black Team: Technical research and vulnerability assessment
 * - White Team: Go-to-market strategy and user adoption
 * 
 * Features:
 * - Theme-aware styling with distinct color schemes
 * - Smooth hover animations and transitions
 * - Icon integration with consistent spacing
 * - Responsive design for mobile and desktop
 * - Accessible navigation patterns
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Props interface for the TeamCard component.
 * Defines the structure and theming options for team cards.
 */
interface TeamCardProps {
  /** Team name displayed as card title */
  title: string;
  /** Detailed team description and capabilities */
  description: string;
  /** Primary focus area or expertise */
  focus: string;
  /** Navigation path when card is clicked */
  path: string;
  /** Lucide icon component for visual identification */
  icon: LucideIcon;
  /** CSS variant for styling (legacy, use theme instead) */
  variant: "red-team" | "black-team" | "white-team";
  /** Theme color scheme for consistent styling */
  theme: "red" | "black" | "white";
}

/**
 * Team selection card component with theme-based styling and navigation.
 * 
 * Displays team information in an interactive card format with hover effects,
 * theme-appropriate colors, and smooth navigation transitions. Used primarily
 * on the main dashboard for team selection.
 * 
 * @param {TeamCardProps} props - Component configuration and content
 * @returns {JSX.Element} Styled, interactive team selection card
 */
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