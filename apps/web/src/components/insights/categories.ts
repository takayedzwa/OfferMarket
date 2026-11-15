// ============================================================================
// INSIGHT CATEGORY CONSTANTS — server-safe (no "use client")
// ----------------------------------------------------------------------------
// Lives in its own module so both client components (CategoryChips) and server
// components (the insights category page + its metadata) import the real
// array. Importing a named constant out of a "use client" module from a server
// component yields a client-reference placeholder under Turbopack — see
// docs/growth/TECHNICAL_IMPLEMENTATION.md (T3).
// ============================================================================
export const INSIGHT_CATEGORIES = ["SALARY", "DEMAND", "EMPLOYER", "INDUSTRY", "CAREER"] as const;

export type InsightCategory = (typeof INSIGHT_CATEGORIES)[number];
