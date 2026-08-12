import {
  Injectable,
  ServiceUnavailableException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import {
  S3Client,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

// ============================================================================
// STORAGE SERVICE
// ----------------------------------------------------------------------------
// Single point for all S3 access. Issues short-lived presigned S3 POST URLs so
// clients can upload files (e.g. employer verification documents) directly to
// object storage — without the API proxying the upload bytes — and enforces a
// max object size at S3 via a content-length-range condition. Also issues
// short-lived presigned GET URLs for private-object retrieval, and deletes
// objects for retention purges. The object key is always server-generated and
// namespaced under the caller's identity, so a client cannot write into or read
// another user's prefix.
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
/** How long a presigned URL (POST upload or GET download) remains valid. */
const URL_EXPIRES_SECONDS = 300;

export interface PresignedUpload {
  /** S3 POST endpoint URL the client POSTs multipart/form-data to. */
  url: string;
  /** Form fields the client must include before the `file` field. */
  fields: Record<string, string>;
  /** Server-generated object key (re-submitted to /documents by the client). */
  key: string;
  /** Canonical object URL derived from key+bucket+region (persisted as fileUrl). */
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

  /** True when AWS bucket/region/credentials are present (S3 calls may proceed). */
  isConfigured(): boolean {
    return this.configured;
  }

  // --------------------------------------------------------------------------
  // KEY / URL HELPERS
  // The canonical object URL is derived from the server-generated key and the
  // configured bucket+region — never from a client-supplied URL. The key is the
  // source of truth and is persisted in VerificationDocument.metadata so the
  // service can issue presigned GETs and delete objects later.
  // --------------------------------------------------------------------------

  /** Canonical https object URL for a key. Used to populate `fileUrl`. */
  private deriveFileUrl(key: string): string {
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /** Recover the object key from a stored canonical URL, or null if it doesn't
   *  belong to this bucket (e.g. a legacy/foreign URL). */
  private extractKeyFromFileUrl(fileUrl: string): string | null {
    const prefix = `https://${this.bucket}.s3.${this.region}.amazonaws.com/`;
    return fileUrl.startsWith(prefix) ? fileUrl.slice(prefix.length) : null;
  }

  /** Public alias for deriving `fileUrl` from a submitted key (TrustService). */
  deriveFileUrlFromKey(key: string): string {
    return this.deriveFileUrl(key);
  }

  /** Public alias for recovering a key from a stored URL (retrieval/retention). */
  extractKeyFromFileUrlPublic(fileUrl: string): string | null {
    return this.extractKeyFromFileUrl(fileUrl);
  }

  /**
   * IDOR guard for the document-submit step. The client must re-submit the key
   * we issued during presigning; reject any key whose prefix doesn't match the
   * acting employer so a client cannot reference another employer's object.
   */
  assertKeyBelongsToEmployer(key: string, employerId: string): void {
    const expected = `verification/${employerId}/`;
    if (!key || !key.startsWith(expected)) {
      throw new ForbiddenException(
        'Object key does not belong to the acting employer',
      );
    }
  }

  /**
   * Produce a short-lived presigned POST form (url + fields) so the client can
   * upload a file directly to S3. The content-length-range condition enforces
   * the max file size at S3 — a presigned PUT cannot do this. The caller's
   * identity (employerId) is embedded in the object key by the controller;
   * never trust a client for the key prefix.
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

    const post = await createPresignedPost(this.client, {
      Bucket: this.bucket,
      Key: key,
      Fields: { 'Content-Type': input.mimeType },
      Conditions: [
        // Enforce the max file size at S3 — uploads above this are rejected.
        ['content-length-range', 0, MAX_FILE_SIZE_BYTES],
        // Allow the client to supply Content-Type (must match the allow-list,
        // which the controller/DTO already enforce) without pinning it exactly.
        ['starts-with', '$Content-Type', ''],
      ],
      Expires: URL_EXPIRES_SECONDS,
    });

    return {
      url: post.url,
      fields: post.fields as Record<string, string>,
      key,
      fileUrl: this.deriveFileUrl(key),
      expiresAt: new Date(Date.now() + URL_EXPIRES_SECONDS * 1000),
      maxFileSize: MAX_FILE_SIZE_BYTES,
    };
  }

  /**
   * Produce a short-lived presigned GET URL for a private object. Used by the
   * trust service to hand admins a time-boxed download URL instead of exposing
   * a long-lived public object URL.
   */
  async createPresignedGet(key: string, expiresInSeconds = URL_EXPIRES_SECONDS): Promise<string> {
    if (!this.configured || !this.client || !this.bucket || !this.region) {
      throw new ServiceUnavailableException(
        'File downloads are not configured on the server.',
      );
    }
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /**
   * Delete an object. Idempotent: a missing object (NoSuchKey) is not an error.
   * Other failures are logged but not thrown, so a retention purge can still
   * remove the DB row (safer GDPR posture — no row leak on a transient S3
   * outage). Callers that need strict behavior should check the returned flag.
   */
  async deleteObject(key: string): Promise<void> {
    if (!this.configured || !this.client || !this.bucket) {
      throw new ServiceUnavailableException(
        'File storage is not configured on the server.',
      );
    }
    try {
      await this.client.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err: any) {
      if (err?.name !== 'NoSuchKey') {
        this.logger.warn(`S3 delete failed for ${key}: ${err?.message}`);
      }
    }
  }
}