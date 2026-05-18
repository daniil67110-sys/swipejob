# Runbook — Adzuna API (source secondaire)

Story de référence : 2.3 (intégration source secondaire)

## 1. Créer un compte développeur

1. Aller sur https://developer.adzuna.com
2. **Sign Up** → créer un compte (email équipe `equipe@swipejob.fr`)
3. Validation immédiate (pas de manuelle requise)

## 2. Créer une application

1. Dashboard → **My Apps** → **Create a new App**
2. Nom : `swipejob-prod` (ou `-preview`)
3. Type : **API Access**
4. Récupérer `app_id` (court, public) + `app_key` (long, **sensitive**)

## 3. Configurer Railway (worker)

- `ADZUNA_APP_ID` (Production + Preview)
- `ADZUNA_APP_KEY` (Production + Preview, **Sensitive**)
- `ADZUNA_BASE_URL` (default `https://api.adzuna.com/v1/api/jobs/fr` — OK)

Sans ces vars → mode mock, scraper retourne `{ count: 0, mock: true }`.

## 4. Tester en local

```bash
# .env.local
ADZUNA_APP_ID=...
ADZUNA_APP_KEY=...
REDIS_URL=rediss://...

pnpm --filter @swipejob/worker dev
# Le cron `15,45 * * * *` (toutes les 30 min décalé) est enregistré au boot.
```

Test direct depuis le shell :

```bash
curl "https://api.adzuna.com/v1/api/jobs/fr/search/1?app_id=$ADZUNA_APP_ID&app_key=$ADZUNA_APP_KEY&what=stage&results_per_page=5" | jq
```

## 5. Quotas Free Tier

- ~250 requêtes/jour (free tier)
- ~25 req/sec rate limit
- Notre cron fait 2×100 pages = 200 req/run, donc ~10-15 runs/jour max sans dépasser
- Si on touche le quota régulièrement → passer en plan payant ou réduire le cron à 1×/heure

## 6. Détection contractType

L'API Adzuna **ne distingue pas stage/alternance**. Le mapper infère par regex sur title + description :

- `/altern|apprent/i` → `alternance`
- `/\bstage\b|stagiaire/i` → `stage`
- Autre → ignoré (CDI/CDD hors scope V1)

Risque faux positifs (ex: "Stagiaire en CDI" → stage). Story 2.4 (normalisation) raffinera.

## 7. Salaire annuel → mensuel

Adzuna retourne `salary_min` / `salary_max` en EUR annuel. Le mapper divise par 12.
Si `salary_is_predicted = '1'` (estimation Adzuna, pas le recruteur), salaire ignoré.

## 8. Pannes connues

| Erreur  | Cause                 | Action                                         |
| ------- | --------------------- | ---------------------------------------------- |
| 401     | app_key invalide      | Vérifier secret Railway                        |
| 403     | Quota dépassé         | Passer en payant ou attendre le reset 24h      |
| 429     | Rate limit instantané | Backoff exponentiel auto                       |
| 500-504 | Adzuna down           | Retry 3× ; alert Sentry si >15 min sans succès |

## 9. ToS

- Adzuna autorise l'agrégation et l'affichage des offres avec mention de la source
- Lien `redirect_url` pointe vers la page Adzuna originale — à respecter pour conformité ToS
- Pas de revente directe sans transformation/valeur ajoutée → OK pour SwipeJob (matching IA, swipe UX = valeur ajoutée évidente)

Source ToS : https://developer.adzuna.com/info
