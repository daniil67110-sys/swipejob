# SwipeJob — Monorepo

![Node 20](https://img.shields.io/badge/node-20%20LTS-brightgreen)
![pnpm 11](https://img.shields.io/badge/pnpm-11-orange)
![Turborepo](https://img.shields.io/badge/turborepo-latest-blueviolet)
![Next.js 15](https://img.shields.io/badge/next.js-15-black)
![TypeScript](https://img.shields.io/badge/typescript-5.x_strict-blue)

Monorepo Turborepo pour **SwipeJob** — la plateforme de recherche d'emploi basée sur l'IA et le swipe.

> Consultez [`docs/`](_bmad-output/planning-artifacts/) pour l'architecture complète, le PRD et les spécifications UX.

---

## Installation

### Prérequis

- **Node.js** 20 LTS ([nvm](https://github.com/nvm-sh/nvm) recommandé : `nvm use`)
- **pnpm** 11+ (`npm install -g pnpm` ou via corepack)

### Bootstrap

```bash
# 1. Cloner le repo
git clone <url> swipejob
cd swipejob

# 2. Utiliser Node 20 (si nvm installé)
nvm use

# 3. Installer les dépendances
pnpm install

# 4. Copier les variables d'environnement
cp .env.example .env.local
# Remplir les valeurs dans .env.local

# 5. Lancer le développement
pnpm dev
```

---

## Lancement

```bash
# Développement (web + worker en parallèle)
pnpm dev

# URLs locales :
# - Web (Next.js)   : http://localhost:3000
# - Worker (Hono)   : http://localhost:4000
# - Health worker   : http://localhost:4000/health
```

---

## Structure du monorepo

```
swipejob/
├── apps/
│   ├── web/          # Next.js 15 — App Router, TypeScript strict, Tailwind 4
│   └── worker/       # Node.js 20 — Hono + BullMQ + Pino
├── packages/
│   ├── config/       # ESLint, TypeScript, Tailwind, Prettier configs partagées
│   ├── db/           # Drizzle ORM (placeholder — Story 1.2)
│   ├── types/        # Types partagés Zod + ActionResult<T>
│   ├── llm/          # Client LLM Mistral/Anthropic (placeholder — Story 2.8)
│   └── ui/           # Composants UI partagés (placeholder V2)
├── _bmad-output/     # Documentation BMad (architecture, PRD, UX)
├── .nvmrc            # Node 20
├── lefthook.yml      # Git hooks (pre-commit, commit-msg)
├── commitlint.config.js
└── turbo.json
```

---

## Commandes utiles

```bash
# Développement
pnpm dev              # Lance web + worker en parallèle
pnpm dev --filter=@swipejob/web     # Lance seulement le web
pnpm dev --filter=@swipejob/worker  # Lance seulement le worker

# Qualité de code
pnpm lint             # ESLint sur tout le monorepo
pnpm typecheck        # TypeScript noEmit sur tout le monorepo
pnpm format           # Prettier --write
pnpm format:check     # Prettier --check (utilisé par CI)

# Tests
pnpm test             # Vitest sur tout le monorepo
pnpm --filter @swipejob/web test:e2e  # Playwright + axe-core (e2e)

# CSS lint (Tailwind 4)
pnpm lint:css         # Stylelint sur apps/web/app/**/*.css

# Database (Drizzle + Neon Postgres)
pnpm db:generate      # Génère un fichier SQL de migration depuis les schémas
pnpm db:migrate       # Applique les migrations pending sur la DB
pnpm db:push          # Push direct (DEV uniquement, jamais en prod)
pnpm db:studio        # UI web Drizzle Studio (http://localhost:4983)
pnpm db:seed          # Seed dev : 1 admin + 2 utilisateurs test (refuse en prod)

# Build production
pnpm build            # Build Next.js + worker TypeScript
pnpm build --filter=@swipejob/web     # Build seulement le web

# Packages individuels
pnpm --filter=@swipejob/worker dev
pnpm --filter=@swipejob/web build
```

---

## Conventions

| Élément                   | Convention             | Outil                                  |
| ------------------------- | ---------------------- | -------------------------------------- |
| Fichiers composants React | `PascalCase.tsx`       | `unicorn/filename-case`                |
| Fichiers utilitaires      | `kebab-case.ts`        | `unicorn/filename-case`                |
| Variables/fonctions       | `camelCase`            | `@typescript-eslint/naming-convention` |
| Types/Interfaces          | `PascalCase`           | `@typescript-eslint/naming-convention` |
| Constantes                | `UPPER_SNAKE_CASE`     | `@typescript-eslint/naming-convention` |
| Commits                   | `feat(scope): message` | commitlint                             |

---

## Git Hooks (Lefthook)

Les hooks sont installés automatiquement via `pnpm install` (script `prepare`).

- **pre-commit** : ESLint + TypeScript + Prettier (fichiers staged)
- **commit-msg** : commitlint — format `<type>(<scope>): <description>`

Types valides : `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `build`, `revert`, `style`

---

## Observability (Story 1.2)

| Service                               | Rôle                                                                         | Activation                                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **Sentry**                            | Erreurs web + worker, source maps, release tracking, distributed tracing     | `SENTRY_DSN` set                                                                  |
| **Posthog Cloud EU**                  | Analytics produit (anonymisé, RGPD-compliant, host `eu.i.posthog.com` forcé) | `NEXT_PUBLIC_POSTHOG_KEY` set                                                     |
| **Axiom**                             | Logs structurés Pino JSON (3 datasets : web, worker, audit 13 mois)          | `AXIOM_TOKEN` set (prod uniquement)                                               |
| **Vercel Analytics + Speed Insights** | Core Web Vitals real-user, cookie-less                                       | activé via composants `<Analytics />` + `<SpeedInsights />` (auto sur Vercel Pro) |

Tout le code observability skip silencieusement si les env vars sont absentes — boot OK sans aucune credential.

Runbooks détaillés :

- [`docs/runbooks/observability.md`](docs/runbooks/observability.md) — dashboards, validation manuelle, conformité RGPD, incident playbook.
- [`docs/runbooks/vercel-setup.md`](docs/runbooks/vercel-setup.md) — procédure import projet + env vars.
- [`docs/runbooks/branch-protection.md`](docs/runbooks/branch-protection.md) — required status checks `main`.
- [`docs/runbooks/audit-export.md`](docs/runbooks/audit-export.md) — export mensuel logs RGPD vers R2 (13 mois).
- [`docs/runbooks/database.md`](docs/runbooks/database.md) — provisioning Neon, workflows migrations, seed, restauration PITR.

---

## CI/CD (Story 1.2)

- `.github/workflows/ci.yml` : `install` → (`lint`, `typecheck`, `test`, `build`) en parallèle.
- `.github/workflows/e2e.yml` : Playwright (chromium + webkit) + axe-core (NFR-A8 bloquant `serious`/`critical`).
- Preview deployments Vercel par PR (cf. runbook).

---

## Références

- [Architecture complète](_bmad-output/planning-artifacts/architecture.md)
- [PRD SwipeJob](_bmad-output/planning-artifacts/prd.md)
- [UX Design Specification](_bmad-output/planning-artifacts/ux-design-specification.md)
- [Épics & Stories](_bmad-output/planning-artifacts/epics.md)
- [Runbooks opérationnels](docs/runbooks/)

> **Note :** La doc fonctionnelle/architecture est dans `_bmad-output/planning-artifacts/`. La doc opérationnelle (runbooks, ADRs, compliance, API) est dans `docs/`.
