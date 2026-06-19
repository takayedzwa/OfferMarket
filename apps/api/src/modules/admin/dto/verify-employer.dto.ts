import { IsString, IsOptional, IsIn } from 'class-validator';

export class VerifyEmployerDto {
  @IsString()
  @IsOptional()
  verificationNotes?: string;

  @IsString()
  @IsOptional()
  verifiedBy?: string;
}
