-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'PENDING_USER', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('WORKER', 'EMPLOYER', 'ADMIN', 'SUPPORT');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'BANNED', 'PENDING_VERIFICATION', 'DELETED');

-- CreateEnum
CREATE TYPE "Availability" AS ENUM ('IMMEDIATE', 'ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'NOT_AVAILABLE');

-- CreateEnum
CREATE TYPE "ProfileVisibility" AS ENUM ('ALL_VERIFIED', 'SELECTED_COMPANIES', 'HIDDEN');

-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "EmployerVerificationStatus" AS ENUM ('PENDING', 'BASIC_VERIFIED', 'PREMIUM_VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RegionType" AS ENUM ('COUNTRY', 'PROVINCE', 'CITY', 'DISTRICT', 'POSTAL_CODE');

-- CreateEnum
CREATE TYPE "OfferStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'VIEWED', 'SHORTLISTED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'WITHDRAWN', 'COUNTERED');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'FILE', 'CALENDAR_INVITE', 'DOCUMENT_REQUEST');

-- CreateEnum
CREATE TYPE "WorkScheduleType" AS ENUM ('STANDARD', 'FLEXIBLE', 'WEEKEND', 'EVENING', 'ROTATING');

-- CreateEnum
CREATE TYPE "IndustryType" AS ENUM ('CONSTRUCTION', 'INDUSTRIAL', 'RESIDENTIAL', 'COMMERCIAL', 'INFRASTRUCTURE', 'ENERGY', 'TELECOM', 'MANUFACTURING', 'HEALTHCARE', 'EDUCATION', 'HOSPITALITY', 'RETAIL', 'TRANSPORTATION', 'AGRICULTURE', 'PUBLIC_SECTOR');

-- CreateEnum
CREATE TYPE "CareerPriority" AS ENUM ('WORK_LIFE_BALANCE', 'HIGH_SALARY', 'CAREER_GROWTH', 'REMOTE_FLEXIBILITY', 'JOB_SECURITY', 'IMPACTFUL_WORK', 'TEAM_CULTURE', 'LEARNING_OPPORTUNITIES', 'LOCATION_CONVENIENCE', 'BENEFITS_PERKS');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULL_TIME', 'PART_TIME', 'FREELANCE', 'CONTRACT', 'TEMPORARY', 'INTERNSHIP');

-- CreateEnum
CREATE TYPE "Specialization" AS ENUM ('RESIDENTIAL_INSTALLATIONS', 'COMMERCIAL_INSTALLATIONS', 'INDUSTRIAL_INSTALLATIONS', 'MAINTENANCE', 'HIGH_VOLTAGE', 'LOW_VOLTAGE', 'SOLAR_PV', 'EV_CHARGING', 'CONTROL_PANELS', 'PLC_SYSTEMS', 'AUTOMATION', 'BUILDING_MANAGEMENT', 'FIRE_ALARM_SYSTEMS', 'SECURITY_SYSTEMS', 'DATA_CABLING', 'MARINE_ELECTRICAL', 'RENEWABLE_ENERGY');

-- CreateEnum
CREATE TYPE "WorkAuthorization" AS ENUM ('EU_CITIZEN', 'DUTCH_WORK_PERMIT', 'HIGHLY_SKILLED_MIGRANT', 'REQUIRES_SPONSORSHIP');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('NONE', 'BASIC', 'STANDARD', 'ENHANCED', 'PREMIUM');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('UNKNOWN', 'VERY_LOW', 'LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('USER', 'WORKER', 'EMPLOYER', 'OFFER', 'CONVERSATION');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('ID_CARD', 'PASSPORT', 'DRIVERS_LICENSE', 'RESIDENCE_PERMIT', 'BUSINESS_REGISTRATION', 'TAX_DOCUMENT', 'BANK_STATEMENT', 'UTILITY_BILL', 'CERTIFICATE', 'DIPLOMA', 'REFERENCE_LETTER', 'OTHER');

-- CreateEnum
CREATE TYPE "VerificationAction" AS ENUM ('SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED', 'REVOKED', 'FLAGGED', 'REVIEWED', 'UPDATED');

-- CreateEnum
CREATE TYPE "SuspiciousActivityType" AS ENUM ('RAPID_ACCOUNT_CREATION', 'MULTIPLE_FAILED_LOGINS', 'UNUSUAL_LOGIN_LOCATION', 'BULK_DATA_ACCESS', 'RATE_LIMIT_EXCEEDED', 'PAYMENT_ANOMALY', 'PROFILE_MANIPULATION', 'MESSAGE_SPAM', 'FAKE_DOCUMENT_UPLOAD', 'IDENTITY_MISMATCH', 'DUPLICATE_ACCOUNT', 'BOT_BEHAVIOR', 'CIRCUMVENTION_ATTEMPT', 'DATA_SCRAPING');

-- CreateEnum
CREATE TYPE "FraudIndicatorType" AS ENUM ('DOCUMENT_FRAUD', 'IDENTITY_FRAUD', 'PAYMENT_FRAUD', 'ACCOUNT_TAKEOVER', 'SYNTHETIC_IDENTITY', 'BUSINESS_FRAUD', 'REVIEW_MANIPULATION', 'OFFER_FRAUD');

-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('NEW', 'UNDER_REVIEW', 'CONFIRMED', 'FALSE_POSITIVE', 'RESOLVED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "SeverityLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "DuplicateMatchType" AS ENUM ('EMAIL', 'PHONE', 'IP_ADDRESS', 'DEVICE_FINGERPRINT', 'DOCUMENT_NUMBER', 'ADDRESS', 'NAME_SIMILARITY', 'COMPOSITE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "ConsentType" AS ENUM ('PRIVACY_POLICY', 'TERMS_OF_SERVICE', 'COOKIE_ANALYTICS', 'COOKIE_MARKETING', 'DATA_PROCESSING', 'SPECIAL_CATEGORY', 'EMAIL_NOTIFICATIONS', 'PROFILE_VISIBLE', 'MARKETING', 'ID_VERIFICATION', 'KVK_PROCESSING');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('GIVEN', 'WITHDRAWN', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "LegalBasis" AS ENUM ('CONSENT', 'CONTRACT_PERFORMANCE', 'LEGAL_OBLIGATION', 'VITAL_INTEREST', 'PUBLIC_TASK', 'LEGITIMATE_INTEREST', 'EXPLICIT_CONSENT');

-- CreateEnum
CREATE TYPE "DataSubjectRequestType" AS ENUM ('ACCESS', 'RECTIFICATION', 'ERASURE', 'RESTRICT', 'PORTABILITY', 'OBJECT', 'AUTOMATED_DECISION', 'WITHDRAW_CONSENT');

-- CreateEnum
CREATE TYPE "DataSubjectRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ExportStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ExportFormat" AS ENUM ('JSON', 'CSV');

-- CreateEnum
CREATE TYPE "DeletionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BreachSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "BreachStatus" AS ENUM ('INVESTIGATING', 'CONTAINED', 'REPORTED_AUTHORITY', 'NOTIFIED_USERS', 'REMEDIATED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ContentReportTarget" AS ENUM ('USER_PROFILE', 'WORKER_PROFILE', 'EMPLOYER_PROFILE', 'OFFER', 'CONVERSATION', 'MESSAGE', 'REVIEW', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentReportCategory" AS ENUM ('ILLEGAL_CONTENT', 'FRAUD_SCAM', 'HARASSMENT', 'HATE_SPEECH', 'COPYRIGHT_VIOLATION', 'PRIVACY_VIOLATION', 'MISLEADING_INFORMATION', 'CHILD_SAFETY', 'TERRORISM', 'DRUGS_WEAPONS', 'IMPERSONATION', 'SPAM', 'OTHER');

-- CreateEnum
CREATE TYPE "ContentReportStatus" AS ENUM ('RECEIVED', 'ASSESSMENT', 'ACTION_TAKEN', 'NOTIFIED', 'RESOLVED', 'DISMISSED', 'ESCALATED');

-- CreateEnum
CREATE TYPE "ContentReportPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ContentReportAssessment" AS ENUM ('ILLEGAL_CONTENT_FOUND', 'VIOLATES_TERMS', 'NOT_VIOLATION', 'UNCLEAR_NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "ContentReportAction" AS ENUM ('CONTENT_REMOVED', 'CONTENT_HIDDEN', 'ACCOUNT_SUSPENDED', 'ACCOUNT_BANNED', 'WARNING_ISSUED', 'NO_ACTION', 'ESCALATED_TO_AUTHORITIES', 'REFERRED_TO_OUT_OF_COURT');

-- CreateEnum
CREATE TYPE "ContentReportResolution" AS ENUM ('CONTENT_TAKEN_DOWN', 'ACCESS_RESTRICTED', 'ACCOUNT_TERMINATED', 'REPORT_DISMISSED', 'WITHDRAWN_BY_REPORTER');

-- CreateEnum
CREATE TYPE "ContentRestrictionType" AS ENUM ('REMOVAL', 'VISIBILITY_LIMIT', 'GEO_BLOCKING', 'AGE_RESTRICTION', 'ACCOUNT_SUSPENSION', 'ACCOUNT_TERMINATION');

-- CreateEnum
CREATE TYPE "DecisionSource" AS ENUM ('USER_REPORT', 'OWN_INVESTIGATION', 'AUTHORITY_ORDER', 'TRUSTED_FLAGGER', 'AUTOMATED_DETECTION');

-- CreateEnum
CREATE TYPE "AppealStatus" AS ENUM ('PENDING', 'UNDER_REVIEW', 'UPHELD', 'OVERTURNED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "DSAComplaintType" AS ENUM ('CONTENT_MODERATION_DECISION', 'ILLEGAL_CONTENT_RESPONSE', 'PLATFORM_POLICY_VIOLATION', 'TRADER_INFORMATION', 'OTHER');

-- CreateEnum
CREATE TYPE "DSAComplaintStatus" AS ENUM ('SUBMITTED', 'ACKNOWLEDGED', 'INVESTIGATING', 'RESPONSE_PREPARED', 'RESOLVED', 'ESCALATED_ODR', 'CLOSED');

-- CreateEnum
CREATE TYPE "ODRStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'IN_PROGRESS', 'RESOLVED', 'FAILED');

-- CreateEnum
CREATE TYPE "MisuseType" AS ENUM ('FRIVOLOUS_REPORTS', 'ABUSIVE_REPORTS', 'AUTOMATED_ABUSE', 'REPEATED_SAME_REPORT', 'MANIFESTLY_ILLEGAL_CONTENT');

-- CreateEnum
CREATE TYPE "WarningLevel" AS ENUM ('FIRST_WARNING', 'SECOND_WARNING', 'TEMPORARY_REPORTING_SUSPENSION', 'PERMANENT_REPORTING_BAN');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "firstName" TEXT,
    "lastName" TEXT,
    "phone" TEXT,
    "phoneVerified" BOOLEAN NOT NULL DEFAULT false,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "twoFactorSecret" TEXT,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "privacyPolicyVersion" TEXT,
    "privacyPolicyAcceptedAt" TIMESTAMP(3),
    "termsOfServiceVersion" TEXT,
    "termsOfServiceAcceptedAt" TIMESTAMP(3),
    "marketingConsent" BOOLEAN NOT NULL DEFAULT false,
    "analyticsConsent" BOOLEAN NOT NULL DEFAULT false,
    "preferredLocale" TEXT NOT NULL DEFAULT 'en',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RefreshToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RefreshToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationCode" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistedToken" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlacklistedToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Worker" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "regionId" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'NL',
    "years_of_experience" INTEGER,
    "primary_trade" TEXT,
    "headline" TEXT,
    "summary" TEXT,
    "specializations" "Specialization"[],
    "availability" "Availability" NOT NULL DEFAULT 'NOT_AVAILABLE',
    "notice_period_days" INTEGER,
    "desired_salary_min" INTEGER,
    "desired_salary_max" INTEGER,
    "desired_hourly_rate" INTEGER,
    "employment_types" "EmploymentType"[],
    "travel_distance_km" INTEGER DEFAULT 30,
    "has_driving_license" BOOLEAN NOT NULL DEFAULT false,
    "has_own_vehicle" BOOLEAN NOT NULL DEFAULT false,
    "work_authorization" "WorkAuthorization",
    "work_schedule_prefs" "WorkScheduleType"[],
    "industry_prefs" "IndustryType"[],
    "career_priorities" "CareerPriority"[],
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'ALL_VERIFIED',
    "is_profile_complete" BOOLEAN NOT NULL DEFAULT false,
    "profile_completeness_pct" INTEGER NOT NULL DEFAULT 0,
    "reputation_score" INTEGER NOT NULL DEFAULT 50,
    "safety_score" INTEGER NOT NULL DEFAULT 0,
    "immigration_consent_given" BOOLEAN DEFAULT false,
    "immigration_consent_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Worker_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT,
    "isCertification" BOOLEAN NOT NULL DEFAULT false,
    "certificationBody" TEXT,
    "parentSkillId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileSkill" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "level" "SkillLevel" NOT NULL,
    "yearsOfExperience" INTEGER,
    "certificationNumber" TEXT,
    "certifiedBy" TEXT,
    "validUntil" TIMESTAMP(3),
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileSkill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certification" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "skillId" TEXT,
    "name" TEXT NOT NULL,
    "certificationNumber" TEXT,
    "issuingBody" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "isLifetime" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "verificationMethod" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkerLanguage" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "WorkerLanguage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "institution" TEXT,
    "country" TEXT NOT NULL DEFAULT 'NL',
    "year_completed" INTEGER,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectExperience" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "duration_months" INTEGER,
    "responsibilities" TEXT[],
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "description" TEXT,

    CONSTRAINT "ProjectExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "companyTradeName" TEXT,
    "kvkNumber" TEXT NOT NULL,
    "vatNumber" TEXT,
    "companySize" TEXT,
    "industry" TEXT,
    "foundedYear" INTEGER,
    "registeredAddress" JSONB NOT NULL,
    "businessAddress" JSONB,
    "website" TEXT,
    "phone" TEXT,
    "billingEmail" TEXT,
    "verificationStatus" "EmployerVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "reputationScore" INTEGER NOT NULL DEFAULT 50,
    "offerAcceptanceRate" INTEGER NOT NULL DEFAULT 0,
    "avgResponseTimeHours" INTEGER NOT NULL DEFAULT 0,
    "totalOffersSent" INTEGER NOT NULL DEFAULT 0,
    "totalHires" INTEGER NOT NULL DEFAULT 0,
    "billingStatus" TEXT NOT NULL DEFAULT 'active',
    "subscriptionPlan" TEXT NOT NULL DEFAULT 'pay_per_intro',
    "creditBalance" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Employer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Region" (
    "id" TEXT NOT NULL,
    "parentId" TEXT,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "type" "RegionType" NOT NULL,
    "province" TEXT,
    "postalCodePrefix" TEXT,
    "latitude" DECIMAL(65,30),
    "longitude" DECIMAL(65,30),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Region_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "department" TEXT,
    "jobDescription" TEXT NOT NULL,
    "status" "OfferStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "viewedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "withdrawnAt" TIMESTAMP(3),
    "shortlistedAt" TIMESTAMP(3),
    "counteredAt" TIMESTAMP(3),
    "currentVersionId" TEXT,
    "counter_offer_for_id" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferVersion" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isAcceptedVersion" BOOLEAN NOT NULL DEFAULT false,
    "salary_min" INTEGER NOT NULL,
    "salary_max" INTEGER NOT NULL,
    "salary_period" TEXT NOT NULL DEFAULT 'year',
    "hourly_rate" INTEGER,
    "sign_on_bonus" INTEGER NOT NULL DEFAULT 0,
    "performance_bonus_pct" INTEGER NOT NULL DEFAULT 0,
    "overtime_rate" INTEGER,
    "weekend_rate" INTEGER,
    "contract_type" TEXT NOT NULL,
    "contract_duration_months" INTEGER,
    "hours_per_week" INTEGER NOT NULL,
    "start_date_type" TEXT NOT NULL DEFAULT 'flexible',
    "start_date" TIMESTAMP(3),
    "probation_months" INTEGER NOT NULL DEFAULT 2,
    "vacation_days" INTEGER NOT NULL,
    "holiday_allowance_pct" INTEGER NOT NULL DEFAULT 8,
    "pension_contribution_pct" INTEGER NOT NULL DEFAULT 0,
    "training_budget" INTEGER NOT NULL DEFAULT 0,
    "company_vehicle" TEXT NOT NULL,
    "vehicle_type" TEXT,
    "vehicle_value_est" INTEGER,
    "travel_allowance_type" TEXT NOT NULL,
    "travel_allowance_value" INTEGER,
    "phone_provided" BOOLEAN NOT NULL DEFAULT false,
    "tools_provided" BOOLEAN NOT NULL DEFAULT false,
    "schedule_type" TEXT[],
    "on_call_details" TEXT,
    "remote_work_pct" INTEGER NOT NULL DEFAULT 0,
    "travel_required_pct" INTEGER NOT NULL DEFAULT 0,
    "travel_region" TEXT,
    "physical_requirements" TEXT NOT NULL,
    "required_certifications" TEXT[],
    "required_experience_years" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "participant1Id" TEXT NOT NULL,
    "participant2Id" TEXT NOT NULL,
    "workerIdentityRevealed" BOOLEAN NOT NULL DEFAULT false,
    "workerIdentitySnapshot" JSONB,
    "lastMessageAt" TIMESTAMP(3),
    "lastMessagePreview" TEXT,
    "unreadCountWorker" INTEGER NOT NULL DEFAULT 0,
    "unreadCountEmployer" INTEGER NOT NULL DEFAULT 0,
    "isArchivedWorker" BOOLEAN NOT NULL DEFAULT false,
    "isArchivedEmployer" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "contentEncrypted" TEXT,
    "messageType" "MessageType" NOT NULL DEFAULT 'TEXT',
    "attachments" JSONB[],
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isSystemMessage" BOOLEAN NOT NULL DEFAULT false,
    "retention_expires_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedCompany" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisibleCompany" (
    "id" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisibleCompany_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rating" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "raterId" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "ratingOverall" INTEGER NOT NULL,
    "ratingInterviewExperience" INTEGER,
    "ratingTransparency" INTEGER,
    "ratingCommunication" INTEGER,
    "ratingOfferAccuracy" INTEGER,
    "ratingWorkLifeBalance" INTEGER,
    "wouldWorkAgain" BOOLEAN,
    "reviewText" TEXT,
    "reviewTitle" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "isVerifiedHire" BOOLEAN NOT NULL DEFAULT false,
    "flaggedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Rating_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "notificationType" TEXT NOT NULL,
    "category" TEXT,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "actionUrl" TEXT,
    "actionData" JSONB,
    "channelEmail" BOOLEAN NOT NULL DEFAULT false,
    "channelPush" BOOLEAN NOT NULL DEFAULT false,
    "channelSms" BOOLEAN NOT NULL DEFAULT false,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "userRole" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "changes" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "legalBasis" TEXT,
    "dataSubjectRequestRef" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSettings" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'general',
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupportTicket" (
    "id" TEXT NOT NULL,
    "ticketNumber" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assignedToId" TEXT,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
    "status" "TicketStatus" NOT NULL DEFAULT 'OPEN',
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "resolvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupportTicket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketMessage" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isInternal" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminAction" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminAction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmployerVerification" (
    "id" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "kvkVerified" BOOLEAN NOT NULL DEFAULT false,
    "kvkVerifiedAt" TIMESTAMP(3),
    "kvkData" JSONB,
    "vatVerified" BOOLEAN NOT NULL DEFAULT false,
    "vatVerifiedAt" TIMESTAMP(3),
    "companyVerified" BOOLEAN NOT NULL DEFAULT false,
    "companyVerifiedAt" TIMESTAMP(3),
    "documentVerified" BOOLEAN NOT NULL DEFAULT false,
    "documentVerifiedAt" TIMESTAMP(3),
    "verifiedDocuments" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "verificationLevel" "VerificationLevel" NOT NULL DEFAULT 'NONE',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'UNKNOWN',
    "riskScore" INTEGER NOT NULL DEFAULT 50,
    "lastReviewAt" TIMESTAMP(3),
    "lastReviewBy" TEXT,
    "rejectionReason" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmployerVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationDocument" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "documentType" "DocumentType" NOT NULL,
    "documentSubtype" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileHash" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verificationResult" JSONB,
    "rejectionReason" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "expiresAt" TIMESTAMP(3),
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VerificationDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationLog" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" "VerificationAction" NOT NULL,
    "previousStatus" "VerificationStatus",
    "newStatus" "VerificationStatus" NOT NULL,
    "reason" TEXT,
    "performedBy" TEXT,
    "performedById" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SuspiciousActivity" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT,
    "userId" TEXT,
    "activityType" "SuspiciousActivityType" NOT NULL,
    "severity" "SeverityLevel" NOT NULL DEFAULT 'MEDIUM',
    "riskScore" INTEGER NOT NULL DEFAULT 50,
    "description" TEXT NOT NULL,
    "details" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "fingerprint" TEXT,
    "status" "ActivityStatus" NOT NULL DEFAULT 'NEW',
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewNotes" TEXT,
    "actionTaken" TEXT,
    "isFalsePositive" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SuspiciousActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FraudIndicator" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "indicatorType" "FraudIndicatorType" NOT NULL,
    "description" TEXT NOT NULL,
    "severity" "SeverityLevel" NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "isFalsePositive" BOOLEAN NOT NULL DEFAULT false,
    "confidenceScore" INTEGER NOT NULL DEFAULT 50,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FraudIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicateAccountCheck" (
    "id" TEXT NOT NULL,
    "primaryUserId" TEXT NOT NULL,
    "suspectedUserId" TEXT NOT NULL,
    "matchType" "DuplicateMatchType" NOT NULL,
    "matchFields" TEXT[],
    "confidenceScore" INTEGER NOT NULL,
    "isConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "isFalsePositive" BOOLEAN NOT NULL DEFAULT false,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "actionTaken" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DuplicateAccountCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrustScore" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "overallScore" INTEGER NOT NULL DEFAULT 50,
    "scoreGrade" TEXT NOT NULL DEFAULT 'C',
    "employerScore" INTEGER,
    "workerScore" INTEGER,
    "verificationScore" INTEGER,
    "behaviorScore" INTEGER,
    "reputationScore" INTEGER,
    "riskAdjustedScore" INTEGER,
    "scoreHistory" JSONB,
    "factors" JSONB,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlacklistEntry" (
    "id" TEXT NOT NULL,
    "entityType" "EntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "userId" TEXT,
    "reason" TEXT NOT NULL,
    "severity" "SeverityLevel" NOT NULL,
    "source" TEXT NOT NULL,
    "evidence" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BlacklistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "employerId" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "subtotalCents" INTEGER NOT NULL,
    "vatRatePct" INTEGER NOT NULL DEFAULT 21,
    "vatAmountCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),
    "paymentMethod" TEXT,
    "paymentReference" TEXT,
    "notes" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLineItem" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPriceCents" INTEGER NOT NULL,
    "totalCents" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
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

-- CreateTable
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

-- CreateTable
CREATE TABLE "DataSubjectRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" "DataSubjectRequestType" NOT NULL,
    "status" "DataSubjectRequestStatus" NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "rectification_field" TEXT,
    "rectification_value" TEXT,
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

-- CreateTable
CREATE TABLE "DataExportRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ExportStatus" NOT NULL DEFAULT 'PENDING',
    "format" "ExportFormat" NOT NULL DEFAULT 'JSON',
    "filePath" TEXT,
    "fileSize" INTEGER,
    "snapshotData" JSONB,
    "dataCategories" TEXT[],
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataExportRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateTable
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

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "RefreshToken_tokenHash_key" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_userId_idx" ON "RefreshToken"("userId");

-- CreateIndex
CREATE INDEX "RefreshToken_tokenHash_idx" ON "RefreshToken"("tokenHash");

-- CreateIndex
CREATE INDEX "RefreshToken_familyId_idx" ON "RefreshToken"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_tokenHash_idx" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "PasswordResetToken_expiresAt_idx" ON "PasswordResetToken"("expiresAt");

-- CreateIndex
CREATE INDEX "VerificationCode_userId_type_expiresAt_idx" ON "VerificationCode"("userId", "type", "expiresAt");

-- CreateIndex
CREATE INDEX "VerificationCode_codeHash_idx" ON "VerificationCode"("codeHash");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistedToken_jti_key" ON "BlacklistedToken"("jti");

-- CreateIndex
CREATE INDEX "BlacklistedToken_jti_idx" ON "BlacklistedToken"("jti");

-- CreateIndex
CREATE INDEX "BlacklistedToken_expiresAt_idx" ON "BlacklistedToken"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_userId_key" ON "Worker"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Worker_publicId_key" ON "Worker"("publicId");

-- CreateIndex
CREATE INDEX "Worker_userId_idx" ON "Worker"("userId");

-- CreateIndex
CREATE INDEX "Worker_regionId_idx" ON "Worker"("regionId");

-- CreateIndex
CREATE INDEX "Worker_availability_idx" ON "Worker"("availability");

-- CreateIndex
CREATE INDEX "Worker_profileVisibility_idx" ON "Worker"("profileVisibility");

-- CreateIndex
CREATE INDEX "Worker_publicId_idx" ON "Worker"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE INDEX "Skill_category_idx" ON "Skill"("category");

-- CreateIndex
CREATE INDEX "Skill_slug_idx" ON "Skill"("slug");

-- CreateIndex
CREATE INDEX "ProfileSkill_profileId_idx" ON "ProfileSkill"("profileId");

-- CreateIndex
CREATE INDEX "ProfileSkill_skillId_idx" ON "ProfileSkill"("skillId");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileSkill_profileId_skillId_key" ON "ProfileSkill"("profileId", "skillId");

-- CreateIndex
CREATE INDEX "Certification_profileId_idx" ON "Certification"("profileId");

-- CreateIndex
CREATE INDEX "Certification_verificationStatus_idx" ON "Certification"("verificationStatus");

-- CreateIndex
CREATE INDEX "WorkerLanguage_worker_id_idx" ON "WorkerLanguage"("worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "WorkerLanguage_worker_id_language_key" ON "WorkerLanguage"("worker_id", "language");

-- CreateIndex
CREATE INDEX "Education_worker_id_idx" ON "Education"("worker_id");

-- CreateIndex
CREATE INDEX "ProjectExperience_worker_id_idx" ON "ProjectExperience"("worker_id");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_userId_key" ON "Employer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Employer_kvkNumber_key" ON "Employer"("kvkNumber");

-- CreateIndex
CREATE INDEX "Employer_userId_idx" ON "Employer"("userId");

-- CreateIndex
CREATE INDEX "Employer_kvkNumber_idx" ON "Employer"("kvkNumber");

-- CreateIndex
CREATE INDEX "Employer_verificationStatus_idx" ON "Employer"("verificationStatus");

-- CreateIndex
CREATE INDEX "Region_parentId_idx" ON "Region"("parentId");

-- CreateIndex
CREATE INDEX "Region_type_idx" ON "Region"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_publicId_key" ON "Offer"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_currentVersionId_key" ON "Offer"("currentVersionId");

-- CreateIndex
CREATE INDEX "Offer_workerId_idx" ON "Offer"("workerId");

-- CreateIndex
CREATE INDEX "Offer_employerId_idx" ON "Offer"("employerId");

-- CreateIndex
CREATE INDEX "Offer_status_idx" ON "Offer"("status");

-- CreateIndex
CREATE INDEX "Offer_submittedAt_idx" ON "Offer"("submittedAt");

-- CreateIndex
CREATE INDEX "Offer_expiresAt_idx" ON "Offer"("expiresAt");

-- CreateIndex
CREATE INDEX "Offer_workerId_status_idx" ON "Offer"("workerId", "status");

-- CreateIndex
CREATE INDEX "Offer_counter_offer_for_id_idx" ON "Offer"("counter_offer_for_id");

-- CreateIndex
CREATE INDEX "OfferVersion_offerId_idx" ON "OfferVersion"("offerId");

-- CreateIndex
CREATE INDEX "OfferVersion_offerId_version_idx" ON "OfferVersion"("offerId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_offerId_key" ON "Conversation"("offerId");

-- CreateIndex
CREATE INDEX "Conversation_offerId_idx" ON "Conversation"("offerId");

-- CreateIndex
CREATE INDEX "Conversation_participant1Id_idx" ON "Conversation"("participant1Id");

-- CreateIndex
CREATE INDEX "Conversation_participant2Id_idx" ON "Conversation"("participant2Id");

-- CreateIndex
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_recipientId_idx" ON "Message"("recipientId");

-- CreateIndex
CREATE INDEX "Message_recipientId_isRead_idx" ON "Message"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "Message_retention_expires_at_idx" ON "Message"("retention_expires_at");

-- CreateIndex
CREATE INDEX "BlockedCompany_workerId_idx" ON "BlockedCompany"("workerId");

-- CreateIndex
CREATE INDEX "BlockedCompany_employerId_idx" ON "BlockedCompany"("employerId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedCompany_workerId_employerId_key" ON "BlockedCompany"("workerId", "employerId");

-- CreateIndex
CREATE INDEX "VisibleCompany_workerId_idx" ON "VisibleCompany"("workerId");

-- CreateIndex
CREATE INDEX "VisibleCompany_employerId_idx" ON "VisibleCompany"("employerId");

-- CreateIndex
CREATE UNIQUE INDEX "VisibleCompany_workerId_employerId_key" ON "VisibleCompany"("workerId", "employerId");

-- CreateIndex
CREATE UNIQUE INDEX "Rating_offerId_key" ON "Rating"("offerId");

-- CreateIndex
CREATE INDEX "Rating_offerId_idx" ON "Rating"("offerId");

-- CreateIndex
CREATE INDEX "Rating_employerId_idx" ON "Rating"("employerId");

-- CreateIndex
CREATE INDEX "Rating_raterId_idx" ON "Rating"("raterId");

-- CreateIndex
CREATE INDEX "Rating_isPublished_idx" ON "Rating"("isPublished");

-- CreateIndex
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

-- CreateIndex
CREATE INDEX "Notification_notificationType_idx" ON "Notification"("notificationType");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_occurredAt_idx" ON "AuditLog"("occurredAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSettings_key_key" ON "AdminSettings"("key");

-- CreateIndex
CREATE INDEX "AdminSettings_category_idx" ON "AdminSettings"("category");

-- CreateIndex
CREATE INDEX "AdminSettings_key_idx" ON "AdminSettings"("key");

-- CreateIndex
CREATE UNIQUE INDEX "SupportTicket_ticketNumber_key" ON "SupportTicket"("ticketNumber");

-- CreateIndex
CREATE INDEX "SupportTicket_userId_idx" ON "SupportTicket"("userId");

-- CreateIndex
CREATE INDEX "SupportTicket_assignedToId_idx" ON "SupportTicket"("assignedToId");

-- CreateIndex
CREATE INDEX "SupportTicket_status_idx" ON "SupportTicket"("status");

-- CreateIndex
CREATE INDEX "SupportTicket_priority_idx" ON "SupportTicket"("priority");

-- CreateIndex
CREATE INDEX "SupportTicket_createdAt_idx" ON "SupportTicket"("createdAt");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_idx" ON "TicketMessage"("ticketId");

-- CreateIndex
CREATE INDEX "TicketMessage_senderId_idx" ON "TicketMessage"("senderId");

-- CreateIndex
CREATE INDEX "AdminAction_actorId_idx" ON "AdminAction"("actorId");

-- CreateIndex
CREATE INDEX "AdminAction_action_idx" ON "AdminAction"("action");

-- CreateIndex
CREATE INDEX "AdminAction_entityType_entityId_idx" ON "AdminAction"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AdminAction_createdAt_idx" ON "AdminAction"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmployerVerification_employerId_key" ON "EmployerVerification"("employerId");

-- CreateIndex
CREATE INDEX "EmployerVerification_employerId_idx" ON "EmployerVerification"("employerId");

-- CreateIndex
CREATE INDEX "EmployerVerification_verificationLevel_idx" ON "EmployerVerification"("verificationLevel");

-- CreateIndex
CREATE INDEX "EmployerVerification_riskLevel_idx" ON "EmployerVerification"("riskLevel");

-- CreateIndex
CREATE INDEX "VerificationDocument_entityType_entityId_idx" ON "VerificationDocument"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "VerificationDocument_documentType_idx" ON "VerificationDocument"("documentType");

-- CreateIndex
CREATE INDEX "VerificationDocument_status_idx" ON "VerificationDocument"("status");

-- CreateIndex
CREATE INDEX "VerificationLog_entityType_entityId_idx" ON "VerificationLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "VerificationLog_action_idx" ON "VerificationLog"("action");

-- CreateIndex
CREATE INDEX "VerificationLog_createdAt_idx" ON "VerificationLog"("createdAt");

-- CreateIndex
CREATE INDEX "SuspiciousActivity_entityType_entityId_idx" ON "SuspiciousActivity"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "SuspiciousActivity_userId_idx" ON "SuspiciousActivity"("userId");

-- CreateIndex
CREATE INDEX "SuspiciousActivity_activityType_idx" ON "SuspiciousActivity"("activityType");

-- CreateIndex
CREATE INDEX "SuspiciousActivity_severity_idx" ON "SuspiciousActivity"("severity");

-- CreateIndex
CREATE INDEX "SuspiciousActivity_status_idx" ON "SuspiciousActivity"("status");

-- CreateIndex
CREATE INDEX "SuspiciousActivity_createdAt_idx" ON "SuspiciousActivity"("createdAt");

-- CreateIndex
CREATE INDEX "FraudIndicator_entityType_entityId_idx" ON "FraudIndicator"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "FraudIndicator_indicatorType_idx" ON "FraudIndicator"("indicatorType");

-- CreateIndex
CREATE INDEX "FraudIndicator_severity_idx" ON "FraudIndicator"("severity");

-- CreateIndex
CREATE INDEX "DuplicateAccountCheck_primaryUserId_idx" ON "DuplicateAccountCheck"("primaryUserId");

-- CreateIndex
CREATE INDEX "DuplicateAccountCheck_suspectedUserId_idx" ON "DuplicateAccountCheck"("suspectedUserId");

-- CreateIndex
CREATE INDEX "DuplicateAccountCheck_matchType_idx" ON "DuplicateAccountCheck"("matchType");

-- CreateIndex
CREATE UNIQUE INDEX "DuplicateAccountCheck_primaryUserId_suspectedUserId_key" ON "DuplicateAccountCheck"("primaryUserId", "suspectedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "TrustScore_entityId_key" ON "TrustScore"("entityId");

-- CreateIndex
CREATE INDEX "TrustScore_entityType_entityId_idx" ON "TrustScore"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "TrustScore_overallScore_idx" ON "TrustScore"("overallScore");

-- CreateIndex
CREATE INDEX "TrustScore_scoreGrade_idx" ON "TrustScore"("scoreGrade");

-- CreateIndex
CREATE INDEX "BlacklistEntry_entityType_idx" ON "BlacklistEntry"("entityType");

-- CreateIndex
CREATE INDEX "BlacklistEntry_severity_idx" ON "BlacklistEntry"("severity");

-- CreateIndex
CREATE INDEX "BlacklistEntry_isActive_idx" ON "BlacklistEntry"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "BlacklistEntry_entityType_entityId_key" ON "BlacklistEntry"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_offerId_key" ON "Invoice"("offerId");

-- CreateIndex
CREATE INDEX "Invoice_employerId_idx" ON "Invoice"("employerId");

-- CreateIndex
CREATE INDEX "Invoice_employerId_status_idx" ON "Invoice"("employerId", "status");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_issuedAt_idx" ON "Invoice"("issuedAt");

-- CreateIndex
CREATE INDEX "InvoiceLineItem_invoiceId_idx" ON "InvoiceLineItem"("invoiceId");

-- CreateIndex
CREATE INDEX "Consent_userId_idx" ON "Consent"("userId");

-- CreateIndex
CREATE INDEX "Consent_consentType_status_idx" ON "Consent"("consentType", "status");

-- CreateIndex
CREATE INDEX "Consent_createdAt_idx" ON "Consent"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserGdprFlags_userId_key" ON "UserGdprFlags"("userId");

-- CreateIndex
CREATE INDEX "UserGdprFlags_userId_idx" ON "UserGdprFlags"("userId");

-- CreateIndex
CREATE INDEX "UserGdprFlags_processingRestricted_idx" ON "UserGdprFlags"("processingRestricted");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_userId_idx" ON "DataSubjectRequest"("userId");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_requestType_idx" ON "DataSubjectRequest"("requestType");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_status_idx" ON "DataSubjectRequest"("status");

-- CreateIndex
CREATE INDEX "DataSubjectRequest_dueDate_idx" ON "DataSubjectRequest"("dueDate");

-- CreateIndex
CREATE INDEX "DataExportRequest_userId_idx" ON "DataExportRequest"("userId");

-- CreateIndex
CREATE INDEX "DataExportRequest_status_idx" ON "DataExportRequest"("status");

-- CreateIndex
CREATE INDEX "DataDeletionRequest_userId_idx" ON "DataDeletionRequest"("userId");

-- CreateIndex
CREATE INDEX "DataDeletionRequest_status_idx" ON "DataDeletionRequest"("status");

-- CreateIndex
CREATE INDEX "DataDeletionRequest_scheduledDeletionAt_idx" ON "DataDeletionRequest"("scheduledDeletionAt");

-- CreateIndex
CREATE UNIQUE INDEX "ProcessingActivity_name_key" ON "ProcessingActivity"("name");

-- CreateIndex
CREATE INDEX "ProcessingActivity_legalBasis_idx" ON "ProcessingActivity"("legalBasis");

-- CreateIndex
CREATE INDEX "ProcessingActivity_isActive_idx" ON "ProcessingActivity"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DataRetentionPolicy_dataType_key" ON "DataRetentionPolicy"("dataType");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_dataType_idx" ON "DataRetentionPolicy"("dataType");

-- CreateIndex
CREATE INDEX "DataRetentionPolicy_isActive_idx" ON "DataRetentionPolicy"("isActive");

-- CreateIndex
CREATE INDEX "DataBreach_severity_idx" ON "DataBreach"("severity");

-- CreateIndex
CREATE INDEX "DataBreach_status_idx" ON "DataBreach"("status");

-- CreateIndex
CREATE INDEX "DataBreach_discoveredAt_idx" ON "DataBreach"("discoveredAt");

-- CreateIndex
CREATE INDEX "DataProcessingAgreement_processorName_idx" ON "DataProcessingAgreement"("processorName");

-- CreateIndex
CREATE INDEX "DataProcessingAgreement_isActive_idx" ON "DataProcessingAgreement"("isActive");

-- CreateIndex
CREATE INDEX "PrivacyPolicyVersion_documentType_idx" ON "PrivacyPolicyVersion"("documentType");

-- CreateIndex
CREATE INDEX "PrivacyPolicyVersion_isActive_idx" ON "PrivacyPolicyVersion"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "content_reports_publicId_key" ON "content_reports"("publicId");

-- CreateIndex
CREATE INDEX "content_reports_target_type_target_id_idx" ON "content_reports"("target_type", "target_id");

-- CreateIndex
CREATE INDEX "content_reports_status_idx" ON "content_reports"("status");

-- CreateIndex
CREATE INDEX "content_reports_priority_idx" ON "content_reports"("priority");

-- CreateIndex
CREATE INDEX "content_reports_category_idx" ON "content_reports"("category");

-- CreateIndex
CREATE INDEX "content_reports_reporter_id_idx" ON "content_reports"("reporter_id");

-- CreateIndex
CREATE INDEX "content_reports_created_at_idx" ON "content_reports"("created_at");

-- CreateIndex
CREATE INDEX "content_reports_resolved_at_idx" ON "content_reports"("resolved_at");

-- CreateIndex
CREATE UNIQUE INDEX "statement_of_reasons_content_report_id_key" ON "statement_of_reasons"("content_report_id");

-- CreateIndex
CREATE INDEX "statement_of_reasons_restriction_type_idx" ON "statement_of_reasons"("restriction_type");

-- CreateIndex
CREATE INDEX "statement_of_reasons_appeal_status_idx" ON "statement_of_reasons"("appeal_status");

-- CreateIndex
CREATE INDEX "statement_of_reasons_notified_at_idx" ON "statement_of_reasons"("notified_at");

-- CreateIndex
CREATE UNIQUE INDEX "dsa_complaints_complaintNumber_key" ON "dsa_complaints"("complaintNumber");

-- CreateIndex
CREATE INDEX "dsa_complaints_complainant_id_idx" ON "dsa_complaints"("complainant_id");

-- CreateIndex
CREATE INDEX "dsa_complaints_assigned_to_id_idx" ON "dsa_complaints"("assigned_to_id");

-- CreateIndex
CREATE INDEX "dsa_complaints_status_idx" ON "dsa_complaints"("status");

-- CreateIndex
CREATE INDEX "dsa_complaints_complaint_type_idx" ON "dsa_complaints"("complaint_type");

-- CreateIndex
CREATE INDEX "dsa_complaints_submitted_at_idx" ON "dsa_complaints"("submitted_at");

-- CreateIndex
CREATE INDEX "dsa_complaints_target_response_at_idx" ON "dsa_complaints"("target_response_at");

-- CreateIndex
CREATE INDEX "complaint_messages_complaint_id_idx" ON "complaint_messages"("complaint_id");

-- CreateIndex
CREATE INDEX "complaint_messages_sender_id_idx" ON "complaint_messages"("sender_id");

-- CreateIndex
CREATE INDEX "notice_misuse_records_user_id_idx" ON "notice_misuse_records"("user_id");

-- CreateIndex
CREATE INDEX "notice_misuse_records_warningLevel_idx" ON "notice_misuse_records"("warningLevel");

-- CreateIndex
CREATE INDEX "notice_misuse_records_created_at_idx" ON "notice_misuse_records"("created_at");

-- CreateIndex
CREATE INDEX "transparency_reports_period_start_idx" ON "transparency_reports"("period_start");

-- CreateIndex
CREATE INDEX "transparency_reports_is_published_idx" ON "transparency_reports"("is_published");

-- AddForeignKey
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationCode" ADD CONSTRAINT "VerificationCode_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistedToken" ADD CONSTRAINT "BlacklistedToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_parentSkillId_fkey" FOREIGN KEY ("parentSkillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileSkill" ADD CONSTRAINT "ProfileSkill_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileSkill" ADD CONSTRAINT "ProfileSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certification" ADD CONSTRAINT "Certification_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkerLanguage" ADD CONSTRAINT "WorkerLanguage_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectExperience" ADD CONSTRAINT "ProjectExperience_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "OfferVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_counter_offer_for_id_fkey" FOREIGN KEY ("counter_offer_for_id") REFERENCES "Offer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferVersion" ADD CONSTRAINT "OfferVersion_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participant1Id_fkey" FOREIGN KEY ("participant1Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_participant2Id_fkey" FOREIGN KEY ("participant2Id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedCompany" ADD CONSTRAINT "BlockedCompany_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedCompany" ADD CONSTRAINT "BlockedCompany_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibleCompany" ADD CONSTRAINT "VisibleCompany_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisibleCompany" ADD CONSTRAINT "VisibleCompany_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupportTicket" ADD CONSTRAINT "SupportTicket_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "SupportTicket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmployerVerification" ADD CONSTRAINT "EmployerVerification_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationDocument" ADD CONSTRAINT "VerDoc_employer_fk" FOREIGN KEY ("entityId") REFERENCES "EmployerVerification"("employerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VerificationLog" ADD CONSTRAINT "VerLog_employer_fk" FOREIGN KEY ("entityId") REFERENCES "EmployerVerification"("employerId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SuspiciousActivity" ADD CONSTRAINT "SuspAct_user_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudIndicator" ADD CONSTRAINT "FraudInd_worker_fk" FOREIGN KEY ("entityId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FraudIndicator" ADD CONSTRAINT "FraudInd_employer_fk" FOREIGN KEY ("entityId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistEntry" ADD CONSTRAINT "Blacklist_user_fk" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistEntry" ADD CONSTRAINT "Blacklist_worker_fk" FOREIGN KEY ("entityId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlacklistEntry" ADD CONSTRAINT "Blacklist_employer_fk" FOREIGN KEY ("entityId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLineItem" ADD CONSTRAINT "InvoiceLineItem_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Consent" ADD CONSTRAINT "Consent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserGdprFlags" ADD CONSTRAINT "UserGdprFlags_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataSubjectRequest" ADD CONSTRAINT "DataSubjectRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataExportRequest" ADD CONSTRAINT "DataExportRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataDeletionRequest" ADD CONSTRAINT "DataDeletionRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_reports" ADD CONSTRAINT "content_reports_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "statement_of_reasons" ADD CONSTRAINT "statement_of_reasons_content_report_id_fkey" FOREIGN KEY ("content_report_id") REFERENCES "content_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsa_complaints" ADD CONSTRAINT "dsa_complaints_complainant_id_fkey" FOREIGN KEY ("complainant_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsa_complaints" ADD CONSTRAINT "dsa_complaints_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dsa_complaints" ADD CONSTRAINT "dsa_complaints_content_report_id_fkey" FOREIGN KEY ("content_report_id") REFERENCES "content_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_messages" ADD CONSTRAINT "complaint_messages_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "dsa_complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_misuse_records" ADD CONSTRAINT "notice_misuse_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notice_misuse_records" ADD CONSTRAINT "notice_misuse_records_content_report_id_fkey" FOREIGN KEY ("content_report_id") REFERENCES "content_reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

