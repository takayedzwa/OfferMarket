"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { authApi, api } from "../lib/api";
import { User } from "../lib/types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const refreshUser = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // SECURITY: userId and userRole are no longer sent as query params.
      // The /auth/me endpoint now requires JWT authentication and extracts
      // user identity from the verified token, preventing IDOR attacks.
      const response = await api.get('/auth/me');

      if (response.data.error) {
        setUser(null);
      } else {
        setUser(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      localStorage.removeItem("accessToken");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    setUser(null);
    router.push("/login");
  };

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redirect to appropriate dashboard after auth loads
  useEffect(() => {
    if (!loading && !user) {
      // Allow access to public pages
      const publicPages = ["/", "/login", "/register"];
      if (!publicPages.some((page) => pathname?.startsWith(page))) {
        router.push("/login");
      }
    }
  }, [loading, user, pathname, router]);

  const value: AuthContextType = {
    user,
    loading,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
