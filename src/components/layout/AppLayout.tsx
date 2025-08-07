import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("wayfinder");

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Map routes to tab values
  useEffect(() => {
    if (location.pathname.startsWith("/milestones") || location.pathname.startsWith("/reef-builder")) {
      setActiveTab("reef-builder");
    } else if (location.pathname.startsWith("/build") || location.pathname.startsWith("/archipelago")) {
      setActiveTab("archipelago");
    } else if (location.pathname.startsWith("/shark-swarmer")) {
      setActiveTab("shark-swarmer");
    } else if (location.pathname.startsWith("/home") || location.pathname.startsWith("/red-team") || 
               location.pathname.startsWith("/black-team") || location.pathname.startsWith("/white-team") ||
               location.pathname.startsWith("/reports") || location.pathname.startsWith("/demo/reports")) {
      setActiveTab("wayfinder");
    } else {
      setActiveTab("wayfinder");
    }
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    switch (value) {
      case "wayfinder":
        navigate("/home");
        break;
      case "shark-swarmer":
        navigate("/shark-swarmer");
        break;
      case "reef-builder":
        navigate("/milestones");
        break;
      case "archipelago":
        navigate("/build");
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