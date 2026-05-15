# Deferred Work

Travaux identifiés mais reportés volontairement. Chaque entrée indique l'origine et la condition de reprise.

## Deferred from: code review of story 1-1-bootstrap-monorepo-turborepo (2026-05-15)

- **Worker `package.json` manque `@swipejob/db` et `@swipejob/llm`** [`apps/worker/package.json:22-23`] — Task 3 ligne 99 exigeait 4 deps internes. Acceptable car stubs non utilisés runtime. **Reprise :** quand Story 1.2 (observability) ou Story 2.1 (worker BullMQ) importera réellement ces packages.
- **`apps/web` `package.json` manque `@swipejob/db` et `@swipejob/llm`** [`apps/web/package.json`] — Task 4 ligne 110. **Reprise :** quand la première Server Action importera `@swipejob/db` (probablement Story 1.3 auth).
- **Pas d'enforcement imports relatifs cross-package** [`packages/config/eslint/base.js`] — Dev Notes story 1.1 ligne 205 demande règle `import/no-restricted-imports`. **Reprise :** Story 1.3+ dès qu'il y a des imports cross-package réels.
- **Health route web `npm_package_version` figé en Docker** [`apps/web/app/api/health/route.ts:11`] — apps/web sur Vercel (pas Docker), moins critique. **Reprise :** à ré-évaluer si déploiement Docker pour `apps/web`.
- **Dockerfile worker `pnpm --filter ...` fragile** [`apps/worker/Dockerfile:24`] — si worker dépend un jour de `@swipejob/db`, `--filter=...` plantera car deps workspace non copiées. **Reprise :** dès que `apps/worker` importera réellement `@swipejob/db` ou `@swipejob/llm`.
- **`wget` Alpine futur fragile pour HEALTHCHECK** [`apps/worker/Dockerfile:55`] — `node:20-alpine` inclut wget aujourd'hui, pas garanti futur. **Reprise :** à monitorer aux bumps de base image, remplacer par `curl` ou script Node si problème.
- **commitlint ESM/CJS interop potentiellement fragile** [`commitlint.config.js:1`] — `@commitlint/config-conventional` reste CJS. Fonctionne via interop, mais pnpm strict pourrait casser silencieusement. **Reprise :** à monitorer ; si des commits non conformes passent, investiguer.
- **Versions deps caret `^` partout (drift potentiel)** [tous `package.json`] — Lockfile gère pour l'instant. **Reprise :** pinner les versions sensibles (Tailwind 4, Next 15, ESLint 9) si instabilité observée.
- **Build worker via `pnpm deploy --prod`** [`apps/worker/Dockerfile`] — optimisation taille image. **Reprise :** quand le worker sera réellement déployé sur Railway et que la taille de l'image deviendra un problème.
- **Stylelint manquant pour cohérence hex couleurs CSS** [`apps/web/app/globals.css`] — minuscule/majuscule incohérente. **Reprise :** à intégrer dans Story 1.2 (CI/CD).
