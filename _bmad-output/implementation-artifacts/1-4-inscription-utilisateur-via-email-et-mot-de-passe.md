# Story 1.4: Inscription utilisateur via email et mot de passe

Status: done

## Story

As a **étudiant qui préfère ne pas lier Google**,
I want **m'inscrire avec mon email et un mot de passe sur `/inscription/email`, recevoir un lien magique de validation via Resend, valider mon email en cliquant, puis être connecté automatiquement et redirigé vers l'onboarding**,
So that **je peux utiliser SwipeJob sans dépendre d'un fournisseur OAuth tiers, mon mot de passe est hashé avec argon2id (NFR-Se1 OWASP 2025), un rate limit 5/h/IP empêche les abus (NFR-S5), et toutes les étapes (signup, email_verified, login, login_failed) sont auditées RGPD + tracées Posthog**.

## Acceptance Criteria

1. **AC1 — Schéma `users.passwordHash` + dependency `argon2`**
   - **Given** le schéma `users` de Story 1.2.5 (sans password),
   - **When** Story 1.4 ajoute le support credentials,
   - **Then** une colonne `password_hash text NULL` est ajoutée à `users` via migration Drizzle (`pnpm db:generate` puis migration manuelle nommée `0002_add_password_hash.sql`).
   - La colonne est `NULL` pour les users OAuth-only (Google) — cela permet de cohabiter OAuth + Credentials sur le même compte (NFR-Se4).
   - Le package `argon2 ^0.41` est installé dans `apps/web` (`pnpm --filter @swipejob/web add argon2`). Paramètres : `type: argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1` (recommandation OWASP 2025).
   - Helper `hashPassword(plain: string): Promise<string>` + `verifyPassword(hash: string, plain: string): Promise<boolean>` créés dans `apps/web/lib/password.ts` (server-only).
   - `argon2` est un module natif Node — `apps/web/next.config.ts` ajoute `serverExternalPackages: ['argon2']` pour empêcher webpack de bundler le binaire `.node`.

2. **AC2 — Page `/inscription/email` (formulaire signup)**
   - **Given** un visiteur non authentifié,
   - **When** il arrive sur `/inscription/email`,
   - **Then** un formulaire `<EmailSignupForm>` (client component, RHF + Zod) affiche :
     - Input `email` (type=email, autoComplete=email, label "Email", placeholder "ton.email@exemple.fr")
     - Input `password` (type=password, autoComplete=new-password, label "Mot de passe", helper text "≥10 caractères, mélange lettres et chiffres")
     - Bouton submit "Créer mon compte" (touch target ≥44px, disabled si form invalide ou pending)
     - Lien "J'ai déjà un compte" → `/connexion`
     - Lien retour "← Inscription avec Google" → `/inscription`
   - Validation Zod côté client (live, debounced 300ms) : `email: z.string().email()`, `password: z.string().min(10).regex(/[a-zA-Z]/).regex(/[0-9]/)`.
   - Messages d'erreur FR bienveillants (UX-DR27) sous chaque champ.
   - Aria-live="polite" sur la zone d'erreurs serveur (a11y NFR-A6).
   - Page créée dans `app/(auth)/inscription/email/page.tsx` (server component qui rend le client component). Si l'utilisateur est déjà authentifié → `redirect('/deck')`.

3. **AC3 — Server Action `signupWithEmailAction`**
   - **Given** un visiteur soumet le formulaire signup avec email + password valides,
   - **When** la Server Action `signupWithEmailAction` (dans `apps/web/app/(auth)/inscription/email/actions.ts`) s'exécute,
   - **Then** elle effectue :
     1. **Rate limit** (cf. AC8) : 5 tentatives par heure par IP. Si dépassé → `ActionResult<never>` avec `error.code = 'RATE_LIMITED'`, message FR + headers `Retry-After`.
     2. **Validation Zod serveur** (re-parse, jamais confiance au client).
     3. **Vérification email unique** : `SELECT 1 FROM users WHERE email = $1 LIMIT 1`. Si existe ET `email_verified_at IS NOT NULL` → message FR neutre "Si un compte existe avec cet email, tu vas recevoir un lien de validation" (anti-enum, NFR-Se9). Si existe ET non vérifié → renvoyer un nouveau lien (cf. AC4).
     4. **Hash password** : `passwordHash = await hashPassword(password)`.
     5. **Insert user** : `INSERT INTO users (email, password_hash, source) VALUES ($1, $2, 'EMAIL') ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash WHERE users.email_verified_at IS NULL RETURNING id, email`. Le `ON CONFLICT` gère le cas où l'utilisateur retente avant validation (pas de doublon, on rafraîchit juste le hash).
     6. **Génère token verification** : `tokenPlain = crypto.randomBytes(32).toString('base64url')`, `tokenHash = sha256(tokenPlain)`. Insert dans `verification_tokens` : `{ identifier: email, token: tokenHash, expires: now + 24h }`. **Stocker le hash, jamais le plain** (NFR-Se3 défense vol DB).
     7. **Email Resend** (cf. AC5) avec lien `${SITE_URL}/inscription/valider-email?token=${tokenPlain}` (le plain dans l'URL, le hash en DB).
     8. **Posthog `user.signup_pending_verification`** : `properties = { method: 'email' }`, distinctId = `hashUserId(user.id)`.
     9. **Audit log `auth.signup`** : event `auth.signup`, actor user.id, metadata `{ method: 'email', verified: false }` via `auditLog()`.
     10. **Retourne** `ActionResult<{ message: string }>` avec message FR "Email envoyé ! Vérifie ta boîte (et tes spams), le lien est valide 24h.".
   - Si étape 4-9 échoue après insert user partiel → log + Sentry capture + message FR recoverable. **Pas de rollback transactionnel global** : user partiellement créé peut retenter (idempotent via ON CONFLICT).

4. **AC4 — Page `/inscription/valider-email?token=xxx`**
   - **Given** un user clique le lien magique reçu par email,
   - **When** la page `app/(auth)/inscription/valider-email/page.tsx` (server component) charge avec un query `?token=`,
   - **Then** elle exécute :
     1. **Lookup** : `tokenHash = sha256(token)` puis `SELECT identifier, expires FROM verification_tokens WHERE token = $1`.
     2. Si non trouvé → page d'erreur FR "Lien invalide ou déjà utilisé. Reviens sur /inscription/email pour recevoir un nouveau lien.".
     3. Si `expires < now` → DELETE token + page d'erreur FR "Lien expiré (24h max). Reviens sur /inscription/email pour recevoir un nouveau lien.".
     4. Si valide → `UPDATE users SET email_verified_at = NOW() WHERE email = identifier`, puis DELETE token (one-time use, NFR-Se).
     5. **Création session manuelle** (Credentials provider Auth.js v5 ne supporte pas database sessions out-of-the-box pour les magic links) :
        - `sessionToken = createId()` (cuid2)
        - `INSERT INTO sessions (session_token, user_id, expires) VALUES ($1, $2, now() + interval '30 days')`
        - Cookie set : `__Secure-authjs.session-token` (prod) / `authjs.session-token` (dev), `HttpOnly`, `SameSite=Lax`, `Secure` prod, `Path=/`, `maxAge=30*24*3600`.
     6. **Posthog `user.signup`** (à la place de `user.signup_pending_verification`) avec `properties.verified = true`.
     7. **Audit log `auth.email_verified`** : event `auth.email_verified`, actor user.id, metadata `{ verifiedAt: <ISO>, method: 'magic_link' }`.
     8. **Redirect** vers `/etape-1-cv` (nouveau user vient de valider, va à l'onboarding).
   - Si plusieurs tentatives concurrentes (race condition) sur la même URL → la 2e tentative trouvera le token déjà supprimé → message "déjà validé, te connecte" + redirect vers `/connexion`.

5. **AC5 — Email Resend + template HTML**
   - **Given** un signup vient d'être effectué (AC3 étape 7) ou un user demande un nouveau lien (AC3 étape 3 cas non-vérifié),
   - **When** l'email doit être envoyé,
   - **Then** `apps/web/lib/email.ts` (server-only) exporte `sendVerificationEmail({ to, verificationUrl, locale = 'fr-FR' })`.
   - Helper utilise `resend` package (`pnpm --filter @swipejob/web add resend`) : `new Resend(env.RESEND_API_KEY).emails.send({ from: env.RESEND_FROM, to, subject: 'Valide ton email SwipeJob', html: ..., text: ... })`.
   - Template HTML inline (string template ou React Email — pour V1 string template suffit) avec :
     - Header SwipeJob (logo + nom)
     - Texte FR : "Bonjour ! Clique sur ce lien pour valider ton email et accéder à SwipeJob. Lien valide 24h.", CTA bouton bleu "Valider mon email"
     - Texte de secours plein-texte (anti-spam)
     - Footer mentions : "Si tu n'as pas demandé cette inscription, ignore ce message." + lien CGU/confidentialité
   - **Mode conditionnel** : si `env.RESEND_API_KEY` absent (dev/CI), `sendVerificationEmail` log `warn` "Resend non configuré, email loggé" + log le `verificationUrl` complet + retourne `{ ok: true, mock: true }` (ne throw jamais en dev). En prod sans la clé → throw avec message clair (env validation Story 1.2 fait fail-loud via warn).
   - Domaine `from` : `noreply@swipejob.fr` (à provisionner Resend DNS, cf. runbook).

6. **AC6 — Page `/connexion` + login flow `loginWithEmailAction`**
   - **Given** un user existant avec email validé,
   - **When** il arrive sur `/connexion`,
   - **Then** la page (existante depuis Story 1.3, placeholder) est enrichie :
     - Section "Continuer avec Google" (boutton existant Story 1.3)
     - Séparateur visuel "ou"
     - Formulaire `<EmailLoginForm>` (email + password + submit "Se connecter")
     - Lien "Mot de passe oublié ?" (placeholder pour future story — pour V1 → page statique avec FAQ "contact support")
     - Lien "Pas de compte ? S'inscrire" → `/inscription`
   - Server Action `loginWithEmailAction` (dans `app/(auth)/connexion/actions.ts`) :
     1. **Rate limit** 5/min/IP sur login (plus strict que signup, NFR-S5).
     2. **Validation Zod** email + password.
     3. **Lookup user** : `SELECT id, password_hash, email_verified_at FROM users WHERE email = $1`.
     4. **Anti-enum** : si user inexistant OU password mismatch OU email_verified_at NULL → toujours retourner même message FR "Identifiants invalides ou email non validé." (jamais distinguer).
     5. **Verify password** : `await verifyPassword(passwordHash, password)` — argon2 verify (timing-safe).
     6. **Crée session** comme AC4 étape 5.
     7. **Posthog `user.login`** + audit log `auth.login` (NFR-S10 anonymisé).
     8. Si password mismatch → log `auth.login_failed` (event séparé pour anti-bruteforce monitoring). Posthog `user.login_failed` avec `properties = { method: 'email' }` (pas d'email — anti-PII).
     9. **Redirect** vers `/deck` (login = retour, pas onboarding).

7. **AC7 — Middleware + protection des routes**
   - **Given** le middleware existant de Story 1.3 protège `(app)/*` et `(onboarding)/*`,
   - **When** Story 1.4 ajoute la vérification email,
   - **Then** la garde s'enrichit : si session existe MAIS `users.email_verified_at IS NULL` (cas où le user OAuth a signé puis créé manuellement un mot de passe et le hash est en attente — improbable mais défense en profondeur), → redirect `/inscription/valider-email` avec message "Valide d'abord ton email".
   - **Implémentation pragmatique** : le check `email_verified_at` ne se fait PAS dans `middleware.ts` (Edge runtime ne peut pas accéder à la DB), mais dans `app/(app)/layout.tsx` et `app/(onboarding)/layout.tsx` (server components Node runtime) — `await auth()` puis `SELECT email_verified_at FROM users WHERE id = session.user.id` puis redirect si NULL.
   - Routes publiques inchangées : `/inscription`, `/inscription/email`, `/inscription/valider-email`, `/connexion`, `/api/auth/*` restent ouvertes.

8. **AC8 — Rate limiting Upstash Ratelimit**
   - **Given** la protection anti-abus exigée (NFR-S5),
   - **When** un endpoint signup/login/verify-email est appelé,
   - **Then** `apps/web/lib/rate-limit.ts` est créé avec `@upstash/ratelimit ^2.x` + `@upstash/redis ^1.x`.
   - 3 limiters distincts exposés :
     - `signupRateLimit` : sliding window `5 requêtes / 1 hour` keyed by IP
     - `loginRateLimit` : sliding window `5 requêtes / 1 minute` keyed by IP
     - `verifyEmailRateLimit` : sliding window `10 requêtes / 1 hour` keyed by IP
   - Helper `getClientIp(headers: Headers): string` : extrait depuis `x-forwarded-for` (premier) ou `x-real-ip`, fallback `'127.0.0.1'`.
   - **Mode conditionnel** : si `env.UPSTASH_REDIS_REST_URL` absent → les limiters retournent toujours `{ success: true, remaining: Infinity }` (boot OK en dev/CI). Warn log en prod si manquant (cf. AC10).
   - Architecture pattern : `lib/rate-limit.ts` exporte `signupRateLimit`, `loginRateLimit`, `verifyEmailRateLimit` instanciés une fois (singleton). Pas d'instanciation par requête (NFR-P).

9. **AC9 — Tests Vitest + e2e Playwright minimal**
   - **Tests unitaires Vitest** dans `apps/web/lib/__tests__/password.test.ts` :
     - `hashPassword` produit un hash argon2id valide (commence par `$argon2id$`)
     - `verifyPassword` retourne `true` pour le bon password, `false` pour un mauvais
     - Hash de la même string produit 2 hashes différents (salt aléatoire)
   - `apps/web/lib/__tests__/email.test.ts` :
     - `sendVerificationEmail` en mode mock (sans RESEND_API_KEY) retourne `{ ok: true, mock: true }` + log warn
     - Template HTML inclut le `verificationUrl`
   - **Tests e2e Playwright** dans `apps/web/e2e/auth-email.spec.ts` :
     - Flow signup happy path : visite `/inscription/email`, remplit form, submit, vérifie message "Email envoyé !"
     - Flow signup avec password trop court → erreur Zod visible
     - Flow signup avec email invalide → erreur Zod visible
     - Note : flow validation email + login complets sont **deferred** (besoin DB + Resend mock complet — D-1.4-001 documenté).

10. **AC10 — Env vars + runbook + mode conditionnel**
    - `apps/web/lib/env.ts` enrichi avec :
      ```ts
      RESEND_API_KEY: z.string().optional(),
      RESEND_FROM: z.string().email().default('noreply@swipejob.fr'),
      UPSTASH_REDIS_REST_URL: z.string().url().optional(),
      UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
      ```
    - `isEmailConfigured = Boolean(env.RESEND_API_KEY)` exporté.
    - `isRateLimitConfigured = Boolean(env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN)` exporté.
    - Warn log en prod si l'un des deux manque (pattern Story 1.2/1.3).
    - `.env.example` mis à jour avec les nouvelles vars + commentaires explicatifs.
    - Runbook créé : `docs/runbooks/email-resend.md` (étapes : créer compte Resend EU, vérifier domaine DNS swipejob.fr, créer API key, ajouter à Vercel).
    - Runbook créé : `docs/runbooks/rate-limiting-upstash.md` (créer base Upstash Redis EU Frankfurt, copier REST URL+token, ajouter à Vercel).

## Tasks / Subtasks

1. **Schéma + migration**
   - [ ] Ajouter `passwordHash: text('password_hash')` (nullable) dans `packages/db/src/schema/users.ts`
   - [ ] Générer migration `pnpm --filter @swipejob/db db:generate` → vérifier `0002_*.sql`
   - [ ] Mettre à jour `packages/db/drizzle.config.ts` si besoin (déjà liste explicite)

2. **Dependencies**
   - [ ] `pnpm --filter @swipejob/web add argon2 resend @upstash/ratelimit @upstash/redis`
   - [ ] Ajouter `argon2` dans `pnpm-workspace.yaml` `onlyBuiltDependencies`
   - [ ] `pnpm install` puis valider que `argon2` natif compile (Node 22)

3. **Lib `password.ts`**
   - [ ] Créer `apps/web/lib/password.ts` avec `hashPassword` + `verifyPassword` (params OWASP 2025)
   - [ ] Tests unitaires Vitest

4. **Lib `email.ts`**
   - [ ] Créer `apps/web/lib/email.ts` avec `sendVerificationEmail` + mode mock
   - [ ] Template HTML inline (FR, accessible, footer mentions)
   - [ ] Tests unitaires Vitest

5. **Lib `rate-limit.ts`**
   - [ ] Créer `apps/web/lib/rate-limit.ts` avec 3 limiters + helper `getClientIp`
   - [ ] Mode conditionnel (boot OK sans Upstash)

6. **Env updates**
   - [ ] `apps/web/lib/env.ts` : ajouter RESEND_*, UPSTASH_* + flags `isEmailConfigured` + `isRateLimitConfigured`
   - [ ] `.env.example` enrichi
   - [ ] `apps/web/next.config.ts` : `serverExternalPackages: ['argon2']`

7. **Page `/inscription/email`**
   - [ ] `app/(auth)/inscription/email/page.tsx` (server)
   - [ ] `app/(auth)/inscription/email/EmailSignupForm.tsx` (client RHF + Zod)
   - [ ] `app/(auth)/inscription/email/actions.ts` (`signupWithEmailAction`)
   - [ ] Lien depuis `/inscription` (Story 1.3) vers `/inscription/email` (déjà placeholder)

8. **Page `/inscription/valider-email`**
   - [ ] `app/(auth)/inscription/valider-email/page.tsx` (server) — gère token, crée session, redirect

9. **Page `/connexion` (enrichie)**
   - [ ] Ajouter section formulaire email/password dans `app/(auth)/connexion/page.tsx`
   - [ ] `app/(auth)/connexion/EmailLoginForm.tsx` (client)
   - [ ] `app/(auth)/connexion/actions.ts` (`loginWithEmailAction`)

10. **Layout protection email_verified**
    - [ ] `app/(app)/layout.tsx` : check `email_verified_at` après `auth()`
    - [ ] `app/(onboarding)/layout.tsx` : idem

11. **Tests**
    - [ ] Vitest password.test.ts + email.test.ts
    - [ ] Playwright auth-email.spec.ts (happy path signup)

12. **Runbooks**
    - [ ] `docs/runbooks/email-resend.md`
    - [ ] `docs/runbooks/rate-limiting-upstash.md`

13. **Validation finale**
    - [ ] `pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm format:check`
    - [ ] Commit + Story `done`

## Dev Notes

### Context — Story 1.3 (parent)

Story 1.3 a livré :
- Auth.js v5 + Google OAuth fonctionnel (mode conditionnel)
- Schémas `users`, `accounts`, `sessions`, `verification_tokens` en place
- `lib/auth.ts`, `lib/audit.ts`, `lib/with-error-handler.ts`, middleware avec `x-trace-id`
- Page `/inscription` (Google) + `/connexion` (placeholder)
- `/post-signup` qui décide via `users.createdAt` (PK indexé)

Story 1.4 étend ce socle avec credentials provider via flow custom (pas via Auth.js Credentials provider directement — magic link + verification token est plus sûr et déjà supporté par le schéma Auth.js).

### Argon2id paramètres (OWASP 2025)

Les paramètres recommandés OWASP pour argon2id (2025) :
- `memoryCost: 19456` (19 MiB) — équilibre mémoire/CPU pour API
- `timeCost: 2` — passes
- `parallelism: 1` — single-threaded (cohérent avec event loop Node)

Pour info, OWASP propose aussi un preset plus fort (46 MiB, t=1, p=1) — on prend le moins lourd pour ne pas saturer Vercel (256MB lambda).

Le package `argon2` (Brian White) est le binding Node natif. **Native module** → ne pas bundler webpack. → `next.config.ts` `serverExternalPackages: ['argon2']` (Next.js 15 syntax, remplace l'ancien `experimental.serverComponentsExternalPackages`).

Alternative considérée : `@node-rs/argon2` (WASM portable) — non retenue V1 car `argon2` natif est plus mature et perf supérieures.

### Token de vérification : hash en DB

Le token envoyé dans l'URL email est en **plaintext base64url** (32 bytes random). En DB on stocke `sha256(token)`. Bénéfice : si la DB est volée, l'attaquant ne peut pas réutiliser les tokens encore valides. Pattern recommandé par Auth.js docs + OWASP Token Storage Cheatsheet.

```ts
import { createHash, randomBytes } from 'node:crypto';
const tokenPlain = randomBytes(32).toString('base64url');
const tokenHash = createHash('sha256').update(tokenPlain).digest('hex');
```

### Race condition magic link

Si le user clique 2× rapidement sur le même lien (préchargement Outlook ou autre), la 2e requête arrive après que la 1ère ait DELETE le token. Le `SELECT` retourne null → message "déjà validé". On NE crée pas 2 sessions. Pattern idempotent.

### Anti-enum email existant

Lors d'un signup avec email déjà vérifié → on renvoie un message neutre (jamais "cet email est déjà pris"). C'est une exigence NFR-Se9 anti-enum email. Mais on n'envoie PAS de nouvel email (pas de spam involontaire). Le user sait, il va sur /connexion.

Pour le cas d'un email existant **non vérifié** → on rafraîchit le hash + on renvoie un nouveau lien (UX-friendly : "j'ai oublié, je retente").

### Anti-enum login

Login fail : message générique "Identifiants invalides ou email non validé" — jamais distinguer "user inexistant" vs "mauvais password" vs "email non vérifié". Sinon timing attack possible.

Pour timing : `verifyPassword` est appelé même si user n'existe pas (compare contre un hash dummy). Sinon timing différent révèle l'existence.

```ts
const DUMMY_HASH = '$argon2id$v=19$m=19456,t=2,p=1$ZHVtbXlzYWx0$ZHVtbXloYXNo';
const passwordHash = user?.passwordHash ?? DUMMY_HASH;
await verifyPassword(passwordHash, password); // toujours appelé
```

### Création session manuelle (Auth.js v5)

Auth.js v5 Credentials provider ne supporte PAS les database sessions de manière native (limitation connue — voir https://authjs.dev/getting-started/authentication/credentials). Pour notre flow magic-link (qui n'utilise pas Credentials provider directement), on crée la session manuellement :

```ts
import { cookies } from 'next/headers';
import { createId } from '@swipejob/db/lib/id';

const sessionToken = createId();
const expires = new Date(Date.now() + 30 * 24 * 3600 * 1000);
await db.insert(sessions).values({ sessionToken, userId, expires });

const cookieStore = await cookies();
cookieStore.set({
  name: process.env.NODE_ENV === 'production'
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token',
  value: sessionToken,
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  expires,
});
```

Auth.js lit ce cookie automatiquement via DrizzleAdapter `getSessionAndUser`. **Aucun changement de `lib/auth.ts` requis** — c'est compatible.

### Rate limit IP — header trust

`x-forwarded-for` n'est fiable que derrière un proxy de confiance (Vercel). En dev local, le header peut être manipulé par le client. Acceptable risk V1 (rate limit best-effort). Pour V2 : intégrer Cloudflare en amont + utiliser `cf-connecting-ip`.

```ts
function getClientIp(headers: Headers): string {
  const xff = headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0]!.trim();
  return headers.get('x-real-ip') ?? '127.0.0.1';
}
```

### ActionResult type pattern

Existant depuis Story 1.3, à utiliser :
```ts
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fieldErrors?: Record<string, string[]> } };
```

### Architecture sources

- `_bmad-output/planning-artifacts/architecture.md` ligne 311 : Auth.js v5 + Credentials providers
- ligne 313 : argon2id hashing (NFR-Se1)
- ligne 316 : Upstash Ratelimit sliding window
- ligne 370 : Resend EU SES
- ligne 793 : webhooks Resend (out of scope V1 — V2 pour bounces)
- ligne 803 : Server Actions `(app)/actions/*` pattern
- `epics.md` ligne 475-491 : AC source

## Change Log

- 2026-05-18 : Story créée à partir de epics.md L475-491 + architecture.md. Status: ready-for-dev.
- 2026-05-18 : Implémentation complète (10 ACs). Migration `0001_add_password_hash`, libs `password.ts`/`email.ts`/`rate-limit.ts`/`session.ts`, pages `/inscription/email` + `/inscription/valider-email` + `/mot-de-passe-oublie` + `/connexion` enrichie, helper `requireVerifiedAuth`. Tests Vitest 13 pass, lint/typecheck/build/format OK.
- 2026-05-18 : Self-review (Opus 4.7 — Sonnet 4.6 non disponible) — 2 patches appliqués :
  - **F-A (Medium)** Magic-link idempotent : si `users.emailVerified` est déjà set, ne pas re-fire `user.signup` Posthog ni écraser le timestamp. Le replay émet `user.login` avec `method: 'magic_link_replay'` et redirige `/deck`. Évite la pollution analytics sur double-clic / prefetch Outlook.
  - **F-B (Medium)** Anti-enum timing : pré-hash le password AVANT le lookup user dans `signupWithEmailAction`. argon2id ~100ms domine le coût et égalise le timing entre les 3 branches (nouveau / existant non-vérifié / existant vérifié), réduisant la fuite d'info "email existe-t-il". Ajout également d'un audit log `auth.signup_attempt_existing_verified` pour monitoring abus.
- 2026-05-18 : Status `done` + commit.
