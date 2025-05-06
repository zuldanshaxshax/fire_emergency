import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/axios";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("authToken");
  });

  useEffect(() => {
    const authToken = localStorage.getItem("authToken");
    if (authToken) {
      api.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;
    }
  }, []);

  const login = async (phone, password) => {
    try {
      // Use the admin-specific login endpoint
      const response = await api.post("/auth/admin/login", { 
        phone, 
        password 
      });

      // Extract data from response
      const { data } = response.data;
      
      // Store token and user data
      localStorage.setItem("authToken", data.authToken);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Update auth state
      setUser(data.user);
      setIsAuthenticated(true);

      // Set token for future requests
      api.defaults.headers.common["Authorization"] = `Bearer ${data.authToken}`;

      return data.user;
    } catch (error) {
      // Extract the error message from the response
      const errorMessage = error.response?.data?.message || "Login failed";
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    setUser(null);
    setIsAuthenticated(false);
    delete api.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};