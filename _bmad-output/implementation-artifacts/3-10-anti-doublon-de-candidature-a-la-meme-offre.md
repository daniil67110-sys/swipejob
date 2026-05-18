# Story 3.10: Anti-doublon candidature

Status: done

## Implémentation

- **DB enforce** : index partiel unique sur `applications(userId, offerId) WHERE status != 'cancelled_by_user'` (migration 0013)
- **App check** : `swipeOfferAction` vérifie en SELECT avant INSERT — retourne `{ ok: false, error: { code: 'ALREADY_APPLIED' } }`
- Posthog `application.duplicate_attempt`
- UI : SwipeCard affiche l'erreur retournée en aria-live

## V1 limitations

- Pas de marquage visuel "Déjà candidaté ✓" sur la carte dans le deck (le filtre `getDailyDeck` exclut déjà via `swipe_events`, donc en pratique l'utilisateur ne re-voit pas l'offre)

## Change Log

- 2026-05-19 : V1 livrée. Status: done.
