# Story 2.2: Intégration de l'API France Travail

Status: done

## Story

As a **SwipeJob**,
I want **ingérer périodiquement les offres alternance + stage depuis l'API France Travail (Offres d'emploi v2), via un job cron BullMQ toutes les 30 min, avec gestion rate limit + retry exponentiel + Sentry alert si indispo >15 min, upsert dans `offers` (incluant `raw_payload` JSONB), audit log batch + métrique Posthog**,
So that **le catalogue dispose d'une source officielle, légale, et exhaustive du marché FR sans scraping HTML fragile**.

## Acceptance Criteria

1. **AC1 — Auth OAuth2 France Travail**
   - L'API France Travail demande OAuth2 client_credentials (token court 1500s).
   - `apps/worker/src/scrapers/france-travail/auth.ts` : `getFranceTravailToken()` — fetch token, cache in-memory avec expiration, refresh auto.
   - Env vars : `FRANCE_TRAVAIL_CLIENT_ID`, `FRANCE_TRAVAIL_CLIENT_SECRET`, `FRANCE_TRAVAIL_SCOPE` (default `o2dsoffre api_offresdemploiv2`).
   - Mode conditionnel : sans creds → scraper retourne `{ ok: true, mock: true, count: 0 }` + warn log.

2. **AC2 — Client API + pagination**
   - `apps/worker/src/scrapers/france-travail/client.ts` : `fetchFranceTravailOffers({ contractTypes, publishedSinceDays, limit, offset })`.
   - Endpoint : `https://api.francetravail.io/partenaire/offresdemploi/v2/offres/search`.
   - Filtres : `typeContrat` = `E2` (alternance/apprentissage) ou `MIS` (stage) ; `publieeDepuis` = 30 ; `range` pagination `0-149` (max 150 par page selon doc API).
   - Rate limit : respect du header `X-Rate-Limit-Remaining` ; si 429 → backoff exponentiel (1s, 2s, 4s, 8s, max 3 retries).
   - Timeout fetch 30s.

3. **AC3 — Normalisation `mapFranceTravailToOffer`**
   - `apps/worker/src/scrapers/france-travail/mapper.ts` : transforme un payload France Travail en `NewOffer`.
   - Mapping clés : `id` → `externalId`, `intitule` → `title`, `description` → `description`, `entreprise.nom` → `companyName`, `entreprise.logo` → `companyLogoUrl`, `typeContrat` → `contractType` (`stage`/`alternance`), `lieuTravail.libelle` → `locationCity`, lat/lng si dispo, `salaire.libelle` parsing min/max, `dureeTravailLibelle` → `duration`, `competences` → `requirements.skills[]`.
   - Le payload brut entier est stocké dans un nouveau champ `rawPayload jsonb` (à ajouter migration 0008).

4. **AC4 — Job `offer.ingest.france-travail`**
   - `apps/worker/src/jobs/ingest-france-travail.job.ts` : orchestrateur.
   - Étapes : (a) get/create offer_source row name=`france-travail`, (b) fetch toutes pages (alternance puis stage), (c) upsert batch via `INSERT ... ON CONFLICT (source_id, external_id) DO UPDATE`, (d) update `offer_sources.lastSyncAt`, (e) audit log `offer.ingested` (count + source), (f) Posthog `offers.ingested.total`.
   - Total cap : 5000 offres par run (NFR-I1 — éviter rate limit France Travail).

5. **AC5 — Cron toutes les 30 min**
   - `apps/worker/src/workers/offer-ingest.worker.ts` enrichi : enregistre un repeatable job BullMQ `france-travail` avec pattern cron `*/30 * * * *`.
   - Le worker existant (Story 2.1 stub) délègue maintenant à `processIngestFranceTravail`.

6. **AC6 — Sentry alert + retry policy**
   - Si l'API est indispo (timeout, 5xx, network) sur >3 tentatives consécutives → Sentry `captureException` severity `error` avec tags `{ scraper: 'france-travail' }`.
   - Si pas de succès depuis >15 min (mesuré via `offer_sources.lastSyncAt`) → alerte Sentry severity `warning` (NFR-I1).
   - Pattern : worker enregistre la dernière exception en mémoire ; sur prochaine échec si >15 min depuis dernier succès → alerte.

7. **AC7 — Migration 0008 `offers.rawPayload`**
   - Ajout colonne `raw_payload jsonb` (nullable) dans `offers`.
   - Pas besoin d'index (lookup rare, débug / audit).

8. **AC8 — Tests + env + runbook**
   - Test Vitest mapper : input mock France Travail → `NewOffer` valide.
   - Test job en mode mock (sans creds → retourne `{ count: 0, mock: true }`).
   - `.env.example` enrichi avec FRANCE_TRAVAIL_*.
   - `docs/runbooks/france-travail-api.md` : créer compte développeur API.francetravail.io, obtenir client_id/secret, monitoring quota.
   - `docs/compliance/data-sources.md` : documentation ToS France Travail.

## Tasks

1. Migration 0008_add_offers_raw_payload
2. `apps/worker/src/scrapers/france-travail/{auth,client,mapper}.ts`
3. `apps/worker/src/jobs/ingest-france-travail.job.ts`
4. `offer-ingest.worker.ts` : intègre repeatable cron + délégation
5. Env : `FRANCE_TRAVAIL_CLIENT_ID/SECRET/SCOPE` + `isFranceTravailConfigured`
6. Tests Vitest (mapper + mock mode)
7. Runbook + compliance doc
8. Lint + typecheck + test + build + format + commit

## Dev Notes

### Pourquoi pas de scraping HTML

La doc officielle (https://francetravail.io) fournit une API REST stable + OAuth2.
Scraping HTML serait fragile + risqué légalement (ToS scraping interdit explicitement).

### Cron pattern BullMQ

```ts
await queue.add('france-travail', {}, {
  repeat: { pattern: '*/30 * * * *' },
  jobId: 'cron:france-travail', // idempotent — BullMQ dedupe par jobId
});
```

### Pagination

API max 150 offres / page, `range` = `0-149`. Si total > 150 → `150-299`, etc. Stop quand `Content-Range` indique fin.

### Mode mock

Sans `FRANCE_TRAVAIL_CLIENT_ID/SECRET` : le job log warn + ack → permet dev/CI sans creds réelles.

### Architecture sources

- `epics.md` L630-646
- `architecture.md` L863 (France Travail owner: worker)
- NFR-I1 (alerte indispo >15 min), NFR-I2 (nouvelle source ajoutable en <5 j-h — pattern adaptateur scrapers/<source>)

## Change Log

- 2026-05-18 : Story créée. Status: ready-for-dev.
- 2026-05-18 : Implémentation complète. Migration 0008 (offers.raw_payload jsonb). Scrapers `france-travail/{auth,client,mapper}.ts` (OAuth2 token cache + pagination 150/page + retry exp backoff sur 429/5xx + timeout 30s). Job `processIngestFranceTravail` (fetch E2 + MIS, map, batch upsert ON CONFLICT DO NOTHING, audit update lastSyncAt, Sentry alert >15 min staleness — NFR-I1). Worker `offer-ingest` délègue par job.name + repeatable cron `*/30 * * * *` enregistré au boot (jobId fixe → idempotent). Env worker enrichi 5 vars + `isFranceTravailConfigured`. 53 tests pass (15 worker dont 6 mapper). Runbook + compliance/data-sources.md.
- 2026-05-18 : Status `done` + commit.
