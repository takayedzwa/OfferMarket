import {
  Injectable,
  ServiceUnavailableException,
  Logger,
} from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// ============================================================================
// STORAGE SERVICE
// ----------------------------------------------------------------------------
// Single point for issuing short-lived presigned S3 PUT URLs so clients can
// upload files (e.g. employer verification documents) directly to object
// storage, without the API proxying the upload bytes. The object key is always
// server-generated and namespaced under the caller's identity, so a client
// cannot write into another user's prefix.
//
// In environments where AWS credentials / bucket are not configured, the
// service refuses with a clear ServiceUnavailableException rather than
// silently failing or emitting a broken URL.
// ============================================================================

export const VERIFICATION_MIME_TYPES = [
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;
export type VerificationMime = (typeof VERIFICATION_MIME_TYPES)[number];

/** Maximum upload size advertised to clients (10 MB). */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
/** How long a presigned URL remains valid. */
const URL_EXPIRES_SECONDS = 300;

export interface PresignedUpload {
  uploadUrl: string;
  key: string;
  /** Canonical object URL to persist as the document's fileUrl. */
  fileUrl: string;
  expiresAt: Date;
  maxFileSize: number;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string | undefined;
  private readonly region: string | undefined;
  private readonly configured: boolean;

  constructor() {
    this.bucket = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
    this.region = process.env.AWS_S3_REGION || process.env.AWS_REGION;
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    this.configured = !!(this.bucket && this.region && accessKeyId && secretAccessKey);

    this.client = this.configured
      ? new S3Client({
          region: this.region,
          credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
        })
      : null;

    if (!this.configured) {
      this.logger.warn(
        'StorageService is not configured (AWS_S3_BUCKET / AWS_S3_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY missing). Presigned uploads will be rejected.',
      );
    }
  }

  isAllowedMime(mime: string): mime is VerificationMime {
    return (VERIFICATION_MIME_TYPES as readonly string[]).includes(mime);
  }

  get maxFileSize(): number {
    return MAX_FILE_SIZE_BYTES;
  }

  /**
   * Produce a short-lived presigned PUT URL. The caller's identity (employerId)
   * is embedded in the object key by the controller — never trust a client for
   * the key prefix.
   */
  async createPresignedUpload(input: {
    employerId: string;
    fileName: string;
    mimeType: VerificationMime;
  }): Promise<PresignedUpload> {
    if (!this.configured || !this.client || !this.bucket || !this.region) {
      throw new ServiceUnavailableException(
        'File uploads are not configured on the server.',
      );
    }

    // Sanitize the filename to path-safe characters and cap its length so it
    // cannot escape the generated key structure.
    const safeName = input.fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_').slice(0, 80) || 'document';
    const key = `verification/${input.employerId}/${randomUUID()}-${safeName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: input.mimeType,
    });

    const uploadUrl = await getSignedUrl(this.client, command, {
      expiresIn: URL_EXPIRES_SECONDS,
    });

    return {
      uploadUrl,
      key,
      fileUrl: `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`,
      expiresAt: new Date(Date.now() + URL_EXPIRES_SECONDS * 1000),
      maxFileSize: MAX_FILE_SIZE_BYTES,
    };
  }
}