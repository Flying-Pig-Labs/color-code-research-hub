import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
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
        <AuthProvider>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            {/* Wayfinder Tab Routes (formerly Research) */}
            <Route path="/home" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
            <Route path="/red-team" element={<ProtectedRoute><AppLayout><RedTeam /></AppLayout></ProtectedRoute>} />
            <Route path="/black-team" element={<ProtectedRoute><AppLayout><BlackTeam /></AppLayout></ProtectedRoute>} />
            <Route path="/white-team" element={<ProtectedRoute><AppLayout><WhiteTeam /></AppLayout></ProtectedRoute>} />
            
            {/* Shark Swarmer Tab Route */}
            <Route path="/shark-swarmer" element={<ProtectedRoute><AppLayout><SharkSwarmer /></AppLayout></ProtectedRoute>} />
            
            {/* Reef Builder Tab Routes (formerly Milestones/Plan) */}
            <Route path="/milestones" element={<ProtectedRoute><AppLayout><MilestonesTab /></AppLayout></ProtectedRoute>} />
            <Route path="/milestones/:repo/:jobId" element={<ProtectedRoute><AppLayout><MilestonesJobRunner /></AppLayout></ProtectedRoute>} />
            <Route path="/milestones/:repo/:jobId/complete" element={<ProtectedRoute><AppLayout><MilestonesJobComplete /></AppLayout></ProtectedRoute>} />
            
            {/* Archipelago Tab Routes (formerly Build) */}
            <Route path="/build" element={<ProtectedRoute><AppLayout><BuildTab /></AppLayout></ProtectedRoute>} />
            
            {/* Monitoring Dashboard */}
            <Route path="/monitoring" element={<ProtectedRoute><AppLayout><SwarmDashboard /></AppLayout></ProtectedRoute>} />
            
            {/* Report Viewer */}
            <Route path="/reports/:reportId" element={<ProtectedRoute><AppLayout><ReportView /></AppLayout></ProtectedRoute>} />
            <Route path="/demo/reports" element={<ProtectedRoute><AppLayout><ReportViewDemo /></AppLayout></ProtectedRoute>} />
            
            {/* Redirects and 404 */}
            <Route path="/research" element={<Navigate to="/home" replace />} />
            <Route path="/plan" element={<Navigate to="/home" replace />} />
            <Route path="/plan/*" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
