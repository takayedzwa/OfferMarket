import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ERROR_CODES } from '../i18n/error-codes';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from '@prisma/client';

/**
 * AdminGuard - Only allows ADMIN role users
 * Use for routes that should only be accessible by administrators
 */
@Injectable()
export class AdminGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, authenticate the user via JWT
    await super.canActivate(context);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({ code: ERROR_CODES.GUARD_NOT_AUTHENTICATED, message: 'User not authenticated' });
    }

    if (user.role !== 'ADMIN') {
      throw new ForbiddenException({ code: ERROR_CODES.GUARD_ADMIN_REQUIRED, message: 'Access denied. Admin privileges required.' });
    }

    return true;
  }
}
