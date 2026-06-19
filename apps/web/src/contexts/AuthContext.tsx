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
    const userId = localStorage.getItem("userId");
    const userRole = localStorage.getItem("userRole");

    if (!token || !userId || !userRole) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      const response = await api.get('/auth/me', {
        params: { userId, userRole }
      });

      if (response.data.error) {
        setUser(null);
      } else {
        setUser(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch user profile:", error);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("userId");
      localStorage.removeItem("userRole");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userId");
    localStorage.removeItem("userRole");
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
