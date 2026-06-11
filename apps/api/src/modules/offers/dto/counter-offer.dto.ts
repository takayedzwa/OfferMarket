import { IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * COUNTER OFFER DTO
 *
 * Worker can counter specific fields of an offer.
 * Only includes fields the worker wants to negotiate.
 */

export class CounterOfferDto {
  @IsInt()
  @Min(20000)
  @IsOptional()
  salaryMin?: number;

  @IsInt()
  @Min(20000)
  @IsOptional()
  salaryMax?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  signOnBonus?: number;

  @IsInt()
  @Min(20)
  @Max(40)
  @IsOptional()
  vacationDays?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  trainingBudget?: number;

  @IsInt()
  @Min(0)
  @Max(100)
  @IsOptional()
  remoteWorkPct?: number;
}
