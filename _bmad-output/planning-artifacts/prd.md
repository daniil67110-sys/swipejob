---
stepsCompleted: ['step-01-init', 'step-02-discovery', 'step-02b-vision', 'step-02c-executive-summary', 'step-03-success', 'step-04-journeys', 'step-05-domain', 'step-06-innovation', 'step-07-project-type', 'step-08-scoping', 'step-09-functional', 'step-10-nonfunctional', 'step-11-polish', 'step-12-complete']
completedAt: '2026-05-14'
releaseMode: phased
visionInsights:
  visionStatement: 'Transformer la recherche d''alternance en expérience swipe addictive et efficace pour étudiants français'
  wowMoments:
    - 'Matching rapide: 3-5 offres ultra-pertinentes en 2 minutes'
    - 'Candidature sans effort: 1 swipe = candidature envoyée'
  unfairAdvantages:
    - 'Qualité du matching IA (effet réseau données)'
    - 'UX mobile addictive (swipe + gamification)'
  coreInsight: 'Gen Z veut une expérience mobile-native sans formulaires; l''IA moderne rend enfin le matching pertinent possible'
  whyNow: 'Motivation business (monétisation à définir); hypothèses: boom alternance France + IA mûre + Gen Z mobile-first'
  monetizationTBD: true
inputDocuments: ['_bmad-output/planning-artifacts/product-brief.md']
workflowType: 'prd'
documentCounts:
  briefs: 1
  research: 0
  brainstorming: 0
  projectDocs: 0
classification:
  projectType: web_app
  projectTypeNotes: 'Mobile-first PWA / responsive web app'
  domain: edtech
  domainNotes: 'Hybrid edtech + recruiting (student internship/apprenticeship marketplace)'
  complexity: medium
  projectContext: greenfield
  marketScope: 'France, 2026, étudiants'
  marketplaceModel: '1-côté (étudiants), offres scrapées/API externes'
  ambition: 'Produit complet 6-12 mois'
  keyAttentionPoints:
    - 'RGPD obligatoire (données étudiantes)'
    - 'Matching IA central'
    - "Sources d'offres: scraping vs API (Pôle Emploi, France Travail, LinkedIn)"
    - 'UX swipe tactile sur web (défi vs natif)'
    - 'Scope MVP à cadrer pour tenir 6-12 mois'
---

# Product Requirements Document - Application mobile "Tinder pour alternance/stage"

**Author:** Danii
**Date:** 2026-05-14

## Executive Summary

**SwipeJob** (nom de travail) est une web app mobile-first qui transforme la recherche d'alternance et de stage en une expérience swipe addictive pour les étudiants français. L'utilisateur crée un profil unique une seule fois, puis swipe quotidiennement des opportunités pré-matchées par IA : swipe droite envoie la candidature automatiquement, swipe gauche passe. Cible : étudiants Gen Z français en quête d'alternance ou de stage, fatigués des plateformes desktop chronophages (LinkedIn, HelloWork, JobTeaser) qui exigent CV/lettre à chaque candidature et qui transforment la recherche en parcours épuisant et démoralisant.

### What Makes This Special

Deux moments "wow" se combinent :

1. **Matching pertinent en 2 minutes** — l'IA propose 3-5 offres ultra-ciblées par jour (vs 2 heures de tri sur LinkedIn pour zéro résultat utile).
2. **Candidature zero-effort** — 1 swipe = profil envoyé, sans lettre, sans formulaire, sans re-remplir le CV.

**Avantage défendable :** double effet réseau. Plus d'étudiants → plus de feedback de matching → IA plus précise. Plus de précision → plus de rétention → plus d'étudiants. Cumulé à une exécution UX mobile addictive (swipe + gamification) qui crée une habitude quotidienne d'utilisation.

**Insight central :** la Gen Z (née après 2002) ne tolère plus les UX desktop ni les formulaires longs. Les LLMs modernes rendent enfin possible un matching pertinent à partir de peu de données structurées (CV libre + descriptions d'offres en langage naturel). La conjonction de ces deux tendances ouvre une fenêtre d'opportunité que les acteurs historiques (LinkedIn, JobTeaser, HelloWork) ne peuvent pas exploiter sans réinventer leur produit.

## Project Classification

- **Type de projet :** Web app mobile-first (PWA / responsive web app)
- **Domaine :** EdTech + Recruiting hybride (marché alternance/stage France)
- **Complexité :** Moyenne — RGPD, matching IA, intégration sources d'offres externes, UX swipe tactile sur web
- **Contexte projet :** Greenfield (nouveau produit, pas de code existant)
- **Marché cible :** Étudiants français, lancement 2026
- **Modèle marketplace :** 1-côté (étudiants utilisateurs ; offres scrapées / via API publiques ou partenaires)
- **Ambition :** Produit complet en 6-12 mois
- **Modèle économique :** Freemium étudiants (V1) + commission entreprises (V2 / future)

## Success Criteria

### User Success

L'étudiant est "successful" quand il atteint trois jalons mesurables :

1. **Première candidature en moins de 3 minutes** après inscription (premier swipe droite = candidature envoyée). Mesure : temps signup → première candidature ≤ 180s pour 80% des nouveaux utilisateurs.
2. **Engagement quotidien gamifié** : ≥5 sessions/semaine en moyenne pendant la saison de recherche active (oct→avr pour alternances). Mesure : DAU/MAU ≥ 30%.
3. **Outcome final** : signature d'une alternance ou d'un stage via l'app dans la saison. Cible MVP année 1 : ≥20% des utilisateurs actifs signent un contrat via l'app. Cible long terme : ≥40%.

Émotionnellement : l'étudiant doit ressentir l'app comme un soulagement quotidien (jeu plutôt que corvée), pas une source de stress.

### Business Success

Objectifs 12 mois après lancement :

- **Revenue : 100k€+ ARR** via abonnement premium étudiant (boost profil, candidatures illimitées, coach CV IA).
- **30 000+ étudiants inscrits** (cohorte minimale pour atteindre le revenue cible avec un taux de conversion freemium → premium de ~5%).
- **DAU/MAU ≥ 30%** : l'app devient un réflexe quotidien (benchmark Gen Z : Tinder ~50%, apps job classiques <5%).
- **Conversion freemium → premium ≥ 5%** dans les 30 jours suivant l'inscription.
- **NPS étudiants ≥ 50** (forte recommandation, viralité organique).

Jalons intermédiaires :

- 3 mois post-lancement : 1 000 utilisateurs actifs, 50 entreprises avec ≥1 candidature reçue.
- 6 mois : 10 000 inscrits, 200 signatures cumulées via l'app, premiers premium payants.
- 12 mois : 30 000 inscrits, 100k€ ARR, 1 000 signatures cumulées.

### Technical Success

- **Performance UX** : latence swipe < 100ms (perception "instantanée"), latence matching IA initial < 3s à l'inscription.
- **Disponibilité** : uptime ≥ 99.5% (hors fenêtres de maintenance planifiées).
- **Mobile web** : Lighthouse Performance ≥ 90, Accessibility ≥ 90 sur les pages principales.
- **Conformité RGPD** : 100% conforme avant lancement (DPO consulté, registre des traitements, base légale documentée, droit d'accès/suppression implémenté).
- **Scalabilité** : architecture supportant ×10 du trafic prévu sans refonte (objectif 12 mois : 300k utilisateurs).
- **Coût IA** : coût matching ≤ 0,05 € par étudiant actif / mois (économique à l'échelle).

### Measurable Outcomes

| KPI | Cible 3 mois | Cible 6 mois | Cible 12 mois |
|---|---|---|---|
| Étudiants inscrits | 1 000 | 10 000 | 30 000 |
| DAU/MAU ratio | 20% | 25% | 30% |
| Candidatures envoyées / utilisateur actif / semaine | 3 | 5 | 7 |
| Taux signature (utilisateurs actifs ayant signé) | 5% | 12% | 20% |
| Conversion freemium → premium | 2% | 4% | 5% |
| ARR (€) | 5k | 30k | 100k |
| NPS | 30 | 40 | 50 |
| Uptime | 99% | 99.5% | 99.5% |

## Product Scope (Overview)

La livraison est **phasée en 3 temps** :

- **MVP (Phase 1, M1-M6)** : web app PWA mobile-first avec auth étudiant, profil unique parsé par IA, ingestion d'offres multi-sources, matching IA, swipe + candidature auto avec lettre IA, dashboard candidatures, mini-coach pré-entretien, reporting de signature, conformité RGPD complète.
- **Growth (Phase 2, M6-M12)** : premium étudiant freemium, gamification avancée, détection automatique des réponses email, communauté étudiante, optimisation continue du matching.
- **Vision (Phase 3, post-M12)** : marketplace 2-côtés (côté entreprise), expansion EU francophones puis large, coach carrière IA conversationnel, intégrations écoles, marketplace étendue.

Les détails par phase (capacités must-have, hors-scope justifiés, ressources requises) sont documentés dans la section [Project Scoping & Phased Development](#project-scoping--phased-development) plus bas.

## User Journeys

### Persona 1 — Léa, 21 ans, M1 Communication (Sciences Po Lyon)

**Situation :** Mai 2026. Léa entre en M2 en septembre, en alternance obligatoire. Elle a candidaté sur LinkedIn et Welcome to the Jungle depuis février — 47 candidatures, 3 retours, 0 entretien. Elle vit chez ses parents à Lyon, est démotivée, dort mal, scroll Instagram à 2h du matin. Elle découvre SwipeJob via une story d'une amie de promo.

**Scène 1 — Inscription (J0, 22h45) :** Léa clique sur le lien, arrive sur la landing. En 30 secondes elle comprend le concept : "Swipe ton alternance, on s'occupe du reste." Elle s'inscrit via Google, dépose son CV PDF. Une animation IA s'affiche pendant 8 secondes : "On lit ton CV, on cherche tes 10 premières opportunités…" Elle remplit 3 questions express : type de contrat (alternance M2), zone géographique (Lyon + Paris), secteurs préférés (marketing digital, com institutionnelle).

**Scène 2 — Premier swipe (J0, 22h47) :** Le deck s'ouvre. Première carte : "Assistante chef de produit @ Decathlon Villeurbanne — 93% match — Alternance 12 mois — 1 200€/mois." Léa swipe droite. Animation confettis : "💌 Candidature envoyée à Decathlon. CV + lettre IA personnalisée jointe." Elle reste figée. "Sérieux, c'est tout ?" Elle continue. 7 candidatures envoyées en 4 minutes. Elle se couche en souriant.

**Scène 3 — Routine quotidienne (J1 à J15) :** Chaque matin à 8h, notification "🎯 5 nouvelles opportunités matchent ton profil." Léa swipe pendant le métro (12 min de trajet). Streak de 14 jours. Elle a envoyé 92 candidatures totales. 11 réponses reçues. 4 entretiens planifiés (l'app les a détectés depuis ses emails).

**Scène 4 — Climax (J18, 10h) :** Premier entretien chez Decathlon (la toute première offre swipée). Elle entre dans l'app juste avant : un mini écran de prep affiche le profil de l'entreprise, les 3 questions types et un rappel de pourquoi le matching score était de 93%. Entretien réussi.

**Scène 5 — Résolution (J34) :** Léa signe son alternance chez Decathlon. Elle reporte la signature dans l'app (bouton "J'ai signé ! 🎉"). Elle reçoit un badge "Signed" et un email : "Bravo Léa. Aide tes potes à trouver aussi → invite ton école." Elle envoie l'app dans son groupe WhatsApp de promo.

**Capacités révélées :**

- Auth Google + import CV (PDF parsing par IA en données structurées)
- Onboarding < 60s avec questions essentielles uniquement
- Matching IA initial (avant le premier swipe) en 8 secondes max
- Deck de cartes swipables (gestes tactiles mobile-web fluides)
- Animation feedback positif à chaque swipe droit (dopamine loop)
- Lettre de motivation générée par IA, personnalisée par offre
- Notifications push quotidiennes (web push + email fallback)
- Détection automatique des réponses entreprises (intégration email)
- Mini-coach pré-entretien (résumé entreprise + questions types)
- Reporting de signature (incentivé par badges)
- Mécanique de parrainage / partage

---

### Persona 2 — Tom, 19 ans, BTS SIO Informatique (Toulouse)

**Situation :** Mars 2026. Tom doit trouver un stage de 8 semaines pour mai-juin. Il est en zone semi-rurale (Toulouse banlieue), pas de réseau pro, vit chez ses parents, pas de voiture. Il a tenté Pôle Emploi (interface vieillotte, peu d'offres tech locales), Indeed (spam), LinkedIn (rejeté car "pas assez d'expérience"). Découragé. Sa mère lui parle de SwipeJob qu'elle a vu aux infos.

**Scène 1 — Inscription friction (J0) :** Tom installe l'app (PWA, pas besoin de l'app store). Il dépose son CV très court (1 page, quelques projets perso GitHub). L'IA extrait : "Compétences détectées : Python, HTML, CSS, SQL, débutant React." Tom remplit ses préférences : stage 8 semaines, télétravail OK, Toulouse et alentours, budget transport limité.

**Scène 2 — Edge case : peu d'offres locales (J0, fin onboarding) :** Le deck s'ouvre. Seulement 6 cartes proposées (vs les 10-20 promises). Un message contextuel apparaît : "Pas beaucoup d'offres parfaites dans ta zone. Élargis ton rayon ?" Tom hésite. Il swipe les 6 dispo (3 droite, 3 gauche). Le deck devient vide.

**Scène 3 — Recovery (J0, 20h) :** Écran d'attente avec un message : "🎯 Tu as 3 candidatures envoyées. On te ramène des nouvelles offres chaque jour. En attendant : élargis ta zone (Bordeaux, Montpellier) ou active le télétravail 100%." Tom active télétravail 100%. Le deck se rafraîchit avec 12 nouvelles cartes.

**Scène 4 — Rising action (J3 à J21) :** Tom swipe quotidiennement. 23 candidatures envoyées (vs 5 qu'il aurait faites manuellement sur Indeed). 2 entretiens visio décrochés. Il sent que l'app le valorise — chaque carte montre clairement pourquoi le match est élevé ("Tu as Python + l'offre demande Python + 3 ans de Python ne sont PAS demandés ici, parfait pour ton niveau").

**Scène 5 — Climax (J25) :** Tom signe un stage 100% remote chez une scale-up parisienne (PHP/Symfony). Salaire 800€/mois. Il n'aurait jamais postulé sans la carte qui lui a dit "Symfony c'est très proche de ce que tu sais en PHP, 80% match malgré tes 0 mois d'expérience pro."

**Capacités révélées :**

- Gestion de la rareté d'offres (deck vide / faible volume) — messaging contextuel
- Filtres ajustables à chaud (zone géo, télétravail) avec rafraîchissement immédiat
- Transparence du score de matching (pourquoi cette carte ? pédagogie)
- Élargissement intelligent des critères suggéré par l'IA
- Onboarding qui ne décourage pas les profils débutants (pas de "rejet implicite")

---

### Persona 3 — Yasmine, 22 ans, École d'ingé INSA Paris (4ème année)

**Situation :** Janvier 2026. Yasmine cherche son alternance ingé pour les 3 prochaines années (cycle dual school-entreprise). Top profil — moyenne 16, stages chez Capgemini et Thales déjà faits, anglais courant. Elle vise des entreprises ultra-sélectives (Datadog, Stripe, Mistral, Doctolib). Elle a déjà eu 4 entretiens via son réseau école mais aucun n'a fonctionné (fit culturel, timing). Elle est exigeante, ne veut pas perdre de temps.

**Scène 1 — Skepticism (J0) :** Yasmine s'inscrit par curiosité. Elle pense "encore une app Tinder pour les jeunes." Elle dépose son CV (3 pages, dense). L'IA extrait correctement : compétences Python/Go/Kubernetes, stages Capgemini/Thales, projet associatif. Elle paramètre des préférences précises : tech scale-ups uniquement, Paris ou télétravail, salaire 1 800€+/mois.

**Scène 2 — Surprise positive (J0) :** Le deck s'ouvre. 14 cartes — toutes du niveau qu'elle attend. Datadog, Doctolib, Alan, Qonto, Mirakl. Score moyen 87%. Yasmine swipe droite sur Datadog (95% match). Pop-up : "💌 Candidature envoyée. CV + lettre IA personnalisée. NB : tu as déjà 3 candidatures en cours dans cette entreprise selon ton profil LinkedIn, on a noté." Elle apprécie : l'app ne fait pas doublon avec son existant.

**Scène 3 — Edge case : refus pénibles (J8) :** Trois refus en 48h (Datadog, Alan, Mistral). L'app affiche une carte spéciale : "3 refus récents. Voici ce qu'on note : tu vises haut, c'est cool. Pour augmenter ton taux, essaie des scale-ups en phase de scaling (50-200 personnes) plutôt que les hyperscalers." Yasmine trouve le ton respectueux, pas paternaliste. Elle ajuste.

**Scène 4 — Climax (J22) :** Yasmine signe chez Qonto. Premier entretien décroché via l'app, 3 tours, signature. Elle hésite à reporter la signature ("Si je dis que c'est SwipeJob, ils vont penser que je suis moins sérieuse ?"). L'app a anticipé : message subtil "On garde ça privé entre nous et notre algo. Personne d'autre ne sait."

**Scène 5 — Résolution (J22 — viralité) :** Yasmine, qui n'imaginait pas tester l'app, devient ambassadrice. Elle publie un post LinkedIn : "Ok j'avoue, j'ai trouvé mon alternance Qonto via SwipeJob. Sceptique au départ, convaincue maintenant." Le post fait 800 likes. 230 inscriptions tracées via son lien de parrainage en 72h.

**Capacités révélées :**

- Parsing IA robuste pour CV denses / multi-pages
- Préférences avancées (range salaire, taille entreprise, stack tech spécifique)
- Détection des doublons avec d'autres canaux (LinkedIn déjà connecté ou non)
- Système de feedback intelligent après plusieurs refus ("coaching IA discret")
- Confidentialité du canal utilisé (l'entreprise ne sait pas que ça vient de SwipeJob)
- Système de parrainage avec tracking
- Capacité à séduire un public exigeant (ton, qualité, design)

### Journey Requirements Summary

Les trois journeys révèlent que le MVP doit impérativement embarquer :

**Onboarding & profil :**

- Inscription en moins de 90 secondes (Google + CV PDF + 3 préférences essentielles)
- Parsing IA du CV en données structurées (compétences, niveau, expérience, école)
- Préférences ajustables à chaud (zone géo, télétravail, type contrat, salaire)

**Moteur de matching & deck :**

- Génération du deck initial en moins de 10 secondes après upload CV
- 10-20 offres dans le deck quotidien (avec gestion des situations de pénurie)
- Score de matching transparent et pédagogique (pourquoi cette carte ?)
- Capacité à recommander l'élargissement de critères quand le deck est faible

**Interaction swipe :**

- Geste tactile mobile-web fluide (<100ms feedback)
- Animation positive à chaque candidature envoyée (dopamine loop)
- Swipe haut = sauver pour plus tard (option requise par les profils sélectifs)

**Candidature & follow-up :**

- Génération automatique de lettre IA personnalisée par offre
- Envoi par email à l'entreprise depuis l'offre source (tracking SMTP)
- Détection automatique des réponses (intégration email read-only sur consentement)
- Dashboard candidatures (envoyées, lues, répondues, entretiens, signatures)

**Engagement & rétention :**

- Notifications push quotidiennes pertinentes (pas spam)
- Streaks, badges, gamification douce
- Mini-coach pré-entretien (résumé entreprise + questions types)
- Reporting de signature incitatif (badge "Signed" + parrainage post-signature)

**Confiance & ton :**

- Confidentialité du canal vis-à-vis des recruteurs (l'entreprise reçoit une candidature qui ne révèle pas que ça vient de SwipeJob)
- Feedback "coach" non paternaliste après plusieurs refus
- Pédagogie sur le matching (transparence du score)
- Messaging contextuel adapté à la situation (deck vide, refus en série, premier match…)

## Domain-Specific Requirements

### Compliance & Regulatory

**RGPD (Règlement Général sur la Protection des Données) — obligatoire :**

- Base légale du traitement documentée pour chaque finalité (intérêt légitime pour le matching, consentement explicite pour les notifications marketing, exécution contractuelle pour le service).
- Information transparente avant inscription (politique de confidentialité claire, pas de dark patterns).
- Droits utilisateurs implémentés : accès, rectification, suppression (effacement complet sous 30 jours), portabilité (export JSON/PDF), opposition, limitation.
- Registre des traitements maintenu (article 30 RGPD).
- Privacy by design : minimisation des données collectées, durée de conservation documentée (CV anonymisé après 24 mois d'inactivité), pseudonymisation des analytics.
- Hébergement des données dans l'UE (AWS Paris/Frankfurt, GCP Belgium, OVH, Scaleway). Pas de transfert hors UE sauf clauses contractuelles types.
- DPO (Délégué à la Protection des Données) désigné dès >500 utilisateurs ou traitement à grande échelle.
- Notification CNIL des violations sous 72h en cas d'incident.

**Code du travail français & non-discrimination :**

- Aucune discrimination dans le matching sur critères protégés (article L1132-1 du Code du travail) : âge, sexe, origine, situation de famille, apparence physique, patronyme, orientation sexuelle, opinions politiques/religieuses, handicap, grossesse, état de santé, appartenance syndicale.
- L'algorithme de matching doit pouvoir être auditable (explication des scores). Anticipation de la régulation IA Act EU 2026 qui classera probablement le matching emploi comme "haut risque" (article 6, annexe III du AI Act).
- Pas de profilage automatique avec effets juridiques sans intervention humaine (article 22 RGPD) — la candidature reste une décision de l'étudiant.

**Loi Informatique et Libertés / CNIL :**

- Consentement préalable pour newsletters et emails marketing (opt-in clair).
- Bouton de désinscription présent dans chaque email.
- Pas d'usage des données pour de la prospection tierce sans consentement séparé.

**Accessibilité numérique :**

- Conformité WCAG 2.1 niveau AA visée (contraste, navigation clavier, alternatives textuelles, lecteur d'écran compatible).
- Déclaration d'accessibilité publiée sur le site (obligatoire pour les acteurs publics, recommandée pour le privé en 2026 — directive EU European Accessibility Act applicable juin 2025).

**Loi Toubon (français) :**

- Toute communication à destination du public français doit être en français (lettres de motivation, descriptions, notifications, interface).
- Les termes techniques étrangers doivent avoir une traduction ou un équivalent français visible.

### Technical Constraints

**Sécurité :**

- HTTPS partout (TLS 1.3 minimum).
- Authentification : OAuth 2.0 / OpenID Connect (Google), passwords hashés (argon2id), MFA proposé pour les utilisateurs sensibles.
- Chiffrement des données au repos (AES-256) pour les champs PII : CV, email, téléphone, école.
- Stockage des secrets en vault (pas de credentials en clair dans le code/env).
- Rate limiting sur les endpoints publics (anti-bot, anti-scraping inverse).
- Audit logs pour les opérations sensibles (suppression compte, export données, modifications profil).

**Privacy & data handling :**

- Pseudonymisation des analytics produit (pas de PII envoyée à Posthog/Mixpanel).
- Consentement explicite pour la lecture des emails (intégration Gmail/Outlook pour détecter les réponses) — scope minimal (read-only sur threads ayant pour destinataire l'app, jamais le contenu intégral).
- CV stocké chiffré, accès loggé.
- Anonymisation des données d'entraînement IA (si on entraîne nos propres modèles).
- Pas d'envoi des données utilisateurs vers les LLMs cloud publics (OpenAI, Anthropic) sans clause spécifique de non-rétention et hébergement EU (utiliser Azure OpenAI EU, ou Anthropic EU, ou modèles auto-hébergés type Mistral Large pour les opérations sensibles).

**Performance :**

- Mobile-first responsive : viewport tactile prioritaire, performances 4G cibles (TTI < 3s sur réseau Slow 3G simulé).
- Lighthouse Performance ≥ 90, FCP < 1.5s, LCP < 2.5s.
- Disponibilité 99.5%.

### Integration Requirements

**Sources d'offres (ingestion) :**

- **France Travail API** (anciennement Pôle Emploi) : API officielle "Offres d'emploi", clé API à demander, quota négociable. Couvre une grande partie des offres alternance publiques.
- **API Apec** (alternance / jeunes diplômés) : à explorer pour les profils bac+5.
- **Scraping ciblé** : sites partenaires uniquement (avec accord écrit ou conformité ToS + robots.txt). Pas de scraping massif sans accord. Sites potentiels : 1jeune1solution.gouv.fr, Studyrama, L'Étudiant (à valider).
- **Flux RSS / sitemap** : alternative légère pour certaines sources institutionnelles.
- **Crowdsourcing futur** : étudiants signalent des offres trouvées ailleurs (post-MVP).

**Email :**

- SMTP transactionnel : SendGrid / Mailgun / AWS SES (EU region) pour envois candidatures.
- Configuration SPF / DKIM / DMARC du domaine pour éviter classement spam (critique car volume élevé d'emails de candidature).
- Email validation pré-envoi (anti-bounce, anti-typo).

**LLM / IA :**

- Provider principal : à arbitrer entre OpenAI EU, Anthropic, Mistral (priorité Mistral pour souveraineté et coûts).
- Embeddings : nomic-embed ou e5-mistral pour matching sémantique (modèles open source possibles auto-hébergés).
- Vector DB : pgvector (PostgreSQL) ou Qdrant pour le matching IA.

**Paiement (premium étudiants) :**

- Stripe (entreprise hébergée IE, conforme RGPD, déclarations TVA simples).
- Pas de stockage de cartes côté SwipeJob (PCI-DSS hors scope, Stripe Elements).

### Risk Mitigations

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Violation RGPD (faille, fuite) | Moyenne | Très élevé (amende jusqu'à 4% CA) | Privacy by design, audits trimestriels, assurance cyber, DPO dès 1k users, plan de réponse incident testé |
| Discrimination algorithmique détectée | Faible-moyenne | Élevé (réputation + juridique) | Audit régulier des biais matching (parité par genre/origine), monitoring équité, fairness metrics dans le ML pipeline |
| Scraping mis en cause (ToS, robots.txt) | Élevée | Moyen (cease & desist, blocage IP) | Limiter scraping aux sources autorisées, privilégier API officielles, contrats partenaires |
| Spam classification (emails candidatures bloqués) | Élevée au début | Élevé (l'app ne marche plus) | Warm-up IP progressif, SPF/DKIM/DMARC, volume contrôlé par utilisateur, intégration relais entreprise (envoi depuis email étudiant authentifié OAuth si possible) |
| Saturation utilisateurs (trop de candidatures envoyées par étudiant) | Moyenne | Élevé (réputation app spammeur) | Cap quotidien (10 swipes droits/jour en gratuit, 50 en premium), modération qualité matching, pédagogie utilisateur ("candidater moins mais mieux") |
| IA Act EU 2026 classe "haut risque" | Élevée (probable) | Moyen (compliance overhead) | Architecture matching explicable dès maintenant, audit trails, kill switch humain, documentation transparente, préparation aux obligations art. 8-15 IA Act |
| Données mineurs (étudiants <18 ans en BTS) | Faible (alternance = ≥16 ans avec autorisation) | Élevé (consentement parental, COPPA-like) | Vérification âge à l'inscription, consentement parental requis pour <18 ans, fonctionnalités limitées (pas de premium payant pour mineurs) |

## Innovation & Novel Patterns

### Detected Innovation Areas

**1. UX swipe tactile sur web (mobile-first PWA) :**

L'innovation primaire est de porter une mécanique d'interaction native (le swipe à la Tinder) sur un environnement web mobile, sans détour par les app stores. C'est techniquement non trivial : gestes tactiles fluides à 60 FPS, animations physiques, gestion offline du buffer de cartes, web push notifications. La plupart des concurrents recruiting/edtech français restent sur des UX formulaire-classique. Cette différenciation se ressent dès la première seconde d'utilisation.

**2. Candidature zero-effort avec lettre IA personnalisée à chaud :**

Un swipe droite déclenche : (a) génération d'une lettre de motivation personnalisée par LLM en <2s, basée sur la correspondance CV/offre, (b) envoi automatique par email avec CV. L'innovation est dans la combinaison de plusieurs technos qui existent séparément (LLM, SMTP, parsing CV) en une expérience perçue comme "magique" par l'utilisateur. Aucun acteur français ne propose ça aujourd'hui — les concurrents se contentent du formulaire ou de l'envoi de CV brut.

**3. Matching IA explicable et auditable dès le design :**

L'innovation conformité : architecture matching pensée pour expliquer ses scores (features importance, contributions du CV, contributions des préférences) en anticipation du AI Act EU 2026 qui classera très probablement le matching emploi comme "haut risque" (article 6, annexe III). Les concurrents qui ne l'auront pas anticipé devront refondre leurs systèmes. C'est un moat réglementaire défendable.

**4. Pédagogie du matching côté utilisateur :**

Chaque carte affiche pourquoi le score est élevé ("Tu as Python + l'offre demande Python + expérience 0-2 ans correspond à ton niveau"). Cette transparence transforme le matching IA en outil pédagogique pour l'étudiant (qui apprend à mieux se positionner) et construit la confiance dans l'algorithme. Différenciation forte vs les "boîtes noires" type LinkedIn.

**5. Reporting communautaire des signatures :**

Les étudiants reportent eux-mêmes leur signature dans l'app (badge + ego boost + parrainage). Cette boucle de feedback crée une donnée propriétaire (qui a signé où) que les concurrents n'auront pas. Elle alimente le retraining du modèle de matching et le marketing (testimonials sociaux). Innovation dans la collecte de signal au-delà des clics.

### Market Context & Competitive Landscape

**Tentatives passées de "Tinder pour l'emploi" en France et international :**

- **Job&Match** (FR, ~2017) — disparu. UX limitée, pas d'IA, pas de scope étudiant.
- **Swipejob.com** (US, gig economy) — fonctionnel mais cible jobs précaires US, pas alternance étudiante.
- **Wizbii** (FR) — touche la cible étudiante mais reste sur une UX classique style job board. Pas de swipe.
- **JobTeaser** (FR/EU) — leader B2B universités, plate-forme classique, formelle. Désavantage Gen Z mobile-first.
- **Welcome to the Jungle** (FR) — éditorial fort sur la marque employeur mais UX desktop-first, pas pensé alternance étudiante.
- **HelloWork / Indeed** — agrégateurs massifs, UX vieillissante, peu de différenciation pour étudiants.

**Pourquoi SwipeJob peut réussir là où les autres ont échoué :**

1. **Maturité LLM 2024-2026** : le matching sémantique n'était pas viable techniquement avant. Les anciens "Tinder pour l'emploi" matchaient sur keywords basiques → résultats médiocres → users partis.
2. **Saturation des concurrents historiques** : LinkedIn et HelloWork servent toutes les cibles, donc aucune n'est servie excellemment. Espace pour un acteur ultra-focalisé étudiants français.
3. **Boom alternance France** : aides gouvernementales (5 000€/apprenti depuis 2020 puis pérennisées), volume d'offres en hausse continue, demande structurelle des entreprises pour la main d'œuvre alternant.
4. **Gen Z mobile-first absolue** : la cible 18-25 ans en 2026 n'a connu QUE le smartphone. Ne tolérera plus les UX desktop.

**Risque d'imitation rapide :**

Une fois la traction prouvée, LinkedIn ou Indeed peuvent lancer une fonctionnalité swipe en quelques mois. Mais ils ne peuvent pas pivoter leur UX entière. Le différenciateur doit donc passer rapidement de "feature swipe" à "marque préférée des étudiants français" (community + brand love).

### Validation Approach

**Validation 1 — Le swipe UX sur web fonctionne (technique) :**

- Prototype technique d'interaction swipe en 2 semaines (mois 1).
- Test utilisateurs sur 10 étudiants : "Est-ce que c'est fluide ? Mieux que LinkedIn mobile ?"
- KPI de succès : ≥90% de feedback "fluide", taux de complétion d'un deck de 20 cartes ≥80% (vs ~30% sur un job board classique).
- Fallback si le swipe web n'est pas assez performant : descendre à une interaction "tap = candidater, tap = passer" avec animation, garder la même architecture data.

**Validation 2 — Le matching IA est jugé pertinent (produit) :**

- Beta privée avec 100 étudiants (mois 4-5).
- Métrique clé : score de pertinence perçu sur les 10 premières cartes (1-5). Cible ≥3.5/5.
- Mesure objective : taux de swipe droit sur les 5 premières cartes ≥40% (= pertinence ressentie immédiate).
- A/B test interne : matching keyword basic vs matching LLM. Si l'écart est <20%, potentiellement repenser l'investissement IA.
- Fallback : simplifier le modèle (règles + scoring keyword + embedding léger plutôt que LLM complet) si coûts ou performances dépassent les limites.

**Validation 3 — La candidature auto avec lettre IA convertit (business) :**

- A/B test sur 500 utilisateurs en beta : candidature avec lettre IA vs candidature CV-seul.
- KPI de succès : taux de réponse entreprise ≥2x supérieur avec lettre IA.
- KPI sentiment étudiant : "te sens-tu confiant avec la lettre générée ?" ≥80% oui.
- Fallback si les entreprises se méfient des lettres IA : passer à un mode "draft édité par l'étudiant en 30s" plutôt qu'un envoi 100% automatique.

**Validation 4 — Le marché est suffisamment large (commerciale) :**

- Estimation TAM (Total Addressable Market) : ~1,2 million d'étudiants en alternance ou en recherche d'alternance/stage en France (chiffres 2025, en hausse). Si on capte 5% en 3 ans = 60 000 utilisateurs actifs. Cohérent avec les objectifs business.
- KPI marché : si après 6 mois de marketing organique on n'atteint pas 5 000 inscrits, réviser la stratégie d'acquisition (pas le produit).

### Risk Mitigation

**Risque d'innovation #1 — Le swipe web n'est pas assez fluide :**

- Mitigation : Prototype technique très tôt (semaine 2). Test sur appareils bas/moyen de gamme (Android Go, vieux iPhones). Optimisation 60 FPS critique.
- Fallback : "Tap mode" en option pour utilisateurs sur appareils anciens.

**Risque d'innovation #2 — Lettre IA jugée impersonnelle ou suspecte par recruteurs :**

- Mitigation : Lettres courtes (8-12 lignes), ton naturel, mention explicite "écrite avec l'aide de l'IA" si testé positif. Templates customisés par l'étudiant (ton, longueur, intro).
- Fallback : Génération de "draft" éditable plutôt qu'envoi direct. L'étudiant valide en 2 clics.

**Risque d'innovation #3 — Saturation entreprises (candidatures non lues) :**

- Mitigation : Cap quotidien strict (10 swipes droits / jour gratuit, 50 en premium). Système de qualité : si l'étudiant a un taux de réponse <X%, on lui suggère d'améliorer son profil avant d'envoyer plus.
- Fallback : Modèle "qualité > quantité" assumé en marketing — pas un spam tool.

**Risque d'innovation #4 — Réaction des plateformes scrapées (cease & desist) :**

- Mitigation : Privilégier API officielles (France Travail), partenariats explicites avec les sites permissifs (1jeune1solution, écoles). Scraping uniquement si robots.txt permet ET ToS le permet.
- Fallback : Pivot vers crowdsourcing (étudiants signalent les offres qu'ils trouvent ailleurs) si les sources externes se ferment.

**Risque d'innovation #5 — IA Act EU classe matching emploi "haut risque" — coûts compliance :**

- Mitigation : Architecture explicable dès J1, audit trails complets, fairness metrics, documentation des décisions algorithmiques. Préparer dossier conformité dès l'année 1.
- Fallback : Cette contrainte affecte TOUS les concurrents — devient un avantage relatif pour qui aura anticipé.

## Web App Specific Requirements

### Project-Type Overview

SwipeJob est une **web app mobile-first PWA** (Progressive Web App) déployée comme SPA sur un domaine unique (`app.swipejob.fr` envisagé), avec un site marketing/SEO séparé en SSR (`www.swipejob.fr`). L'expérience principale (swipe, profil, dashboard) vit dans l'app authentifiée SPA. Les pages publiques d'acquisition (landing, blog, détail d'offre public partageable, pages "alternance + ville", "alternance + métier") vivent en SSR/SSG pour le SEO.

### Technical Architecture Considerations

**Architecture frontend :**

- **App principale : SPA** (Single Page Application) — choix imposé par les interactions swipe statefulles, animations 60 FPS, gestion offline du buffer de cartes, transitions fluides entre écrans. Routing client-side.
- **Site marketing / SEO : SSR ou SSG** — pages publiques rendues côté serveur pour être indexées par Google. Stack candidate : Next.js (App Router avec mix SSR / SSG) ou Astro pour la partie statique pure.
- **PWA features** : manifest, service worker, installation home screen ("Ajouter à l'écran d'accueil"), web push notifications, mode offline partiel (deck de cartes pré-chargé pour swipe hors-ligne sur métro).
- **Pas d'app store** pour la V1 — pas de build natif iOS/Android. Réduit les coûts, simplifie les déploiements, contourne les frais Apple/Google (30%).
- **Wrapper natif (Capacitor) en option future** — si traction confirme besoin app store.

**Architecture backend :**

- API REST ou GraphQL (à arbitrer dans l'étape Architecture).
- Backend stateless, scaling horizontal.
- Queues asynchrones pour : envoi candidatures, ingestion d'offres, génération lettres IA, retraining matching.
- Stockage : Postgres principal + pgvector pour embeddings + objet (S3/MinIO) pour CV PDFs.

### Browser Matrix

| Navigateur | Versions supportées | Justification |
|---|---|---|
| Chrome (mobile + desktop) | 2 dernières versions stables | ~65% de part de marché FR Gen Z |
| Safari iOS | iOS 16+ | iPhone très répandu Gen Z, support PWA correct depuis 16.4 (push notifications web) |
| Safari macOS | 16+ | Cohérent avec iOS |
| Firefox | 2 dernières versions stables | Communauté tech / privacy-aware |
| Edge | 2 dernières versions stables | Mêmes capacités que Chrome (Chromium) |
| Samsung Internet | 23+ | Smartphones Samsung très répandus |
| Opera | 2 dernières versions stables | Quelques % de part de marché mobile |

**Drop explicitement :** Internet Explorer (toutes versions), Safari iOS <15, Android WebView <90. Affichage d'une bannière "Navigateur non supporté → mettez à jour" pour ces visiteurs.

### Responsive Design

- **Mobile-first absolu** : design pensé pour 360-430px de large d'abord, puis élargi vers tablette et desktop.
- **Breakpoints** :
  - Mobile : 360-767px (priorité)
  - Tablette : 768-1023px (deck de cartes plus large, sidebar profil)
  - Desktop : 1024px+ (deck centré, max-width 480px, navigation latérale)
- **Touch-first** : tous les gestes (swipe, tap, long-press) implémentés en natif tactile, fallback souris/trackpad pour desktop. Pas de hover-only states.
- **Densité** : support des écrans haute densité (2x, 3x) pour les images de logos d'entreprises et photos de profil.
- **Orientation** : portrait par défaut, paysage supporté mais non optimisé en V1 (la pile de cartes reste verticale).
- **Safe areas** : respect des notches iOS et barres système Android (env(safe-area-inset)).
- **Inputs** : claviers contextuels mobiles (type="email", "tel", "search"), évitement du zoom intempestif sur focus (`font-size: 16px` minimum sur inputs).

### Performance Targets

| Métrique | Cible | Justification |
|---|---|---|
| Lighthouse Performance (mobile, page principale) | ≥90 | Standard "vert" Google, critère SEO |
| First Contentful Paint (FCP) | <1.5s sur Slow 3G | Premier feedback visuel rapide |
| Largest Contentful Paint (LCP) | <2.5s sur Slow 3G | Critère Core Web Vitals "good" |
| Time to Interactive (TTI) | <3s sur Slow 3G | Cible Gen Z, taux d'abandon élevé sinon |
| Cumulative Layout Shift (CLS) | <0.1 | Pas de "saut" gênant pendant le chargement des cartes |
| Interaction to Next Paint (INP) | <200ms | Feedback fluide sur tap/swipe |
| Bundle JS initial | <200KB gzip | Démarrage rapide sur 4G |
| Bundle JS total app | <800KB gzip | Limite raisonnable pour PWA complexe |
| Latence swipe (geste → animation) | <100ms | Perception "instantanée" |
| Latence génération deck initial | <8s post-upload CV | Onboarding pas trop long |
| Latence génération lettre IA | <3s post-swipe droit | Acceptable avec animation transitoire |
| Mémoire client (PWA installée) | <50MB | Compatible appareils bas-mid range |

**Stratégies techniques :**

- Code splitting agressif par route (auth, onboarding, deck, dashboard).
- Lazy loading des images de logos (`loading="lazy"`).
- Préchargement intelligent du prochain batch de cartes pendant que l'utilisateur swipe le batch courant.
- Cache stratégique du service worker (offline-first pour les assets statiques, network-first pour les données dynamiques).
- HTTP/2 ou HTTP/3 (push possible pour les assets critiques).
- Edge / CDN pour les assets statiques (Cloudflare envisagé).

### SEO Strategy

**Stratégie globale :** SEO important pour l'acquisition organique étudiants, mais limité aux pages publiques (l'app authentifiée n'a pas besoin d'être indexée).

**Pages indexables (SSR/SSG sur www.swipejob.fr) :**

- **Landing page** principale : "Trouve ton alternance en swipant — SwipeJob" (méta titre + description optimisés sur "alternance" et "stage").
- **Pages métier longue traîne** : `/alternance/marketing`, `/alternance/developpeur`, `/alternance/comptable`, etc. Une page par métier x catégorie.
- **Pages géographiques** : `/alternance/paris`, `/alternance/lyon`, `/alternance/toulouse`, etc. Pages par ville + grandes métropoles (50-100 pages).
- **Pages combinées** : `/alternance/developpeur/paris`, etc. Longue traîne riche.
- **Pages école** : `/ecole/sciences-po`, `/ecole/insa` (top 100 écoles françaises). Crée du SEO + valorise les ambassadeurs école.
- **Blog éditorial** : conseils carrière, témoignages étudiants signés, guides alternance. Cible 2 articles / semaine.
- **Pages détail offre public partageable** (URL canonique partageable sur réseaux sociaux) : `/offre/{slug-offre}` — version publique anonymisée et SEO-friendly.

**Optimisations :**

- Sitemap.xml dynamique régénéré quotidiennement.
- robots.txt explicite (autorise crawl pages publiques, interdit zones authentifiées).
- Schema.org JobPosting sur les pages d'offres pour Google Jobs.
- Schema.org Organization sur les pages d'entreprises.
- Schema.org Article sur le blog.
- Canonical URLs pour éviter le contenu dupliqué (offres syndiquées de France Travail).
- Métadonnées OpenGraph + Twitter Cards pour partage social riche.
- Performance optimale (déjà couvert ci-dessus) — critère ranking Google.
- Internal linking riche entre pages métier × ville × école.

**Pages NON indexées (noindex) :**

- Toute zone authentifiée (`app.swipejob.fr/*`).
- Pages utilisateurs (profils étudiants).
- Pages admin / back-office.
- Pages temporaires (recherches utilisateurs, deck, dashboard).

### Real-time Requirements

- **Notifications push** (Web Push API) : envoi quotidien matinal de "5 nouvelles offres matchent ton profil". Pas de notifications temps réel V1.
- **Mise à jour dashboard** : polling toutes les 60s côté client, ou Server-Sent Events (SSE) léger pour les changements de statut candidature.
- **Pas de chat temps réel V1** — feature post-MVP si on ajoute le côté entreprise.
- **Synchronisation multi-onglets** : minimaliste, broadcast channel pour les états critiques (déconnexion, switch profil).
- **WebSocket** : non utilisé en V1, à introduire si besoin temps réel (chat, collaboration) en V2.

### Accessibility Level

- **Cible** : conformité WCAG 2.1 niveau AA (déjà mentionné dans Domain-Specific Reqs).
- **Audit** : automatisé via axe-core en CI + audit humain externe avant lancement public.
- **Points clés couverts :**
  - Navigation clavier complète (tous les gestes swipe ont un équivalent boutons + raccourcis clavier flèches sur desktop).
  - Lecteurs d'écran : ARIA labels sur les cartes (l'utilisateur entend le contenu de l'offre), live regions pour les notifications de candidature envoyée.
  - Contrastes : ratio ≥4.5:1 sur tout texte (à valider en design).
  - Tailles de touch targets : ≥44×44 pixels pour les boutons (recommandation Apple HIG + Android Material Design).
  - Réduction des animations : respect de `prefers-reduced-motion` (animations swipe désactivables pour les utilisateurs sensibles).
  - Mode sombre supporté (respect `prefers-color-scheme`).
  - Pas de seul-couleur comme indicateur d'information (score affiché en chiffre + couleur).
  - Sous-titres et transcriptions sur tout contenu vidéo (blog, témoignages).
- **Déclaration d'accessibilité** publiée et maintenue.

### Implementation Considerations

**Stack technique candidate (à confirmer à l'étape Architecture) :**

- **Frontend** : Next.js 15+ (App Router, RSC) ou Nuxt 4 / SvelteKit selon préférence équipe. Tailwind CSS pour le design system. Framer Motion ou GSAP pour les animations swipe.
- **PWA tooling** : Workbox (gestion du service worker).
- **Backend** : Node.js (Fastify, Hono) ou Python (FastAPI). Décision dépend de la stack IA.
- **DB** : Postgres + pgvector (EU region).
- **Cache** : Redis ou Upstash (EU).
- **Hébergement** : Vercel (EU region) / Scaleway / OVH, selon budget et préférence souveraineté.

**Considérations de déploiement :**

- Mono-repo possible (Turborepo / Nx) pour mutualiser code marketing + app.
- CI/CD : GitHub Actions ou GitLab CI, déploiement automatique sur PR + preview URLs pour QA.
- Feature flags pour rollouts progressifs (LaunchDarkly OSS-alternative, GrowthBook).
- Monitoring : Sentry (errors), Datadog ou Grafana Cloud (perf), Posthog (analytics produit RGPD-friendly).

**Considérations équipe :**

- Le swipe sur web demande un dev frontend solide (animations physiques, perf). Profil à recruter en priorité.
- Backend Node.js ou Python : choisir selon la stack IA (Python = écosystème ML plus riche).
- Designer mobile-first expérimenté (idéalement avec background app dating ou social).

## Project Scoping & Phased Development

### MVP Strategy & Philosophy

**Approche MVP retenue : "Experience MVP" hybride avec touche "Problem-solving MVP"**

Le MVP doit livrer une **expérience produit complète et différenciante dès le J1** — ce n'est pas un MVP minimaliste type "form + email" qui validerait juste un besoin. La raison : le différenciateur de SwipeJob est l'UX swipe addictive + le matching IA pertinent. Sans ces deux composants livrés à un niveau de qualité élevé, on ne valide rien d'utile et on n'enclenche pas la viralité Gen Z indispensable à la croissance.

**Décision stratégique :** on accepte 6 mois de dev (vs 3 mois pour un MVP frugal) pour livrer dès le J1 un produit qui dégage le "moment wow" complet. La validation porte alors sur "est-ce que les utilisateurs reviennent + recommandent + signent" plutôt que sur "est-ce que les utilisateurs comprennent le concept".

**Questions clés et réponses :**

- *Minimum pour "c'est utile" côté utilisateur :* le triptyque swipe-matching-IA + candidature automatique avec lettre IA + dashboard candidatures.
- *Minimum pour "ça a du potentiel" côté investisseurs / partenaires :* preuve de rétention (DAU/MAU ≥20% en mois 3) et de conversion (premières signatures d'alternance reportées en mois 4-5).
- *Fastest path to validated learning :* beta privée mois 4 avec 100 étudiants recrutés via 2-3 écoles partenaires (mesure pertinence matching + taux de complétion deck + premier signal de signature).

### Resource Requirements (MVP, 6 mois)

**Équipe cible minimale pour livrer le MVP en 6 mois :**

| Rôle | ETP | Période | Justification |
|---|---|---|---|
| Product / PM | 1 | M1-M6 | Cadrage continu, priorisation, recherche user (toi probablement) |
| Designer mobile-first | 0.7 | M1-M5 | UX swipe, design system, identité de marque |
| Lead Dev Full-stack | 1 | M1-M6 | Archi, backend, infra |
| Dev Frontend (PWA / animations) | 1 | M1-M6 | Spécialiste interaction tactile et perf web |
| Dev IA / ML Engineer | 0.7 | M2-M6 | Pipeline matching, parsing CV, génération lettres |
| Dev Backend / Data engineer | 0.5 | M2-M6 | Ingestion offres, intégrations, queues |
| DevOps / SRE | 0.3 | M3-M6 | CI/CD, monitoring, mise en prod, scale |
| Légal / DPO externe | 0.2 | M1, M4, M6 | RGPD, conditions générales, conformité IA Act |
| Total ETP cumulé | ~5.4 | | |

**Budget estimatif (hors fondateur) :** 250-350 k€ sur 6 mois (salaires chargés FR moyens + freelance ponctuels). Hors LLM API costs (~5-10 k€), hosting (~3-5 k€/6 mois), tooling.

**Alternatives si budget contraint :**

- Équipe réduite à 3 personnes (PM/founder + 1 full-stack + 1 dev IA) → délai MVP 10-12 mois.
- Solo founder + freelances ponctuels → délai 12-18 mois, risque qualité élevé.

### MVP Feature Set (Phase 1, M1-M6)

**Core User Journeys supported :**

- Persona 1 (Léa, M1 com) — journey happy path complet.
- Persona 2 (Tom, BTS info) — journey avec edge case "deck faible" géré.
- Persona 3 (Yasmine, ingé) — journey avec gestion refus et profil exigeant (avec des limites : pas de coaching IA approfondi en V1, voir Phase 2).

**Must-Have Capabilities (déjà détaillées dans Success Criteria → Product Scope → MVP) :**

- Auth étudiant Google + email/password
- Création profil unique via upload CV PDF parsé par IA
- Préférences ajustables (zone géo, type contrat, télétravail)
- Ingestion d'offres depuis ≥2 sources (France Travail API + 1-2 scraping ciblé)
- Matching IA (embeddings + scoring + explainability minimal)
- Deck de 10-20 cartes / jour avec swipe tactile fluide
- Candidature auto par email avec lettre IA personnalisée
- Dashboard candidatures (sent / replied / interviews / signed)
- Mini-coach pré-entretien (résumé entreprise + questions types)
- Reporting de signature avec badge + parrainage
- Site marketing SSR/SSG avec landing + pages métier × ville × école pour SEO
- Conformité RGPD + WCAG 2.1 AA + Loi Toubon

**Explicitement HORS MVP (justifications) :**

- Côté entreprise (compte employeur, posting d'offres directes) → V2, gros chantier qui dilue le focus initial.
- Premium étudiant payant → V2 mois 6-9, on attend la validation produit avant de monétiser.
- Détection automatique réponses email → V2, complexe techniquement (OAuth Gmail/Outlook), pas bloquant V1 (dashboard manuel suffit).
- Gamification poussée (streaks, badges multiples, classements) → V2, on garde seulement les bases en V1 (animation feedback + badge "Signed").
- Communauté étudiante (témoignages entretien) → V2.
- Coach carrière IA conversationnel approfondi → Vision.
- Mobile natif (iOS / Android via Capacitor) → Vision si traction confirme.

### Post-MVP Features (Phase 2, M6-M12) - Growth

Voir détails en section "Success Criteria → Product Scope → Growth Features". Synthèse :

- Premium étudiant freemium (cible 100k€ ARR fin M12).
- Gamification avancée + notifications intelligentes.
- Intégration email pour détection automatique réponses.
- Communauté étudiante (témoignages entretiens anonymes).
- Optimisation continue du matching basée sur signatures réelles.
- Renforcement marketing / acquisition (parrainages, ambassadeurs école, contenu blog).

### Expansion Features (Phase 3, post-M12) - Vision

Voir détails en section "Success Criteria → Product Scope → Vision". Synthèse :

- Côté entreprise (marketplace 2-côtés, revenue track #2 commission).
- Expansion EU francophones puis EU large.
- Coach carrière IA conversationnel (entretien, négo salaire, orientation).
- Intégrations écoles (SSO, LMS, validation stages).
- Marketplace étendue (CDD, CDI, freelance étudiant).
- Mobile natif si traction.

### Risk Mitigation Strategy

**Risques techniques :**

| Risque | Mitigation MVP | Plan B |
|---|---|---|
| Performance swipe web insuffisante sur appareils bas-mid range | Prototype dédié semaine 2-4, test sur Android Go et iPhone SE | "Tap mode" en option, dégradation gracieuse |
| Coûts LLM trop élevés à l'échelle | Cache des embeddings (calcul 1x par CV puis stockage pgvector), modèles légers pour scoring (e5-mistral local), Mistral plutôt que OpenAI/Anthropic premium | Modèle 100% règles + keywords + embeddings simple si IA trop chère |
| Ingestion offres bloquée (cease & desist scraping) | Priorité absolue à France Travail API officielle + partenariats explicites (1jeune1solution) | Crowdsourcing étudiant (signalements d'offres trouvées ailleurs) |
| Spam classification des emails de candidature | Warm-up IP progressif, SPF/DKIM/DMARC, cap quotidien par utilisateur | OAuth Gmail (envoi depuis l'email étudiant authentifié, contourne la classification) |

**Risques marché :**

| Risque | Mitigation MVP | Plan B |
|---|---|---|
| Acquisition trop coûteuse (CAC > LTV) | Privilégier viralité organique (parrainage école + ambassadeurs étudiants + SEO longue traîne) plutôt que ads payantes Meta/TikTok | Pivot vers B2B2C (écoles paient pour offrir l'app à leurs étudiants) |
| Cible Gen Z ne convertit pas en premium payant | Validation par cohorte mois 6-9 avant push monétisation | Pivot vers commission entreprises ou abonnement école |
| Concurrent imite swipe en 6 mois | Différenciation via marque + community + UX raffinée + données propriétaires de signatures | Course à la marque + partenariats exclusifs (écoles, alumni) |
| AI Act EU 2026 contraint l'algo | Architecture explicable dès J1, audit trails | Affecte TOUS les concurrents, avantage relatif |

**Risques ressources :**

| Risque | Mitigation MVP | Plan B |
|---|---|---|
| Budget plus serré que prévu | Stack open source, infra Scaleway/OVH économique, freelances ponctuels | MVP en 9-12 mois avec équipe réduite à 3 personnes |
| Recrutement dev frontend swipe difficile | Sourcing actif dès M1, profil "ex-jeux mobile" ou "ex-Tinder/Bumble" | Recours à un freelance senior + transfert progressif sur un junior |
| Designer mobile-first non disponible | Sourcing dès M1 (chasse profils ex-Snapchat, BeReal, Frichti) | Système design open source (shadcn/ui mobile-first) + identité simple pour V1 |
| Conformité RGPD/IA Act sous-estimée | DPO externe consulté dès M1 (revue mensuelle), plan d'audit pré-lancement | Reporter le lancement si non-conformité bloquante |

## Functional Requirements

### Onboarding & Profile Management

- **FR1** : Un nouvel utilisateur peut s'inscrire via OAuth Google sans saisir de mot de passe.
- **FR2** : Un nouvel utilisateur peut s'inscrire via email + mot de passe avec validation email obligatoire avant accès aux fonctionnalités.
- **FR3** : Un utilisateur peut téléverser un CV au format PDF (jusqu'à 10 MB).
- **FR4** : Le système peut extraire automatiquement depuis un CV PDF les informations structurées suivantes : identité (nom, email, téléphone), parcours académique (école, niveau, spécialité), expériences professionnelles (titre, entreprise, dates, missions), compétences techniques et soft skills, langues, intérêts.
- **FR5** : Un utilisateur peut corriger ou compléter manuellement les informations extraites de son CV avant validation du profil.
- **FR6** : Un utilisateur peut définir ses préférences de recherche : type de contrat (stage, alternance), durée recherchée, zones géographiques cibles (villes, rayon), télétravail (sur place / hybride / 100% remote), secteurs d'activité, taille d'entreprise, fourchette de salaire, date de démarrage souhaitée.
- **FR7** : Un utilisateur peut ajuster ses préférences à tout moment et voir l'impact immédiat sur les offres proposées.
- **FR8** : Un utilisateur peut renseigner son école et son niveau d'études dans une liste référentielle pré-établie (top 500 écoles françaises minimum).
- **FR9** : Le système peut vérifier l'âge de l'utilisateur à l'inscription et exiger un consentement parental documenté pour les utilisateurs de moins de 18 ans.
- **FR10** : Un utilisateur peut consulter, modifier et supprimer son profil à tout moment.

### Offer Ingestion & Catalog

- **FR11** : Le système peut ingérer des offres d'emploi depuis l'API France Travail (anciennement Pôle Emploi) de manière périodique.
- **FR12** : Le système peut ingérer des offres depuis au moins une source secondaire (scraping ciblé conforme aux ToS ou flux RSS partenaire).
- **FR13** : Le système peut normaliser les offres en un format interne unifié contenant au minimum : titre, entreprise, localisation, type de contrat, durée, description, compétences requises, niveau d'études attendu, salaire estimé, date de publication, date d'expiration, lien source, contact email de candidature.
- **FR14** : Le système peut détecter et fusionner automatiquement les doublons d'offres publiées sur plusieurs sources.
- **FR15** : Le système peut désactiver automatiquement les offres expirées ou pourvues selon les signaux des sources.
- **FR16** : Un administrateur peut signaler manuellement une offre comme problématique (frauduleuse, discriminatoire, expirée non détectée) et la retirer du catalogue.
- **FR17** : Le système peut maintenir un catalogue d'au moins 5 000 offres actives en permanence pour le marché français.

### Matching & Recommendation

- **FR18** : Le système peut calculer un score de compatibilité entre un profil utilisateur et chaque offre du catalogue.
- **FR19** : Le score de compatibilité repose sur la similarité sémantique entre les compétences du CV et les compétences requises par l'offre, les préférences déclarées de l'utilisateur, et la cohérence géographique et contractuelle.
- **FR20** : Le système peut générer un deck quotidien personnalisé de 10 à 20 offres pour chaque utilisateur actif, ordonné par score de compatibilité décroissant.
- **FR21** : Un utilisateur peut consulter, pour chaque offre du deck, une explication textuelle des raisons du score (compétences en commun, écarts détectés).
- **FR22** : Le système peut détecter une situation de pénurie d'offres pour un utilisateur (deck < 10 cartes possibles) et lui suggérer un élargissement de critères pertinent.
- **FR23** : Le système peut exclure du matching les critères protégés par la loi française contre la discrimination (âge, sexe, origine, situation de famille, etc.) et ne jamais les utiliser comme variables de scoring.
- **FR24** : Le système peut maintenir un journal auditable des calculs de matching pour une offre donnée et un profil donné (traçabilité conformité IA Act).

### Swipe & Application

- **FR25** : Un utilisateur peut visualiser une carte d'offre comportant au moins : logo de l'entreprise, titre du poste, nom de l'entreprise, localisation, type de contrat, durée, score de compatibilité, résumé court de l'offre.
- **FR26** : Un utilisateur peut consulter le détail complet d'une offre depuis la carte avant de swiper.
- **FR27** : Un utilisateur peut indiquer son intérêt pour une offre par un geste de swipe vers la droite (équivalent clavier sur desktop).
- **FR28** : Un utilisateur peut passer une offre par un geste de swipe vers la gauche (équivalent clavier sur desktop).
- **FR29** : Un utilisateur peut sauvegarder une offre pour plus tard par un geste de swipe vers le haut (équivalent clavier sur desktop).
- **FR30** : Lorsqu'un utilisateur swipe droite, le système peut générer automatiquement une lettre de motivation personnalisée à l'offre en moins de 3 secondes.
- **FR31** : Lorsqu'un utilisateur swipe droite, le système peut envoyer automatiquement une candidature par email à l'adresse de contact de l'offre, contenant le CV attaché et la lettre de motivation générée.
- **FR32** : Un utilisateur peut prévisualiser la lettre générée avant envoi en activant un mode "revue avant envoi" dans ses préférences.
- **FR33** : Un utilisateur peut annuler une candidature dans les 30 secondes qui suivent l'envoi (undo).
- **FR34** : Le système peut limiter le nombre de swipes droits à un quota quotidien configurable par profil (gratuit / premium, mineur / majeur).
- **FR35** : Le système peut empêcher un utilisateur de candidater plusieurs fois à la même offre.

### Communication & Follow-up

- **FR36** : Un utilisateur peut consulter un tableau de bord listant toutes ses candidatures envoyées avec leur statut (envoyée, lue, réponse reçue, entretien planifié, signature, refus).
- **FR37** : Un utilisateur peut modifier manuellement le statut d'une candidature dans son tableau de bord.
- **FR38** : Un utilisateur peut reporter une signature d'alternance ou de stage via un bouton dédié et déclencher la mécanique de récompense.
- **FR39** : Un utilisateur peut recevoir des notifications push web quotidiennes (le matin par défaut, horaire configurable) signalant les nouvelles offres pertinentes.
- **FR40** : Un utilisateur peut recevoir un email de récapitulatif hebdomadaire de son activité et de ses opportunités.
- **FR41** : Un utilisateur peut désactiver ou ajuster la fréquence de chaque canal de communication (push, email, sms futur).
- **FR42** : Un utilisateur peut consulter une fiche de préparation avant un entretien planifié comportant un résumé de l'entreprise, les questions types attendues et un rappel des points forts du matching.

### Engagement & Retention

- **FR43** : Un utilisateur peut consulter son historique de swipe quotidien et ses streaks (nombre de jours consécutifs d'utilisation).
- **FR44** : Un utilisateur peut débloquer et consulter des badges liés à ses jalons (premier swipe, première candidature, première réponse, première signature, etc.).
- **FR45** : Un utilisateur peut générer un lien de parrainage unique et personnel à partager avec ses pairs.
- **FR46** : Le système peut tracer les inscriptions issues d'un lien de parrainage et attribuer une récompense au parrain (badge V1, bonus premium en V2).
- **FR47** : Un utilisateur peut partager une offre publiquement avec un lien anonymisé (sans révéler son profil) sur les réseaux sociaux.

### Compliance & Privacy

- **FR48** : Un utilisateur peut consulter à tout moment la politique de confidentialité et les conditions générales d'utilisation.
- **FR49** : Un utilisateur peut donner ou retirer son consentement explicite pour chaque finalité de traitement (matching, marketing, analytics, lecture email pour détection réponses).
- **FR50** : Un utilisateur peut exporter l'intégralité de ses données personnelles dans un format structuré (JSON et PDF) en moins de 24 heures suivant la demande.
- **FR51** : Un utilisateur peut demander la suppression complète de son compte et de ses données, exécutée sous 30 jours.
- **FR52** : Le système peut maintenir un journal d'audit des accès et modifications des données personnelles pour les utilisateurs et les administrateurs.
- **FR53** : Le système peut anonymiser ou pseudonymiser les CV et profils stockés au-delà de 24 mois d'inactivité.
- **FR54** : Toutes les communications produites par le système à destination du marché français (lettres, emails, notifications, interface) doivent être en français (conformité Loi Toubon).
- **FR55** : Le système peut afficher une déclaration d'accessibilité publique et permettre aux utilisateurs de signaler un défaut d'accessibilité.

### Marketing & Acquisition

- **FR56** : Le système peut générer dynamiquement des pages publiques SEO indexables par métier, par ville, par école et par combinaisons des trois.
- **FR57** : Une page publique d'offre peut afficher un sous-ensemble anonymisé d'informations permettant à un visiteur non connecté de comprendre l'offre et d'être incité à s'inscrire.
- **FR58** : Le système peut générer et maintenir un sitemap.xml et un fichier robots.txt cohérents avec la structure SEO.
- **FR59** : Le système peut intégrer des métadonnées Schema.org JobPosting sur les pages d'offres publiques pour indexation par Google Jobs.
- **FR60** : Un utilisateur authentifié peut accéder à une bibliothèque d'articles éditoriaux (blog) avec contenu de conseils carrière et guides alternance.

### Admin & Back-office (minimal V1)

- **FR61** : Un administrateur peut s'authentifier sur une interface back-office distincte de l'app utilisateur.
- **FR62** : Un administrateur peut consulter et modérer les offres ingérées (signaler, supprimer, marquer comme prioritaire).
- **FR63** : Un administrateur peut consulter la liste des utilisateurs et leur état (actif, suspendu, supprimé).
- **FR64** : Un administrateur peut traiter une demande utilisateur de droit RGPD (export, suppression, rectification).
- **FR65** : Un administrateur peut consulter les métriques produit (KPIs définis dans Success Criteria) sur un tableau de bord interne.

## Non-Functional Requirements

### Performance

- **NFR-P1** : Le geste de swipe doit produire un feedback visuel en moins de 100 ms sur tout appareil supporté.
- **NFR-P2** : Le premier affichage utile (First Contentful Paint) de la landing publique doit être inférieur à 1,5 s sur réseau Slow 3G simulé.
- **NFR-P3** : Le Largest Contentful Paint des pages SEO publiques doit être inférieur à 2,5 s (critère Google Core Web Vitals "good").
- **NFR-P4** : Le Time to Interactive de l'app authentifiée doit être inférieur à 3 s sur réseau Slow 3G simulé.
- **NFR-P5** : La génération du deck initial post-upload CV doit aboutir en moins de 8 secondes pour 95 % des utilisateurs.
- **NFR-P6** : La génération d'une lettre de motivation par IA après un swipe droit doit aboutir en moins de 3 secondes pour 95 % des candidatures.
- **NFR-P7** : Le bundle JavaScript initial chargé pour l'app authentifiée ne doit pas dépasser 200 KB gzippés.
- **NFR-P8** : Le bundle JavaScript total de l'app authentifiée ne doit pas dépasser 800 KB gzippés.
- **NFR-P9** : Le score Lighthouse Performance (mobile) doit être supérieur ou égal à 90 sur la page principale de l'app et sur la landing publique.
- **NFR-P10** : Le système doit supporter au minimum 1 000 utilisateurs concurrents swipant simultanément sans dégradation perceptible (>200 ms de latence ajoutée).

### Security

- **NFR-S1** : Toutes les communications client-serveur doivent transiter en HTTPS avec TLS 1.3 minimum.
- **NFR-S2** : Les mots de passe utilisateurs doivent être hashés avec argon2id (paramètres recommandés OWASP 2024).
- **NFR-S3** : Les données personnelles sensibles (CV, email, téléphone, école) doivent être chiffrées au repos avec AES-256.
- **NFR-S4** : Les secrets applicatifs (clés API, tokens) doivent être stockés dans un vault dédié et jamais en clair dans le code ou les variables d'environnement de production.
- **NFR-S5** : Le système doit appliquer un rate limiting de 100 requêtes par minute par adresse IP sur les endpoints publics non authentifiés.
- **NFR-S6** : Le système doit invalider toute session utilisateur inactive au-delà de 30 jours et offrir une option de déconnexion immédiate.
- **NFR-S7** : Un journal d'audit immuable doit tracer chaque accès, modification ou suppression de données personnelles, avec rétention de 13 mois minimum (recommandation CNIL).
- **NFR-S8** : Le système doit faire l'objet d'un audit de sécurité externe (pentest) avant le lancement public et tous les 12 mois ensuite.
- **NFR-S9** : Les vulnérabilités critiques (CVSS ≥ 9.0) doivent être corrigées en moins de 48 heures après détection.
- **NFR-S10** : Aucune donnée utilisateur personnelle (PII) ne doit transiter vers les LLMs de fournisseurs hors UE sans clause contractuelle de non-rétention et hébergement EU validée par le DPO.

### Scalability

- **NFR-Sc1** : L'architecture doit supporter une montée en charge de ×10 sans refonte (objectif 12 mois : 30 000 utilisateurs ; capacité de 300 000 sans rework).
- **NFR-Sc2** : Le backend doit être stateless pour permettre un scaling horizontal automatisé.
- **NFR-Sc3** : Les traitements lourds (parsing CV, génération embeddings, génération lettres, ingestion offres) doivent être asynchrones via une file de messages et ne pas bloquer les requêtes utilisateur.
- **NFR-Sc4** : La base de données principale doit supporter au minimum 10 000 utilisateurs actifs hebdomadaires avec un temps de réponse moyen inférieur à 100 ms sur les requêtes critiques.
- **NFR-Sc5** : Le système doit pouvoir absorber un pic d'inscription ×5 sur 24 heures (campagne marketing, post viral) sans interruption de service.
- **NFR-Sc6** : Le coût d'infrastructure et de LLM par utilisateur actif mensuel doit rester inférieur à 0,15 € à l'échelle de 30 000 utilisateurs (cible business).

### Reliability & Availability

- **NFR-R1** : Le système doit maintenir une disponibilité (uptime) supérieure ou égale à 99,5 % calculée sur 12 mois glissants, hors fenêtres de maintenance planifiées.
- **NFR-R2** : Les fenêtres de maintenance planifiées doivent être annoncées 7 jours à l'avance et n'excéder pas 2 heures par mois.
- **NFR-R3** : Le système doit pouvoir restaurer le service en moins de 60 minutes (RTO) après une panne majeure.
- **NFR-R4** : Les sauvegardes de la base de données doivent être quotidiennes avec une perte maximale acceptable de 1 heure de données (RPO).
- **NFR-R5** : Un plan de continuité d'activité documenté doit être testé une fois par trimestre via un exercice de restauration.
- **NFR-R6** : En cas d'indisponibilité d'un provider LLM, le système doit basculer automatiquement vers un fournisseur secondaire ou un mode dégradé (matching keyword + lettre template) sans bloquer l'utilisateur.

### Accessibility

- **NFR-A1** : Le système doit être conforme à WCAG 2.1 niveau AA pour toutes les pages publiques et l'app authentifiée principale.
- **NFR-A2** : Toutes les interactions tactiles (swipe) doivent avoir un équivalent clavier et bouton accessible (boutons "Candidater", "Passer", "Sauvegarder").
- **NFR-A3** : Le ratio de contraste de tout texte sur son fond doit être supérieur ou égal à 4,5:1 (texte normal) et 3:1 (texte grand).
- **NFR-A4** : Les zones tactiles interactives doivent mesurer au minimum 44×44 pixels.
- **NFR-A5** : Le système doit respecter la préférence `prefers-reduced-motion` et désactiver les animations pour les utilisateurs concernés.
- **NFR-A6** : Le système doit supporter les lecteurs d'écran les plus répandus (NVDA, JAWS, VoiceOver, TalkBack) sur toutes les fonctionnalités majeures.
- **NFR-A7** : Une déclaration d'accessibilité publique doit être maintenue à jour et accessible depuis le pied de page de toutes les pages.
- **NFR-A8** : Un audit d'accessibilité automatisé (axe-core) doit être exécuté en intégration continue et bloquer les régressions critiques avant déploiement.

### Integration

- **NFR-I1** : Le système doit consommer l'API France Travail avec gestion automatique des limites de quota, retries avec backoff exponentiel, et alerting en cas d'indisponibilité prolongée (>15 minutes).
- **NFR-I2** : Le système doit pouvoir intégrer une nouvelle source d'offres en moins de 5 jours-homme de développement (architecture extensible via adaptateurs).
- **NFR-I3** : Les envois email doivent passer par un fournisseur SMTP hébergé en UE avec configuration SPF, DKIM et DMARC du domaine d'envoi.
- **NFR-I4** : Le taux de délivrabilité des emails de candidature doit être supérieur à 95 % (mesuré par tracking SMTP).
- **NFR-I5** : Le système d'envoi email doit implémenter un warm-up IP progressif et un cap quotidien configurable par utilisateur pour éviter le classement spam.
- **NFR-I6** : L'intégration paiement (Stripe) ne doit jamais stocker de données de cartes côté SwipeJob (utilisation exclusive de Stripe Elements et tokens).

### Localization & Language

- **NFR-L1** : Toute interface, communication et contenu généré (lettres de motivation, emails) doit être en français pour le marché français (conformité Loi Toubon).
- **NFR-L2** : L'architecture doit être prête pour la localisation (i18n) afin de supporter d'autres langues européennes en V2 sans refonte majeure.
- **NFR-L3** : Le système doit gérer correctement les caractères accentués et les signes typographiques français (espaces insécables, guillemets « »).

### Observability & Monitoring

- **NFR-O1** : Le système doit collecter et exposer en continu des métriques de santé (latence, taux d'erreur, throughput) sur tous les services critiques.
- **NFR-O2** : Une alerte automatique doit être déclenchée en cas d'anomalie critique (latence p95 dépassée, taux d'erreur >1 %, indisponibilité d'un service externe).
- **NFR-O3** : Les erreurs applicatives doivent être tracées avec un identifiant unique de corrélation traversant tous les services (distributed tracing).
- **NFR-O4** : Un tableau de bord opérationnel temps réel doit être accessible à l'équipe technique 24/7.
- **NFR-O5** : Les logs applicatifs doivent être conservés 30 jours minimum, les logs d'audit sécurité/RGPD 13 mois minimum.

### Fairness & Algorithmic Accountability

- **NFR-F1** : Le modèle de matching doit être audité tous les 3 mois pour détecter des biais sur les critères protégés (parité de score moyen par genre, origine, école sans corrélation avec les critères protégés).
- **NFR-F2** : Le système doit produire pour chaque score de matching un set de features contributives explicables (importance des compétences, des préférences, de la géographie).
- **NFR-F3** : Un humain doit pouvoir auditer manuellement le score de matching d'un utilisateur sur une offre donnée via l'interface admin, en moins de 30 secondes.
- **NFR-F4** : Aucune décision algorithmique automatisée ne doit produire d'effet juridique sans validation humaine de l'utilisateur (le swipe reste une décision de l'utilisateur — article 22 RGPD).
- **NFR-F5** : Un mécanisme de "kill switch" humain doit permettre de désactiver immédiatement le matching IA et de basculer vers un matching règles + keywords en cas de problème détecté.
