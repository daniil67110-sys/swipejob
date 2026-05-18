# Story 2.6: Désactivation automatique des offres expirées ou pourvues

Status: done

## Story

As a **SwipeJob**,
I want **que les offres avec `expiresAt < now()` passent à `status='expired'`, que les offres expirées depuis >90j passent à `status='archived'` (PII réduite pour anonymisation cohérente NFR-S3), via un job cron quotidien 03h UTC, avec count audit + sync de `isActive` pour compat**,
So que **le catalogue reste à jour et que les users ne candidatent jamais à des offres mortes**.

## Scope V1 vs V2

| Feature AC | V1 | V2 |
|---|---|---|
| expires_at < NOW() → expired | ✅ | — |
| filled flag de la source | ❌ Adzuna/FT ne fournissent pas | V2 : compare last_seen_at, status='expired' si absent > 7j |
| Exclusion matching `status != 'active'` | ✅ (le matching de Story 2.10 filtrera) | — |
| Archive 90j (anonymisation NFR-S3) | ✅ description/rawPayload nullifiés | — |
| Audit log count par raison | ✅ logger worker (pas table audit_logs car pas action user) | — |

## Acceptance Criteria

1. **AC1 — Migration `0011_offer_status`**
   - Add enum `offer_status` : `('active', 'expired', 'filled', 'archived')`
   - Add column `status offer_status NOT NULL DEFAULT 'active'`
   - Backfill : `UPDATE offers SET status = CASE WHEN is_active THEN 'active' ELSE 'archived' END`
   - Index `idx_offers_status` partial WHERE status='active' (le matching utilisera).

2. **AC2 — Lib `apps/worker/src/jobs/deactivate-offers.job.ts`**
   - Étape 1 : `UPDATE offers SET status='expired', is_active=false WHERE status='active' AND expires_at IS NOT NULL AND expires_at < NOW() RETURNING id`
   - Étape 2 : `UPDATE offers SET status='archived', description=NULL, raw_payload=NULL WHERE status='expired' AND updated_at < NOW() - INTERVAL '90 days' RETURNING id`
   - Retourne `{ ok: true, expired: N, archived: M, durationMs }`.

3. **AC3 — Queue + worker `offer-maintenance`**
   - Nouvelle queue `offer-maintenance` (générique, hébergera V2 jobs).
   - Worker `apps/worker/src/workers/offer-maintenance.worker.ts` consume queue.
   - Cron `0 3 * * *` (quotidien 03h UTC, en heure creuse).
   - jobId fixe `cron:deactivate` (idempotent).

4. **AC4 — Wire dans index.ts worker**
   - Démarre `startOfferMaintenanceWorker()` au boot + stop graceful.

5. **AC5 — Tests Vitest**
   - Mock queue : worker démarre sans crash (le job lui-même teste l'intégration en réel, V2).
   - Pour V1, juste valider que la queue est exposée + cron pattern valide.

6. **AC6 — Validation finale**
   - lint + typecheck + test + build + format + commit

## Tasks

1. Migration `0011_offer_status` + update schema + backfill
2. Queue `offer-maintenance` dans `queues/index.ts`
3. Job `deactivate-offers.job.ts`
4. Worker `offer-maintenance.worker.ts` + cron `0 3 * * *`
5. Wire dans `index.ts`
6. Validation finale + commit

## Dev Notes

### Status enum vs isActive

V1 : on garde `is_active` pour rétrocompat avec le code existant (filters anciens). Le job sync les 2 (UPDATE status + is_active simultané). À terme (V2), `is_active` peut être deprecated et remplacé par `status = 'active'`.

### Archive vs Delete

L'AC dit "restent en base 90 jours pour analytics avant archivage". Archive = status='archived' + PII réduite (description NULL, raw_payload NULL) mais row gardée pour analytics agrégés (count par catégorie, etc.). Pas de DELETE, c'est plus tard (V3 si vraiment volume DB problématique).

### Architecture sources

- `epics.md` L697-711
- NFR-S3 (anonymisation cohérente après 90j)

## Change Log

- 2026-05-18 : Story créée. filled-flag deferred V2 (sources ne fournissent pas). Status: ready-for-dev.
- 2026-05-18 : Implémentation. Migration `0011_offer_status` (enum offer_status active/expired/filled/archived + colonne + backfill sur is_active + index partiel WHERE status='active'). Queue `offer-maintenance`. Job `deactivate-offers.job.ts` 2 étapes : expirer (expires_at < NOW()) puis archiver (>90j → status=archived + description/raw_payload NULL pour NFR-S3). Worker `offer-maintenance.worker.ts` + cron `0 3 * * *` (quotidien 03h UTC). Wire dans index.ts. Build/lint/typecheck green (48 tests pass).
- 2026-05-18 : Status `done` + commit.
