# Story 2.1: Bootstrap du worker BullMQ et schémas d'offres

Status: done

## Story

As a **équipe technique**,
I want **un worker Node.js opérationnel avec 5 queues BullMQ (offer-ingest, offer-dedupe, embeddings-compute, match-compute, failed-jobs) + Redis Upstash EU avec retry/backoff, des endpoints `/health` + `/metrics` Hono, et les schémas Drizzle `offers`, `offer_sources`, `match_scores` en migration**,
So that **toute la chaîne d'ingestion et de matching puisse s'exécuter de manière asynchrone et scalable, et que les stubs `cv.parse` (Story 1.7) + `rgpd.delete` (Story 1.10) puissent être wirés**.

## Acceptance Criteria

1. **AC1 — Schémas DB `offers`, `offer_sources`, `match_scores`**
   - `packages/db/src/schema/offer-sources.ts` : référentiel des sources d'offres (France Travail, APEC, etc.) avec `id`, `name`, `apiUrl`, `enabled`, `lastSyncAt`.
   - `packages/db/src/schema/offers.ts` : offres ingérées, `id`, `sourceId FK`, `externalId` (id source externe), `title`, `description text`, `companyName`, `companyLogoUrl`, `contractType` (stage/alternance), `location` (city + lat/lng), `remoteMode`, `salaryMinMonthly`, `salaryMaxMonthly`, `startDate`, `duration`, `requirements jsonb`, `embedding vector(1024)` (pgvector), `expiresAt`, `isActive boolean`, `...timestamps`. UNIQUE(`sourceId`, `externalId`).
   - `packages/db/src/schema/match-scores.ts` : scores utilisateur×offre, `id`, `userId FK`, `offerId FK`, `score float`, `explanation jsonb`, `computedAt`. UNIQUE(`userId`, `offerId`).
   - Migration `0007_add_offers_and_matches.sql` avec extension `vector` pour pgvector.

2. **AC2 — Queues BullMQ + Redis**
   - `apps/worker/src/lib/redis.ts` : connection Upstash (TLS) + retry/circuit breaker (`maxRetriesPerRequest: null` requis BullMQ, `enableReadyCheck: false`, `retryStrategy` exponentiel).
   - `apps/worker/src/queues/index.ts` (réécrit pour remplacer le stub) :
     - 5 queues : `offer-ingest`, `offer-dedupe`, `embeddings-compute`, `match-compute`, `failed-jobs`.
     - Chaque queue : `defaultJobOptions = { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, removeOnComplete: 100, removeOnFail: 500 }`.
     - Export typed : `getOfferIngestQueue()`, `getOfferDedupeQueue()`, etc.
     - Mode conditionnel : si `REDIS_URL` absent → les getters retournent `null` et un warn est loggé.

3. **AC3 — Worker `offer-ingest` minimal + failed-jobs handler**
   - Stub worker `apps/worker/src/workers/offer-ingest.worker.ts` : log + ack (V1, l'implémentation France Travail = Story 2.2).
   - Worker `apps/worker/src/workers/failed-jobs.worker.ts` : consume `failed-jobs` queue, log + Sentry capture, archive en DB (table `failed_jobs` optionnel V1 → log seul OK).
   - Listener global sur chaque queue : `worker.on('failed', (job, err) => { ... })` route vers `failed-jobs` queue après épuisement des retries.

4. **AC4 — Endpoint `/health` enrichi**
   - Retourne `{ status, service, version, commit, env, queues: { 'offer-ingest': { active, waiting, failed, ... }, ... }, redis: 'connected' | 'disconnected', timestamp }`.
   - HTTP 200 si Redis OK et toutes queues opérationnelles, sinon 503.
   - Doit pouvoir être appelé sans authentification (interne Railway).

5. **AC5 — Endpoint `/metrics` Prometheus-compatible**
   - Format texte Prometheus (pas Hono JSON) : `# HELP swipejob_queue_jobs_pending Number of pending jobs\n# TYPE swipejob_queue_jobs_pending gauge\nswipejob_queue_jobs_pending{queue="offer-ingest"} 0\n...`
   - Métriques exposées par queue : `_pending`, `_active`, `_completed`, `_failed`, `_delayed`.
   - `swipejob_redis_connected` 0/1.

6. **AC6 — Lib `enqueueJob` côté web**
   - `apps/web/lib/queue.ts` (déjà stub) : implémente `enqueueCvParse(cvId, userId)`, `enqueueRgpdDelete(userId)`.
   - Réutilise le pattern Redis connection avec mode conditionnel.
   - **Wire les stubs Story 1.7 + 1.10** : `apps/web/app/api/cv/upload/route.ts` enqueue après upload réussi ; `apps/web/app/(app)/profil/supprimer/actions.ts` enqueue après soft-delete.

7. **AC7 — Sentry instrumentation queues**
   - Chaque worker capture l'erreur via Sentry avec `tags: { queue: 'offer-ingest', jobName, attemptNumber }`.
   - Job qui échoue 3× → alerte Sentry severity `error` avec breadcrumb du payload (sanitized — pas de PII via `redactPII`).

8. **AC8 — Tests + validation**
   - Test Vitest : `queues/index.ts` retourne `null` sans REDIS_URL, retourne `Queue` avec.
   - Test `enqueueCvParse` : retourne `{ ok: true, mock: true }` sans REDIS_URL.
   - Tous green : lint + typecheck + test + build + format + commit.

## Tasks

1. **Schémas DB**
   - [ ] `packages/db/src/schema/offer-sources.ts`
   - [ ] `packages/db/src/schema/offers.ts` (avec pgvector embedding)
   - [ ] `packages/db/src/schema/match-scores.ts`
   - [ ] Update `schema/index.ts` + `drizzle.config.ts`
   - [ ] Migration `0007_add_offers_and_matches.sql` (avec `CREATE EXTENSION IF NOT EXISTS vector`)

2. **Worker lib**
   - [ ] `apps/worker/src/lib/redis.ts` (singleton connection)
   - [ ] `apps/worker/src/queues/index.ts` (réécrit)

3. **Workers stubs**
   - [ ] `apps/worker/src/workers/offer-ingest.worker.ts`
   - [ ] `apps/worker/src/workers/failed-jobs.worker.ts`
   - [ ] Update `apps/worker/src/index.ts` pour démarrer les workers

4. **Endpoints**
   - [ ] `/health` enrichi
   - [ ] `/metrics` Prometheus format
   - [ ] Helpers de queue stats

5. **Web client queue**
   - [ ] `apps/web/lib/queue.ts` (réécrit) avec `enqueueCvParse` + `enqueueRgpdDelete`
   - [ ] Wire dans `apps/web/app/api/cv/upload/route.ts` (remplace le warn stub)
   - [ ] Wire dans `apps/web/app/(app)/profil/supprimer/actions.ts` (remplace le warn stub)

6. **Tests + validation**
   - [ ] Vitest worker queues
   - [ ] lint + typecheck + test + build + format + commit

## Dev Notes

- `bullmq` v5 demande `maxRetriesPerRequest: null` sur la connexion Redis pour pouvoir bloquer indéfiniment (sinon les workers ne fonctionnent pas).
- `pgvector` extension requise pour `embedding vector(1024)` (dimension Mistral-Embed). À activer dans la migration : `CREATE EXTENSION IF NOT EXISTS vector;`.
- Le worker tournera sur Railway en V1, séparé de Vercel. Hono permet de partager le code avec un déploiement Edge si besoin.
- Failed jobs queue : pattern courant BullMQ pour archiver les jobs qui ont épuisé leurs retries. Permet de retry manuellement depuis un dashboard admin (out of scope V1 — Story 8.x).

## Change Log

- 2026-05-18 : Story créée. Status: ready-for-dev.
- 2026-05-18 : Implémentation complète. Migration `0007_add_offers_and_matches` (extension pgvector + 3 tables : offer_sources, offers avec embedding vector(1024), match_scores). Lib worker `redis.ts` (singleton + retry/backoff). Queues BullMQ refactor : 7 queues (offer-ingest/dedupe, embeddings-compute, match-compute, cv-parse, rgpd-delete, failed-jobs) + retry policy. 4 workers démarrés au boot worker (offer-ingest/cv-parse/rgpd-delete/failed-jobs), chacun route ses jobs échoués vers failed-jobs queue. `/health` enrichi (redis + queue stats), `/metrics` Prometheus format. Lib web `queue.ts` avec `enqueueCvParse` + `enqueueRgpdDelete` (rgpd-delete delayed 30j). Wire stubs Story 1.7 (cv upload) + Story 1.10 (account deletion). 32 tests pass (Vitest), build OK, lint OK.
- 2026-05-18 : Status `done` + commit.
