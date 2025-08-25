/**
 * @fileoverview Main application layout component for the Color Code Research Hub.
 * 
 * Provides the primary navigation structure and visual design for all authenticated pages.
 * Features a tab-based navigation system with four main sections:
 * 
 * 🌌 Wayfinder - Research coordination and team management
 * 🦈 Shark Swarmer - AI swarm coordination and monitoring  
 * 🪸 Reef Builder - Project planning and milestone management
 * 🌋 Archipelago - Build and deployment management (disabled)
 * 
 * The layout includes:
 * - ASCII art header with Ocean Studio branding
 * - Responsive tab navigation with active state management
 * - Automatic route-to-tab synchronization
 * - Logout functionality with session cleanup
 * - Consistent theming and backdrop effects
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Props interface for the AppLayout component.
 * 
 * @interface AppLayoutProps
 * @property {React.ReactNode} children - Page content to render within the layout
 */
interface AppLayoutProps {
  children: React.ReactNode;
}

/**
 * Main application layout component providing navigation and page structure.
 * 
 * Manages the tab-based navigation system and synchronizes active tab state
 * with the current route. Handles user logout and provides consistent
 * layout structure across all authenticated pages.
 * 
 * @param {AppLayoutProps} props - Component props
 * @param {React.ReactNode} props.children - Page content to render
 * @returns {JSX.Element} Complete application layout with navigation
 */
const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  
  // Track which tab is currently active based on the route
  const [activeTab, setActiveTab] = useState("wayfinder");

  /**
   * Handle user logout process.
   * Clears authentication state and navigates to landing page.
   */
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  /**
   * Synchronize active tab with current route.
   * Maps URL paths to corresponding tab values to keep navigation in sync
   * with browser history and direct URL access.
   */
  useEffect(() => {
    // Reef Builder tab - Project planning and milestones
    if (location.pathname.startsWith("/milestones") || location.pathname.startsWith("/reef-builder")) {
      setActiveTab("reef-builder");
    } 
    // Archipelago tab - Build and deployment (currently disabled)
    else if (location.pathname.startsWith("/build") || location.pathname.startsWith("/archipelago")) {
      setActiveTab("archipelago");
    } 
    // Shark Swarmer tab - AI coordination
    else if (location.pathname.startsWith("/shark-swarmer")) {
      setActiveTab("shark-swarmer");
    } 
    // Wayfinder tab - Research teams, reports, and main dashboard
    else if (location.pathname.startsWith("/home") || location.pathname.startsWith("/red-team") || 
               location.pathname.startsWith("/black-team") || location.pathname.startsWith("/white-team") ||
               location.pathname.startsWith("/reports") || location.pathname.startsWith("/demo/reports")) {
      setActiveTab("wayfinder");
    } 
    // Default to wayfinder for unmatched routes
    else {
      setActiveTab("wayfinder");
    }
  }, [location.pathname]);

  /**
   * Handle tab navigation when user clicks on a tab.
   * Updates active tab state and navigates to the appropriate route.
   * 
   * @param {string} value - The tab value that was selected
   */
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    switch (value) {
      case "wayfinder":
        navigate("/home"); // Main dashboard and research teams
        break;
      case "shark-swarmer":
        navigate("/shark-swarmer"); // AI swarm coordination
        break;
      case "reef-builder":
        navigate("/milestones"); // Project planning and milestones
        break;
      case "archipelago":
        navigate("/build"); // Build and deployment (disabled)
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Clean, sophisticated header with typography focus */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm relative">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Logout Button - Positioned top-right */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-6 text-muted-foreground hover:text-accent transition-gentle"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
          
          {/* Clean, typography-focused branding */}
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-2 tracking-tight">
              Ocean Studio
            </h1>
            <p className="text-muted-foreground font-light text-lg tracking-wide">
              AI-Powered Go-To-Market Engine
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Clean, minimalist tab navigation */}
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 mb-12 rounded-lg">
            <TabsTrigger 
              value="wayfinder" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-card text-muted-foreground transition-gentle font-medium"
            >
              <span className="text-base mr-2">🌌</span>
              Wayfinder
            </TabsTrigger>
            <TabsTrigger 
              value="shark-swarmer" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-card text-muted-foreground transition-gentle font-medium"
            >
              <span className="text-base mr-2">🦈</span>
              Shark Swarmer
            </TabsTrigger>
            <TabsTrigger 
              value="reef-builder" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-card text-muted-foreground transition-gentle font-medium"
            >
              <span className="text-base mr-2">🪸</span>
              Reef Builder
            </TabsTrigger>
            <TabsTrigger 
              value="archipelago" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-card text-muted-foreground transition-gentle font-medium opacity-50 cursor-not-allowed" 
              disabled
            >
              <span className="text-base mr-2">🌋</span>
              Archipelago
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {children}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AppLayout;