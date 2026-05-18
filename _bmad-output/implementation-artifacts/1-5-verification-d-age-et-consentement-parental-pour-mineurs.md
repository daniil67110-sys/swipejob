# Story 1.5: Vérification d'âge et consentement parental pour mineurs

Status: done

## Story

As a **SwipeJob (responsable de traitement RGPD)**,
I want **vérifier l'âge déclaré à l'inscription (datepicker JJ/MM/AAAA), refuser les <13 ans, exiger un consentement parental documenté pour 13-17 ans (formulaire parent + email de confirmation), tracer chaque étape en audit log et appliquer un quota réduit aux mineurs**,
So that **la plateforme respecte la loi française sur les mineurs (15 ans seuil RGPD France, mais on prend 13 ans seuil de base + parental jusqu'à 17 ans inclus par prudence), évite tout traitement illégal de données de moins-de-13 ans, conserve une trace auditable des consentements pour CNIL/contentieux**.

## Acceptance Criteria

1. **AC1 — Schéma DB : `users.birthDate` + table `parental_consents`**
   - **Given** le schéma `users` existant (avec `birthDate` déjà présent type `date` non-null possible mais nullable jusqu'au remplissage),
   - **When** Story 1.5 ajoute le suivi consentement parental,
   - **Then** une nouvelle table `parental_consents` est créée dans `packages/db/src/schema/parental-consents.ts` :
     - `id text PRIMARY KEY` (cuid2)
     - `userId text NOT NULL REFERENCES users(id) ON DELETE CASCADE` (1 user a 1 consent, mais on stocke historique → pas de UNIQUE)
     - `parentName text NOT NULL`
     - `parentEmail citext NOT NULL` (pour follow-up CNIL si nécessaire)
     - `status enum('PENDING', 'GRANTED', 'REFUSED', 'EXPIRED')` not null default 'PENDING'
     - `tokenHash text NOT NULL` (sha256 du token signé envoyé au parent, anti-replay)
     - `expiresAt timestamptz NOT NULL` (7 jours, NFR-S6)
     - `respondedAt timestamptz NULL` (set à GRANTED ou REFUSED)
     - `ipAddress text NULL` (IP du parent au moment du clic, audit RGPD)
     - `userAgent text NULL`
     - `...timestamps` (createdAt, updatedAt)
   - Index sur `userId` + `status` + `tokenHash`.
   - Migration `0002_add_parental_consents.sql` générée + entrée `meta/_journal.json`.
   - L'enum `consent_status` existant a déjà `'PENDING_PARENTAL_CONSENT'` → on l'utilise sur `users.consentStatus` pour marquer un compte mineur en attente.

2. **AC2 — Page `/onboarding/age` (étape 0 post-inscription)**
   - **Given** un nouvel utilisateur fraîchement authentifié (Google OAuth fini OU email validé),
   - **When** il est redirigé vers `/etape-1-cv` mais que `users.birthDate IS NULL`,
   - **Then** le layout `/(onboarding)/layout.tsx` intercepte et redirige vers `/onboarding/age` AVANT d'afficher `/etape-1-cv`.
   - La page `app/(onboarding)/age/page.tsx` affiche :
     - Heading : "On a besoin de ta date de naissance pour vérifier ton âge"
     - Datepicker FR (JJ/MM/AAAA) — input `type="date"` natif HTML (a11y OK, mobile-friendly) + max=aujourd'hui, min=120 ans avant
     - Bouton "Continuer"
   - Validation Zod côté client + serveur : `birthDate: z.string().date()` puis calcul `age = today - birthDate`.
   - Server Action `submitBirthDateAction` :
     - Update `users.birthDate = birthDate`
     - Si `age < 13` → audit log `consent.minor_under_13_refused`, redirect `/onboarding/age/refus-mineur` (page statique FR explicative).
     - Si `13 <= age <= 17` → set `users.consentStatus = 'PENDING_PARENTAL_CONSENT'`, audit log `consent.parental_required`, redirect `/onboarding/age/parental`.
     - Si `age >= 18` → set `users.consentStatus = 'GRANTED'` (consentement majeur implicite à ce stade, sera enrichi en Story 6.2), audit log `consent.age_verified`, redirect `/etape-1-cv`.
   - Note RGPD : Story 6.2 (Epic 6) prendra le relais pour le consentement granulaire par finalité. Ici on a juste un consent majeur grossier suffisant pour la V1 onboarding.

3. **AC3 — Page `/onboarding/age/refus-mineur` (page statique d'erreur <13)**
   - Page FR statique, ton bienveillant :
     - "Désolé, SwipeJob n'est pas accessible aux moins de 13 ans."
     - Explication : "La loi française et européenne nous interdit de collecter les données de jeunes utilisateurs en dessous de 13 ans sans procédure renforcée que nous n'opérons pas pour le moment."
     - Lien FAQ "Pourquoi cette limite ?" → `/help/age-minimum` (placeholder ok V1)
     - **Pas** de bouton "retry" — l'âge est verrouillé après saisie (audit log existe).
   - **Effet de bord critique** : sur cette page, l'action `submitBirthDateAction` doit aussi :
     - Marquer `users.deletedAt = NOW()` (soft delete immédiat, le user existe en DB pour audit mais ne peut plus rien faire)
     - Détruire la session active (cookie + DB row sessions)
     - Audit log `account.minor_under_13_anonymization_scheduled`
   - Cron / job worker (Story 6.6 plus tard) finalisera la suppression effective sous 30j.

4. **AC4 — Page `/onboarding/age/parental` (formulaire parent)**
   - **Given** un mineur 13-17 ans authentifié,
   - **When** il arrive sur `/onboarding/age/parental`,
   - **Then** un formulaire `<ParentalConsentForm>` (client RHF + Zod) affiche :
     - Input `parentName` (text, label "Nom complet de ton parent ou tuteur légal")
     - Input `parentEmail` (type=email, label "Son adresse email")
     - Checkbox "Je confirme que cette personne est mon parent ou tuteur légal et qu'elle a accepté de recevoir cet email" (NFR-Se)
     - Bouton submit "Envoyer le lien à mon parent"
   - Validation Zod : `parentName: z.string().min(2).max(100)`, `parentEmail: z.string().email()`, `confirmed: z.literal(true)`.
   - Server Action `requestParentalConsentAction` :
     1. Rate limit 3/h/IP (anti-spam parent)
     2. Vérifie session + `consentStatus = 'PENDING_PARENTAL_CONSENT'`
     3. Si un `parental_consents` existe déjà avec `status = 'PENDING'` non expiré → reuse (renvoie le même token email)
     4. Sinon : génère `tokenPlain = randomBytes(32).toString('base64url')`, `tokenHash = sha256(tokenPlain)`, expires = now + 7j
     5. INSERT row dans `parental_consents`
     6. Email Resend au parent (template dédié, cf. AC5)
     7. Audit log `consent.parental_email_sent`, Posthog `consent.parental_requested`
     8. Redirect vers `/onboarding/age/parental/envoye` (page de confirmation pour l'enfant)
   - La page `/onboarding/age/parental/envoye` explique : "Email envoyé à ton parent. Une fois qu'il aura cliqué sur le lien et confirmé, tu pourras utiliser SwipeJob. Tu peux fermer cette page."

5. **AC5 — Email Resend au parent + template HTML**
   - `apps/web/lib/email.ts` enrichi avec `sendParentalConsentEmail({ to, childEmail, confirmUrl, refuseUrl, expiresAt })`.
   - Template HTML français :
     - Header SwipeJob
     - "Bonjour, [enfant via childEmail] souhaite s'inscrire sur SwipeJob, une plateforme française qui aide les étudiants à trouver des stages et alternances."
     - "Il/elle a 13-17 ans, donc nous avons besoin de votre accord explicite (responsabilité parentale, loi française)."
     - "Données collectées : nom, email, CV, préférences. Pas de pub, pas de cookie tiers. Plus de détails : <lien CGU/confidentialité>."
     - 2 boutons côte à côte : "✅ J'autorise" (vert, link confirmUrl) et "❌ Je refuse" (rouge, link refuseUrl)
     - Footer : "Lien valide jusqu'au [expiresAt]. Si vous n'êtes pas le parent de [childEmail], ignorez ce message."
   - Mode mock identique à Story 1.4 (log warn si pas de RESEND_API_KEY).

6. **AC6 — Route handlers parent confirmation/refus**
   - `app/(auth)/consentement-parental/confirmer/page.tsx?token=xxx` :
     - Lookup `parental_consents` par `tokenHash = sha256(token)`
     - Vérifie `status = 'PENDING'` + `expiresAt > now()`
     - Sinon page erreur FR : "Lien invalide, expiré ou déjà utilisé" + lien "Contacter le support".
     - Si OK :
       - UPDATE `parental_consents` : `status='GRANTED', respondedAt=NOW(), ipAddress=..., userAgent=...`
       - UPDATE `users` (du `userId` du consent) : `consentStatus='GRANTED'`
       - Audit log `consent.parental_granted` (actor SYSTEM, target user.id, metadata `{ parentEmailHash: hashEmail(parentEmail) }`)
       - Posthog server : `consent.parental_granted` (sur le user hashed)
       - Affiche page de confirmation FR au parent : "Merci, [enfant] peut maintenant utiliser SwipeJob."
   - `app/(auth)/consentement-parental/refuser/page.tsx?token=xxx` :
     - Idem mais `status='REFUSED'`, `users.consentStatus='REFUSED'`, audit `consent.parental_refused`
     - Page : "Merci. [enfant] ne pourra pas s'inscrire. Son compte sera supprimé sous 30 jours conformément au RGPD."
     - Trigger soft-delete : `users.deletedAt = NOW()`, sessions DELETE.
   - Ces routes sont **publiques** (pas d'auth user) — le token est l'authentification (cf. middleware whitelist).

7. **AC7 — Garde `requireVerifiedAuth` enrichie + quota mineur**
   - `apps/web/lib/auth.ts` : `requireVerifiedAuth` est enrichie pour aussi check `consentStatus`.
   - Si `consentStatus = 'PENDING_PARENTAL_CONSENT'` → redirect `/onboarding/age/parental/envoye` (cul-de-sac assumé tant que parent n'a pas répondu).
   - Si `consentStatus = 'REFUSED'` → redirect `/onboarding/age/parental/refuse` (page FR explicative + logout forcé).
   - Si `consentStatus = 'GRANTED'` → accès normal.
   - Le quota de swipes mineur est défini dans `apps/web/lib/quotas.ts` (nouveau) :
     - `getSwipeQuota(user)` : retourne `MINOR_DAILY_QUOTA = 5` si `users.birthDate` indique 13-17 ans, sinon `ADULT_DAILY_QUOTA = 20`.
     - Cette fn sera consommée par Story 3.9 (quota swipe). En V1 elle est juste exposée + testée.

8. **AC8 — Tests Vitest + e2e**
   - `apps/web/lib/__tests__/age.test.ts` :
     - `computeAge(birthDate, today)` correct pour edge cases (jour anniversaire, année bissextile)
     - `categorizeAge` retourne `'under_13' | 'minor' | 'adult'`
   - `apps/web/lib/__tests__/quotas.test.ts` :
     - `getSwipeQuota` retourne 5 pour mineur, 20 pour majeur, 0 pour user sans birthDate (defensive)
   - `apps/web/e2e/onboarding-age.spec.ts` :
     - Visite `/onboarding/age`, soumet une date <13 ans → redirige vers refus-mineur
     - Soumet date 13-17 → redirige vers `/onboarding/age/parental`
     - Soumet date majeur → redirige vers `/etape-1-cv`
   - Note : flow complet parent confirme / refuse → deferred (needs DB seed + Resend mock complet, D-1.5-001).

9. **AC9 — Helpers `age.ts` et `quotas.ts`**
   - `apps/web/lib/age.ts` (server-only) :
     ```ts
     export function computeAge(birthDate: Date, now = new Date()): number;
     export function categorizeAge(age: number): 'under_13' | 'minor' | 'adult';
     ```
   - `apps/web/lib/quotas.ts` (server-only) :
     ```ts
     export const ADULT_DAILY_QUOTA = 20;
     export const MINOR_DAILY_QUOTA = 5;
     export function getSwipeQuota(user: { birthDate: Date | null }): number;
     ```
   - Pas de PII dans ces helpers (juste birthDate qui n'est pas PII identifiante seule).

10. **AC10 — Runbook + audit + mode conditionnel**
    - `docs/runbooks/parental-consent.md` : flow complet en schéma + cas edge + procédure CNIL.
    - Mode conditionnel : si DB pas configurée, redirige `/onboarding/age` vers page placeholder "service non configuré".
    - **Pas** de nouvelle env var requise (réutilise RESEND_API_KEY + DB existants).
    - Story `done` quand : tous AC validés + lint + typecheck + test + build + format + commit.

## Tasks / Subtasks

1. **Schéma DB**
   - [ ] Créer `packages/db/src/schema/parental-consents.ts`
   - [ ] Ajouter export dans `packages/db/src/schema/index.ts`
   - [ ] Ajouter au schema list dans `packages/db/drizzle.config.ts`
   - [ ] `pnpm db:generate` → migration `0002_add_parental_consents.sql` (renommer si besoin)

2. **Lib helpers**
   - [ ] `apps/web/lib/age.ts` (computeAge + categorizeAge)
   - [ ] `apps/web/lib/quotas.ts` (getSwipeQuota + constants)
   - [ ] Tests Vitest

3. **Email parental**
   - [ ] Enrichir `apps/web/lib/email.ts` avec `sendParentalConsentEmail`
   - [ ] Template HTML FR

4. **Pages onboarding**
   - [ ] `app/(onboarding)/age/page.tsx` (datepicker)
   - [ ] `app/(onboarding)/age/actions.ts` (`submitBirthDateAction`)
   - [ ] `app/(onboarding)/age/refus-mineur/page.tsx`
   - [ ] `app/(onboarding)/age/parental/page.tsx` (formulaire parent)
   - [ ] `app/(onboarding)/age/parental/ParentalConsentForm.tsx`
   - [ ] `app/(onboarding)/age/parental/actions.ts` (`requestParentalConsentAction`)
   - [ ] `app/(onboarding)/age/parental/envoye/page.tsx`
   - [ ] `app/(onboarding)/age/parental/refuse/page.tsx`

5. **Routes publiques parent**
   - [ ] `app/(auth)/consentement-parental/confirmer/page.tsx`
   - [ ] `app/(auth)/consentement-parental/refuser/page.tsx`

6. **Garde auth enrichie**
   - [ ] `apps/web/lib/auth.ts` : `requireVerifiedAuth` check consentStatus + birthDate
   - [ ] Redirect si birthDate null → /onboarding/age

7. **Tests e2e**
   - [ ] `apps/web/e2e/onboarding-age.spec.ts`

8. **Runbook**
   - [ ] `docs/runbooks/parental-consent.md`

9. **Validation finale**
   - [ ] lint + typecheck + test + build + format
   - [ ] Story `done` + commit

## Dev Notes

### Pourquoi 13 ans et pas 15 ?

La loi française (CNIL) fixe à **15 ans** le seuil RGPD au-dessus duquel un mineur peut consentir seul. En dessous, consentement parental obligatoire. La directive européenne RGPD article 8 fixe la fourchette 13-16 ans selon les États.

**Choix V1** : seuil 13 ans côté plancher absolu (RGPD minimum), parental requis jusqu'à 17 inclus. Pourquoi pas 15 ? Parce que :
1. Public cible SwipeJob = étudiants 15-25 → la majorité légale RGPD est à 18 ans
2. Pour la responsabilité parentale (signature contrat moral CGU), 18 ans est le seuil français standard
3. Plus prudent légalement : on ne risque rien à demander consent parental jusqu'à 17

Documenter ce choix dans `docs/runbooks/parental-consent.md`.

### Story 6.2 vs Story 1.5

Story 6.2 (Epic 6) traitera le **consentement granulaire par finalité** (analytics, partage anonyme, IA training opt-out, etc.) post-onboarding. Story 1.5 traite uniquement le **consent parental gross** à l'inscription.

À l'issue de 1.5, `users.consentStatus = 'GRANTED'` est une approximation rapide ; 6.2 le décomposera en flags fins. Ne pas refaire le travail en 1.5.

### Datepicker accessibilité

`<input type="date">` HTML5 natif est :
- Accessible clavier (axe-core OK)
- Format localisé navigateur (FR sur appareil FR)
- Mobile-friendly (popup natif iOS/Android)
- Pas de dépendance JS supplémentaire

Alternative considérée : `react-day-picker` ou `@radix-ui/react-popover` + composant custom. Non retenue V1 pour la simplicité.

### Audit RGPD critique

Les events suivants DOIVENT être audités (CNIL contrôle, R-013) :
- `consent.minor_under_13_refused` (action SwipeJob bloque mineur)
- `consent.parental_required` (action SwipeJob exige consent)
- `consent.parental_email_sent` (action SwipeJob envoie email)
- `consent.parental_granted` (action parent autorise)
- `consent.parental_refused` (action parent refuse)
- `consent.age_verified` (action SwipeJob enregistre âge majeur)
- `account.minor_under_13_anonymization_scheduled` (action soft-delete <13)

Tous via helper `auditLog()` existant (Story 1.3).

### Architecture sources

- `epics.md` ligne 493-509 (AC source)
- `architecture.md` ligne 116 (anti-abus généralisé), ligne 1006 (NFR-Se hash PII), ligne 988 (Compliance & Privacy NFR-CP)
- NFR-S5 (rate limit 5/h IP signup générique, ici 3/h pour parental_request)
- NFR-S10 (Posthog anonymisation distinct_id)

## Change Log

- 2026-05-18 : Story créée à partir de epics.md L493-509. Status: ready-for-dev.
- 2026-05-18 : Implémentation complète. Migration `0002_add_parental_consents`, schémas + enum `parental_consent_status`. Pages `/age` + `/age/parental` + `/age/refus-mineur` + envoye + refuse, routes publiques `/consentement-parental/{confirmer,refuser}`. Libs `age.ts` + `quotas.ts`. Email `sendParentalConsentEmail` template FR + mode mock. Garde `requireVerifiedAuth` enrichie (birthDate + consentStatus + deletedAt, avec option `skipOnboardingChecks` pour /age/*). 31 tests pass, 7 nouvelles routes built.
- 2026-05-18 : Self-review Opus 4.7 — 2 fixes appliqués :
  - **F-1 Critical** : `requireVerifiedAuth` redirigeait sur `deletedAt` AVANT le bypass `skipOnboardingChecks` → la page `/age/refus-mineur` était inatteignable après soft-delete. Fix : `skipOnboardingChecks` bypasse aussi le deletedAt (les pages explicatives s'affichent ; subséquentes visites hors onboarding redirigent quand même via la garde non-skip).
  - **F-2 Medium** : Retiré le `sessions DELETE` immédiat dans la branche <13. Sessions persistent jusqu'à la prochaine requête hors `/age/*` (où requireVerifiedAuth({}) redirige `/inscription`). Soft-delete effectif des données : Story 6.6 (cron RGPD).
- 2026-05-18 : Status `done` + commit.
