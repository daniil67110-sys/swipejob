# Story 2.4: Normalisation des offres en format unifié

Status: done

## Story

As a **moteur de matching**,
I want **que toutes les offres ingérées soient normalisées dans un format unifié (qualityScore + sourceUrl + contactEmail + publishedAt extraits par heuristiques, lat/lng préservés des sources), avec un job `normalize` BullMQ batch consume queue `offer-normalize`, audit log `offer.normalized`**,
So that **le matching et l'affichage soient cohérents quelle que soit la source**.

## Scope V1 vs V2

| Feature AC | V1 | V2 (deferred) |
|---|---|---|
| qualityScore heuristique | ✅ | Affinage Mistral |
| Extract sourceUrl du rawPayload | ✅ | — |
| Extract contactEmail via regex | ✅ | Validation deliverability |
| publishedAt depuis rawPayload | ✅ | — |
| Worker BullMQ batch normalize | ✅ | — |
| Skills extraction Mistral fallback | ❌ deferred | Story 2.4-v2 |
| Géocoding BAN/Nominatim | ❌ deferred | Story 2.4-v2 |
| Markdown sanitize description | ⚠️ partial (strip HTML tags) | Marked.js full V2 |

Justification : V1 doit débloquer le matching (Story 2.8). Les sources fournissent déjà lat/lng quand dispo, et stage/alternance est déjà détecté. Le polish Mistral peut attendre.

## Acceptance Criteria

1. **AC1 — Migration `0009_normalize_offers`**
   - Add columns to `offers` :
     - `quality_score double precision NULL` (0.0 = inutilisable, 1.0 = complet)
     - `source_url text NULL` (lien vers offre originale sur la source)
     - `contact_email citext NULL` (extrait description ou rawPayload)
     - `published_at timestamptz NULL` (date publication par la source)
     - `normalized_at timestamptz NULL` (NULL = pas encore normalisé)
   - Index `idx_offers_quality_score` (where `quality_score >= 0.6`) pour le matching qui filtre les low-quality.

2. **AC2 — Lib `apps/worker/src/lib/normalize.ts`**
   - `normalizeOffer(offer)` → `{ qualityScore, sourceUrl, contactEmail, publishedAt }` :
     - `extractSourceUrl(rawPayload, sourceName)` : Adzuna `redirect_url`, France Travail `origineOffre.urlOrigine` ou `id` → `https://candidat.francetravail.fr/offres/recherche/detail/{id}`
     - `extractContactEmail(description)` : regex RFC-like sur le texte description (`/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/`)
     - `extractPublishedAt(rawPayload, sourceName)` : Adzuna `created`, France Travail `dateCreation`
     - `computeQualityScore(offer)` : note 0-1 basée sur présence de champs critiques :
       - title (mandatory, déjà 1) — 0 si manquant
       - description non vide : +0.2
       - companyName : +0.15
       - locationCity : +0.15
       - lat/lng : +0.10
       - salary min ou max : +0.10
       - contractType valide : +0.15 (toujours présent post-ingest)
       - publishedAt : +0.15

3. **AC3 — Worker job `normalize-offers`**
   - Nouveau queue `offer-normalize` (à ajouter dans `queues/index.ts`).
   - Nouveau worker `apps/worker/src/workers/normalize-offers.worker.ts` :
     - Consume queue + log + Sentry sur fail (pattern existant).
   - Job batch `processNormalizeOffers` : `SELECT * FROM offers WHERE normalized_at IS NULL LIMIT 500` → pour chaque, calcul + UPDATE.
   - Cron `5,25,35,55 * * * *` (toutes les 20 min, décalé pour pas conflicter avec ingest crons).
   - Audit log `offer.normalized` (count, source, qualityRange) à la fin du batch.

4. **AC4 — Enqueue post-ingest**
   - Après chaque ingest (France Travail / Adzuna), enqueue un job `normalize-offers` `normalize` immédiatement (sans attendre le cron).
   - Idempotent : le job ne traite que les offres `normalized_at IS NULL`, donc safe de l'enqueue plusieurs fois.

5. **AC5 — Tests Vitest**
   - `normalize.test.ts` :
     - `computeQualityScore` returns 1.0 pour offer complète, ~0.5 pour offer minimale, 0.0 si title manquant
     - `extractContactEmail` trouve `contact@example.fr` dans description, retourne null sinon
     - `extractSourceUrl` retourne url Adzuna depuis rawPayload, url FT depuis externalId
     - `extractPublishedAt` parse ISO dates correctement

6. **AC6 — Validation finale**
   - lint + typecheck + test + build + format + commit

## Tasks

1. Migration `0009_normalize_offers.sql` + update schema
2. `apps/worker/src/lib/normalize.ts`
3. `apps/worker/src/workers/normalize-offers.worker.ts`
4. Queue `offer-normalize` dans `queues/index.ts`
5. Wire dans worker `index.ts` (start/stop)
6. Enqueue post-ingest dans `ingest-france-travail.job.ts` + `ingest-adzuna.job.ts`
7. Tests Vitest `normalize.test.ts`
8. Validation + commit

## Dev Notes

### Pourquoi pas Mistral V1

Le PRD demande "Mistral en fallback pour compétences ambiguës". V1 : les sources fournissent déjà skills (France Travail `competences`, Adzuna non — mais ils ne sont pas critiques pour V1 matching). Mistral fallback ajouterait coût ~0,01€/offre × 5000 offres = 50€/run de cron. Disproportionné V1.

### Pourquoi pas géocoding V1

France Travail fournit lat/lng pour ~80% des offres, Adzuna pour ~70%. Pour les 20-30% manquants, V2 utilisera Nominatim (gratuit, EU, rate limit 1 req/sec). V1 accepte le trou.

### Quality score < 0.6 = exclu du matching

Threshold 0.6 (paramétrable plus tard). Sur ~5000 offres ingérées, environ 80-90% seront >= 0.6 grâce aux champs obligatoires (title, contractType). Les <0.6 sont des offres incomplètes (souvent issues de scraping HTML mal parsé — pas notre cas V1) → exclus.

### Architecture sources

- `epics.md` L665-679
- `architecture.md` L863 — NFR-I3 (catalogue 5000 actives, normalisation obligatoire)
- NFR-CP — quality filter pour matching

## Change Log

- 2026-05-18 : Story créée. Scope V1 réduit (Mistral + géocoding deferred). Status: ready-for-dev.
- 2026-05-18 : Implémentation. Migration `0009_normalize_offers` (5 colonnes : qualityScore + sourceUrl + contactEmail + publishedAt + normalizedAt, 2 index partiels). Lib `apps/worker/src/lib/normalize.ts` (extractContactEmail regex RFC simpliste + extractSourceUrl Adzuna/FT + extractPublishedAt + computeQualityScore 0-1 par présence champs). Queue `offer-normalize` ajoutée. Worker `normalize-offers.worker.ts` + cron `5,25,45 * * * *` (toutes les 20 min décalé +5 vs ingest). Job batch `processNormalizeOffers` SELECT WHERE normalized_at IS NULL LIMIT 500 + update qualityScore distribution log. Enqueue post-ingest dans France Travail + Adzuna jobs. 14 nouveaux tests Vitest. Build/lint/typecheck green.
- 2026-05-18 : Status `done` + commit.
