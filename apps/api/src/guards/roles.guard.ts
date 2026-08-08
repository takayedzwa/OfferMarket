import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { ERROR_CODES } from '../i18n/error-codes';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../common/decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({ code: ERROR_CODES.GUARD_NOT_AUTHENTICATED, message: 'User not authenticated' });
    }

    if (!requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException({
        code: ERROR_CODES.GUARD_ROLES_REQUIRED,
        message: `Access denied. Required roles: ${requiredRoles.join(', ')}`,
        params: { roles: requiredRoles.join(', ') },
      });
    }

    return true;
  }
}
