-- Add optional name fields to User so admin/support accounts created from the
-- admin console can record who the staff member is (first/last name). Both
-- columns are nullable so existing users and non-staff flows are unaffected.
ALTER TABLE "User" ADD COLUMN "firstName" TEXT, ADD COLUMN "lastName" TEXT;