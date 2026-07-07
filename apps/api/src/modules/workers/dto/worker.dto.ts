import { IsString, IsInt, IsOptional, IsArray, IsIn, IsBoolean, IsDateString, Min, Max, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Availability, ProfileVisibility, EmploymentType, WorkScheduleType, IndustryType, CareerPriority, Specialization, WorkAuthorization } from '@prisma/client';

/**
 * WORKER DTOs
 *
 * These DTOs are for the worker's PRIVATE profile data
 * (what they see when editing), not the public anonymous view
 */

// Enum values from Prisma for validation
const AVAILABILITY_VALUES = Object.values(Availability);
const PROFILE_VISIBILITY_VALUES = Object.values(ProfileVisibility);
const EMPLOYMENT_TYPE_VALUES = Object.values(EmploymentType);
const WORK_SCHEDULE_VALUES = Object.values(WorkScheduleType);
const INDUSTRY_VALUES = Object.values(IndustryType);
const CAREER_PRIORITY_VALUES = Object.values(CareerPriority);
const SPECIALIZATION_VALUES = Object.values(Specialization);
const WORK_AUTHORIZATION_VALUES = Object.values(WorkAuthorization);
const SKILL_LEVEL_VALUES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT', 'MASTER'];
const LANGUAGE_LEVEL_VALUES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE'];
const VERIFICATION_STATUS_VALUES = ['PENDING', 'VERIFIED', 'EXPIRED', 'REVOKED'];

export class CreateWorkerDto {
  @IsString()
  @IsOptional()
  regionId?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  country?: string = 'NL';

  @IsInt()
  @Min(0)
  @Max(50)
  @IsOptional()
  yearsOfExperience?: number;

  @IsString()
  @IsOptional()
  primaryTrade?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  headline?: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  summary?: string;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((v: string) => v.toUpperCase()))
  @IsIn(SPECIALIZATION_VALUES, { each: true })
  @IsOptional()
  specializations?: string[];

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(AVAILABILITY_VALUES)
  @IsOptional()
  availability?: string;

  @IsInt()
  @Min(0)
  @Max(90)
  @IsOptional()
  noticePeriodDays?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  desiredSalaryMin?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  desiredSalaryMax?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  desiredHourlyRate?: number;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((v: string) => v.toUpperCase()))
  @IsIn(EMPLOYMENT_TYPE_VALUES, { each: true })
  @IsOptional()
  employmentTypes?: string[];

  @IsInt()
  @Min(0)
  @Max(500)
  @IsOptional()
  travelDistanceKm?: number = 30;

  @IsBoolean()
  @IsOptional()
  hasDrivingLicense?: boolean;

  @IsBoolean()
  @IsOptional()
  hasOwnVehicle?: boolean;

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(WORK_AUTHORIZATION_VALUES)
  @IsOptional()
  workAuthorization?: string;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((v: string) => v.toUpperCase()))
  @IsIn(WORK_SCHEDULE_VALUES, { each: true })
  @IsOptional()
  workSchedulePrefs?: string[];

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((v: string) => v.toUpperCase()))
  @IsIn(INDUSTRY_VALUES, { each: true })
  @IsOptional()
  industryPrefs?: string[];

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((v: string) => v.toUpperCase()))
  @IsIn(CAREER_PRIORITY_VALUES, { each: true })
  @IsOptional()
  careerPriorities?: string[];

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(PROFILE_VISIBILITY_VALUES)
  @IsOptional()
  profileVisibility?: string = 'ALL_VERIFIED';
}

export class UpdateWorkerDto {
  @IsString()
  @IsOptional()
  regionId?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsInt()
  @Min(0)
  @Max(50)
  @IsOptional()
  yearsOfExperience?: number;

  @IsString()
  @IsOptional()
  primaryTrade?: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  headline?: string;

  @IsString()
  @MaxLength(1000)
  @IsOptional()
  summary?: string;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((v: string) => v.toUpperCase()))
  @IsIn(SPECIALIZATION_VALUES, { each: true })
  @IsOptional()
  specializations?: string[];

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(AVAILABILITY_VALUES)
  @IsOptional()
  availability?: string;

  @IsInt()
  @Min(0)
  @Max(90)
  @IsOptional()
  noticePeriodDays?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  desiredSalaryMin?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  desiredSalaryMax?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  desiredHourlyRate?: number;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((v: string) => v.toUpperCase()))
  @IsIn(EMPLOYMENT_TYPE_VALUES, { each: true })
  @IsOptional()
  employmentTypes?: string[];

  @IsInt()
  @Min(0)
  @Max(500)
  @IsOptional()
  travelDistanceKm?: number;

  @IsBoolean()
  @IsOptional()
  hasDrivingLicense?: boolean;

  @IsBoolean()
  @IsOptional()
  hasOwnVehicle?: boolean;

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(WORK_AUTHORIZATION_VALUES)
  @IsOptional()
  workAuthorization?: string;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((v: string) => v.toUpperCase()))
  @IsIn(WORK_SCHEDULE_VALUES, { each: true })
  @IsOptional()
  workSchedulePrefs?: string[];

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((v: string) => v.toUpperCase()))
  @IsIn(INDUSTRY_VALUES, { each: true })
  @IsOptional()
  industryPrefs?: string[];

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value?.map((v: string) => v.toUpperCase()))
  @IsIn(CAREER_PRIORITY_VALUES, { each: true })
  @IsOptional()
  careerPriorities?: string[];

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(PROFILE_VISIBILITY_VALUES)
  @IsOptional()
  profileVisibility?: string;
}

export class BlockCompanyDto {
  @IsString()
  employerId: string;

  @IsString()
  @IsOptional()
  reason?: string;
}

// ============================================================================
// PROFILE SKILL DTOs
// ============================================================================

export class CreateProfileSkillDto {
  @IsString()
  skillId: string;

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(SKILL_LEVEL_VALUES)
  level: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  yearsOfExperience?: number;

  @IsString()
  @IsOptional()
  certificationNumber?: string;

  @IsString()
  @IsOptional()
  certifiedBy?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

export class UpdateProfileSkillDto {
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(SKILL_LEVEL_VALUES)
  @IsOptional()
  level?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  yearsOfExperience?: number;

  @IsString()
  @IsOptional()
  certificationNumber?: string;

  @IsString()
  @IsOptional()
  certifiedBy?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;
}

// ============================================================================
// CERTIFICATION DTOs
// ============================================================================

export class CreateCertificationDto {
  @IsString()
  @IsOptional()
  skillId?: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  certificationNumber?: string;

  @IsString()
  issuingBody: string;

  @IsDateString()
  @IsOptional()
  issuedAt?: string;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsBoolean()
  @IsOptional()
  isLifetime?: boolean;

  @IsString()
  @IsOptional()
  documentUrl?: string;
}

export class UpdateCertificationDto {
  @IsString()
  @IsOptional()
  skillId?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  certificationNumber?: string;

  @IsString()
  @IsOptional()
  issuingBody?: string;

  @IsDateString()
  @IsOptional()
  issuedAt?: string;

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsBoolean()
  @IsOptional()
  isLifetime?: boolean;

  @IsString()
  @IsOptional()
  documentUrl?: string;
}

// ============================================================================
// LANGUAGE DTOs
// ============================================================================

export class CreateWorkerLanguageDto {
  @IsString()
  language: string;

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(LANGUAGE_LEVEL_VALUES)
  level: string;
}

export class UpdateWorkerLanguageDto {
  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(LANGUAGE_LEVEL_VALUES)
  level: string;
}

// ============================================================================
// EDUCATION DTOs
// ============================================================================

export class CreateEducationDto {
  @IsString()
  qualification: string;

  @IsString()
  @IsOptional()
  institution?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsInt()
  @Min(1950)
  @Max(2030)
  @IsOptional()
  yearCompleted?: number;
}

export class UpdateEducationDto {
  @IsString()
  @IsOptional()
  qualification?: string;

  @IsString()
  @IsOptional()
  institution?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsInt()
  @Min(1950)
  @Max(2030)
  @IsOptional()
  yearCompleted?: number;
}

// ============================================================================
// PROJECT EXPERIENCE DTOs
// ============================================================================

export class CreateProjectExperienceDto {
  @IsString()
  projectType: string;

  @IsString()
  industry: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMonths?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsibilities?: string[];

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class UpdateProjectExperienceDto {
  @IsString()
  @IsOptional()
  projectType?: string;

  @IsString()
  @IsOptional()
  industry?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  durationMonths?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  responsibilities?: string[];

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  description?: string;
}