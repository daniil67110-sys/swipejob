# Story 3.3: Consultation détail offre

Status: done

## Implémentation

- `apps/web/app/(app)/deck/OfferDetailModal.tsx` — modal client
- Trigger : clic "Plus d'infos" ou `Espace` (Story 3.1)
- Contenu : titre, entreprise, location, contractType, salaire, description complète, matchReasons
- Escape ferme, click outside ferme
- Lien "Voir l'offre source" (compliance ToS Adzuna/FT)
- A11y : `role="dialog" aria-modal aria-labelledby`

## V1 vs V2

- V1 : modal centré tous devices. V2 = bottom-sheet mobile.
- V1 : pas de fermeture par swipe down (V2 — gesture handler).
- V1 : Posthog `offer.detail_viewed` non tracé (V2).

## Change Log

- 2026-05-19 : V1 livrée. Status: done.
