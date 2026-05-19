import { and, eq, gte, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import {
  matchScores,
  notificationEvents,
  offers,
  preferences,
  pushSubscriptions,
  users,
} from '@swipejob/db/schema';
import { isoDayKey } from '../lib/iso-week.js';
import { sendWebPush } from '../lib/web-push.js';
import { env } from '../lib/env.js';
import logger from '../lib/logger.js';

export type PushJobResult = {
  ok: true;
  totalUsers: number;
  sent: number;
  skipped: number;
  failed: number;
  expired: number;
};

const MAX_USERS_PER_RUN = 10_000;
const FRESH_OFFERS_LOOKBACK_HOURS = 24;

/**
 * Story 4.4 — Push deck du jour.
 *
 * V1 simple : envoi global à 08:00 UTC (cron 0 8 * * *).
 * Heure utilisateur (`preferences.push_time`) sera prise en compte V2 (sharding par tz).
 *
 * Idempotence : reference_key = 'push:deck:<YYYY-MM-DD>'.
 */
export async function processDailyDeckPush(): Promise<PushJobResult> {
  if (!isDatabaseConfigured) {
    logger.warn('DATABASE_URL absent — skipping push');
    return { ok: true, totalUsers: 0, sent: 0, skipped: 0, failed: 0, expired: 0 };
  }
  if (!env.NOTIFICATIONS_ENABLED) {
    logger.warn('NOTIFICATIONS_ENABLED=false — kill switch active, push aborted');
    return { ok: true, totalUsers: 0, sent: 0, skipped: 0, failed: 0, expired: 0 };
  }

  const now = new Date();
  const dayKey = isoDayKey(now);
  const referenceKey = `push:deck:${dayKey}`;
  const lookbackThreshold = new Date(now.getTime() - FRESH_OFFERS_LOOKBACK_HOURS * 3_600_000);

  const candidates = await db
    .select({
      userId: users.id,
    })
    .from(users)
    .innerJoin(preferences, eq(preferences.userId, users.id))
    .where(
      and(
        eq(preferences.pushEnabled, true),
        sql`${users.deletedAt} IS NULL`,
        sql`${users.emailVerified} IS NOT NULL`,
      ),
    )
    .limit(MAX_USERS_PER_RUN);

  let sent = 0;
  let skipped = 0;
  let failed = 0;
  let expired = 0;

  for (const candidate of candidates) {
    // Idempotence
    const existing = await db
      .select({ id: notificationEvents.id })
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.userId, candidate.userId),
          eq(notificationEvents.channel, 'push'),
          eq(notificationEvents.eventType, 'sent'),
          eq(notificationEvents.referenceKey, referenceKey),
        ),
      )
      .limit(1);
    if (existing[0]) {
      skipped++;
      continue;
    }

    const subs = await db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        p256dh: pushSubscriptions.p256dh,
        auth: pushSubscriptions.auth,
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, candidate.userId));
    if (subs.length === 0) {
      skipped++;
      continue;
    }

    // Compter nouvelles offres potentielles dans le deck (match_scores non swipées + offres récentes)
    const countRow = await db
      .select({ c: sql<number>`COUNT(*)::int` })
      .from(matchScores)
      .innerJoin(offers, eq(offers.id, matchScores.offerId))
      .where(
        and(
          eq(matchScores.userId, candidate.userId),
          eq(offers.status, 'active'),
          gte(offers.createdAt, lookbackThreshold),
          sql`NOT EXISTS (
            SELECT 1 FROM swipe_events se
            WHERE se.user_id = ${candidate.userId} AND se.offer_id = ${offers.id}
          )`,
        ),
      );
    const newOffers = countRow[0]?.c ?? 0;
    if (newOffers === 0) {
      skipped++;
      continue;
    }

    const title = `${newOffers} nouvelle${newOffers > 1 ? 's' : ''} offre${
      newOffers > 1 ? 's' : ''
    } pour toi ☀️`;
    const payload = {
      title,
      body: 'Ouvre ton deck et swipe !',
      url: `${env.WEB_APP_URL}/deck`,
      icon: '/icon-192.png',
    };

    let userSent = false;
    for (const sub of subs) {
      const res = await sendWebPush(
        { endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth },
        payload,
      );
      if (res.ok) {
        userSent = true;
      } else if (res.gone) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
        expired++;
      } else {
        failed++;
      }
    }

    if (userSent) {
      await db.insert(notificationEvents).values({
        userId: candidate.userId,
        channel: 'push',
        eventType: 'sent',
        referenceKey,
        metadata: JSON.stringify({ newOffers, subs: subs.length }),
      });
      sent++;
    }
  }

  logger.info(
    { totalUsers: candidates.length, sent, skipped, failed, expired, dayKey },
    'daily push run completed',
  );
  return { ok: true, totalUsers: candidates.length, sent, skipped, failed, expired };
}
