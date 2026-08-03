import { IsString, IsIn } from 'class-validator';

/**
 * Supported UI/email locales. To add a language: append its code here AND in
 * apps/web/src/i18n/routing.ts (`locales`). The CI missing-key guard then
 * enforces catalog parity for the new locale.
 */
export const SUPPORTED_LOCALES = ['en', 'nl'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export class UpdatePreferredLocaleDto {
  @IsString()
  @IsIn(SUPPORTED_LOCALES, {
    message: 'preferredLocale must be one of: ' + SUPPORTED_LOCALES.join(', '),
  })
  preferredLocale!: SupportedLocale;
}