import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// ============================================================================
// NOTIFICATIONS GATEWAY (Socket.IO)
// ============================================================================
// Manages WebSocket connections and pushes real-time notifications.
// Each authenticated user joins a room: `user:${userId}`
// so we can target notifications to specific users across multiple instances.
// ============================================================================

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  // Map of socket.id -> userId for tracking connections
  private connectedUsers = new Map<string, string>();

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    // Extract userId from handshake auth/headers
    const userId =
      client.handshake.auth?.userId ||
      client.handshake.headers['x-user-id'] ||
      client.handshake.query?.userId;

    if (!userId) {
      this.logger.warn(`Client ${client.id} connected without userId — disconnecting`);
      client.disconnect(true);
      return;
    }

    // Join the user's personal room for targeted notifications
    const room = `user:${userId}`;
    await client.join(room);

    this.connectedUsers.set(client.id, userId);
    this.logger.log(`Client ${client.id} connected as user ${userId}, joined room ${room}`);

    // Send current unread count on connection
    client.emit('notification:connected', {
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  async handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.connectedUsers.delete(client.id);
      this.logger.log(`Client ${client.id} (user ${userId}) disconnected`);
    }
  }

  // ============================================================================
  // PUSH METHODS — called by NotificationsService
  // ============================================================================

  /**
   * Push a new notification to a specific user in real-time.
   */
  pushToUser(
    userId: string,
    payload: {
      id: string;
      type: string;
      category: string | null;
      title: string;
      body: string;
      /** i18n interpolation params (Prisma Json? value) for client-side rendering. */
      actionData: unknown;
      actionUrl: string | null;
      createdAt: string;
    },
  ) {
    const room = `user:${userId}`;
    this.server.to(room).emit('notification:new', payload);
    this.logger.debug(`Pushed notification to room ${room}: ${payload.type}`);
  }

  /**
   * Push updated unread count to a specific user.
   */
  pushUnreadCount(userId: string, count: number) {
    const room = `user:${userId}`;
    this.server.to(room).emit('notification:unread_count', { count });
  }

  /**
   * Check if a user is currently connected via WebSocket.
   */
  isUserOnline(userId: string): boolean {
    for (const [, uid] of this.connectedUsers) {
      if (uid === userId) return true;
    }
    return false;
  }

  /**
   * Get the number of currently connected clients.
   */
  getConnectedCount(): number {
    return this.connectedUsers.size;
  }
}