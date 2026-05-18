import 'server-only';
import * as Sentry from '@sentry/nextjs';
import { headers } from 'next/headers';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { auditLogs } from '@swipejob/db/schema';
import { redactPII } from '@swipejob/types';
import { serverLogger as logger } from './logger.server';

export type ActorType = 'USER' | 'SYSTEM' | 'ADMIN';

export type AuditLogInput = {
  actorId?: string | null;
  actorType: ActorType;
  event: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
};

/**
 * Insert an audit log row (RGPD trail, append-only).
 *
 * - `metadata` is passed through `redactPII()` to ensure no email/password/cv text in clear.
 * - `ipAddress` and `userAgent` are extracted from the current request headers.
 * - If `DATABASE_URL` is not configured (dev), logs a warn and returns silently.
 *
 * Architecture.md ligne 639 : "Toujours logger les actions sensibles dans audit_log".
 */
export async function auditLog(input: AuditLogInput): Promise<void> {
  if (!isDatabaseConfigured) {
    logger.warn({ audit: input }, 'auditLog called without DATABASE_URL — skipping insert');
    return;
  }

  let ipAddress: string | null = null;
  let userAgent: string | null = null;

  try {
    const hdrs = await headers();
    const forwarded = hdrs.get('x-forwarded-for');
    ipAddress = forwarded ? (forwarded.split(',')[0]?.trim() ?? null) : hdrs.get('x-real-ip');
    userAgent = hdrs.get('user-agent');
  } catch {
    // headers() can throw outside of a request scope (e.g. background jobs).
    // Acceptable : audit log still inserted without IP/UA.
  }

  const safeMetadata = input.metadata ? redactPII(input.metadata) : null;

  try {
    await db.insert(auditLogs).values({
      actorId: input.actorId ?? null,
      actorType: input.actorType,
      event: input.event,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      metadata: safeMetadata,
      ipAddress,
      userAgent,
    });
  } catch (err) {
    // Audit log failures must never block the user-facing action — log + Sentry.
    // RGPD critical : on doit savoir si des events audit sont perdus.
    logger.error({ err, event: input.event }, 'Failed to insert audit log');
    Sentry.captureException(err, {
      level: 'error',
      tags: { audit_event: input.event, audit_actor_type: input.actorType },
      extra: { actorId: input.actorId, targetType: input.targetType },
    });
  }
}
