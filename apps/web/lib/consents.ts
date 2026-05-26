import 'server-only';
import { desc, eq } from 'drizzle-orm';
import { db, isDatabaseConfigured } from '@/lib/db';
import { preferences, userConsents } from '@swipejob/db/schema';
import { auditLog } from '@/lib/audit';
import { captureServer, hashUserId } from '@/lib/analytics';

/**
 * Story 6.2 — Catalogue des finalités de traitement (RGPD art. 6 + 7).
 *
 * Le catalogue est versionné en code. `required: true` signifie que la finalité
 * est nécessaire à l'exécution du service (base légale art. 6.1.b — exécution
 * du contrat) et ne peut pas être désactivée sans supprimer le compte.
 */

export type ConsentPurpose =
  | 'matching_ai'
  | 'analytics_product'
  | 'marketing_emails'
  | 'email_scanning';

export type ConsentDef = {
  code: ConsentPurpose;
  title: string;
  description: string;
  required: boolean;
  /** Base légale RGPD art. 6.1 (a=consentement, b=contrat, f=intérêt légitime). */
  legalBasis: 'a' | 'b' | 'f';
  /** Story V2 ou non-encore-fait — toggle désactivé visuellement. */
  comingSoon?: boolean;
};

export const POLICY_VERSION = 1;

export const CONSENT_CATALOG: readonly ConsentDef[] = [
  {
    code: 'matching_ai',
    title: 'Matching IA et personnalisation',
    description:
      'Utilisation de tes données (CV, préférences, swipes) pour générer ton deck personnalisé et tes lettres de motivation IA. Indispensable au fonctionnement de SwipeJob.',
    required: true,
    legalBasis: 'b',
  },
  {
    code: 'analytics_product',
    title: 'Analyse produit',
    description:
      "Suivi anonymisé de tes actions (swipes, ouvertures, durées) pour améliorer le produit. Aucune donnée identifiante n'est envoyée à nos outils analytiques (PostHog EU).",
    required: false,
    legalBasis: 'a',
  },
  {
    code: 'marketing_emails',
    title: 'Emails marketing',
    description:
      'Annonces produit, nouvelles fonctionnalités, contenus métier. Tu peux te désinscrire à tout moment depuis chaque email ou ici.',
    required: false,
    legalBasis: 'a',
  },
  {
    code: 'email_scanning',
    title: 'Lecture des réponses entreprise (V2)',
    description:
      'Analyse automatique de tes emails entrants pour détecter les réponses des entreprises (entretiens, refus, signature). Cette fonctionnalité arrive bientôt.',
    required: false,
    legalBasis: 'a',
    comingSoon: true,
  },
] as const;

export function getConsentDef(code: string): ConsentDef | undefined {
  return CONSENT_CATALOG.find((c) => c.code === code);
}

export type ConsentState = Record<ConsentPurpose, boolean>;

const DEFAULT_STATE: ConsentState = {
  matching_ai: true, // obligatoire — implicite à la création de compte
  analytics_product: false,
  marketing_emails: false,
  email_scanning: false,
};

/** Retourne l'état courant (dernière row par purpose) pour ce user. */
export async function getCurrentConsents(userId: string): Promise<ConsentState> {
  if (!isDatabaseConfigured) return DEFAULT_STATE;

  const rows = await db
    .select({
      purpose: userConsents.purpose,
      granted: userConsents.granted,
      createdAt: userConsents.createdAt,
    })
    .from(userConsents)
    .where(eq(userConsents.userId, userId))
    .orderBy(desc(userConsents.createdAt));

  const state: ConsentState = { ...DEFAULT_STATE };
  const seen = new Set<string>();
  for (const row of rows) {
    if (seen.has(row.purpose)) continue;
    seen.add(row.purpose);
    if (row.purpose in state) {
      state[row.purpose as ConsentPurpose] = row.granted;
    }
  }
  return state;
}

/**
 * Met à jour un consentement (append-only) + side effects synchrones :
 * - marketing_emails OFF → preferences.emailMarketingEnabled = false
 * - matching_ai : impossible de revoke (obligatoire — handled côté action).
 *
 * Side effect analytics_product OFF : la lib analytics côté client (PostHog SDK)
 * doit lire ce flag au boot. V1 : on note seulement le change, le client lit la
 * valeur à la prochaine session via getCurrentConsents (TODO suivre dans dashboard).
 */
export async function updateConsent(input: {
  userId: string;
  purpose: ConsentPurpose;
  granted: boolean;
}): Promise<{ ok: true; granted: boolean } | { ok: false; error: string }> {
  if (!isDatabaseConfigured) return { ok: false, error: 'DB not configured' };
  const def = getConsentDef(input.purpose);
  if (!def) return { ok: false, error: 'Unknown purpose' };
  if (def.required && !input.granted) {
    return { ok: false, error: 'Cette finalité est obligatoire pour utiliser SwipeJob.' };
  }

  const previous = await getCurrentConsents(input.userId);
  const previousValue = previous[input.purpose];

  await db.insert(userConsents).values({
    userId: input.userId,
    purpose: input.purpose,
    granted: input.granted,
    policyVersion: POLICY_VERSION,
  });

  // Side effect : marketing
  if (input.purpose === 'marketing_emails') {
    const existing = await db
      .select({ id: preferences.id })
      .from(preferences)
      .where(eq(preferences.userId, input.userId))
      .limit(1);
    if (!existing[0]) {
      await db
        .insert(preferences)
        .values({ userId: input.userId, emailMarketingEnabled: input.granted });
    } else {
      await db
        .update(preferences)
        .set({ emailMarketingEnabled: input.granted, updatedAt: new Date() })
        .where(eq(preferences.userId, input.userId));
    }
  }

  await auditLog({
    actorId: input.userId,
    actorType: 'USER',
    event: 'consent.updated',
    targetType: 'user_consent',
    targetId: input.userId,
    metadata: {
      purpose: input.purpose,
      from: previousValue,
      to: input.granted,
      policy_version: POLICY_VERSION,
    },
  });

  captureServer('consent.updated', hashUserId(input.userId), {
    purpose: input.purpose,
    granted: input.granted,
  });

  return { ok: true, granted: input.granted };
}
