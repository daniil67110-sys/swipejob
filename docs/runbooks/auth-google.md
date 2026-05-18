# Runbook — Auth.js v5 + Google OAuth

Story 1.3 (TECH-003). Procédure complète de configuration de l'authentification Google.

## Vue d'ensemble

- **Provider** : Google OAuth 2.0 / OpenID Connect.
- **Scopes minimaux** : `openid email profile` uniquement (RGPD : minimisation).
- **Sessions** : database (table `sessions` cuid2, révocation immédiate RGPD).
- **MaxAge** : 30 jours (NFR-S6).
- **Cookie** : `__Secure-authjs.session-token` (prod) / `authjs.session-token` (dev), HttpOnly + SameSite=Lax + Secure (prod).
- **Mode dégradé** : si `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`/`AUTH_SECRET`/`DATABASE_URL` absents → `/inscription` affiche un placeholder FR au lieu du bouton, `pnpm dev` boot OK.

## 1. Création du projet Google Cloud

1. <https://console.cloud.google.com/> → Create Project → nommer `SwipeJob`.
2. APIs & Services → OAuth consent screen :
   - Type d'utilisateur : **External** (interne uniquement si Google Workspace dédié).
   - Informations app : nom `SwipeJob`, email support, logo (optionnel V1).
   - Scopes : ajouter `.../auth/userinfo.email` + `.../auth/userinfo.profile` + `openid` (les 3 minimaux). **Ne PAS demander Drive, Calendar, Gmail.**
   - Domaines autorisés : `swipejob.fr` (prod), `vercel.app` (preview).
   - Status : publier en "Production" (Google review 1-3 jours).

## 2. Création de l'OAuth Client

1. APIs & Services → Credentials → Create Credentials → OAuth Client ID.
2. Type : **Web application**.
3. **Authorized JavaScript origins** :
   - `http://localhost:3000` (dev)
   - `https://swipejob-web-*.vercel.app` (preview)
   - `https://www.swipejob.fr` (prod)
4. **Authorized redirect URIs** :
   - `http://localhost:3000/api/auth/callback/google` (dev)
   - `https://swipejob-web-*.vercel.app/api/auth/callback/google` (preview)
   - `https://www.swipejob.fr/api/auth/callback/google` (prod)
5. Récupérer **Client ID** + **Client Secret**.

## 3. Variables d'environnement

### Local (`.env.local`)

```env
AUTH_SECRET=<générer via `openssl rand -base64 32` ou https://generate-secret.vercel.app/32>
AUTH_GOOGLE_ID=<Client ID Google>
AUTH_GOOGLE_SECRET=<Client Secret Google>
AUTH_URL=http://localhost:3000          # optionnel en dev
AUTH_TRUST_HOST=true                    # défaut OK
```

### Vercel (Preview + Production séparés)

Dashboard Vercel → Project → Settings → Environment Variables :

| Variable             | Production                 | Preview                             | Dev     |
| -------------------- | -------------------------- | ----------------------------------- | ------- |
| `AUTH_SECRET`        | random 32 chars **unique** | random 32 chars **unique**          | local   |
| `AUTH_GOOGLE_ID`     | OAuth Client ID prod       | idem (même projet OK)               | idem    |
| `AUTH_GOOGLE_SECRET` | OAuth Client Secret prod   | idem                                | idem    |
| `AUTH_URL`           | `https://www.swipejob.fr`  | `https://swipejob-web-*.vercel.app` | non set |
| `AUTH_TRUST_HOST`    | `true` (Vercel)            | `true`                              | `true`  |

**Critique** : `AUTH_SECRET` doit être **différent** entre prod et preview (sécurité : empêche un attaquant qui obtient le secret preview de forger des sessions prod).

## 4. Validation manuelle

### Local

1. `pnpm install` + `pnpm dev`.
2. Visiter `http://localhost:3000/inscription` → le bouton "Continuer avec Google" doit être visible.
3. Cliquer → popup Google OAuth s'ouvre avec scopes `email`+`profile`.
4. Consentir → redirect vers `http://localhost:3000/post-signup` → `/etape-1-cv` (premier signup) ou `/deck`.
5. Vérifier dans Drizzle Studio (`pnpm db:studio`) :
   - 1 row dans `users` avec `email`, `email_verified_at`, `source=GOOGLE`, `role=USER`, `consent_status=PENDING`.
   - 1 row dans `accounts` avec `provider=google`, `provider_account_id`, tokens.
   - 1 row dans `sessions` avec `session_token` cuid2, `user_id`, `expires` à +30j.
   - 1 row dans `audit_logs` avec `event=auth.signup`, `actor_type=USER`, `metadata={method:'google'}`.
6. Vérifier dashboard Posthog EU : event `user.signup` avec `distinctId` hashé.

### Vercel preview

1. PR ouverte → Vercel build preview.
2. Visiter `https://swipejob-web-pr-<n>-*.vercel.app/inscription`.
3. Reproduire les étapes locales (le redirect URI Google doit matcher).

## 5. Conformité RGPD

- **Scopes minimaux** : `openid email profile` uniquement. Aucune permission Drive/Calendar/Gmail.
- **Sessions DB** (pas JWT) : permet la révocation immédiate sur demande utilisateur (architecture.md ligne 312).
- **Audit log** : chaque signup/login enregistré dans `audit_logs` (rétention 13 mois via export R2 Story 1.2).
- **Analytics anonymisés** : Posthog reçoit un `distinctId` hashé (HMAC-SHA256 + salt). Aucun email/nom en clair (Story 1.2 `redactPII()`).
- **Cookie HttpOnly** : impossible à lire en JavaScript (XSS-proof).
- **MaxAge 30j** : conforme NFR-S6 (invalidation 30j inactivité).

## 6. Erreurs courantes

| Erreur                  | Cause                                    | Fix                                                  |
| ----------------------- | ---------------------------------------- | ---------------------------------------------------- |
| `redirect_uri_mismatch` | URL callback non whitelistée             | Ajouter dans Google Cloud Console Credentials        |
| `invalid_client`        | `AUTH_GOOGLE_ID/SECRET` incorrects       | Re-copier depuis Google Cloud                        |
| `AccessDenied`          | User a refusé dans popup                 | Message FR affiché sur `/inscription`                |
| `Configuration`         | `AUTH_SECRET` manquant ou < 32 chars     | Générer + setter en env                              |
| OAuth funnel infini     | `AUTH_URL` ne matche pas le domaine réel | Set/unset `AUTH_URL` selon env (Vercel auto-détecte) |

## 7. Logs et debug

- **Sentry** : capture les erreurs auth via `lib/with-error-handler.ts` (Story 1.3).
- **Pino + Axiom** : `lib/auth.ts` log `auth.oauth.error` côté serveur sur tout signIn rejected.
- **Audit logs** : query `SELECT * FROM audit_logs WHERE event LIKE 'auth.%' ORDER BY created_at DESC LIMIT 10` pour le dernier flow.
