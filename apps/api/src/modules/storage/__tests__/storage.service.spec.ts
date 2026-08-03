import { ServiceUnavailableException } from '@nestjs/common';
import { StorageService } from '../storage.service';

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
  });

  describe('maxFileSize', () => {
    it('advertises a 10 MB cap', () => {
      expect(new StorageService().maxFileSize).toBe(10 * 1024 * 1024);
    });
  });
});