/**
 * @fileoverview Main App component for the Color Code Research Hub application.
 * 
 * This is the root component that sets up the entire application architecture including:
 * - Global providers (Query Client, Auth, Tooltips)
 * - Notification systems (Toasters)
 * - Routing configuration with protected routes
 * - Layout structure and navigation
 * 
 * The application features a multi-tab interface:
 * - Wayfinder Tab: Research coordination (Red/Black/White teams)
 * - Shark Swarmer Tab: Advanced AI swarm coordination
 * - Reef Builder Tab: Project planning and milestones
 * - Archipelago Tab: Build and deployment management
 * 
 * @author Color Code Research Hub Team
 * @version 1.0.0
 */

// UI Framework and Notifications
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Data Management
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Routing and Navigation
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Authentication and Security
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Theme Management
import { ThemeProvider } from "@/contexts/ThemeContext";

// Layout Components
import AppLayout from "./components/layout/AppLayout";

// Page Components - Public
import Landing from "./pages/Landing";
import Login from "./pages/Login";

// Page Components - Wayfinder Tab (Research Teams)
import Index from "./pages/Index";
import RedTeam from "./pages/RedTeam";
import BlackTeam from "./pages/BlackTeam";
import WhiteTeam from "./pages/WhiteTeam";

// Page Components - Shark Swarmer Tab
import SharkSwarmer from "./pages/SharkSwarmer";

// Page Components - Reef Builder Tab (Planning/Milestones)
import MilestonesTab from "./pages/MilestonesTab";
import MilestonesJobRunner from "./pages/MilestonesJobRunner";
import MilestonesJobComplete from "./pages/MilestonesJobComplete";

// Page Components - Archipelago Tab (Build)
import BuildTab from "./pages/BuildTab";

// Utility Pages
import NotFound from "./pages/NotFound";

// Specialized Components
import SwarmDashboard from "./components/monitoring/SwarmDashboard";
import { ReportView } from "./components/ReportView";
import { ReportViewDemo } from "./components/ReportViewDemo";

/**
 * Global React Query client configuration.
 * Provides caching, synchronization, and background updates for server state.
 * Default configuration includes:
 * - 5 minute stale time for most queries
 * - Automatic retries on failure
 * - Background refetching when window refocuses
 */
const queryClient = new QueryClient();

/**
 * Root App component that provides the complete application structure.
 * 
 * Provider Hierarchy (outer to inner):
 * 1. QueryClientProvider - Server state management
 * 2. TooltipProvider - Global tooltip context
 * 3. Toaster/Sonner - Notification systems
 * 4. BrowserRouter - Client-side routing
 * 5. AuthProvider - Authentication and user context
 * 
 * Route Structure:
 * - Public routes: Landing page and Login
 * - Protected routes: All application features behind authentication
 * - Legacy redirects: Maintains backward compatibility
 * 
 * @returns {JSX.Element} The complete application component tree
 */
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        {/* Dual notification systems for different use cases */}
        <Toaster /> {/* Form validation and user actions */}
        <Sonner />  {/* Real-time updates and system notifications */}
        
        <BrowserRouter>
          <AuthProvider>
          <Routes>
            {/* Public Pages - No authentication required */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes - Require authentication */}
            
            {/* Wayfinder Tab Routes - Research team coordination */}
            {/* Main dashboard and team-specific research interfaces */}
            <Route path="/home" element={<ProtectedRoute><AppLayout><Index /></AppLayout></ProtectedRoute>} />
            <Route path="/red-team" element={<ProtectedRoute><AppLayout><RedTeam /></AppLayout></ProtectedRoute>} />
            <Route path="/black-team" element={<ProtectedRoute><AppLayout><BlackTeam /></AppLayout></ProtectedRoute>} />
            <Route path="/white-team" element={<ProtectedRoute><AppLayout><WhiteTeam /></AppLayout></ProtectedRoute>} />
            
            {/* Shark Swarmer Tab - Advanced AI coordination */}
            {/* Real-time swarm monitoring and control interface */}
            <Route path="/shark-swarmer" element={<ProtectedRoute><AppLayout><SharkSwarmer /></AppLayout></ProtectedRoute>} />
            
            {/* Reef Builder Tab Routes - Project planning and milestone management */}
            {/* Async job workflow: List → Runner → Complete */}
            <Route path="/milestones" element={<ProtectedRoute><AppLayout><MilestonesTab /></AppLayout></ProtectedRoute>} />
            <Route path="/milestones/:repo/:jobId" element={<ProtectedRoute><AppLayout><MilestonesJobRunner /></AppLayout></ProtectedRoute>} />
            <Route path="/milestones/:repo/:jobId/complete" element={<ProtectedRoute><AppLayout><MilestonesJobComplete /></AppLayout></ProtectedRoute>} />
            
            {/* Archipelago Tab Routes - Build and deployment management */}
            <Route path="/build" element={<ProtectedRoute><AppLayout><BuildTab /></AppLayout></ProtectedRoute>} />
            
            {/* Monitoring Dashboard - System observability */}
            <Route path="/monitoring" element={<ProtectedRoute><AppLayout><SwarmDashboard /></AppLayout></ProtectedRoute>} />
            
            {/* Report Viewer - Research output visualization */}
            <Route path="/reports/:reportId" element={<ProtectedRoute><AppLayout><ReportView /></AppLayout></ProtectedRoute>} />
            <Route path="/demo/reports" element={<ProtectedRoute><AppLayout><ReportViewDemo /></AppLayout></ProtectedRoute>} />
            
            {/* Legacy Redirects - Maintain backward compatibility */}
            <Route path="/research" element={<Navigate to="/home" replace />} />
            <Route path="/plan" element={<Navigate to="/home" replace />} />
            <Route path="/plan/*" element={<Navigate to="/home" replace />} />
            
            {/* 404 Handler */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
