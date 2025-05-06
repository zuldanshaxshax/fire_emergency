// PublicRoute.jsx - Only for non-authenticated users
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const PublicRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuth();

  if (isAuthenticated && user?.role === "admin") {
    // If user is logged in, redirect to dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
