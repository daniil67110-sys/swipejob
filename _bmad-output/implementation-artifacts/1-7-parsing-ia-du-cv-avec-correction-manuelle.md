# Story 1.7: Parsing IA du CV avec correction manuelle

Status: done

## Story

As a **étudiant**,
I want **que SwipeJob extraie automatiquement les infos de mon CV (identité, écoles, expériences, compétences, langues), puis me permette de les vérifier et corriger sur `/etape-1-cv/revue` avant validation finale**,
So that **je n'aie pas à tout retaper, mes données soient justes, et je garde le contrôle**.

## Acceptance Criteria

1. **AC1 — Schéma `profiles` enrichi**
   - Le schéma `profiles` existe déjà (Story 1.2.5). Vérifier qu'il a : `userId`, `firstName`, `lastName`, `headline`, `summary`, `currentLocation`, `linkedinUrl`, `phoneE164`. Ajouter si manquant : `experiences jsonb`, `educations jsonb`, `skills jsonb`, `languages jsonb` (V1 stockage JSON, normalisation Story 1.9 pour écoles).
   - Migration `0004_enrich_profiles.sql`.

2. **AC2 — Lib `cv-parser.ts` (extraction PDF + LLM)**
   - `apps/web/lib/cv-parser.ts` (server-only) :
     - `extractCvText(buffer: Buffer): Promise<string>` — utilise `pdf-parse` (npm)
     - `parseCvWithLLM(text: string): Promise<ParsedCv>` — appel Mistral via `packages/llm` (existant), schéma Zod stricte
   - Schéma Zod `parsedCvSchema` exposé dans `@swipejob/types` : `{ firstName?, lastName?, headline?, summary?, phoneE164?, currentLocation?, linkedinUrl?, experiences[], educations[], skills[], languages[] }`.
   - Mode conditionnel : si `MISTRAL_API_KEY` absent → fallback regex/heuristique simpliste (juste les noms `firstName`/`lastName` depuis le filename si possible) + flag `parsedByFallback: true`.

3. **AC3 — Route handler `POST /api/cv/parse`**
   - `app/api/cv/parse/route.ts` :
     - `requireVerifiedAuth({})`
     - Body : `{ cvId: string }`
     - Fetch row `cvs` (status doit être 'pending')
     - Download R2 object (server-side via SDK)
     - `extractCvText` + `parseCvWithLLM`
     - Upsert row `profiles` pour `userId`
     - Insert `ia_audit_logs` : `{ promptHash, model, latencyMs, success, featuresExtracted }`
     - Update `cvs.parsingStatus = 'completed'` (ou 'failed' avec retry policy 3× ; V1 V1 simplifié à 1 tentative)
     - Audit log `profile.cv_parsed`
     - Posthog `cv.parsed`
     - Return `{ ok: true, data: { profileId, parsedByFallback } }`
   - Trigger : depuis le client `/etape-1-cv` après upload réussi, ou bouton "Analyser le CV" si en attente.

4. **AC4 — Page `/etape-1-cv/revue` (formulaire éditable)**
   - `app/(onboarding)/etape-1-cv/revue/page.tsx` :
     - `requireVerifiedAuth({})`
     - Fetch dernier `cvs` + `profiles`
     - Affiche tous les champs extraits dans un formulaire multi-sections (identité, contact, expériences, écoles, compétences, langues)
     - Bouton "Valider et continuer" → `/etape-2-preferences` (Story 1.8)
   - `ReviewCvForm.tsx` (client) : RHF + Zod, save inline ou submit complet via Server Action `updateProfileAction`.
   - **V1 simplification** : commencer avec un formulaire édition simple (juste identité + headline + summary). Les listes (expériences, écoles, etc.) restent visibles mais non éditables V1 (TODO Story 1.9 + 1.10 pour les enrichir).

5. **AC5 — Server Action `updateProfileAction`**
   - `app/(onboarding)/etape-1-cv/revue/actions.ts` :
     - Auth + consent check
     - Validation Zod
     - UPDATE `profiles` (champs édités uniquement)
     - Audit log `profile.field_updated` par champ modifié (RGPD trail)
     - Posthog `profile.updated`
     - Return `ActionResult<{ redirectTo: string }>`

6. **AC6 — Audit IA + observabilité**
   - Table `ia_audit_logs` (existant Story 1.2.5) reçoit une row par appel LLM :
     - `prompt_hash` (sha256 du prompt, jamais le prompt brut PII)
     - `model` = `'mistral-large-latest'`
     - `latency_ms` mesuré
     - `success` boolean
     - `features_extracted` (jsonb `{ firstNameFound, schoolsCount, … }`)
     - `tokens_input` + `tokens_output` (depuis la réponse API)
   - Conserve 13 mois (NFR-O5).

7. **AC7 — Tests Vitest + e2e**
   - `apps/web/lib/cv-parser.test.ts` : fallback regex sans Mistral retourne ParsedCv vide + flag
   - `apps/web/e2e/cv-revue.spec.ts` : page `/etape-1-cv/revue` redirect /inscription si pas auth

8. **AC8 — Env + runbook + mode conditionnel**
   - `MISTRAL_API_KEY` déjà dans `.env.example`
   - Runbook `docs/runbooks/llm-mistral.md` : créer compte Mistral La Plateforme + API key + monitoring tokens
   - `isLlmConfigured = Boolean(env.MISTRAL_API_KEY)` exporté
   - Story `done` quand : lint + typecheck + test + build + format + commit OK

## Tasks / Subtasks

1. **Schéma profiles enrichi**
   - [ ] Add JSONB columns to `packages/db/src/schema/profiles.ts`
   - [ ] `pnpm db:generate` → `0004_enrich_profiles.sql`

2. **Types partagés**
   - [ ] `packages/types/src/cv.ts` : `parsedCvSchema` Zod

3. **Deps**
   - [ ] `pnpm --filter @swipejob/web add pdf-parse`
   - [ ] `pnpm --filter @swipejob/web add @types/pdf-parse -D`
   - [ ] Vérifier `packages/llm` a Mistral support (ou implémenter minimal)

4. **Lib cv-parser**
   - [ ] `apps/web/lib/cv-parser.ts` (extractCvText + parseCvWithLLM + fallback)
   - [ ] Tests Vitest

5. **Route /api/cv/parse**
   - [ ] `app/api/cv/parse/route.ts`

6. **UI review**
   - [ ] `app/(onboarding)/etape-1-cv/revue/page.tsx`
   - [ ] `ReviewCvForm.tsx` client
   - [ ] `actions.ts` Server Action `updateProfileAction`

7. **Trigger parsing**
   - [ ] CvUploader : après upload succès, fetch `/api/cv/parse` pour déclencher
   - [ ] Ou bouton "Analyser maintenant" sur la page

8. **Runbook**
   - [ ] `docs/runbooks/llm-mistral.md`

9. **Validation finale**
   - [ ] lint + typecheck + test + build + format + commit

## Dev Notes

### Déviation V1 : parsing inline web (pas worker)

L'AC du PRD dit "le worker exécute le job cv.parse via BullMQ". Mais Story 2.1 (worker bootstrap) n'est pas encore faite. **Déviation V1** : on fait le parsing inline dans la route `POST /api/cv/parse` (Node runtime web). Conséquences :
- ✅ Pas besoin d'attendre Story 2.1 pour livrer 1.7
- ✅ Plus simple à débugger
- ⚠️ Temps de réponse de la route inclut l'appel LLM (~5-10s). Acceptable car la route est appelée en background depuis le client (fire-and-forget).
- ⚠️ Pas de retry policy automatique. À implémenter quand worker arrive.

Pattern futur (Story 2.1+) : route web ne fait plus le parsing direct, enqueue BullMQ → worker exécute → DB update → web polling/SSE pour status.

### Schéma parsedCvSchema (Zod)

```typescript
import { z } from 'zod';

const experienceSchema = z.object({
  company: z.string().nullable(),
  title: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  description: z.string().nullable(),
});

const educationSchema = z.object({
  school: z.string().nullable(),
  degree: z.string().nullable(),
  field: z.string().nullable(),
  startYear: z.number().nullable(),
  endYear: z.number().nullable(),
});

export const parsedCvSchema = z.object({
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  headline: z.string().nullable(),
  summary: z.string().nullable(),
  phoneE164: z.string().nullable(),
  currentLocation: z.string().nullable(),
  linkedinUrl: z.string().url().nullable(),
  experiences: z.array(experienceSchema).default([]),
  educations: z.array(educationSchema).default([]),
  skills: z.array(z.string()).default([]),
  languages: z.array(z.string()).default([]),
});

export type ParsedCv = z.infer<typeof parsedCvSchema>;
```

### Prompt Mistral

System prompt en FR :
> Tu es un assistant qui extrait les informations d'un CV en JSON structuré. Retourne UNIQUEMENT un objet JSON valide qui matche le schéma fourni. Pas de markdown, pas de commentaires. Si un champ n'est pas trouvé, retourne null. Pour les listes vides, retourne `[]`.

User prompt : `<schema JSON>\n\n<texte CV>`.

Utilise `response_format: { type: 'json_object' }` si supporté par Mistral.

### Architecture sources

- `epics.md` L530-549 (AC)
- `architecture.md` L332-345 (LLM architecture), L863 (R2 worker read)

## Change Log

- 2026-05-18 : Story créée à partir de epics.md L530-549. Status: ready-for-dev.
- 2026-05-18 : Implémentation complète V1. Migration `0004_enrich_profiles` (headline/summary/linkedinUrl + JSONB experiences/educations/skills/languages). `parsedCvSchema` exporté dans `@swipejob/types`. Lib `cv-parser.ts` avec `extractCvText` (pdf-parse) + `parseCvWithLLM` (Mistral `mistral-large-latest`, fallback regex). Route `POST /api/cv/parse` (sync inline, déviation vs worker BullMQ — sera refactor Story 2.1). Page `/etape-1-cv/revue` avec `ReviewCvForm` (identité éditable, listes lecture seule V1). Trigger fire-and-forget depuis `CvUploader`. Lib runbook `llm-mistral.md`. 36 tests Vitest pass.
- 2026-05-18 : Status `done` + commit.
