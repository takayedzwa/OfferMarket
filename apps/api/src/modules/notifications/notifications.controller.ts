import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

// ============================================================================
// NOTIFICATIONS CONTROLLER (REST API)
// ============================================================================
// REST endpoints for fetching notification history, unread counts,
// and marking notifications as read. Real-time delivery is handled
// by the WebSocket gateway — these endpoints are for the initial
// page load and for users who miss real-time events.
//
// SECURITY: All endpoints require JWT authentication. The userId is
// extracted from the JWT token (req.user.id) — never from query params.
// ============================================================================

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  /**
   * GET /notifications
   * List notifications for the authenticated user.
   * Query params: unreadOnly (bool), page (int), limit (int)
   * SECURITY: userId is extracted from JWT, not from query params.
   */
  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('unreadOnly') unreadOnly?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const userId = req.user.id;

    return this.notificationsService.getNotifications(userId, {
      unreadOnly: unreadOnly === 'true',
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  /**
   * GET /notifications/unread-count
   * Get the number of unread notifications for the authenticated user.
   * SECURITY: userId is extracted from JWT, not from query params.
   */
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    const userId = req.user.id;

    const count = await this.notificationsService.getUnreadCount(userId);
    return { count };
  }

  /**
   * PATCH /notifications/:id/read
   * Mark a specific notification as read.
   * SECURITY: userId is extracted from JWT to verify ownership.
   */
  @Patch(':id/read')
  async markAsRead(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user.id;

    const result = await this.notificationsService.markAsRead(id, userId);
    if (!result) {
      throw new BadRequestException('Notification not found or not authorized');
    }
    return result;
  }

  /**
   * PATCH /notifications/read-all
   * Mark all notifications as read for the authenticated user.
   * SECURITY: userId is extracted from JWT, not from query params.
   */
  @Patch('read-all')
  async markAllAsRead(@Request() req: any) {
    const userId = req.user.id;

    return this.notificationsService.markAllAsRead(userId);
  }
}