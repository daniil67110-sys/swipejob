# Story 3.4: Gestes swipe et équivalents clavier/bouton

Status: done

## Implémentation

- Schéma `swipe_events` enum `swipe_direction` (left/right/up) UNIQUE(userId, offerId)
- Server Action `swipeOfferAction({offerId, direction})` :
  - Insert swipe_events idempotent (ON CONFLICT DO NOTHING)
  - left → ack
  - up → insert watchlist
  - right → check anti-doublon (3.10) + quota (3.9) → insert applications + enqueue worker
- UI : SwipeCard boutons + raccourcis ←/→/↑/espace (focus active card)
- Posthog `swipe.performed` + audit log `swipe.performed` (IA Act traceability)

## Change Log

- 2026-05-19 : Livré dans bundle back-end Epic 3. Status: done.
