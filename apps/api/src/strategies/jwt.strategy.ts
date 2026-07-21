import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? (() => { throw new Error('JWT_SECRET environment variable is required in production'); })() : 'dev-secret-key-not-for-production'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any) {
    // Check if this token has been blacklisted (e.g. user logged out)
    if (payload.jti) {
      const blacklisted = await this.prisma.blacklistedToken.findUnique({
        where: { jti: payload.jti },
      });
      if (blacklisted) {
        throw new UnauthorizedException('Token has been revoked');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted');
    }

    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Account has been banned');
    }

    // Also reject if user status is DELETED (e.g. worker profile was deleted)
    if (user.status === 'DELETED') {
      throw new UnauthorizedException('Account has been deleted');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    };
  }
}
