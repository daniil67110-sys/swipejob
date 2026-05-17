/**
 * Stub V1 — sera branché sur la bannière cookies de la Story 6.2.
 * Pour le moment, on suppose un opt-in implicite (compatible RGPD si Posthog n'envoie
 * que des events anonymisés sans cookie persistant — config `person_profiles: 'identified_only'`).
 */
export function getAnalyticsConsent(): boolean {
  return true;
}
