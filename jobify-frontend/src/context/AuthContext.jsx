import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem("jobify_token"));
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from token on mount
  const checkAuth = useCallback(async () => {
    const savedToken = localStorage.getItem("jobify_token");
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.get("/auth/me");
      if (response.data && response.data.success) {
        setUser(response.data.data);
      } else {
        setUser(null);
        localStorage.removeItem("jobify_token");
        setToken(null);
      }
    } catch (error) {
      console.error("Failed to restore session:", error);
      setUser(null);
      localStorage.removeItem("jobify_token");
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    if (response.data && response.data.success) {
      const { token: receivedToken, user: receivedUser } = response.data.data;
      localStorage.setItem("jobify_token", receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    }
    throw new Error(response.data?.message || "Login failed");
  };

  const register = async (userData) => {
    const response = await api.post("/auth/register", userData);
    if (response.data && response.data.success) {
      const { token: receivedToken, user: receivedUser } = response.data.data;
      localStorage.setItem("jobify_token", receivedToken);
      setToken(receivedToken);
      setUser(receivedUser);
      return receivedUser;
    }
    throw new Error(response.data?.message || "Registration failed");
  };

  const logout = () => {
    localStorage.removeItem("jobify_token");
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => (prev ? { ...prev, ...updatedFields } : null));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        updateUser,
        isAuthenticated: !!user,
        isLoading,
        checkAuth,
      }}
    >
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

export default AuthContext;
