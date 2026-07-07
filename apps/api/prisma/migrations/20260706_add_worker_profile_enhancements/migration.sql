-- AlterEnum: Add Specialization values
ALTER TYPE "IndustryType" ADD VALUE IF NOT EXISTS 'FOOD_PROCESSING';
ALTER TYPE "IndustryType" ADD VALUE IF NOT EXISTS 'LOGISTICS';
ALTER TYPE "IndustryType" ADD VALUE IF NOT EXISTS 'DATA_CENTERS';

-- CreateEnum: Specialization
CREATE TYPE "Specialization" AS ENUM (
  'RESIDENTIAL_INSTALLATIONS',
  'COMMERCIAL_INSTALLATIONS',
  'INDUSTRIAL_INSTALLATIONS',
  'MAINTENANCE',
  'HIGH_VOLTAGE',
  'LOW_VOLTAGE',
  'SOLAR_PV',
  'EV_CHARGING',
  'CONTROL_PANELS',
  'PLC_SYSTEMS',
  'AUTOMATION',
  'BUILDING_MANAGEMENT',
  'FIRE_ALARM_SYSTEMS',
  'SECURITY_SYSTEMS',
  'DATA_CABLING',
  'MARINE_ELECTRICAL',
  'RENEWABLE_ENERGY'
);

-- CreateEnum: WorkAuthorization
CREATE TYPE "WorkAuthorization" AS ENUM (
  'EU_CITIZEN',
  'DUTCH_WORK_PERMIT',
  'HIGHLY_SKILLED_MIGRANT',
  'REQUIRES_SPONSORSHIP'
);

-- AlterTable: Add new columns to Worker
ALTER TABLE "Worker" ADD COLUMN "headline" TEXT;
ALTER TABLE "Worker" ADD COLUMN "summary" TEXT;
ALTER TABLE "Worker" ADD COLUMN "specializations" "Specialization"[] DEFAULT ARRAY[]::"Specialization"[];
ALTER TABLE "Worker" ADD COLUMN "has_driving_license" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Worker" ADD COLUMN "has_own_vehicle" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Worker" ADD COLUMN "work_authorization" "WorkAuthorization";
ALTER TABLE "Worker" ADD COLUMN "safety_score" INTEGER NOT NULL DEFAULT 0;

-- CreateTable: WorkerLanguage
CREATE TABLE "WorkerLanguage" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "level" TEXT NOT NULL,

    CONSTRAINT "WorkerLanguage_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WorkerLanguage_workerId_language_key" ON "WorkerLanguage"("worker_id", "language");
CREATE INDEX "WorkerLanguage_workerId_idx" ON "WorkerLanguage"("worker_id");

-- Add foreign key for WorkerLanguage
ALTER TABLE "WorkerLanguage" ADD CONSTRAINT "WorkerLanguage_workerId_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: Education
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "institution" TEXT,
    "country" TEXT NOT NULL DEFAULT 'NL',
    "year_completed" INTEGER,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Education_workerId_idx" ON "Education"("worker_id");

-- Add foreign key for Education
ALTER TABLE "Education" ADD CONSTRAINT "Education_workerId_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: ProjectExperience
CREATE TABLE "ProjectExperience" (
    "id" TEXT NOT NULL,
    "worker_id" TEXT NOT NULL,
    "project_type" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "duration_months" INTEGER,
    "responsibilities" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "description" TEXT,

    CONSTRAINT "ProjectExperience_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProjectExperience_workerId_idx" ON "ProjectExperience"("worker_id");

-- Add foreign key for ProjectExperience
ALTER TABLE "ProjectExperience" ADD CONSTRAINT "ProjectExperience_workerId_fkey" FOREIGN KEY ("worker_id") REFERENCES "Worker"("id") ON DELETE CASCADE ON UPDATE CASCADE;