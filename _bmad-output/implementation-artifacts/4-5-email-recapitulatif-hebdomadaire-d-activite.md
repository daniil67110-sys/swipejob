# Story 4.5: Email récapitulatif hebdomadaire

Status: done (V1, timezone exact V2)

## Implémentation

- Queue `notifications-digest` + worker `notifications-digest.worker.ts`
- Cron `0 17 * * 0` (dimanche 17h UTC ≈ 19h Paris été / 18h Paris hiver)
- Job `processWeeklyDigest` :
  - Filtre `preferences.emailDigestEnabled=true AND emailDigestFrequency='weekly' AND emailTransactionalEnabled=true`, users actifs + email vérifié
  - Idempotence via `notification_events { channel:'email_digest', event_type:'sent', reference_key:'digest:YYYY-Wxx' }` (ISO week)
  - Stats semaine : swipes count, applications count, status_updates count (lastStatusAt ≥ weekStart)
  - Top 3 offres (match_scores join offers actives, exclu swipées)
  - Token unsubscribe lazy : `randomBytes(24).toString('hex')` stocké dans `preferences.emailUnsubscribeToken`
  - Email Resend FR avec sujet "Ton récap SwipeJob (X → Y)" + HTML+text
  - Header `List-Unsubscribe` + `List-Unsubscribe-Post: One-Click`
  - Lien `${WEB_APP_URL}/se-desabonner?token=...`
- Page `/se-desabonner?token=...` (no auth) : update `emailMarketingEnabled=false, emailDigestEnabled=false, emailDigestFrequency='never'` + audit `preferences.unsubscribed_one_click`
- Lib `apps/worker/src/lib/iso-week.ts` (`isoWeekKey`, `isoDayKey`)
- Helper `apps/worker/src/lib/digest-email.ts` (mock mode si Resend absent)

## V1 limitations

- Cron en UTC, pas Europe/Paris exact (BullMQ 5 cron timezone V2)
- Tracking pixel `email.digest_opened` = V2 (juste `email.digest_sent` V1)
- Pas de monitoring délivrabilité Resend dashboard
- Pas de A/B subject

## Change Log

- 2026-05-19 : V1 livrée (cron + email + unsubscribe one-click). Tracking opened V2. Status: done.
