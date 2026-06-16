import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

/**
 * OFFER VALIDATION PIPE
 *
 * This pipe enforces the core innovation: STRUCTURED OFFERS
 * No offer can be submitted without ALL required fields.
 * No "competitive salary" - specific numbers required.
 */

interface OfferValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

@Injectable()
export class OfferValidationPipe implements PipeTransform {
  transform(value: any): any {
    // Only validate objects, not primitives (query params, etc.)
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return value;
    }

    const result = this.validate(value);

    if (!result.valid) {
      const errorMessages = result.errors.map(e => `${e.field || 'Offer'}: ${e.message}`).join('; ');
      throw new BadRequestException(errorMessages);
    }

    return value;
  }

  private validate(offer: any): OfferValidationResult {
    const errors: ValidationError[] = [];

    // ========================================================================
    // COMPENSATION VALIDATION (ALL REQUIRED)
    // ========================================================================

    // Check if compensation has salary object or direct properties
    const comp = offer?.compensation;
    const salaryMin = comp?.salary?.min ?? comp?.salaryMin;
    const salaryMax = comp?.salary?.max ?? comp?.salaryMax;

    if (comp && typeof comp === 'object') {
      if (salaryMin === undefined || salaryMin === null) {
        errors.push({
          code: 'OFFER_VALIDATION_SALARY_MIN_REQUIRED',
          message: 'Minimum salary is required. "Competitive salary" is not allowed.',
          field: 'compensation.salaryMin'
        });
      } else if (salaryMin < 20000) {
        errors.push({
          code: 'OFFER_VALIDATION_SALARY_MINIMUM',
          message: 'Minimum salary must be at least €20,000/year',
          field: 'compensation.salaryMin'
        });
      }

      if (salaryMax === undefined || salaryMax === null) {
        errors.push({
          code: 'OFFER_VALIDATION_SALARY_MAX_REQUIRED',
          message: 'Maximum salary is required',
          field: 'compensation.salaryMax'
        });
      } else if (salaryMin && salaryMax && (salaryMax - salaryMin > 5000)) {
        errors.push({
          code: 'OFFER_VALIDATION_SALARY_RANGE_MAX_SPREAD',
          message: 'Salary range cannot exceed €5,000. Be specific about compensation.',
          field: 'compensation.salaryRange'
        });
      }

      if (salaryMax && salaryMin && salaryMax < salaryMin) {
        errors.push({
          code: 'OFFER_VALIDATION_SALARY_MAX_BELOW_MIN',
          message: 'Maximum salary must be greater than minimum salary',
          field: 'compensation.salaryMax'
        });
      }
    } else {
      errors.push({
        code: 'OFFER_VALIDATION_COMPENSATION_REQUIRED',
        message: 'Compensation details are required'
      });
    }

    // ========================================================================
    // CONTRACT VALIDATION (ALL REQUIRED)
    // ========================================================================

    if (offer.contract) {
      // Hours per week: 12-40
      if (offer.contract.hoursPerWeek === undefined) {
        errors.push({
          code: 'OFFER_VALIDATION_HOURS_REQUIRED',
          message: 'Hours per week is required',
          field: 'contract.hoursPerWeek'
        });
      } else if (offer.contract.hoursPerWeek < 12 || offer.contract.hoursPerWeek > 40) {
        errors.push({
          code: 'OFFER_VALIDATION_HOURS_INVALID',
          message: 'Hours per week must be between 12 and 40',
          field: 'contract.hoursPerWeek'
        });
      }

      // Probation months: 0-6
      if (offer.contract.probationMonths === undefined && offer.contract.probationPeriodMonths === undefined) {
        errors.push({
          code: 'OFFER_VALIDATION_PROBATION_REQUIRED',
          message: 'Probation period is required (use 0 if none)',
          field: 'contract.probationMonths'
        });
      } else {
        const probationMonths = offer.contract.probationMonths ?? offer.contract.probationPeriodMonths ?? 0;
        if (probationMonths > 6) {
          errors.push({
            code: 'OFFER_VALIDATION_PROBATION_MAX',
            message: 'Probation period cannot exceed 6 months',
            field: 'contract.probationMonths'
          });
        }
      }

      // Contract type required
      if (!offer.contract.type) {
        errors.push({
          code: 'OFFER_VALIDATION_CONTRACT_TYPE_REQUIRED',
          message: 'Contract type is required',
          field: 'contract.type'
        });
      }
    } else {
      errors.push({
        code: 'OFFER_VALIDATION_CONTRACT_REQUIRED',
        message: 'Contract terms are required'
      });
    }

    // ========================================================================
    // BENEFITS VALIDATION (ALL REQUIRED)
    // ========================================================================

    if (offer.benefits) {
      // Vacation days: 20-40 (NL minimum is 20)
      if (offer.benefits.vacationDays === undefined) {
        errors.push({
          code: 'OFFER_VALIDATION_VACATION_DAYS_REQUIRED',
          message: 'Vacation days is required (minimum 20 per NL law)',
          field: 'benefits.vacationDays'
        });
      } else if (offer.benefits.vacationDays < 20) {
        errors.push({
          code: 'OFFER_VALIDATION_VACATION_DAYS_MINIMUM',
          message: 'Vacation days must be at least 20 (NL legal minimum)',
          field: 'benefits.vacationDays'
        });
      } else if (offer.benefits.vacationDays > 40) {
        errors.push({
          code: 'OFFER_VALIDATION_VACATION_DAYS_MAX',
          message: 'Vacation days cannot exceed 40',
          field: 'benefits.vacationDays'
        });
      }

      // Holiday allowance percentage
      if (offer.benefits.holidayAllowancePct === undefined && offer.benefits.holidayAllowance === undefined) {
        errors.push({
          code: 'OFFER_VALIDATION_HOLIDAY_ALLOWANCE_REQUIRED',
          message: 'Holiday allowance percentage is required',
          field: 'benefits.holidayAllowancePct'
        });
      }

      // Pension contribution percentage
      if (offer.benefits.pensionContributionPct === undefined && offer.benefits.pensionContribution === undefined) {
        errors.push({
          code: 'OFFER_VALIDATION_PENSION_REQUIRED',
          message: 'Pension contribution percentage is required',
          field: 'benefits.pensionContributionPct'
        });
      } else {
        const pensionPct = offer.benefits.pensionContributionPct ?? offer.benefits.pensionContribution ?? 0;
        if (pensionPct > 15) {
          errors.push({
            code: 'OFFER_VALIDATION_PENSION_EXCESSIVE',
            message: 'Pension contribution cannot exceed 15%',
            field: 'benefits.pensionContributionPct'
          });
        }
      }

      // Training budget (required, can be 0)
      if (offer.benefits.trainingBudget === undefined && offer.benefits.educationBudget === undefined) {
        errors.push({
          code: 'OFFER_VALIDATION_TRAINING_BUDGET_REQUIRED',
          message: 'Training budget is required (use 0 if not offered)',
          field: 'benefits.trainingBudget'
        });
      }

      // Company vehicle (required)
      if (!offer.benefits.companyVehicle) {
        errors.push({
          code: 'OFFER_VALIDATION_COMPANY_VEHICLE_REQUIRED',
          message: 'Company vehicle status is required',
          field: 'benefits.companyVehicle'
        });
      }

      // Travel allowance type (required)
      if (!offer.benefits.travelAllowanceType) {
        errors.push({
          code: 'OFFER_VALIDATION_TRAVEL_ALLOWANCE_REQUIRED',
          message: 'Travel allowance type is required',
          field: 'benefits.travelAllowanceType'
        });
      }

      // Phone provided (required boolean)
      if (typeof offer.benefits.phoneProvided !== 'boolean') {
        errors.push({
          code: 'OFFER_VALIDATION_PHONE_PROVIDED_REQUIRED',
          message: 'Phone provided status is required',
          field: 'benefits.phoneProvided'
        });
      }

      // Tools provided (required boolean)
      if (typeof offer.benefits.toolsProvided !== 'boolean') {
        errors.push({
          code: 'OFFER_VALIDATION_TOOLS_PROVIDED_REQUIRED',
          message: 'Tools provided status is required',
          field: 'benefits.toolsProvided'
        });
      }
    } else {
      errors.push({
        code: 'OFFER_VALIDATION_BENEFITS_REQUIRED',
        message: 'Benefits details are required'
      });
    }

    // ========================================================================
    // WORK ARRANGEMENT VALIDATION (ALL REQUIRED)
    // ========================================================================

    if (offer.workArrangement) {
      // Schedule type (at least one required)
      if (!offer.workArrangement.scheduleType || offer.workArrangement.scheduleType.length === 0) {
        errors.push({
          code: 'OFFER_VALIDATION_SCHEDULE_REQUIRED',
          message: 'At least one schedule type must be specified',
          field: 'workArrangement.scheduleType'
        });
      }

      // Remote work percentage: 0-100
      if (offer.workArrangement.remoteWorkPct === undefined) {
        errors.push({
          code: 'OFFER_VALIDATION_REMOTE_WORK_REQUIRED',
          message: 'Remote work percentage is required (use 0 if not applicable)',
          field: 'workArrangement.remoteWorkPct'
        });
      } else if (offer.workArrangement.remoteWorkPct < 0 || offer.workArrangement.remoteWorkPct > 100) {
        errors.push({
          code: 'OFFER_VALIDATION_REMOTE_WORK_INVALID',
          message: 'Remote work percentage must be between 0 and 100',
          field: 'workArrangement.remoteWorkPct'
        });
      }

      // Physical requirements (required text)
      if (!offer.workArrangement.physicalRequirements) {
        errors.push({
          code: 'OFFER_VALIDATION_PHYSICAL_REQUIREMENTS_REQUIRED',
          message: 'Physical requirements description is required',
          field: 'workArrangement.physicalRequirements'
        });
      }
    } else {
      errors.push({
        code: 'OFFER_VALIDATION_WORK_ARRANGEMENT_REQUIRED',
        message: 'Work arrangement details are required'
      });
    }

    // ========================================================================
    // REQUIREMENTS VALIDATION (ALL REQUIRED)
    // ========================================================================

    if (offer.requirements) {
      // Required certifications (at least one)
      const requiredCerts = offer.requirements.requiredCertifications || offer.requirements.certifications;
      if (!requiredCerts || requiredCerts.length === 0) {
        errors.push({
          code: 'OFFER_VALIDATION_CERTIFICATIONS_REQUIRED',
          message: 'At least one required certification must be specified',
          field: 'requirements.requiredCertifications'
        });
      }

      // Required experience years
      if (offer.requirements.requiredExperienceYears === undefined && offer.requirements.minExperienceYears === undefined) {
        errors.push({
          code: 'OFFER_VALIDATION_EXPERIENCE_REQUIRED',
          message: 'Required experience years is required (use 0 if entry level)',
          field: 'requirements.requiredExperienceYears'
        });
      } else if ((offer.requirements.requiredExperienceYears ?? offer.requirements.minExperienceYears ?? 0) < 0) {
        errors.push({
          code: 'OFFER_VALIDATION_EXPERIENCE_NEGATIVE',
          message: 'Required experience years cannot be negative',
          field: 'requirements.requiredExperienceYears'
        });
      }
    } else {
      errors.push({
        code: 'OFFER_VALIDATION_REQUIREMENTS_REQUIRED',
        message: 'Requirements details are required'
      });
    }

    // ========================================================================
    // BASIC FIELDS VALIDATION
    // ========================================================================

    if (!offer.jobTitle || offer.jobTitle.trim().length === 0) {
      errors.push({
        code: 'OFFER_VALIDATION_JOB_TITLE_REQUIRED',
        message: 'Job title is required',
        field: 'jobTitle'
      });
    }

    // Check both jobDescription and description
    const description = offer.jobDescription ?? offer.description;
    if (!description || description.trim().length < 50) {
      errors.push({
        code: 'OFFER_VALIDATION_JOB_DESCRIPTION_REQUIRED',
        message: 'Job description must be at least 50 characters',
        field: 'jobDescription'
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
