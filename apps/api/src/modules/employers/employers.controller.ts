import { Controller, Get, Post, Patch, Body, Query, UseGuards } from '@nestjs/common';
import { EmployersService } from './employers.service';

class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];

    if (!userId) {
      throw new BadRequestException('User authentication required');
    }

    request.user = { id: userId };
    return true;
  }
}

@Controller('employers')
export class EmployersController {
  constructor(private readonly employersService: EmployersService) {}

  @Post()
  @UseGuards(SimpleAuthGuard)
  async createProfile(@Body() createDto: any, @Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.employersService.createEmployerProfile(userId, createDto);
  }

  @Get('me')
  @UseGuards(SimpleAuthGuard)
  async getMyProfile(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.employersService.getEmployerProfile(userId);
  }

  @Patch('me')
  @UseGuards(SimpleAuthGuard)
  async updateProfile(@Body() updateDto: any, @Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.employersService.updateEmployerProfile(userId, updateDto);
  }

  @Get('me/verification')
  @UseGuards(SimpleAuthGuard)
  async getVerificationStatus(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.employersService.getVerificationStatus(userId);
  }
}
