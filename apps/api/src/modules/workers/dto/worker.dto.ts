import { IsString, IsInt, IsOptional, IsArray, IsIn, Min, Max, ArrayMinSize, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * WORKER DTOs
 *
 * These DTOs are for the worker's PRIVATE profile data
 * (what they see when editing), not the public anonymous view
 */

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
  @IsIn(['IMMEDIATE', 'ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'NOT_AVAILABLE'])
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
  @IsOptional()
  employmentTypes?: string[];

  @IsInt()
  @Min(0)
  @Max(500)
  @IsOptional()
  travelDistanceKm?: number = 30;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  workSchedulePrefs?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  industryPrefs?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  careerPriorities?: string[];

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(['ALL_VERIFIED', 'SELECTED_COMPANIES', 'HIDDEN'])
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
  @IsIn(['IMMEDIATE', 'ONE_MONTH', 'THREE_MONTHS', 'SIX_MONTHS', 'NOT_AVAILABLE'])
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
  @IsOptional()
  employmentTypes?: string[];

  @IsInt()
  @Min(0)
  @Max(500)
  @IsOptional()
  travelDistanceKm?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  workSchedulePrefs?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  industryPrefs?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  careerPriorities?: string[];

  @IsString()
  @Transform(({ value }) => value?.toUpperCase())
  @IsIn(['ALL_VERIFIED', 'SELECTED_COMPANIES', 'HIDDEN'])
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
