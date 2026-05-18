# Story 3.7: Mode preview lettre avant envoi

Status: partial (back livré, UI éditeur Epic 4)

## Implémentation V1

### Back
- `preferences.reviewBeforeSend boolean default false`
- `applications.status = 'pending_review'` si user a `reviewBeforeSend=true`
- `processApplication` worker stoppe à `pending_review` (au lieu de envoyer immédiatement)

### UI
- Toggle `reviewBeforeSend` dans `/etape-2-preferences` ou `/profil/preferences` : **V2** (l'ajout du checkbox est trivial, à intégrer dans le form existant V2)
- Composant `<CoverLetterEditor>` (rich text + Envoyer/Régénérer/Annuler) : **Epic 4 Story 4.1+** (page `/candidatures/<id>` permettra l'édition)

## V1 limitations documentées

- Pas de toggle UI immédiat (feature flag DB OK, UX manquante)
- Pas d'éditeur rich text V1 — sera dans Epic 4 dashboard candidatures

## Change Log

- 2026-05-19 : Back livré (DB + worker flow). UI éditeur reportée Epic 4. Status: partial.
