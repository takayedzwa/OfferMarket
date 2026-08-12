import { ServiceUnavailableException, ForbiddenException } from '@nestjs/common';
import { StorageService } from '../storage.service';

// Mock the presigned-post SDK so createPresignedUpload can be exercised without
// real AWS credentials. The factory is hoisted above the imports by jest.
jest.mock('@aws-sdk/s3-presigned-post', () => ({
  createPresignedPost: jest.fn().mockResolvedValue({
    url: 'https://test-bucket.s3.us-east-1.amazonaws.com',
    fields: { key: 'placeholder', 'Content-Type': 'application/pdf' },
  }),
}));

// Configure env for any test that needs `configured=true`. Saved/restored per
// describe block below.
function withConfiguredEnv() {
  process.env.AWS_S3_BUCKET = 'test-bucket';
  process.env.AWS_S3_REGION = 'us-east-1';
  process.env.AWS_ACCESS_KEY_ID = 'test-key';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
}

describe('StorageService', () => {
  describe('isAllowedMime', () => {
    it('accepts the verification allow-list and rejects everything else', () => {
      const service = new StorageService();

      expect(service.isAllowedMime('application/pdf')).toBe(true);
      expect(service.isAllowedMime('image/png')).toBe(true);
      expect(service.isAllowedMime('image/jpeg')).toBe(true);
      expect(service.isAllowedMime('image/webp')).toBe(true);

      expect(service.isAllowedMime('application/octet-stream')).toBe(false);
      expect(service.isAllowedMime('image/svg+xml')).toBe(false);
      expect(service.isAllowedMime('text/html')).toBe(false);
      expect(service.isAllowedMime('')).toBe(false);
    });
  });

  describe('createPresignedUpload', () => {
    const baseEnv = { ...process.env };

    afterEach(() => {
      process.env = { ...baseEnv };
    });

    it('throws ServiceUnavailableException when AWS is not configured', async () => {
      delete process.env.AWS_S3_BUCKET;
      delete process.env.AWS_S3_BUCKET_NAME;
      delete process.env.AWS_S3_REGION;
      delete process.env.AWS_REGION;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      const service = new StorageService();
      await expect(
        service.createPresignedUpload({
          employerId: 'employer-1',
          fileName: 'kvk.pdf',
          mimeType: 'application/pdf',
        }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    it('returns a presigned POST form (url + fields) with a namespaced key', async () => {
      withConfiguredEnv();
      const service = new StorageService();

      const result = await service.createPresignedUpload({
        employerId: 'employer-1',
        fileName: 'kvk.pdf',
        mimeType: 'application/pdf',
      });

      expect(result.url).toContain('test-bucket');
      expect(result.fields).toBeDefined();
      expect(result.key).toContain('verification/employer-1/');
      expect(result.fileUrl).toContain('verification/employer-1/');
      expect(result.maxFileSize).toBe(10 * 1024 * 1024);
    });
  });

  describe('maxFileSize', () => {
    it('advertises a 10 MB cap', () => {
      expect(new StorageService().maxFileSize).toBe(10 * 1024 * 1024);
    });
  });

  describe('assertKeyBelongsToEmployer', () => {
    it('accepts a key under the acting employer prefix', () => {
      const service = new StorageService();
      expect(() =>
        service.assertKeyBelongsToEmployer('verification/employer-1/uuid-doc.pdf', 'employer-1'),
      ).not.toThrow();
    });

    it('rejects a key under another employer prefix (IDOR)', () => {
      const service = new StorageService();
      expect(() =>
        service.assertKeyBelongsToEmployer('verification/employer-2/uuid-doc.pdf', 'employer-1'),
      ).toThrow(ForbiddenException);
    });

    it('rejects a foreign / non-namespaced key', () => {
      const service = new StorageService();
      expect(() =>
        service.assertKeyBelongsToEmployer('evil/path.pdf', 'employer-1'),
      ).toThrow(ForbiddenException);
    });
  });

  describe('key <-> fileUrl helpers', () => {
    const baseEnv = { ...process.env };
    afterEach(() => {
      process.env = { ...baseEnv };
    });

    it('derives a canonical fileUrl and recovers the key from it', () => {
      withConfiguredEnv();
      const service = new StorageService();
      const key = 'verification/employer-1/uuid-doc.pdf';
      const url = service.deriveFileUrlFromKey(key);
      expect(url).toBe(`https://test-bucket.s3.us-east-1.amazonaws.com/${key}`);
      expect(service.extractKeyFromFileUrlPublic(url)).toBe(key);
    });

    it('returns null when extracting from a foreign URL', () => {
      withConfiguredEnv();
      const service = new StorageService();
      expect(
        service.extractKeyFromFileUrlPublic('https://evil.example.com/doc.pdf'),
      ).toBeNull();
    });
  });

  describe('createPresignedGet / deleteObject', () => {
    const baseEnv = { ...process.env };
    afterEach(() => {
      process.env = { ...baseEnv };
    });

    it('throw ServiceUnavailableException when AWS is not configured', async () => {
      delete process.env.AWS_S3_BUCKET;
      delete process.env.AWS_S3_REGION;
      delete process.env.AWS_ACCESS_KEY_ID;
      delete process.env.AWS_SECRET_ACCESS_KEY;

      const service = new StorageService();
      await expect(service.createPresignedGet('verification/x/y.pdf')).rejects.toThrow(
        ServiceUnavailableException,
      );
      await expect(service.deleteObject('verification/x/y.pdf')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });
});