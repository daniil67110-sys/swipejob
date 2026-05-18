# Story 2.10: Génération du deck quotidien personnalisé

Status: done

## Story

As a **étudiant**,
I want **recevoir chaque matin un deck personnalisé 10-20 offres ordonnées par pertinence, avec fallback freshness si pas encore matché, scarcity hint si <10 offres, Posthog tracking deck.opened**,
So que **je consomme rapidement les meilleures opportunités**.

## Implémentation

### Server Action `getDailyDeck`
- `apps/web/app/(app)/deck/actions.ts`
- Auth + DB checks
- 1) JOIN match_scores × offers WHERE status='active' AND canonical_id IS NULL ORDER BY score DESC LIMIT 15
- 2) Fallback freshness si match_scores empty : top offres ORDER BY publishedAt DESC
- 3) Scarcity detection (Story 2.12) si <10 → hint type (`broaden_radius`/`broaden_cities`/`review_cv`/`review_skills`)
- Posthog `deck.opened` + `deck.scarcity_detected`

### UI `/deck`
- Server component fetch via getDailyDeck
- Liste cards offres avec : title, company, location, contractType, salaire range
- `<MatchExplanationPopover>` (Story 2.11 UI) : badge score + popover 3-5 features visualisés (barres horizontales) + click outside + escape + lien FAQ
- Scarcity hint avec CTA "Modifier mes préférences" ou "Revoir mon profil"
- Empty state si 0 offre
- `sourceUrl` lien externe vers Adzuna/FT (compliance ToS)

### V1 limitations (documentées)

- Pas d'exclusion swipe_events (Story 3.x crée la table)
- Pas de cache TanStack Query côté client (V2)
- Pas de skeleton loader (V1 fetch <500ms typique)
- A11y popover : custom impl (sans Radix), focus trap basique

## AC vs Implé

| AC | Implé V1 |
|---|---|
| 10-20 offres top score | ✅ TARGET 15 |
| Exclure expirées/inactives | ✅ status='active' filter |
| Exclure swipées | ❌ V1 deferred Story 3.x |
| `{offerData, matchScore, matchReasons}` | ✅ DeckOffer type |
| Cache TanStack Query 5min | ❌ V2 (server component naturel) |
| Délai <2s cold cache | ✅ probable (server query indexée) |
| Posthog `deck.opened` | ✅ |

## Change Log

- 2026-05-19 : Story créée + livrée. Status: done.
