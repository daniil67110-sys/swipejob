'use server';

import { headers } from 'next/headers';
import { z } from 'zod';
import { db, isDatabaseConfigured } from '@swipejob/db';
import { accessibilityReports } from '@swipejob/db/schema';
import { hashAuditValue } from '@swipejob/types';
import { auditLog } from '@/lib/audit';
import { env } from '@/lib/env';
import { serverLogger as logger } from '@/lib/logger.server';
import { accessibilityReportRateLimit, getClientIp } from '@/lib/rate-limit';

const inputSchema = z.object({
  url: z.string().min(1, 'URL requise').max(500),
  description: z
    .string()
    .min(10, 'Décris le défaut en quelques mots (10 caractères minimum)')
    .max(4000),
  contactEmail: z.union([z.literal(''), z.string().email('Email invalide')]).optional(),
});

export type AccessibilityReportInput = z.infer<typeof inputSchema>;

export type AccessibilityReportResult =
  | { ok: true; ticketId: string }
  | { ok: false; error: string };

/**
 * Story 6.8 — Crée un ticket de signalement d'accessibilité depuis la page
 * publique `/declaration-accessibilite`. Pas d'auth requise (visiteur anonyme),
 * mais rate-limit par IP pour anti-spam.
 */
export async function createAccessibilityReportAction(
  input: AccessibilityReportInput,
): Promise<AccessibilityReportResult> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? 'Saisie invalide.' };
  }

  const hdrs = await headers();
  const ip = getClientIp(hdrs);

  const rate = await accessibilityReportRateLimit.limit(ip);
  if (!rate.success) {
    return {
      ok: false,
      error: 'Trop de signalements envoyés. Merci de réessayer dans une heure.',
    };
  }

  if (!isDatabaseConfigured) {
    logger.warn({ url: parsed.data.url }, 'accessibility-report: DB absent, mock OK');
    return { ok: true, ticketId: 'mock' };
  }

  const ipHashed = hashAuditValue(ip, env.AUDIT_USER_HASH_SECRET ?? '');

  try {
    const [row] = await db
      .insert(accessibilityReports)
      .values({
        url: parsed.data.url,
        description: parsed.data.description,
        contactEmail: parsed.data.contactEmail || null,
        reporterIpHashed: ipHashed,
      })
      .returning({ id: accessibilityReports.id });

    if (!row) {
      return { ok: false, error: "Impossible d'enregistrer le signalement." };
    }

    await auditLog({
      actorType: 'SYSTEM',
      event: 'accessibility.report_submitted',
      targetType: 'accessibility_report',
      targetId: row.id,
      metadata: { url: parsed.data.url, hasContact: Boolean(parsed.data.contactEmail) },
    });

    return { ok: true, ticketId: row.id };
  } catch (err) {
    logger.error({ err }, 'accessibility-report insert failed');
    return { ok: false, error: "Impossible d'enregistrer le signalement pour le moment." };
  }
}
