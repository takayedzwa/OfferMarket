import { Controller, Get, Post, Body, Param, Query, UseGuards, BadRequestException, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@Controller('conversations')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getConversations(
    @Request() req: any,
    @Query('userType') userType: 'worker' | 'employer'
  ) {
    if (!userType) {
      throw new BadRequestException('userType is required');
    }
    return this.messagesService.getConversations(req.user.id, userType);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getConversation(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.messagesService.getConversation(id, req.user.id);
  }

  @Get(':id/messages')
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Param('id') id: string,
    @Request() req: any
  ) {
    const conversation = await this.messagesService.getConversation(id, req.user.id);
    return conversation.messages || [];
  }

  @Post(':id/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(
    @Param('id') id: string,
    @Request() req: any,
    @Body('content') content: string,
    @Body('attachments') attachments?: any[]
  ) {
    if (!content) {
      throw new BadRequestException('content is required');
    }
    return this.messagesService.sendMessage(id, req.user.id, content, attachments);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.messagesService.markAsRead(id, req.user.id);
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard)
  async archiveConversation(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.messagesService.archiveConversation(id, req.user.id);
  }
}
