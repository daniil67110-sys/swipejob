---
stepsCompleted: ['step-01-init', 'step-02-context', 'step-03-starter']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/product-brief.md'
documentCounts:
  prd: 1
  ux: 1
  briefs: 1
  research: 0
  projectContext: 0
workflowType: 'architecture'
project_name: 'SwipeJob'
user_name: 'Daniil'
date: '2026-05-14'
---

# Architecture Decision Document — SwipeJob

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements :** 65 FRs organisés en 8 zones de capacités fonctionnelles :

- Onboarding & Profile Management (10 FRs) — auth, parsing CV IA, préférences
- Offer Ingestion & Catalog (7 FRs) — ingestion multi-sources, normalisation, déduplication
- Matching & Recommendation (7 FRs) — scoring IA, deck quotidien, explicabilité
- Swipe & Application (11 FRs) — geste tactile, candidature auto, lettre IA, undo
- Communication & Follow-up (7 FRs) — dashboard, statuts, mini-coach pré-entretien
- Engagement & Retention (5 FRs) — streaks, badges, parrainage
- Compliance & Privacy (8 FRs) — RGPD, export/suppression, audit
- Marketing & Acquisition (5 FRs) — SEO pages, sitemap, schema.org
- Admin & Back-office (5 FRs) — modération offres, droits RGPD

**Non-Functional Requirements :** 53 NFRs sur 9 dimensions critiques :

- **Performance** : latence swipe <100ms, FCP <1.5s, LCP <2.5s, bundle JS <200KB initial, Lighthouse ≥90
- **Security** : TLS 1.3, argon2id, AES-256 PII, vault secrets, rate limiting 100 req/min, pentest annuel
- **Scalability** : ×10 sans refonte (300k users), stateless, traitements async, ≤0,15€/user/mois
- **Reliability** : uptime ≥99,5%, RTO <60min, RPO 1h, fallback LLM automatique
- **Accessibility** : WCAG 2.1 AA, axe-core CI, equivalents clavier/bouton pour swipe
- **Integration** : France Travail API + sources secondaires, SMTP EU, Stripe, LLM EU
- **Localization** : français obligatoire (Loi Toubon), i18n-ready
- **Observability** : métriques temps réel, distributed tracing, alerting, logs 30j+13mois
- **Fairness & Algorithmic Accountability** : audit biais trimestriel, features importance, audit manuel <30s, kill switch IA, art. 22 RGPD respecté

### Scale & Complexity Assessment

**Indicateurs de complexité :**

| Dimension | Niveau | Justification |
|---|---|---|
| Real-time | Faible | Pas de chat ni collab live V1. Notifications push quotidiennes uniquement |
| Multi-tenancy | Aucune | App 1-côté (étudiants), pas de comptes entreprise V1 |
| Conformité réglementaire | **Élevée** | RGPD strict + IA Act EU 2026 (matching emploi "haut risque" probable) + Loi Toubon + WCAG AA + Code travail anti-discrimination |
| Intégrations externes | **Moyenne-élevée** | France Travail API + 2-3 scrapers + LLM provider EU + SMTP EU + Stripe + OAuth Google + email read (V2) |
| Complexité UX | **Élevée** | Swipe tactile fluide 60 FPS sur web (techniquement non-trivial), 3 personas distincts, gestion émotionnelle des refus/pénurie |
| Complexité data | **Moyenne** | Offres ingérées + déduplication + embeddings + audit IA trails. Volume cible 30k users → 300k cible scale, 5k+ offres actives en permanence |
| Complexité IA | **Élevée** | Parsing CV LLM + génération lettres LLM + matching sémantique + embeddings + explicabilité (audit IA Act) + fallback dégradé |

**Conclusion sur la complexité globale :** Projet de **complexité moyenne à élevée**, principalement portée par :

1. La conformité (RGPD + IA Act anticipé)
2. La pertinence IA (matching, lettres, parsing CV)
3. La performance UX mobile-web (swipe 60 FPS, perf 3G Slow)
4. Les intégrations data externes (sources d'offres variées)

**Domaine technique principal :** Full-stack web (frontend SPA/PWA + SSR SEO + backend API + workers async + IA pipeline + base de données).

**Estimation composants architecturaux :** ~12-15 modules logiques distincts (auth, profile, ingestion, matching, swipe, candidature, dashboard, notifications, admin, billing, analytics, observability).

### Technical Constraints & Dependencies

**Contraintes dures (non négociables) :**

- **Hébergement données EU obligatoire** (RGPD, souveraineté).
- **LLM provider EU privilégié** (Mistral préféré pour souveraineté, fallback Anthropic EU ou OpenAI EU).
- **Pas de transferts PII hors EU** sans clauses contractuelles validées par DPO.
- **Anonymisation analytics** (pas de PII vers Posthog/Mixpanel).
- **Audit logs immuables** 13 mois minimum (CNIL).
- **Matching auditable et explicable** dès J1 (préparation IA Act).
- **Français obligatoire** dans toute communication externe (Loi Toubon).
- **WCAG 2.1 AA** dès le code (axe-core CI bloquant).

**Contraintes molles (à arbitrer dans les décisions) :**

- Budget infra serré (≤0,15€/user/mois à 30k users).
- Stack moderne 2026 (Next.js 15 déjà cadré côté UX).
- Pas d'app store en V1 → PWA suffisante.
- Équipe à petite (~5 ETP cumulés sur 6 mois MVP) → privilégier outils managés vs DevOps lourd.

**Dépendances externes critiques :**

- France Travail API (clé API à demander, quota négociable)
- LLM provider (Mistral / Anthropic / OpenAI EU)
- SMTP EU (SendGrid / Mailgun / AWS SES Frankfurt)
- Stripe (paiement V2)
- OAuth Google (auth principale)

### Cross-Cutting Concerns Identified

Préoccupations transversales qui affecteront plusieurs composants :

1. **Conformité RGPD partout** — consentements, audit logs, droit accès/suppression touchent tous les modules manipulant des PII.
2. **Explicabilité IA partout** — tout calcul de matching, génération de lettre, suggestion d'élargissement doit logger ses features contributives (audit IA Act).
3. **i18n-ready** — même si V1 français only, l'architecture doit supporter une expansion EU sans refonte (NFR-L2). Strings externalisés dès J1.
4. **Observability native** — métriques santé, distributed tracing, audit logs structurés intégrés dès le bootstrap (NFR-O1 à O5).
5. **Fail-soft des composants IA** — chaque appel LLM doit avoir un fallback dégradé (matching keyword, lettre template) pour ne jamais bloquer l'utilisateur.
6. **Anti-abus généralisé** — rate limiting global, cap quotidien, détection rage swipe, modération offres ingérées.
7. **Préparation V2 marketplace 2-côtés** — schémas data extensibles pour ajouter le côté entreprise sans migration douloureuse.
8. **Accessibilité native** — pas un patch en fin de projet, intégré dès la conception des composants.
9. **Mobile-first absolu** — toute décision côté backend doit considérer la latence réseau mobile (3G/4G) et l'autonomie batterie.
10. **PWA offline-friendly** — service worker stratégique, gestion file d'attente candidatures, sync à la reconnexion.

### Architectural Implications

À ce stade, la combinaison contraintes + scale suggère :

- **Monolithe modulaire** plutôt que microservices — équipe trop petite, complexité moyenne, pas de besoins de scaling indépendants V1. Modules bien isolés pour faciliter extraction future si nécessaire.
- **Backend stateless** + **queues asynchrones** pour les traitements lourds (parsing CV, embeddings, génération lettres, ingestion offres, envoi emails).
- **PostgreSQL central** avec pgvector pour embeddings (évite l'ajout d'une base vectorielle séparée, économie d'infra).
- **Hosting managé** (Vercel pour frontend SSR/SSG, Render/Railway/Scaleway pour backend + workers) plutôt que self-hosted Kubernetes (anti-pattern pour une équipe de 5).
- **Edge functions** envisageables pour les pages SEO publiques (Vercel Edge ou Cloudflare).
- **Approche progressive** : on commence simple (monolithe + queues + DB), on extrait seulement si la scale ou la séparation des cycles le justifient.

## Starter Template Evaluation

### Primary Technology Domain

**Full-stack web** avec deux surfaces distinctes :

- Frontend SSR/SSG (marketing, SEO) + SPA/PWA authentifiée (deck, dashboard, profil)
- Backend avec workers asynchrones (IA pipeline, ingestion offres, envoi emails)

### Starter Options Considered

Trois starters ont été évalués pour le bootstrap :

| Option | Forces | Faiblesses | Décision |
|---|---|---|---|
| `create-t3-app` (T3 Stack) | Batteries incluses (Next.js + tRPC + Prisma + NextAuth), type-safety, communauté forte | Locked sur tRPC (incompatible si backend Python séparé pour IA), single-package non monorepo | Rejeté |
| `create-next-app` + setup manuel | Flexibilité maximale, contrôle total | Temps de bootstrap élevé, pas de structure monorepo | Rejeté |
| **Turborepo monorepo** | Sépare frontend/workers, partage packages, standard industrie 2025-2026, extensible vers backend Python sans refonte | Courbe d'apprentissage légère pour ceux pas familiers avec monorepos | **Sélectionné** |

### Selected Starter: Turborepo monorepo + Next.js 15

**Rationale for Selection :**

1. **Sépare proprement les deux surfaces de l'app** : `apps/web` (frontend tout-en-un Next.js avec marketing SSR + app PWA) et `apps/worker` (workers asynchrones Node.js pour IA et ingestion).
2. **Évite la coupling tRPC** prématurée. L'API entre frontend et backend reste flexible (REST, Server Actions, ou éventuellement tRPC plus tard).
3. **Permet l'ajout d'un `apps/api` Python en V2** si le pipeline IA bénéficie d'un écosystème ML séparé, sans refonte du monorepo.
4. **Standard industrie 2025-2026** — Vercel, Linear, CalCom, Resend utilisent Turborepo. Documentation excellente, hiring facilité.
5. **Cohérent avec NFR-Sc3 du PRD** (traitements asynchrones via queue) — la séparation worker / web est native.
6. **Partage des packages** : composants UI shadcn (`packages/ui`), schémas DB (`packages/db`), types (`packages/types`), wrappers LLM (`packages/llm`).

### Initialization Command

```bash
# Bootstrap initial
pnpm dlx create-turbo@latest swipejob --use-pnpm
cd swipejob

# Adapter la structure
mv apps/docs apps/worker         # remplacer le default docs par worker
# (Reconfigurer apps/worker comme service Node.js standalone)

# Setup app frontend
cd apps/web
pnpm dlx shadcn@latest init -d   # New York, Neutral, CSS vars
pnpm dlx shadcn@latest add button input label avatar badge dialog sheet toast tabs tooltip dropdown-menu select switch slider skeleton progress alert separator scroll-area form
pnpm add framer-motion lucide-react sonner next-themes
pnpm add @tanstack/react-query zod react-hook-form @hookform/resolvers

# Setup worker
cd ../worker
pnpm add hono bullmq ioredis pino
pnpm add -D tsx typescript @types/node
```

**Note** : Cette initialisation doit constituer la **première story d'implémentation** du sprint 1 (ticket "TECH-001: Bootstrap monorepo Turborepo").

### Architectural Decisions Provided by Starter

**Language & Runtime :**

- TypeScript 5.x partout (strict mode, `noUncheckedIndexedAccess: true`)
- Node.js 20 LTS (compatibilité Next.js 15, support stable jusqu'en avril 2026)
- pnpm comme package manager (vitesse, workspaces natifs, mieux que npm/yarn pour monorepos)

**Styling Solution :**

- Tailwind CSS 4 (mode CSS-in-CSS, perf de build améliorée)
- shadcn/ui pour les composants UI (copiés dans le code, pas de dépendance lib)
- Radix UI Primitives pour l'accessibilité (sous le capot de shadcn)
- next-themes pour le mode clair/sombre

**Build Tooling :**

- Turborepo pour orchestrer build/test/lint multi-packages
- Next.js compiler (Turbopack en dev pour vitesse, Webpack pour prod en attente de Turbopack stable prod)
- pnpm workspaces pour les dépendances inter-packages

**Testing Framework :**

- Vitest pour les tests unitaires (rapide, compatible Jest API)
- Playwright pour les tests E2E (avec axe-core pour accessibilité)
- Storybook v8+ pour la documentation visuelle des composants (post-V1)
- MSW (Mock Service Worker) pour mocker les API en tests

**Code Organization :**

```
swipejob/
├── apps/
│   ├── web/                    # Next.js 15 (frontend + Server Actions)
│   │   ├── app/                # App Router (Next.js 15)
│   │   │   ├── (marketing)/    # Pages SSR/SSG publiques www.*
│   │   │   ├── (app)/          # App authentifiée app.*
│   │   │   ├── api/            # Route handlers (REST endpoints)
│   │   │   └── layout.tsx
│   │   ├── components/         # Composants spécifiques à l'app
│   │   └── lib/                # Utils, hooks, clients
│   └── worker/                 # Node.js workers (BullMQ jobs)
│       ├── src/
│       │   ├── jobs/           # CV parsing, embedding, lettre IA, ingestion, email
│       │   ├── queues/         # Définition des queues BullMQ
│       │   └── index.ts
│       └── package.json
├── packages/
│   ├── ui/                     # Composants shadcn partagés
│   ├── db/                     # Schémas Drizzle ou Prisma + migrations
│   ├── llm/                    # Wrappers LLM (Mistral, Anthropic fallback)
│   ├── types/                  # Types TypeScript partagés
│   └── config/                 # ESLint, TS, Tailwind config partagée
├── turbo.json                  # Config Turborepo
├── pnpm-workspace.yaml
└── package.json
```

**Development Experience :**

- **Hot reloading** : Turbopack côté Next.js (instant), tsx watch côté worker
- **Type-checking incrémental** via Turborepo cache (réutilise les builds non modifiés)
- **Lint-staged** + **Husky** pour pre-commit (ESLint, Prettier, type-check)
- **Conventional Commits** + **commitlint** pour cohérence
- **GitHub Actions** ou **GitLab CI** pour CI/CD (lint, type, test, build, preview deploys)
- **Preview URLs** automatiques sur Vercel pour les PRs (validation visuelle rapide)

### Why NOT a "Battery-Included" Starter Like T3

T3 Stack est excellent pour des full-stack apps mono-codebase. Mais SwipeJob a deux caractéristiques qui ne matchent pas :

1. **Backend lourd asynchrone** — IA pipeline, scrapers, génération de lettres, ingestion d'offres. Ces traitements n'ont rien à faire dans des Server Actions Next.js (timeouts, scaling indépendant). Il faut un service worker séparé, typiquement Node.js + BullMQ ou Python + Celery.

2. **Potentielle migration vers Python pour l'IA** en V2 — si on veut tirer parti d'écosystèmes ML mature (sentence-transformers, scikit-learn, custom models). T3 Stack force une boucle frontend-backend tRPC qui est lourde à dédoubler.

Le monorepo Turborepo permet d'avoir une stack simple en V1 (tout Node), et de basculer un service vers Python en V2 sans tout casser.
