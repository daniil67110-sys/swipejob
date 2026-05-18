# Story 2.11: Affichage de l'explication textuelle du score par offre

Status: in-progress (back livré, UI Story 2.10)

## Story

As a **étudiant**,
I want **comprendre pourquoi une offre a obtenu un certain score via un popover affichant 3-5 features contributives avec poids visualisés et statut match**,
So que **je puisse faire confiance au système**.

## Implémentation backend (Story 2.8)

La partie backend est **livrée dans le commit Story 2.8** :

- `lib/match-score.ts` exporte `buildExplanation()` qui retourne `ExplanationFeature[]` avec :
  - `factor` (whitelist Story 2.9)
  - `weight` (0-1)
  - `value` (0-1)
  - `label` FR clair ("Compétences techniques", "Localisation", etc.)
  - `matched` boolean

- L'explication est stockée dans `match_scores.explanation jsonb` à chaque compute-matches.
- Format : `{ contributingFactors: ExplanationFeature[], modelVersion: 'v1-mistral-embed' }`.

## Implémentation UI

Le composant `<MatchExplanationPopover>` sera implémenté **dans le commit Story 2.10** (deck UI) — il est l'enfant naturel de la card du deck.

### TODO Story 2.10

- Composant `<MatchScoreBadge>` cliquable.
- `<MatchExplanationPopover>` (Radix UI ou shadcn) avec :
  - 3-5 features (top 5 du `contributingFactors`)
  - Barre horizontale `<progress>` pour visualiser le poids
  - Statut match (vert/neutre) via couleurs Tailwind
  - Texte explicatif court ("Tu maîtrises X des Y compétences")
  - Lien "En savoir plus sur le matching" → FAQ
  - A11y : `<Popover>` Radix avec focus trap + escape + screen reader OK
  - Posthog event `match.explanation_viewed`

## Change Log

- 2026-05-19 : Backend livré dans Story 2.8. UI portée par Story 2.10. Status: in-progress.
