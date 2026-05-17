# Deferred Work

Travaux identifiés mais reportés volontairement. Chaque entrée indique l'origine et la condition de reprise.

## Deferred from: code review of story 1-1-bootstrap-monorepo-turborepo (2026-05-15)

- ~~**Worker `package.json` manque `@swipejob/db` et `@swipejob/llm`**~~ — **partiellement levé Story 1.2** : `@swipejob/types` migré devDep → dep dans apps/worker car constants `AUDIT_QUEUE_NAME` / Zod schemas importés à runtime (audit-export job). `@swipejob/db` et `@swipejob/llm` toujours absents, à ajouter quand Story 2.x importera.
- **`apps/web` `package.json` manque `@swipejob/db` et `@swipejob/llm`** [`apps/web/package.json`] — Task 4 ligne 110. **Reprise :** quand la première Server Action importera `@swipejob/db` (probablement Story 1.3 auth).
- **Pas d'enforcement imports relatifs cross-package** [`packages/config/eslint/base.js`] — Dev Notes story 1.1 ligne 205 demande règle `import/no-restricted-imports`. **Reprise :** Story 1.3+ dès qu'il y a des imports cross-package réels.
- **Health route web `npm_package_version` figé en Docker** [`apps/web/app/api/health/route.ts:11`] — apps/web sur Vercel (pas Docker), moins critique. **Reprise :** à ré-évaluer si déploiement Docker pour `apps/web`.
- **Dockerfile worker `pnpm --filter ...` fragile** [`apps/worker/Dockerfile:24`] — si worker dépend un jour de `@swipejob/db`, `--filter=...` plantera car deps workspace non copiées. **Reprise :** dès que `apps/worker` importera réellement `@swipejob/db` ou `@swipejob/llm`.
- **`wget` Alpine futur fragile pour HEALTHCHECK** [`apps/worker/Dockerfile:55`] — `node:20-alpine` inclut wget aujourd'hui, pas garanti futur. **Reprise :** à monitorer aux bumps de base image, remplacer par `curl` ou script Node si problème.
- **commitlint ESM/CJS interop potentiellement fragile** [`commitlint.config.js:1`] — `@commitlint/config-conventional` reste CJS. Fonctionne via interop, mais pnpm strict pourrait casser silencieusement. **Reprise :** à monitorer ; si des commits non conformes passent, investiguer.
- **Versions deps caret `^` partout (drift potentiel)** [tous `package.json`] — Lockfile gère pour l'instant. **Reprise :** pinner les versions sensibles (Tailwind 4, Next 15, ESLint 9) si instabilité observée.
- **Build worker via `pnpm deploy --prod`** [`apps/worker/Dockerfile`] — optimisation taille image. **Reprise :** quand le worker sera réellement déployé sur Railway et que la taille de l'image deviendra un problème.
- ~~**Stylelint manquant pour cohérence hex couleurs CSS**~~ — **levé Story 1.2** : stylelint v17 + config-standard installés, `.stylelintrc.json` Tailwind v4-friendly, script `pnpm lint:css`, intégré dans `ci.yml`. 3 violations initiales corrigées (`globals.css`).

## Deferred from: code review of story 1-2-setup-observability-et-pipeline-ci-cd (2026-05-17)

- **`ci.yml` job `install` placebo** [`.github/workflows/ci.yml`] — job sans `upload-artifact`, les autres jobs relancent `pnpm install` à zéro. Cache pnpm store gère effectivement. **Reprise :** quand le temps cumulé des installs devient problématique → refacto avec `actions/upload-artifact` sur `node_modules`.
- **`ci.yml` cache Turbo keyed par `github.sha`** — conforme AC5 mais cache hit principalement via restore-keys. **Reprise :** si temps CI devient un problème, switcher sur une key plus stable (hashFiles sur sources).
- **`traceId` absent du base logger** [`apps/web/lib/logger.server.ts`, `apps/worker/src/lib/logger.ts`] — `x-trace-id` généré par middleware mais pas propagé dans le contexte Pino. **Reprise :** Story 1.3 via AsyncLocalStorage Node.js.
- **`withErrorHandler` wrapper Route Handlers manquant** [`apps/web/lib/`] — pattern architecture.md ligne 604. **Reprise :** Story 1.3+ dès première Route Handler métier.
- **Helper `auditLog(event, payload)` non créé** [`apps/web/lib/audit.ts`] — pattern architecture.md ligne 840. **Reprise :** Story 1.3 (besoin DB `audit_logs` table).
- **Event Posthog `app.bootstrap` non implémenté** [`apps/web/lib/analytics.ts`] — exigé AC2 story 1.2. **Reprise :** Story 1.3 dès `userId`/`distinctId` stable disponible.
- **Playwright e2e jamais exécuté en réel** [`apps/web/e2e/`] — binaire installé, tests écrits, validation CI au premier push GitHub.
- **Validation manuelle Sentry/Posthog/Axiom non réalisée** — faute de credentials user à ce stade. **Reprise :** dès création des comptes (cf. `docs/runbooks/observability.md`).
- **`pino-pretty` absent dans `apps/web`** [`apps/web/package.json`] — logs Next.js server en JSON brut en dev. **Reprise :** quand volume dev justifie.
- **Endpoint admin pour forcer audit-export** [`apps/worker/src/http/`] — exigé AC8 (test 1 execution forcée). **Reprise :** Story 1.3+ avec route admin protégée.
- **`NEXT_PUBLIC_VERCEL_*` côté client `undefined`** [`apps/web/sentry.client.config.ts`] — ces vars ne sont pas auto-exposées côté client. **Reprise :** quand projet Vercel créé → exposer manuellement via `next.config.ts` `env:` block.
- **Test `AUDIT_EXPORT_ENABLED=true` manquant** [`apps/worker/src/jobs/audit-export-monthly.job.test.ts`] — couvre uniquement dry-run par défaut. **Reprise :** mock `process.env` avec vitest setup.
- **Sentry SDK v10 vs v8 spec, Posthog node v5 vs v4** — versions plus récentes installées, à documenter dans ADR future si décision contestée.
