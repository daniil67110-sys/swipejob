# Story 3.2: Composant SwipeDeck

Status: done (V1 simplifié, V2 = stack 3D + préchargement)

## Implémentation V1

- `apps/web/app/(app)/deck/SwipeDeck.tsx` (client)
- Index + total tracking (compteur "X sur Y" `aria-live="polite"`)
- Top card seule rendue V1 (pas de stack 3D). V2 : 3 cartes max + 3D + 2 derrière.
- Empty state si total=0
- "Completing" state quand index >= total (message 🎉)
- Préchargement V2 (images entreprises)
- Focus management V1 simple — focus auto sur la card active via render
- ARIA live "Carte X sur Y" ✅

## Change Log

- 2026-05-19 : V1 simplifié. Stack 3D deferred V2. Status: done.
