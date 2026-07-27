import { IsEmail, IsString, MinLength, Matches, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const PASSWORD_MSG = 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one digit';
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export class RegisterWorkerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;

  @IsString()
  @IsOptional()
  phone?: string;
}

/**
 * Nested company payload for employer registration.
 * SECURITY (E-H5): Previously `company` was typed as a plain `@IsObject()`,
 * which only checked that a value was an object — the nested `kvkNumber` and
 * `name` fields were never validated. `@ValidateNested()` + `@Type()` make
 * class-transformer instantiate this class so its decorators actually run.
 * KvK (Kamer van Koophandel) numbers are exactly 8 digits.
 */
export class RegisterEmployerCompanyDto {
  @IsString()
  name!: string;

  @Matches(/^\d{8}$/, { message: 'kvkNumber must be exactly 8 digits' })
  kvkNumber!: string;

  @IsString()
  @IsOptional()
  website?: string;
}

export class RegisterEmployerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;

  @IsString()
  phone!: string;

  @ValidateNested()
  @Type(() => RegisterEmployerCompanyDto)
  company!: RegisterEmployerCompanyDto;
}

export class RegisterAdminDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;

  @IsString()
  adminCode!: string;
}

export class RegisterSupportDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;

  // A-C2: deprecated — the admin's identity is now taken from the JWT
  // (req.user.id) by the controller, not from the request body. Kept optional
  // for backward compatibility but no longer trusted or required.
  @IsOptional()
  @IsString()
  adminUserId?: string;
}