import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Activity } from "lucide-react";

interface ResearchSubTabsProps {
  teamsContent: React.ReactNode;
  runsContent: React.ReactNode;
}

const ResearchSubTabs = ({ teamsContent, runsContent }: ResearchSubTabsProps) => {
  return (
    <Tabs defaultValue="teams" className="w-full">
      <div className="flex items-center justify-between mb-4 px-4">
        <TabsList className="grid w-auto grid-cols-2 bg-gray-900/80 backdrop-blur-sm border border-gray-800/50">
          <TabsTrigger 
            value="teams" 
            className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 flex items-center gap-2"
          >
            <Users className="h-4 w-4" />
            Teams
          </TabsTrigger>
          <TabsTrigger 
            value="runs" 
            className="data-[state=active]:bg-blue-600/20 data-[state=active]:text-blue-300 flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Runs
          </TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="teams" className="mt-0">
        {teamsContent}
      </TabsContent>

      <TabsContent value="runs" className="mt-0">
        {runsContent}
      </TabsContent>
    </Tabs>
  );
};

export default ResearchSubTabs;