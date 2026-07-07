import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { AnonymousProfilePipe } from './pipes/anonymous-profile.pipe';
import { CreateWorkerDto, UpdateWorkerDto, BlockCompanyDto, CreateProfileSkillDto, UpdateProfileSkillDto, CreateCertificationDto, UpdateCertificationDto, CreateWorkerLanguageDto, UpdateWorkerLanguageDto, CreateEducationDto, UpdateEducationDto, CreateProjectExperienceDto, UpdateProjectExperienceDto } from './dto/worker.dto';

class SimpleAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];
    const userRole = request.headers['x-user-role'];

    if (!userId || !userRole) {
      throw new BadRequestException('User authentication required');
    }

    request.user = { id: userId, role: userRole };
    return true;
  }
}

@Controller('workers')
export class WorkersController {
  constructor(private readonly workersService: WorkersService) {}

  // ===========================================================================
  // GET AVAILABLE TRADES & SPECIALIZATIONS
  // ===========================================================================

  @Get('trades')
  async getAvailableTrades() {
    return this.workersService.getAvailableTrades();
  }

  @Get('specializations')
  async getAvailableSpecializations() {
    return this.workersService.getAvailableSpecializations();
  }

  @Get('skills')
  async getSkillsCatalog(@Query('category') category?: string) {
    return this.workersService.getSkillsCatalog(category);
  }

  // ===========================================================================
  // SEARCH WORKERS (For Employers - Anonymous Profiles)
  // ===========================================================================

  @Get('search')
  @UseGuards(SimpleAuthGuard)
  async searchWorkers(
    @Query('trade') trade?: string,
    @Query('regionId') regionId?: string,
    @Query('availability') availability?: string,
    @Query('minExperience') minExperience?: string,
    @Query('maxExperience') maxExperience?: string,
    @Query('specializations') specializations?: string,
    @Query('hasDrivingLicense') hasDrivingLicense?: string,
    @Query('workAuthorization') workAuthorization?: string,
    @Query('skillIds') skillIds?: string,
    @Query('certificationNames') certificationNames?: string,
    @Query('language') language?: string,
    @Query('languageMinLevel') languageMinLevel?: string,
    @Query('employmentTypes') employmentTypes?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const minExp = minExperience && !isNaN(Number(minExperience)) ? Number(minExperience) : undefined;
    const maxExp = maxExperience && !isNaN(Number(maxExperience)) ? Number(maxExperience) : undefined;

    const searchFilters: any = {
      trade,
      regionId,
      availability,
      minExperience: minExp,
      maxExperience: maxExp,
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 20
    };

    if (specializations) {
      searchFilters.specializations = specializations.split(',');
    }

    if (hasDrivingLicense !== undefined) {
      searchFilters.hasDrivingLicense = hasDrivingLicense === 'true';
    }

    if (workAuthorization) {
      searchFilters.workAuthorization = workAuthorization;
    }

    if (skillIds) {
      searchFilters.skillIds = skillIds.split(',');
    }

    if (certificationNames) {
      searchFilters.certificationNames = certificationNames.split(',');
    }

    if (language && languageMinLevel) {
      searchFilters.languageMinLevel = { language, level: languageMinLevel };
    }

    if (employmentTypes) {
      searchFilters.employmentTypes = employmentTypes.split(',');
    }

    return this.workersService.searchWorkers(searchFilters);
  }

  // ===========================================================================
  // GET MY PROFILE (Worker's private view)
  // ===========================================================================

  @Get('me')
  @UseGuards(SimpleAuthGuard)
  async getMyProfile(@Query('userId') userId: string) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.workersService.getPrivateProfile(userId);
  }

  // ===========================================================================
  // CREATE MY PROFILE
  // ===========================================================================

  @Post()
  @UseGuards(SimpleAuthGuard)
  async createProfile(
    @Body() createDto: CreateWorkerDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.workersService.createWorkerProfile(userId, createDto);
  }

  // ===========================================================================
  // UPDATE MY PROFILE
  // ===========================================================================

  @Patch('me')
  @UseGuards(SimpleAuthGuard)
  async updateProfile(
    @Body() updateDto: UpdateWorkerDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }

    return this.workersService.updateWorkerProfile(userId, updateDto);
  }

  // ===========================================================================
  // PROFILE SKILL CRUD
  // ===========================================================================

  @Post('me/skills')
  @UseGuards(SimpleAuthGuard)
  async addProfileSkill(
    @Body() dto: CreateProfileSkillDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.addProfileSkill(userId, dto);
  }

  @Patch('me/skills/:id')
  @UseGuards(SimpleAuthGuard)
  async updateProfileSkill(
    @Param('id') id: string,
    @Body() dto: UpdateProfileSkillDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.updateProfileSkill(userId, id, dto);
  }

  @Delete('me/skills/:id')
  @UseGuards(SimpleAuthGuard)
  async removeProfileSkill(
    @Param('id') id: string,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.removeProfileSkill(userId, id);
  }

  // ===========================================================================
  // CERTIFICATION CRUD
  // ===========================================================================

  @Post('me/certifications')
  @UseGuards(SimpleAuthGuard)
  async addCertification(
    @Body() dto: CreateCertificationDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.addCertification(userId, dto);
  }

  @Patch('me/certifications/:id')
  @UseGuards(SimpleAuthGuard)
  async updateCertification(
    @Param('id') id: string,
    @Body() dto: UpdateCertificationDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.updateCertification(userId, id, dto);
  }

  @Delete('me/certifications/:id')
  @UseGuards(SimpleAuthGuard)
  async removeCertification(
    @Param('id') id: string,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.removeCertification(userId, id);
  }

  // ===========================================================================
  // LANGUAGE CRUD
  // ===========================================================================

  @Post('me/languages')
  @UseGuards(SimpleAuthGuard)
  async addLanguage(
    @Body() dto: CreateWorkerLanguageDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.addLanguage(userId, dto);
  }

  @Patch('me/languages/:id')
  @UseGuards(SimpleAuthGuard)
  async updateLanguage(
    @Param('id') id: string,
    @Body() dto: UpdateWorkerLanguageDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.updateLanguage(userId, id, dto);
  }

  @Delete('me/languages/:id')
  @UseGuards(SimpleAuthGuard)
  async removeLanguage(
    @Param('id') id: string,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.removeLanguage(userId, id);
  }

  // ===========================================================================
  // EDUCATION CRUD
  // ===========================================================================

  @Post('me/education')
  @UseGuards(SimpleAuthGuard)
  async addEducation(
    @Body() dto: CreateEducationDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.addEducation(userId, dto);
  }

  @Patch('me/education/:id')
  @UseGuards(SimpleAuthGuard)
  async updateEducation(
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.updateEducation(userId, id, dto);
  }

  @Delete('me/education/:id')
  @UseGuards(SimpleAuthGuard)
  async removeEducation(
    @Param('id') id: string,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.removeEducation(userId, id);
  }

  // ===========================================================================
  // PROJECT EXPERIENCE CRUD
  // ===========================================================================

  @Post('me/projects')
  @UseGuards(SimpleAuthGuard)
  async addProjectExperience(
    @Body() dto: CreateProjectExperienceDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.addProjectExperience(userId, dto);
  }

  @Patch('me/projects/:id')
  @UseGuards(SimpleAuthGuard)
  async updateProjectExperience(
    @Param('id') id: string,
    @Body() dto: UpdateProjectExperienceDto,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.updateProjectExperience(userId, id, dto);
  }

  @Delete('me/projects/:id')
  @UseGuards(SimpleAuthGuard)
  async removeProjectExperience(
    @Param('id') id: string,
    @Query('userId') userId: string
  ) {
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    return this.workersService.removeProjectExperience(userId, id);
  }

  // ===========================================================================
  // GET PUBLIC PROFILE (Anonymous - for employers)
  // ===========================================================================

  @Get(':publicId')
  async getPublicProfile(
    @Param('publicId') publicId: string,
    @Query('employerId') employerId?: string
  ) {
    return this.workersService.getPublicProfile(publicId, employerId);
  }

  // ===========================================================================
  // BLOCK COMPANY (Worker Privacy)
  // ===========================================================================

  @Post('me/block')
  @UseGuards(SimpleAuthGuard)
  async blockCompany(
    @Body() blockDto: BlockCompanyDto,
    @Query('workerId') workerId: string
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.workersService.blockCompany(workerId, blockDto.employerId, blockDto.reason);
  }

  @Delete('me/block/:employerId')
  @UseGuards(SimpleAuthGuard)
  async unblockCompany(
    @Param('employerId') employerId: string,
    @Query('workerId') workerId: string
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.workersService.unblockCompany(workerId, employerId);
  }

  @Get('me/blocked')
  @UseGuards(SimpleAuthGuard)
  async getBlockedCompanies(@Query('workerId') workerId: string) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.workersService.getBlockedCompanies(workerId);
  }

  // ===========================================================================
  // UPDATE VISIBILITY
  // ===========================================================================

  @Patch('me/visibility')
  @UseGuards(SimpleAuthGuard)
  async updateVisibility(
    @Body('visibility') visibility: 'ALL_VERIFIED' | 'SELECTED_COMPANIES' | 'HIDDEN',
    @Query('workerId') workerId: string
  ) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.workersService.updateVisibility(workerId, visibility);
  }

  // ===========================================================================
  // DELETE PROFILE
  // ===========================================================================

  @Delete('me')
  @UseGuards(SimpleAuthGuard)
  async deleteProfile(@Query('workerId') workerId: string) {
    if (!workerId) {
      throw new BadRequestException('workerId is required');
    }

    return this.workersService.deleteWorkerProfile(workerId);
  }
}