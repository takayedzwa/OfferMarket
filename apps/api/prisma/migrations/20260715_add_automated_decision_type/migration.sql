-- GDPR Article 22: Add AUTOMATED_DECISION to DataSubjectRequestType enum
-- This enables users to object to decisions based solely on automated processing

ALTER TYPE "DataSubjectRequestType" ADD VALUE 'AUTOMATED_DECISION';