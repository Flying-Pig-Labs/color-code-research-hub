/**
 * @fileoverview Main application layout component for truflr.ai.
 * 
 * Provides the primary navigation structure and visual design for all authenticated pages.
 * Features a tab-based navigation system with four main sections:
 * 
 * 🔍 Research - Streamlined competitive intelligence and market research
 * 💡 Ideate - AI-powered idea evaluation and refinement
 * 📋 Plan - Project planning and milestone management
 * 🔨 Build - Build and deployment management
 * 
 * The layout includes:
 * - Clean typography-focused truflr.ai branding
 * - Responsive tab navigation with active state management
 * - Automatic route-to-tab synchronization
 * - Logout functionality with session cleanup
 * - Swiss design principles with sophisticated styling
 * 
 * @author truflr.ai Team
 * @version 2.0.0
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogOut, Search, Lightbulb, ClipboardList, Hammer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const { actualTheme } = useTheme();
  
  // Track which tab is currently active based on the route
  const [activeTab, setActiveTab] = useState("research");

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
    // Plan tab - Project planning and milestones
    if (location.pathname.startsWith("/milestones") || location.pathname.startsWith("/plan")) {
      setActiveTab("plan");
    } 
    // Build tab - Build and deployment
    else if (location.pathname.startsWith("/build")) {
      setActiveTab("build");
    } 
    // Ideate tab - AI idea evaluation (formerly Shark Swarmer)
    else if (location.pathname.startsWith("/shark-swarmer") || location.pathname.startsWith("/ideate")) {
      setActiveTab("ideate");
    } 
    // Research tab - Combined research interface, reports, and main dashboard
    else if (location.pathname.startsWith("/home") || location.pathname.startsWith("/research") || 
               location.pathname.startsWith("/reports") || location.pathname.startsWith("/demo/reports")) {
      setActiveTab("research");
    } 
    // Default to research for unmatched routes
    else {
      setActiveTab("research");
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
      case "research":
        navigate("/home"); // Main research dashboard
        break;
      case "ideate":
        navigate("/shark-swarmer"); // AI idea evaluation
        break;
      case "plan":
        navigate("/milestones"); // Project planning and milestones
        break;
      case "build":
        navigate("/build"); // Build and deployment
        break;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Clean, sophisticated header with typography focus */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm relative">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Top controls - Theme toggle and Logout */}
          <div className="absolute top-4 right-6 flex items-center gap-2">
            <ThemeToggle />
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-accent transition-gentle"
            >
              <LogOut className="h-4 w-4 mr-2" />
              logout
            </Button>
          </div>
          
          {/* Clean, typography-focused truflr.ai branding with logo */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                truflr.ai
              </h1>
              <img 
                src={actualTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png'} 
                alt="truflr.ai Logo" 
                className="w-12 h-12 md:w-16 md:h-16"
                onError={(e) => {
                  console.error('Logo failed to load:', e.currentTarget.src);
                  console.log('Current theme:', actualTheme);
                }}
                onLoad={() => {
                  console.log('Logo loaded successfully:', actualTheme === 'dark' ? '/logo-dark.png' : '/logo-light.png');
                }}
              />
            </div>
            <p className="text-muted-foreground font-light text-lg tracking-wide mt-2">
              root up go-to-market gold
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Clean, minimalist tab navigation - truflr.ai product development flow */}
          <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 mb-12 rounded-lg">
            <TabsTrigger 
              value="research" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-card text-muted-foreground transition-gentle font-medium"
            >
              <Search className="h-4 w-4 mr-2" />
              research
            </TabsTrigger>
            <TabsTrigger 
              value="ideate" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-card text-muted-foreground transition-gentle font-medium"
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              ideate
            </TabsTrigger>
            <TabsTrigger 
              value="plan" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-card text-muted-foreground transition-gentle font-medium"
            >
              <ClipboardList className="h-4 w-4 mr-2" />
              plan
            </TabsTrigger>
            <TabsTrigger 
              value="build" 
              className="data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-card text-muted-foreground transition-gentle font-medium"
            >
              <Hammer className="h-4 w-4 mr-2" />
              build
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