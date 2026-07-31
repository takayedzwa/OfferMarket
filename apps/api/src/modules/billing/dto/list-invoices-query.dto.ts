import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class ListInvoicesQueryDto {
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  unpaidOnly?: boolean;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class AdminListInvoicesQueryDto {
  @IsOptional()
  @IsString()
  employerId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}