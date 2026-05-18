import 'server-only';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { createId } from '@swipejob/db/lib/id';
import { env, isR2Configured } from './env';
import { serverLogger as logger } from './logger.server';

export type UploadResult =
  | { ok: true; key: string; mock?: false }
  | { ok: true; key: string; mock: true }
  | { ok: false; error: string };

let cachedClient: S3Client | null = null;
function getClient(): S3Client | null {
  if (!isR2Configured || !env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = new S3Client({
      region: 'auto',
      endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return cachedClient;
}

export function generateR2Key(userId: string, version: number): string {
  return `users/${userId}/cvs/v${version}/${createId()}.pdf`;
}

export async function uploadCvToR2(input: {
  buffer: Buffer | Uint8Array;
  contentType: string;
  key: string;
}): Promise<UploadResult> {
  const client = getClient();
  if (!client || !env.R2_BUCKET_NAME) {
    logger.warn(
      { key: input.key, size: input.buffer.length },
      'R2 not configured — upload logged in mock mode',
    );
    return { ok: true, key: input.key, mock: true };
  }
  try {
    await client.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: input.key,
        Body: input.buffer,
        ContentType: input.contentType,
        ServerSideEncryption: 'AES256',
      }),
    );
    return { ok: true, key: input.key };
  } catch (err) {
    logger.error({ err, key: input.key }, 'R2 upload failed');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
