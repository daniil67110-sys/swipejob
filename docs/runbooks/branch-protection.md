# Runbook — Branch protection main

Story 1.2 (TECH-009). Procédure manuelle GitHub UI (non automatisable via code).

## Activation

1. GitHub repo → Settings → Branches → "Add branch protection rule".
2. **Branch name pattern** : `main`.
3. Cocher :
   - **Require a pull request before merging**
     - Required approvals : `1` (V1 — passer à `2` quand l'équipe grandit).
     - Dismiss stale approvals when new commits are pushed.
     - Require review from Code Owners (cf. `.github/CODEOWNERS` à créer Story 1.X).
   - **Require status checks to pass before merging**
     - Require branches to be up to date before merging.
     - **Required checks** (taper le nom exact des jobs CI) :
       - `install`
       - `lint`
       - `typecheck`
       - `test`
       - `build`
       - `playwright + axe-core`
   - **Require conversation resolution before merging**
   - **Require signed commits** (recommandé, optionnel V1).
   - **Require linear history** (recommandé pour `git log` propre).
   - **Do not allow bypassing the above settings** (s'applique aussi aux admins).
4. Save.

## Validation

- Tenter de pusher directement sur `main` → bloqué.
- Ouvrir une PR sans CI verte → "Merge" disabled.
- Faire passer les 6 status checks → "Merge" enabled.

## Cas particuliers

- **Hotfix urgent** : créer une PR depuis `hotfix/<slug>` vers `main`, attendre CI. **Ne pas** désactiver la protection.
- **Renommage branche default** : si la branche par défaut est encore `master`, la renommer via GitHub UI (Settings → Branches → "Switch to a different default branch") avant d'appliquer la rule.
