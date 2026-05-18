# Story 2.9: Exclusion stricte des critères protégés du matching

Status: done

## Story

As a **responsable conformité IA Act + anti-discrimination**,
I want **garantir que le moteur de matching n'utilise aucun critère protégé (âge, sexe, origine, etc.) dans le scoring, validé par test automatisé + kill switch `IA_MATCHING_ENABLED`**,
So que **la plateforme respecte le Code du travail anti-discrimination + IA Act EU**.

## Implémentation (intégrée à Story 2.8)

Cette story est **livrée dans le commit Story 2.8** (cohérence : fairness = constante de design du moteur, pas feature séparable).

### Garanties

1. **Whitelist explicite** : `apps/worker/src/lib/match-score.ts` exporte `ALLOWED_FEATURES` (constant) — toute feature absente est rejected par typage TS et test fairness.
2. **Test `match-score.test.ts > Story 2.9 fairness`** :
   - Whitelist = `['cosine_skills', 'pref_contract_type', 'pref_city', 'pref_work_mode', 'pref_salary', 'education_level']`
   - Liste interdite (`age/gender/sex/origin/...`) vérifiée absente.
3. **Kill switch `IA_MATCHING_ENABLED=false`** (env worker + propagable web) :
   - `compute-matches.job.ts` bypass le matching et log warn si false.
4. **Audit de biais trimestriel** : V2 (Epic 8 admin). V1 : `ia_audit_logs.metadata.featuresUsed` permet l'audit a posteriori.

### Audit doc

Le rapport d'audit fairness (`docs/compliance/fairness-audit-YYYY-QN.md`) sera produit trimestriellement par l'équipe conformité. V1 = template à créer dans Story 8.x.

## Change Log

- 2026-05-19 : Story créée + livrée dans le bundle Story 2.8. Status: done.
