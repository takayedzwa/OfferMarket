import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, BadRequestException, Request } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { WorkersService } from './workers.service';
import { AnonymousProfilePipe } from './pipes/anonymous-profile.pipe';
import { CreateWorkerDto, UpdateWorkerDto, BlockCompanyDto, CreateProfileSkillDto, UpdateProfileSkillDto, CreateCertificationDto, UpdateCertificationDto, CreateWorkerLanguageDto, UpdateWorkerLanguageDto, CreateEducationDto, UpdateEducationDto, CreateProjectExperienceDto, UpdateProjectExperienceDto } from './dto/worker.dto';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('workers')
export class WorkersController {
  constructor(
    private readonly workersService: WorkersService,
    private readonly prisma: PrismaService,
  ) {}

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
  @UseGuards(JwtAuthGuard)
  async searchWorkers(
    @Request() req: any,
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

    // Resolve employer ID from authenticated user for SELECTED_COMPANIES visibility.
    // If the user is an employer, include workers whose visibility includes this employer.
    let employerId: string | undefined;
    if (req.user.role === 'EMPLOYER') {
      const employer = await this.prisma.employer.findUnique({
        where: { userId: req.user.id },
        select: { id: true },
      });
      employerId = employer?.id;
    }

    const searchFilters: any = {
      trade,
      regionId,
      availability,
      minExperience: minExp,
      maxExperience: maxExp,
      page: page ? parseInt(String(page)) : 1,
      limit: limit ? parseInt(String(limit)) : 20,
      employerId,
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

    if (language) {
      if (languageMinLevel) {
        searchFilters.languageMinLevel = { language, level: languageMinLevel };
      } else {
        // Language-only filter (any level)
        searchFilters.languageFilter = { language };
      }
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async getMyProfile(@Request() req: any) {
    return this.workersService.getPrivateProfile(req.user.id);
  }

  // ===========================================================================
  // CREATE MY PROFILE
  // ===========================================================================

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  async createProfile(
    @Body() createDto: CreateWorkerDto,
    @Request() req: any
  ) {
    return this.workersService.createWorkerProfile(req.user.id, createDto);
  }

  // ===========================================================================
  // UPDATE MY PROFILE
  // ===========================================================================

  @Patch('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  async updateProfile(
    @Body() updateDto: UpdateWorkerDto,
    @Request() req: any
  ) {
    return this.workersService.updateWorkerProfile(req.user.id, updateDto);
  }

  // ===========================================================================
  // PROFILE SKILL CRUD
  // ===========================================================================

  @Post('me/skills')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async addProfileSkill(
    @Body() dto: CreateProfileSkillDto,
    @Request() req: any
  ) {
    return this.workersService.addProfileSkill(req.user.id, dto);
  }

  @Patch('me/skills/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async updateProfileSkill(
    @Param('id') id: string,
    @Body() dto: UpdateProfileSkillDto,
    @Request() req: any
  ) {
    return this.workersService.updateProfileSkill(req.user.id, id, dto);
  }

  @Delete('me/skills/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async removeProfileSkill(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.workersService.removeProfileSkill(req.user.id, id);
  }

  // ===========================================================================
  // CERTIFICATION CRUD
  // ===========================================================================

  @Post('me/certifications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @Throttle({ short: { ttl: 60000, limit: 15 } })
  async addCertification(
    @Body() dto: CreateCertificationDto,
    @Request() req: any
  ) {
    return this.workersService.addCertification(req.user.id, dto);
  }

  @Patch('me/certifications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async updateCertification(
    @Param('id') id: string,
    @Body() dto: UpdateCertificationDto,
    @Request() req: any
  ) {
    return this.workersService.updateCertification(req.user.id, id, dto);
  }

  @Delete('me/certifications/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async removeCertification(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.workersService.removeCertification(req.user.id, id);
  }

  // ===========================================================================
  // LANGUAGE CRUD
  // ===========================================================================

  @Post('me/languages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  async addLanguage(
    @Body() dto: CreateWorkerLanguageDto,
    @Request() req: any
  ) {
    return this.workersService.addLanguage(req.user.id, dto);
  }

  @Patch('me/languages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async updateLanguage(
    @Param('id') id: string,
    @Body() dto: UpdateWorkerLanguageDto,
    @Request() req: any
  ) {
    return this.workersService.updateLanguage(req.user.id, id, dto);
  }

  @Delete('me/languages/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async removeLanguage(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.workersService.removeLanguage(req.user.id, id);
  }

  // ===========================================================================
  // EDUCATION CRUD
  // ===========================================================================

  @Post('me/education')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  async addEducation(
    @Body() dto: CreateEducationDto,
    @Request() req: any
  ) {
    return this.workersService.addEducation(req.user.id, dto);
  }

  @Patch('me/education/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async updateEducation(
    @Param('id') id: string,
    @Body() dto: UpdateEducationDto,
    @Request() req: any
  ) {
    return this.workersService.updateEducation(req.user.id, id, dto);
  }

  @Delete('me/education/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async removeEducation(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.workersService.removeEducation(req.user.id, id);
  }

  // ===========================================================================
  // PROJECT EXPERIENCE CRUD
  // ===========================================================================

  @Post('me/projects')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  @Throttle({ short: { ttl: 60000, limit: 15 } })
  async addProjectExperience(
    @Body() dto: CreateProjectExperienceDto,
    @Request() req: any
  ) {
    return this.workersService.addProjectExperience(req.user.id, dto);
  }

  @Patch('me/projects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async updateProjectExperience(
    @Param('id') id: string,
    @Body() dto: UpdateProjectExperienceDto,
    @Request() req: any
  ) {
    return this.workersService.updateProjectExperience(req.user.id, id, dto);
  }

  @Delete('me/projects/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async removeProjectExperience(
    @Param('id') id: string,
    @Request() req: any
  ) {
    return this.workersService.removeProjectExperience(req.user.id, id);
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async blockCompany(
    @Body() blockDto: BlockCompanyDto,
    @Request() req: any
  ) {
    return this.workersService.blockCompany(req.user.id, blockDto.employerId, blockDto.reason);
  }

  @Delete('me/block/:employerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async unblockCompany(
    @Param('employerId') employerId: string,
    @Request() req: any
  ) {
    return this.workersService.unblockCompany(req.user.id, employerId);
  }

  @Get('me/blocked')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async getBlockedCompanies(@Request() req: any) {
    return this.workersService.getBlockedCompanies(req.user.id);
  }

  // ===========================================================================
  // VISIBLE COMPANIES (SELECTED_COMPANIES Visibility)
  // ===========================================================================

  @Post('me/visible-companies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async addVisibleCompany(
    @Body() body: { employerId: string },
    @Request() req: any
  ) {
    if (!body.employerId) {
      throw new BadRequestException('employerId is required');
    }
    return this.workersService.addVisibleCompany(req.user.id, body.employerId);
  }

  @Delete('me/visible-companies/:employerId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async removeVisibleCompany(
    @Param('employerId') employerId: string,
    @Request() req: any
  ) {
    return this.workersService.removeVisibleCompany(req.user.id, employerId);
  }

  @Get('me/visible-companies')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async getVisibleCompanies(@Request() req: any) {
    return this.workersService.getVisibleCompanies(req.user.id);
  }

  // ===========================================================================
  // UPDATE VISIBILITY
  // ===========================================================================

  @Patch('me/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async updateVisibility(
    @Body('visibility') visibility: 'ALL_VERIFIED' | 'SELECTED_COMPANIES' | 'HIDDEN',
    @Request() req: any
  ) {
    return this.workersService.updateVisibility(req.user.id, visibility);
  }

  // ===========================================================================
  // DELETE PROFILE
  // ===========================================================================

  @Delete('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('WORKER')
  async deleteProfile(
    @Request() req: any,
    @Query('force') force?: string
  ) {
    return this.workersService.deleteWorkerProfile(req.user.id, force === 'true');
  }
}