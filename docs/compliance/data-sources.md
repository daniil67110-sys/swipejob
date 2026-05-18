# Sources de données — conformité ToS

Document de référence pour la conformité légale des sources d'offres d'emploi
agrégées par SwipeJob. Mis à jour par story d'intégration.

## France Travail (Story 2.2)

- **API utilisée** : Offres d'emploi v2 (REST officielle)
- **URL** : https://api.francetravail.io/partenaire/offresdemploi/v2
- **Authentification** : OAuth2 client_credentials
- **ToS** : https://francetravail.io/conditions-utilisation
- **Statut juridique** :
  - ✅ Usage commercial autorisé (déclaration partenaire requise)
  - ✅ Affichage en tant qu'agrégateur autorisé
  - ✅ Pas de scraping HTML — uniquement l'API officielle
  - ⚠️ Obligation de citer la source ("Offre originalement publiée sur France Travail")
  - ⚠️ Pas de revente directe des données sans transformation
- **Rate limit officiel** : 200 req/min (plan gratuit), 100k/jour
- **Champs PII collectés** : aucun (offres = données publiques d'entreprise)
- **Durée de conservation** : 30j max (les offres expirent côté France Travail)
- **Implémentation** : `apps/worker/src/scrapers/france-travail/` + Story 2.2

### Mention légale à afficher

> "Source : France Travail" sur chaque card d'offre. Implémentation : composant `<OfferSourceBadge>` (Story 3.x).

## Sources futures (V2)

À documenter quand ajoutées :

- **APEC** (Story 2.3 candidate) — vérifier ToS API APEC
- **JobTeaser** (Story 2.3 candidate) — partenariat requis ?
- **RSS publics** — toujours OK si flux explicite

## Procédure d'ajout d'une nouvelle source

1. Identifier l'API/flux + lire ToS intégralement
2. Confirmer usage commercial autorisé (sinon ne PAS intégrer)
3. Implémenter adaptateur `apps/worker/src/scrapers/<source>/`
4. Documenter ici (cette section) + dans la story BMad correspondante
5. Ajouter test e2e ingestion mock

## Audit RGPD

Les offres ne sont pas des données personnelles (NFR-CP — offres = info entreprise).
**Exception** : si une offre mentionne un nom de contact (recruteur), la table `offers`
peut contenir des données PII dans `description` ou `requirements`. Pour V1, on accepte
ce risque limité ; V2 = passe `description` par un anonymiseur LLM avant stockage.
