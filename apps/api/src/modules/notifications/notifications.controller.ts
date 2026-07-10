import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';

// ============================================================================
// NOTIFICATIONS CONTROLLER (REST API)
// ============================================================================
// REST endpoints for fetching notification history, unread counts,
// and marking notifications as read. Real-time delivery is handled
// by the WebSocket gateway — these endpoints are for the initial
// page load and for users who miss real-time events.
// ============================================================================

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * List notifications for the authenticated user.
   * Query params: unreadOnly (bool), page (int), limit (int)
   */
  @Get()
  async getNotifications(
    @Query('userId') userId: string,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.notificationsService.getNotifications(userId, {
      unreadOnly: unreadOnly === 'true',
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * GET /notifications/unread-count
   * Get the number of unread notifications for the authenticated user.
   */
  @Get('unread-count')
  async getUnreadCount(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a specific notification as read.
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Query('userId') userId: string,
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    const result = await this.notificationsService.markAsRead(id, userId);
    if (!result) {
      throw new BadRequestException('Notification not found or not authorized');
    }
    return result;
  }

  /**
   * PATCH /notifications/read-all
   * Mark all notifications as read for the authenticated user.
   */
  @Patch('read-all')
  async markAllAsRead(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.notificationsService.markAllAsRead(userId);
  }
}