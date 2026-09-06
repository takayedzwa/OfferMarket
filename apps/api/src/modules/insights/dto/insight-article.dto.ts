import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Slug rule: lowercase kebab-case, 3–120 chars — the clean-URL contract
 * (/insights/electrician-salary-rotterdam). Exported so the service can
 * validate programmatic slug generation against the same rule.
 */
export const INSIGHT_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class UpsertInsightArticleDto {
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title!: string;

  @IsString()
  @Matches(INSIGHT_SLUG_REGEX, {
    message: 'slug must be lowercase kebab-case (e.g. electrician-salary-rotterdam)',
  })
  @MaxLength(120)
  slug!: string;

  @IsEnum(['SALARY', 'DEMAND', 'EMPLOYER', 'INDUSTRY', 'CAREER'])
  category!: 'SALARY' | 'DEMAND' | 'EMPLOYER' | 'INDUSTRY' | 'CAREER';

  @IsString()
  @MinLength(10)
  @MaxLength(280)
  summary!: string;

  @IsString()
  @MinLength(20)
  content!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  profession?: string;

  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  charts?: any[];

  @IsOptional()
  @IsArray()
  statistics?: any[];

  @IsOptional()
  keyStats?: any;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  methodology?: string;

  @IsOptional()
  @IsDateString()
  dataPeriodStart?: string;

  @IsOptional()
  @IsDateString()
  dataPeriodEnd?: string;

  @IsEnum(['OFFERMARKT', 'OFFICIAL', 'THIRD_PARTY', 'EDITORIAL'])
  dataClass!: 'OFFERMARKT' | 'OFFICIAL' | 'THIRD_PARTY' | 'EDITORIAL';

  @IsOptional()
  @IsInt()
  @Min(0)
  sampleSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sampleDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(170)
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  socialTitle?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  sourceIds?: string[];
}

export class CreateInsightArticleDto extends UpsertInsightArticleDto {}

export class UpdateInsightArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(160)
  title?: string;

  @IsOptional()
  @IsString()
  @Matches(INSIGHT_SLUG_REGEX, {
    message: 'slug must be lowercase kebab-case (e.g. electrician-salary-rotterdam)',
  })
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsEnum(['SALARY', 'DEMAND', 'EMPLOYER', 'INDUSTRY', 'CAREER'])
  category?: 'SALARY' | 'DEMAND' | 'EMPLOYER' | 'INDUSTRY' | 'CAREER';

  @IsOptional()
  @IsString()
  @MinLength(10)
  @MaxLength(280)
  summary?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  content?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  profession?: string;

  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @IsOptional()
  @IsArray()
  charts?: any[];

  @IsOptional()
  @IsArray()
  statistics?: any[];

  @IsOptional()
  keyStats?: any;

  @IsOptional()
  @IsString()
  @MaxLength(20000)
  methodology?: string;

  @IsOptional()
  @IsDateString()
  dataPeriodStart?: string;

  @IsOptional()
  @IsDateString()
  dataPeriodEnd?: string;

  @IsOptional()
  @IsEnum(['OFFERMARKT', 'OFFICIAL', 'THIRD_PARTY', 'EDITORIAL'])
  dataClass?: 'OFFERMARKT' | 'OFFICIAL' | 'THIRD_PARTY' | 'EDITORIAL';

  @IsOptional()
  @IsInt()
  @Min(0)
  sampleSize?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  sampleDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  authorName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(70)
  seoTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(170)
  metaDescription?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  socialTitle?: string;

  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  sourceIds?: string[];
}

/** POST /insights/articles/:id/schedule — schedule (or reschedule) publication. */
export class ScheduleInsightDto {
  @IsDateString()
  publishAt!: string;
}

/** Analytics ingest (public, pseudonymous sessionKey). */
export class InsightAnalyticsEventDto {
  @IsString()
  @MinLength(8)
  @MaxLength(64)
  @Matches(/^[A-Za-z0-9_-]+$/, {
    message: 'sessionKey must be an opaque identifier (no personal data)',
  })
  sessionKey!: string;

  @IsEnum([
    'ARTICLE_VIEW',
    'UNIQUE_READER',
    'CATEGORY_VIEW',
    'SHARE',
    'REGISTER_CLICK',
    'WORKER_REGISTER',
    'EMPLOYER_REGISTER',
    'RETURNING_READER',
    'SEARCH_IMPRESSION',
  ])
  eventType!: string;

  @IsOptional()
  @IsUUID()
  articleId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  path?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  referrer?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8)
  locale?: string;
}

/** Follow a profession / region / skill (at least one required — enforced in service). */
export class CreateInsightFollowDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  profession?: string;

  @IsOptional()
  @IsUUID()
  regionId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  skillSlug?: string;

  @IsOptional()
  @IsBoolean()
  notifyEmail?: boolean;
}

/** Source registry entry. */
export class UpsertInsightSourceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MaxLength(500)
  url!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(200)
  publisher!: string;

  @IsOptional()
  @IsDateString()
  publicationDate?: string;

  @IsOptional()
  @IsDateString()
  dataDate?: string;

  @IsEnum([
    'CBS',
    'UWV',
    'RVO',
    'DUTCH_GOVERNMENT',
    'EUROSTAT',
    'EUROPEAN_COMMISSION',
    'INDUSTRY_REPORT',
    'ACADEMIC',
    'INTERNAL',
  ])
  sourceType!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  citation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}

/** Type helper so Type(() => …) transforms never land as plain strings. */
export const InsightArticleStatuses = [
  'DRAFT',
  'SCHEDULED',
  'PUBLISHED',
  'UNPUBLISHED',
  'ARCHIVED',
] as const;