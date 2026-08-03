import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { PresignVerificationDocumentDto } from './dto/presign-verification-document.dto';

// ============================================================================
// UPLOADS CONTROLLER
// ----------------------------------------------------------------------------
// Issues short-lived presigned S3 PUT URLs so an employer can upload a
// verification document directly to object storage. After the PUT succeeds the
// client submits the returned `fileUrl` (plus a client-computed SHA-256
// `fileHash`) to POST /trust/employers/:employerId/documents.
//
// SECURITY: the acting employer is resolved from the verified JWT (req.user.id)
// and embedded in the object key — never from the request body — so a client
// cannot write into another employer's storage prefix (IDOR).
// ============================================================================

@Controller('uploads')
export class UploadsController {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('verification-document')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER')
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  async presignVerificationDocument(
    @Request() req: any,
    @Body() dto: PresignVerificationDocumentDto,
  ) {
    // Defense in depth: the DTO regex already restricts the MIME type, but
    // re-check against the service allow-list so a future DTO change can't
    // widen the surface on its own.
    if (!this.storage.isAllowedMime(dto.mimeType)) {
      throw new BadRequestException(`Unsupported file type: ${dto.mimeType}`);
    }

    // Resolve the employer from the JWT — do not accept an employerId from
    // the body or query.
    const employer = await this.prisma.employer.findUnique({
      where: { userId: req.user.id },
      select: { id: true },
    });
    if (!employer) {
      throw new BadRequestException('Employer profile not found');
    }

    return this.storage.createPresignedUpload({
      employerId: employer.id,
      fileName: dto.fileName,
      mimeType: dto.mimeType,
    });
  }
}