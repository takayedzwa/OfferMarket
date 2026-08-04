"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { authApi, api } from "../lib/api";
import { User } from "../lib/types";

/**
 * Paths that require an authenticated user. AuthContext redirects logged-out
 * visitors away from these to /login. Everything else (landing, login, register,
 * forgot/reset-password, workers, dsa, support portal, terms, cookies, public
 * privacy info) is public and must NOT redirect — otherwise logged-out visitors
 * get stuck in a redirect loop. This is a denylist (protected prefixes) rather
 * than a public allowlist so newly added public pages are safe by default.
 */
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/profile",
  "/conversations",
  "/privacy/dashboard",
  "/support/tickets",
  "/support/users",
];

function isProtectedPath(pathname: string | null): boolean {
  if (!pathname) return false;
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return true;
  // Offer create + edit require auth; offer detail/compare are viewable.
  if (pathname === "/offers/create") return true;
  if (/^\/offers\/[^/]+\/edit$/.test(pathname)) return true;
  return false;
}

/**
 * Decode a JWT payload without a library.
 * Returns the parsed payload object, or null if the token is malformed.
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

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
  let isRefreshing = false;

  /**
   * Attempt to refresh the access token using the refresh token.
   * Returns true if refresh succeeded, false otherwise.
   */
  const tryRefreshToken = async (): Promise<boolean> => {
    if (isRefreshing) return false;
    isRefreshing = true;
    try {
      const refreshToken = localStorage.getItem("refreshToken");
      if (!refreshToken) return false;

      const response = await authApi.refreshToken(refreshToken);
      if (response.data?.accessToken) {
        localStorage.setItem("accessToken", response.data.accessToken);
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // SECURITY: userId and userRole are decoded from the JWT payload,
      // not stored separately in localStorage. This eliminates the source-
      // of-truth conflict and prevents IDOR via localStorage manipulation.
      const response = await api.get('/auth/me');

      if (response.data.error) {
        setUser(null);
      } else {
        setUser(response.data);

        // Sync role from server response into a derived state (not localStorage)
        // so components that need the role can read it from the user object.
      }
    } catch (error: any) {
      // If we get a 401, try to refresh the token before giving up
      if (error?.response?.status === 401) {
        const refreshed = await tryRefreshToken();
        if (refreshed) {
          // Retry the original request with the new token
          try {
            const retryResponse = await api.get('/auth/me');
            if (!retryResponse.data.error) {
              setUser(retryResponse.data);
              return;
            }
          } catch {
            // Retry also failed — fall through to logout
          }
        }
        // Refresh also failed — clear tokens and redirect
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      } else {
        console.error("Failed to fetch user profile:", error);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = useCallback(async () => {
    try {
      // Call backend logout to blacklist the access token and revoke refresh tokens
      await api.post('/auth/logout');
    } catch {
      // Ignore errors — we're clearing local state regardless
    }
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    setUser(null);
    router.push("/login");
  }, [router]);

  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // i18n: initialize the NEXT_LOCALE cookie from the user's server-persisted
  // preferredLocale — but ONLY when no explicit cookie exists, so a user's
  // current-session choice (set by the proxy / LanguageSwitcher) is respected.
  // preferredLocale acts as the cross-device default. The LanguageSwitcher
  // PATCHes preferredLocale on every switch, keeping it the source of truth.
  useEffect(() => {
    if (!user?.preferredLocale || typeof document === "undefined") return;
    const hasCookie = document.cookie
      .split("; ")
      .some((c) => c.startsWith("NEXT_LOCALE="));
    if (!hasCookie) {
      document.cookie = `NEXT_LOCALE=${user.preferredLocale}; path=/; max-age=31536000; SameSite=Lax`;
    }
  }, [user?.preferredLocale]);

  // Redirect logged-out visitors away from protected pages to /login. Public
  // pages are never redirected (denylist in isProtectedPath). Uses the
  // locale-aware router so the redirect lands directly on /<locale>/login
  // without a proxy redirect hop. `usePathname` is locale-stripped (from
  // @/i18n/navigation), so checks are written without the /en /nl prefix.
  useEffect(() => {
    if (!loading && !user && isProtectedPath(pathname)) {
      router.replace("/login");
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
