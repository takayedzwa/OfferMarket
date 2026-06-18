import { IsString, IsOptional, IsIn, IsObject, IsBoolean } from 'class-validator';

export class CreateTicketDto {
  @IsString()
  userId: string;

  @IsString()
  subject: string;

  @IsString()
  description: string;

  @IsString()
  @IsIn(['account', 'payment', 'technical', 'dispute', 'other'])
  category: string;

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
