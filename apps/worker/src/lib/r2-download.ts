import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env, isR2Configured } from './env.js';
import logger from './logger.js';

let cached: S3Client | null = null;

function client(): S3Client | null {
  if (!isR2Configured || !env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    return null;
  }
  if (!cached) {
    cached = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return cached;
}

/**
 * Download CV PDF from R2 (Story 3.6). Returns null if R2 not configured.
 */
export async function downloadCvFromR2(key: string): Promise<Buffer | null> {
  const c = client();
  if (!c || !env.R2_BUCKET_NAME) {
    logger.warn({ key }, 'R2 not configured — CV download skipped (mock mode)');
    return null;
  }
  try {
    const res = await c.send(new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
    const stream = res.Body;
    if (!stream || !('transformToByteArray' in stream)) return null;
    const bytes = await (
      stream as { transformToByteArray: () => Promise<Uint8Array> }
    ).transformToByteArray();
    return Buffer.from(bytes);
  } catch (err) {
    logger.error({ err, key }, 'R2 download failed');
    return null;
  }
}
