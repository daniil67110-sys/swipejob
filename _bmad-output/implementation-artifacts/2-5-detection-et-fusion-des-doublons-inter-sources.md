# Story 2.5: Détection et fusion des doublons inter-sources

Status: done

## Story

As a **SwipeJob**,
I want **détecter automatiquement les offres publiées sur plusieurs sources (France Travail + Adzuna) et les fusionner en une entrée canonique via `canonicalId` self-ref FK, avec fuzzy match Jaro-Winkler ≥85% sur (entreprise + titre + ville + contractType), worker `offer-dedupe` + cron**,
So que **les users ne voient jamais 2× la même offre dans leur deck**.

## Scope V1 vs V2

| Feature AC | V1 | V2 |
|---|---|---|
| Détection fuzzy 85% (entreprise/titre/city) | ✅ | — |
| `canonicalId` self-ref FK | ✅ | — |
| Multi-source provenance via JOIN | ✅ implicite (canonicalId pointe vers la 1ère) | `sources[]` jsonb explicite |
| Version canonique enrichie (desc la plus riche, etc.) | ❌ deferred | 2.5-v2 |
| Audit log fusion | ✅ (via worker logger + ia_audit_logs si pattern Mistral V2) | — |
| Threshold quality < 0.5 → modération admin | ⚠️ V1 = juste exclu de la dedupe (skip), modération UI = Story 8.2 | — |

## Acceptance Criteria

1. **AC1 — Migration `0010_offers_canonical`**
   - Add `canonical_id text REFERENCES offers(id) ON DELETE SET NULL` (nullable, self-ref).
   - Add `deduped_at timestamptz NULL` (NULL = pas encore traité par dedupe).
   - Index : `idx_offers_canonical_id` + `idx_offers_not_deduped` partial WHERE deduped_at IS NULL.

2. **AC2 — Lib `apps/worker/src/lib/dedupe.ts`**
   - `normalizeForFuzzy(s)` : lowercase + no accent + strip ponctuation + collapse spaces
   - `jaroWinklerSimilarity(a, b)` : implémentation simple JS (pas de lib externe)
   - `compositeSimilarity(offerA, offerB)` : score 0-1 = moyenne pondérée (titre 0.4 + companyName 0.3 + city 0.2 + contractType binary 0.1). Si contractType diffère → return 0 directement (les stages ne matchent jamais avec alternances).
   - `findCanonicalCandidate(candidate, threshold = 0.85)` : SELECT offers WHERE id != candidate.id AND canonical_id IS NULL AND quality_score >= 0.5 AND companyName/contractType match → calcule similarity → retourne le meilleur match si > threshold.

3. **AC3 — Worker `offer-dedupe` (refactor existant)**
   - La queue `offer-dedupe` existe (Story 2.1). On ajoute le worker correspondant : `apps/worker/src/workers/offer-dedupe.worker.ts`.
   - Cron `10,30,50 * * * *` (toutes les 20 min, décalé +5 vs normalize pour s'enchaîner).
   - Job batch `processDedupe` : SELECT offers WHERE deduped_at IS NULL AND quality_score >= 0.5 AND canonical_id IS NULL LIMIT 200 → pour chaque, findCanonicalCandidate → si match : UPDATE candidate.canonical_id = match.id → audit log "offer.merged" → toujours UPDATE deduped_at = NOW().

4. **AC4 — Enqueue post-normalize**
   - `processNormalizeOffers` enqueue un job dedupe à la fin (idempotent via `deduped_at IS NULL`).

5. **AC5 — Tests Vitest**
   - `dedupe.test.ts` :
     - `normalizeForFuzzy('Stage Marketing!! ')` = `'stage marketing'`
     - `jaroWinklerSimilarity('Acme', 'Acme')` = 1, `('Acme', 'Acmé')` ~ 0.95
     - `compositeSimilarity` retourne 1 pour 2 offres identiques, 0 pour contractType différent
     - Test dedupe pipeline end-to-end avec mock DB (skip si trop complexe — au moins coverage lib)

6. **AC6 — Validation finale**
   - lint + typecheck + test + build + format + commit

## Tasks

1. Migration `0010_offers_canonical` + update schema
2. `apps/worker/src/lib/dedupe.ts` + tests
3. Job `apps/worker/src/jobs/dedupe-offers.job.ts`
4. Worker `apps/worker/src/workers/offer-dedupe.worker.ts` + cron
5. Wire dans worker `index.ts` (start/stop)
6. Enqueue post-normalize
7. Validation + commit

## Dev Notes

### Jaro-Winkler vs Levenshtein

Jaro-Winkler favorise les prefixes communs (bon pour "Acme Corp" vs "Acme Corporation"). Levenshtein compte juste les edits, moins adapté aux noms d'entreprises avec suffixes variables. V1 = Jaro-Winkler maison (~50 lignes JS).

### Pourquoi pas pg_trgm en SQL direct

On a déjà pg_trgm activé (Story 1.9). Mais le pré-filter SQL ON companyName/city marche pour réduire le scan, le score précis vient ensuite côté JS. Compromis : query SQL + fuzzy JS = simple + testable + flexible.

### Multi-source provenance V1

Les "sources[]" du PRD impliqueraient un tableau de FK vers offer_sources. V1 : on garde 1 row par source, lié par `canonical_id` self-ref. La requête "trouve toutes les sources d'une offre canonique" devient :
```sql
SELECT * FROM offers WHERE id = $1 OR canonical_id = $1;
```
Simple, déjà indexé.

### Architecture sources

- `epics.md` L681-695
- NFR-CP — éviter doublons dans le deck (Story 2.10 filtrera `canonical_id IS NULL` ou logique d'aggrégation)

## Change Log

- 2026-05-18 : Story créée. Status: ready-for-dev.
- 2026-05-18 : Implémentation. Migration `0010_offers_canonical` (canonicalId + dedupedAt + 2 index). Lib `dedupe.ts` (Jaro-Winkler implé maison + normalizeForFuzzy NFD + compositeSimilarity titre 0.4/company 0.3/city 0.2/contractType 0.1 + hard filter contractType). Job `dedupe-offers.job.ts` (pre-filter SQL ILIKE prefix 4 chars + threshold 0.85 + batch 200 + idempotent dedupedAt). Worker `offer-dedupe.worker.ts` + cron `10,30,50 * * * *` (+5 vs normalize). Enqueue post-normalize. 11 nouveaux tests Vitest. 48 worker tests total. Build/lint/typecheck green.
- 2026-05-18 : Status `done` + commit.
