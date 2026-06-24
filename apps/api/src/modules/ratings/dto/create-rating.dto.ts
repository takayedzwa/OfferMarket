import { IsInt, IsOptional, IsString, IsBoolean, Min, Max, Length } from 'class-validator';

/**
 * DTO for creating an employer rating
 *
 * Workers can rate employers on:
 * - Interview experience
 * - Transparency
 * - Communication
 * - Offer accuracy
 * - Work-life balance
 * - Would work there again
 */
export class CreateRatingDto {
  @IsString()
  offerId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  ratingOverall: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingInterviewExperience?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingTransparency?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingCommunication?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingOfferAccuracy?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  ratingWorkLifeBalance?: number;

  @IsOptional()
  @IsBoolean()
  wouldWorkAgain?: boolean;

  @IsOptional()
  @IsString()
  @Length(0, 2000)
  reviewText?: string;

  @IsOptional()
  @IsString()
  @Length(0, 200)
  reviewTitle?: string;
}
