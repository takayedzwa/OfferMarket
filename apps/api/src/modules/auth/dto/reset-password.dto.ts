import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

const PASSWORD_MSG = 'Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, and one digit';
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

export class ForgotPasswordDto {
  @IsEmail()
  email!: string;
}

export class ResetPasswordDto {
  @IsString()
  token!: string;

  @IsString()
  @MinLength(8)
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MSG })
  newPassword!: string;
}