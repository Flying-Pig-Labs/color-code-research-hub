import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import RedTeam from "./pages/RedTeam";
import BlackTeam from "./pages/BlackTeam";
import WhiteTeam from "./pages/WhiteTeam";
import MilestonesTab from "./pages/MilestonesTab";
import MilestonesJobRunner from "./pages/MilestonesJobRunner";
import MilestonesJobComplete from "./pages/MilestonesJobComplete";
import BuildTab from "./pages/BuildTab";
import SharkSwarmer from "./pages/SharkSwarmer";
import NotFound from "./pages/NotFound";
import SwarmDashboard from "./components/monitoring/SwarmDashboard";
import { ReportView } from "./components/ReportView";
import { ReportViewDemo } from "./components/ReportViewDemo";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Landing />} />
          
          {/* Wayfinder Tab Routes (formerly Research) */}
          <Route path="/home" element={<AppLayout><Index /></AppLayout>} />
          <Route path="/red-team" element={<AppLayout><RedTeam /></AppLayout>} />
          <Route path="/black-team" element={<AppLayout><BlackTeam /></AppLayout>} />
          <Route path="/white-team" element={<AppLayout><WhiteTeam /></AppLayout>} />
          
          {/* Shark Swarmer Tab Route */}
          <Route path="/shark-swarmer" element={<AppLayout><SharkSwarmer /></AppLayout>} />
          
          {/* Reef Builder Tab Routes (formerly Milestones/Plan) */}
          <Route path="/milestones" element={<AppLayout><MilestonesTab /></AppLayout>} />
          <Route path="/milestones/:repo/:jobId" element={<AppLayout><MilestonesJobRunner /></AppLayout>} />
          <Route path="/milestones/:repo/:jobId/complete" element={<AppLayout><MilestonesJobComplete /></AppLayout>} />
          
          {/* Archipelago Tab Routes (formerly Build) */}
          <Route path="/build" element={<AppLayout><BuildTab /></AppLayout>} />
          
          {/* Monitoring Dashboard */}
          <Route path="/monitoring" element={<AppLayout><SwarmDashboard /></AppLayout>} />
          
          {/* Report Viewer */}
          <Route path="/reports/:reportId" element={<AppLayout><ReportView /></AppLayout>} />
          <Route path="/demo/reports" element={<AppLayout><ReportViewDemo /></AppLayout>} />
          
          {/* Redirects and 404 */}
          <Route path="/research" element={<Navigate to="/home" replace />} />
          <Route path="/plan" element={<Navigate to="/home" replace />} />
          <Route path="/plan/*" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
