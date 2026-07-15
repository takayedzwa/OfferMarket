-- DSA (Digital Services Act) Compliance
-- Regulation EU 2022/2065
-- Adds: ContentReport, StatementOfReasons, DSAComplaint, ComplaintMessage,
--       NoticeMisuseRecord, TransparencyReport models and related enums

-- Create enums
CREATE TYPE "ContentReportTarget" AS ENUM ('USER_PROFILE', 'WORKER_PROFILE', 'EMPLOYER_PROFILE', 'OFFER', 'CONVERSATION', 'MESSAGE', 'REVIEW', 'OTHER');
CREATE TYPE "ContentReportCategory" AS ENUM ('ILLEGAL_CONTENT', 'FRAUD_SCAM', 'HARASSMENT', 'HATE_SPEECH', 'COPYRIGHT_VIOLATION', 'PRIVACY_VIOLATION', 'MISLEADING_INFORMATION', 'CHILD_SAFETY', 'TERRORISM', 'DRUGS_WEAPONS', 'IMPERSONATION', 'SPAM', 'OTHER');
CREATE TYPE "ContentReportStatus" AS ENUM ('RECEIVED', 'ASSESSMENT', 'ACTION_TAKEN', 'NOTIFIED', 'RESOLVED', 'DISMISSED', 'ESCALATED');
CREATE TYPE "ContentReportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');
CREATE TYPE "ContentReportAssessment" AS ENUM ('ILLEGAL_CONTENT_FOUND', 'VIOLATES_TERMS', 'NOT_VIOLATION', 'UNCLEAR_NEEDS_REVIEW');
CREATE TYPE "ContentReportAction" AS ENUM ('CONTENT_REMOVED', 'CONTENT_HIDDEN', 'ACCOUNT_SUSPENDED', 'ACCOUNT_BANNED', 'WARNING_ISSUED', 'NO_ACTION', 'ESCALATED_TO_AUTHORITIES', 'REFERRED_TO_OUT_OF_COURT');
CREATE TYPE "ContentReportResolution" AS ENUM ('CONTENT_TAKEN_DOWN', 'ACCESS_RESTRICTED', 'ACCOUNT_TERMINATED', 'REPORT_DISMISSED', 'WITHDRAWN_BY_REPORTER');
CREATE TYPE "ContentRestrictionType" AS ENUM ('REMOVAL', 'VISIBILITY_LIMIT', 'GEO_BLOCKING', 'AGE_RESTRICTION', 'ACCOUNT_SUSPENSION', 'ACCOUNT_TERMINATION');
CREATE TYPE "DecisionSource" AS ENUM ('USER_REPORT', 'OWN_INVESTIGATION', 'AUTHORITY_ORDER', 'TRUSTED_FLAGGER', 'AUTOMATED_DETECTION');
CREATE TYPE "AppealStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'UPHELD', 'OVERTURNED', 'WITHDRAWN');
CREATE TYPE "DSAComplaintType" AS ENUM ('CONTENT_MODERATION_DECISION', 'ILLEGAL_CONTENT_RESPONSE', 'PLATFORM_POLICY_VIOLATION', 'TRADER_INFORMATION', 'OTHER');
CREATE TYPE "DSAComplaintStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESPONSE_PREPARED', 'RESOLVED', 'ESCALATED_ODR', 'CLOSED');
CREATE TYPE "ODRStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'FAILED');
CREATE TYPE "MisuseType" AS ENUM ('FRIVOLOUS_REPORTS', 'ABUSIVE_REPORTS', 'AUTOMATED_ABUSE', 'REPEATED_SAME_REPORT', 'MANIFESTLY_ILLEGAL_CONTENT');
CREATE TYPE "WarningLevel" AS ENUM ('FIRST_WARNING', 'SECOND_WARNING', 'TEMPORARY_REPORTING_SUSPENSION', 'PERMANENT_REPORTING_BAN');

-- Create tables
CREATE TABLE "content_reports" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "reporter_id" TEXT,
    "reporter_email" TEXT,
    "reporter_ip" TEXT,
    "reporter_user_agent" TEXT,
    "target_type" "ContentReportTarget" NOT NULL,
    "target_id" TEXT NOT NULL,
    "target_url" TEXT NOT NULL,
    "target_snapshot" JSONB,
    "category" "ContentReportCategory" NOT NULL,
    "illegal_content_type" TEXT,
    "explanation" TEXT NOT NULL,
    "good_faith_declaration" BOOLEAN NOT NULL DEFAULT false,
    "evidence" JSONB,
    "status" "ContentReportStatus" NOT NULL DEFAULT 'RECEIVED',
    "priority" "ContentReportPriority" NOT NULL DEFAULT 'MEDIUM',
    "assigned_to_id" TEXT,
    "assessment_result" "ContentReportAssessment",
    "assessment_notes" TEXT,
    "assessed_at" TIMESTAMP(3),
    "assessed_by" TEXT,
    "action_taken" "ContentReportAction",
    "action_details" JSONB,
    "action_taken_at" TIMESTAMP(3),
    "action_taken_by" TEXT,
    "resolution" "ContentReportResolution",
    "resolution_notes" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "notifier_notified_at" TIMESTAMP(3),
    "affected_user_notified_at" TIMESTAMP(3),
    "counter_notice_received_at" TIMESTAMP(3),
    "counter_notice_content" TEXT,
    "statement_of_reasons_id" TEXT,
    "automated_means" BOOLEAN NOT NULL DEFAULT false,
    "is_frivolous" BOOLEAN NOT NULL DEFAULT false,
    "referred_to_authorities" BOOLEAN NOT NULL DEFAULT false,
    "authority_referral_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "statement_of_reasons" (
    "id" TEXT NOT NULL,
    "content_report_id" TEXT NOT NULL,
    "restriction_type" "ContentRestrictionType" NOT NULL,
    "restricted_content_id" TEXT,
    "restricted_content_type" TEXT,
    "reasons" TEXT[],
    "detailed_explanation" TEXT NOT NULL,
    "decision_source" "DecisionSource" NOT NULL,
    "legal_basis" TEXT,
    "contractual_basis" TEXT,
    "territorial_scope" TEXT,
    "restriction_duration" TEXT,
    "notified_at" TIMESTAMP(3),
    "notification_method" TEXT,
    "appeal_deadline" TIMESTAMP(3),
    "appeal_filed_at" TIMESTAMP(3),
    "appeal_status" "AppealStatus",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "statement_of_reasons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dsa_complaints" (
    "id" TEXT NOT NULL,
    "complaintNumber" TEXT NOT NULL,
    "complainant_id" TEXT NOT NULL,
    "complainant_email" TEXT NOT NULL,
    "content_report_id" TEXT,
    "related_entity_type" TEXT,
    "related_entity_id" TEXT,
    "complaint_type" "DSAComplaintType" NOT NULL,
    "description" TEXT NOT NULL,
    "resolution_sought" TEXT,
    "assigned_to_id" TEXT,
    "status" "DSAComplaintStatus" NOT NULL DEFAULT 'SUBMITTED',
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged_at" TIMESTAMP(3),
    "target_response_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolution_outcome" TEXT,
    "odr_reference" TEXT,
    "odr_status" "ODRStatus",
    "is_appealed" BOOLEAN NOT NULL DEFAULT false,
    "appeal_deadline" TIMESTAMP(3),
    "appeal_decision" TEXT,
    "appeal_decided_at" TIMESTAMP(3),
    "appeal_decided_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dsa_complaints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "complaint_messages" (
    "id" TEXT NOT NULL,
    "complaint_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaint_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notice_misuse_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_report_id" TEXT,
    "misuseType" "MisuseType" NOT NULL,
    "description" TEXT NOT NULL,
    "warningLevel" "WarningLevel" NOT NULL DEFAULT 'FIRST_WARNING',
    "action_taken" TEXT,
    "action_details" JSONB,
    "is_lifted" BOOLEAN NOT NULL DEFAULT false,
    "lifted_at" TIMESTAMP(3),
    "lifted_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notice_misuse_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "transparency_reports" (
    "id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "published_at" TIMESTAMP(3),
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "total_reports_received" INTEGER NOT NULL DEFAULT 0,
    "reports_from_authorities" INTEGER NOT NULL DEFAULT 0,
    "reports_from_trusted_flaggers" INTEGER NOT NULL DEFAULT 0,
    "reports_from_own_investigation" INTEGER NOT NULL DEFAULT 0,
    "reports_by_category" JSONB,
    "content_removed" INTEGER NOT NULL DEFAULT 0,
    "content_access_disabled" INTEGER NOT NULL DEFAULT 0,
    "accounts_suspended" INTEGER NOT NULL DEFAULT 0,
    "accounts_terminated" INTEGER NOT NULL DEFAULT 0,
    "no_action_taken" INTEGER NOT NULL DEFAULT 0,
    "avg_response_time_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "median_response_time_hours" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "automated_detection_count" INTEGER NOT NULL DEFAULT 0,
    "automated_action_count" INTEGER NOT NULL DEFAULT 0,
    "automated_action_reversed_count" INTEGER NOT NULL DEFAULT 0,
    "complaints_received" INTEGER NOT NULL DEFAULT 0,
    "complaints_resolved" INTEGER NOT NULL DEFAULT 0,
    "complaints_by_outcome" JSONB,
    "misuse_notices_issued" INTEGER NOT NULL DEFAULT 0,
    "accounts_suspended_for_misuse" INTEGER NOT NULL DEFAULT 0,
    "orders_received" INTEGER NOT NULL DEFAULT 0,
    "orders_complied" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transparency_reports_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_publicId_key" UNIQUE ("publicId");
ALTER TABLE "statement_of_reasons" ADD CONSTRAINT "statement_of_reasons_content_report_id_key" UNIQUE ("content_report_id");
ALTER TABLE "dsa_complaints" ADD CONSTRAINT "dsa_complaints_complaintNumber_key" UNIQUE ("complaintNumber");

-- Create indexes
CREATE INDEX "content_reports_target_type_target_id_idx" ON "content_reports"("target_type", "target_id");
CREATE INDEX "content_reports_status_idx" ON "content_reports"("status");
CREATE INDEX "content_reports_priority_idx" ON "content_reports"("priority");
CREATE INDEX "content_reports_category_idx" ON "content_reports"("category");
CREATE INDEX "content_reports_reporter_id_idx" ON "content_reports"("reporter_id");
CREATE INDEX "content_reports_created_at_idx" ON "content_reports"("created_at");
CREATE INDEX "content_reports_resolved_at_idx" ON "content_reports"("resolved_at");

CREATE INDEX "statement_of_reasons_restriction_type_idx" ON "statement_of_reasons"("restriction_type");
CREATE INDEX "statement_of_reasons_appeal_status_idx" ON "statement_of_reasons"("appeal_status");
CREATE INDEX "statement_of_reasons_notified_at_idx" ON "statement_of_reasons"("notified_at");

CREATE INDEX "dsa_complaints_complainant_id_idx" ON "dsa_complaints"("complainant_id");
CREATE INDEX "dsa_complaints_assigned_to_id_idx" ON "dsa_complaints"("assigned_to_id");
CREATE INDEX "dsa_complaints_status_idx" ON "dsa_complaints"("status");
CREATE INDEX "dsa_complaints_complaint_type_idx" ON "dsa_complaints"("complaint_type");
CREATE INDEX "dsa_complaints_submitted_at_idx" ON "dsa_complaints"("submitted_at");
CREATE INDEX "dsa_complaints_target_response_at_idx" ON "dsa_complaints"("target_response_at");

CREATE INDEX "complaint_messages_complaint_id_idx" ON "complaint_messages"("complaint_id");
CREATE INDEX "complaint_messages_sender_id_idx" ON "complaint_messages"("sender_id");

CREATE INDEX "notice_misuse_records_user_id_idx" ON "notice_misuse_records"("user_id");
CREATE INDEX "notice_misuse_records_warningLevel_idx" ON "notice_misuse_records"("warningLevel");
CREATE INDEX "notice_misuse_records_created_at_idx" ON "notice_misuse_records"("created_at");

CREATE INDEX "transparency_reports_period_start_idx" ON "transparency_reports"("period_start");
CREATE INDEX "transparency_reports_is_published_idx" ON "transparency_reports"("is_published");

-- Add foreign keys
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "statement_of_reasons" ADD CONSTRAINT "statement_of_reasons_content_report_id_fkey" FOREIGN KEY ("content_report_id") REFERENCES "content_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "dsa_complaints" ADD CONSTRAINT "dsa_complaints_complainant_id_fkey" FOREIGN KEY ("complainant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "dsa_complaints" ADD CONSTRAINT "dsa_complaints_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "dsa_complaints" ADD CONSTRAINT "dsa_complaints_content_report_id_fkey" FOREIGN KEY ("content_report_id") REFERENCES "content_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "complaint_messages" ADD CONSTRAINT "complaint_messages_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "dsa_complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notice_misuse_records" ADD CONSTRAINT "notice_misuse_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "notice_misuse_records" ADD CONSTRAINT "notice_misuse_records_content_report_id_fkey" FOREIGN KEY ("content_report_id") REFERENCES "content_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;