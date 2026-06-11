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

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
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

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
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
    "availability" "Availability" NOT NULL DEFAULT 'NOT_AVAILABLE',
    "notice_period_days" INTEGER,
    "desired_salary_min" INTEGER,
    "desired_salary_max" INTEGER,
    "desired_hourly_rate" INTEGER,
    "employment_types" TEXT[],
    "travel_distance_km" INTEGER DEFAULT 30,
    "work_schedule_prefs" TEXT[],
    "industry_prefs" TEXT[],
    "career_priorities" TEXT[],
    "profileVisibility" "ProfileVisibility" NOT NULL DEFAULT 'ALL_VERIFIED',
    "is_profile_complete" BOOLEAN NOT NULL DEFAULT false,
    "profile_completeness_pct" INTEGER NOT NULL DEFAULT 0,
    "reputation_score" INTEGER NOT NULL DEFAULT 50,
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
    "occurredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

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
CREATE INDEX "BlockedCompany_workerId_idx" ON "BlockedCompany"("workerId");

-- CreateIndex
CREATE INDEX "BlockedCompany_employerId_idx" ON "BlockedCompany"("employerId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedCompany_workerId_employerId_key" ON "BlockedCompany"("workerId", "employerId");

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

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Worker" ADD CONSTRAINT "Worker_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "Employer" ADD CONSTRAINT "Employer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Region" ADD CONSTRAINT "Region_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Region"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_currentVersionId_fkey" FOREIGN KEY ("currentVersionId") REFERENCES "OfferVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedCompany" ADD CONSTRAINT "BlockedCompany_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BlockedCompany" ADD CONSTRAINT "BlockedCompany_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_raterId_fkey" FOREIGN KEY ("raterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rating" ADD CONSTRAINT "Rating_employerId_fkey" FOREIGN KEY ("employerId") REFERENCES "Employer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
