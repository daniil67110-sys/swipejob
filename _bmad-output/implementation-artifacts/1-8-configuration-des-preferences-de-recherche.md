# Story 1.8: Configuration des préférences de recherche

Status: done

## Story

As a **étudiant**,
I want **définir mes préférences (type de contrat, durée, zones géo, télétravail, secteurs, taille entreprise, fourchette salaire, date de démarrage) sur `/etape-2-preferences` après validation du CV**,
So that **le moteur de matching me propose des offres pertinentes (Stories Epic 2)**.

## Acceptance Criteria

1. **AC1 — Schéma `preferences` + migration**
   - Table `preferences` :
     - `id text PK` (cuid2)
     - `userId text NOT NULL REFERENCES users(id) ON DELETE CASCADE` UNIQUE (1 row par user)
     - `contractTypes text[] NOT NULL DEFAULT '{}'` (stage / alternance)
     - `durations text[] NOT NULL DEFAULT '{}'` (1-3 / 3-6 / 6-12 / 12+ mois)
     - `cities text[] NOT NULL DEFAULT '{}'` (V1 : strings libres)
     - `geoRadiusKm integer` (default 50)
     - `workModes text[] NOT NULL DEFAULT '{}'` (on-site / hybrid / remote)
     - `sectors text[] NOT NULL DEFAULT '{}'`
     - `companySizes text[] NOT NULL DEFAULT '{}'` (TPE / PME / ETI / large)
     - `salaryMinMonthly integer` (€)
     - `salaryMaxMonthly integer`
     - `desiredStartDate date`
     - `...timestamps`
   - Migration `0005_add_preferences.sql`.

2. **AC2 — Page `/etape-2-preferences`**
   - `app/(onboarding)/etape-2-preferences/page.tsx` :
     - `requireVerifiedAuth({})`
     - Fetch éventuelles `preferences` existantes pour pré-remplissage
     - Affiche `<PreferencesForm initial={...} />`
   - `<PreferencesForm>` (client RHF + Zod) multi-sections :
     - **Type contrat** : checkbox multi-select (stage, alternance)
     - **Durée** : checkbox multi (1-3 mois, 3-6, 6-12, 12+)
     - **Villes** : input texte libre (CSV, V1) + slider rayon km
     - **Télétravail** : checkbox (on-site, hybrid, full-remote)
     - **Secteurs** : checkbox multi (tech, finance, marketing, conseil, industrie, santé, public, autre)
     - **Taille entreprise** : checkbox (TPE, PME, ETI, large)
     - **Salaire min/max mensuel** : 2 inputs number
     - **Date démarrage** : input date
   - Tous les champs optionnels — un user peut soumettre sans tout remplir.
   - Bouton "Enregistrer mes préférences" → redirige `/deck` (V1 onboarding fini).

3. **AC3 — Server Action `updatePreferencesAction`**
   - `app/(onboarding)/etape-2-preferences/actions.ts` :
     - Auth + consent check
     - Validation Zod (chaque champ optionnel)
     - UPSERT `preferences` par `userId`
     - Audit log `preferences.updated` (metadata: champs renseignés)
     - Posthog `preferences.set` avec values anonymisées (NFR-S10 : pas de email, pas de city libre — juste les counts/enum)
     - `revalidateTag('user-preferences')` pour invalider le cache server
     - Return `ActionResult<{ redirectTo: string }>`

4. **AC4 — Tests + e2e**
   - `apps/web/e2e/preferences.spec.ts` : redirect /inscription si pas auth ; page accessible si auth complet.

5. **AC5 — Mode conditionnel**
   - Si DB pas configurée → page affiche message "Service non configuré".
   - Story `done` quand lint+typecheck+test+build+format+commit OK.

## Tasks

1. **Schéma** : `packages/db/src/schema/preferences.ts` + migration `0005_add_preferences.sql`
2. **Actions** : `app/(onboarding)/etape-2-preferences/actions.ts`
3. **UI** : `page.tsx` + `PreferencesForm.tsx`
4. **Tests** e2e
5. **Validation** lint+typecheck+test+build+format+commit

## Dev Notes

V1 simplifications :
- Villes : input CSV libre, pas d'autocomplete référentiel (référentiel villes hors scope V1)
- Slider salaire : 2 inputs number plutôt que un vrai slider (a11y plus simple)
- Secteurs : liste fermée hardcoded V1, table référentiel future

Architecture sources : epics.md L551-567, NFR-S10 anonymisation.

## Change Log

- 2026-05-18 : Story créée. Status: ready-for-dev.
