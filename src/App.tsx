import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import AppShell from "@/components/AppShell";
import Index from "./pages/Index.tsx";
import StudentDashboard from "./pages/StudentDashboard.tsx";
import TeacherDashboard from "./pages/TeacherDashboard.tsx";
import Auth from "./pages/Auth.tsx";
import Admin from "./pages/Admin.tsx";
import Privacy from "./pages/Privacy.tsx";
import Docs from "./pages/Docs.tsx";
import PracticePlayer from "./pages/PracticePlayer.tsx";
import SessionReplay from "./pages/SessionReplay.tsx";
import Notifications from "./pages/Notifications.tsx";
import NotFound from "./pages/NotFound.tsx";
// Admin sub-pages
import Organizations from "./pages/admin/Organizations.tsx";
import UsersRoles from "./pages/admin/UsersRoles.tsx";
import Permissions from "./pages/admin/Permissions.tsx";
import AuditLogs from "./pages/admin/AuditLogs.tsx";
import Integrations from "./pages/admin/Integrations.tsx";
import ContentManager from "./pages/admin/ContentManager.tsx";
import Monitoring from "./pages/admin/Monitoring.tsx";
import ExportsJobs from "./pages/admin/ExportsJobs.tsx";
import Policies from "./pages/admin/Policies.tsx";
import ModelGovernance from "./pages/admin/ModelGovernance.tsx";
import Verification from "./pages/admin/Verification.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <ErrorBoundary>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppShell>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/student" element={<StudentDashboard />} />
                <Route path="/teacher" element={<TeacherDashboard />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/organizations" element={<Organizations />} />
                <Route path="/admin/users" element={<UsersRoles />} />
                <Route path="/admin/permissions" element={<Permissions />} />
                <Route path="/admin/audit" element={<AuditLogs />} />
                <Route path="/admin/integrations" element={<Integrations />} />
                <Route path="/admin/content" element={<ContentManager />} />
                <Route path="/admin/monitoring" element={<Monitoring />} />
                <Route path="/admin/jobs" element={<ExportsJobs />} />
                <Route path="/admin/policies" element={<Policies />} />
                <Route path="/admin/models" element={<ModelGovernance />} />
                <Route path="/admin/verification" element={<Verification />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route path="/docs" element={<Docs />} />
                <Route path="/practice" element={<PracticePlayer />} />
                <Route path="/replay" element={<SessionReplay />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppShell>
          </BrowserRouter>
        </ErrorBoundary>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
