"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./notifications/NotificationBell";
import LanguageSwitcher from "./LanguageSwitcher";
import {
  Home, Users, Briefcase, MessageSquare, FileText,
  Shield, Ticket, Building2, User, CreditCard, Lock, Flag,
  Menu, X,
} from "lucide-react";

export default function Navbar() {
  const t = useTranslations("nav");
  const tCommon = useTranslations("common");
  const pathname = usePathname();
  const { user, loading: authLoading, logout } = useAuth();

  // SECURITY: role/identity come from AuthContext (resolved from the JWT via
  // /auth/me), not localStorage. Commit f730b33 stopped storing userId/userRole
  // in localStorage (tokens only), but this Navbar still read them — so the
  // role-gated menus (Dashboard, Offers, Messages, etc.) never appeared.
  // Typed as string to accommodate roles like SUPPORT that the User type union
  // doesn't list. `authLoading` avoids a "Sign In" flash while /auth/me resolves.
  const userRole: string | null = user?.role ?? null;
  const isAuthenticated = !!user;
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

  const [mobileOpen, setMobileOpen] = useState(false);

  // Single source of truth for the role-gated nav links. Rendered both in the
  // desktop bar (hidden md:flex) and the mobile drawer (md:hidden) so the two
  // never diverge — add a link here once and it appears in both places.
  // `label` holds a translation key resolved via `t(...)` at render time.
  const navLinks: { href: string; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
    { href: "/", label: "links.home", Icon: Home },
  ];
  if (isAuthenticated) {
    if (userRole === "WORKER") {
      navLinks.push(
        { href: "/dashboard/worker", label: "links.dashboard", Icon: Briefcase },
        { href: "/offers", label: "links.offers", Icon: FileText },
        { href: "/conversations", label: "links.messages", Icon: MessageSquare },
        { href: "/profile", label: "links.profile", Icon: User },
      );
    }
    if (userRole === "EMPLOYER") {
      navLinks.push(
        { href: "/dashboard/employer", label: "links.dashboard", Icon: Building2 },
        { href: "/offers", label: "links.offers", Icon: FileText },
        { href: "/workers", label: "links.searchWorkers", Icon: Users },
        { href: "/conversations", label: "links.messages", Icon: MessageSquare },
        { href: "/dashboard/employer/billing", label: "links.billing", Icon: CreditCard },
      );
    }
    if (isAdmin) {
      navLinks.push({ href: "/admin", label: "links.admin", Icon: Shield });
    }
    if (isSupport) {
      navLinks.push(
        { href: "/support", label: "links.support", Icon: Ticket },
        { href: "/support/tickets", label: "links.tickets", Icon: Ticket },
        { href: "/support/users", label: "links.users", Icon: Users },
        { href: "/profile", label: "links.profile", Icon: User },
      );
    }
  }

  // Hamburger only makes sense when there are links beyond Home (i.e. an
  // authenticated user with role-gated destinations). Unauthenticated visitors
  // keep the existing Sign In / Get Started buttons.
  const showHamburger = !authLoading && isAuthenticated && navLinks.length > 1;

  const mobileLinkClass = (path: string) =>
    `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path) ? "bg-blue-100 text-blue-600" : "text-gray-700 hover:bg-gray-100"
    }`;

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

          {/* Navigation Links (desktop) */}
          <nav className="hidden md:flex items-center gap-2">
            {navLinks.map(({ href, label, Icon }) => (
              <Link key={href} href={href} className={navLinkClass(href)}>
                <Icon className="w-4 h-4 inline mr-1" />
                {t(label)}
              </Link>
            ))}
          </nav>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Hamburger — mobile only (md:hidden). Toggles the drawer below. */}
            {showHamburger && (
              <button
                type="button"
                onClick={() => setMobileOpen((o) => !o)}
                className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label={mobileOpen ? t("menu.close") : t("menu.open")}
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            {/* Language switcher — available to all visitors. */}
            <LanguageSwitcher />

            {authLoading ? null : isAuthenticated ? (
              <>
                {/* Notification bell */}
                <NotificationBell userId={user?.id ?? null} />

                <div className="text-sm text-gray-600 hidden sm:block">
                  <span className="text-gray-500">{t("welcome")}</span>
                  <span className="font-medium">{user?.email?.split("@")[0] || tCommon("user.fallbackName")}</span>
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
                <Link
                  href="/privacy/dashboard"
                  className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  title={t("privacyTitle")}
                >
                  <Lock className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("privacy")}</span>
                </Link>
                <Link
                  href="/dsa/report"
                  className="text-sm text-red-600 hover:text-red-700 px-2 py-1 rounded transition-colors flex items-center gap-1"
                  title={t("reportTitle")}
                >
                  <Flag className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("report")}</span>
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {t("signOut")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/dsa/report"
                  className="text-red-600 hover:text-red-700 px-3 py-2 text-sm font-medium flex items-center gap-1"
                >
                  <Flag className="w-4 h-4" />
                  {t("report")}
                </Link>
                <Link
                  href="/privacy"
                  className="text-gray-500 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  {t("privacy")}
                </Link>
                <Link
                  href="/login"
                  className="text-gray-600 hover:text-gray-900 px-4 py-2 text-sm font-medium"
                >
                  {t("signIn")}
                </Link>
                <Link
                  href="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  {t("getStarted")}
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile navigation drawer (md:hidden). Same link list as the
            desktop bar; closes on navigation. */}
        {mobileOpen && showHamburger && (
          <nav className="md:hidden border-t border-gray-200 py-3 space-y-1">
            {navLinks.map(({ href, label, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={mobileLinkClass(href)}
              >
                <Icon className="w-4 h-4" />
                {t(label)}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}