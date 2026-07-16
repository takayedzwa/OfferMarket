import { IsEmail, IsString, MinLength, Matches, IsOptional, IsObject } from 'class-validator';

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

export class RegisterEmployerDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  password!: string;

  @IsString()
  phone!: string;

  @IsObject()
  company!: { name: string; kvkNumber: string; website?: string };
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

  @IsString()
  adminUserId!: string;
}