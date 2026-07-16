-- Add structured rectification fields to DataSubjectRequest
-- This replaces the fragile regex parsing of the description field for Art. 16 rectification requests.

ALTER TABLE "DataSubjectRequest" ADD COLUMN "rectification_field" TEXT;
ALTER TABLE "DataSubjectRequest" ADD COLUMN "rectification_value" TEXT;