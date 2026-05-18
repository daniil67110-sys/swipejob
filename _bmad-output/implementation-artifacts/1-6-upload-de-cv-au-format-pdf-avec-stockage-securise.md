# Story 1.6: Upload de CV au format PDF avec stockage sécurisé

Status: done

## Story

As a **étudiant**,
I want **téléverser mon CV PDF (≤10 MB) depuis `/etape-1-cv`, validé MIME + taille côté client ET serveur, stocké en Cloudflare R2 EU via une route signée, avec une entrée `cvs` en DB tracée + audit log `cv.uploaded`, et un message empathique FR + skeleton pendant l'analyse**,
So that **mon profil puisse être généré (Story 1.7), que mes données restent en UE (RGPD), et que je sois rassuré pendant l'attente**.

## Acceptance Criteria

1. **AC1 — Schéma `cvs` + migration**
   - Table `cvs` dans `packages/db/src/schema/cvs.ts` :
     - `id text PK` (cuid2)
     - `userId text NOT NULL REFERENCES users(id) ON DELETE CASCADE`
     - `r2Key text NOT NULL UNIQUE` (chemin objet R2)
     - `originalFilename text NOT NULL`
     - `sizeBytes integer NOT NULL`
     - `mimeType text NOT NULL` (toujours `application/pdf` V1)
     - `parsingStatus enum('pending', 'completed', 'failed') NOT NULL DEFAULT 'pending'`
     - `parsingError text NULL` (last error message si failed)
     - `version integer NOT NULL DEFAULT 1` (pour réuploads)
     - `...timestamps` (created/updated)
     - Index sur `userId`, `parsingStatus`
   - Migration `0003_add_cvs.sql`, enum `cv_parsing_status`.
   - Export dans `packages/db/src/schema/index.ts`.

2. **AC2 — R2 client `apps/web/lib/r2.ts` enrichi**
   - Remplace le stub par un vrai client AWS S3-compat (R2) :
     - Deps : `@aws-sdk/client-s3 ^3.x` + `@aws-sdk/s3-request-presigner ^3.x`
     - Helper `uploadCvToR2({ buffer, contentType, key })` → upload server-side
     - Helper `generateR2Key(userId, filename, version)` → `users/<userId>/cvs/v<version>/<cuid2>.pdf`
   - Mode conditionnel : si `R2_ACCESS_KEY_ID` absent → log warn + retourne mock `{ ok: true, mock: true, key }` (boot OK en dev sans creds).
   - `isR2Configured = Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_BUCKET_NAME)` exporté.

3. **AC3 — Route handler `POST /api/cv/upload`**
   - `app/api/cv/upload/route.ts` (Node runtime, pas Edge — argon2/R2/multipart) :
     - `await requireVerifiedAuth({})` (Story 1.5)
     - Parse `FormData` du body, récupère le fichier `file`
     - Valide :
       - MIME : `file.type === 'application/pdf'` (sinon 400)
       - Taille : `file.size <= 10 * 1024 * 1024` (sinon 413)
       - Magic bytes : 4 premiers bytes = `%PDF` (anti-content-type spoofing)
     - Génère `r2Key`, upload R2 server-side
     - Insert row `cvs` (status='pending', version=N+1)
     - Audit log `cv.uploaded` (metadata `{ size: N, version: N }`, jamais le filename original car PII)
     - Posthog `cv.uploaded` avec hashUserId
     - Stub BullMQ enqueue `cv.parse` (V1 : log warn "queue non configurée, parsing skip" — la real queue arrive Story 2.1)
     - Return `{ ok: true, data: { cvId, parsingStatus: 'pending' } }` JSON
   - Wrappé avec `withErrorHandler` (trace ID Story 1.2).
   - Rate limit 10 uploads/h/user (réutilise pattern Upstash).

4. **AC4 — Page `/etape-1-cv` enrichie : upload UI**
   - `app/(onboarding)/etape-1-cv/page.tsx` modernisée :
     - Server component : `requireVerifiedAuth({})`, check si user a déjà un CV → afficher status
     - Si pas de CV → afficher `<CvUploader />` client component
     - Si CV `status='pending'` → afficher skeleton + message FR empathique (UX-DR18 + DR19) "On analyse ton CV, ça prend environ 8 secondes…"
     - Si `status='completed'` → CTA "Vérifier les infos extraites" → `/etape-1-cv/revue` (Story 1.7)
     - Si `status='failed'` → message FR + bouton "Réessayer"
   - `<CvUploader />` (client) :
     - Input `<input type="file" accept="application/pdf" />` + zone visuelle drop simple (V1 : pas de drag-drop poussé, juste input stylé)
     - Validation côté client (MIME + size) avant upload
     - Upload via `fetch('/api/cv/upload', { method: 'POST', body: formData })`
     - États : idle / validating / uploading (progress visible) / success / error
     - Messages FR bienveillants (UX-DR27)

5. **AC5 — Validation + sécurité**
   - Validation magic bytes serveur (anti-MIME spoofing) : reject si pas `%PDF`
   - Limite stricte 10 MB serveur (anti-DoS)
   - Aucune exécution / parsing PDF dans la route (juste upload+stockage) — le parsing est en Story 1.7 via worker
   - R2 keys avec UUID/cuid2 → pas de collision + pas devinable
   - Pas de stockage du filename original dans audit_logs (PII)

6. **AC6 — UX skeleton + messages FR**
   - Composant `<CvProcessingSkeleton />` : 3 lignes shimmer + texte "On analyse ton CV, ça prend environ 8 secondes…"
   - Aria-live polite sur la zone de status pour annoncer les changements aux lecteurs d'écran
   - Touch targets ≥44px (NFR-A4)
   - Boutons disabled pendant upload pour éviter double-submit

7. **AC7 — Tests Vitest + e2e**
   - `apps/web/lib/r2.test.ts` : `generateR2Key` produit le bon format, mode mock retourne `{ ok: true, mock: true }`
   - `apps/web/e2e/cv-upload.spec.ts` : page `/etape-1-cv` accessible (auth requise) + form visible

8. **AC8 — Env + runbook + mode conditionnel**
   - `.env.example` enrichi avec `R2_ENDPOINT`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`
   - `apps/web/lib/env.ts` ajoute ces vars + flag `isR2Configured`
   - Runbook `docs/runbooks/cloudflare-r2.md` : créer bucket EU + IAM user + policy + DNS
   - Story `done` quand : lint + typecheck + test + build + format + commit OK

## Tasks / Subtasks

1. **Schéma cvs**
   - [ ] `packages/db/src/schema/cvs.ts`
   - [ ] Update `index.ts` + `drizzle.config.ts`
   - [ ] `pnpm db:generate` → 0003

2. **Deps**
   - [ ] `pnpm --filter @swipejob/web add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner`

3. **Lib r2 enrichi**
   - [ ] `apps/web/lib/r2.ts` : client S3 + upload + generateR2Key + mock mode
   - [ ] Tests Vitest

4. **Env**
   - [ ] `apps/web/lib/env.ts` + flags + warn prod
   - [ ] `.env.example` enrichi

5. **Route handler**
   - [ ] `app/api/cv/upload/route.ts`
   - [ ] Rate limit `cvUploadRateLimit` (10/h/user) dans `rate-limit.ts`

6. **UI**
   - [ ] `app/(onboarding)/etape-1-cv/page.tsx` mis à jour
   - [ ] `app/(onboarding)/etape-1-cv/CvUploader.tsx`
   - [ ] `app/(onboarding)/etape-1-cv/CvProcessingSkeleton.tsx`

7. **Runbook**
   - [ ] `docs/runbooks/cloudflare-r2.md`

8. **Tests e2e**
   - [ ] `apps/web/e2e/cv-upload.spec.ts`

9. **Validation finale**
   - [ ] lint + typecheck + test + build + format + commit + Story `done`

## Dev Notes

### R2 vs S3 SDK

Cloudflare R2 implémente l'API S3 → on utilise le SDK AWS S3 avec un endpoint custom :
```ts
new S3Client({
  region: 'auto',
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});
```

### Pourquoi POST multipart au lieu de presign client

Presign client (URL signée → upload direct par le browser) éviterait le passage serveur. Mais :
1. V1 simplicité : un seul flow, validation centralisée
2. Magic bytes check côté serveur (anti-spoofing) impossible si client direct
3. Audit log fiable (côté client peut mentir)
4. Quota/rate-limit fiable côté serveur

Trade-off : ~3 MB en mémoire serveur pendant l'upload (la limite 10 MB s'applique mais en pratique CV est petit). Acceptable V1 sur Vercel (lambda 256MB).

V2 : passer en presign si la taille devient un souci.

### BullMQ stub V1

Story 2.1 (TECH-005) implémente la queue. En 1.6 on ne fait que :
- Insert row `cvs` avec `status='pending'`
- Log warn "queue non configurée, parsing skip"
- Si queue dispo → enqueue (mais V1 elle ne l'est pas)

Story 1.7 (worker parsing) débloquera le flow.

### Architecture sources

- `epics.md` L511-528 (AC)
- `architecture.md` L863 (R2 owner web/worker), L823 (Onboarding & Profile mapping → CvUploader)

## Change Log

- 2026-05-18 : Story créée à partir de epics.md L511-528. Status: ready-for-dev.
- 2026-05-18 : Implémentation complète. Migration `0003_add_cvs` + enum cv_parsing_status. Lib `r2.ts` enrichi avec SDK S3 + mock mode + namespacing `users/<id>/cvs/v<n>/<cuid>.pdf`. Route handler `POST /api/cv/upload` (Node runtime, auth+consent+rate-limit+MIME+size+magic-bytes checks, upload R2, insert cvs, audit, Posthog, stub enqueue). UI `/etape-1-cv` enrichie (CvUploader client + CvProcessingSkeleton + branches pending/completed/failed). Runbook cloudflare-r2.md. Tests 35 Vitest pass (4 db + 31 web), build OK.
- 2026-05-18 : Status `done` + commit.
