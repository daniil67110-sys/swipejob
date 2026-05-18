# Runbook — API France Travail (Offres d'emploi v2)

Story de référence : 2.2 (intégration ingestion offres)

## 1. Créer un compte partenaire

1. Aller sur https://francetravail.io
2. **S'inscrire** → créer un compte partenaire (utiliser email équipe `equipe@swipejob.fr`)
3. Validation par France Travail : ~24-48h (manuelle)
4. Plan gratuit : 200 req/min, 100k req/jour — largement suffisant pour V1

## 2. Créer l'application

1. Dashboard → **Mes applications** → **Créer une application**
2. Nom : `swipejob-prod` (ou `-preview` / `-dev`)
3. URL de redirection : non requise (on n'utilise pas le flow user)
4. **Sélectionner les API** :
   - ✅ **Offres d'emploi v2** (`api_offresdemploiv2`)
   - ✅ **OAuth 2.0 Connect** (`o2dsoffre`)
5. Valider → récupérer `client_id` + `client_secret` (le secret n'est visible qu'une fois)

## 3. Configurer Railway (worker)

1. Railway project → **Variables** :
   - `FRANCE_TRAVAIL_CLIENT_ID` = `<id>`
   - `FRANCE_TRAVAIL_CLIENT_SECRET` = `<secret>` (marquer **Sensitive**)
2. Les autres vars (`FRANCE_TRAVAIL_SCOPE`, `_BASE_URL`, `_AUTH_URL`) ont des défauts OK.
3. Redéployer.

Sans ces vars → le job log warn + retourne `{ count: 0, mock: true }`. Boot OK en dev/CI.

## 4. Tester en local

```bash
# .env.local
FRANCE_TRAVAIL_CLIENT_ID=...
FRANCE_TRAVAIL_CLIENT_SECRET=...
REDIS_URL=rediss://...

pnpm --filter @swipejob/worker dev
# Le cron `*/30 * * * *` est enregistré automatiquement au boot.
# Pour déclencher manuellement :
# Via Bull Board (V2) ou directement dans Redis CLI.
```

## 5. Monitoring

- **Dashboard France Travail** → **Statistiques** : usage quotidien, erreurs
- **Sentry** : alerte automatique si l'API est down >15 min (NFR-I1, géré dans le code)
- **Métriques worker `/metrics`** : `swipejob_queue_jobs{queue="offer-ingest"}` exposé en Prometheus
- **DB** : `SELECT name, last_sync_at FROM offer_sources WHERE name='france-travail';`

## 6. Quotas & rate limits

- **200 req/min** ; le code respecte via backoff exponentiel sur 429
- **150 offres / page** (limite API) — la pagination est automatique jusqu'à 5000 offres/run
- **30 min de cron** → suffisant pour rester sous quota

## 7. Pannes connues

| Erreur                  | Cause probable             | Action                                                                            |
| ----------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| `401 invalid_token`     | Token expiré non rafraîchi | Auto-refresh dans `auth.ts` ; si répété, vérifier `client_secret`                 |
| `403 Forbidden`         | Scope manquant             | Vérifier que l'app a les scopes `api_offresdemploiv2 o2dsoffre` dans le dashboard |
| `429 Too Many Requests` | Quota dépassé              | Backoff auto. Si persiste, espacer le cron à 60 min                               |
| `500-504`               | Indispo France Travail     | Auto-retry 3× ; Sentry alert si pas de succès >15 min                             |

## 8. Rotation des secrets

- API key : pas d'expiration imposée. Politique interne : rotation tous les 6 mois
- Procédure : créer une 2ème app France Travail → ajouter nouvelles vars Railway → redéployer → supprimer ancienne app

## 9. Logs structurés

Tous les events ingestion sont loggés via Pino :

- `France Travail fetch complete` : `{ fetched, alternance, stage }`
- `France Travail ingest complete` : `{ inserted, durationMs, sourceId }`
- `France Travail ingest failed` : `{ err, sinceLastSuccessMs }`

Stream Axiom dataset `swipejob-worker`.
