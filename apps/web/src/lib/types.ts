// TypeScript types for OfferMarket

// ============================================================================
// USER & AUTH
// ============================================================================

export interface User {
  id: string;
  email: string;
  role: 'WORKER' | 'EMPLOYER' | 'ADMIN';
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// ============================================================================
// WORKER
// ============================================================================

export interface Worker {
  id: string;
  userId: string;
  publicId: string;
  regionId?: string;
  region?: Region;
  postalCode?: string;
  country: string;
  yearsOfExperience?: number;
  primaryTrade?: string;
  availability: Availability;
  noticePeriodDays?: number;
  desiredSalaryMin?: number;
  desiredSalaryMax?: number;
  desiredHourlyRate?: number;
  employmentTypes: string[];
  travelDistanceKm: number;
  workSchedulePrefs: string[];
  industryPrefs: string[];
  careerPriorities: string[];
  profileVisibility: ProfileVisibility;
  isProfileComplete: boolean;
  profileCompletenessPct: number;
  reputationScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PublicWorkerProfile {
  publicId: string;
  region: {
    name: string;
    province?: string;
    type?: string;
  };
  yearsOfExperience?: number;
  primaryTrade?: string;
  skills: PublicSkill[];
  certifications: PublicCertification[];
  availability: Availability;
  desiredSalaryRange: {
    min?: number;
    max?: number;
  };
  employmentTypes: string[];
  travelDistanceKm: number;
  workSchedulePrefs: string[];
  industryPrefs: string[];
  careerPriorities: string[];
  profileCompletenessPct: number;
  reputationScore: number;
  lastActive: Date;
  profileVisibility?: string;
  _meta: {
    identityRevealed: false;
    identityRevealedOn: 'offer_acceptance';
    hidden: {
      name: 'REDACTED';
      email: 'REDACTED';
      phone: 'REDACTED';
      exactAddress: 'REDACTED';
      currentEmployer: 'REDACTED';
    };
  };
}

export interface PublicSkill {
  name: string;
  level: SkillLevel;
  yearsOfExperience?: number;
  isCertified: boolean;
}

export interface PublicCertification {
  name: string;
  isValid: boolean;
  validUntil?: Date;
}

export type Availability =
  | 'IMMEDIATE'
  | 'ONE_MONTH'
  | 'THREE_MONTHS'
  | 'SIX_MONTHS'
  | 'NOT_AVAILABLE';

export type ProfileVisibility =
  | 'ALL_VERIFIED'
  | 'SELECTED_COMPANIES'
  | 'HIDDEN';

export type SkillLevel =
  | 'BEGINNER'
  | 'INTERMEDIATE'
  | 'ADVANCED'
  | 'EXPERT'
  | 'MASTER';

// ============================================================================
// EMPLOYER
// ============================================================================

export interface Employer {
  id: string;
  userId: string;
  companyName: string;
  companyTradeName?: string;
  kvkNumber: string;
  vatNumber?: string;
  companySize?: string;
  industry?: string;
  foundedYear?: number;
  registeredAddress: any;
  businessAddress?: any;
  website?: string;
  phone?: string;
  billingEmail?: string;
  verificationStatus: EmployerVerificationStatus;
  verifiedAt?: Date;
  reputationScore: number;
  offerAcceptanceRate: number;
  avgResponseTimeHours: number;
  totalOffersSent: number;
  totalHires: number;
  billingStatus: string;
  subscriptionPlan: string;
  creditBalance: number;
  createdAt: Date;
  updatedAt: Date;
}

export type EmployerVerificationStatus =
  | 'PENDING'
  | 'BASIC_VERIFIED'
  | 'PREMIUM_VERIFIED'
  | 'REJECTED';

// ============================================================================
// OFFERS
// ============================================================================

export interface Offer {
  id: string;
  publicId: string;
  workerId: string;
  employerId: string;
  jobTitle: string;
  department?: string;
  jobDescription: string;
  status: OfferStatus;
  submittedAt?: Date;
  viewedAt?: Date;
  expiresAt: Date;
  acceptedAt?: Date;
  rejectedAt?: Date;
  withdrawnAt?: Date;
  shortlistedAt?: Date;
  counteredAt?: Date;
  currentVersionId?: string;
  currentVersion?: OfferVersion;
  versions: OfferVersion[];
  source?: string;
  createdAt: Date;
  updatedAt: Date;
  worker?: Worker;
  employer?: Employer;
  // Denormalized fields from current version for easy access
  compensation?: {
    salary?: {
      min?: number;
      max?: number;
      currency?: string;
    };
    equity?: number;
    bonus?: {
      amount?: number;
      type?: string;
    };
  };
  contract?: {
    type?: string;
    durationMonths?: number;
    probationPeriodMonths?: number;
    noticePeriodMonths?: number;
  };
  benefits?: {
    vacationDays?: number;
    pensionContribution?: number;
    healthInsurance?: boolean;
    travelAllowance?: boolean;
    mealAllowance?: boolean;
    phoneProvided?: boolean;
    laptopProvided?: boolean;
    educationBudget?: number;
  };
  workArrangement?: {
    type?: string;
    officeLocation?: string;
    remoteDaysPerWeek?: number;
    travelRequired?: boolean;
    relocationAssistance?: boolean;
  };
  requirements?: {
    skills?: { skill: string; required: boolean }[];
    preferredSkills?: { skill: string; required: boolean }[];
    minExperienceYears?: number;
    educationLevel?: string;
  };
}

export type OfferStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'VIEWED'
  | 'SHORTLISTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'WITHDRAWN'
  | 'COUNTERED';

export interface OfferVersion {
  id: string;
  offerId: string;
  version: number;
  isAcceptedVersion: boolean;

  // Compensation
  salaryMin: number;
  salaryMax: number;
  salaryPeriod: string;
  hourlyRate?: number;
  signOnBonus: number;
  performanceBonusPct: number;
  overtimeRate?: number;
  weekendRate?: number;

  // Contract
  contractType: string;
  contractDurationMonths?: number;
  hoursPerWeek: number;
  startDateType: string;
  startDate?: Date;
  probationMonths: number;

  // Benefits
  vacationDays: number;
  holidayAllowancePct: number;
  pensionContributionPct: number;
  trainingBudget: number;
  companyVehicle: string;
  vehicleType?: string;
  vehicleValueEst?: number;
  travelAllowanceType: string;
  travelAllowanceValue?: number;
  phoneProvided: boolean;
  toolsProvided: boolean;

  // Work Arrangement
  scheduleType: string[];
  onCallDetails?: string;
  remoteWorkPct: number;
  travelRequiredPct: number;
  travelRegion?: string;
  physicalRequirements: string;

  // Requirements
  requiredCertifications: string[];
  requiredExperienceYears: number;

  createdAt: Date;
}

export interface CreateOfferDto {
  workerId: string;
  jobTitle: string;
  department?: string;
  jobDescription: string;
  compensation: CompensationDto;
  contract: ContractDto;
  benefits: BenefitsDto;
  workArrangement: WorkArrangementDto;
  requirements: RequirementsDto;
  expiresInDays?: number;
  source?: string;
}

export interface CompensationDto {
  salaryMin: number;
  salaryMax: number;
  salaryPeriod?: string;
  hourlyRate?: number;
  signOnBonus?: number;
  performanceBonusPct?: number;
  overtimeRate?: number;
  weekendRate?: number;
}

export interface ContractDto {
  type: string;
  durationMonths?: number;
  hoursPerWeek: number;
  startDateType?: string;
  startDate?: Date;
  probationMonths?: number;
}

export interface BenefitsDto {
  vacationDays: number;
  holidayAllowancePct?: number;
  pensionContributionPct?: number;
  trainingBudget?: number;
  companyVehicle: string;
  vehicleType?: string;
  vehicleValueEst?: number;
  travelAllowanceType: string;
  travelAllowanceValue?: number;
  phoneProvided?: boolean;
  toolsProvided?: boolean;
}

export interface WorkArrangementDto {
  scheduleType: string[];
  onCallDetails?: string;
  remoteWorkPct?: number;
  travelRequiredPct?: number;
  travelRegion?: string;
  physicalRequirements: string;
}

export interface RequirementsDto {
  requiredCertifications: string[];
  requiredExperienceYears?: number;
}

export interface CounterOfferDto {
  salaryMin?: number;
  salaryMax?: number;
  signOnBonus?: number;
  vacationDays?: number;
}

// ============================================================================
// CONVERSATIONS & MESSAGES
// ============================================================================

export interface Conversation {
  id: string;
  offerId: string;
  offer?: Offer;
  participant1Id: string;
  participant2Id: string;
  workerIdentityRevealed: boolean;
  workerIdentitySnapshot?: any;
  lastMessageAt?: Date;
  lastMessagePreview?: string;
  unreadCountWorker: number;
  unreadCountEmployer: number;
  isArchivedWorker: boolean;
  isArchivedEmployer: boolean;
  messages?: Message[];
  createdAt: Date;
  updatedAt: Date;
  worker?: {
    id: string;
    publicId?: string;
    firstName?: string;
    lastName?: string;
  };
  employer?: {
    id: string;
    companyName: string;
    kvkNumber: string;
  };
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  sender?: User;
  recipientId: string;
  recipient?: User;
  content: string;
  contentEncrypted?: string;
  messageType: MessageType;
  attachments: any[];
  isRead: boolean;
  readAt?: Date;
  isDeleted: boolean;
  isSystemMessage: boolean;
  createdAt: Date;
}

export type MessageType = 'TEXT' | 'FILE' | 'CALENDAR_INVITE' | 'DOCUMENT_REQUEST';

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

export interface Region {
  id: string;
  parentId?: string;
  name: string;
  nameEn?: string;
  type: RegionType;
  province?: string;
  postalCodePrefix?: string;
  latitude?: number;
  longitude?: number;
}

export type RegionType =
  | 'COUNTRY'
  | 'PROVINCE'
  | 'CITY'
  | 'DISTRICT'
  | 'POSTAL_CODE';

export interface BlockedCompany {
  id: string;
  workerId: string;
  employerId: string;
  employer?: Employer;
  reason?: string;
  createdAt: Date;
}

export interface Skill {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory?: string;
  description?: string;
  isCertification: boolean;
  certificationBody?: string;
  isActive: boolean;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileSkill {
  id: string;
  profileId: string;
  skillId: string;
  skill?: Skill;
  level: SkillLevel;
  yearsOfExperience?: number;
  certificationNumber?: string;
  certifiedBy?: string;
  validUntil?: Date;
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Certification {
  id: string;
  profileId: string;
  skillId?: string;
  skill?: Skill;
  name: string;
  certificationNumber?: string;
  issuingBody: string;
  issuedAt?: Date;
  validFrom?: Date;
  validUntil?: Date;
  isLifetime: boolean;
  verificationStatus: VerificationStatus;
  verifiedAt?: Date;
  verifiedBy?: string;
  verificationMethod?: string;
  documentUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type VerificationStatus =
  | 'PENDING'
  | 'VERIFIED'
  | 'EXPIRED'
  | 'REVOKED';

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface AcceptOfferResult {
  offer: Offer;
  conversation: Conversation;
  invoice: any;
  workerIdentityRevealed: {
    fullName: string;
    email: string;
    phone: string;
  };
}

export interface ApiError {
  message: string;
  error: string;
  statusCode: number;
}
