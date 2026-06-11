import { IsString, IsInt, IsOptional, IsArray, IsBoolean, Min, Max, IsIn, ValidateNested, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

// ===========================================================================
// COMPENSATION DTO (must be defined first for CreateOfferDto references)
// ===========================================================================

export class CompensationDto {
  @IsInt()
  @Min(20000)
  salaryMin: number;

  @IsInt()
  @Min(20000)
  salaryMax: number;

  @IsString()
  @IsIn(['hour', 'week', 'month', 'year'])
  @IsOptional()
  salaryPeriod?: string = 'year';

  @IsInt()
  @Min(0)
  @IsOptional()
  hourlyRate?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  signOnBonus?: number = 0;

  @IsInt()
  @Min(0)
  @Max(50)
  @IsOptional()
  performanceBonusPct?: number = 0;

  @IsInt()
  @Min(0)
  @IsOptional()
  overtimeRate?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  weekendRate?: number;
}

// ===========================================================================
// CONTRACT DTO
// ===========================================================================

export class ContractDto {
  @IsString()
  @IsIn(['permanent', 'fixed_term', 'contract', 'freelance', 'part_time'])
  type: string;

  @IsInt()
  @Min(1)
  @Max(36)
  @IsOptional()
  durationMonths?: number;

  @IsInt()
  @Min(12)
  @Max(40)
  hoursPerWeek: number;

  @IsString()
  @IsIn(['flexible', 'specific'])
  @IsOptional()
  startDateType?: string = 'flexible';

  @IsOptional()
  startDate?: Date;

  @IsInt()
  @Min(0)
  @Max(6)
  @IsOptional()
  probationMonths?: number = 2;
}

// ===========================================================================
// BENEFITS DTO
// ===========================================================================

export class BenefitsDto {
  @IsInt()
  @Min(20)
  @Max(40)
  vacationDays: number;

  @IsInt()
  @Min(0)
  @Max(12)
  @IsOptional()
  holidayAllowancePct?: number = 8;

  @IsInt()
  @Min(0)
  @Max(15)
  @IsOptional()
  pensionContributionPct?: number = 0;

  @IsInt()
  @Min(0)
  @IsOptional()
  trainingBudget?: number = 0;

  @IsString()
  @IsIn(['full_use', 'work_only', 'not_provided'])
  companyVehicle: string;

  @IsString()
  @IsOptional()
  vehicleType?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  vehicleValueEst?: number;

  @IsString()
  @IsIn(['per_km', 'ns_card', 'monthly', 'not_provided'])
  travelAllowanceType: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  travelAllowanceValue?: number;

  @IsBoolean()
  @IsOptional()
  phoneProvided?: boolean = false;

  @IsBoolean()
  @IsOptional()
  toolsProvided?: boolean = false;
}

// ===========================================================================
// WORK ARRANGEMENT DTO
// ===========================================================================

export class WorkArrangementDto {
  @IsArray()
  @IsString({ each: true })
  @IsIn(['daytime', 'shift', 'weekend', 'on_call'], { each: true })
  @ArrayMinSize(1)
  scheduleType: string[];

  @IsString()
  @IsOptional()
  onCallDetails?: string;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  remoteWorkPct?: number = 0;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  travelRequiredPct?: number = 0;

  @IsString()
  @IsOptional()
  travelRegion?: string;

  @IsString()
  @IsNotEmpty()
  physicalRequirements: string;
}

// ===========================================================================
// REQUIREMENTS DTO
// ===========================================================================

export class RequirementsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  requiredCertifications: string[];

  @IsInt()
  @Min(0)
  @IsOptional()
  requiredExperienceYears?: number = 0;
}

// ===========================================================================
// CREATE OFFER DTO
// ===========================================================================

export class CreateOfferDto {
  // Basic info
  @IsString()
  @IsNotEmpty()
  jobTitle: string;

  @IsString()
  @IsOptional()
  department?: string;

  @IsString()
  @IsNotEmpty()
  jobDescription: string;

  @IsString()
  workerId: string;

  // Nested DTOs (all required)
  @ValidateNested()
  @Type(() => CompensationDto)
  compensation: CompensationDto;

  @ValidateNested()
  @Type(() => ContractDto)
  contract: ContractDto;

  @ValidateNested()
  @Type(() => BenefitsDto)
  benefits: BenefitsDto;

  @ValidateNested()
  @Type(() => WorkArrangementDto)
  workArrangement: WorkArrangementDto;

  @ValidateNested()
  @Type(() => RequirementsDto)
  requirements: RequirementsDto;

  // Metadata
  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  expiresInDays?: number = 14;

  @IsString()
  @IsOptional()
  source?: string;
}
