# Runbook — Export mensuel audit logs vers R2

Story 6.5. Conformité NFR-O5 + CNIL : rétention 13 mois des logs audit RGPD/IA Act.

## Architecture

- **Source canonique** : table Postgres `audit_logs` (append-only, trigger PG enforce — migration 0022).
  - Axiom dataset `swipejob-audit` reste le stream temps réel pour le monitoring, mais l'archive froide se fait depuis Postgres (source de vérité, plus simple, pas de dépendance externe).
- **Job** : `audit.export-monthly` (BullMQ repeatable, cron `0 3 1 * *` UTC = 1er du mois à 03:00 UTC).
- **Destination** : Cloudflare R2 — bucket dédié `swipejob-audit-archive` (recommandé) avec object lock COMPLIANCE mode 13 mois, ou bucket principal (`R2_BUCKET_NAME`) avec préfixe `audit-archive/` en fallback V1.
- **Format** : `audit-archive/<YYYY>/<MM>/audit-<YYYY-MM>.jsonl.gz` (JSON Lines gzip).

## Append-only enforcement (Story 6.5)

La table `audit_logs` est protégée par un trigger PG (`audit_logs_enforce_append_only`) qui :

- Bloque tout `UPDATE` sauf si la session a opt-in via `set_config('audit_logs.allow_modify','true',true)` (utilisé uniquement par `rgpd-delete.job` pour anonymiser `actor_id` après purge RGPD).
- Bloque `DELETE` pour rows < 13 mois (rétention CNIL). Permis au-delà pour permettre la purge automatique post-archive.

Test d'enforcement : voir `apps/worker/src/jobs/audit-export-monthly.job.test.ts` et le test fresh-DB du fix journal.

## Activation (V1 → V2)

| État                         | Vars env                                                | Comportement                                                                      |
| ---------------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **V1 — Dry-run (default)**   | `AUDIT_EXPORT_ENABLED=false`                            | Job exécute sans query Postgres ni upload. Permet de tester le scheduling BullMQ. |
| **V1.5 — Bucket principal**  | `AUDIT_EXPORT_ENABLED=true` + `R2_*` (bucket principal) | Export Postgres → upload sous préfixe `audit-archive/` du bucket principal.       |
| **V2 — Bucket dédié + lock** | + `R2_AUDIT_*` set                                      | Upload vers bucket dédié avec object lock COMPLIANCE 13 mois.                     |

## Procédure setup V2 (bucket dédié)

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
  - `R2_AUDIT_ENDPOINT=https://<account>.r2.cloudflarestorage.com` (optionnel, sinon dérivé de `R2_ACCOUNT_ID`)

### 3. Secret de hash IP/UA

Le helper `hashAuditValue` côté web HMAC-SHA-256 les IP et User-Agent avant insert. Cohérence cross-process : la même `AUDIT_USER_HASH_SECRET` doit être configurée côté web ET côté worker (≥32 chars en prod).

### 4. Activer le job

- Set `AUDIT_EXPORT_ENABLED=true` sur Railway worker.
- Redéployer.
- Le repeatable job est ajouté automatiquement au démarrage du worker (cf. `apps/worker/src/workers/audit.worker.ts#startAuditWorker`).

## Vérification mensuelle

1. Le 2 de chaque mois : vérifier dans Axiom dataset `swipejob-worker` que le job a tourné :
   `event = "audit worker — job completed" | last 7d`.
2. Confirmer présence du fichier dans R2 :
   `wrangler r2 object list <bucket>/audit-archive/<YYYY>/<MM>/`.
3. Tester téléchargement + ungzip + count lines :
   ```bash
   wrangler r2 object get <bucket>/audit-archive/2026/04/audit-2026-04.jsonl.gz --file ./audit.gz
   gunzip -c audit.gz | wc -l
   ```

## Récupération en cas de demande RGPD

```bash
wrangler r2 object get <bucket>/audit-archive/2026/04/audit-2026-04.jsonl.gz \
  --file ./audit-2026-04.jsonl.gz
gunzip audit-2026-04.jsonl.gz
# Filtrer par actor_id (déjà anonymisé en `anon_<hmac16>` si l'utilisateur a été purgé)
jq 'select(.actorId == "anon_a1b2c3d4e5f60718")' audit-2026-04.jsonl
```

## Purge automatique > 13 mois (futur Story 6.7)

La rétention CNIL impose 13 mois max. Après archive R2 confirmée, un job complémentaire pourra `DELETE FROM audit_logs WHERE created_at < now() - interval '13 months'` (le trigger autorise ce DELETE puisque l'âge dépasse 13 mois).

## Alerting

- Job failed → BullMQ `'failed'` event → log `error` dans dataset `swipejob-worker` → alerte Sentry (Story future : créer une transaction Sentry dédiée).
- Job missed (pas d'exécution le 1er du mois) → checker manuel via cron Cloudflare Workers (V2).
