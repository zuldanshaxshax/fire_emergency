// App.jsx - Updated with consolidated login system
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { LandingPage } from "@/pages/LandingPage";
import { AdminDashboard } from "@/pages/admin/AdminDashboard";
import { LoginPage } from "@/pages/auth/LoginPage";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PublicRoute } from "@/components/PublicRoute";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ClientsPage } from "@/pages/admin/ClientsPage"
import { EmergenciesPage } from "@/pages/admin/EmergenciesPage"
import { EmergencyDetailsPage } from "@/pages/admin/EmergencyDetailsPage"
import { Toaster } from "@/components/ui/toaster";
import { UserManagementPage } from "@/pages/admin/UsersPage"

function App() {
  return (
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              
              {/* Login Route */}
              <Route
                path="/login"
                element={
                  <PublicRoute>
                    <LoginPage />
                  </PublicRoute>
                }
              />
              
              {/* Admin Dashboard Routes */}
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <DashboardLayout>
                      <Routes>
                        <Route index element={<AdminDashboard />} />
                        <Route path="users" element={<UserManagementPage />} />
                        <Route path="clients" element={<ClientsPage />} />
                        <Route path="emergencies" element={<EmergenciesPage />} />
                        <Route path="emergencies/:id" element={<EmergencyDetailsPage />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
              
              {/* Redirect /dashboard to /admin for convenience */}
              <Route
                path="/dashboard"
                element={<Navigate to="/admin" replace />}
              />
              
            </Routes>
            <Toaster />
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
  );
}

export default App;