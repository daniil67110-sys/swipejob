# Runbook — Database (Neon + Drizzle)

Story 1.2.5 (TECH-002). Stack : Neon Postgres 16 EU + pgvector + citext + Drizzle ORM 0.41+.

## Provisioning Neon (action humaine)

1. <https://console.neon.tech/> → Create Project → Region **EU (Frankfurt ou Paris)**.
2. Branch `main` créée automatiquement (production).
3. Branche `preview` (template pour PR previews — optionnel V1, manuel V2).
4. Activer extensions : Settings → Extensions → enable `pgvector` + `citext`.
5. Copier la connection string : `postgres://user:pass@xxx.eu-west-1.aws.neon.tech/swipejob?sslmode=require`.

## Variables d'environnement

| Variable       | Scope                                                       | Source                             |
| -------------- | ----------------------------------------------------------- | ---------------------------------- |
| `DATABASE_URL` | local / Vercel preview / Vercel production / Railway worker | Neon dashboard → Connection String |

**Local** : `.env.local` (jamais committé). **Vercel/Railway** : UI dashboard.

**Sans `DATABASE_URL`** : le client `db` reste un Proxy qui throw au runtime — boot OK pour le reste de l'app.

## Workflow migrations (Drizzle)

### Dev local (push direct)

```bash
# 1. Modifier un schéma dans packages/db/src/schema/*.ts
# 2. Pousser directement sur la DB locale (sans migration committée)
pnpm db:push

# 3. Inspecter la DB via Drizzle Studio
pnpm db:studio
# → http://localhost:4983
```

### Dev → Production (générer + appliquer)

```bash
# 1. Générer un fichier SQL de migration depuis les schémas modifiés
pnpm db:generate
# → produit packages/db/src/migrations/0XXX_<name>.sql

# 2. Inspecter le SQL généré, ajuster si besoin (commentaires APPEND-ONLY, extensions custom)

# 3. Committer la migration ET _journal.json

# 4. En CI/déploiement : appliquer les migrations pending
pnpm db:migrate
```

**Règle d'or** : `db:push` JAMAIS en prod. Uniquement `db:migrate` (migrations versionnées et auditées).

## Seed dev

```bash
# Crée 1 admin + 2 utilisateurs test (idempotent — UPSERT)
pnpm db:seed

# Refuse si NODE_ENV=production
```

Utilisateurs créés :

- `admin@swipejob.local` (role `ADMIN`, source `EMAIL`)
- `alice@test.local` (role `USER`, source `GOOGLE`)
- `bob@test.local` (role `USER`, consent `PENDING`)

## Schémas inclus en Story 1.2.5

| Table                 | Owner                   | Description                                                                              |
| --------------------- | ----------------------- | ---------------------------------------------------------------------------------------- |
| `users`               | web                     | Auth.js core + extensions (role, source, locale, birth_date, consent_status, deleted_at) |
| `accounts`            | web                     | Auth.js OAuth providers (Google, etc.)                                                   |
| `sessions`            | web                     | Auth.js DB sessions (révocation immédiate RGPD)                                          |
| `verification_tokens` | web                     | Magic links email/passwordless                                                           |
| `profiles`            | web                     | Profile minimal (first/last name, phone, city, bio) — étendu Story 1.7                   |
| `audit_logs`          | web + worker            | RGPD audit trail, **APPEND-ONLY**, 13 mois rétention via export R2 mensuel (Story 1.2)   |
| `ia_audit_logs`       | worker (principalement) | IA Act explicabilité, **APPEND-ONLY**, hash prompts (jamais en clair)                    |

Schémas restants (`cvs`, `offers`, `applications`, `match_scores`, `swipe_events`, `streaks`, `badges`, `notifications`, `consents`, `rgpd_requests`, `feature_flags`) ajoutés au fil des stories qui les utilisent.

## Conventions à respecter (architecture.md lignes 411-420)

- Tables `snake_case` pluriel.
- Colonnes `snake_case`.
- FKs `<table_singulier>_id`.
- Index `idx_<table>_<col>`.
- Enums : nom en `snake_case` (ex. `user_role`), valeurs en `UPPER_SNAKE_CASE` (ex. `'USER'`, `'ADMIN'`).
- IDs `cuid2` partout (helper `createId()` de `@swipejob/db`).
- Dates `timestamptz` (jamais `timestamp` sans timezone).
- Soft delete (`deleted_at`) sur `users` uniquement V1.

## Sécurité

- **PII jamais en clair dans `audit_logs.metadata` ni `ia_audit_logs.metadata`** : utiliser `redactPII()` de `@swipejob/types` avant insert.
- **`audit_logs` et `ia_audit_logs` sont APPEND-ONLY** : aucune UPDATE/DELETE. V2 = trigger Postgres + role read-only.
- **Emails case-insensitive** via extension `citext` (évite bugs de casse sur lookup).
- **Connection pool** : `max: 10` pour le worker (long-running), `max: 1` automatique pour Next.js/Vercel serverless (détection via `process.env.VERCEL === '1'`). `idle_timeout: 20s`.
- **Neon Launch plan = 100 connexions max** : surveiller `pg_stat_activity` si > 5 instances Vercel concurrentes. Si saturation, évaluer `@neondatabase/serverless` (driver HTTP sans pool).

## Restauration PITR

Neon Launch plan = **PITR 7 jours** (RPO 1h conformément NFR-R3). Procédure :

1. Neon Dashboard → Project → Branches → Create Branch From Point In Time.
2. Sélectionner timestamp cible (max 7 jours en arrière).
3. Récupérer une nouvelle connection string, valider les données.
4. Promouvoir la branche en production OU exporter les données critiques.

V2 (Pro plan) : 30 jours PITR + branches preview-per-PR automatiques.
