# Runbook — Conformité Loi Toubon & i18n (Story 6.7)

Loi du 4 août 1994 (Loi Toubon) : toute communication produite par SwipeJob à
destination du marché français doit être **en français**. Statut V1 : conforme
(aucune chaîne EN détectée par l'audit).

## Architecture

- **`next-intl`** (installé V1) configuré avec une seule locale `fr-FR`.
- Pas de routing localisé (`/fr/...`) — V1 a une locale unique. L'infrastructure
  est prête pour ajouter `en`, `es`, `de` en V2 (NFR-L2) sans refacto.
- Catalogue centralisé : `apps/web/messages/fr-FR.json`.
- Server helper : `getMessages()` / `getTranslations()` (next-intl/server).
- Client helper : `useTranslations()` (next-intl/react).

## Points de vérification

| AC                                        | Statut V1                                                       | Notes                                                               |
| ----------------------------------------- | --------------------------------------------------------------- | ------------------------------------------------------------------- |
| Aucune string EN en dur                   | ✅ Audit `scripts/audit-loi-toubon.mjs` retourne 0 hit          | Pattern curé (faux positifs filtrés)                                |
| `next-intl` configuré avec locale `fr-FR` | ✅ Installé, provider monté dans `app/layout.tsx`               |                                                                     |
| Caractères accentués + typographie FR     | ✅ UTF-8 partout (Next 15 + globalCSS)                          | Espaces insécables, guillemets « », apostrophes courbes ' utilisées |
| Lettres IA en français                    | ✅ Prompt Mistral renforcé (`packages/llm/src/cover-letter.ts`) | Mention explicite "Loi Toubon"                                      |
| Emails transactionnels en français        | ✅ Tous les templates Resend en FR                              |                                                                     |
| Pages SEO publiques en français           | ✅ Toutes les pages publiques sont en FR                        | Story 7.1 (landing), 6.1 (légal)                                    |
| Test E2E `loi-toubon.spec.ts`             | ✅ `apps/web/e2e/loi-toubon.spec.ts`                            | Vérifie `<html lang>` + absence de strings EN typiques              |

## Audit régulier

Le script `scripts/audit-loi-toubon.mjs` peut être ajouté à un check CI (non
bloquant V1, à passer bloquant en V2) :

```bash
node scripts/audit-loi-toubon.mjs
```

Sortie : `✅ Audit Loi Toubon : aucune chaîne EN suspecte détectée.` ou liste
des occurrences avec fichier + ligne + pattern matché.

## Migration progressive des strings

V1 : les chaînes UI restent dans le code (déjà en français). L'infrastructure
`next-intl` est en place pour migration progressive si besoin V2 (ajout d'une
seconde langue).

Pattern d'usage :

```tsx
// Server Component
import { getTranslations } from 'next-intl/server';

export default async function Page() {
  const t = await getTranslations('footer');
  return <footer>{t('tagline')}</footer>;
}

// Client Component
('use client');
import { useTranslations } from 'next-intl';

export function Button() {
  const t = useTranslations('common');
  return <button>{t('continue')}</button>;
}
```

Catalogue actuel : `apps/web/messages/fr-FR.json` (sections `common`, `nav`,
`auth`, `footer`, `rgpd`).

## Étendre à une nouvelle locale (V2)

1. Créer `apps/web/messages/<locale>.json` (copier `fr-FR.json` et traduire).
2. Modifier `apps/web/i18n.ts` :
   - Ajouter à `locales`.
   - Lire la locale depuis un cookie ou header (à designer).
3. Activer un middleware `next-intl/middleware` pour routing localisé si
   souhaité (`/en/...`, `/fr/...`).

## Test E2E Playwright

```bash
cd apps/web
PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm exec playwright test loi-toubon
```

Le test visite les routes publiques (`/`, `/connexion`, `/inscription`, `/cgu`,
`/politique-confidentialite`, `/cookies`, `/mentions-legales`), vérifie que
`<html lang>` commence par `fr`, et qu'aucune string EN typique (`Sign in`,
`Submit`, `Loading...`, etc.) n'apparaît dans le rendu.
