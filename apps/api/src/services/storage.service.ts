import * as Minio from 'minio';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

// Configuration from environment
const minioConfig = {
  endPoint: process.env.MINIO_ENDPOINT || 'localhost',
  port: parseInt(process.env.MINIO_PORT || '9000', 10),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
  secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin',
};

const DEFAULT_BUCKET = process.env.MINIO_BUCKET || 'siba-files';

// MinIO client instance
const minioClient = new Minio.Client(minioConfig);

/**
 * Storage Service for MinIO operations
 */
export const storageService = {
  /**
   * Initialize bucket if it doesn't exist
   */
  async initBucket(bucketName: string = DEFAULT_BUCKET): Promise<void> {
    try {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName);
        console.log(`[Storage] Bucket '${bucketName}' created successfully`);

        // Set bucket policy to allow public read (for images)
        const policy = {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { AWS: ['*'] },
              Action: ['s3:GetObject'],
              Resource: [`arn:aws:s3:::${bucketName}/*`],
            },
          ],
        };
        await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
      }
    } catch (error) {
      console.error('[Storage] Error initializing bucket:', error);
      throw error;
    }
  },

  /**
   * Upload a file to MinIO
   */
  async uploadFile(
    file: Express.Multer.File,
    bucket: string = DEFAULT_BUCKET
  ): Promise<{
    nombreOriginal: string;
    nombreStorage: string;
    mimeType: string;
    tamanio: number;
    bucket: string;
    url: string;
  }> {
    // Generate unique filename
    const ext = path.extname(file.originalname);
    const nombreStorage = `${uuidv4()}${ext}`;

    await this.initBucket(bucket);

    // Upload to MinIO
    await minioClient.putObject(bucket, nombreStorage, file.buffer, file.size, {
      'Content-Type': file.mimetype,
    });

    // Generate URL
    const url = this.getPublicUrl(nombreStorage, bucket);

    return {
      nombreOriginal: file.originalname,
      nombreStorage,
      mimeType: file.mimetype,
      tamanio: file.size,
      bucket,
      url,
    };
  },

  /**
   * Delete a file from MinIO
   */
  async deleteFile(nombreStorage: string, bucket: string = DEFAULT_BUCKET): Promise<void> {
    try {
      await minioClient.removeObject(bucket, nombreStorage);
    } catch (error) {
      console.error('[Storage] Error deleting file:', error);
      throw error;
    }
  },

  /**
   * Get a signed URL for temporary access (7 days)
   */
  async getSignedUrl(
    nombreStorage: string,
    bucket: string = DEFAULT_BUCKET,
    expirySeconds: number = 7 * 24 * 60 * 60
  ): Promise<string> {
    return await minioClient.presignedGetObject(bucket, nombreStorage, expirySeconds);
  },

  /**
   * Get public URL for a file
   */
  getPublicUrl(nombreStorage: string, bucket: string = DEFAULT_BUCKET): string {
    const protocol = minioConfig.useSSL ? 'https' : 'http';
    const port = minioConfig.port === 80 || minioConfig.port === 443 ? '' : `:${minioConfig.port}`;
    return `${protocol}://${minioConfig.endPoint}${port}/${bucket}/${nombreStorage}`;
  },
};

export default storageService;
