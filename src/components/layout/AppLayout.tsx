import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("research");

  // Map routes to tab values
  useEffect(() => {
    if (location.pathname.startsWith("/milestones")) {
      setActiveTab("milestones");
    } else if (location.pathname.startsWith("/build")) {
      setActiveTab("build");
    } else {
      setActiveTab("research");
    }
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    switch (value) {
      case "research":
        navigate("/");
        break;
      case "milestones":
        navigate("/milestones");
        break;
      case "build":
        navigate("/build");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <div className="container mx-auto p-4">
        <header className="mb-8 bg-gray-950/50 backdrop-blur-sm rounded-lg border border-gray-800/50 p-6">
          <h1 className="text-4xl font-bold text-white text-center mb-2">
            Color Code Hub
          </h1>
          <p className="text-gray-400 text-center">
            AI-Powered Development Workflow
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-900/80 backdrop-blur-sm border border-gray-800/50 overflow-hidden">
            <TabsTrigger value="research" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-sm md:text-base">
              RESEARCH
            </TabsTrigger>
            <TabsTrigger value="milestones" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-sm md:text-base">
              MILESTONES
            </TabsTrigger>
            <TabsTrigger value="build" className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 text-sm md:text-base" disabled>
              BUILD
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