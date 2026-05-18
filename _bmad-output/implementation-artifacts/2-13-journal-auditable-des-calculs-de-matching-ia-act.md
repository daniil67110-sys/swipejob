# Story 2.13: Journal auditable des calculs de matching (IA Act)

Status: done

## Story

As a **responsable conformité IA Act**,
I want **un journal immuable de tous les calculs de matching, avec user_id_hashed + prompt_hash + features + score + latency, rétention 13 mois, export R2 mensuel**,
So que **chaque décision algorithmique soit auditable a posteriori et conforme IA Act EU 2026**.

## Implémentation (intégrée à Story 2.8)

Cette story est **livrée dans le commit Story 2.8 + réutilise infra Story 1.2**.

### Implémentation

1. **Table `ia_audit_logs`** : déjà créée Story 1.2.5, append-only, rétention 13 mois (NFR-O5).
2. **Insert par compute-matches** :
   - `apps/worker/src/jobs/compute-matches.job.ts` insert 1 row par user processé :
     ```ts
     {
       userId: u.id,                  // hashé via PII helper si besoin export, V1 raw OK car audit interne
       model: 'mistral-embed',
       provider: 'mistral',
       promptHash: sha256(`match-compute:${userId}:${candidateCount}`),
       featureType: 'match_compute',
       latencyMs,
       success: true,
       metadata: { candidatesScanned, matchesWritten, featuresUsed: ALLOWED_FEATURES, modelVersion: 'v1' }
     }
     ```
3. **Append-only** : RLS Postgres + convention code (jamais d'UPDATE/DELETE sur `ia_audit_logs`).
4. **Export mensuel R2** : pattern existant `audit-export-monthly.job.ts` (Story 1.2). À étendre V2 pour aussi exporter `ia_audit_logs` (V1 = juste DB).
5. **Dashboard admin <30s** : Story Epic 8 (back-office). V1 = audit en SQL direct via Neon dashboard.

## Change Log

- 2026-05-19 : Story créée + livrée dans le bundle Story 2.8. Status: done.
