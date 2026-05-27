/**
 * Story 6.5 — Upload de l'archive mensuelle audit_logs vers R2.
 *
 * Deux modes :
 * - **Bucket dédié** (recommandé prod) : vars `R2_AUDIT_BUCKET` + creds + endpoint.
 *   Permet d'appliquer un object lock COMPLIANCE 13 mois indépendant du bucket principal.
 * - **Fallback** : bucket principal `R2_BUCKET_NAME` avec préfixe `audit-archive/`.
 *
 * Cf. docs/runbooks/audit-export.md pour la procédure setup.
 */
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { env, isR2Configured } from './env.js';
import logger from './logger.js';

let cached: S3Client | null = null;

function client(): S3Client | null {
  if (cached) return cached;
  if (env.R2_AUDIT_BUCKET && env.R2_AUDIT_ACCESS_KEY_ID && env.R2_AUDIT_SECRET_ACCESS_KEY) {
    const endpoint =
      env.R2_AUDIT_ENDPOINT ??
      (env.R2_ACCOUNT_ID ? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` : null);
    if (!endpoint) {
      logger.warn(
        'R2_AUDIT_* configured but no endpoint resolvable — falling back to main bucket.',
      );
    } else {
      cached = new S3Client({
        region: 'auto',
        endpoint,
        credentials: {
          accessKeyId: env.R2_AUDIT_ACCESS_KEY_ID,
          secretAccessKey: env.R2_AUDIT_SECRET_ACCESS_KEY,
        },
      });
      return cached;
    }
  }
  if (!isR2Configured || !env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    return null;
  }
  cached = new S3Client({
    region: 'auto',
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  return cached;
}

function bucket(): string | null {
  return env.R2_AUDIT_BUCKET ?? env.R2_BUCKET_NAME ?? null;
}

/** Clé R2 selon convention runbook : `audit-archive/<YYYY>/<MM>/audit-<YYYY-MM>.jsonl.gz` */
export function buildAuditArchiveKey(month: string): string {
  const [year, mm] = month.split('-');
  return `audit-archive/${year}/${mm}/audit-${month}.jsonl.gz`;
}

export type AuditUploadResult =
  | { ok: true; key: string; bytes: number; bucket: string }
  | { ok: false; error: string };

export async function uploadAuditArchive(input: {
  key: string;
  body: Buffer;
  contentType?: string;
}): Promise<AuditUploadResult> {
  const c = client();
  const b = bucket();
  if (!c || !b) {
    return { ok: false, error: 'r2-not-configured' };
  }
  try {
    await c.send(
      new PutObjectCommand({
        Bucket: b,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType ?? 'application/gzip',
        ContentEncoding: 'gzip',
        ServerSideEncryption: 'AES256',
      }),
    );
    return { ok: true, key: input.key, bytes: input.body.length, bucket: b };
  } catch (err) {
    logger.error({ err, key: input.key }, 'R2 audit archive upload failed');
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' };
  }
}
