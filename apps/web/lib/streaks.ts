import 'server-only';
import { and, gte, eq, sql } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@/lib/db';
import { swipeEvents } from '@swipejob/db/schema';

/**
 * Story 5.1 — calcul du daily streak depuis swipe_events.
 *
 * On agrège par jour calendaire en Europe/Paris. Un jour avec ≥1 swipe compte
 * comme "actif". Le streak courant est la chaîne contiguë de jours actifs se
 * terminant par aujourd'hui ou hier (tolérance d'1 jour pour le timezone gap).
 */

const PARIS_TZ = 'Europe/Paris';
const HEATMAP_WEEKS = 12;
const HEATMAP_DAYS = HEATMAP_WEEKS * 7;

export type StreakData = {
  current: number;
  longest: number;
  /** Jours actifs dans la fenêtre heatmap, format `YYYY-MM-DD` Europe/Paris. */
  activeDays: string[];
  /** Fenêtre couverte par la heatmap (12 dernières semaines). */
  windowStart: string;
  windowEnd: string;
};

export async function computeUserStreak(userId: string): Promise<StreakData> {
  const todayISO = parisDateKey(new Date());
  const windowEnd = todayISO;
  const windowStart = parisDateKey(addDays(new Date(), -(HEATMAP_DAYS - 1)));

  if (!isDatabaseConfigured) {
    return { current: 0, longest: 0, activeDays: [], windowStart, windowEnd };
  }

  // Récup les jours actifs (un swipe = un jour actif) sur les 365 derniers jours
  // pour pouvoir calculer le "longest streak" correctement.
  const longestWindow = addDays(new Date(), -365);
  const rows = (await db.execute(sql`
    SELECT DISTINCT to_char((${swipeEvents.swipedAt} AT TIME ZONE ${PARIS_TZ})::date, 'YYYY-MM-DD') AS day
    FROM ${swipeEvents}
    WHERE ${swipeEvents.userId} = ${userId}
      AND ${swipeEvents.swipedAt} >= ${longestWindow.toISOString()}
    ORDER BY day ASC
  `)) as unknown as { rows: Array<{ day: string }> } | Array<{ day: string }>;

  // Drizzle .execute() returns { rows } in pg driver; safer to handle both shapes.
  const dayList: string[] = Array.isArray(rows)
    ? rows.map((r) => r.day)
    : rows.rows.map((r) => r.day);
  const daySet = new Set(dayList);

  const activeDays = dayList.filter((d) => d >= windowStart && d <= windowEnd);

  // Current streak — chaîne se terminant aujourd'hui ou hier
  let current = 0;
  let cursor = new Date();
  const todaysKey = parisDateKey(cursor);
  const yesterdaysKey = parisDateKey(addDays(cursor, -1));
  if (daySet.has(todaysKey)) {
    current = 1;
    cursor = addDays(cursor, -1);
    while (daySet.has(parisDateKey(cursor))) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  } else if (daySet.has(yesterdaysKey)) {
    // tolérance : si pas swipé aujourd'hui mais hier oui, on garde la chaîne
    current = 1;
    cursor = addDays(cursor, -2);
    while (daySet.has(parisDateKey(cursor))) {
      current += 1;
      cursor = addDays(cursor, -1);
    }
  }

  // Longest streak — scan la liste triée
  let longest = 0;
  let run = 0;
  let prev: string | null = null;
  for (const d of dayList) {
    if (prev !== null && d === parisDateKey(addDays(parisDateFromKey(prev), 1))) {
      run += 1;
    } else {
      run = 1;
    }
    if (run > longest) longest = run;
    prev = d;
  }

  return { current, longest: Math.max(longest, current), activeDays, windowStart, windowEnd };
}

/** Returns true si user a swipé aujourd'hui (Europe/Paris). */
export async function hasSwipedToday(userId: string): Promise<boolean> {
  if (!isDatabaseConfigured) return false;
  const todayParisMidnight = parisDateFromKey(parisDateKey(new Date()));
  const rows = await db
    .select({ id: swipeEvents.id })
    .from(swipeEvents)
    .where(and(eq(swipeEvents.userId, userId), gte(swipeEvents.swipedAt, todayParisMidnight)))
    .limit(1);
  return rows.length > 0;
}

// ─── Helpers TZ ─────────────────────────────────────────────────────────────

function parisDateKey(date: Date): string {
  // Format ISO de la date locale Paris : 'YYYY-MM-DD'
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: PARIS_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

function parisDateFromKey(key: string): Date {
  // Reconstruit un Date UTC correspondant à 00:00 Paris pour cette date locale.
  // Approche : 00:00:00 en heure locale Paris = on construit en UTC puis on ajuste.
  // Plus simple : utiliser le timestamp ISO `${key}T00:00:00+02:00` ou +01:00
  // selon DST. On utilise un trick : construire un Date local-time-as-UTC pour
  // ce jour-là, puis vérifier le décalage Paris.
  const [y, m, d] = key.split('-').map(Number);
  const utcMidnight = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1));
  // Décalage entre l'heure UTC affichée et l'heure Paris pour ce moment :
  const parisTimeStr = new Intl.DateTimeFormat('en-GB', {
    timeZone: PARIS_TZ,
    hour: '2-digit',
    hour12: false,
  }).format(utcMidnight);
  const parisHour = Number(parisTimeStr);
  // Si Paris affiche 02h pour 00h UTC, alors UTC = Paris - 2h.
  // On veut 00h Paris donc 00h UTC - parisHour (qui sera 1 ou 2).
  const offsetMs = parisHour * 3600 * 1000;
  return new Date(utcMidnight.getTime() - offsetMs);
}

function addDays(date: Date, n: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
}
