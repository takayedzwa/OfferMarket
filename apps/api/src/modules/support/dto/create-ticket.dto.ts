import { IsString, IsOptional, IsIn, IsObject, IsBoolean, IsInt, Min } from 'class-validator';

export class CreateTicketDto {
  // SECURITY: userId is no longer accepted from the request body.
  // It is extracted from the authenticated JWT token in the controller,
  // preventing IDOR attacks where a user could create tickets attributed
  // to another user.

  @IsString()
  subject: string;

  @IsString()
  description: string;

  @IsString()
  @IsIn(['GENERAL', 'ACCOUNT', 'BILLING', 'TECHNICAL', 'REPORT', 'FEATURE', 'OTHER'])
  category: string; // Values must match EnumsController.getTicketCategoryEnums()

  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
  priority?: string = 'MEDIUM';

  @IsString()
  @IsOptional()
  relatedEntityType?: string;

  @IsString()
  @IsOptional()
  relatedEntityId?: string;
}

/**
 * Used by ADMIN/SUPPORT staff to create a ticket on behalf of a specific user
 * via the SupportGuard-protected POST /support/tickets/on-behalf endpoint.
 * Unlike CreateTicketDto, the target userId is supplied in the body (the
 * caller is authenticated via SupportGuard, so IDOR is not a concern here).
 */
export class CreateTicketOnBehalfDto extends CreateTicketDto {
  @IsString()
  userId: string;
}

export class TicketReplyDto {
  @IsString()
  content: string;

  @IsBoolean()
  @IsOptional()
  isInternal?: boolean = false;

  @IsObject()
  @IsOptional()
  attachments?: any;
}

export class AssignTicketDto {
  @IsString()
  assignedToId: string;
}

export class ExtendOfferExpiryDto {
  // A-M3: the number of days to extend an offer's expiry. Must be a positive
  // whole number — previously the service accepted any number including
  // negatives, which would shorten the expiry instead of extending it.
  @IsInt()
  @Min(1)
  days!: number;
}
