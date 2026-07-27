import {
  IsString,
  IsOptional,
  IsInt,
  IsEmail,
  IsIn,
  Matches,
  Length,
  Min,
  Max,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

const KVK_REGEX = /^\d{8}$/;
const VAT_REGEX = /^NL\d{9}B\d{2}$/;

const COMPANY_SIZES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+',
];

class AddressDto {
  @IsString()
  @Length(1, 200)
  street: string;

  @IsString()
  @Length(1, 20)
  houseNumber: string;

  @IsString()
  @Length(1, 20)
  @IsOptional()
  houseNumberAddition?: string;

  @IsString()
  @Matches(/^[1-9]\d{3}\s?[A-Z]{2}$/, { message: 'postalCode must be a valid Dutch postal code' })
  postalCode: string;

  @IsString()
  @Length(1, 100)
  city: string;

  @IsString()
  @Length(2, 2)
  country: string;
}

/**
 * DTO for updating an employer profile.
 *
 * SECURITY (E-C2 / E-C5): Every field is optional (partial update) but only
 * the editable profile fields are declared. Protected fields such as
 * verificationStatus, verifiedAt, reputationScore, offerAcceptanceRate,
 * totalOffersSent, totalHires, billingStatus, subscriptionPlan and
 * creditBalance are intentionally absent. Combined with the global
 * ValidationPipe (`whitelist: true, forbidNonWhitelisted: true`), this
 * prevents mass assignment of verification/billing/reputation fields — an
 * employer cannot self-verify as PREMIUM_VERIFIED.
 */
export class UpdateEmployerProfileDto {
  @IsString()
  @Length(2, 100)
  @IsOptional()
  companyName?: string;

  @IsString()
  @Length(2, 100)
  @IsOptional()
  companyTradeName?: string;

  @IsString()
  @Matches(KVK_REGEX, { message: 'kvkNumber must be exactly 8 digits' })
  @IsOptional()
  kvkNumber?: string;

  @IsString()
  @Matches(VAT_REGEX, { message: 'vatNumber must be a valid Dutch VAT number (NL000000000B00)' })
  @IsOptional()
  vatNumber?: string;

  @IsString()
  @IsIn(COMPANY_SIZES)
  @IsOptional()
  companySize?: string;

  @IsString()
  @Length(2, 100)
  @IsOptional()
  industry?: string;

  @IsInt()
  @Min(1800)
  @Max(new Date().getFullYear())
  @IsOptional()
  foundedYear?: number;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  registeredAddress?: AddressDto;

  @ValidateNested()
  @Type(() => AddressDto)
  @IsOptional()
  businessAddress?: AddressDto;

  @IsString()
  @Length(3, 200)
  @IsOptional()
  website?: string;

  @IsString()
  @Length(4, 30)
  @IsOptional()
  phone?: string;

  @IsEmail()
  @IsOptional()
  billingEmail?: string;
}