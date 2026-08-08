import { Injectable, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ERROR_CODES } from '../i18n/error-codes';
import { AuthGuard } from '@nestjs/passport';

/**
 * SupportGuard - Allows ADMIN and SUPPORT role users
 * Use for routes that should be accessible by support team and administrators
 */
@Injectable()
export class SupportGuard extends AuthGuard('jwt') {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // First, authenticate the user via JWT
    await super.canActivate(context);

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({ code: ERROR_CODES.GUARD_NOT_AUTHENTICATED, message: 'User not authenticated' });
    }

    const allowedRoles = ['ADMIN', 'SUPPORT'];

    if (!allowedRoles.includes(user.role)) {
      throw new ForbiddenException({ code: ERROR_CODES.GUARD_SUPPORT_REQUIRED, message: 'Access denied. Support team privileges required.' });
    }

    return true;
  }
}
