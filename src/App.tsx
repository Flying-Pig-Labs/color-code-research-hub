import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import Index from "./pages/Index";
import RedTeam from "./pages/RedTeam";
import BlackTeam from "./pages/BlackTeam";
import WhiteTeam from "./pages/WhiteTeam";
import MilestonesTab from "./pages/MilestonesTab";
import BuildTab from "./pages/BuildTab";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Research Tab Routes */}
          <Route path="/" element={<AppLayout><Index /></AppLayout>} />
          <Route path="/red-team" element={<AppLayout><RedTeam /></AppLayout>} />
          <Route path="/black-team" element={<AppLayout><BlackTeam /></AppLayout>} />
          <Route path="/white-team" element={<AppLayout><WhiteTeam /></AppLayout>} />
          
          {/* Milestones Tab Route */}
          <Route path="/milestones" element={<AppLayout><MilestonesTab /></AppLayout>} />
          
          {/* Build Tab Routes */}
          <Route path="/build" element={<AppLayout><BuildTab /></AppLayout>} />
          
          {/* Redirects and 404 */}
          <Route path="/research" element={<Navigate to="/" replace />} />
          <Route path="/plan" element={<Navigate to="/" replace />} />
          <Route path="/plan/*" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
