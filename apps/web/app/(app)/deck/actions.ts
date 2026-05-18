'use server';

import { and, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db, isDatabaseConfigured } from '@/lib/db';
import { matchScores, offers, preferences } from '@swipejob/db/schema';
import { captureServer, hashUserId } from '@/lib/analytics';

export type DeckOffer = {
  id: string;
  title: string;
  companyName: string | null;
  locationCity: string | null;
  contractType: string | null;
  salaryMinMonthly: number | null;
  salaryMaxMonthly: number | null;
  sourceUrl: string | null;
  matchScore: number;
  matchReasons: Array<{
    factor: string;
    weight: number;
    value: number;
    label: string;
    matched: boolean;
  }>;
};

export type DeckResult = {
  ok: true;
  offers: DeckOffer[];
  scarcityHint: {
    type: 'broaden_radius' | 'broaden_cities' | 'review_cv' | 'review_skills' | null;
    message: string;
  } | null;
  fallback: boolean; // true si match_scores vide (fallback freshness)
};

const TARGET_DECK_SIZE = 15;
const SCARCITY_THRESHOLD = 10;

/**
 * Story 2.10 — getDailyDeck.
 *
 * Retourne top 10-20 offres du user, triées par matchScore DESC.
 * Si pas de match_scores (user fraîchement onboardé, attend cron 02h)
 * → fallback : top offres actives par publishedAt DESC.
 *
 * Story 2.12 — détection pénurie : si <10 offres → coach message.
 *
 * V1 : exclusion swipe_events (Story 3.x) reportée — le swipe n'existe pas encore.
 */
export async function getDailyDeck(): Promise<DeckResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: true, offers: [], scarcityHint: null, fallback: false };
  }
  if (!isDatabaseConfigured) {
    return { ok: true, offers: [], scarcityHint: null, fallback: true };
  }

  const userId = session.user.id;

  // 1. Top matches via match_scores
  type MatchRow = {
    offerId: string;
    score: number;
    explanation: {
      contributingFactors?: Array<{
        factor: string;
        weight: number;
        value: number;
        label: string;
        matched: boolean;
      }>;
    } | null;
    title: string;
    companyName: string | null;
    locationCity: string | null;
    contractType: string | null;
    salaryMinMonthly: number | null;
    salaryMaxMonthly: number | null;
    sourceUrl: string | null;
  };

  const matches = (await db
    .select({
      offerId: matchScores.offerId,
      score: matchScores.score,
      explanation: matchScores.explanation,
      title: offers.title,
      companyName: offers.companyName,
      locationCity: offers.locationCity,
      contractType: offers.contractType,
      salaryMinMonthly: offers.salaryMinMonthly,
      salaryMaxMonthly: offers.salaryMaxMonthly,
      sourceUrl: offers.sourceUrl,
    })
    .from(matchScores)
    .innerJoin(offers, eq(matchScores.offerId, offers.id))
    .where(
      and(eq(matchScores.userId, userId), eq(offers.status, 'active'), isNull(offers.canonicalId)),
    )
    .orderBy(desc(matchScores.score))
    .limit(TARGET_DECK_SIZE)) as unknown as MatchRow[];

  let deckOffers: DeckOffer[] = matches.map((m) => ({
    id: m.offerId,
    title: m.title,
    companyName: m.companyName,
    locationCity: m.locationCity,
    contractType: m.contractType,
    salaryMinMonthly: m.salaryMinMonthly,
    salaryMaxMonthly: m.salaryMaxMonthly,
    sourceUrl: m.sourceUrl,
    matchScore: m.score,
    matchReasons: m.explanation?.contributingFactors ?? [],
  }));

  let fallback = false;
  // 2. Fallback freshness si pas de match_scores (compute-matches pas encore tourné)
  if (deckOffers.length === 0) {
    fallback = true;
    const fresh = await db
      .select({
        id: offers.id,
        title: offers.title,
        companyName: offers.companyName,
        locationCity: offers.locationCity,
        contractType: offers.contractType,
        salaryMinMonthly: offers.salaryMinMonthly,
        salaryMaxMonthly: offers.salaryMaxMonthly,
        sourceUrl: offers.sourceUrl,
      })
      .from(offers)
      .where(
        and(eq(offers.status, 'active'), isNull(offers.canonicalId), isNotNull(offers.publishedAt)),
      )
      .orderBy(desc(offers.publishedAt))
      .limit(TARGET_DECK_SIZE);

    deckOffers = fresh.map((o) => ({
      ...o,
      matchScore: 0,
      matchReasons: [],
    }));
  }

  // 3. Story 2.12 — scarcity detection
  const scarcityHint = await detectScarcity(userId, deckOffers.length);

  // Posthog tracking
  if (deckOffers.length > 0) {
    captureServer('deck.opened', hashUserId(userId), {
      deck_size: deckOffers.length,
      top_score: deckOffers[0]!.matchScore,
      fallback,
    });
  }
  if (scarcityHint) {
    captureServer('deck.scarcity_detected', hashUserId(userId), {
      criterion: scarcityHint.type,
    });
  }

  return { ok: true, offers: deckOffers, scarcityHint, fallback };
}

async function detectScarcity(
  userId: string,
  deckSize: number,
): Promise<DeckResult['scarcityHint']> {
  if (deckSize >= SCARCITY_THRESHOLD) return null;

  const prefRows = await db
    .select({
      cities: preferences.cities,
      geoRadiusKm: preferences.geoRadiusKm,
    })
    .from(preferences)
    .where(eq(preferences.userId, userId))
    .limit(1);
  const pref = prefRows[0];

  // V1 simple heuristique : ordre de pertinence
  if (pref?.cities && pref.cities.length === 1) {
    return {
      type: 'broaden_cities',
      message: `Tu n'as ciblé qu'une seule ville (${pref.cities[0]}). En ajouter une 2e pourrait débloquer plein d'offres.`,
    };
  }
  if (pref?.geoRadiusKm && pref.geoRadiusKm < 50) {
    return {
      type: 'broaden_radius',
      message: `Ton rayon de recherche (${pref.geoRadiusKm} km) est assez restreint. Élargis-le à 50 km pour découvrir plus d'offres.`,
    };
  }
  if (deckSize === 0) {
    return {
      type: 'review_cv',
      message:
        "On a peu d'options. Revoie ton CV ou ajoute des compétences pour matcher plus d'offres.",
    };
  }
  return {
    type: 'review_skills',
    message:
      'Quelques offres seulement. Ajoute des compétences dans ton profil pour élargir tes matches.',
  };
}
