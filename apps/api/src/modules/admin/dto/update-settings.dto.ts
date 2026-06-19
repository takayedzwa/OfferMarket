import { IsString, IsOptional, IsBoolean, IsObject } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  key: string;

  @IsObject()
  value: any;

  @IsString()
  @IsOptional()
  category?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
