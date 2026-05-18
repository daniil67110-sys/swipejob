# Story 2.3: Intégration d'au moins une source secondaire d'offres

Status: done

## Story

As a **SwipeJob**,
I want **ingérer périodiquement des offres depuis Adzuna API (FR) via un adaptateur dédié `apps/worker/src/scrapers/adzuna/`, avec cron BullMQ, rate limit + retry, upsert dans `offers` avec source='adzuna', et architecture extensible permettant d'ajouter une nouvelle source en <5 j-h (NFR-I2)**,
So that **le catalogue dépasse la couverture France Travail seule**.

## Choix de la source

**Adzuna** retenue après comparaison :

| Source | Pour V1 | Raison |
|---|---|---|
| Adzuna API | ✅ | API REST gratuite (250 req/jour free tier), doc claire, FR couverte, ToS agrégateur OK |
| APEC | ❌ | Cible cadres expérimentés (pas étudiants), API payante |
| JobTeaser | ❌ | Partenariat manuel requis, pas d'API publique |
| WTTJ RSS | ❌ | Pas de RSS public stable |
| L'Étudiant RSS | ❌ | Flux instable, parsing fragile |

Source : https://developer.adzuna.com

## Acceptance Criteria

1. **AC1 — Adaptateur `apps/worker/src/scrapers/adzuna/`**
   - `client.ts` : `fetchAdzunaOffers({ what, where, category, page, resultsPerPage })` — fetch JSON depuis Adzuna API v1.
   - Endpoint : `https://api.adzuna.com/v1/api/jobs/fr/search/{page}?app_id=...&app_key=...`.
   - Auth via query string (pas OAuth) : `app_id` + `app_key`.
   - Filtres V1 : `category=graduate-trainee-jobs` ou `category=other-general-jobs`, `results_per_page=50` (max API).
   - Rate limit : Adzuna autorise ~25 req/sec free tier ; backoff exp si 429 (pattern France Travail).
   - Timeout 30s.
   - `mapper.ts` : `mapAdzunaToOffer(raw, sourceId)` → `NewOffer | null`. Mapping `id` → `externalId`, `title`, `description`, `company.display_name` → `companyName`, `location.area[1]` → `locationCity` (city level), `latitude/longitude` directs, `salary_min/max` mensualisés (Adzuna retourne annuel → /12), `contract_time` ("full_time"/"part_time") ignoré V1, `contract_type` Adzuna ne fournit pas stage/alternance distinctement → on infère par mot-clé dans `title` (`stage`/`alternance`/`apprentissage`).

2. **AC2 — Job `processIngestAdzuna`**
   - `apps/worker/src/jobs/ingest-adzuna.job.ts` : pattern identique à France Travail.
   - getOrCreateSource(name='adzuna') → fetch toutes pages (max 5000 offres/run) → map + filter (skip si pas stage/alternance) → batch insert ON CONFLICT DO NOTHING → update lastSyncAt → Sentry alert >15 min staleness.
   - Mode conditionnel : sans `ADZUNA_APP_ID`/`ADZUNA_APP_KEY` → log warn + `{ ok: true, count: 0, mock: true }`.

3. **AC3 — Worker `offer-ingest` enrichi**
   - Ajoute branche `if (job.name === 'adzuna') → processIngestAdzuna`.
   - Repeatable cron `15,45 * * * *` (décalé de 15 min vs France Travail pour étaler la charge DB).
   - `scheduleAdzunaCron()` enregistre le job au boot, idempotent.

4. **AC4 — Env worker + flag**
   - `ADZUNA_APP_ID` + `ADZUNA_APP_KEY` (optional)
   - `ADZUNA_BASE_URL` default `https://api.adzuna.com/v1/api/jobs/fr`
   - `isAdzunaConfigured = Boolean(ADZUNA_APP_ID && ADZUNA_APP_KEY)` exporté

5. **AC5 — Tests mapper Vitest**
   - Stage : si `title` contient "stage" → contractType='stage'
   - Alternance : si `title` contient "alternance"/"apprenti" → contractType='alternance'
   - Salaire : Adzuna annuel `30000` → mensuel `2500`
   - Skip si pas stage/alternance (CDI/CDD ignorés)
   - `null` si `title` ou `id` manquants

6. **AC6 — Runbook + compliance**
   - `docs/runbooks/adzuna-api.md` : créer compte, créer app, copier app_id/key, monitoring quota
   - Update `docs/compliance/data-sources.md` avec section Adzuna

7. **AC7 — Validation finale**
   - lint + typecheck + test + build + format + commit

## Tasks

1. `apps/worker/src/scrapers/adzuna/client.ts`
2. `apps/worker/src/scrapers/adzuna/mapper.ts` + tests
3. `apps/worker/src/jobs/ingest-adzuna.job.ts`
4. Worker `offer-ingest.worker.ts` enrichi (cron Adzuna 15,45 + délégation)
5. Env worker `ADZUNA_*` + flag
6. `.env.example` enrichi
7. Runbook + compliance doc
8. Validation finale + commit

## Dev Notes

### Pattern adaptateur (NFR-I2)

L'arborescence `apps/worker/src/scrapers/<source>/{client,mapper}.ts` + `jobs/ingest-<source>.job.ts` est désormais le pattern standard. Ajouter une nouvelle source = créer 3 fichiers + 1 branche dans le worker + 1 cron schedule + env vars + tests mapper. <5 j-h tenu.

### Adzuna stage/alternance détection

L'API Adzuna ne distingue pas stage/alternance dans son schéma. On infère via regex sur `title`/`description` :
- alternance/apprentissage : `/altern|apprent/i`
- stage : `/\bstage\b/i`

Best-effort V1. Faux positifs possibles (ex : "stagiaire CDI" → classé stage). Story 2.4 (normalisation) pourra raffiner.

### Salaire annuel → mensuel

Adzuna `salary_min` et `salary_max` sont annuels en EUR. On divise par 12 pour aligner avec `offers.salary{Min,Max}Monthly`.

### Architecture sources

- `epics.md` L648-664
- `architecture.md` L863 ; NFR-I2 (nouvelle source <5 j-h)

## Change Log

- 2026-05-18 : Story créée. Adzuna retenue après comparaison. Status: ready-for-dev.
- 2026-05-18 : Implémentation complète. Scrapers `adzuna/{client,mapper}.ts` (auth query string app_id+app_key + pagination 50/page + retry exp backoff + timeout 30s). Job `processIngestAdzuna` (2 searches FR `stage` + `alternance` → dedup in-memory → batch insert ON CONFLICT DO NOTHING + Sentry alert >15 min). Worker `offer-ingest` enrichi : délégation par job.name + cron Adzuna `15,45 * * * *` décalé +15 min vs France Travail (étale la charge DB). Mapper infère contractType par regex (altern/apprent → alternance, stage/stagiaire → stage), salaire annuel→mensuel (÷12), skip si prédit. Env worker `ADZUNA_APP_ID/KEY/BASE_URL` + `isAdzunaConfigured`. 8 tests mapper Vitest. Runbook + section compliance.
- 2026-05-18 : Status `done` + commit.
