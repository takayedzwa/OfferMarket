import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // ============================================================================
  // REGISTER WORKER
  // ============================================================================

  async registerWorker(email: string, password: string, phone?: string) {
    return this.prisma.$transaction(async (tx) => {
      // Check if user already exists
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        throw new BadRequestException('Email already registered');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'WORKER',
          phone,
          emailVerified: false,
          phoneVerified: false
        }
      });

      // Generate JWT
      const tokens = this.generateTokens(user.id, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        },
        tokens
      };
    });
  }

  // ============================================================================
  // REGISTER EMPLOYER
  // ============================================================================

  async registerEmployer(
    email: string,
    password: string,
    phone: string,
    company: {
      name: string;
      kvkNumber: string;
      website?: string;
    }
  ) {
    return this.prisma.$transaction(async (tx) => {
      // Check if user already exists
      const existing = await tx.user.findUnique({ where: { email } });
      if (existing) {
        throw new BadRequestException('Email already registered');
      }

      // Check if KvK already exists
      const existingEmployer = await tx.employer.findUnique({
        where: { kvkNumber: company.kvkNumber }
      });
      if (existingEmployer) {
        throw new BadRequestException('Company with this KvK number already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: 'EMPLOYER',
          phone,
          emailVerified: false,
          phoneVerified: false
        }
      });

      // Create employer profile
      await tx.employer.create({
        data: {
          userId: user.id,
          companyName: company.name,
          kvkNumber: company.kvkNumber,
          website: company.website,
          verificationStatus: 'PENDING',
          registeredAddress: { street: '', city: '', postalCode: '', country: 'NL' }
        }
      });

      // Generate JWT
      const tokens = this.generateTokens(user.id, user.role);

      return {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified
        },
        tokens
      };
    });
  }

  // ============================================================================
  // LOGIN
  // ============================================================================

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('Account has been deleted');
    }

    if (user.status === 'BANNED') {
      throw new UnauthorizedException('Account has been banned');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    const tokens = this.generateTokens(user.id, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      },
      tokens
    };
  }

  // ============================================================================
  // VERIFY EMAIL
  // ============================================================================

  async verifyEmail(userId: string, code: string) {
    // In production, verify the code properly
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerified: true }
    });

    return { success: true };
  }

  // ============================================================================
  // VERIFY PHONE
  // ============================================================================

  async verifyPhone(userId: string, phone: string, code: string) {
    // In production, verify the SMS code properly
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phone,
        phoneVerified: true
      }
    });

    return { success: true };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private generateTokens(userId: string, role: string) {
    const accessToken = jwt.sign(
      { sub: userId, role },
      process.env.JWT_SECRET || 'dev-secret-key-change-in-production',
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { sub: userId },
      process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key',
      { expiresIn: '7d' }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 3600
    };
  }
}
