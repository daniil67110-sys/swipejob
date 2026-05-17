# Story 1.2.5: Setup Neon + Drizzle + schémas initiaux (TECH-002)

Status: done

<!--
Story insérée hors-séquence (non listée dans `epics.md`) le 2026-05-17 pour combler
le gap planning identifié au démarrage de Story 1.3 : architecture.md ligne 398
exige TECH-002 (DB schema) **avant** TECH-003 (Auth.js). Le sprint sautait
directement de 1.2 (observability) à 1.3 (OAuth Google) qui présuppose les tables
`users`, `sessions`, `accounts`, `audit_logs`. Cette story 1.2.5 est la résolution.
Source: bmad-create-story du 2026-05-17, conversation avec Danii.
-->

## Story

As a **équipe technique SwipeJob**,
I want **disposer d'une base Postgres Neon EU (avec pgvector activé) connectée via Drizzle ORM 0.41+, des schémas initiaux pour l'authentification (`users`, `accounts`, `sessions`, `verification_tokens`) + profile minimal + traçabilité RGPD/IA Act (`audit_logs`, `ia_audit_logs`), un workflow `drizzle-kit` migrations + push + studio, un script seed dev, et un client `db` réel exposé via `@swipejob/db`**,
So that **la Story 1.3 (OAuth Google) et toutes les stories suivantes manipulant des données peuvent s'appuyer sur une couche persistance fonctionnelle, type-safe, conforme aux conventions naming DB (snake_case pluriel) et NFR-Se (cuid2 IDs, pas d'auto-increment énumérable)**.

## Acceptance Criteria

1. **AC1 — Drizzle ORM 0.41+ installé et configuré**
   - **Given** le package `@swipejob/db` actuellement avec un stub `Proxy` (Story 1.1),
   - **When** la story est implémentée,
   - **Then** `packages/db/package.json` déclare `drizzle-orm ^0.41`, `drizzle-kit ^0.30` (devDep), `postgres ^3.4`, `@paralleldrive/cuid2 ^2.2`.
   - `packages/db/drizzle.config.ts` créé avec `schema: './src/schema/*.ts'`, `out: './src/migrations'`, `dialect: 'postgresql'`, `dbCredentials.url: env.DATABASE_URL`, `casing: 'snake_case'` (drizzle-kit ≥0.30 fait le mapping snake_case automatique).
   - `packages/db/src/lib/env.ts` créé : validation Zod `DATABASE_URL` optionnelle en dev (pour permettre le boot sans Postgres local), **required en prod** (fail-loud).

2. **AC2 — Schémas Auth.js v5 (`users`, `accounts`, `sessions`, `verification_tokens`)**
   - **Given** Auth.js v5 utilisera le Drizzle adapter en Story 1.3,
   - **When** les schémas sont créés,
   - **Then** 4 fichiers schémas Drizzle créés dans `packages/db/src/schema/` :
     - `users.ts` : `id` (cuid2), `email` (unique, not null), `email_verified_at` (timestamptz null), `name` (text null), `image` (text null), `locale` (text default `'fr-FR'`), `role` (enum `user_role` : `user`, `admin`), `source` (enum `auth_source` : `google`, `email`, `apple`), `birth_date` (date null), `consent_status` (enum `consent_status` : `pending`, `granted`, `pending_parental_consent`, `refused`), `created_at`, `updated_at`, `deleted_at` (soft delete null).
     - `accounts.ts` : `id` (cuid2), `user_id` (fk users.id cascade), `provider` (text), `provider_account_id` (text), `type` (text — `oauth`/`credentials`), `refresh_token` (text null), `access_token` (text null), `expires_at` (bigint null), `token_type`, `scope`, `id_token`, `session_state`. Index unique `(provider, provider_account_id)`.
     - `sessions.ts` : `id` (cuid2 — utilisé comme session token), `user_id` (fk users.id cascade), `expires_at` (timestamptz not null), `created_at`, `last_seen_at`. Index `user_id`.
     - `verification_tokens.ts` : `identifier` (text — email), `token` (text — hash signé), `expires_at` (timestamptz not null). Primary key composite `(identifier, token)`.
   - Tous les schémas suivent les conventions architecture.md lignes 411-420 : tables `snake_case` pluriel, colonnes `snake_case`, FKs `<table_singulier>_id`, index `idx_<table>_<col>`.
   - Tous les IDs sont `cuid2` via helper `packages/db/src/lib/id.ts` (`createId()` wrapper de `@paralleldrive/cuid2`).
   - **Compatibilité Auth.js v5 Drizzle adapter** : structure conforme au schéma attendu par `@auth/drizzle-adapter` (nom des colonnes, types, contraintes). Vérifié sur la doc Auth.js v5.

3. **AC3 — Schéma `profiles` minimal**
   - `packages/db/src/schema/profiles.ts` créé avec : `id` (cuid2), `user_id` (fk users.id cascade, unique), `first_name` (text null), `last_name` (text null), `phone` (text null), `city` (text null), `bio` (text null), `created_at`, `updated_at`.
   - Les champs métier détaillés (école, expériences, compétences, etc.) seront ajoutés Story 1.9 (parsing CV) — schéma minimal pour permettre Story 1.3 onboarding redirect.

4. **AC4 — Schéma `audit_logs` (RGPD append-only)**
   - `packages/db/src/schema/audit-logs.ts` créé avec : `id` (cuid2), `actor_id` (fk users.id null, pour events système), `actor_type` (enum `actor_type` : `user`, `system`, `admin`), `event` (text — ex: `auth.signup`, `auth.login`, `profile.cv_uploaded`), `target_type` (text null — ex: `user`, `cv`, `application`), `target_id` (text null), `metadata` (jsonb — ne contient JAMAIS de PII en clair, utiliser `redactPII()` de `@swipejob/types`), `ip_address` (inet null), `user_agent` (text null), `created_at` (timestamptz not null default now()).
   - Index : `idx_audit_logs_actor_id`, `idx_audit_logs_event`, `idx_audit_logs_created_at`.
   - **Append-only** : aucune update/delete autorisée (politique enforced par convention dans le code + commentaire SQL en migration).

5. **AC5 — Schéma `ia_audit_logs` (IA Act explicabilité)**
   - `packages/db/src/schema/ia-audit-logs.ts` créé avec : `id` (cuid2), `user_id` (fk users.id null), `model` (text — ex: `mistral-large-latest`), `provider` (text — `mistral`, `anthropic`), `prompt_hash` (text — sha256 du prompt, jamais le prompt en clair), `feature_type` (text — `cv_parse`, `cover_letter`, `match_score`, `embedding`), `latency_ms` (integer), `tokens_input` (integer null), `tokens_output` (integer null), `success` (boolean), `error_code` (text null), `metadata` (jsonb — features extraites, scores), `created_at`.
   - Index : `idx_ia_audit_logs_user_id`, `idx_ia_audit_logs_feature_type`, `idx_ia_audit_logs_created_at`.

6. **AC6 — Index `schema/index.ts` exporte tous les schémas**
   - `packages/db/src/schema/index.ts` re-export l'ensemble : `users`, `accounts`, `sessions`, `verification_tokens`, `profiles`, `audit_logs`, `ia_audit_logs`, leurs enums (`user_role`, `auth_source`, `consent_status`, `actor_type`), et un objet `schema = { users, accounts, sessions, ... }` pour passage à `drizzle(connection, { schema })`.

7. **AC7 — Client Drizzle réel (remplace le Proxy stub story 1.1)**
   - `packages/db/src/client.ts` remplacé :
     - Si `DATABASE_URL` set : initialise `postgres(url, { max: 10, idle_timeout: 20, connect_timeout: 10 })` + `drizzle(client, { schema })`.
     - Si `DATABASE_URL` absent **et** `NODE_ENV !== 'production'` : conserve le `Proxy` qui throw au runtime (pour ne pas bloquer le boot des autres apps en dev/CI).
     - Si `DATABASE_URL` absent **et** `NODE_ENV === 'production'` : throw au boot.
   - Helper `closeDb()` exporté pour graceful shutdown (`await sql.end()` côté postgres-js).
   - Type `DrizzleClient` exporté pour annotation côté consommateurs.

8. **AC8 — Scripts drizzle-kit (`db:generate`, `db:migrate`, `db:push`, `db:studio`, `db:seed`)**
   - Scripts ajoutés à `packages/db/package.json` :
     - `"db:generate": "drizzle-kit generate"` — génère les fichiers SQL de migration depuis les schémas.
     - `"db:migrate": "drizzle-kit migrate"` — applique les migrations pending sur la DB.
     - `"db:push": "drizzle-kit push"` — push direct (dev uniquement, jamais en prod).
     - `"db:studio": "drizzle-kit studio"` — UI web pour explorer la DB.
     - `"db:seed": "tsx src/seed/dev.ts"` — exécute le seed dev (skip si `NODE_ENV === 'production'`).
   - Aussi exposés à la racine du monorepo via `package.json` : `"db:generate"`, `"db:migrate"`, `"db:push"`, `"db:studio"`, `"db:seed"` qui forwardent via `pnpm --filter @swipejob/db <script>`.

9. **AC9 — Migration initiale générée et committée**
   - `pnpm db:generate` exécuté → crée `packages/db/src/migrations/0000_<hash>_<name>.sql` avec les CREATE TABLE/INDEX/ENUM pour les 7 tables + 4 enums + extension `pgvector` (au cas où réutilisée plus tard) + extension `citext` pour emails case-insensitive.
   - Le fichier `meta/_journal.json` de drizzle-kit est créé et committé.
   - **Décision pgvector** : extension **activée dans la migration initiale** même si aucune colonne `vector` n'existe en story 1.2.5 (anticipation Story 2.8 embeddings — évite une 2e migration créant l'extension).

10. **AC10 — Seed dev + validation E2E + documentation**
    - `packages/db/src/seed/dev.ts` créé : seed minimal idempotent (UPSERT) de 1 utilisateur admin (`admin@swipejob.local`, `role: admin`) + 2 utilisateurs test (`alice@test.local`, `bob@test.local`, `role: user`). Skip si `NODE_ENV === 'production'` (fail-loud).
    - `apps/web/lib/db.ts` mis à jour : re-export depuis `@swipejob/db` avec `import 'server-only'`.
    - `@swipejob/db` ajouté en dependency (pas devDep) dans `apps/web/package.json` et `apps/worker/package.json` (levant 2 defers story 1.1).
    - `.env.example` enrichi avec `DATABASE_URL` détaillé (format Neon, exemple local Postgres).
    - `docs/runbooks/database.md` créé : provisioning Neon EU, génération migrations, push/migrate workflows, seed, drizzle-studio.
    - `README.md` mis à jour avec section "Database" + scripts.
    - **Smoke tests finaux** :
      - `pnpm install` PASS
      - `pnpm lint` + `pnpm typecheck` + `pnpm test` + `pnpm build` PASS (avec ou sans `DATABASE_URL` set).
      - **Si `DATABASE_URL` set localement (Postgres 16+ avec pgvector)** : `pnpm db:push` PASS + `pnpm db:seed` PASS + une query test (`select * from users limit 1`) retourne le seed.
      - **Sans `DATABASE_URL`** : le boot `pnpm dev` ne crashe pas ; toute query DB throw l'erreur explicite "client not initialized" via le Proxy.

## Tasks / Subtasks

- [x] **Task 1 — Setup Drizzle config + env (AC: 1)**
  - [x] `packages/db/package.json` : `drizzle-orm@^0.41` (déjà OK), ajout `zod ^3.24` (dep), `tsx ^4.19` (devDep), scripts `db:generate/migrate/push/studio/seed`.
  - [x] `packages/db/src/lib/env.ts` : Zod `DATABASE_URL` optional en dev, throw en prod via export `isDatabaseConfigured` + check `if (isProduction && !isDatabaseConfigured)`.
  - [x] `packages/db/src/lib/id.ts` : `createId()` wrapper `@paralleldrive/cuid2`.
  - [x] `packages/db/src/lib/timestamps.ts` : helper réutilisable `createdAt`/`updatedAt` avec `$onUpdate`.
  - [x] `packages/db/drizzle.config.ts` : `defineConfig({ schema, out, dialect, casing: 'snake_case', verbose, strict, dbCredentials conditionnel })`.

- [x] **Task 2 — Schémas Auth.js v5 (AC: 2)**
  - [x] `packages/db/src/schema/users.ts` : pgTable + 3 enums (`user_role`, `auth_source`, `consent_status`) + 13 colonnes (id, email citext, email_verified_at, name, image, locale, role, source, birth_date, consent_status, deleted_at, created_at, updated_at) + 2 index (email, deleted_at) + types `User`/`NewUser`.
  - [x] `packages/db/src/schema/accounts.ts` : pgTable + 14 colonnes (Auth.js OAuth) + unique index composite (provider, provider_account_id) + index user_id + FK cascade.
  - [x] `packages/db/src/schema/sessions.ts` : pgTable + 5 colonnes (id cuid2, user_id, expires_at, last_seen_at, created_at) + 2 index (user_id, expires_at) + FK cascade.
  - [x] `packages/db/src/schema/verification-tokens.ts` : pgTable + 3 colonnes + PK composite (identifier, token).
  - [x] **Note compat Auth.js v5** : noms colonnes en snake_case (convention architecture), Auth.js Drizzle adapter accepte mapping via option `tablesMap`. Adaptation finale en Story 1.3.

- [x] **Task 3 — Schéma `profiles` minimal (AC: 3)**
  - [x] `packages/db/src/schema/profiles.ts` : pgTable + 9 colonnes + unique index user_id + FK cascade.

- [x] **Task 4 — Schémas `audit_logs` + `ia_audit_logs` (AC: 4, 5)**
  - [x] `packages/db/src/schema/audit-logs.ts` : pgTable + enum `actor_type` + 10 colonnes (incl. `inet` ip_address, `jsonb` metadata) + 3 index (actor_id, event, created_at) + FK set null.
  - [x] `packages/db/src/schema/ia-audit-logs.ts` : pgTable + 13 colonnes (model, provider, prompt_hash, feature_type, latency_ms, tokens_input/output, success, error_code, metadata) + 3 index.
  - [x] Commentaire SQL `-- APPEND-ONLY` ajouté en tête des deux tables dans la migration générée.

- [x] **Task 5 — Index schémas + objet `schema` (AC: 6)**
  - [x] `packages/db/src/schema/index.ts` : re-export wildcard des 7 schémas + objet `schema = {users, accounts, sessions, verificationTokens, profiles, auditLogs, iaAuditLogs}` + type `Schema`.

- [x] **Task 6 — Client Drizzle réel (AC: 7)**
  - [x] `packages/db/src/client.ts` réécrit : import `postgres` + `drizzle-orm/postgres-js`, init lazy via `isDatabaseConfigured`, options serverless-friendly (`max: 10, idle_timeout: 20, connect_timeout: 10, prepare: false` pour Neon), Proxy stub explicit si DB absente, helper `closeDb()`, type `DrizzleClient` exporté.

- [x] **Task 7 — Scripts drizzle-kit (AC: 8)**
  - [x] Scripts ajoutés `packages/db/package.json`.
  - [x] Scripts pass-through root `package.json` (`pnpm db:*`).
  - [x] `drizzle.config.ts` lit `DATABASE_URL` conditionnellement (spread `...{ dbCredentials }` uniquement si présent) → `db:generate` fonctionne sans DB.

- [x] **Task 8 — Migration initiale (AC: 9)**
  - [x] `pnpm db:generate` exécuté → `0000_public_stardust.sql` créé (7 tables, 4 enums).
  - [x] `CREATE EXTENSION IF NOT EXISTS "citext"` + `"vector"` ajoutés en tête.
  - [x] Commentaires `-- APPEND-ONLY` ajoutés sur `audit_logs` et `ia_audit_logs`.
  - [x] `meta/_journal.json` créé par drizzle-kit, committé.
  - [x] **drizzle-kit bumped à `latest`** (0.30.4 → 0.31+) pour résoudre incompatibilité loader ESM/NodeNext + `.js` imports.
  - [ ] **Validation `db:push` locale** : **deferred** — pas de Postgres local installé. Sera validé quand l'user provisionne Neon (cf. runbook).

- [x] **Task 9 — Seed dev (AC: 10)**
  - [x] `packages/db/src/seed/dev.ts` : 3 utilisateurs (admin + 2 users), profile lié, UPSERT idempotent via `onConflictDoUpdate`, throw + exit(1) si `NODE_ENV=production` ou si `DATABASE_URL` absent. `eslint-disable no-console` ciblé (CLI script).
  - [x] `tsx` ajouté en devDep `packages/db`.
  - [ ] **Exécution réelle `pnpm db:seed`** : **deferred** (pas de DB locale). À valider post-Neon.

- [x] **Task 10 — Wiring web + worker + docs (AC: 10)**
  - [x] `apps/web/package.json` : `@swipejob/db: workspace:*` en `dependencies`.
  - [x] `apps/worker/package.json` : `@swipejob/db: workspace:*` en `dependencies`.
  - [x] `apps/web/lib/db.ts` : `import 'server-only'` + re-export complet (`db`, `closeDb`, `schema`, types).
  - [x] `apps/worker/src/lib/db.ts` : re-export sans `server-only` (worker = Node serveur).
  - [x] `.env.example` enrichi : `DATABASE_URL` Neon + exemple local Postgres + commentaire activation citext/pgvector.
  - [x] `docs/runbooks/database.md` créé : provisioning Neon, env vars, workflows generate/push/migrate, seed, schémas, conventions, sécurité, restauration PITR.
  - [x] `README.md` : section "Database" avec 5 scripts `pnpm db:*`, lien runbook ajouté.
  - [x] `deferred-work.md` : 2 defers levés (`@swipejob/db` web + worker). `@swipejob/llm` toujours pending (Story 2.x).
  - [x] **Smoke tests finaux** :
    - `pnpm install` PASS
    - `pnpm lint` PASS (8/8 packages incl. nouveau @swipejob/db avec règles flat)
    - `pnpm typecheck` PASS (8/8)
    - `pnpm test` PASS (4 types + 3 db + 6 worker = 13 tests Vitest)
    - `pnpm build` PASS (2/2)
    - `pnpm lint:css` PASS
    - `pnpm format:check` PASS
  - [x] Tests Vitest db : `id.test.ts` (createId 24-char cuid2 + unicité 100 IDs), `schema.test.ts` (export des 7 tables + 4 enums après patch F-024).

### Review Findings

*Générées par bmad-code-review du 2026-05-17 — 3 layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor) sur claude-sonnet-4-6. 28 findings actionnables : 3 Critical, 7 High, 8 Medium, 10 Low, 5 Defers, 7 Dismiss. **18 patches appliqués** (Critical + High + Medium pertinents + 2 Low).*

**Patches appliqués (18)**

*Critical (3) — bloquant Story 1.3*
- [x] **F-001** Auth.js v5 column names : `sessions.id` → `sessionToken`, `sessions.expiresAt` → `expires`, `users.emailVerifiedAt` → `emailVerified`, `verificationTokens.expiresAt` → `expires`. Sans ce patch l'adapter Auth.js v5 ne trouvait pas les colonnes attendues, bloquant Story 1.3. Migration regénérée.
- [x] **F-002** HMR pool leak Next.js dev : `globalForDb` singleton sur `globalThis` protège contre le re-évaluation modules à chaque hot-reload (évite saturation Neon Launch 100 connexions).
- [x] **F-003** Double index sur `users.email` : la contrainte UNIQUE crée déjà un index unique Postgres. `index('idx_users_email')` retiré pour éviter le doublon d'écriture.

*High (7)*
- [x] **F-004** `casing: 'snake_case'` retiré du runtime `drizzle()` (dead code car tous nos schémas ont des noms SQL explicites). Conservé dans `drizzle.config.ts` (utile pour drizzle-kit).
- [x] **F-005** Seed `dev.ts` : transactions ajoutées (`db.transaction`) pour atomicité user + profile.
- [x] **F-006** `ia_audit_logs.latency_ms` migré integer → bigint (évite overflow > 25 jours).
- [x] **F-007** `env.ts` : warning explicite si `DATABASE_URL` set mais invalide (évite silent fallback vers Proxy).
- [x] **F-008** CI job `db-check` ajouté à `ci.yml` : exécute `drizzle-kit generate --name __drift_check__` et fail si nouvelle migration créée (drift schéma/migration non committé).
- [x] **F-009** `audit_logs.actor_type` : default `'USER'` retiré (callers DOIVENT spécifier explicitement).
- [x] **F-010** Documenté que `accounts.updatedAt` n'est pas auto-maintenu via Auth.js adapter (note inline).

*Medium (7)*
- [x] **F-011** Index `idx_audit_logs_target_id` ajouté (requêtes RGPD "tous events liés à cet objet").
- [x] **F-012** Index `idx_ia_audit_logs_model` ajouté (analytics IA Act par modèle).
- [x] **F-013** `sessions.lastSeenAt` : `$onUpdate(() => new Date())` ajouté (mise à jour automatique sur tout UPDATE Drizzle de la session).
- [x] **F-014** `birth_date` gardé en type `date` (sémantiquement correct), commentaire d'exception architecture ajouté.
- [x] **F-015** Enum `auth_source` étendu : ajout `'MAGIC_LINK'`, `'UNKNOWN'`. Default users.source changé `'EMAIL'` → `'UNKNOWN'` (évite fausse attribution).
- [x] **F-016** Connection pool : `max: isServerless ? 1 : 10` (détection `VERCEL=1` ou `AWS_LAMBDA_FUNCTION_NAME`). Évite saturation Neon depuis Next.js Vercel.
- [x] **F-017** `client.ts` : `schema` n'est plus re-exporté (disponible via `@swipejob/db/schema` path distinct). `isDatabaseConfigured` exporté pour usage côté consumers.
- [x] **F-018** Runbook database.md : doc connection pool corrigée (1 pour serverless, 10 pour worker, note Neon Launch 100 connexions max).

*Low (2 sélectionnés, 8 skipés)*
- [x] **F-019** `drizzle.config.ts` ajouté dans `tsconfig.json` include + `rootDir` ajusté à `"."` (typecheck couvre maintenant la config).
- [x] **F-024** Test `schema.test.ts` étendu : vérifie aussi l'export des 4 enums (`userRole`, `authSource`, `consentStatus`, `actorType`).
- [x] **F-021** (bonus) `audit_logs.metadata` et `ia_audit_logs.metadata` : default `{}` retiré (null plus expressif pour events sans metadata).
- [x] **F-022** (bonus) `prompt_hash` : commentaire SHA-256 hex 64 chars ajouté.
- [x] **F-020** (bonus) Runbook database.md : convention enum (`snake_case` nom, `UPPER_SNAKE_CASE` valeurs) explicitée.
- [x] **F-026** (bonus) `phone` : commentaire format E.164 attendu.
- [x] **F-027** (bonus) `apps/web/lib/db.ts` re-exporte `isDatabaseConfigured`.

**Findings reportés (defer, à documenter dans `deferred-work.md`)**

- [ ] **FD-001** Neon serverless HTTP driver `@neondatabase/serverless` pour Next.js — à évaluer Story 1.3 quand premières requêtes réelles.
- [ ] **FD-002** Trigger Postgres APPEND-ONLY V2 (au lieu de convention code-only).
- [ ] **FD-003** Purge automatique `ia_audit_logs` (rétention) — Story compliance 6.x.
- [ ] **FD-004** Vérifier que `drizzle-kit generate --check` flag existe (sinon script shell SHA-compare).
- [ ] **FD-005** Middleware Next.js qui update `sessions.lastSeenAt` — Story 1.3.

**Findings écartés (dismiss)**

- **F-023** Test cuid2 regex `{24}` rigide — conservé, l'API @paralleldrive/cuid2 actuelle est 24 chars par défaut.
- **F-025** Zod version unification (3.24 vs 3.25) — différence patch, pas breaking, pas urgent.
- **F-028** Commentaire BCP 47 sur `locale` — implicite via type, déjà clair.
- **DISMISS-001 à DISMISS-007** Sonnet 4.6 a justifié 7 dismisses (strict drizzle, expiresAt bigint Auth.js, PK composite verification_tokens, esbuild allowBuilds, createId wrapper, _snapshot.json commit, server-only worker absence).

## Dev Notes

### Contexte et motivation

Cette story est une **insertion hors-séquence** réalisée pour résoudre un gap planning : `epics.md` ne contient pas TECH-002 comme story dédiée alors que l'architecture (ligne 386, 398) le positionne avant TECH-003 (Story 1.3). Sans cette story, Story 1.3 ne peut pas être implémentée (aucune table `users`/`sessions`/`audit_logs` pour Auth.js).

**Périmètre volontairement restreint** : seuls les schémas nécessaires aux Stories 1.3-1.5 (auth, onboarding début, consentement parental) + traçabilité RGPD/IA Act. Les schémas `cvs`, `offers`, `applications`, `match_scores`, `swipe_events`, `streaks`, `badges`, `notifications`, `consents`, `rgpd_requests`, `feature_flags` seront ajoutés dans leurs stories respectives via des migrations incrementales.

### Stack technique (versions imposées)

| Composant | Version | Source |
|---|---|---|
| `drizzle-orm` | `^0.41` (bump depuis 0.41 actuel) | architecture.md ligne 298 ("Drizzle 0.36+") |
| `drizzle-kit` | `^0.30` | architecture.md ligne 299 |
| `postgres` (driver) | `^3.4` | déjà installé story 1.1 |
| `@paralleldrive/cuid2` | `^2.2` | déjà installé story 1.1 |
| `tsx` | `^4.19` (déjà dans worker) | pour seed |
| Postgres (runtime) | **16+** | Neon EU (Paris/Frankfurt), architecture.md ligne 301 |
| Extension `pgvector` | `0.7+` | architecture.md ligne 297 — anticipation Story 2.8 |
| Extension `citext` | natif PG | emails case-insensitive |

### Conventions DB à enforcer (architecture.md lignes 411-420)

| Élément | Convention | Exemple |
|---|---|---|
| Tables | `snake_case` pluriel | `users`, `audit_logs`, `verification_tokens` |
| Colonnes | `snake_case` | `created_at`, `user_id`, `email_verified_at` |
| Foreign keys | `<table_singulier>_id` | `user_id`, `account_id` |
| Index | `idx_<table>_<col1>_<col2>` | `idx_users_email`, `idx_audit_logs_event` |
| Enums | `snake_case`, valeurs `UPPER_SNAKE` | enum `user_role` valeurs `USER`, `ADMIN` |
| Timestamps | `created_at`, `updated_at`, `deleted_at` (soft delete) partout | timestamptz |
| IDs | `cuid2` partout (NFR-Se) | helper `createId()` |
| Dates | `timestamptz` (jamais `timestamp` sans timezone) | architecture.md ligne 555 |

### Drizzle 0.41+ : nouveautés à utiliser

- **`casing: 'snake_case'` dans `drizzle.config.ts`** : Drizzle-kit ≥0.30 fait le mapping automatique des noms TypeScript camelCase → snake_case côté DB. Permet d'écrire `userId` en TS et obtenir `user_id` en SQL sans helper manuel. À activer.
- **`generate` vs `push`** : `generate` produit des fichiers SQL versionnés (pour prod), `push` synchronise direct la DB sans migration (dev uniquement). En CI prod : `generate` au build, `migrate` au deploy.

### Compatibilité Auth.js v5 Drizzle adapter

Auth.js v5 (`@auth/core` + `@auth/drizzle-adapter`) attend un schéma précis. Les conventions par défaut sont en camelCase, mais l'adapter accepte un mapping. Notre choix snake_case via `casing: 'snake_case'` permet de :
- garder le snake_case en SQL (convention architecture)
- exposer du camelCase en TypeScript (consommation Next.js naturelle)

**Source de vérité Auth.js v5 schema** : <https://authjs.dev/getting-started/adapters/drizzle> — adapter version `^1.x` compatible Auth.js v5.

**Tables attendues par l'adapter** :
- `users` : `id`, `email`, `emailVerified`, `name`, `image`
- `accounts` : `userId`, `provider`, `providerAccountId`, `type`, tokens OAuth
- `sessions` : `sessionToken` (= `id` chez nous via cuid2), `userId`, `expires`
- `verificationTokens` : `identifier`, `token`, `expires` (PK composite)

Nos extensions (`role`, `source`, `locale`, `birth_date`, `consent_status`) sont ajoutées **en supplément** sans casser l'adapter (l'adapter ignore les colonnes inconnues lors des inserts).

### Sécurité (NFR-Se)

- **IDs cuid2** (jamais d'auto-increment) : NFR-Se architecture.md ligne 562. Empêche l'énumération.
- **Emails citext** : éviter les bugs de casse sur lookup (`SELECT * FROM users WHERE email = ?` ne doit pas être sensible à la casse).
- **Audit logs append-only** : aucune opération UPDATE/DELETE autorisée. V1 enforced par convention dans le code (helpers `auditLog()` n'exposent que `insert`). V2 : trigger Postgres + role read-only pour le reste de l'app.
- **Pas de PII en clair dans `audit_logs.metadata` ni `ia_audit_logs.metadata`** : passer via `redactPII()` de `@swipejob/types` avant insert (helper créé Story 1.2). Email hashé via `hashEmail()`.
- **Soft delete** (`deleted_at`) sur `users` uniquement V1 : permet récupération RGPD dans la fenêtre légale. Les autres tables : hard delete sur cascade.

### Decisions critiques pour cette story

1. **Mode conditionnel** : si `DATABASE_URL` absent en dev, le client `db` reste un Proxy stub (cohérent avec l'approche observability Story 1.2 — boot sans credentials). Permet de continuer à coder/tester sans Postgres local. **Mais en prod**, fail-loud au boot.
2. **pgvector dans la migration initiale** : activé même sans colonne vector pour éviter une migration ALTER en Story 2.8.
3. **citext extension** : choix architecture pour les emails (insensible à la casse). Alternative : column `text` + index `LOWER(email)` (plus portable mais plus lourd). Décision : `citext` natif PG, plus propre.
4. **Auth.js Drizzle adapter mapping** : utiliser `casing: 'snake_case'` au lieu de mapping manuel par colonne. Plus DRY, syntaxe TS naturelle.
5. **Schéma `profiles` minimal en 1.2.5** : juste `first_name`, `last_name`, `phone`, `city`, `bio`. Les champs CV-parsing (école, expériences, compétences, langues) seront ajoutés Story 1.7 (parsing CV) via migration ALTER.
6. **Pas de provisioning Neon dans cette story** : la story produit le code + le runbook. Le provisioning réel (création du projet Neon, branche prod, branche preview, IAM) est une action humaine documentée — alignement Story 1.2 Vercel setup.
7. **Seed dev minimal** : 3 utilisateurs (1 admin + 2 users) sans données métier. Les futures stories (parsing CV, ingestion offres) enrichiront le seed.
8. **Drizzle 0.41 vs 0.36 (architecture.md ligne 298)** : architecture spécifie "0.36+", on prend la dernière stable 0.41 car features `casing: 'snake_case'` (introduit 0.31) + relations API améliorée.
9. **`postgres-js` vs `node-postgres`** : story 1.1 a installé `postgres` (postgres.js). Conservé — meilleure perf pour serverless, support natif `sql\`...\`` template tag, compat Neon.
10. **Migrations stockées dans `packages/db/src/migrations/`** : convention drizzle-kit. À committer (audit trail des changements DB).

### Project Structure Notes

**Fichiers attendus (référence architecture.md lignes 757-762) :**

```
packages/db/
├── package.json              # MODIFIÉ (drizzle-orm bump, scripts db:*)
├── tsconfig.json
├── eslint.config.js
├── vitest.config.ts
├── drizzle.config.ts         # NEW (Task 1)
└── src/
    ├── client.ts             # MODIFIÉ (vrai client Drizzle conditionnel)
    ├── lib/
    │   ├── env.ts            # NEW (Task 1)
    │   └── id.ts             # NEW (Task 1)
    ├── schema/
    │   ├── index.ts          # MODIFIÉ (re-export tous)
    │   ├── users.ts          # NEW (Task 2)
    │   ├── accounts.ts       # NEW (Task 2)
    │   ├── sessions.ts       # NEW (Task 2)
    │   ├── verification-tokens.ts  # NEW (Task 2)
    │   ├── profiles.ts       # NEW (Task 3)
    │   ├── audit-logs.ts     # NEW (Task 4)
    │   └── ia-audit-logs.ts  # NEW (Task 4)
    ├── migrations/           # générée par drizzle-kit (Task 8)
    │   ├── 0000_<hash>_<name>.sql
    │   └── meta/_journal.json
    └── seed/
        └── dev.ts            # NEW (Task 9)

apps/web/
├── lib/db.ts                 # MODIFIÉ (re-export + server-only)
└── package.json              # MODIFIÉ (@swipejob/db en deps)

apps/worker/
├── src/lib/db.ts             # NEW (re-export)
└── package.json              # MODIFIÉ (@swipejob/db en deps)

Racine:
├── package.json              # MODIFIÉ (scripts root db:*)
├── .env.example              # MODIFIÉ (section DATABASE_URL détaillée)
└── README.md                 # MODIFIÉ (section Database)

docs/runbooks/
└── database.md               # NEW
```

### Testing standards

- **Vitest** : 1 test minimal `packages/db/src/schema/users.test.ts` : vérifie que `createId()` produit un cuid2 valide (24 chars alphanumériques) et que `schema.users` est défini. Pas de test d'intégration DB en 1.2.5 (sera ajouté en Story 1.3 avec testcontainers Postgres).
- **Lint** : tous les nouveaux fichiers DOIVENT compiler ESLint flat config + tsc strict (`noUncheckedIndexedAccess`).
- **CI** : ajouter `db:generate` en check CI (vérifie qu'il n'y a pas de drift schéma/migration non committée). À ajouter dans `ci.yml` job `lint` ou nouveau job `db-check`. Pour V1, vérifier juste `pnpm typecheck` qui détecte les erreurs Drizzle.

### Red-Green-Refactor

1. **RED** : écrire le test `createId()` qui échoue (pas encore implémenté).
2. **GREEN** : implémenter chaque schéma minimal pour faire passer.
3. **REFACTOR** : factoriser les colonnes communes (`createdAt`, `updatedAt`) dans un helper `packages/db/src/lib/timestamps.ts` si la duplication devient pénible.

### Critères Definition of Done

- [ ] Tous les ACs (1-10) vérifiés.
- [ ] `pnpm install && pnpm dev` fonctionne sans `DATABASE_URL` (mode conditionnel Proxy).
- [ ] Aucun warning ESLint, ni erreur TypeScript, ni fichier non formaté.
- [ ] Migration `0000_*.sql` committée + `meta/_journal.json` committé.
- [ ] `docs/runbooks/database.md` créé.
- [ ] `File List` complet.
- [ ] 2 defers story 1.1 (deps `@swipejob/db` web + worker) marqués levés dans `deferred-work.md`.

### Latest Tech Information (à vérifier au moment du dev)

- **`drizzle-orm` v0.41+** : vérifier la doc pour `casing: 'snake_case'` syntax exacte dans `drizzle.config.ts`. API potentiellement modifiée depuis 0.36.
- **`@auth/drizzle-adapter` v1.x** : vérifier compat Auth.js v5 + Drizzle 0.41+. Si breaking change, adapter le mapping schema en conséquence.
- **Neon Postgres 16** : confirmer support pgvector 0.7+ sur le plan Launch.
- **drizzle-kit 0.30+** : commande `generate` (anciennement `generate:pg`) — syntaxe peut avoir changé.
- **`postgres-js` v3.4+** : option `prepare: false` recommandée pour Neon serverless (évite les warnings de prepared statements cross-connection).

### Project Context Reference

- `_bmad-output/planning-artifacts/architecture.md` lignes 296-305 (Persistence) + 311-319 (Auth) + 386 (TECH-002) + 411-420 (Naming) + 562 (cuid2) + 757-762 (Structure DB).
- `_bmad-output/planning-artifacts/prd.md` ligne 298 (auth argon2id) + 910 (audit logs 13 mois).
- `_bmad-output/implementation-artifacts/1-1-bootstrap-monorepo-turborepo-et-infrastructure-de-base.md` Dev Notes ligne 343 (pattern Drizzle), File List `packages/db/` actuel.
- `_bmad-output/implementation-artifacts/1-2-setup-observability-et-pipeline-ci-cd.md` Completion Notes (pattern conditionnel env, levée defer `@swipejob/types`).
- `_bmad-output/implementation-artifacts/deferred-work.md` lignes 7-9 (defers `@swipejob/db` à lever).

### References

- [Source: architecture.md#Persistence] — Drizzle 0.36+, postgres, Neon EU (lignes 296-305).
- [Source: architecture.md#Auth & Security] — Auth.js v5 + DB sessions + argon2id + cuid2 (lignes 311-319).
- [Source: architecture.md#Decision Impact Analysis] — TECH-002 = priorité absolue (lignes 386, 398).
- [Source: architecture.md#Naming Patterns] — tables snake_case pluriel, FKs, index, enums (lignes 411-420).
- [Source: architecture.md#Format Patterns] — timestamptz, ISO 8601, cuid2 IDs (lignes 552-562).
- [Source: architecture.md#Complete Project Directory Structure] — `packages/db/src/schema/` (lignes 757-762).
- [Source: prd.md#Compliance & Privacy] — audit logs RGPD 13 mois (ligne 910).
- [Source: epics.md#Story 1.3] — usage tables `users`, `sessions`, `audit_logs` (lignes 457-473).

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6 (bmad-dev-story workflow recommandé). Opus 4.7 acceptable.

### Debug Log References

*(à compléter par le DEV agent)*

### Completion Notes List

**2026-05-17, Opus 4.7 (bmad-dev-story)**

- **Tout livré en une session** : 10 Tasks, 10 ACs (8 fully done, 2 partially deferred — réelle exécution `db:push`/`db:seed` requiert un Postgres provisionné, non bloquant car DB conditionnelle).
- **drizzle-kit bumped** : 0.30.4 → latest (0.31+) au moment de `db:generate` pour résoudre l'incompatibilité ESM loader + imports `.js` extension (NodeNext). Sans ce bump, la commande échouait avec `Cannot find module '../lib/id.js'` (CJS resolver fallback). Documenté dans Task 8.
- **`esbuild` ajouté à `onlyBuiltDependencies`** : drizzle-kit installe esbuild qui a un postinstall script. pnpm 11 a re-ajouté `allowBuilds:` avec placeholders → fixé à `true` dans `pnpm-workspace.yaml`.
- **Mode conditionnel uniforme** : cohérent avec Story 1.2 pattern. Boot OK sans `DATABASE_URL` en dev (Proxy throw au runtime). Fail-loud en prod (env.ts vérifie au boot).
- **citext + pgvector activés dès la migration initiale** : décision documentée Dev Notes #2-3. Évite 2 migrations ALTER plus tard.
- **APPEND-ONLY enforced par convention V1** : commentaires SQL sur `audit_logs` et `ia_audit_logs`. V2 = trigger Postgres + role read-only séparé.
- **Compat Auth.js v5** : schémas avec colonnes snake_case (convention architecture). L'adapter Drizzle d'Auth.js accepte un mapping de tables via `DrizzleAdapter(db, { usersTable: users, accountsTable: accounts, ... })` — sera câblé en Story 1.3.
- **2 defers story 1.1 levés** : `@swipejob/db` ajouté en dep web + worker. `@swipejob/llm` reste pending.
- **Tests Vitest** : 3 nouveaux (id × 2 + schema × 1). Tests d'intégration DB (testcontainers Postgres) reportés à Story 1.3 quand on aura un cas d'usage métier réel à tester.
- **Compat package.json `main`/`exports`** : pointent toujours sur `./src/client.ts` (TS source), consommable via tsx/Next.js sans build préalable. Acceptable pour V1.

**Validations finales** : `pnpm install` ✅, `pnpm lint` ✅ (8/8), `pnpm typecheck` ✅ (8/8), `pnpm test` ✅ (13 tests), `pnpm build` ✅, `pnpm format:check` ✅, `pnpm lint:css` ✅.

**Actions humaines requises post-merge** :
1. Provisionner Neon EU + activer extensions `citext` + `pgvector` (cf. `docs/runbooks/database.md`).
2. Set `DATABASE_URL` dans `.env.local`, Vercel (preview + production), Railway (worker).
3. Lancer `pnpm db:push` (dev) ou `pnpm db:migrate` (prod) pour appliquer la migration initiale.
4. Lancer `pnpm db:seed` en local pour avoir les 3 utilisateurs test.

### File List

**Nouveaux fichiers**

- `packages/db/drizzle.config.ts`
- `packages/db/src/lib/env.ts`
- `packages/db/src/lib/id.ts`
- `packages/db/src/lib/id.test.ts`
- `packages/db/src/lib/timestamps.ts`
- `packages/db/src/schema/users.ts`
- `packages/db/src/schema/accounts.ts`
- `packages/db/src/schema/sessions.ts`
- `packages/db/src/schema/verification-tokens.ts`
- `packages/db/src/schema/profiles.ts`
- `packages/db/src/schema/audit-logs.ts`
- `packages/db/src/schema/ia-audit-logs.ts`
- `packages/db/src/schema/schema.test.ts`
- `packages/db/src/seed/dev.ts`
- `packages/db/src/migrations/0000_public_stardust.sql`
- `packages/db/src/migrations/meta/_journal.json` (auto-généré)
- `packages/db/src/migrations/meta/0000_snapshot.json` (auto-généré)
- `apps/worker/src/lib/db.ts`
- `docs/runbooks/database.md`

**Fichiers modifiés**

- `packages/db/package.json` (zod + tsx deps, 5 scripts db:*, drizzle-kit bump)
- `packages/db/src/client.ts` (Proxy stub → vrai client conditionnel)
- `packages/db/src/schema/index.ts` (re-export 7 schémas + objet `schema`)
- `apps/web/lib/db.ts` (re-export depuis `@swipejob/db` avec `server-only`)
- `apps/web/package.json` (`@swipejob/db: workspace:*` en deps)
- `apps/worker/package.json` (`@swipejob/db: workspace:*` en deps)
- `package.json` (5 scripts root `db:*` pass-through)
- `pnpm-workspace.yaml` (esbuild allowBuilds true)
- `.env.example` (section DATABASE_URL Neon + local)
- `README.md` (section Database scripts + lien runbook)
- `_bmad-output/implementation-artifacts/deferred-work.md` (2 defers `@swipejob/db` levés)

## Change Log

| Date | Auteur | Description |
|---|---|---|
| 2026-05-17 | bmad-create-story | Création de la story 1.2.5 (TECH-002) hors-séquence pour combler le gap planning avant Story 1.3. Status: ready-for-dev. |
| 2026-05-17 | claude-opus-4-7 (bmad-dev-story) | Implémentation complète Tasks 1-10. Drizzle 0.41 + 7 schémas (users/accounts/sessions/verification_tokens/profiles/audit_logs/ia_audit_logs) + 4 enums + citext+pgvector extensions, client conditionnel, scripts db:*, migration initiale, seed dev idempotent, wiring web+worker, runbook database.md. Lève 2 defers story 1.1 (`@swipejob/db` web+worker). Validations all PASS (lint, typecheck, 13 tests, build, format, stylelint). Status: review. |
| 2026-05-17 | claude-sonnet-4-6 (bmad-code-review) | Review adversariale 3 layers : 28 findings (3 Critical bloquants Story 1.3, 7 High, 8 Medium, 10 Low), 5 defers, 7 dismiss. |
| 2026-05-17 | claude-opus-4-7 (apply-patches) | Application de 18 patches Critical+High+Medium+Low pertinents. Auth.js v5 column names corrigés (sessions/users/verification_tokens), HMR pool protection, double index supprimé, transaction seed, bigint latency, db-check CI job, indexes target_id/model ajoutés, pool serverless conditionnel, $onUpdate sessions, env warning DATABASE_URL invalide. Migration regénérée `0000_initial.sql` avec citext+pgvector+APPEND-ONLY commentaires. Validations: lint+lint:css+typecheck+test+build+format:check all PASS (14 tests Vitest dont 4 db). Status: done. |
