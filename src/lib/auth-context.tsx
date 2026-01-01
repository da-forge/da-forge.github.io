import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getAuthToken, logout as authLogout, isLoggedIn } from "./auth";
import { githubClient, type GitHubUser } from "./github-api";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: GitHubUser | null;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<GitHubUser | null>(null);

  const refreshUser = useCallback(async () => {
    try {
      const token = await getAuthToken();
      if (token) {
        const userData = await githubClient.getAuthenticatedUser();
        setUser(userData);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch {
      setUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  // Check authentication status on mount
  useEffect(() => {
    async function checkAuth() {
      setIsLoading(true);
      try {
        const loggedIn = await isLoggedIn();
        setIsAuthenticated(loggedIn);
        if (loggedIn) {
          await refreshUser();
        }
      } catch {
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, [refreshUser]);

  const logout = useCallback(async () => {
    await authLogout();
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
