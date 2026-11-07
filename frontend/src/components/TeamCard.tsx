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

  // Sophisticated, subtle theme styling - Swiss design principles
  const themeClasses = {
    red: "border-border hover:border-red-team/30 hover:bg-red-team-light/5",
    black: "border-border hover:border-black-team/30 hover:bg-black-team-light/5", 
    white: "border-border hover:border-white-team/30 hover:bg-white-team-light/5"
  };

  const iconTheme = {
    red: { bg: "bg-red-team/10", color: "text-red-team" },
    black: { bg: "bg-black-team/10", color: "text-black-team" },
    white: { bg: "bg-white-team/10", color: "text-white-team" }
  };

  return (
    <Card 
      className={`group cursor-pointer transition-gentle hover:shadow-elevated bg-card ${themeClasses[theme]}`}
      onClick={() => navigate(path)}
    >
      <CardContent className="p-8">
        {/* Clean header with generous spacing */}
        <div className="flex items-start gap-4 mb-6">
          <div className={`p-3 rounded-lg ${iconTheme[theme].bg} flex-shrink-0 transition-gentle group-hover:scale-105`}>
            <Icon className={`h-6 w-6 ${iconTheme[theme].color}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-2xl font-heading font-semibold text-foreground mb-2 group-hover:text-accent transition-gentle">
              {title}
            </h3>
            <p className="text-muted-foreground font-medium text-sm uppercase tracking-wider">
              {description}
            </p>
          </div>
        </div>

        {/* Clean, readable content with Swiss typography */}
        <p className="text-foreground/80 mb-8 leading-relaxed text-base">
          {focus}
        </p>
        
        {/* Subtle call-to-action that's integrated into the design */}
        <div className="flex items-center text-muted-foreground group-hover:text-accent transition-gentle">
          <span className="font-medium">Explore {title}</span>
          <Icon className="h-4 w-4 ml-2 transform group-hover:translate-x-1 transition-gentle" />
        </div>
      </CardContent>
    </Card>
  );
};

export default TeamCard;