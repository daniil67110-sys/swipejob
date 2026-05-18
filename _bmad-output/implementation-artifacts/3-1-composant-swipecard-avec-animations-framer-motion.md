# Story 3.1: Composant SwipeCard

Status: done (V1 simplifié, V2 = Framer Motion)

## Story

As a **étudiant**,
I want **une carte d'offre avec actions accessibles (boutons ❌💾💌 + raccourcis clavier), score visible, lien détail**,
So que **j'avance dans mon deck rapidement**.

## V1 vs V2

| Feature | V1 | V2 |
|---|---|---|
| Card design (titre/company/city/contract) | ✅ | — |
| Boutons ❌💾💌 ≥44px touch | ✅ | — |
| Raccourcis clavier ←→↑espace | ✅ | — |
| MatchScoreBadge + popover | ✅ Story 2.11 | — |
| Lien `Plus d'infos` | ✅ | — |
| `role="article"` + aria-label | ✅ | — |
| Drag-and-drop Framer Motion + spring + rotation + overlays | ❌ | V2 |
| `prefers-reduced-motion` support | ✅ (statique V1 OK) | — |
| Délai input → feedback <100ms | ✅ (server action + transition) | — |

## Implémentation

- `apps/web/app/(app)/deck/SwipeCard.tsx` — composant client
- Boutons + handlers `swipeOfferAction` (Story 3.4)
- useEffect listener `keydown` (←/→/↑/Espace)
- `onShowDetail` → `OfferDetailModal` (Story 3.3)
- Reasons popover si `showExplanation && matchScore > 0`

## Change Log

- 2026-05-19 : V1 livrée. Framer Motion deferred V2. Status: done.
