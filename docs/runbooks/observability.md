# Runbook — Observability

Story 1.2 (TECH-006). Stack : Sentry + Posthog Cloud EU + Axiom + Vercel Analytics.

## Dashboards

| Service                            | URL                                                  | Usage                                                            |
| ---------------------------------- | ---------------------------------------------------- | ---------------------------------------------------------------- |
| Sentry — errors web + worker       | `https://<org>.sentry.io/issues/?project=<id>`       | erreurs runtime, stack traces, distributed tracing               |
| Posthog Cloud EU — analytics       | `https://eu.i.posthog.com/project/<id>`              | events produit, funnels, A/B, feature flags                      |
| Axiom — logs structurés            | `https://app.axiom.co/<org>/datasets`                | 3 datasets : `swipejob-web`, `swipejob-worker`, `swipejob-audit` |
| Vercel Analytics — Core Web Vitals | `https://vercel.com/<team>/<project>/analytics`      | FCP/LCP/INP/CLS/TTFB (cookie-less)                               |
| Vercel Speed Insights              | `https://vercel.com/<team>/<project>/speed-insights` | real-user perf per page                                          |

Renseigner les URLs réelles après création des projets.

## Activation env vars (cf. `.env.example`)

- Sentry serveur : `SENTRY_DSN`
- Sentry client : `NEXT_PUBLIC_SENTRY_DSN` (peut être égal au DSN serveur)
- Sentry build (source maps + release) : `SENTRY_AUTH_TOKEN` + `SENTRY_ORG` + `SENTRY_PROJECT`
- Posthog client : `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`
- Posthog serveur : `POSTHOG_API_KEY` + `POSTHOG_DISTINCT_ID_SALT` (≥16 chars, différent par env)
- Axiom : `AXIOM_TOKEN` + datasets `AXIOM_DATASET_WEB`, `AXIOM_DATASET_WORKER`, `AXIOM_DATASET_AUDIT`

**Toutes les vars sont optionnelles** : code skip silencieusement si absentes (log warn en dev, throw en prod via `lib/env.ts`).

## Validation manuelle

### Sentry

1. Set `SENTRY_DSN` dans `.env.local`.
2. Lancer `pnpm dev`.
3. Visiter `http://localhost:3000/api/sentry-test` → throw volontaire.
4. Vérifier l'apparition de l'erreur dans le dashboard Sentry (filter `environment:development`).
5. La route renvoie `404` en `VERCEL_ENV=production`.

### Posthog

1. Set `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com`.
2. Lancer `pnpm dev` + visiter `/`.
3. Vérifier dans Posthog → "Activity" : event manuel (V1, autocapture est désactivé, donc capture explicite requise depuis le code).
4. Bootstrap event `app.bootstrap` sera ajouté en Story 1.3 (besoin d'un `userId` stable).

### Axiom

1. Set `AXIOM_TOKEN` + datasets dans `.env.local`.
2. Lancer `NODE_ENV=production pnpm --filter @swipejob/worker dev` (le transport Axiom n'est actif qu'en prod).
3. Vérifier dataset `swipejob-worker` reçoit les logs Pino JSON.
4. Tail : `axiom query 'swipejob-worker | limit 20'`.

## Conformité RGPD

- **Vercel Analytics** : cookie-less par design → pas de bandeau requis.
- **Posthog** : configuré `person_profiles: 'identified_only'` + `autocapture: false` → pas de profil créé sans appel `identify()` explicite.
- **Distinct ID Posthog** : HMAC-SHA256 du `userId` (jamais d'email ou nom en clair) via `lib/analytics.ts#hashUserId`.
- **Logs Axiom** : `redact` Pino sur `email`, `password`, `cvText`, `firstName`, `lastName`, `req.headers.cookie/authorization`. Helper `redactPII()` dans `@swipejob/types/pii`.
- **Rétention** : `swipejob-web` et `swipejob-worker` = 30j (NFR-O5). `swipejob-audit` = 13 mois (NFR-O5 + CNIL).
- **Sentry** : `beforeSend` strip cookies, authorization headers, password, email.

## Incident playbook

1. **Alerte** : Sentry envoie email/Slack sur nouvelle issue critique (config dans Sentry UI).
2. **Triage** : ouvrir l'issue dans Sentry, copier le `traceId` (header `x-trace-id`).
3. **Logs corrélés** : Axiom dataset `swipejob-web` ou `swipejob-worker`, filter `traceId: "<id>"`.
4. **Métriques produit** : si l'incident impacte UX → Posthog funnel sur la page concernée.
5. **Core Web Vitals** : Vercel Analytics → vérifier LCP/INP sur la PR / route impactée.
