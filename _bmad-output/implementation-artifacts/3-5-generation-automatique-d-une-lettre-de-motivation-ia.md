# Story 3.5: Génération lettre de motivation IA

Status: done

## Implémentation

- `apps/worker/src/lib/cover-letter.ts` : Mistral `mistral-large-latest` + fallback template FR
- Sanitize : strip HTML + apostrophes typo + code fences accidentels (NFR-L3)
- Prompt : profil étudiant + offre + tone bienveillant 200-400 mots
- ia_audit_logs : `feature_type='cover_letter'` + promptHash + latencyMs + tokens
- Si Mistral fail → fallback template + `coverLetterStatus='template_fallback'`
- Anthropic Claude fallback chain V2 (V1 = juste template fallback)
- NFR-P6 <3s : pas bench V1 sans infra. V2 mesurable.

## Lifecycle application

`pending_letter` → (worker process-application) → `letter_generated` ou `pending_review`

## Change Log

- 2026-05-19 : V1 livrée (Mistral + fallback template, sans Anthropic chain). Status: done.
