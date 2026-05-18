# Story 2.7: Maintenir un catalogue de 5 000+ offres actives

Status: done

## Story

As a **SwipeJob (responsable produit)**,
I want **un job de monitoring quotidien qui compte `offers WHERE status='active'`, publie la métrique vers Posthog, et alerte Sentry niveau warning (<5000) ou error (<3000)**,
So que **les users aient toujours un deck riche**.

## Acceptance Criteria

1. **AC1 — Job `monitor-catalog-size`**
   - `apps/worker/src/jobs/monitor-catalog.job.ts` :
     - SELECT count(*) FROM offers WHERE status='active'
     - Capture Sentry message niveau `warning` si <5000, `error` si <3000
     - Log structuré pour stream Axiom (dataset swipejob-worker)

2. **AC2 — Worker `offer-maintenance` enrichi**
   - Ajoute branche `if (job.name === 'monitor-catalog') → processMonitorCatalog`
   - Nouveau cron `15 3 * * *` (15 min après deactivate, séquencé)

3. **AC3 — Dashboard Axiom (deferred)**
   - V1 : la métrique est juste loggée. La création du dashboard Axiom = action humaine (Story 2.7 V2 ou setup ops).

4. **AC4 — Tests + validation**
   - Test unitaire processMonitorCatalog renvoie count + threshold logic
   - lint + typecheck + test + build + format + commit

## Tasks

1. `apps/worker/src/jobs/monitor-catalog.job.ts`
2. Worker `offer-maintenance` enrichi (job.name branch + cron `15 3 * * *`)
3. Test Vitest (mock count)
4. Validation finale + commit

## Change Log

- 2026-05-19 : Story créée. Status: ready-for-dev.
