import { Injectable, NotFoundException, BadRequestException, BadRequestException as BadRequestExceptionAlias } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class EmployersService {
  constructor(private prisma: PrismaService) {}

  async createEmployerProfile(userId: string, createDto: any) {
    return this.prisma.$transaction(async (tx) => {
      // Verify KvK number is unique
      const existing = await tx.employer.findUnique({
        where: { kvkNumber: createDto.kvkNumber }
      });

      if (existing) {
        throw new BadRequestException('An employer with this KvK number already exists');
      }

      const employer = await tx.employer.create({
        data: {
          userId,
          companyName: createDto.companyName,
          companyTradeName: createDto.companyTradeName,
          kvkNumber: createDto.kvkNumber,
          vatNumber: createDto.vatNumber,
          companySize: createDto.companySize,
          industry: createDto.industry,
          foundedYear: createDto.foundedYear,
          registeredAddress: createDto.registeredAddress,
          businessAddress: createDto.businessAddress,
          website: createDto.website,
          phone: createDto.phone,
          billingEmail: createDto.billingEmail,
          verificationStatus: 'PENDING',
          billingStatus: 'active',
          subscriptionPlan: 'pay_per_intro'
        }
      });

      return employer;
    });
  }

  async getEmployerProfile(userId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true
          }
        }
      }
    });

    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }

    return employer;
  }

  async updateEmployerProfile(userId: string, updateDto: any) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId }
    });

    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }

    return this.prisma.employer.update({
      where: { userId },
      data: updateDto
    });
  }

  async getVerificationStatus(userId: string) {
    const employer = await this.prisma.employer.findUnique({
      where: { userId },
      select: {
        id: true,
        verificationStatus: true,
        verifiedAt: true,
        companyName: true
      }
    });

    if (!employer) {
      throw new NotFoundException('Employer profile not found');
    }

    return {
      status: employer.verificationStatus,
      verifiedAt: employer.verifiedAt,
      companyName: employer.companyName
    };
  }
}
