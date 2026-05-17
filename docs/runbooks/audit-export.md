# Runbook — Export mensuel audit logs vers R2

Story 1.2 (Task 9). Conformité NFR-O5 + CNIL : rétention 13 mois des logs audit RGPD/IA Act.

## Architecture

- **Source** : Axiom dataset `swipejob-audit` (events `audit.*` et `ia_audit.*` envoyés par les Server Actions et les jobs worker via Pino).
- **Job** : `audit.export-monthly` (BullMQ repeatable, cron `0 3 1 * *` UTC = 1er du mois à 03:00 UTC).
- **Destination** : Cloudflare R2 bucket `swipejob-audit-archive` avec object lock `COMPLIANCE` mode 13 mois.
- **Format** : `audit-logs/<YYYY>/<MM>/audit-<YYYY-MM>.jsonl.gz`.

## Activation (V1 → V2)

| État                            | Vars env                                        | Comportement                                                                             |
| ------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **V1 — Dry-run (default)**      | `AUDIT_EXPORT_ENABLED=false`                    | Job exécute sans upload, log warn. Permet de tester le scheduling BullMQ sans bucket R2. |
| **V1.5 — Vraies queries Axiom** | `AUDIT_EXPORT_ENABLED=true` + `AXIOM_TOKEN` set | Query réelle Axiom mais skip R2 (à compléter).                                           |
| **V2 — Full pipeline**          | + `R2_AUDIT_*` set                              | Query Axiom → gzip → upload R2 avec object lock.                                         |

## Procédure setup V2

### 1. Création bucket R2

```bash
# Via Cloudflare Dashboard ou Wrangler
wrangler r2 bucket create swipejob-audit-archive --location=eu
wrangler r2 bucket lock create swipejob-audit-archive \
  --retention-mode COMPLIANCE \
  --retention-days 396  # 13 mois
```

### 2. IAM credentials dédiées

- Créer un access key R2 avec scope **read/write uniquement sur ce bucket**.
- Stocker dans Railway worker env :
  - `R2_AUDIT_BUCKET=swipejob-audit-archive`
  - `R2_AUDIT_ACCESS_KEY_ID=...`
  - `R2_AUDIT_SECRET_ACCESS_KEY=...`
  - `R2_AUDIT_ENDPOINT=https://<account>.r2.cloudflarestorage.com`

### 3. Activer le job

- Set `AUDIT_EXPORT_ENABLED=true` sur Railway worker.
- Redéployer.
- Le repeatable job est ajouté automatiquement au démarrage du worker (cf. `apps/worker/src/workers/audit.worker.ts#startAuditWorker`).

## Vérification mensuelle

1. Le 2 de chaque mois : vérifier `https://app.axiom.co/<org>/datasets/swipejob-worker | filter event = "audit worker — job completed" | last 7d`.
2. Confirmer présence du fichier dans R2 : `wrangler r2 object list swipejob-audit-archive/audit-logs/<YYYY>/<MM>/`.
3. Tester téléchargement + ungzip + count lines : `wc -l <(gunzip -c audit-<YYYY-MM>.jsonl)`.

## Récupération en cas de demande RGPD

```bash
wrangler r2 object get swipejob-audit-archive/audit-logs/2026/04/audit-2026-04.jsonl.gz \
  --file ./audit-2026-04.jsonl.gz
gunzip audit-2026-04.jsonl.gz
jq 'select(.userId == "<distinctId hash>")' audit-2026-04.jsonl
```

## Alerting

- Job failed → BullMQ `'failed'` event → log `error` dans dataset `swipejob-worker` → alerte Sentry (Story future : créer une transaction Sentry dédiée).
- Job missed (pas d'exécution le 1er du mois) → checker manuel via cron Cloudflare Workers (V2).
