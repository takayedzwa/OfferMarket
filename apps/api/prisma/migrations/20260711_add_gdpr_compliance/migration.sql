-- AlterTable: Add GDPR fields to User table
ALTER TABLE "User" ADD COLUMN "privacyPolicyVersion" TEXT;
ALTER TABLE "User" ADD COLUMN "privacyPolicyAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "termsOfServiceVersion" TEXT;
ALTER TABLE "User" ADD COLUMN "termsOfServiceAcceptedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "marketingConsent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "analyticsConsent" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: Add immigration consent fields to Worker table
ALTER TABLE "Worker" ADD COLUMN "immigration_consent_given" BOOLEAN DEFAULT false;
ALTER TABLE "Worker" ADD COLUMN "immigration_consent_at" TIMESTAMP(3);

-- AlterTable: Add retention expiry to Message table
ALTER TABLE "Message" ADD COLUMN "retention_expires_at" TIMESTAMP(3);

-- AlterTable: Add GDPR fields to AuditLog table
ALTER TABLE "AuditLog" ADD COLUMN "legalBasis" TEXT;
ALTER TABLE "AuditLog" ADD COLUMN "dataSubjectRequestRef" TEXT;

-- CreateIndex: Add index on Message retentionExpiresAt
CREATE INDEX "Message_retention_expires_at_idx" ON "Message"("retention_expires_at");

-- CreateEnum: GDPR-related enums
CREATE TYPE "ConsentType" AS ENUM ('PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'COOKIE_ANALYTICS', 'COOKIE_MARKETING', 'DATA_PROCESSING', 'SPECIAL_CATEGORY', 'EMAIL_NOTIFICATIONS', 'PROFILE_VISIBLE', 'MARKETING', 'ID_VERIFICATION', 'KVK_PROCESSING');

CREATE TYPE "ConsentStatus" AS ENUM ('GIVEN', 'WITHDRAWN', 'EXPIRED', 'REVOKED');

CREATE TYPE "LegalBasis" AS ENUM ('CONSENT', 'CONTRACT_PERFORMANCE', 'LEGAL_OBLIGATION', 'VITAL_INTEREST', 'PUBLIC_TASK', 'LEGITIMATE_INTEREST', 'EXPLICIT_CONSENT');

CREATE TYPE "DataSubjectRequestType" AS ENUM ('ACCESS', 'RECTIFICATION', 'ERASURE', 'RESTRICT', 'PORTABILITY', 'OBJECT', 'WITHDRAW_CONSENT');

CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'EXPIRED');

CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');

CREATE TYPE "ExportFormat" AS ENUM ('JSON', 'CSV');

CREATE TYPE "DeletionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

CREATE TYPE "BreachSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

CREATE TYPE "BreachStatus" AS ENUM ('INVESTIGATING', 'CONTAINED', 'REPORTED_AUTHORITY', 'NOTIFIED_USERS', 'REMEDIATED', 'CLOSED');

-- CreateTable: Consent
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "consentType" "ConsentType" NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'GIVEN',
    "version" TEXT NOT NULL,
    "legalBasis" "LegalBasis" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "withdrawnAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Consent_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserGdprFlags
CREATE TABLE "UserGdprFlags" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "processingRestricted" BOOLEAN NOT NULL DEFAULT false,
    "processingRestrictedAt" TIMESTAMP(3),
    "dataExportRequestedAt" TIMESTAMP(3),
    "deletionRequestedAt" TIMESTAMP(3),
    "deletionScheduledAt" TIMESTAMP(3),
    "lastConsentReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserGdprFlags_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DataSubjectRequest
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" "DataSubjectRequestType" NOT NULL,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "adminNotes" TEXT,
    "processedBy" TEXT,
    "processedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "resultData" JSONB,
    "rejectionReason" TEXT,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSubjectRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DataExportRequest
CREATE TABLE "DataExportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "format" "ExportFormat" NOT NULL DEFAULT 'JSON',
    "filePath" TEXT,
    "fileSize" INTEGER,
    "dataCategories" TEXT[],
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DataDeletionRequest
CREATE TABLE "DataDeletionRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "DeletionStatus" NOT NULL DEFAULT 'PENDING',
    "reason" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "scheduledDeletionAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "dataCategories" TEXT[],
    "retentionOverrides" TEXT[],
    "adminReviewedBy" TEXT,
    "adminReviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataDeletionRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ProcessingActivity
CREATE TABLE "ProcessingActivity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "legalBasis" "LegalBasis" NOT NULL,
    "dataCategories" TEXT[],
    "dataSubjects" TEXT[],
    "recipients" TEXT[],
    "retentionPeriod" TEXT NOT NULL,
    "specialCategoryJustification" TEXT,
    "technicalMeasures" TEXT,
    "dpoContact" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DataRetentionPolicy
CREATE TABLE "DataRetentionPolicy" (
    "id" TEXT NOT NULL,
    "dataType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "retentionPeriodDays" INTEGER NOT NULL,
    "legalBasis" TEXT NOT NULL,
    "autoDelete" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DataBreach
CREATE TABLE "DataBreach" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "BreachSeverity" NOT NULL,
    "affectedDataCategories" TEXT[],
    "estimatedAffectedUsers" INTEGER NOT NULL DEFAULT 0,
    "discoveredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "containedAt" TIMESTAMP(3),
    "reportedToAuthorityAt" TIMESTAMP(3),
    "reportedToUsersAt" TIMESTAMP(3),
    "authorityReference" TEXT,
    "rootCause" TEXT,
    "remediationSteps" TEXT,
    "status" "BreachStatus" NOT NULL DEFAULT 'INVESTIGATING',
    "resolvedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataBreach_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DataProcessingAgreement
CREATE TABLE "DataProcessingAgreement" (
    "id" TEXT NOT NULL,
    "processorName" TEXT NOT NULL,
    "processorType" TEXT NOT NULL,
    "agreementUrl" TEXT,
    "agreementDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "dataCategories" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataProcessingAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable: PrivacyPolicyVersion
CREATE TABLE "PrivacyPolicyVersion" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "documentType" TEXT NOT NULL DEFAULT 'privacy_policy',
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacyPolicyVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Consent indexes
CREATE INDEX "Consent_userId_idx" ON "Consent"("userId");
CREATE INDEX "Consent_consentType_status_idx" ON "Consent"("consentType", "status");
CREATE INDEX "Consent_createdAt_idx" ON "Consent"("createdAt");

-- CreateIndex: UserGdprFlags indexes
CREATE UNIQUE INDEX "UserGdprFlags_userId_key" ON "UserGdprFlags"("userId");
CREATE INDEX "UserGdprFlags_processingRestricted_idx" ON "UserGdprFlags"("processingRestricted");

-- CreateIndex: DataSubjectRequest indexes
CREATE INDEX "DataSubjectRequest_userId_idx" ON "DataSubjectRequest"("userId");
CREATE INDEX "DataSubjectRequest_requestType_idx" ON "DataSubjectRequest"("requestType");
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");
CREATE INDEX "DataSubjectRequest_dueDate_idx" ON "DataSubjectRequest"("dueDate");

-- CreateIndex: DataExportRequest indexes
CREATE INDEX "DataExportRequest_userId_idx" ON "DataExportRequest"("userId");
CREATE INDEX "DataExportRequest_status_idx" ON "DataExportRequest"("status");

-- CreateIndex: DataDeletionRequest indexes
CREATE INDEX "DataDeletionRequest_userId_idx" ON "DataDeletionRequest"("userId");
CREATE INDEX "DataDeletionRequest_status_idx" ON "DataDeletionRequest"("status");
CREATE INDEX "DataDeletionRequest_scheduledDeletionAt_idx" ON "DataDeletionRequest"("scheduledDeletionAt");

-- CreateIndex: ProcessingActivity indexes
CREATE INDEX "ProcessingActivity_legalBasis_idx" ON "ProcessingActivity"("legalBasis");
CREATE INDEX "ProcessingActivity_isActive_idx" ON "ProcessingActivity"("isActive");

-- CreateIndex: DataRetentionPolicy indexes
CREATE INDEX "DataRetentionPolicy_dataType_idx" ON "DataRetentionPolicy"("dataType");
CREATE INDEX "DataRetentionPolicy_isActive_idx" ON "DataRetentionPolicy"("isActive");

-- CreateIndex: DataBreach indexes
CREATE INDEX "DataBreach_severity_idx" ON "DataBreach"("severity");
CREATE INDEX "DataBreach_status_idx" ON "DataBreach"("status");
CREATE INDEX "DataBreach_discoveredAt_idx" ON "DataBreach"("discoveredAt");

-- CreateIndex: DataProcessingAgreement indexes
CREATE INDEX "DataProcessingAgreement_processorName_idx" ON "DataProcessingAgreement"("processorName");
CREATE INDEX "DataProcessingAgreement_isActive_idx" ON "DataProcessingAgreement"("isActive");

-- CreateIndex: PrivacyPolicyVersion indexes
CREATE INDEX "PrivacyPolicyVersion_documentType_idx" ON "PrivacyPolicyVersion"("documentType");
CREATE INDEX "PrivacyPolicyVersion_isActive_idx" ON "PrivacyPolicyVersion"("isActive");

-- AddForeignKey: Consent -> User
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: UserGdprFlags -> User
ALTER TABLE "UserGdprFlags" ADD CONSTRAINT "UserGdprFlags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DataSubjectRequest -> User
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DataExportRequest -> User
ALTER TABLE "DataExportRequest" ADD CONSTRAINT "DataExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DataDeletionRequest -> User
ALTER TABLE "DataDeletionRequest" ADD CONSTRAINT "DataDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddUniqueConstraint: ProcessingActivity name
CREATE UNIQUE INDEX "ProcessingActivity_name_key" ON "ProcessingActivity"("name");

-- AddUniqueConstraint: DataRetentionPolicy dataType
CREATE UNIQUE INDEX "DataRetentionPolicy_dataType_key" ON "DataRetentionPolicy"("dataType");