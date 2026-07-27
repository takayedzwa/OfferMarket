import { IsString, IsObject } from 'class-validator';

/**
 * DTO for PATCH /billing/admin/settings.
 * A-H3: previously the controller used an inline body type with no validation
 * class, allowing arbitrary key/value pairs through. This class enforces that
 * `key` is a non-empty string and `value` is a JSON object.
 */
export class UpdateBillingSettingDto {
  @IsString()
  key: string;

  @IsObject()
  value: any;
}