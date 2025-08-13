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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto p-4">
        <header className="mb-8 bg-gray-950/50 backdrop-blur-sm rounded-lg border border-gray-800/50 p-6 overflow-x-auto relative">
          {/* Logout Button - Positioned top-right */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="sm"
            className="absolute top-4 right-4 text-gray-400 hover:text-blue-400 hover:bg-gray-800/30"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
          
          <pre className="text-blue-400 text-[0.2rem] sm:text-[0.25rem] md:text-[0.3rem] lg:text-[0.375rem] xl:text-[0.5rem] font-mono text-center mx-auto whitespace-pre">
{` ██████╗  ██████╗███████╗ █████╗ ███╗   ██╗    ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗ 
██╔═══██╗██╔════╝██╔════╝██╔══██╗████╗  ██║    ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗
██║   ██║██║     █████╗  ███████║██╔██╗ ██║    ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║
██║   ██║██║     ██╔══╝  ██╔══██║██║╚██╗██║    ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║
╚██████╔╝╚██████╗███████╗██║  ██║██║ ╚████║    ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝
 ╚═════╝  ╚═════╝╚══════╝╚═╝  ╚═╝╚═╝  ╚═══╝    ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝`}
          </pre>
          <p className="text-gray-400 text-center mt-4">
            AI-Powered Go-To-Market Engine
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="flex justify-center gap-2 mb-8 bg-gray-900/80 backdrop-blur-sm border border-gray-800/50 overflow-hidden p-2">
            <TabsTrigger value="wayfinder" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-sm md:text-base px-6">
              🌌 Wayfinder
            </TabsTrigger>
            <TabsTrigger value="shark-swarmer" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-sm md:text-base px-6">
              🦈 Shark Swarmer
            </TabsTrigger>
            <TabsTrigger value="reef-builder" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-sm md:text-base px-6">
              🪸 Reef Builder
            </TabsTrigger>
            <TabsTrigger value="archipelago" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-sm md:text-base px-6" disabled>
              🌋 Archipelago
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