# Story 3.8: Undo candidature 30s

Status: done (V1, sans email rétractation)

## Implémentation

- `<UndoToast applicationId>` (Story 3.1 SwipeCard.tsx) — countdown 30s
- Server Action `undoApplicationAction(applicationId)` :
  - Check window 30s depuis `sentAt`
  - UPDATE `applications.status='cancelled_by_user' + cancelledAt`
  - Insert `application_events` event='cancelled'
  - Audit log `application.cancelled`
  - Posthog `application.undone` + `time_to_undo_ms`

## V1 limitations

- **Pas d'email rétractation au recruteur** (NFR critique mais nécessite logique side-channel — V2). V1 = juste le statut DB change ; le mail original reste reçu côté recruteur.
- Au-delà de 30s : bouton disparait, action rejette `WINDOW_EXPIRED`.

## Change Log

- 2026-05-19 : V1 livrée. Email rétractation = V2. Status: done.
