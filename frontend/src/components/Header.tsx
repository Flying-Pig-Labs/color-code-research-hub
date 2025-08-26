/**
 * @fileoverview Reusable header component for page navigation and branding.
 * 
 * Flexible header component that provides consistent branding, navigation,
 * and system status across different sections of the application. Supports
 * customizable titles, navigation items, and health monitoring.
 * 
 * Features:
 * - Customizable title and subtitle text
 * - Icon support with emoji or components
 * - Flexible navigation items with theming
 * - Optional health check integration
 * - Responsive design for mobile and desktop
 * - Active route highlighting
 * 
 * Used across:
 * - Team-specific pages (Red/Black/White)
 * - Dashboard and main navigation
 * - Specialized tool interfaces
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Shield, Target, Bug, Lightbulb, FileText, LucideIcon } from "lucide-react";
import { HealthCheck } from "@/components/HealthCheck";

/**
 * Interface for navigation item configuration.
 * Defines structure for header navigation buttons.
 */
interface NavItem {
  /** Navigation path or hash */
  path: string;
  /** Display label for the navigation item */
  label: string;
  /** Lucide icon for visual identification */
  icon: LucideIcon;
  /** Optional styling variant for theming */
  variant?: "red-team" | "black-team" | "white-team" | "ghost";
  /** Optional click handler for custom actions */
  onClick?: () => void;
}

/**
 * Props interface for the Header component.
 * Provides customization options for different page contexts.
 */
interface HeaderProps {
  /** Main header title (defaults to "Wayfinder") */
  title?: string;
  /** Subtitle or description text */
  subtitle?: string;
  /** Icon emoji or identifier */
  icon?: string;
  /** Array of navigation items */
  navItems?: NavItem[];
  /** Whether to display health check component */
  showHealthCheck?: boolean;
}

/**
 * Reusable header component for consistent page navigation and branding.
 * 
 * Provides flexible header structure with customizable content, navigation,
 * and system status monitoring. Automatically highlights active routes and
 * maintains responsive design across device sizes.
 * 
 * @param {HeaderProps} props - Header configuration and content options
 * @returns {JSX.Element} Complete header with navigation and status elements
 */
const Header = ({ 
  title = "Wayfinder",
  subtitle = "Cross-Discipline Intelligence",
  icon = "🌌",
  navItems,
  showHealthCheck = true
}: HeaderProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const defaultNavItems = [
    { path: "/red-team", label: "Red Team", icon: Target, variant: "red-team" as const },
    { path: "/black-team", label: "Black Team", icon: Bug, variant: "black-team" as const },
    { path: "/white-team", label: "White Team", icon: Lightbulb, variant: "white-team" as const },
  ];
  
  const items = navItems || defaultNavItems;

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center gap-3 cursor-pointer transition-transform hover:scale-105"
            onClick={() => navigate("/")}
          >
            <span className="text-2xl mr-2">{icon}</span>
            <div className="flex flex-col items-start">
              <span className="text-xl font-bold text-foreground">{title}</span>
              <span className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">{subtitle}</span>
            </div>
          </div>
          
          <nav className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-2">
              {items.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                
                return (
                  <Button
                    key={item.path}
                    variant={isActive ? item.variant : "ghost"}
                    size="sm"
                    onClick={() => {
                      if (item.onClick) {
                        item.onClick();
                      } else {
                        navigate(item.path);
                      }
                    }}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                );
              })}
            </div>
            {/* Only show Reports button on main Wayfinder header */}
            {title === "Wayfinder" && (
              <>
                <div className="h-6 w-px bg-border" />
                <Button
                  variant={location.pathname === "/home" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => navigate("/home")}
                  className="gap-2"
                >
                  <FileText className="h-4 w-4" />
                  Reports
                </Button>
              </>
            )}
            {showHealthCheck && (
              <div className="pl-4 border-l border-border">
                <HealthCheck />
              </div>
            )}
          </nav>

          {/* Mobile menu button - simplified for now */}
          <div className="md:hidden">
            <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
              <Shield className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;