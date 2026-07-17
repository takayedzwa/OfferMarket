import { Controller, Get } from '@nestjs/common';

/**
 * ENUMS CONTROLLER
 *
 * Serves all enum options from the backend as the source of truth.
 * Frontend should fetch these dynamically instead of hardcoding.
 */

@Controller('enums')
export class EnumsController {
  // ===========================================================================
  // GET ALL ENUMS
  // ===========================================================================

  /**
   * GET /enums
   *
   * Get all enum options for worker profile forms
   */
  @Get()
  async getAllEnums() {
    return {
      availability: this.getAvailabilityEnums(),
      profileVisibility: this.getProfileVisibilityEnums(),
      skillLevel: this.getSkillLevelEnums(),
      workSchedule: this.getWorkScheduleEnums(),
      industry: this.getIndustryEnums(),
      careerPriority: this.getCareerPriorityEnums(),
      employmentType: this.getEmploymentTypeEnums(),
      specialization: this.getSpecializationEnums(),
      workAuthorization: this.getWorkAuthorizationEnums(),
      languageLevel: this.getLanguageLevelEnums(),
      ticketCategory: this.getTicketCategoryEnums(),
      ticketPriority: this.getTicketPriorityEnums(),
      ticketStatus: this.getTicketStatusEnums(),
    };
  }

  // ===========================================================================
  // INDIVIDUAL ENUM ENDPOINTS
  // ===========================================================================

  @Get('availability')
  async getAvailability() {
    return this.getAvailabilityEnums();
  }

  @Get('profile-visibility')
  async getProfileVisibility() {
    return this.getProfileVisibilityEnums();
  }

  @Get('skill-level')
  async getSkillLevel() {
    return this.getSkillLevelEnums();
  }

  @Get('work-schedule')
  async getWorkSchedule() {
    return this.getWorkScheduleEnums();
  }

  @Get('industry')
  async getIndustry() {
    return this.getIndustryEnums();
  }

  @Get('career-priority')
  async getCareerPriority() {
    return this.getCareerPriorityEnums();
  }

  @Get('employment-type')
  async getEmploymentType() {
    return this.getEmploymentTypeEnums();
  }

  @Get('specialization')
  async getSpecialization() {
    return this.getSpecializationEnums();
  }

  @Get('work-authorization')
  async getWorkAuthorization() {
    return this.getWorkAuthorizationEnums();
  }

  @Get('language-level')
  async getLanguageLevel() {
    return this.getLanguageLevelEnums();
  }

  @Get('ticket-category')
  async getTicketCategory() {
    return this.getTicketCategoryEnums();
  }

  @Get('ticket-priority')
  async getTicketPriority() {
    return this.getTicketPriorityEnums();
  }

  @Get('ticket-status')
  async getTicketStatus() {
    return this.getTicketStatusEnums();
  }

  // ===========================================================================
  // ENUM HELPERS
  // ===========================================================================

  private getAvailabilityEnums() {
    return [
      { value: 'IMMEDIATE', label: 'Immediately' },
      { value: 'ONE_MONTH', label: 'In 1 month' },
      { value: 'THREE_MONTHS', label: 'In 3 months' },
      { value: 'SIX_MONTHS', label: 'In 6 months' },
      { value: 'NOT_AVAILABLE', label: 'Not available' },
    ];
  }

  private getProfileVisibilityEnums() {
    return [
      { value: 'ALL_VERIFIED', label: 'All Verified Employers', description: 'Any verified employer can discover your profile' },
      { value: 'SELECTED_COMPANIES', label: 'Selected Companies Only', description: 'Only employers you approve can view your profile' },
      { value: 'HIDDEN', label: 'Hidden', description: 'Your profile is hidden from discovery' },
    ];
  }

  private getSkillLevelEnums() {
    return [
      { value: 'BEGINNER', label: 'Beginner' },
      { value: 'INTERMEDIATE', label: 'Intermediate' },
      { value: 'ADVANCED', label: 'Advanced' },
      { value: 'EXPERT', label: 'Expert' },
      { value: 'MASTER', label: 'Master' },
    ];
  }

  private getWorkScheduleEnums() {
    return [
      { value: 'STANDARD', label: 'Standard', description: 'Regular business hours (Mon-Fri, 9-5)' },
      { value: 'FLEXIBLE', label: 'Flexible', description: 'Flexible hours, results-oriented' },
      { value: 'WEEKEND', label: 'Weekend', description: 'Weekend availability' },
      { value: 'EVENING', label: 'Evening', description: 'Evening/night shifts' },
      { value: 'ROTATING', label: 'Rotating', description: 'Rotating shifts' },
    ];
  }

  private getIndustryEnums() {
    return [
      { value: 'CONSTRUCTION', label: 'Construction' },
      { value: 'INDUSTRIAL', label: 'Industrial' },
      { value: 'RESIDENTIAL', label: 'Residential' },
      { value: 'COMMERCIAL', label: 'Commercial' },
      { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
      { value: 'ENERGY', label: 'Energy & Utilities' },
      { value: 'TELECOM', label: 'Telecommunications' },
      { value: 'MANUFACTURING', label: 'Manufacturing' },
      { value: 'HEALTHCARE', label: 'Healthcare' },
      { value: 'EDUCATION', label: 'Education' },
      { value: 'HOSPITALITY', label: 'Hospitality' },
      { value: 'RETAIL', label: 'Retail' },
      { value: 'TRANSPORTATION', label: 'Transportation & Logistics' },
      { value: 'AGRICULTURE', label: 'Agriculture' },
      { value: 'PUBLIC_SECTOR', label: 'Public Sector' },
    ];
  }

  private getCareerPriorityEnums() {
    return [
      { value: 'WORK_LIFE_BALANCE', label: 'Work-Life Balance' },
      { value: 'HIGH_SALARY', label: 'High Salary' },
      { value: 'CAREER_GROWTH', label: 'Career Growth' },
      { value: 'REMOTE_FLEXIBILITY', label: 'Remote Flexibility' },
      { value: 'JOB_SECURITY', label: 'Job Security' },
      { value: 'IMPACTFUL_WORK', label: 'Impactful Work' },
      { value: 'TEAM_CULTURE', label: 'Team Culture' },
      { value: 'LEARNING_OPPORTUNITIES', label: 'Learning Opportunities' },
      { value: 'LOCATION_CONVENIENCE', label: 'Location Convenience' },
      { value: 'BENEFITS_PERKS', label: 'Benefits & Perks' },
    ];
  }

  private getEmploymentTypeEnums() {
    return [
      { value: 'FULL_TIME', label: 'Full-time' },
      { value: 'PART_TIME', label: 'Part-time' },
      { value: 'FREELANCE', label: 'Freelance' },
      { value: 'CONTRACT', label: 'Contract' },
      { value: 'TEMPORARY', label: 'Temporary' },
      { value: 'INTERNSHIP', label: 'Internship' },
    ];
  }

  private getSpecializationEnums() {
    return [
      { value: 'RESIDENTIAL_INSTALLATIONS', label: 'Residential Installations' },
      { value: 'COMMERCIAL_INSTALLATIONS', label: 'Commercial Installations' },
      { value: 'INDUSTRIAL_INSTALLATIONS', label: 'Industrial Installations' },
      { value: 'MAINTENANCE', label: 'Maintenance' },
      { value: 'HIGH_VOLTAGE', label: 'High Voltage' },
      { value: 'LOW_VOLTAGE', label: 'Low Voltage' },
      { value: 'SOLAR_PV', label: 'Solar PV' },
      { value: 'EV_CHARGING', label: 'EV Charging Stations' },
      { value: 'CONTROL_PANELS', label: 'Control Panels' },
      { value: 'PLC_SYSTEMS', label: 'PLC Systems' },
      { value: 'AUTOMATION', label: 'Automation' },
      { value: 'BUILDING_MANAGEMENT', label: 'Building Management Systems' },
      { value: 'FIRE_ALARM_SYSTEMS', label: 'Fire Alarm Systems' },
      { value: 'SECURITY_SYSTEMS', label: 'Security Systems' },
      { value: 'DATA_CABLING', label: 'Data Cabling' },
      { value: 'MARINE_ELECTRICAL', label: 'Marine Electrical' },
      { value: 'RENEWABLE_ENERGY', label: 'Renewable Energy' },
    ];
  }

  private getWorkAuthorizationEnums() {
    return [
      { value: 'EU_CITIZEN', label: 'EU Citizen' },
      { value: 'DUTCH_WORK_PERMIT', label: 'Dutch Work Permit' },
      { value: 'HIGHLY_SKILLED_MIGRANT', label: 'Highly Skilled Migrant Visa' },
      { value: 'REQUIRES_SPONSORSHIP', label: 'Requires Sponsorship' },
    ];
  }

  private getLanguageLevelEnums() {
    return [
      { value: 'A1', label: 'A1 - Beginner' },
      { value: 'A2', label: 'A2 - Elementary' },
      { value: 'B1', label: 'B1 - Intermediate' },
      { value: 'B2', label: 'B2 - Upper Intermediate' },
      { value: 'C1', label: 'C1 - Advanced' },
      { value: 'C2', label: 'C2 - Proficient' },
      { value: 'NATIVE', label: 'Native Speaker' },
    ];
  }

  private getTicketCategoryEnums() {
    return [
      { value: 'GENERAL', label: 'General Inquiry' },
      { value: 'ACCOUNT', label: 'Account Issue' },
      { value: 'BILLING', label: 'Billing / Payment' },
      { value: 'TECHNICAL', label: 'Technical Problem' },
      { value: 'REPORT', label: 'Report Content / User' },
      { value: 'FEATURE', label: 'Feature Request' },
      { value: 'OTHER', label: 'Other' },
    ];
  }

  private getTicketPriorityEnums() {
    return [
      { value: 'LOW', label: 'Low' },
      { value: 'MEDIUM', label: 'Medium' },
      { value: 'HIGH', label: 'High' },
      { value: 'URGENT', label: 'Urgent' },
    ];
  }

  private getTicketStatusEnums() {
    return [
      { value: 'OPEN', label: 'Open' },
      { value: 'IN_PROGRESS', label: 'In Progress' },
      { value: 'PENDING_USER', label: 'Pending User' },
      { value: 'RESOLVED', label: 'Resolved' },
      { value: 'CLOSED', label: 'Closed' },
    ];
  }
}
