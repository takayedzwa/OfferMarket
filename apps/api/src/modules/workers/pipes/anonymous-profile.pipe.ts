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
  region: any;
  yearsOfExperience: number | null;
  primaryTrade: string | null;
  skills: any[];
  certifications: any[];
  availability: string;
  desiredSalaryRange: any;
  employmentTypes: string[];
  travelDistanceKm: number | null;
  workSchedulePrefs: string[];
  industryPrefs: string[];
  careerPriorities: string[];
  profileCompletenessPct: number;
  reputationScore: number;
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
    'region',
    'yearsOfExperience',
    'primaryTrade',
    'skills',
    'certifications',
    'availability',
    'desiredSalaryRange',
    'employmentTypes',
    'travelDistanceKm',
    'workSchedulePrefs',
    'industryPrefs',
    'careerPriorities',
    'profileCompletenessPct',
    'reputationScore',
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
    'id'  // Internal ID, not publicId
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
        // Log this incident and throw error
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
          currentEmployer: 'REDACTED'
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

  private isIdentifyingField(fieldName: string): boolean {
    const identifyingPatterns = [
      'email',
      'phone',
      'mobile',
      'address',
      'street',
      'postal',
      'zipcode',
      'postcode',
      'employer',
      'company',
      'name',
      'firstname',
      'lastname',
      'surname'
    ];

    const lowerField = fieldName.toLowerCase();
    return identifyingPatterns.some(pattern => lowerField.includes(pattern));
  }

  private looksLikeEmail(value: string): boolean {
    // Simple email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  private looksLikePhone(value: string): boolean {
    // Simple phone regex for NL numbers
    const phoneRegex = /^(\+31|0)[0-9]{9,}$/;
    return phoneRegex.test(value.replace(/[\s.-]/g, ''));
  }
}
