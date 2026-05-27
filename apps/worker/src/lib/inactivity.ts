/**
 * Story 6.6 — Détection des utilisateurs inactifs pour anonymisation RGPD.
 *
 * Source d'activité : `sessions.lastSeenAt` (Auth.js v5 met à jour à chaque
 * requête authentifiée). Si aucune session, fallback sur `users.createdAt`.
 *
 * Deux phases :
 * 1. **NotifyEligible** : inactif ≥ 23 mois ET jamais notifié → envoyer warning.
 * 2. **AnonymizeEligible** : inactif ≥ 24 mois ET notifié ≥ 30j → anonymiser.
 *
 * Filtrage : ignore les rows déjà `purgedAt` ou `anonymizedAt`.
 */
import { and, desc, eq, isNull, lte, sql } from 'drizzle-orm';
import { db } from '@swipejob/db';
import { sessions, users } from '@swipejob/db/schema';

export type InactivityCandidate = {
  userId: string;
  email: string;
  name: string | null;
  locale: string;
  lastActivityAt: Date;
};

/** Calcule le timestamp seuil "now - <months> months" en UTC. */
function monthsAgo(months: number, now: Date = new Date()): Date {
  const d = new Date(now);
  d.setUTCMonth(d.getUTCMonth() - months);
  return d;
}

/**
 * Query factorisée : retourne les users dont l'activité (=MAX(lastSeenAt) ou
 * users.createdAt si pas de session) est ≤ `threshold`, hors users déjà
 * anonymisés ou purgés.
 *
 * Optionnellement filtre sur `inactivityNotifiedAt`.
 */
async function selectInactive(input: {
  threshold: Date;
  notifiedBefore?: Date | null; // si défini : ne sélectionner que les déjà notifiés ≤ ce timestamp
  onlyNeverNotified?: boolean; // si true : ne sélectionner que les jamais notifiés
  limit: number;
}): Promise<InactivityCandidate[]> {
  // Sous-requête : last session lastSeenAt par user.
  const lastSession = db
    .select({
      userId: sessions.userId,
      lastSeenAt: sql<Date>`max(${sessions.lastSeenAt})`.as('last_seen_at'),
    })
    .from(sessions)
    .groupBy(sessions.userId)
    .as('last_session');

  const baseConditions = [isNull(users.anonymizedAt), isNull(users.purgedAt)];

  if (input.onlyNeverNotified) {
    baseConditions.push(isNull(users.inactivityNotifiedAt));
  } else if (input.notifiedBefore) {
    baseConditions.push(lte(users.inactivityNotifiedAt, input.notifiedBefore));
  }

  // COALESCE(maxLastSeen, users.createdAt) ≤ threshold
  const activityExpr = sql<Date>`coalesce(${lastSession.lastSeenAt}, ${users.createdAt})`;
  baseConditions.push(lte(activityExpr, input.threshold));

  const rows = await db
    .select({
      userId: users.id,
      email: users.email,
      name: users.name,
      locale: users.locale,
      lastActivityAt: sql<Date>`coalesce(${lastSession.lastSeenAt}, ${users.createdAt})`,
    })
    .from(users)
    .leftJoin(lastSession, eq(lastSession.userId, users.id))
    .where(and(...baseConditions))
    .orderBy(desc(sql`coalesce(${lastSession.lastSeenAt}, ${users.createdAt})`))
    .limit(input.limit);

  return rows.map((r) => ({
    userId: r.userId,
    email: r.email,
    name: r.name,
    locale: r.locale,
    lastActivityAt: r.lastActivityAt,
  }));
}

/** Phase 1 — users à notifier (inactif ≥ 23 mois, jamais notifié). */
export function findUsersToNotify(now: Date = new Date(), limit = 500) {
  return selectInactive({
    threshold: monthsAgo(23, now),
    onlyNeverNotified: true,
    limit,
  });
}

/** Phase 2 — users à anonymiser (inactif ≥ 24 mois, notifié ≥ 30j). */
export function findUsersToAnonymize(now: Date = new Date(), limit = 200) {
  const inactivityThreshold = monthsAgo(24, now);
  const notifiedBefore = new Date(now);
  notifiedBefore.setUTCDate(notifiedBefore.getUTCDate() - 30);
  return selectInactive({
    threshold: inactivityThreshold,
    notifiedBefore,
    limit,
  });
}

/** Utilitaire interne exporté pour les tests. */
export const _internals = { monthsAgo, selectInactive };
