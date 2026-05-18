# Story 1.10: Modification et suppression de profil

Status: done

## Story

As a **utilisateur RGPD-conscient**,
I want **consulter, modifier et supprimer mon profil à tout moment depuis `/profil`**,
So that **je garde le contrôle total sur mes données personnelles**.

## Acceptance Criteria

1. **AC1 — Page `/profil` (consolidée)**
   - `app/(app)/profil/page.tsx` — `requireVerifiedAuth({})`.
   - Affiche : identité (prénom/nom/headline/summary), contact (phone/city/linkedinUrl), école+niveau, expériences, formations, compétences, langues, préférences résumé, CV uploadé (version+filename), bouton "Supprimer mon compte".
   - Liens d'édition par section pointent vers `/etape-1-cv/revue` (existant Story 1.7+1.9) et `/etape-2-preferences` (existant Story 1.8). V1 : pas de nouvelle page d'édition, on réutilise les existantes.

2. **AC2 — Suppression : page `/profil/supprimer`**
   - Étape 1 : alerte de confirmation FR avec liste des conséquences (perte CV, candidatures, profil sous 30j).
   - Étape 2 : saisie email pour confirmer (anti-clic accidentel).
   - Bouton "Confirmer la suppression" → `requestAccountDeletionAction`.

3. **AC3 — Server Action `requestAccountDeletionAction`**
   - Auth + vérifie email saisi == `users.email`.
   - `UPDATE users SET deletedAt = NOW(), consentStatus = 'REFUSED'`.
   - `DELETE sessions WHERE userId = $1` (logout immédiat).
   - Audit log `account.deletion_requested`.
   - Posthog `account.deletion_requested` (hashed id).
   - Stub : enqueue job `rgpd.delete` (log warn V1 — Story 6.5 implémente la queue + delete effectif).
   - Email Resend confirmation au user.
   - Return `{ ok: true, redirectTo: '/' }`.

4. **AC4 — Email confirmation suppression**
   - `lib/email.ts` enrichi avec `sendAccountDeletionEmail({ to })` — template FR : "Ton compte a bien été supprimé. Tes données seront effacées sous 30 jours conformément au RGPD."

5. **AC5 — Tests + e2e**
   - E2E : `/profil` redirige `/inscription` sans auth.
   - E2E : `/profil/supprimer` redirige `/inscription` sans auth.

6. **AC6 — Validation finale**
   - lint + typecheck + test + build + format + commit.

## Tasks

1. Lib email : `sendAccountDeletionEmail`
2. Page `/profil/page.tsx` (consolidée lecture seule + liens édition)
3. Page `/profil/supprimer/page.tsx` (form 2-step)
4. Action `requestAccountDeletionAction`
5. Tests e2e
6. Validation

## Change Log

- 2026-05-18 : Story créée. Status: ready-for-dev.
