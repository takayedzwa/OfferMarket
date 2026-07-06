import { IsOptional, IsString } from 'class-validator';

export class MarkInvoicePaidDto {
  @IsOptional()
  @IsString()
  paymentReference?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}