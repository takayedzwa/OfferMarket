"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";
import {
  Home, Users, Briefcase, MessageSquare, FileText, Settings,
  Shield, Ticket, Building2, User, CheckCircle
} from "lucide-react";

interface NavbarProps {
  variant?: "default" | "dashboard";
}

export default function Navbar({ variant = "default" }: NavbarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const userRole = typeof window !== "undefined" ? localStorage.getItem("userRole") : null;
  const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;

  // Use localStorage auth state as fallback when AuthContext is still loading
  const isAuthenticated = user || (accessToken && userId && userRole);
  const isAdmin = userRole === "ADMIN";
  const isSupport = userRole === "SUPPORT" || isAdmin;

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + "/");
  };

  const navLinkClass = (path: string) => {
    return `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path)
        ? "bg-blue-100 text-blue-600"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;
  };

  return (
    <header className="bg-white border-b sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">O</span>
            </div>
            <span className="text-xl font-bold text-gray-900">OfferMarket</span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-2">
            <Link href="/" className={navLinkClass("/")}>
              <Home className="w-4 h-4 inline mr-1" />
              Home
            </Link>

            {isAuthenticated && (
              <>
                {userRole === "WORKER" && (
                  <>
                    <Link href="/dashboard/worker" className={navLinkClass("/dashboard/worker")}>
                      <Briefcase className="w-4 h-4 inline mr-1" />
                      Dashboard
                    </Link>
                    <Link href="/offers" className={navLinkClass("/offers")}>
                      <FileText className="w-4 h-4 inline mr-1" />
                      Offers
                    </Link>
                    <Link href="/conversations" className={navLinkClass("/conversations")}>
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Messages
                    </Link>
                    <Link href="/profile" className={navLinkClass("/profile")}>
                      <User className="w-4 h-4 inline mr-1" />
                      Profile
                    </Link>
                  </>
                )}

                {userRole === "EMPLOYER" && (
                  <>
                    <Link href="/dashboard/employer" className={navLinkClass("/dashboard/employer")}>
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Dashboard
                    </Link>
                    <Link href="/offers" className={navLinkClass("/offers")}>
                      <FileText className="w-4 h-4 inline mr-1" />
                      Offers
                    </Link>
                    <Link href="/workers" className={navLinkClass("/workers")}>
                      <Users className="w-4 h-4 inline mr-1" />
                      Search Workers
                    </Link>
                    <Link href="/conversations" className={navLinkClass("/conversations")}>
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Messages
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <>
                    <Link href="/admin" className={navLinkClass("/admin")}>
                      <Shield className="w-4 h-4 inline mr-1" />
                      Admin
                    </Link>
                    <Link href="/admin/users" className={navLinkClass("/admin/users")}>
                      <Users className="w-4 h-4 inline mr-1" />
                      Users
                    </Link>
                    <Link href="/admin/employers" className={navLinkClass("/admin/employers")}>
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Employers
                    </Link>
                    <Link href="/admin/verifications" className={navLinkClass("/admin/verifications")}>
                      <CheckCircle className="w-4 h-4 inline mr-1" />
                      Verifications
                    </Link>
                    <Link href="/admin/offers" className={navLinkClass("/admin/offers")}>
                      <Briefcase className="w-4 h-4 inline mr-1" />
                      Offers
                    </Link>
                    <Link href="/admin/settings" className={navLinkClass("/admin/settings")}>
                      <Settings className="w-4 h-4 inline mr-1" />
                      Settings
                    </Link>
                  </>
                )}

                {isSupport && (
                  <>
                    <Link href="/support" className={navLinkClass("/support")}>
                      <Ticket className="w-4 h-4 inline mr-1" />
                      Support
                    </Link>
                    <Link href="/support/tickets" className={navLinkClass("/support/tickets")}>
                      <Ticket className="w-4 h-4 inline mr-1" />
                      Tickets
                    </Link>
                    <Link href="/support/users" className={navLinkClass("/support/users")}>
                      <Users className="w-4 h-4 inline mr-1" />
                      Users
                    </Link>
                  </>
                )}
              </>
            )}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="text-sm text-gray-600 hidden sm:block">
                  <span className="text-gray-500">Welcome, </span>
                  <span className="font-medium">{user?.email?.split("@")[0] || "User"}</span>
                  {userRole && (
                    <span className={`ml-2 px-2 py-0.5 text-xs font-medium rounded-full ${
                      userRole === "ADMIN" ? "bg-purple-100 text-purple-800" :
                      userRole === "SUPPORT" ? "bg-blue-100 text-blue-800" :
                      userRole === "EMPLOYER" ? "bg-orange-100 text-orange-800" :
                      "bg-green-100 text-green-800"
                    }`}>
                      {userRole}
                    </span>
                  )}
                </div>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
