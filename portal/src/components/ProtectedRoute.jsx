// ProtectedRoute.jsx - Only for admin access
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    // Redirect to login page
    return <Navigate to="/login" replace />;
  }

  // Make sure user is an admin
  if (user?.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
};
