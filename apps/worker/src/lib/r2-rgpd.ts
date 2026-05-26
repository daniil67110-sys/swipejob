import {
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env, isR2Configured } from './env.js';
import logger from './logger.js';

/**
 * Stories 6.3 + 6.4 — helpers R2 dédiés au pipeline RGPD côté worker.
 *
 * - `uploadRgpdExport` : pose un fichier sous `exports/<userId>/<exportId>/<filename>`.
 * - `presignDownload` : URL signée 7j pour download par le user.
 * - `purgeUserR2Assets` : list+delete tous les objects du préfixe `users/<userId>/`
 *   + `exports/<userId>/`, idempotent. Utilisé par rgpd-delete.
 */

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

export type UploadResult =
  | { ok: true; key: string; mock?: false }
  | { ok: true; key: string; mock: true }
  | { ok: false; error: string };

export function buildExportKey(userId: string, exportId: string, filename: string): string {
  return `exports/${userId}/${exportId}/${filename}`;
}

export async function uploadRgpdExport(input: {
  key: string;
  body: Buffer | Uint8Array;
  contentType: string;
}): Promise<UploadResult> {
  const c = client();
  if (!c || !env.R2_BUCKET_NAME) {
    logger.warn({ key: input.key }, 'R2 not configured — export upload mock');
    return { ok: true, key: input.key, mock: true };
  }
  try {
    await c.send(
      new PutObjectCommand({
        Bucket: env.R2_BUCKET_NAME,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        ServerSideEncryption: 'AES256',
      }),
    );
    return { ok: true, key: input.key };
  } catch (err) {
    logger.error({ err, key: input.key }, 'R2 export upload failed');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}

const SEVEN_DAYS_SECONDS = 7 * 24 * 3600;

export async function presignDownload(key: string): Promise<string | null> {
  const c = client();
  if (!c || !env.R2_BUCKET_NAME) {
    logger.warn({ key }, 'R2 not configured — presign mock');
    return null;
  }
  try {
    const cmd = new GetObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key });
    return await getSignedUrl(c, cmd, { expiresIn: SEVEN_DAYS_SECONDS });
  } catch (err) {
    logger.error({ err, key }, 'R2 presign failed');
    return null;
  }
}

/** Story 6.4 — purge tous les objets liés à un user. Best-effort, idempotent. */
export async function purgeUserR2Assets(userId: string): Promise<{ deleted: number }> {
  const c = client();
  if (!c || !env.R2_BUCKET_NAME) {
    logger.warn({ userId }, 'R2 not configured — purge skipped');
    return { deleted: 0 };
  }
  const prefixes = [`users/${userId}/`, `exports/${userId}/`];
  let total = 0;
  for (const prefix of prefixes) {
    let continuationToken: string | undefined;
    do {
      try {
        const list = await c.send(
          new ListObjectsV2Command({
            Bucket: env.R2_BUCKET_NAME,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          }),
        );
        const keys = (list.Contents ?? []).map((o) => o.Key).filter((k): k is string => Boolean(k));
        if (keys.length > 0) {
          await c.send(
            new DeleteObjectsCommand({
              Bucket: env.R2_BUCKET_NAME,
              Delete: { Objects: keys.map((Key) => ({ Key })) },
            }),
          );
          total += keys.length;
        }
        continuationToken = list.IsTruncated ? list.NextContinuationToken : undefined;
      } catch (err) {
        logger.error({ err, prefix }, 'R2 purge list/delete failed');
        break;
      }
    } while (continuationToken);
  }
  return { deleted: total };
}

export async function deleteR2Object(key: string): Promise<void> {
  const c = client();
  if (!c || !env.R2_BUCKET_NAME) return;
  try {
    await c.send(new DeleteObjectCommand({ Bucket: env.R2_BUCKET_NAME, Key: key }));
  } catch (err) {
    logger.warn({ err, key }, 'R2 delete object failed');
  }
}
