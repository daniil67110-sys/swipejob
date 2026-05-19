# Story 4.3: Reporter signature avec célébration

Status: done (V1, ConfettiBurst Epic 5)

## Implémentation

- Server Action `reportSignatureAction({ applicationId, salaryAnnualCents? })`
- Modal `ReportSignatureModal` : champ salary optionnel + bouton Confirmer
- Transactionnel : UPDATE applications status='signed', signedAt, signedSalaryAnnualCents, signedCompanySnapshot, signedJobTitleSnapshot + INSERT application_events 'signed'
- Audit log `application.signed` + Posthog `signature.reported`
- Snapshot company/title pour écran Wrapped (Story 5.5)
- Celebration V1 : burst emoji `🎉✨🎊` aria-live="polite" + redirect `/candidatures?signed=1` (toast post-redirect)
- Garde anti-double-signature (`ALREADY_SIGNED`)

## V1 limitations

- ConfettiBurst React composant (UX-DR10 intensity 'epic') : V2 — emoji burst V1
- Redirection vers `<WrappedShare>` (UX-DR11 / Story 5.5) : V2 — redirect simple `/candidatures?signed=1`
- Badge "Première signature" (Epic 5 Story 5.2) : V2 — non débloqué automatiquement V1

## Change Log

- 2026-05-19 : V1 livrée. ConfettiBurst + Wrapped + Badges = V2 / Epic 5. Status: done.
