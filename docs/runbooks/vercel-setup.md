# Runbook — Vercel preview deployments setup

Story 1.2 (TECH-010). Préparation d'apps/web pour Vercel avec preview deploys par PR.

## Pré-requis

- Repo GitHub poussé (branche `main` créée).
- Compte Vercel avec Team `swipejob` (Pro plan recommandé pour le multi-env preview/production).

## Procédure d'import

1. `vercel.com/new` → Import Git Repository → choisir le repo `swipejob`.
2. **Framework Preset** : Next.js (auto-détecté).
3. **Root Directory** : `apps/web`.
4. **Build Command** : `cd ../.. && pnpm turbo build --filter=@swipejob/web` (déjà dans `apps/web/vercel.json`).
5. **Install Command** : `cd ../.. && pnpm install --frozen-lockfile` (déjà dans `apps/web/vercel.json`).
6. **Output Directory** : `.next` (défaut).
7. **Region** : Paris (`cdg1`) — défini dans `vercel.json`.

## Environment Variables (à créer dans Vercel UI)

Séparer **Production**, **Preview**, **Development**. Les DSN Sentry et tokens Axiom doivent être **différents** par environnement pour ne pas mélanger les métriques.

### Production + Preview

| Variable                   | Valeur                                                                      | Scope     |
| -------------------------- | --------------------------------------------------------------------------- | --------- |
| `SITE_URL`                 | `https://www.swipejob.fr` (prod) / `https://preview-*.vercel.app` (preview) | per-env   |
| `SENTRY_DSN`               | depuis Sentry → Settings → Project → Client Keys                            | per-env   |
| `NEXT_PUBLIC_SENTRY_DSN`   | idem (peut être identique au DSN serveur)                                   | per-env   |
| `SENTRY_AUTH_TOKEN`        | depuis Sentry → Settings → Account → Auth Tokens (scope `project:releases`) | all-envs  |
| `SENTRY_ORG`               | slug org Sentry                                                             | all-envs  |
| `SENTRY_PROJECT`           | slug projet Sentry                                                          | all-envs  |
| `NEXT_PUBLIC_POSTHOG_KEY`  | depuis Posthog → Project Settings → Project API Key                         | per-env   |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://eu.i.posthog.com`                                                  | all-envs  |
| `POSTHOG_API_KEY`          | depuis Posthog → Personal API Keys                                          | per-env   |
| `POSTHOG_DISTINCT_ID_SALT` | random ≥32 chars, **différent prod/preview**                                | per-env   |
| `AXIOM_TOKEN`              | depuis Axiom → Settings → API Tokens (ingest only)                          | per-env   |
| `AXIOM_DATASET_WEB`        | `swipejob-web-prod` / `swipejob-web-preview`                                | per-env   |
| `AXIOM_DATASET_AUDIT`      | `swipejob-audit` (partagé prod uniquement)                                  | prod only |

Ne **JAMAIS** stocker secrets en clair dans le code ou les commits. Utiliser uniquement la UI Vercel ou `vercel env add` CLI.

## Git Integration

- **Production Branch** : `main`.
- **Auto-Production** : ON sur `main` uniquement.
- **Preview Deployments** : tous les push hors `main` + toutes les PR.
- **Comments** : bot Vercel commente chaque PR avec preview URL + Lighthouse.

## Validation post-setup

1. Ouvrir une PR draft "test: verify Vercel preview".
2. Vérifier que :
   - Vercel build démarre dans les 30s.
   - Bot Vercel poste un commentaire avec preview URL.
   - L'URL `https://swipejob-web-pr-<n>-<team>.vercel.app/api/health` retourne `{status:'ok', commit:<sha>, env:'preview'}`.
   - Sentry reçoit une issue test si on visite `/api/sentry-test`.
   - Posthog reçoit l'event de bootstrap (Story 1.3+).
3. Vercel Analytics affiche les Core Web Vitals dans les 5 min suivant la première visite.

## Build secrets manquants (PR depuis fork)

Le code de Story 1.2 wrap `withSentryConfig` conditionnellement (cf. `apps/web/next.config.ts`). Si `SENTRY_AUTH_TOKEN`/`SENTRY_ORG`/`SENTRY_PROJECT` sont absents, le build skip l'upload source maps + release tracking, le build PASS sans erreur. Permet le merge de PR externes sans secret leak.
