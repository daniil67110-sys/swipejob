# Story 2.8: Calcul des embeddings et score de matching IA explicable

Status: done

## Story

As a **étudiant**,
I want **chaque offre comparée à mon profil via score 0-100 (60% cosine skills + 25% prefs + 15% education), embeddings Mistral-Embed pgvector, kill switch IA_MATCHING_ENABLED + fallback keyword, ia_audit_logs append-only par calcul, top-50 stocké dans match_scores**,
So que **les offres pertinentes me soient proposées avec transparence**.

## Scope V1 vs V2

| Feature | V1 | V2 |
|---|---|---|
| Mistral-Embed embeddings (1024d) | ✅ | — |
| Score 60/25/15 | ✅ | — |
| Match_scores top-50 stockés | ✅ | — |
| ia_audit_logs par match | ✅ | — |
| Kill switch + fallback keyword | ✅ | — |
| Route admin audit <30s | ❌ deferred Epic 8 | — |
| Cron nocturne 02h | ✅ | — |
| Profile_embedding column users | ✅ | — |
| Perf 30k users <60min | ⚠️ V1 sans bench, V2 mesurable |

## Acceptance Criteria

1. **AC1 — Migration `0012_profile_embedding`**
   - Add `users.profile_embedding vector(1024)` (nullable)
   - Add `users.embedding_computed_at timestamptz`
   - Index ivfflat sur `offers.embedding` pour ANN search (cosine)

2. **AC2 — Lib Mistral embed**
   - `apps/worker/src/lib/embeddings.ts` :
     - `computeEmbedding(text)` → `number[1024]` via Mistral `mistral-embed`
     - Cache miss → fetch + retry exp backoff
     - Mode conditionnel : sans MISTRAL_API_KEY → throw (handled par job)

3. **AC3 — Job `compute-embeddings`**
   - Pour offres : SELECT WHERE embedding IS NULL AND status='active' LIMIT 50 → compute texte = title + description (slice 2000 chars) → UPDATE embedding
   - Pour users : SELECT WHERE profile_embedding IS NULL AND emailVerified IS NOT NULL → compute texte = "skills: ... | education: ... | preferences: ..." → UPDATE
   - Batch 50 par run (Mistral rate limit)

4. **AC4 — Job `compute-matches`**
   - Pour chaque user actif :
     - Fetch user.profile_embedding + skills + prefs
     - Query top-200 offres par cosine similarity (pgvector `<->`) — `status='active' AND canonical_id IS NULL AND quality_score >= 0.6`
     - Pour chaque offre : compute composite score = 60% cosine + 25% pref_fit + 15% education_fit
     - Garde top-50 → INSERT match_scores ON CONFLICT DO UPDATE (id par user+offer)
     - Insert 1 row ia_audit_logs par batch user (pas par offre — sinon explose volume)
   - Cron `0 2 * * *` (02h UTC)
   - Kill switch `IA_MATCHING_ENABLED=false` → bypass + log warn

5. **AC5 — Lib score `lib/match-score.ts`**
   - `computeCosineSimilarity(a, b)` : helper si besoin (pgvector le fait en SQL, mais utile pour fallback keyword)
   - `computePrefFit(user_prefs, offer)` : 0-1 score selon contractType match + city in prefs + work mode + salary in range
   - `computeEducationFit(user_education_level, offer)` : 0-1 si offer requirements educationLevels include user level
   - `compositeScore(skillSim, prefFit, eduFit)` : 0.6*skillSim + 0.25*prefFit + 0.15*eduFit (×100 → 0-100)
   - `buildExplanation` (Story 2.11) : retourne `[{ factor, weight, value, label }]`

6. **AC6 — Story 2.9 Fairness (intégré)**
   - Test `match-fairness.test.ts` : la liste des features utilisées = `['cosine_skills', 'pref_contract_type', 'pref_city', 'pref_work_mode', 'pref_salary', 'education_level']`. Aucune référence à age/sexe/origine/etc.
   - Kill switch `IA_MATCHING_ENABLED` env var (worker + web).

7. **AC7 — Story 2.13 IA Audit Logs (intégré)**
   - Chaque batch match user → 1 row ia_audit_logs : `{ user_id (hashé), model: 'mistral-embed', model_version: 'v1', feature_type: 'match_compute', features_used jsonb (liste features actives), latency_ms, success, tokens }`
   - Append-only (déjà table existante Story 1.2.5)
   - Rétention 13 mois (déjà NFR-O5)
   - Export R2 = pattern existant audit-export Story 1.2

8. **AC8 — Tests + validation**
   - `match-score.test.ts` : computePrefFit/EducationFit/compositeScore
   - `match-fairness.test.ts` : liste features = whitelist
   - lint + typecheck + test + build + format + commit

## Tasks

1. Migration 0012 (`users.profile_embedding` + index ivfflat offers.embedding)
2. `apps/worker/src/lib/embeddings.ts` (Mistral API + mode conditionnel)
3. `apps/worker/src/lib/match-score.ts` (composite + explanation)
4. `apps/worker/src/jobs/compute-embeddings.job.ts`
5. `apps/worker/src/jobs/compute-matches.job.ts` (kill switch + fallback)
6. Workers `embeddings-compute` + `match-compute` (queues existent Story 2.1)
7. Wire dans worker index.ts + crons
8. Env workers : `MISTRAL_API_KEY` (déjà côté web — propager au worker)
9. Tests `match-score.test.ts` + `match-fairness.test.ts`
10. Validation finale + commit

## Dev Notes

### Mistral-Embed dim 1024

L'embedding column existe déjà (Story 2.1 migration 0007 `vector(1024)`). Pour ANN cosine, index ivfflat : `CREATE INDEX ON offers USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);`.

### Top-200 puis 50

ANN search retourne 200 candidats (rapide pgvector), puis JS calcule composite + filter top-50. Réduit la latence vs reranking sur tout le catalogue.

### Kill switch

Variable env workers + web `IA_MATCHING_ENABLED` (default `true`). Si `false` :
- Worker `compute-matches` bypass (log warn).
- Web /deck affiche fallback simple : top offres par freshness + pref filter (sans score).

### Fallback keyword si Mistral indisponible

Si `compute-embeddings` échoue 3× pour une offre → on stocke `embedding=null` mais le match_compute peut fallback sur scoring purement règles (60% pref_fit + 25% education_fit + 15% recency).

## Change Log

- 2026-05-19 : Story créée (bundle avec 2.9 fairness + 2.11 explanation + 2.13 audit IA Act). Status: ready-for-dev.
