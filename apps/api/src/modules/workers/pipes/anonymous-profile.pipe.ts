import { Injectable, PipeTransform, ForbiddenException } from '@nestjs/common';

/**
 * ANONYMOUS PROFILE PIPE
 *
 * This pipe enforces the core innovation: ANONYMOUS WORKER PROFILES
 *
 * It ensures NO identifying information can leak to employers.
 * This is a security-critical component that must be audited regularly.
 */

interface SafeProfile {
  publicId: string;
  headline: string | null;
  summary: string | null;
  region: any;
  yearsOfExperience: number | null;
  primaryTrade: string | null;
  specializations: string[];
  skills: any[];
  certifications: any[];
  languages: any[];
  education: any[];
  projectExperiences: any[];
  availability: string;
  hasDrivingLicense: boolean;
  hasOwnVehicle: boolean;
  travelDistanceKm: number | null;
  workAuthorization: string | null;  // GDPR Article 9: Only shown with explicit consent
  hasWorkAuthorization: boolean;      // Binary flag: does the worker have any work authorization?
  desiredSalaryRange: any;
  employmentTypes: string[];
  workSchedulePrefs: string[];
  industryPrefs: string[];
  careerPriorities: string[];
  profileCompletenessPct: number;
  reputationScore: number;
  safetyScore: number;
  badges: string[];
  lastActive: Date;
  _meta: {
    identityRevealed: boolean;
    identityRevealedOn: string;
    hidden: Record<string, string>;
  };
}

@Injectable()
export class AnonymousProfilePipe implements PipeTransform {
  // EXPLICIT WHITELIST: Only these fields can be shown to employers
  private readonly ALLOWED_FIELDS = new Set([
    'publicId',
    'headline',
    'summary',
    'region',
    'yearsOfExperience',
    'primaryTrade',
    'specializations',
    'skills',
    'certifications',
    'languages',
    'education',
    'projectExperiences',
    'availability',
    'hasDrivingLicense',
    'hasOwnVehicle',
    'travelDistanceKm',
    'workAuthorization',  // GDPR: Only populated when worker has given explicit immigration consent
    'hasWorkAuthorization', // GDPR: Binary flag — safe to show without consent
    'desiredSalaryRange',
    'employmentTypes',
    'workSchedulePrefs',
    'industryPrefs',
    'careerPriorities',
    'profileCompletenessPct',
    'reputationScore',
    'safetyScore',
    'badges',
    'lastActive',
    '_meta'
  ]);

  // EXPLICIT BLACKLIST: These fields must NEVER appear in public profiles
  private readonly BLACKLISTED_FIELDS = new Set([
    'userId',
    'name',
    'email',
    'phone',
    'postalCode',
    'city',
    'exactAddress',
    'currentEmployer',
    'profilePhoto',
    'deletedAt',
    'id',  // Internal ID, not publicId
    'immigrationConsentGiven',  // GDPR: Never expose consent status
    'immigrationConsentAt',     // GDPR: Never expose consent timestamps
  ]);

  transform(value: any): SafeProfile {
    // Build safe profile from whitelisted fields only
    const safeProfile: any = {};

    for (const field of this.ALLOWED_FIELDS) {
      if (value.hasOwnProperty(field)) {
        safeProfile[field] = value[field];
      }
    }

    // CRITICAL: Double-check no blacklisted fields leaked through
    // This is a defense-in-depth measure
    for (const field of this.BLACKLISTED_FIELDS) {
      if (safeProfile.hasOwnProperty(field)) {
        // SECURITY VIOLATION - This should never happen
        console.error(
          `🚨 SECURITY VIOLATION: Blacklisted field "${field}" found in public profile. ` +
          `This indicates a bug in the profile transformation logic. ` +
          `Worker ID: ${value.id || 'unknown'}`
        );

        throw new ForbiddenException(
          'Internal error: Profile transformation failed. Security team has been notified.'
        );
      }
    }

    // CRITICAL: Verify no nested identifying information
    this.verifyNestedFields(safeProfile);

    // Ensure meta information is always present
    if (!safeProfile._meta) {
      safeProfile._meta = {
        identityRevealed: false,
        identityRevealedOn: 'offer_acceptance',
        hidden: {
          name: 'REDACTED',
          email: 'REDACTED',
          phone: 'REDACTED',
          exactAddress: 'REDACTED',
          currentEmployer: 'REDACTED',
          workAuthorizationDetail: 'REDACTED'
        }
      };
    }

    return safeProfile as SafeProfile;
  }

  /**
   * Recursively verify no identifying information in nested objects
   */
  private verifyNestedFields(obj: any, path: string = ''): void {
    if (!obj || typeof obj !== 'object') return;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Check for identifying field names
      if (this.isIdentifyingField(key)) {
        console.error(
          `🚨 SECURITY VIOLATION: Identifying field "${currentPath}" found in profile. ` +
          `Worker ID: ${obj.id || 'unknown'}`
        );
        throw new ForbiddenException(
          'Internal error: Profile contains identifying information.'
        );
      }

      // Check for email patterns in values
      if (typeof value === 'string') {
        if (this.looksLikeEmail(value)) {
          console.error(
            `🚨 SECURITY VIOLATION: Email address found in "${currentPath}". ` +
            `Worker ID: ${obj.id || 'unknown'}`
          );
          throw new ForbiddenException(
            'Internal error: Profile contains email address.'
          );
        }

        if (this.looksLikePhone(value)) {
          console.error(
            `🚨 SECURITY VIOLATION: Phone number found in "${currentPath}". ` +
            `Worker ID: ${obj.id || 'unknown'}`
          );
          throw new ForbiddenException(
            'Internal error: Profile contains phone number.'
          );
        }
      }

      // Recurse into nested objects
      if (typeof value === 'object' && value !== null) {
        this.verifyNestedFields(value, currentPath);
      }
    }
  }

  /**
   * SECURITY: Uses exact-match or anchored-word patterns instead of
   * simple substring matching to avoid false positives like "companyVehicle"
   * being flagged as identifying (just because it contains "company").
   */
  private isIdentifyingField(fieldName: string): boolean {
    const lowerField = fieldName.toLowerCase();

    // Exact matches — fields that are ALWAYS identifying
    const exactMatches: Set<string> = new Set([
      'email',
      'phone',
      'mobile',
      'address',
      'street',
      'postalcode',
      'zipcode',
      'postcode',
      'employer',
      'company',
      'name',
      'firstname',
      'lastname',
      'surname',
      'fullname',
      'username',
      'password',
      'passwordhash',
      'ssn',
      'birthdate',
      'dateofbirth',
      'nationalid',
      'passportnumber',
    ]);
    if (exactMatches.has(lowerField)) return true;

    // Word-boundary patterns — catch camelCase/slug variants without
    // false-triggering on compound words like "companyVehicle" or "hasDrivingLicense".
    // e.g. "companyName" matches (company + Name), but "companyVehicle" does NOT match
    // because "vehicle" is not an identifying word.
    const identifyingWords = [
      'email', 'phone', 'mobile', 'address', 'street', 'postal',
      'zipcode', 'postcode', 'employer', 'company', 'name',
      'firstname', 'lastname', 'surname', 'fullname', 'username',
      'password', 'ssn', 'birthdate', 'dateofbirth', 'nationalid',
      'passportnumber', 'photo', 'avatar',
    ];

    // Split camelCase into words and check if an identifying word is followed
    // by another identifying word or stands alone as the last word.
    const words = lowerField.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().split(/[^a-z0-9]+/);

    for (let i = 0; i < words.length; i++) {
      if (identifyingWords.includes(words[i])) {
        // If it's a standalone match or followed by another identifying word, flag it.
        // e.g., "companyName" → words = ["company", "name"] → both identifying → FLAG
        // e.g., "companyVehicle" → words = ["company", "vehicle"] → "vehicle" is not identifying → NO FLAG
        const isLastWord = i === words.length - 1;
        const nextWordIsIdentifying = !isLastWord && identifyingWords.includes(words[i + 1]);
        if (isLastWord || nextWordIsIdentifying) {
          return true;
        }
      }
    }

    return false;
  }

  private looksLikeEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  private looksLikePhone(value: string): boolean {
    const phoneRegex = /^(\+31|0)[0-9]{9,}$/;
    return phoneRegex.test(value.replace(/[\s.-]/g, ''));
  }
}