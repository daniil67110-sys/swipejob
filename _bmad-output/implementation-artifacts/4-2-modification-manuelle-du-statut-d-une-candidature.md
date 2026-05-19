# Story 4.2: Modification manuelle du statut

Status: done

## Implémentation

- Enum `application_status` étendu (migration 0014) avec `read`, `replied`, `interview_scheduled`, `signed`, `rejected`
- Server Action `updateApplicationStatusAction({ applicationId, status, interviewAt? })`
- UI : `ApplicationStatusMenu` (DropdownMenu Radix) sur le `StatusBadge` cliquable
- Optimistic UI (`useTransition` + state local)
- Si `status='interview_scheduled'` → Dialog datetime-local pour saisir `interviewAt`
- Si `status='signed'` → redirect vers `ReportSignatureModal` (Story 4.3) au lieu d'update direct
- Transactionnel : UPDATE applications + INSERT application_events `{ source: 'manual' }`
- Audit log `application.status_updated` + Posthog `application.status_manually_updated`
- Garde : refuse transition depuis pending_letter/letter_generated/pending_review/cancelled/failed

## V1 limitations

- Pas de "champ date entretien" inline (modal dédié pour interview_scheduled)
- Pas d'optimistic rollback complexe — state local revert si erreur

## Change Log

- 2026-05-19 : V1 livrée. Status: done.
