import { Controller, Get, Post, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { MessagesService } from './messages.service';

class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    const userRole = request.headers['x-user-role'];

    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    request.user = { id: userId, role: userRole };
    return true;
  }
}

@Controller('conversations')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  @UseGuards(SimpleAuthGuard)
  async getConversations(
    @Query('userId') userId: string,
    @Query('userType') userType: 'worker' | 'employer'
  ) {
    if (!userId || !userType) {
      throw new BadRequestException('userId and userType are required');
    }
    return this.messagesService.getConversations(userId, userType);
  }

  @Get(':id')
  @UseGuards(SimpleAuthGuard)
  async getConversation(
    @Param('id') id: string,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.messagesService.getConversation(id, userId);
  }

  @Get(':id/messages')
  @UseGuards(SimpleAuthGuard)
  async getMessages(
    @Param('id') id: string,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    const conversation = await this.messagesService.getConversation(id, userId);
    return conversation.messages || [];
  }

  @Post(':id/messages')
  @UseGuards(SimpleAuthGuard)
  async sendMessage(
    @Param('id') id: string,
    @Query('userId') userId: string,
    @Body('content') content: string,
    @Body('attachments') attachments?: any[]
  ) {
    if (!userId || !content) {
      throw new BadRequestException('userId and content are required');
    }
    return this.messagesService.sendMessage(id, userId, content, attachments);
  }

  @Post(':id/read')
  @UseGuards(SimpleAuthGuard)
  async markAsRead(
    @Param('id') id: string,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.messagesService.markAsRead(id, userId);
  }

  @Post(':id/archive')
  @UseGuards(SimpleAuthGuard)
  async archiveConversation(
    @Param('id') id: string,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.messagesService.archiveConversation(id, userId);
  }
}
