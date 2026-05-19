# Story 4.7: Mini-coach IA pré-entretien (InterviewPrepCard)

Status: done (V1, notification dédiée V2)

## Implémentation

### Back
- Table `interview_preps` (migration 0014) avec UNIQUE(applicationId) → idempotence
- Queue `coach-interview-prep` + worker `coach-interview-prep.worker.ts`
- Cron `10 * * * *` (toutes les heures à H+10)
- Job `processInterviewPrepBatch` :
  - Scan applications `status='interview_scheduled'` + `interviewAt` ∈ [now+22h, now+30h]
  - Filter `NOT EXISTS interview_preps` pour idempotence
  - Récup features matching depuis `match_scores.explanation.contributingFactors[*].factor`
  - Génère prep via Mistral (`responseFormat: { type: 'json_object' }`) — `companySummary`, `probableQuestions[3]`, `matchingStrengths[3-5]`
  - Fallback template si Mistral indispo (questions génériques FR + strengths depuis profile.skills)
  - INSERT interview_preps + INSERT ia_audit_logs `featureType:'interview_prep'` + notification_events `channel:'coach'`
- Lib `apps/worker/src/lib/interview-prep.ts` (système prompt JSON-mode + sanitize)
- Kill switch `NOTIFICATIONS_ENABLED`

### Front
- Composant `<InterviewPrepCard>` (UX-DR13 V1 minimal) affiché dans `/candidatures` sous l'application avec `status='interview_scheduled'` + interview_preps disponible
- Sections : "L'entreprise" (summary), "Questions probables" (ul), "Tes points forts" (ul) + hours-until-interview badge
- `listApplicationsAction` left-join `interview_preps` pour injecter `interviewPrep` dans `DashboardApplication`

## V1 limitations

- Pas d'envoi push/email "Ton entretien dans 24h ✨" dédié (worker `coach-prepare-interview` notification = V2). V1 = la prep s'affiche directement dans le dashboard
- Pas de page dédiée `/coach` avec liste InterviewPrepCard (V2 — Epic 5 dashboard coach)
- InterviewPrepCard UX-DR13 simplifié : pas d'illustration ni shimmer V1
- Pas d'éditeur des questions/réponses préparées
- Fenêtre lookahead fixe [22h-30h] : si user planifie entretien <22h avant heure, prep non générée (acceptable V1)

## Provisioning humain requis

- `MISTRAL_API_KEY` (déjà partagé avec Stories 1.7, 2.8, 3.5)

## Change Log

- 2026-05-19 : V1 livrée. Notif dédiée + page /coach = V2. Status: done.
