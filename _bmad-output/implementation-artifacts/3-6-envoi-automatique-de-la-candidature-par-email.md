# Story 3.6: Envoi automatique candidature email

Status: done

## Implémentation

- `apps/worker/src/lib/resend-send.ts` : send email via Resend EU
  - Subject FR : `Candidature {studentName} — {jobTitle}`
  - Body HTML + text (paragraphes lettre)
  - Attachment CV PDF (téléchargé R2 via `r2-download.ts`)
- `apps/worker/src/jobs/process-application.job.ts` : pipeline complet
  - Genère lettre → update status → insert ia_audit_logs
  - Si `reviewBeforeSend` → stop `pending_review` (Story 3.7)
  - Sinon → download CV R2 → send email → status='sent'
- `applications.status = 'sent' + sentAt = NOW()` + insert application_events
- Posthog `application.sent` + audit log `application.sent`
- Mode mock si Resend/R2 non configurés

## V1 limitations

- Pas de cap quotidien email per-user (NFR-I5) — utilise le quota Story 3.9 indirectement
- Pas de warm-up IP automatisé (manuel via dashboard Resend)
- Pas de webhook Resend tracking délivrabilité (V2)
- Pas de cap si offer.contactEmail manquant → status='failed' avec event

## Change Log

- 2026-05-19 : V1 livrée. Webhooks Resend + warm-up = V2. Status: done.
