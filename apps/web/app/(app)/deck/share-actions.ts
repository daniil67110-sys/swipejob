'use server';

import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { offers } from '@swipejob/db/schema';
import { captureServer, hashUserId } from '@/lib/analytics';
import { serverLogger as logger } from '@/lib/logger.server';

const trackSchema = z.object({
  offerId: z.string().min(1).max(40),
  channel: z.enum(['copy', 'native', 'whatsapp', 'linkedin', 'twitter', 'email']),
});

/**
 * Story 5.4 — incrémente le compteur anonyme + tracking analytics au partage.
 * Pas de PII en DB : seul `share_count` est stocké côté offre, l'identité
 * du sharer reste dans Posthog (hashé) et nulle part en DB.
 */
export async function shareOfferAction(input: {
  offerId: string;
  channel: 'copy' | 'native' | 'whatsapp' | 'linkedin' | 'twitter' | 'email';
}): Promise<{ ok: true } | { ok: false; error: { code: string; message: string } }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: { code: 'UNAUTHENTICATED', message: 'Non authentifié.' } };
  }
  const parsed = trackSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: { code: 'VALIDATION_ERROR', message: 'Paramètres invalides.' } };
  }
  const { offerId, channel } = parsed.data;

  if (isDatabaseConfigured) {
    try {
      await db
        .update(offers)
        .set({ shareCount: sql`${offers.shareCount} + 1` })
        .where(eq(offers.id, offerId));
    } catch (err) {
      logger.warn({ err, offerId }, 'shareOfferAction failed to increment share_count');
    }
  }

  captureServer('offer.shared', hashUserId(session.user.id), {
    offer_id: offerId,
    channel,
  });

  return { ok: true };
}
