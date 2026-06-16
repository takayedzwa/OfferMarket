import { IsString, IsInt, IsOptional, IsArray, IsIn, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';
import { Availability, ProfileVisibility, EmploymentType, WorkScheduleType, IndustryType, CareerPriority } from '@prisma/client';

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
