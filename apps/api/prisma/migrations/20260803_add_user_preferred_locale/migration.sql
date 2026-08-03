-- Add preferredLocale column to User for i18n (UI + email locale).
-- Defaults to "en". Drives server-side email rendering and is returned by
-- /auth/me so the frontend can initialize its locale cookie.
ALTER TABLE "User" ADD COLUMN "preferredLocale" TEXT NOT NULL DEFAULT 'en';