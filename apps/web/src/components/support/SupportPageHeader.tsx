"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface SupportPageHeaderProps {
  /** Page title. Accepts a ReactNode so badges can be inline with the title. */
  title: React.ReactNode;
  /** Optional subtitle shown beneath the title. */
  subtitle?: React.ReactNode;
  /** Route to navigate to when the back button is pressed. Omit to hide it. */
  backHref?: string;
  /** Accessible label for the back button. */
  backLabel?: string;
  /** Optional action buttons rendered on the right (e.g. New Ticket, Change Status). */
  actions?: React.ReactNode;
}

/**
 * Shared page heading for the support section. Each support page renders the
 * global <Navbar /> (sign out, Privacy, Tickets/Users links, etc.) and then
 * this bar inside <main> to preserve the per-page title, subtitle, back link,
 * and action buttons that used to live in a custom <header>.
 */
export default function SupportPageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
  actions,
}: SupportPageHeaderProps) {
  const router = useRouter();

  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        {backHref && (
          <button
            type="button"
            onClick={() => router.push(backHref)}
            className="mt-0.5 p-2 hover:bg-gray-100 rounded-lg"
            aria-label={backLabel || "Back"}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
        )}
        <div>
          <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}