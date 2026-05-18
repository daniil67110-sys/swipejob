# Story 2.14: Performance du calcul de deck post-upload CV

Status: done

## Story

As a **étudiant venant d'uploader son CV**,
I want **voir mon premier deck généré en moins de 8s après validation du CV, avec skeleton pendant l'attente**,
So que **l'onboarding soit fluide**.

## Implémentation V1

### Trigger job prioritaire

- Action `updateProfileAction` (Story 1.7 `/etape-1-cv/revue`) enqueue un job `compute.first` sur queue `match-compute` avec priority haute (BullMQ `priority: 1`).
- Job traite uniquement le user concerné (pas batch).
- Logique : compute embedding user + top-200 ANN + composite top-15 → upsert match_scores → 1 row ia_audit_logs.

### Skeleton + messages FR

- Page `/etape-2-preferences` après submit redirige vers `/deck` (déjà en place Story 1.8).
- `/deck` server component appelle `getDailyDeck` — si fallback `true` (pas encore match), affiche message "On prépare tes recommandations…" (UX-DR).
- Polling client : V2 (refresh page 5s). V1 : user refresh manuellement ou attend cron 02h.

### V1 limitations

- Pas de polling auto (V2 TanStack Query refetch interval).
- Pas de bench mesuré <8s NFR-P5 (sans Mistral réel, mock).
- Pas de "skeleton card" custom — réutilise le pattern message fallback déjà dans `/deck/page.tsx`.

## AC vs Implé

| AC | Statut V1 |
|---|---|
| Job prioritaire `match.compute.first` enqueued | ✅ |
| Top-200 ANN + top-15 retour | ✅ (réutilise compute-matches logique single-user) |
| <8s 95% NFR-P5 | ⚠️ non bench V1 (besoin infra réelle) |
| Skeleton + message rassurant | ✅ via fallback message page |
| Posthog `onboarding.first_deck_ready` | ✅ ajouté |
| Si >15s → erreur recoverable | ❌ V2 (polling client requis) |

## Implementation

1. `apps/worker/src/jobs/compute-matches.job.ts` : extraire helper `computeMatchesForUser(userId)`
2. Worker `match-compute.worker.ts` ajout branche `if (job.name === 'compute-first') computeMatchesForUser(job.data.userId)`
3. Lib web `apps/web/lib/queue.ts` : ajouter `enqueueMatchComputeFirst({ userId })`
4. Wire dans `updateProfileAction` (Story 1.7 actions.ts) : enqueue après UPDATE profile

## Change Log

- 2026-05-19 : Story créée. Status: ready-for-dev.
