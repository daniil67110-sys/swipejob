# Story 2.12: Détection de pénurie et suggestion d'élargissement

Status: done

## Story

As a **étudiant avec critères trop restrictifs**,
I want **être averti quand mon deck est <10 cartes et recevoir une suggestion concrète d'élargissement, avec CTA 1-clic**,
So que **je continue à découvrir des opportunités sans frustration**.

## Implémentation (intégrée à Story 2.10)

Cette story est **livrée dans le commit Story 2.10**.

### Détection

- `detectScarcity()` dans `app/(app)/deck/actions.ts` : si deckSize < 10 → analyse heuristique :
  - 1 ville unique → suggestion `broaden_cities`
  - geoRadiusKm < 50 → suggestion `broaden_radius`
  - 0 offre → suggestion `review_cv`
  - autre → suggestion `review_skills`
- Posthog `deck.scarcity_detected` event avec `criterion` type.

### UI

- Coach message dans `/deck/page.tsx` au-dessus de la liste si scarcityHint non-null
- CTA dynamique : "Modifier mes préférences" → `/etape-2-preferences` OR "Revoir mon profil" → `/profil`

### V1 limitations

- Pas de "calcul analyse marginale" exact (V2 — "X offres si rayon 50km"). V1 : heuristique simple.
- Pas de throttling "max 1×/48h" (V2 — table `coach_messages_seen`). V1 : à chaque visite si scarcity.

## Change Log

- 2026-05-19 : Story créée + livrée dans Story 2.10. Status: done.
