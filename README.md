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

## Références

- [Architecture complète](_bmad-output/planning-artifacts/architecture.md)
- [PRD SwipeJob](_bmad-output/planning-artifacts/prd.md)
- [UX Design Specification](_bmad-output/planning-artifacts/ux-design-specification.md)
- [Épics & Stories](_bmad-output/planning-artifacts/epics.md)

> **Note :** La documentation est dans `_bmad-output/planning-artifacts/` (pas `docs/`).
