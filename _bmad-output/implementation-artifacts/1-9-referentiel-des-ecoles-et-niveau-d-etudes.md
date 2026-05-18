# Story 1.9: Référentiel des écoles et niveau d'études

Status: done

## Story

As a **étudiant**,
I want **rechercher mon école dans un autocomplete pré-rempli (≥500 écoles FR), choisir mon niveau d'études dans une liste fermée, et tomber sur "Autre" si pas trouvé**,
So that **mon profil soit catégorisé correctement pour le matching**.

## Acceptance Criteria

1. **AC1 — Table `schools` + seed**
   - Schema `schools` : `id`, `name` (text + index trigram), `nameNormalized` (lowercase no accents), `acronym`, `type` (université / école d'ingénieur / BTS / commerce / spécialisée), `city`, `unverified boolean default false` (pour les saisies "Autre").
   - Seed initial **V1 simplifié** : ~50 écoles connues (top écoles FR ingénieurs/commerce/universités). Le PRD demande 500+ → marqué comme **D-1.9-001 deferred** dans la story.
   - Extension `pg_trgm` activée pour fuzzy search (déjà disponible Neon).

2. **AC2 — Endpoint search `/api/schools/search`**
   - `GET /api/schools/search?q=...` retourne `[{ id, name, type, city }]` (max 10).
   - Match fuzzy via `similarity()` Postgres (pg_trgm) sur `nameNormalized`, threshold 0.3.
   - Rate limit 30 req/min/user.

3. **AC3 — Composant `<SchoolAutocomplete>`**
   - Client component avec input + suggestions debounce 250ms.
   - Bouton "Mon école n'est pas listée" → input texte libre marqué `unverified: true` côté DB profile.

4. **AC4 — Niveau d'études fermé**
   - Liste constants : `BTS/DUT`, `Licence`, `Bachelor`, `Master`, `École d'ingénieur`, `Doctorat`.
   - Composant `<EducationLevelSelect>` (radio group).

5. **AC5 — Intégration profile**
   - V1 : nouveau champ `currentSchool` (jsonb) + `educationLevel` (text enum) dans `profiles`.
   - Server Action `setEducationAction({ schoolId?, schoolNameLibre?, educationLevel })`.
   - Audit log `profile.education_updated`.

6. **AC6 — Page `/profil/education`**
   - Page éditable indépendante (V1 : pas de step onboarding dédié — on enrichira `/etape-1-cv/revue` ou on crée une mini-page).
   - **V1 simplification** : exposer le composant dans `/etape-1-cv/revue` comme section additionnelle, plutôt qu'une nouvelle page.

7. **AC7 — Mode conditionnel + tests**
   - Si DB ou trigram indispo → search retourne `[]`, autocomplete affiche "Aucun résultat, utilise 'Autre'".
   - 1 test e2e : la page revue affiche le composant. 

8. **AC8 — Validation finale**
   - lint + typecheck + test + build + format + commit.

## Tasks

1. Schéma `schools` + extension `pg_trgm` + seed ~50 écoles (D-1.9-001 deferred 500+)
2. Migration `0006_add_schools.sql`
3. Profile : `currentSchool jsonb` + `educationLevel text` columns
4. Route `GET /api/schools/search`
5. Composant `<SchoolAutocomplete>` + intégration dans `/etape-1-cv/revue`
6. `<EducationLevelSelect>` constants enum
7. Action `setEducationAction`
8. Validation finale

## Change Log

- 2026-05-18 : Story créée. Status: ready-for-dev. D-1.9-001 deferred (seed 500 écoles V2).
