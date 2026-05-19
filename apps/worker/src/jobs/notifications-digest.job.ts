import { randomBytes } from 'node:crypto';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@swipejob/db';
import {
  applications,
  matchScores,
  notificationEvents,
  offers,
  preferences,
  profiles,
  swipeEvents,
  users,
} from '@swipejob/db/schema';
import { sendWeeklyDigestEmail } from '../lib/digest-email.js';
import { isoWeekKey } from '../lib/iso-week.js';
import { env } from '../lib/env.js';
import logger from '../lib/logger.js';

export type DigestJobResult = {
  ok: true;
  totalCandidates: number;
  sent: number;
  skipped: number;
  failed: number;
};

const MAX_USERS_PER_RUN = 5000;

/**
 * Story 4.5 — Digest hebdomadaire.
 *
 * Filtre : preferences.emailDigestEnabled=true AND emailDigestFrequency='weekly'
 *          AND users.deletedAt IS NULL AND emailVerified IS NOT NULL.
 *
 * Idempotence : notification_events (channel='email_digest', event_type='sent',
 * reference_key='digest:<ISO week>'). Si déjà existant → skip.
 */
export async function processWeeklyDigest(): Promise<DigestJobResult> {
  if (!isDatabaseConfigured) {
    logger.warn('DATABASE_URL absent — skipping digest');
    return { ok: true, totalCandidates: 0, sent: 0, skipped: 0, failed: 0 };
  }
  if (!env.NOTIFICATIONS_ENABLED) {
    logger.warn('NOTIFICATIONS_ENABLED=false — kill switch active, digest aborted');
    return { ok: true, totalCandidates: 0, sent: 0, skipped: 0, failed: 0 };
  }

  const now = new Date();
  const weekKey = isoWeekKey(now);
  const referenceKey = `digest:${weekKey}`;
  const weekStart = new Date(now.getTime() - 7 * 86_400_000);
  const weekLabel = formatWeekLabel(weekStart, now);

  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      firstName: profiles.firstName,
      unsubscribeToken: preferences.emailUnsubscribeToken,
    })
    .from(users)
    .innerJoin(preferences, eq(preferences.userId, users.id))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        eq(preferences.emailDigestEnabled, true),
        eq(preferences.emailDigestFrequency, 'weekly'),
        eq(preferences.emailTransactionalEnabled, true),
        sql`${users.deletedAt} IS NULL`,
        sql`${users.emailVerified} IS NOT NULL`,
      ),
    )
    .limit(MAX_USERS_PER_RUN);

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const candidate of rows) {
    if (!candidate.email) {
      skipped++;
      continue;
    }

    // Idempotence
    const existing = await db
      .select({ id: notificationEvents.id })
      .from(notificationEvents)
      .where(
        and(
          eq(notificationEvents.userId, candidate.userId),
          eq(notificationEvents.channel, 'email_digest'),
          eq(notificationEvents.eventType, 'sent'),
          eq(notificationEvents.referenceKey, referenceKey),
        ),
      )
      .limit(1);
    if (existing[0]) {
      skipped++;
      continue;
    }

    // Stats semaine
    const swipesRow = await db
      .select({ c: sql<number>`COUNT(*)::int` })
      .from(swipeEvents)
      .where(and(eq(swipeEvents.userId, candidate.userId), gte(swipeEvents.swipedAt, weekStart)));
    const appsRow = await db
      .select({ c: sql<number>`COUNT(*)::int` })
      .from(applications)
      .where(
        and(eq(applications.userId, candidate.userId), gte(applications.createdAt, weekStart)),
      );
    const statusUpdatesRow = await db
      .select({ c: sql<number>`COUNT(*)::int` })
      .from(applications)
      .where(
        and(
          eq(applications.userId, candidate.userId),
          sql`${applications.lastStatusAt} IS NOT NULL`,
          gte(applications.lastStatusAt, weekStart),
        ),
      );

    // Top 3 offres (depuis match_scores, sans celles déjà swipées)
    const top = await db
      .select({
        id: offers.id,
        title: offers.title,
        companyName: offers.companyName,
        locationCity: offers.locationCity,
      })
      .from(matchScores)
      .innerJoin(offers, eq(offers.id, matchScores.offerId))
      .where(
        and(
          eq(matchScores.userId, candidate.userId),
          eq(offers.status, 'active'),
          sql`NOT EXISTS (
            SELECT 1 FROM swipe_events se
            WHERE se.user_id = ${candidate.userId} AND se.offer_id = ${offers.id}
          )`,
        ),
      )
      .orderBy(desc(matchScores.score))
      .limit(3);

    // Generate unsubscribe token lazy
    let token = candidate.unsubscribeToken;
    if (!token) {
      token = randomBytes(24).toString('hex');
      await db
        .update(preferences)
        .set({ emailUnsubscribeToken: token, updatedAt: now })
        .where(eq(preferences.userId, candidate.userId));
    }

    const unsubscribeUrl = `${env.WEB_APP_URL}/se-desabonner?token=${token}`;
    const deckUrl = `${env.WEB_APP_URL}/deck`;

    const res = await sendWeeklyDigestEmail({
      to: candidate.email,
      firstName: candidate.firstName,
      swipesCount: swipesRow[0]?.c ?? 0,
      applicationsCount: appsRow[0]?.c ?? 0,
      statusUpdatesCount: statusUpdatesRow[0]?.c ?? 0,
      topOffers: top,
      unsubscribeUrl,
      deckUrl,
      weekLabel,
    });

    if (!res.ok) {
      failed++;
      logger.warn({ userId: candidate.userId, err: res.error }, 'digest send failed');
      continue;
    }

    await db.insert(notificationEvents).values({
      userId: candidate.userId,
      channel: 'email_digest',
      eventType: 'sent',
      referenceKey,
      metadata: JSON.stringify({ mock: 'mock' in res ? res.mock : false, weekKey }),
    });
    sent++;
  }

  logger.info(
    { totalCandidates: rows.length, sent, skipped, failed, weekKey },
    'weekly digest run completed',
  );
  return { ok: true, totalCandidates: rows.length, sent, skipped, failed };
}

function formatWeekLabel(start: Date, end: Date): string {
  const fmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
  return `${fmt.format(start)} → ${fmt.format(end)}`;
}
