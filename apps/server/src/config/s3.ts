import { HeadBucketCommand, CreateBucketCommand, S3Client } from '@aws-sdk/client-s3';
import { env } from './env.js';

export const s3Client = new S3Client({
  endpoint: env.s3.endpoint,
  region: 'us-east-1', // MinIO ignores this, the SDK just requires a value
  credentials: {
    accessKeyId: env.s3.accessKey,
    secretAccessKey: env.s3.secretKey,
  },
  forcePathStyle: true, // required for MinIO's path-style bucket addressing
});

// Local MinIO doesn't come with the bucket pre-created — this makes bucket
// provisioning part of the app's own boot sequence instead of a manual,
// undocumented setup step.
export async function ensureBucketExists(): Promise<void> {
  try {
    await s3Client.send(new HeadBucketCommand({ Bucket: env.s3.bucket }));
  } catch {
    await s3Client.send(new CreateBucketCommand({ Bucket: env.s3.bucket }));
  }
}
