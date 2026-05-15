---
stepsCompleted: ['step-01-validate-prerequisites', 'step-02-design-epics', 'step-03-create-stories', 'step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prd.md'
  - '_bmad-output/planning-artifacts/architecture.md'
  - '_bmad-output/planning-artifacts/ux-design-specification.md'
  - '_bmad-output/planning-artifacts/product-brief.md'
workflowType: 'epics-and-stories'
project_name: 'SwipeJob'
user_name: 'Danii'
date: '2026-05-15'
status: 'complete'
completedAt: '2026-05-15'
totalEpics: 8
totalStories: 66
totalFRsCovered: 65
totalNFRsAddressed: 53
---

# SwipeJob — Epic Breakdown

## Overview

Ce document fournit le découpage complet en epics et stories pour SwipeJob, en décomposant les exigences du PRD, de la spécification UX, et de l'architecture en stories implémentables.

## Requirements Inventory

### Functional Requirements

**Onboarding & Profile Management :**

- **FR1** : Un nouvel utilisateur peut s'inscrire via OAuth Google sans saisir de mot de passe.
- **FR2** : Un nouvel utilisateur peut s'inscrire via email + mot de passe avec validation email obligatoire.
- **FR3** : Un utilisateur peut téléverser un CV au format PDF (jusqu'à 10 MB).
- **FR4** : Le système extrait automatiquement depuis un CV PDF : identité, parcours académique, expériences, compétences, langues, intérêts.
- **FR5** : Un utilisateur peut corriger/compléter manuellement les informations extraites de son CV.
- **FR6** : Un utilisateur peut définir ses préférences de recherche : contrat, durée, géographie, télétravail, secteurs, taille entreprise, salaire, date démarrage.
- **FR7** : Un utilisateur peut ajuster ses préférences à tout moment avec impact immédiat sur les offres.
- **FR8** : Un utilisateur peut renseigner son école et niveau d'études dans une liste référentielle (top 500 écoles françaises minimum).
- **FR9** : Le système vérifie l'âge à l'inscription et exige consentement parental pour <18 ans.
- **FR10** : Un utilisateur peut consulter, modifier et supprimer son profil à tout moment.

**Offer Ingestion & Catalog :**

- **FR11** : Le système ingère des offres depuis l'API France Travail périodiquement.
- **FR12** : Le système ingère des offres depuis au moins une source secondaire (scraping conforme ou flux RSS).
- **FR13** : Le système normalise les offres en format interne unifié (titre, entreprise, localisation, contrat, durée, description, compétences, niveau, salaire, dates, lien, contact).
- **FR14** : Le système détecte et fusionne automatiquement les doublons d'offres multi-sources.
- **FR15** : Le système désactive automatiquement les offres expirées ou pourvues.
- **FR16** : Un administrateur peut signaler manuellement une offre problématique et la retirer.
- **FR17** : Le système maintient un catalogue d'au moins 5 000 offres actives en permanence (marché français).

**Matching & Recommendation :**

- **FR18** : Le système calcule un score de compatibilité entre un profil et chaque offre du catalogue.
- **FR19** : Le score repose sur la similarité sémantique compétences, préférences déclarées, cohérence géographique/contractuelle.
- **FR20** : Le système génère un deck quotidien personnalisé de 10-20 offres ordonné par score décroissant.
- **FR21** : Un utilisateur peut consulter une explication textuelle des raisons du score pour chaque offre.
- **FR22** : Le système détecte une pénurie d'offres (deck <10 cartes) et suggère un élargissement de critères pertinent.
- **FR23** : Le système exclut du matching tous les critères protégés contre la discrimination (âge, sexe, origine, situation familiale, etc.).
- **FR24** : Le système maintient un journal auditable des calculs de matching (traçabilité IA Act).

**Swipe & Application :**

- **FR25** : Un utilisateur visualise une carte d'offre : logo, titre, entreprise, localisation, contrat, durée, score, résumé court.
- **FR26** : Un utilisateur peut consulter le détail complet d'une offre depuis la carte avant de swiper.
- **FR27** : Un utilisateur indique son intérêt par swipe droite (équivalent clavier sur desktop).
- **FR28** : Un utilisateur passe une offre par swipe gauche (équivalent clavier sur desktop).
- **FR29** : Un utilisateur sauvegarde une offre par swipe haut (équivalent clavier sur desktop).
- **FR30** : Au swipe droite, le système génère automatiquement une lettre de motivation personnalisée en <3s.
- **FR31** : Au swipe droite, le système envoie automatiquement une candidature par email avec CV + lettre.
- **FR32** : Un utilisateur peut prévisualiser la lettre avant envoi (mode "revue avant envoi" en préférences).
- **FR33** : Un utilisateur peut annuler une candidature dans les 30 secondes suivant l'envoi (undo).
- **FR34** : Le système limite le nombre de swipes droits par quota quotidien configurable (gratuit/premium, mineur/majeur).
- **FR35** : Le système empêche un utilisateur de candidater plusieurs fois à la même offre.

**Communication & Follow-up :**

- **FR36** : Un utilisateur consulte un tableau de bord des candidatures avec statut (envoyée, lue, réponse, entretien, signature, refus).
- **FR37** : Un utilisateur peut modifier manuellement le statut d'une candidature.
- **FR38** : Un utilisateur peut reporter une signature et déclencher la mécanique de récompense.
- **FR39** : Un utilisateur reçoit des notifications push web quotidiennes (horaire configurable).
- **FR40** : Un utilisateur reçoit un email de récapitulatif hebdomadaire d'activité et opportunités.
- **FR41** : Un utilisateur peut désactiver/ajuster la fréquence de chaque canal de communication.
- **FR42** : Un utilisateur consulte une fiche de préparation avant entretien (résumé entreprise, questions types, points forts).

**Engagement & Retention :**

- **FR43** : Un utilisateur consulte son historique de swipe quotidien et ses streaks.
- **FR44** : Un utilisateur peut débloquer et consulter des badges liés aux jalons (premier swipe, première candidature, signature, etc.).
- **FR45** : Un utilisateur peut générer un lien de parrainage unique à partager avec ses pairs.
- **FR46** : Le système trace les inscriptions par parrainage et attribue une récompense au parrain.
- **FR47** : Un utilisateur peut partager une offre publiquement avec un lien anonymisé.

**Compliance & Privacy :**

- **FR48** : Un utilisateur peut consulter à tout moment politique de confidentialité et CGU.
- **FR49** : Un utilisateur peut donner/retirer son consentement explicite par finalité (matching, marketing, analytics, email read).
- **FR50** : Un utilisateur peut exporter ses données personnelles (JSON et PDF) en <24h.
- **FR51** : Un utilisateur peut demander la suppression complète de son compte, exécutée sous 30 jours.
- **FR52** : Le système maintient un journal d'audit des accès et modifications des données personnelles.
- **FR53** : Le système anonymise/pseudonymise les CV au-delà de 24 mois d'inactivité.
- **FR54** : Toutes les communications produites sont en français (Loi Toubon).
- **FR55** : Le système affiche une déclaration d'accessibilité publique avec mécanisme de signalement.

**Marketing & Acquisition :**

- **FR56** : Le système génère dynamiquement des pages publiques SEO par métier, ville, école, combinaisons.
- **FR57** : Une page publique d'offre affiche un sous-ensemble anonymisé invitant à s'inscrire.
- **FR58** : Le système génère et maintient un sitemap.xml et robots.txt cohérents.
- **FR59** : Le système intègre des métadonnées Schema.org JobPosting sur les pages publiques.
- **FR60** : Un utilisateur authentifié accède à une bibliothèque d'articles éditoriaux (blog).

**Admin & Back-office :**

- **FR61** : Un administrateur s'authentifie sur une interface back-office distincte.
- **FR62** : Un administrateur consulte et modère les offres ingérées.
- **FR63** : Un administrateur consulte la liste des utilisateurs et leur état.
- **FR64** : Un administrateur traite une demande RGPD (export, suppression, rectification).
- **FR65** : Un administrateur consulte les métriques produit sur un tableau de bord interne.

### NonFunctional Requirements

**Performance :**

- **NFR-P1** : Feedback visuel swipe < 100 ms sur tout appareil supporté.
- **NFR-P2** : FCP landing publique < 1,5 s sur Slow 3G.
- **NFR-P3** : LCP pages SEO < 2,5 s (Core Web Vitals "good").
- **NFR-P4** : TTI app authentifiée < 3 s sur Slow 3G.
- **NFR-P5** : Génération deck post-upload CV < 8 s pour 95% des utilisateurs.
- **NFR-P6** : Génération lettre IA post-swipe droite < 3 s pour 95% des candidatures.
- **NFR-P7** : Bundle JS initial app authentifiée ≤ 200 KB gzippés.
- **NFR-P8** : Bundle JS total app authentifiée ≤ 800 KB gzippés.
- **NFR-P9** : Lighthouse Performance (mobile) ≥ 90 sur app principale et landing.
- **NFR-P10** : 1 000 utilisateurs concurrents swipant simultanément sans dégradation >200 ms.

**Security :**

- **NFR-S1** : Communications HTTPS avec TLS 1.3 minimum.
- **NFR-S2** : Mots de passe hashés avec argon2id (params OWASP 2024).
- **NFR-S3** : PII sensibles (CV, email, téléphone, école) chiffrées AES-256 au repos.
- **NFR-S4** : Secrets dans vault dédié, jamais en clair dans code/env production.
- **NFR-S5** : Rate limiting 100 req/min/IP sur endpoints publics non authentifiés.
- **NFR-S6** : Invalidation session inactive >30j, déconnexion immédiate disponible.
- **NFR-S7** : Audit log immuable des accès/modifications PII, rétention 13 mois (CNIL).
- **NFR-S8** : Pentest externe avant lancement public et tous les 12 mois.
- **NFR-S9** : Vulnérabilités critiques (CVSS ≥9.0) corrigées en <48h.
- **NFR-S10** : Aucune PII vers LLM hors UE sans clause non-rétention et hébergement EU validés DPO.

**Scalability :**

- **NFR-Sc1** : Architecture ×10 sans refonte (30k users 12 mois, capacité 300k).
- **NFR-Sc2** : Backend stateless pour scaling horizontal automatisé.
- **NFR-Sc3** : Traitements lourds asynchrones via file de messages.
- **NFR-Sc4** : DB ≥10k WAU avec response time moyen <100ms sur requêtes critiques.
- **NFR-Sc5** : Pic inscription ×5 sur 24h sans interruption.
- **NFR-Sc6** : Coût infra+LLM <0,15€/MAU à 30k users.

**Reliability :**

- **NFR-R1** : Uptime ≥99,5% sur 12 mois glissants hors maintenance planifiée.
- **NFR-R2** : Maintenance planifiée annoncée 7j avant, max 2h/mois.
- **NFR-R3** : RTO <60min après panne majeure.
- **NFR-R4** : Backups DB quotidiens, RPO 1h.
- **NFR-R5** : Plan continuité testé 1×/trimestre.
- **NFR-R6** : Fallback LLM automatique vers fournisseur secondaire ou mode dégradé.

**Accessibility :**

- **NFR-A1** : Conformité WCAG 2.1 AA sur pages publiques et app principale.
- **NFR-A2** : Toute interaction tactile (swipe) a équivalent clavier et bouton.
- **NFR-A3** : Contraste ≥4,5:1 (texte normal) et 3:1 (texte grand).
- **NFR-A4** : Zones tactiles ≥44×44 px.
- **NFR-A5** : Respect `prefers-reduced-motion`.
- **NFR-A6** : Support lecteurs d'écran (NVDA, JAWS, VoiceOver, TalkBack).
- **NFR-A7** : Déclaration d'accessibilité publique maintenue à jour.
- **NFR-A8** : Audit axe-core en CI bloquant régressions critiques.

**Integration :**

- **NFR-I1** : API France Travail avec gestion quotas, retries backoff exponentiel, alerting indisponibilité >15min.
- **NFR-I2** : Nouvelle source d'offres intégrable en <5 j-h (architecture extensible via adaptateurs).
- **NFR-I3** : SMTP UE avec SPF/DKIM/DMARC.
- **NFR-I4** : Délivrabilité emails candidature >95%.
- **NFR-I5** : Warm-up IP progressif + cap quotidien par user.
- **NFR-I6** : Stripe : aucun stockage de cartes côté SwipeJob (Elements + tokens).

**Localization :**

- **NFR-L1** : Toute interface/communication/contenu en français pour le marché français (Loi Toubon).
- **NFR-L2** : Architecture i18n-ready pour expansion EU V2.
- **NFR-L3** : Gestion caractères accentués et signes typographiques français.

**Observability :**

- **NFR-O1** : Métriques santé en continu (latence, error rate, throughput) sur services critiques.
- **NFR-O2** : Alerte automatique sur anomalies critiques (p95 dépassé, error rate >1%, indispo service externe).
- **NFR-O3** : Distributed tracing avec ID unique de corrélation.
- **NFR-O4** : Dashboard opérationnel temps réel accessible 24/7.
- **NFR-O5** : Logs applicatifs 30j minimum, logs audit sécurité/RGPD 13 mois minimum.

**Fairness & Algorithmic Accountability :**

- **NFR-F1** : Audit modèle matching trimestriel pour détecter biais sur critères protégés.
- **NFR-F2** : Features contributives explicables pour chaque score de matching.
- **NFR-F3** : Audit manuel d'un score par admin en <30s via interface admin.
- **NFR-F4** : Aucune décision automatisée à effet juridique sans validation humaine (art. 22 RGPD).
- **NFR-F5** : Kill switch humain pour désactiver matching IA et basculer vers matching règles+keywords.

### Additional Requirements

**Starter Template (Architecture step 3) :**

- **AR1** : Bootstrap monorepo Turborepo avec structure `apps/web` (Next.js 15) + `apps/worker` (Node.js BullMQ) + `packages/*` (db, types, llm, ui, config). Commande : `pnpm dlx create-turbo@latest swipejob --use-pnpm`.

**Infrastructure & Deployment (Architecture step 4) :**

- **AR2** : Setup base de données Neon (PostgreSQL 16 EU Paris) avec extension pgvector 0.7+ pour embeddings, branching par PR.
- **AR3** : Setup ORM Drizzle 0.36+ avec schémas Zod-typed et migrations drizzle-kit dans `packages/db`.
- **AR4** : Setup Redis Upstash EU Frankfurt pour rate-limiting (Upstash Ratelimit) et queue BullMQ.
- **AR5** : Setup Cloudflare R2 EU pour storage objets (CV, lettres) avec URL signées.
- **AR6** : Setup hosting Vercel Pro CDG pour `apps/web` avec preview URLs auto sur PR.
- **AR7** : Setup hosting Railway EU-West (Amsterdam) pour `apps/worker` via Dockerfile.
- **AR8** : Setup pipeline GitHub Actions (lint + typecheck + test + build + axe-core a11y + bundle size check) bloquant.

**Authentication & Security (Architecture step 4) :**

- **AR9** : Setup Auth.js v5 avec Google OAuth + Credentials provider (email/password), sessions DB (pas JWT) pour révocation immédiate RGPD.
- **AR10** : Implémenter wrapper `requireAuth()` pour Route Handlers et middleware Auth.js pour routes `(app)/*`.
- **AR11** : Implémenter audit logs append-only table `audit_log` + helper `auditLog()` appelé depuis toutes actions sensibles.

**LLM Architecture (Architecture step 4) :**

- **AR12** : Setup `packages/llm` avec wrapper routage Mistral La Plateforme (`mistral-large-latest` + `mistral-embed`) primaire + Anthropic Claude EU (`claude-haiku-4-5`) fallback, circuit breaker, retry policy.
- **AR13** : Implémenter audit IA Act : table `ia_audit_logs` avec `{prompt_hash, model, features_used, score, latency}` pour chaque appel LLM matching/génération.
- **AR14** : Implémenter feature flag `IA_MATCHING_ENABLED` (kill switch) basculant vers matching règles+keywords si désactivé.
- **AR15** : Implémenter cache LLM Redis (hash CV → embeddings, hash prompt → lettres TTL 24h) pour -40% appels LLM.

**Observability (Architecture step 4) :**

- **AR16** : Setup Sentry (errors) + Posthog Cloud EU (product analytics) + Vercel Analytics (perf) + Axiom (logs).
- **AR17** : Implémenter `instrumentation.ts` bootstrap (Sentry/Posthog init) + `lib/logger.ts` Pino structuré JSON + `lib/tracing.ts` distributed tracing.

**Communication (Architecture step 4) :**

- **AR18** : Setup Resend EU pour emails transactionnels avec SPF/DKIM/DMARC, templates HTML+text, tracking délivrabilité.
- **AR19** : Implémenter `next-pwa` + service worker custom pour PWA offline-friendly (file d'attente candidatures, sync reconnexion).

**Coding Standards (Architecture step 5) :**

- **AR20** : Configurer ESLint partagée `packages/config/eslint` enforçant naming conventions (DB snake_case, API camelCase, files PascalCase/kebab-case selon contexte).
- **AR21** : Configurer pre-commit Husky/Lefthook (lint + typecheck + format) et commitlint (Conventional Commits).
- **AR22** : Implémenter type `ActionResult<T>` partagé dans `packages/types/action-result.ts` pour toutes Server Actions.
- **AR23** : Implémenter enum codes erreur centralisé dans `packages/types/errors.ts`.

### UX Design Requirements

**Visual Foundation & Design Tokens :**

- **UX-DR1** : Implémenter le système de couleurs avec palette primaire Deep Indigo (#4F5BFF avec échelle 50-900), accent Coral (#FF7B5A), neutre 50-900, sémantiques success/warning/error/info, et variants mode sombre — tokens centralisés dans `packages/config/tailwind/base.js`.
- **UX-DR2** : Implémenter le système typographique avec Inter (sans-serif principal) et Cabinet Grotesk (display) chargés via `next/font`, type scale mobile-first (display-2xl à body-xs), letter-spacing et line-height précis selon spec.
- **UX-DR3** : Implémenter le système d'espacement 8pt grid (1=4px, 2=8px... 24=96px), radius (sm/md/lg/xl/full), shadows (sm/md/lg/xl) et layout principles 12-col mobile/16-col desktop.

**10 Custom Components (composants signature) :**

- **UX-DR4** : Implémenter `<SwipeCard>` (composant signature) avec Framer Motion `<motion.div drag>`, spring physics (stiffness 300, damping 30), états idle/dragging/threshold-left/right/up/validated/returning, overlays colorés à 25% drag, accessibility role="article" + aria-label + raccourcis clavier ←/→/↑/Espace.
- **UX-DR5** : Implémenter `<SwipeDeck>` avec stack 3 cartes max (effet 3D décalé 4px Y, 8px scale), préchargement async des 3 suivantes, compteur "1/12" header, boutons d'action ❌💌💾, états loading/idle/empty/completing.
- **UX-DR6** : Implémenter `<MatchScoreBadge>` pastille ronde colorée par score (success ≥85, primary 70-84, warning <70) avec popover `<MatchExplanationPopover>` au tap (3 features contributives + barres de poids).
- **UX-DR7** : Implémenter `<DailyStreak>` chip 🔥 avec couleur graduée (gris/coral/indigo selon longueur), bottom sheet historique heatmap calendar + badges débloqués.
- **UX-DR8** : Implémenter `<CoachMessage>` avec variants inline/banner/fullscreen, types tip/empathy/celebration/warning, accessibilité role="region".
- **UX-DR9** : Implémenter `<EmptyState>` avec 5 variants contextuels (empty-deck, empty-dashboard, empty-watchlist, empty-search, network-error), illustration SVG simple + titre + message empathique + CTA actionnable.
- **UX-DR10** : Implémenter `<ConfettiBurst>` via Lottie animation (canvas-confetti fallback), 1.5s non-bloquant, respect `prefers-reduced-motion`, intensity subtle/normal/epic.
- **UX-DR11** : Implémenter `<WrappedShare>` écran célébration signature avec layout plein écran, stats parcours, export Instagram Story 1080×1920 généré dynamiquement, partage Instagram/LinkedIn.
- **UX-DR12** : Implémenter `<MatchExplanationPopover>` détail features contributives (3-5) avec barres horizontales montrant poids, couleurs vert (match)/neutre (no match).
- **UX-DR13** : Implémenter `<InterviewPrepCard>` mini-coach pré-entretien 24h avant : résumé entreprise (LLM 3 lignes), 3 questions probables, points forts du matching, CTA "Marquer comme prêt" + "Reporter".

**Interaction & Animation Patterns :**

- **UX-DR14** : Implémenter feedback haptique léger + visuel sur swipe (overlay couleur progressif à 25% drag, animation spring 300ms validation, 250ms returning si insuffisant).
- **UX-DR15** : Implémenter pattern undo avec toast 5s post-action (candidature, swipe) permettant annulation immédiate via FR33.
- **UX-DR16** : Implémenter animations de célébration aux jalons (premier swipe, première candidature, signature) avec ConfettiBurst + son optionnel mute-by-default.
- **UX-DR17** : Implémenter optimistic UI pour toutes actions perçues comme instantanées (swipe, status update) avec rollback gracieux si erreur serveur.

**Loading & Empty States :**

- **UX-DR18** : Implémenter skeleton loaders pour SwipeCard, dashboard, profile, deck preload (>100ms et <1s).
- **UX-DR19** : Implémenter messages rassurants après 2s d'attente ("On prépare tes recommandations…") puis timeout error recoverable après 10s.

**Responsive Design :**

- **UX-DR20** : Implémenter breakpoint strategy mobile-first (375px base, sm 640px, md 768px, lg 1024px, xl 1280px, 2xl 1536px) avec layouts adaptés pour mobile/tablet/desktop.
- **UX-DR21** : Implémenter touch targets ≥44×44px partout (NFR-A4) avec spacing adapté pour interactions tactiles.

**Accessibility Implementation :**

- **UX-DR22** : Implémenter focus management visible (focus ring distinct, skip links, focus trap dans modaux).
- **UX-DR23** : Implémenter annonces ARIA live pour actions importantes ("Candidature envoyée à [entreprise]", "Deck terminé", "Streak +1 jour").
- **UX-DR24** : Implémenter test suite axe-core dans `apps/web/e2e/a11y.spec.ts` bloquant en CI (NFR-A8).

**Forms & Inputs :**

- **UX-DR25** : Implémenter pattern forms avec React Hook Form + Zod resolver, validation inline temps réel, messages d'erreur sous le champ, états loading sur submit.
- **UX-DR26** : Implémenter pattern recherche/filtres avec URL search params (via `nuqs` ou natif Next.js) pour shareability et back/forward browser.

**Content & Tone Patterns :**

- **UX-DR27** : Implémenter tone of voice cohérent FR (bienveillant, direct, jamais condescendant) dans tous les microcopies — strings externalisées dans `messages/fr.json` (NFR-L1, L2).

**Navigation Patterns :**

- **UX-DR28** : Implémenter navigation principale mobile (bottom-nav 72px avec 4 icônes : Deck, Candidatures, Matches, Profil) et desktop (sidebar collapsible).
- **UX-DR29** : Implémenter top bar avec logo SwipeJob, DailyStreak (coin droit sur écran Deck), avatar menu profil.

### FR Coverage Map

**Epic 1 (Foundation & Authenticated Onboarding)** — 10 FRs : FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10

**Epic 2 (Offer Discovery & AI Matching)** — 13 FRs : FR11, FR12, FR13, FR14, FR15, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24

**Epic 3 (Swipe & AI Application)** — 11 FRs : FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35

**Epic 4 (Application Lifecycle & Coaching)** — 7 FRs : FR36, FR37, FR38, FR39, FR40, FR41, FR42

**Epic 5 (Engagement, Streaks & Social)** — 5 FRs : FR43, FR44, FR45, FR46, FR47

**Epic 6 (Privacy, RGPD Self-Service & Compliance)** — 8 FRs : FR48, FR49, FR50, FR51, FR52, FR53, FR54, FR55

**Epic 7 (Public Marketing & SEO Discovery)** — 5 FRs : FR56, FR57, FR58, FR59, FR60

**Epic 8 (Admin Back-Office & Compliance Operations)** — 6 FRs : FR16, FR61, FR62, FR63, FR64, FR65

**Total : 65/65 FRs mappés ✅**

## Epic List

### Epic 1: Foundation & Authenticated Onboarding 🏗️🔐

Un nouvel utilisateur peut s'inscrire (OAuth Google ou email/mot de passe), uploader son CV qui est parsé automatiquement par IA, corriger/compléter son profil, définir ses préférences de recherche, et garder le contrôle total sur ses données (modification/suppression). Cet epic intègre le Sprint 0 technique (bootstrap monorepo Turborepo, DB Neon+Drizzle+pgvector, Auth.js v5, R2 storage, packages/llm Mistral, observability Sentry/Posthog/Axiom, CI GitHub Actions, déploiement Vercel+Railway).

**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR10
**ARs covered:** AR1-AR23 (toute la fondation technique)
**UX-DRs covered:** UX-DR1, UX-DR2, UX-DR3 (design tokens), UX-DR22, UX-DR23, UX-DR24 (accessibility fondations), UX-DR25 (form patterns), UX-DR27 (tone FR), UX-DR28, UX-DR29 (navigation)
**Key NFRs:** NFR-S1-S10 (security), NFR-O1-O5 (observability), NFR-L1-L3 (localization), NFR-A1-A8 (accessibility foundations)
**User outcome:** Sign up, login, RGPD consent, CV parsé, profil et préférences complets, prêt pour le matching.

### Epic 2: Offer Discovery & AI Matching 🎯📊

Le système ingère en continu 5 000+ offres françaises depuis France Travail et des sources secondaires (scraping conforme), les normalise et déduplique. Le moteur IA calcule un score de matching explicable avec exclusion stricte des critères protégés contre la discrimination, et génère un deck quotidien personnalisé de 10-20 offres ordonné par pertinence décroissante. Détection de pénurie avec suggestion d'élargissement de critères pertinent. Audit IA Act traçable par requête.

**FRs covered:** FR11, FR12, FR13, FR14, FR15, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR24
**ARs covered:** AR4 (BullMQ ingestion), AR12-AR15 (LLM matching + audit + kill switch + cache)
**UX-DRs covered:** UX-DR6 (MatchScoreBadge), UX-DR12 (MatchExplanationPopover), UX-DR8 (CoachMessage pénurie), UX-DR18 (skeleton loaders)
**Key NFRs:** NFR-P5 (deck <8s), NFR-Sc4 (DB perf), NFR-F1-F5 (fairness, explicabilité, kill switch)
**User outcome:** Système avec catalogue d'offres curé + utilisateur reçoit chaque matin un deck personnalisé et explicable.

### Epic 3: Swipe & AI Application 💌🚀

L'utilisateur visualise les cartes d'offres avec animations fluides 60 FPS et swipe dans 3 directions (gauche=passer, droite=candidater, haut=sauvegarder), avec équivalents clavier et boutons pour accessibilité. Au swipe droite, le système génère automatiquement une lettre de motivation IA personnalisée en <3 secondes et envoie la candidature par email avec CV attaché. L'utilisateur peut prévisualiser avant envoi (mode revue), annuler dans les 30 secondes (undo), et est protégé par quotas quotidiens + anti-doublon.

**FRs covered:** FR25, FR26, FR27, FR28, FR29, FR30, FR31, FR32, FR33, FR34, FR35
**ARs covered:** AR12 (Mistral génération lettre), AR18 (Resend transactionnel), AR19 (PWA offline queue)
**UX-DRs covered:** UX-DR4 (SwipeCard signature), UX-DR5 (SwipeDeck), UX-DR14 (animations swipe), UX-DR15 (undo toast), UX-DR16 (animations célébration), UX-DR17 (optimistic UI), UX-DR21 (touch targets ≥44px)
**Key NFRs:** NFR-P1 (swipe <100ms), NFR-P6 (lettre <3s), NFR-I4 (délivrabilité >95%), NFR-I5 (warm-up IP + cap), NFR-A2 (équivalents clavier swipe), NFR-A4 (touch targets), NFR-A5 (prefers-reduced-motion)
**User outcome:** L'utilisateur swipe, candidate et envoie des lettres IA en quelques secondes.

### Epic 4: Application Lifecycle & Coaching 📊🎓

L'utilisateur consulte un dashboard de toutes ses candidatures envoyées avec leurs statuts (envoyée, lue, réponse, entretien, signature, refus), peut modifier manuellement les statuts, reporter une signature pour déclencher une célébration, et reçoit des notifications push web quotidiennes + emails récapitulatifs hebdomadaires (canaux et fréquences configurables). Mini-coach IA pré-entretien 24h avant : résumé de l'entreprise, 3 questions probables, points forts du matching.

**FRs covered:** FR36, FR37, FR38, FR39, FR40, FR41, FR42
**ARs covered:** AR18 (Resend hebdo), AR19 (push notifications PWA)
**UX-DRs covered:** UX-DR13 (InterviewPrepCard), UX-DR16 (animations célébration signature)
**Key NFRs:** NFR-I3 (SMTP SPF/DKIM/DMARC), NFR-I4 (délivrabilité)
**User outcome:** L'utilisateur ne perd jamais de vue ses candidatures et arrive préparé aux entretiens.

### Epic 5: Engagement, Streaks & Social 🔥🎉

L'utilisateur consulte ses streaks de jours actifs consécutifs avec heatmap historique, débloque des badges aux jalons (premier swipe, première candidature, première réponse, signature), génère un lien de parrainage unique trackable, partage des offres avec lien anonymisé sur les réseaux sociaux. À la signature, écran Wrapped célébrant le parcours avec stats partageables Instagram Story et LinkedIn.

**FRs covered:** FR43, FR44, FR45, FR46, FR47
**UX-DRs covered:** UX-DR7 (DailyStreak), UX-DR10 (ConfettiBurst), UX-DR11 (WrappedShare)
**Key NFRs:** NFR-O1 (analytics Posthog events engagement)
**User outcome:** Engagement durable, viralité organique via parrainage et partages.

### Epic 6: Privacy, RGPD Self-Service & Compliance 🔒⚖️

L'utilisateur consulte à tout moment politique de confidentialité et CGU, gère ses consentements granulaires par finalité (matching, marketing, analytics, email read), exporte l'intégralité de ses données personnelles en JSON+PDF sous 24h, demande la suppression complète sous 30 jours, et bénéficie d'audit logs immuables de toute opération sur ses PII. Toutes communications en français (Loi Toubon), anonymisation automatique après 24 mois d'inactivité, déclaration d'accessibilité publique avec mécanisme de signalement.

**FRs covered:** FR48, FR49, FR50, FR51, FR52, FR53, FR54, FR55
**ARs covered:** AR11 (audit logs append-only), AR12 (helper auditLog())
**UX-DRs covered:** UX-DR27 (tone FR Loi Toubon), UX-DR22-24 (a11y enforcement)
**Key NFRs:** NFR-S7 (audit 13 mois CNIL), NFR-S10 (PII pas hors EU), NFR-L1-L3 (Loi Toubon), NFR-A1-A8 (WCAG 2.1 AA), NFR-F4 (art. 22 RGPD)
**User outcome:** Conformité RGPD/IA Act/Loi Toubon visible et actionnable par l'utilisateur.

### Epic 7: Public Marketing & SEO Discovery 🌐🔍

Un visiteur non-connecté découvre SwipeJob via Google grâce à des pages SEO dynamiques générées par métier, par ville, par école et par combinaisons des trois (≥5k pages indexables). Chaque page d'offre publique affiche un sous-ensemble anonymisé incitant à s'inscrire. Sitemap.xml et robots.txt cohérents. Métadonnées Schema.org JobPosting pour indexation Google Jobs. Bibliothèque éditoriale (blog) avec articles conseils carrière accessibles aux utilisateurs authentifiés.

**FRs covered:** FR56, FR57, FR58, FR59, FR60
**Type:** SSR/SSG Next.js route group `(marketing)`
**Key NFRs:** NFR-P2 (FCP <1,5s), NFR-P3 (LCP <2,5s Core Web Vitals "good"), NFR-P9 (Lighthouse ≥90)
**User outcome:** Acquisition organique via Google + Google Jobs sans budget paid.

### Epic 8: Admin Back-Office & Compliance Operations ⚙️🛠️

Un administrateur s'authentifie sur une interface back-office distincte de l'app utilisateur, modère les offres ingérées (signaler comme problématiques, supprimer, marquer comme prioritaires), consulte et gère les utilisateurs (état actif/suspendu/supprimé), traite les demandes utilisateur de droit RGPD (export, suppression, rectification), audite manuellement un score de matching IA en <30 secondes, actionne le kill switch IA pour basculer vers matching règles+keywords en cas de problème, et consulte les métriques produit (KPIs définis dans Success Criteria).

**FRs covered:** FR16, FR61, FR62, FR63, FR64, FR65
**ARs covered:** AR13 (ia_audit_logs dashboard), AR14 (kill switch IA UI)
**Key NFRs:** NFR-F3 (audit manuel <30s), NFR-F5 (kill switch), NFR-S7 (audit logs)
**User outcome:** L'équipe SwipeJob opère, modère et audite le système en toute transparence et conformité.

---

## Epic 1: Foundation & Authenticated Onboarding

Un nouvel utilisateur peut s'inscrire (OAuth Google ou email/mot de passe), uploader son CV qui est parsé par IA, corriger/compléter son profil, définir ses préférences de recherche et garder le contrôle total sur ses données. Inclut le Sprint 0 technique.

### Story 1.1: Bootstrap monorepo Turborepo et infrastructure de base

As a développeur,
I want disposer d'un monorepo Turborepo fonctionnel avec apps/web (Next.js 15), apps/worker, packages/db, packages/types, packages/llm, packages/config et tooling complet (ESLint, Prettier, Husky, commitlint, design tokens Tailwind),
So that toute l'équipe peut commencer à coder sur une fondation cohérente et conforme aux conventions architecturales.

**Acceptance Criteria:**

**Given** un répertoire vide
**When** la commande `pnpm dlx create-turbo@latest swipejob --use-pnpm` est exécutée et la structure adaptée selon l'architecture
**Then** le monorepo contient `apps/web` avec Next.js 15 App Router + TS strict + Tailwind 4 + shadcn/ui initialisé
**And** `apps/worker` avec Node.js 20 + Hono + BullMQ + Pino + Dockerfile
**And** `packages/db`, `packages/types`, `packages/llm`, `packages/ui`, `packages/config` créés avec leur structure
**And** ESLint config partagée enforce les naming conventions (DB snake_case, code camelCase, fichiers PascalCase/kebab-case)
**And** pre-commit Husky/Lefthook exécute lint + typecheck + format
**And** commitlint impose Conventional Commits
**And** design tokens Tailwind (couleurs Indigo+Coral+neutre+sémantiques, typo Inter+Cabinet Grotesk, spacing 8pt grid) sont définis dans `packages/config/tailwind/base.js`
**And** `pnpm dev` lance web + worker en parallèle sans erreur

### Story 1.2: Setup observability et pipeline CI/CD

As a équipe technique,
I want disposer de Sentry (errors), Posthog Cloud EU (analytics), Axiom (logs) et GitHub Actions CI bloquant intégrés dès le J1,
So that toutes les régressions, erreurs et anomalies de performance soient détectées immédiatement et conformes aux exigences observability/compliance.

**Acceptance Criteria:**

**Given** un monorepo Turborepo initialisé
**When** `apps/web/instrumentation.ts` et le bootstrap worker sont configurés
**Then** Sentry capture les erreurs côté web et worker avec source maps et release tracking
**And** Posthog Cloud EU est connecté avec capture côté serveur + client (anonymisé)
**And** Axiom reçoit les logs structurés Pino JSON depuis web et worker
**And** Vercel Analytics est activé sur `apps/web` pour les Core Web Vitals
**And** un pipeline GitHub Actions `ci.yml` exécute lint + typecheck + test + build bloquant à chaque PR
**And** un pipeline `e2e.yml` exécute Playwright + axe-core sur les routes principales
**And** preview deployments Vercel sont créés automatiquement à chaque PR
**And** logs RGPD/audit sont taggés et exportés mensuellement vers R2 (rétention 13 mois)

### Story 1.3: Inscription utilisateur via OAuth Google

As a étudiant français cherchant un stage/alternance,
I want m'inscrire à SwipeJob en un clic via mon compte Google,
So that je peux accéder à l'app sans créer un nouveau mot de passe.

**Acceptance Criteria:**

**Given** un visiteur non authentifié sur la page `/inscription`
**When** il clique sur "Continuer avec Google"
**Then** une popup OAuth Google s'ouvre avec les scopes `email` et `profile` uniquement
**And** une fois consenti, un utilisateur est créé en base avec email validé, source `google`, locale `fr-FR`, role `user`
**And** une session DB est créée et un cookie HttpOnly SameSite=Lax est posé
**And** l'utilisateur est redirigé vers `/etape-1-cv` (onboarding) s'il est nouveau, sinon vers `/deck`
**And** un événement Posthog `user.signup` est tracé avec `{ method: 'google' }`
**And** un audit log `auth.signup` est enregistré (RGPD)
**And** si Google retourne une erreur, l'utilisateur voit un message bienveillant FR avec lien retry

### Story 1.4: Inscription utilisateur via email et mot de passe

As a étudiant qui préfère ne pas lier Google,
I want m'inscrire avec mon email et un mot de passe en validant mon email,
So that je peux utiliser SwipeJob sans dépendre d'un fournisseur OAuth tiers.

**Acceptance Criteria:**

**Given** un visiteur sur la page `/inscription`
**When** il choisit "Email + mot de passe" et saisit email + mot de passe (≥10 caractères, mix lettres/chiffres)
**Then** le mot de passe est validé côté client (RHF + Zod) et serveur (Zod parse)
**And** le mot de passe est hashé avec argon2id (params OWASP 2024) avant stockage
**And** un email de validation est envoyé via Resend avec un lien magique signé valide 24h
**And** l'utilisateur ne peut pas accéder à `/deck` ni `/etape-1-cv` tant que l'email n'est pas validé (redirect vers `/inscription/valider-email`)
**And** au clic sur le lien validation, le flag `email_verified_at` est mis à jour et l'utilisateur est connecté
**And** un audit log `auth.email_verified` est enregistré
**And** rate limiting 5 inscriptions/heure/IP est appliqué (NFR-S5 strict)

### Story 1.5: Vérification d'âge et consentement parental pour mineurs

As a SwipeJob (responsable de traitement RGPD),
I want vérifier l'âge déclaré à l'inscription et exiger un consentement parental documenté pour les utilisateurs <18 ans,
So that la plateforme respecte les obligations légales françaises sur les données des mineurs.

**Acceptance Criteria:**

**Given** un nouvel utilisateur inscrit (Google ou email)
**When** il accède à la première étape onboarding
**Then** le système demande sa date de naissance (datepicker, format JJ/MM/AAAA)
**And** si l'utilisateur a <13 ans, l'inscription est refusée avec message FR explicite + lien vers FAQ
**And** si l'utilisateur a entre 13 et 17 ans inclus, un formulaire de consentement parental est affiché (nom du parent, email parent, lien de confirmation envoyé par email)
**And** le compte mineur est marqué `pending_parental_consent` et reste limité (pas de candidature, pas de partage) jusqu'à confirmation
**And** le parent reçoit un email avec lien signé pour valider ou refuser
**And** un audit log `consent.parental_granted` ou `consent.parental_refused` est enregistré
**And** le quota de swipes droits est réduit pour les mineurs (configurable, default 5/jour vs 20/jour majeurs)

### Story 1.6: Upload de CV au format PDF avec stockage sécurisé

As a étudiant,
I want téléverser mon CV au format PDF (jusqu'à 10 MB) depuis l'onboarding,
So that le système puisse analyser mon profil et générer mes recommandations d'offres.

**Acceptance Criteria:**

**Given** un utilisateur authentifié sur l'étape `/etape-1-cv`
**When** il sélectionne ou drag-and-drop un fichier PDF
**Then** le fichier est validé côté client (type MIME `application/pdf`, taille ≤10 MB)
**And** le fichier est uploadé vers Cloudflare R2 EU via URL signée pré-signée
**And** une entrée `cvs` est créée avec `user_id`, `r2_key`, `original_filename`, `size_bytes`, `uploaded_at`, `parsing_status: 'pending'`
**And** un job `cv.parse` est enqueued dans BullMQ avec payload `{ cvId, userId, version: 1 }`
**And** un message empathique FR informe l'utilisateur "On analyse ton CV, ça prend environ 8 secondes…" (UX-DR19)
**And** un skeleton loader est affiché pendant l'analyse (UX-DR18)
**And** un audit log `cv.uploaded` est enregistré (RGPD PII)
**And** si l'upload échoue (réseau, taille), un message d'erreur FR recoverable avec CTA retry est affiché

### Story 1.7: Parsing IA du CV avec correction manuelle

As a étudiant,
I want que SwipeJob extraie automatiquement les informations de mon CV (identité, parcours, expériences, compétences, langues) et me permette de les corriger,
So that je n'aie pas à tout saisir manuellement et que mes données soient exactes.

**Acceptance Criteria:**

**Given** un CV uploadé avec `parsing_status: 'pending'`
**When** le worker exécute le job `cv.parse`
**Then** le PDF est téléchargé depuis R2 et son texte extrait via parser (pdf-parse ou équivalent)
**And** le texte est envoyé à Mistral `mistral-large-latest` avec un schéma Zod structuré attendu (identité, écoles, expériences, compétences, langues, intérêts)
**And** la réponse LLM est parsée avec Zod ; en cas d'échec, fallback regex/heuristique appliqué
**And** une entrée `profiles` est upsertée avec les champs extraits
**And** un log `ia_audit_logs` est créé avec `{ prompt_hash, model, latency_ms, success, features_extracted }`
**And** le `parsing_status` passe à `'completed'` (ou `'failed'` avec retry policy 3×)
**And** l'utilisateur est redirigé vers `/etape-1-cv/revue` affichant tous les champs extraits dans un formulaire éditable (UX-DR25)
**And** l'utilisateur peut corriger/ajouter chaque champ et valider
**And** un audit log `profile.cv_parsed` est enregistré
**And** délai total upload → revue affichée ≤8 s pour 95% des cas (NFR-P5)

### Story 1.8: Configuration des préférences de recherche

As a étudiant,
I want définir mes préférences (type de contrat, durée, zones géographiques, télétravail, secteurs, taille entreprise, salaire, date de démarrage),
So that le moteur de matching me propose des offres pertinentes selon mes critères.

**Acceptance Criteria:**

**Given** un utilisateur ayant validé son CV
**When** il accède à l'étape `/etape-2-preferences`
**Then** un formulaire multi-sections présente : type contrat (stage/alternance multi-select), durée (1-3/3-6/6-12/12+ mois), zones géo (autocomplete villes + rayon km), télétravail (sur place/hybride/100% remote), secteurs (multi-select), taille entreprise (TPE/PME/ETI/grandes), fourchette salaire (slider €), date démarrage souhaitée (datepicker)
**And** chaque champ est validé Zod côté client et serveur
**And** la sauvegarde via Server Action `updatePreferencesAction` retourne `ActionResult<Preferences>`
**And** une entrée `preferences` est upsertée pour `user_id`
**And** un audit log `preferences.updated` est enregistré
**And** l'utilisateur peut modifier ses préférences ultérieurement depuis `/profil/preferences` avec impact immédiat (cache invalidé via `revalidateTag('user-preferences')`)
**And** un événement Posthog `preferences.set` est tracé avec les valeurs anonymisées (NFR-S10)

### Story 1.9: Référentiel des écoles et niveau d'études

As a étudiant,
I want sélectionner mon école et mon niveau d'études dans une liste pré-établie de qualité,
So that mon profil soit catégorisé correctement pour le matching et la précision des recommandations.

**Acceptance Criteria:**

**Given** un utilisateur configurant son profil
**When** il commence à taper le nom de son école dans un autocomplete
**Then** une liste référentielle d'au moins 500 écoles françaises (universités, écoles d'ingénieurs, BTS, écoles de commerce, écoles spécialisées) est suggérée
**And** la recherche supporte les fuzzy matches (frappe approximative, accents)
**And** chaque école est associée à des métadonnées (type, ville, sigle alternatif)
**And** l'utilisateur sélectionne son niveau d'études dans une liste fermée : BTS/DUT, Licence/L1-L3, Bachelor, Master/M1-M2, École d'ingénieur, Doctorat
**And** la combinaison école + niveau est stockée dans `profiles.education`
**And** si l'école n'est pas trouvée, l'utilisateur peut saisir "Autre" avec champ libre marqué `unverified` pour modération admin
**And** un audit log `profile.education_updated` est enregistré

### Story 1.10: Modification et suppression de profil

As a utilisateur RGPD-conscient,
I want pouvoir consulter, modifier et supprimer mon profil à tout moment depuis l'app,
So that je garde le contrôle total sur mes données personnelles.

**Acceptance Criteria:**

**Given** un utilisateur authentifié
**When** il accède à `/profil`
**Then** il voit toutes ses données : identité, école, expériences, compétences, langues, préférences, CV uploadé
**And** chaque section est éditable via formulaire RHF + Zod avec save inline
**And** chaque modification déclenche un audit log `profile.field_updated` avec champ modifié + horodatage
**And** un bouton "Supprimer mon compte" déclenche une confirmation 2-étapes (modale + saisie email pour confirmer)
**And** la suppression enqueue un job `rgpd.delete` qui exécute la suppression effective sous 30j (cf. Epic 6 Story 6.5 pour détails)
**And** le compte est immédiatement marqué `pending_deletion` et l'utilisateur déconnecté
**And** un audit log `account.deletion_requested` est enregistré
**And** un email de confirmation FR est envoyé à l'utilisateur via Resend

---

## Epic 2: Offer Discovery & AI Matching

Le système ingère 5 000+ offres françaises depuis France Travail et sources secondaires, les normalise et déduplique, puis calcule un score de matching IA explicable avec exclusion stricte des critères protégés et génère un deck quotidien personnalisé.

### Story 2.1: Bootstrap du worker BullMQ et schémas d'offres

As a équipe technique,
I want disposer d'un worker Node.js opérationnel avec BullMQ + Redis Upstash et des schémas `offers`, `offer_sources`, `match_scores`, `ia_audit_logs` en base,
So that toute la chaîne d'ingestion et de matching puisse s'exécuter de manière asynchrone et scalable.

**Acceptance Criteria:**

**Given** un monorepo bootstrapé
**When** `apps/worker/src/index.ts` démarre
**Then** des queues BullMQ `offer-ingest`, `offer-dedupe`, `embeddings-compute`, `match-compute`, `failed-jobs` sont initialisées
**And** la connexion Upstash Redis EU Frankfurt est établie avec retry/circuit breaker
**And** un endpoint `/health` Hono retourne `{ status: 'ok', queues: { ... } }`
**And** un endpoint `/metrics` Hono expose les métriques BullMQ (jobs pending/active/failed)
**And** les schémas Drizzle `offers`, `offer_sources`, `match_scores`, `ia_audit_logs` sont créés en migration
**And** chaque queue a une retry policy `{ attempts: 3, backoff: { type: 'exponential', delay: 5000 } }`
**And** les jobs échoués après 3 tentatives sont déplacés vers `failed-jobs` et alertent Sentry

### Story 2.2: Intégration de l'API France Travail

As a SwipeJob,
I want ingérer périodiquement les offres d'alternance et de stage depuis l'API France Travail (anciennement Pôle Emploi),
So that le catalogue dispose d'une source officielle, légale et exhaustive du marché français.

**Acceptance Criteria:**

**Given** une clé API France Travail valide stockée en vault Vercel/Railway
**When** le job `offer.ingest.france-travail` est exécuté (cron toutes les 30 min)
**Then** le scraper interroge l'API avec les filtres : type contrat (alternance, stage), région France entière, date publication ≤30j
**And** les quotas API sont respectés (rate limit géré, backoff exponentiel si 429)
**And** chaque offre récupérée est upsertée dans `offers` avec `source: 'france-travail'`, `external_id`, `raw_payload` (JSON brut conservé pour audit)
**And** en cas d'indisponibilité API >15 min, une alerte Sentry est déclenchée (NFR-I1)
**And** les retries sont gérés avec backoff exponentiel max 3 tentatives
**And** un audit log `offer.ingested` est enregistré pour chaque batch (count, source)
**And** la métrique `offers.ingested.total` est publiée vers Posthog/Axiom

### Story 2.3: Intégration d'au moins une source secondaire d'offres

As a SwipeJob,
I want ingérer des offres depuis au moins une source secondaire (APEC, JobTeaser ou flux RSS partenaire),
So that le catalogue dépasse la couverture France Travail seule.

**Acceptance Criteria:**

**Given** une source secondaire identifiée et conforme aux ToS (ex : flux RSS APEC ou JobTeaser API)
**When** le job `offer.ingest.<source>` est exécuté périodiquement
**Then** un adaptateur dédié dans `apps/worker/src/scrapers/<source>.ts` extrait les offres
**And** l'architecture adaptateur permet d'ajouter une nouvelle source en <5 j-h (NFR-I2)
**And** chaque offre est upsertée dans `offers` avec `source: '<source>'`
**And** les ToS de la source sont documentés dans `docs/compliance/data-sources.md`
**And** le scraping respecte les rate limits documentés de la source
**And** un audit log `offer.ingested` est enregistré

### Story 2.4: Normalisation des offres en format unifié

As a moteur de matching,
I want que toutes les offres ingérées soient normalisées dans un format interne unifié,
So that le matching et l'affichage soient cohérents quelle que soit la source.

**Acceptance Criteria:**

**Given** une offre brute issue d'une source (raw_payload présent)
**When** le job `offer.normalize` est exécuté
**Then** les champs suivants sont extraits et stockés en colonnes typées : titre, entreprise, localisation (ville + code postal + lat/lng), type contrat (enum), durée_mois, description (markdown safe), compétences[], niveau_etudes_attendu, salaire_min_eur, salaire_max_eur, date_publication, date_expiration, lien_source, contact_email
**And** la normalisation utilise des heuristiques + Mistral en fallback pour les champs ambigus (compétences, niveau)
**And** la géolocalisation est résolue via API publique (BAN, OpenStreetMap Nominatim EU)
**And** les valeurs nulles ou incohérentes sont marquées `quality_score < 1` et exclues du matching jusqu'à modération manuelle
**And** un audit log `offer.normalized` est enregistré

### Story 2.5: Détection et fusion des doublons inter-sources

As a SwipeJob,
I want détecter automatiquement les offres publiées sur plusieurs sources et les fusionner en une seule entrée canonique,
So que les utilisateurs ne voient jamais deux fois la même offre dans leur deck.

**Acceptance Criteria:**

**Given** une nouvelle offre normalisée
**When** le job `offer.dedupe` est exécuté
**Then** une comparaison est faite avec les offres existantes sur (entreprise + titre + localisation + dates) avec seuil fuzzy ≥85% (Jaro-Winkler ou Levenshtein normalisé)
**And** en cas de match probable, les offres sont fusionnées en `offers.canonical_id`, avec conservation des `sources[]` (multi-source provenance)
**And** la version canonique conserve la description la plus riche, le contact email le plus fiable (validé), les dates les plus récentes
**And** un audit log `offer.merged` est enregistré avec les `offer_ids` fusionnés
**And** les offres marquées `quality_score < 0.5` sont exclues de la dédup et envoyées en modération admin

### Story 2.6: Désactivation automatique des offres expirées ou pourvues

As a SwipeJob,
I want que les offres expirées (date_expiration passée) ou marquées comme pourvues par la source soient automatiquement désactivées,
So que le catalogue reste à jour et que les utilisateurs ne candidatent jamais à des offres mortes.

**Acceptance Criteria:**

**Given** un catalogue contenant des offres actives
**When** le job `offer.deactivate` est exécuté (cron quotidien à 03h00 UTC)
**Then** toutes les offres avec `date_expiration < now()` passent à `status: 'expired'`
**And** toutes les offres dont la source signale `filled: true` passent à `status: 'filled'`
**And** les offres `status != 'active'` sont exclues du matching et du deck
**And** un audit log `offer.deactivated` est enregistré avec count par raison
**And** les offres expirées restent en base 90 jours pour analytics avant archivage (anonymisation cohérente avec NFR-S3)

### Story 2.7: Maintenir un catalogue de 5 000+ offres actives

As a SwipeJob (responsable produit),
I want garantir qu'au moins 5 000 offres actives soient disponibles en permanence sur le marché français,
So que les utilisateurs aient toujours un deck riche et pertinent.

**Acceptance Criteria:**

**Given** le job de monitoring quotidien
**When** `offers WHERE status='active'` est compté
**Then** la métrique `offers.active.count` est publiée vers Axiom et Posthog
**And** si la métrique passe sous 5 000, une alerte Sentry de niveau warning est déclenchée
**And** si la métrique passe sous 3 000, une alerte Sentry critique est déclenchée et l'équipe est notifiée par email
**And** un dashboard Axiom affiche l'évolution `offers.active.count` sur 30j
**And** le rapport mensuel d'activité inclut cette métrique

### Story 2.8: Calcul des embeddings et score de matching IA explicable

As a étudiant,
I want que chaque offre du catalogue soit comparée à mon profil avec un score de compatibilité fondé sur la similarité sémantique des compétences, mes préférences et la cohérence géographique/contractuelle,
So que les offres les plus pertinentes me soient proposées avec une transparence sur le raisonnement.

**Acceptance Criteria:**

**Given** un profil utilisateur complet et un catalogue d'offres actives
**When** le job `match.compute` est exécuté (cron nocturne 02h00 UTC)
**Then** des embeddings sont calculés pour chaque CV et chaque offre via Mistral `mistral-embed` (1024 dim) stockés en pgvector
**And** un score `0-100` est calculé combinant : 60% similarité cosinus compétences CV ↔ compétences offre, 25% cohérence préférences (type contrat, durée, géo, salaire), 15% cohérence niveau études
**And** le top-50 des matches est stocké dans `match_scores` avec `{ user_id, offer_id, score, features: { skill_sim, pref_fit, education_fit }, computed_at }`
**And** chaque calcul génère un `ia_audit_logs` avec `{ user_id, offer_id, prompt_hash, model, features_used, score, latency_ms }` (NFR-F2)
**And** une route admin permet d'auditer manuellement un score en <30s (NFR-F3)
**And** le matching fonctionne avec ou sans Mistral via fallback : si LLM down, mode dégradé keyword + règles est activé (kill switch IA_MATCHING_ENABLED + NFR-R6)
**And** durée totale match pour 30k users < 60 min sur infra cible

### Story 2.9: Exclusion stricte des critères protégés du matching

As a responsable conformité IA Act et anti-discrimination,
I want garantir que le moteur de matching n'utilise jamais comme variable de scoring les critères protégés par la loi française (âge, sexe, origine, situation familiale, religion, etc.),
So que la plateforme respecte le Code du travail anti-discrimination et anticipe l'IA Act EU 2026.

**Acceptance Criteria:**

**Given** le code source du calcul de matching
**When** une revue d'audit est effectuée
**Then** aucune feature du scoring ne référence : âge, sexe, genre, origine, nationalité, situation familiale, état de santé, opinion politique, religion, orientation sexuelle, appartenance syndicale, handicap
**And** un test automatisé `match-fairness.test.ts` vérifie que les features utilisées ne contiennent que : compétences, préférences déclarées, école, niveau études, localisation préférée
**And** un audit de biais trimestriel mesure la parité de score moyen par genre (déduit non-stocké pour audit), origine (déduit non-stocké), école (parité Top vs autres) avec seuil de variance ≤5% (NFR-F1)
**And** le rapport d'audit est publié dans `docs/compliance/fairness-audit-YYYY-QN.md`
**And** un kill switch `IA_MATCHING_ENABLED=false` désactive le matching IA et bascule vers règles+keywords (NFR-F5)

### Story 2.10: Génération du deck quotidien personnalisé

As a étudiant,
I want recevoir chaque matin un deck personnalisé de 10 à 20 offres ordonnées par pertinence décroissante,
So que je consomme rapidement les meilleures opportunités du jour.

**Acceptance Criteria:**

**Given** un utilisateur actif avec profil complet et match_scores calculés
**When** il ouvre l'app et navigue vers `/deck` le matin
**Then** la Server Action `getDailyDeck` retourne les 10-20 offres au top des match_scores du jour
**And** les offres déjà swipées (right/left/up) ne sont pas re-proposées
**And** les offres expirées ou retirées sont exclues
**And** le tri respecte le score décroissant
**And** la réponse contient pour chaque offre : `{ offerData, matchScore, matchReasons[] }` (NFR-F2)
**And** le deck est mis en cache TanStack Query côté client (staleTime 5 min)
**And** le délai d'affichage du deck (cold cache) ≤2 s côté serveur
**And** un événement Posthog `deck.opened` est tracé avec `{ deck_size, top_score }`

### Story 2.11: Affichage de l'explication textuelle du score par offre

As a étudiant,
I want comprendre pourquoi une offre a obtenu un certain score de compatibilité avec mon profil,
So que je puisse faire confiance au système et apprendre à affiner mes recherches.

**Acceptance Criteria:**

**Given** une offre dans le deck avec son `matchScore`
**When** l'utilisateur tape sur le `<MatchScoreBadge>`
**Then** un `<MatchExplanationPopover>` (UX-DR12) s'ouvre affichant 3-5 features contributives au score
**And** chaque feature affiche son nom (FR clair, ex : "Compétences techniques", "Distance Lyon"), son poids visualisé en barre horizontale, son statut match (vert) ou non-match (neutre)
**And** un texte court explicatif accompagne chaque feature (ex : "Tu maîtrises 4 des 5 compétences requises")
**And** un lien "En savoir plus sur le matching" pointe vers une FAQ accessible
**And** l'ouverture du popover déclenche un événement Posthog `match.explanation_viewed`
**And** le popover est navigable au clavier et lisible par lecteur d'écran (NFR-A1, NFR-A6)

### Story 2.12: Détection de pénurie et suggestion d'élargissement

As a étudiant avec des critères trop restrictifs,
I want être averti quand mon deck est presque vide et recevoir une suggestion concrète pour élargir mes critères,
So que je puisse continuer à découvrir des opportunités sans frustration.

**Acceptance Criteria:**

**Given** un utilisateur avec moins de 10 cartes disponibles dans son deck
**When** la Server Action `getDailyDeck` retourne le deck
**Then** le système calcule via analyse marginale quel critère, s'il était relâché, débloquerait le plus d'offres pertinentes
**And** un `<CoachMessage type='tip'>` (UX-DR8) est inséré dans le deck avec un message empathique FR (ex : "Tu as déjà parcouru beaucoup d'offres ! En élargissant ton rayon à 50 km autour de Lyon, on te trouve 15 offres en plus.")
**And** le message propose un CTA "Élargir mon rayon" qui modifie la préférence en 1 clic
**And** un événement Posthog `deck.scarcity_detected` est tracé avec le critère suggéré
**And** la détection ne se déclenche pas plus d'une fois par 48h pour éviter la fatigue
**And** si aucun élargissement pertinent n'existe, un message alternatif propose de revoir le CV ou les compétences

### Story 2.13: Journal auditable des calculs de matching (IA Act)

As a SwipeJob (responsable conformité IA Act),
I want maintenir un journal immuable et explicable de tous les calculs de matching effectués,
So que chaque décision algorithmique soit auditable a posteriori et conforme à l'IA Act EU 2026.

**Acceptance Criteria:**

**Given** chaque appel au moteur de matching
**When** un score est calculé
**Then** une entrée `ia_audit_logs` est créée avec `{ id (cuid2), user_id_hashed, offer_id, prompt_hash (SHA256 du prompt), model, model_version, features_used (JSONB), score, latency_ms, timestamp, version }`
**And** les `user_id` sont hashés (anonymisation niveau audit) pour limiter la PII
**And** les logs sont append-only (pas d'UPDATE/DELETE en code applicatif)
**And** la rétention est de 13 mois minimum (NFR-O5, NFR-S7)
**And** un export mensuel vers R2 Cloudflare EU est automatisé pour archive à froid
**And** un dashboard admin permet de consulter les logs d'un utilisateur donné en <30 s (NFR-F3)
**And** le format JSONB des features permet l'audit a posteriori sans relancer le modèle

### Story 2.14: Performance du calcul de deck post-upload CV

As a étudiant venant d'uploader son CV,
I want voir mon premier deck généré en moins de 8 secondes après validation du CV,
So que mon expérience d'onboarding soit fluide et engageante.

**Acceptance Criteria:**

**Given** un utilisateur ayant validé son CV à l'étape onboarding
**When** son profil et ses préférences sont enregistrés
**Then** un job prioritaire `match.compute.first` est enqueued
**And** le job calcule les embeddings CV via Mistral, compare au top-200 offres pré-embeddées, retourne le top-15 dans `match_scores`
**And** le délai entre validation profil et affichage `/deck` initial est ≤8 s pour 95% des utilisateurs (NFR-P5)
**And** pendant l'attente, un skeleton + message rassurant est affiché ("On prépare tes recommandations…")
**And** un événement Posthog `onboarding.first_deck_ready` est tracé avec `{ duration_ms }`
**And** si dépassement 15 s, un message d'erreur recoverable propose de réessayer

---

## Epic 3: Swipe & AI Application

L'utilisateur visualise les cartes d'offres avec animations fluides, swipe dans 3 directions avec équivalents clavier et boutons accessibles, génère une lettre IA en <3s au swipe droite, envoie automatiquement la candidature par email avec undo 30s, quota quotidien et anti-doublon.

### Story 3.1: Composant SwipeCard avec animations Framer Motion

As a étudiant,
I want voir une carte d'offre richement designée que je peux manipuler avec des gestes fluides,
So que l'expérience de découverte soit aussi addictive et plaisante que les meilleures apps mobiles.

**Acceptance Criteria:**

**Given** un composant `<SwipeCard>` exporté de `apps/web/components/swipe/SwipeCard.tsx`
**When** une offre est passée en prop
**Then** la carte affiche : bandeau image entreprise 40% hauteur, logo coin sup-droit, score % via MatchScoreBadge, badge type contrat, titre poste heading-lg, entreprise + ville, 2-3 match reasons en pills vertes, description italique 2 lignes, CTA "Plus d'infos" (UX-DR4)
**And** la carte est drag-and-drop horizontale et verticale via Framer Motion `motion.div` avec spring physics `stiffness: 300, damping: 30`
**And** la rotation `transform: rotate()` est calculée selon la position X (max ±10°)
**And** des overlays colorés (rouge gauche, vert droit, bleu haut) apparaissent à 25% du drag (état `threshold-*`)
**And** le swipe au-delà du seuil déclenche animation `validated` (sortante 300 ms) ; en deçà, animation `returning` (250 ms)
**And** le composant respecte `prefers-reduced-motion` en désactivant rotations + overlay (NFR-A5)
**And** `role="article"`, `aria-label` exhaustif, focus ring visible (NFR-A1, NFR-A6)
**And** raccourcis clavier `←` (gauche), `→` (droite), `↑` (haut), `Espace` (détail) sont supportés (NFR-A2)
**And** le délai entre input geste et feedback visuel est <100 ms (NFR-P1)

### Story 3.2: Composant SwipeDeck avec stack 3D et préchargement

As a étudiant,
I want naviguer dans mon deck quotidien avec une pile de cartes visualisée en 3D et chargée à l'avance,
So que la transition entre cartes soit instantanée et l'expérience fluide.

**Acceptance Criteria:**

**Given** un composant `<SwipeDeck>` rendu sur `/deck`
**When** le deck d'offres est chargé
**Then** 3 cartes max sont rendues simultanément : top card interactive + 2 cartes en effet 3D (décalage 4 px Y + scale 0.97 et 0.94)
**And** un compteur "1/12" est affiché dans le header
**And** les 3 prochaines cartes (au-delà du stack visible) sont préchargées en background (images entreprises notamment)
**And** des boutons d'action ❌ 💌 💾 sont rendus sous le stack avec touch targets ≥44 px (NFR-A4)
**And** les états `loading` (skeleton 3 cartes), `idle` (deck actif), `empty` (deck vide → EmptyState), `completing` (animation fin de deck) sont gérés
**And** focus management : focus auto sur top card au render et après chaque swipe (NFR-A1)
**And** annonce ARIA live `"Carte X sur Y"` à chaque transition (NFR-A6)

### Story 3.3: Consultation du détail d'une offre depuis la carte

As a étudiant,
I want voir le détail complet d'une offre avant de décider de candidater,
So que je prenne une décision éclairée et que la lettre IA soit pertinente.

**Acceptance Criteria:**

**Given** un utilisateur sur une carte du deck
**When** il tape sur la carte ou appuie sur `Espace`
**Then** une bottom sheet (mobile) ou un modal (desktop) s'ouvre avec : titre complet, entreprise, localisation précise, type contrat + durée, salaire, date démarrage, description complète markdown, compétences requises (avec celles matchées en vert), niveau études attendu, contact recruteur (anonymisé), lien source
**And** depuis le détail, l'utilisateur peut directement swiper via boutons "Candidater 💌", "Passer ❌", "Sauvegarder 💾"
**And** un bouton "Fermer" ramène au deck sans action
**And** le scroll est fluide, fermable par swipe down (mobile) ou Escape (desktop) (NFR-A2)
**And** un événement Posthog `offer.detail_viewed` est tracé

### Story 3.4: Gestes swipe et équivalents clavier/bouton

As a étudiant utilisant souris, clavier ou écran tactile,
I want manipuler les cartes par gestes naturels ou par clavier/bouton avec la même fluidité,
So que l'app soit accessible à tous les utilisateurs y compris ceux avec contraintes motrices.

**Acceptance Criteria:**

**Given** une top card active
**When** l'utilisateur swipe droite (geste tactile, drag souris ≥25%, touche `→`, ou clic bouton 💌)
**Then** la Server Action `swipeOfferAction` est appelée avec `{ offerId, direction: 'right' }`
**And** un événement `swipe_events` est inséré avec `{ user_id, offer_id, direction, swiped_at }`
**And** au swipe gauche / `←` / clic ❌ : direction `'left'`, l'offre est marquée comme passée (n'apparaîtra plus)
**And** au swipe haut / `↑` / clic 💾 : direction `'up'`, l'offre est sauvegardée dans `watchlist`
**And** un événement Posthog `swipe.performed` est tracé avec `{ direction, match_score }`
**And** un audit log `swipe.performed` est enregistré pour conformité (FR23/IA Act traceability)
**And** au swipe droite, le flux candidature démarre (cf. Story 3.5)

### Story 3.5: Génération automatique d'une lettre de motivation IA <3s

As a étudiant qui swipe droite,
I want que SwipeJob génère automatiquement une lettre de motivation personnalisée à l'offre en moins de 3 secondes,
So que je puisse candidater des dizaines de fois par jour sans charge cognitive.

**Acceptance Criteria:**

**Given** un swipe droite enregistré sur une offre
**When** la Server Action déclenche le job `application.generate_letter`
**Then** un prompt structuré est envoyé à Mistral `mistral-large-latest` avec : profil utilisateur (compétences, parcours), offre (titre, entreprise, description), ton souhaité (FR bienveillant), longueur cible (200-400 mots)
**And** la réponse LLM est sanitizée (pas de hallucinations sur l'expérience, pas de balises HTML, encoding UTF-8 typographique FR — NFR-L3)
**And** la lettre est stockée dans `applications.cover_letter_text` avec `cover_letter_status: 'generated'`
**And** la durée totale (swipe → lettre prête) ≤3 s pour 95% des cas (NFR-P6)
**And** un `ia_audit_logs` est créé avec `{ prompt_hash, model, latency_ms, cost_tokens }`
**And** si Mistral échoue/timeout, fallback Claude EU `claude-haiku-4-5` ; si les deux échouent, template générique FR + flag `cover_letter_status: 'template_fallback'` + alerte Sentry warning
**And** un audit log `application.letter_generated` est enregistré

### Story 3.6: Envoi automatique de la candidature par email

As a étudiant qui a swipé droite,
I want que SwipeJob envoie automatiquement ma candidature complète (CV + lettre) à l'adresse de contact de l'offre,
So que ma candidature soit transmise instantanément sans aucune action supplémentaire de ma part.

**Acceptance Criteria:**

**Given** une lettre générée avec `cover_letter_status: 'generated'`
**When** le job `application.send` est exécuté
**Then** un email est envoyé via Resend EU à l'adresse `offers.contact_email` avec : objet FR ("Candidature [Nom Étudiant] — [Titre Offre]"), corps HTML+text intégrant la lettre, CV PDF attaché (téléchargé depuis R2)
**And** l'envoi respecte SPF/DKIM/DMARC du domaine `@swipejob.fr` (NFR-I3)
**And** le statut de la candidature passe à `'sent'` avec `sent_at`
**And** un événement `application_events` est inséré avec `{ application_id, event: 'sent', at }`
**And** un événement Posthog `application.sent` est tracé
**And** un audit log `application.sent` est enregistré (RGPD)
**And** un cap quotidien d'envois email est appliqué par utilisateur pour éviter spam (NFR-I5)
**And** le warm-up IP est respecté (volume progressif sur 30j)
**And** délivrabilité tracking ≥95% mesurée (NFR-I4) via webhooks Resend

### Story 3.7: Mode preview de la lettre avant envoi

As a étudiant qui veut contrôler sa candidature,
I want pouvoir activer un mode "revue avant envoi" depuis mes préférences pour prévisualiser et éditer chaque lettre avant qu'elle parte,
So que je garde la main sur le contenu envoyé en mon nom.

**Acceptance Criteria:**

**Given** une préférence utilisateur `review_before_send: true`
**When** une lettre est générée suite à un swipe droite
**Then** au lieu d'envoyer immédiatement, un drawer/modal `<CoverLetterEditor>` s'ouvre avec la lettre IA et une zone d'édition rich text
**And** l'utilisateur peut éditer librement avec compteur de mots
**And** des boutons "Envoyer", "Régénérer" (relance LLM), "Annuler" sont proposés
**And** au clic "Envoyer", le flow Story 3.6 reprend avec la lettre éditée
**And** la préférence est togglable depuis `/profil/preferences` avec impact immédiat
**And** par défaut `review_before_send: false` (swipe-and-fire)

### Story 3.8: Undo d'une candidature dans les 30 secondes

As a étudiant qui a swipé par erreur,
I want pouvoir annuler une candidature dans les 30 secondes suivant l'envoi,
So que je ne sois jamais bloqué par une fausse manipulation.

**Acceptance Criteria:**

**Given** une candidature envoyée à `sent_at = now()`
**When** un toast undo `<UndoToast>` (UX-DR15) apparaît en bas d'écran pendant 30 s avec compte à rebours visuel
**Then** l'utilisateur peut cliquer "Annuler" sur le toast
**And** la Server Action `undoApplicationAction` marque la candidature `status: 'cancelled_by_user'`
**And** un email de rétractation est envoyé au destinataire avec mention FR claire ("Cette candidature a été annulée par l'utilisateur dans le délai légal de rétractation")
**And** un événement `application_events` `{ event: 'cancelled', at }` est inséré
**And** un audit log `application.cancelled` est enregistré
**And** un événement Posthog `application.undone` est tracé avec `{ time_to_undo_ms }`
**And** au-delà de 30 s, le bouton undo disparaît et seule une notification au recruteur reste possible (hors scope V1)

### Story 3.9: Quota quotidien de swipes droits configurable

As a SwipeJob,
I want limiter le nombre de candidatures envoyées par utilisateur par jour selon son profil (gratuit/premium, mineur/majeur),
So que les recruteurs ne soient pas submergés et que les comportements abusifs soient contenus.

**Acceptance Criteria:**

**Given** un quota défini : `free.major = 20`, `free.minor = 5`, `premium = 50` (configurable via feature flag)
**When** un utilisateur tente un swipe droite et a déjà atteint son quota du jour
**Then** la Server Action retourne `{ ok: false, error: { code: 'DAILY_QUOTA_REACHED', ... } }`
**And** une notification empathique FR explique la limite et propose : "Reviens demain ☀️" ou "Passe Premium" (V2)
**And** un événement Posthog `quota.reached` est tracé
**And** le quota se reset à minuit Europe/Paris
**And** un audit log `quota.daily_limit_reached` est enregistré
**And** rate limiting Upstash Ratelimit sert de garde-fou supplémentaire (NFR-S5)

### Story 3.10: Anti-doublon de candidature à la même offre

As a SwipeJob (et recruteur),
I want empêcher un utilisateur de candidater plusieurs fois à la même offre,
So que les recruteurs ne reçoivent jamais de candidatures dupliquées et que l'utilisateur ne perde pas de quota.

**Acceptance Criteria:**

**Given** un utilisateur ayant déjà candidaté à `offer_id` (status != cancelled)
**When** il tente de swiper droite sur la même offre
**Then** la Server Action retourne `{ ok: false, error: { code: 'ALREADY_APPLIED', ... } }`
**And** la carte est marquée visuellement "Déjà candidaté ✓" (état idle non-interactive)
**And** aucun job de génération ni envoi n'est enqueued
**And** un événement Posthog `application.duplicate_attempt` est tracé
**And** la contrainte est aussi enforcée en base via index unique `(user_id, offer_id) WHERE status != 'cancelled'`

---

## Epic 4: Application Lifecycle & Coaching

L'utilisateur consulte le dashboard de ses candidatures avec statuts, reçoit des notifications push/email configurables, reporte ses signatures pour célébrer, et bénéficie d'un mini-coach IA pré-entretien 24h avant.

### Story 4.1: Dashboard des candidatures envoyées avec statuts

As a étudiant,
I want consulter toutes mes candidatures envoyées avec leurs statuts à jour,
So que je sache où j'en suis dans mes démarches.

**Acceptance Criteria:**

**Given** un utilisateur authentifié sur `/candidatures`
**When** la page se charge
**Then** une liste paginée affiche toutes les candidatures avec : logo entreprise, titre poste, entreprise, ville, date envoi, statut visuel (envoyée / lue / réponse reçue / entretien planifié / signature / refus)
**And** un `<StatusBadge>` coloré distingue chaque statut (couleurs sémantiques cohérentes avec UX spec)
**And** des filtres permettent de filtrer par statut (multi-select)
**And** un tri permet par date envoi (récent/ancien) ou date dernière activité
**And** un clic sur une candidature ouvre `/candidatures/[id]` avec détail complet (lettre envoyée, historique events, contact)
**And** TanStack Query gère le cache + refetch on focus
**And** une vue empty state UX-DR9 `empty-dashboard` s'affiche si aucune candidature

### Story 4.2: Modification manuelle du statut d'une candidature

As a étudiant qui reçoit une réponse par un canal externe (email direct, LinkedIn),
I want pouvoir modifier manuellement le statut d'une candidature dans mon dashboard,
So que mon suivi reste à jour même quand l'automatisation ne capte pas l'info.

**Acceptance Criteria:**

**Given** une candidature dans le dashboard
**When** l'utilisateur clique sur le badge de statut
**Then** un menu déroulant propose les statuts disponibles (lue, réponse reçue, entretien planifié, signature, refus)
**And** la sélection appelle la Server Action `updateApplicationStatusAction`
**And** un événement `application_events` `{ event: status, at, source: 'manual' }` est inséré
**And** le statut est mis à jour avec optimistic UI (UX-DR17)
**And** un audit log `application.status_updated` est enregistré
**And** si le statut est "entretien planifié", un champ optionnel "date entretien" est demandé
**And** un événement Posthog `application.status_manually_updated` est tracé

### Story 4.3: Reporter une signature avec célébration

As a étudiant qui vient de signer son alternance/stage,
I want déclarer cette signature dans l'app pour déclencher une célébration et obtenir mon Wrapped,
So que je termine mon parcours sur un moment fort et partageable.

**Acceptance Criteria:**

**Given** une candidature dans le dashboard
**When** l'utilisateur clique "Reporter ma signature 🎉"
**Then** un modal s'ouvre avec : confirmation entreprise + poste + date début, champ optionnel "salaire annuel" (privé), boutons "Confirmer ma signature", "Annuler"
**And** au "Confirmer", le statut passe à `'signed'`, l'`application_events` est inséré, un audit log `application.signed` est enregistré
**And** `ConfettiBurst` (UX-DR10) intensity 'epic' se déclenche
**And** l'utilisateur est redirigé vers `<WrappedShare>` (UX-DR11) avec stats partageables
**And** un badge "Première signature" est débloqué (cf. Epic 5)
**And** un événement Posthog `signature.reported` est tracé

### Story 4.4: Notifications push web quotidiennes configurables

As a étudiant,
I want recevoir une notification push chaque matin signalant les nouvelles offres pertinentes,
So que je n'oublie pas d'ouvrir l'app et que je consomme mes recommandations dès le réveil.

**Acceptance Criteria:**

**Given** un utilisateur ayant accepté les notifications push (Web Push API)
**When** son deck quotidien est calculé (job nocturne)
**Then** une notification push est envoyée à 08h00 heure utilisateur (configurable) avec titre FR ("X nouvelles offres pour toi ☀️") et icône SwipeJob
**And** le clic sur la notification ouvre `/deck` directement
**And** l'utilisateur peut modifier l'horaire dans `/parametres` (datetime picker)
**And** l'utilisateur peut désactiver complètement les push depuis les mêmes paramètres
**And** si le navigateur ne supporte pas Web Push, fallback gracieux (pas de notif, message info dans settings)
**And** un événement Posthog `notification.push_sent` puis `notification.push_clicked` est tracé
**And** la latence d'envoi push <30 s pour 95% des destinations

### Story 4.5: Email récapitulatif hebdomadaire d'activité

As a étudiant qui n'ouvre pas l'app tous les jours,
I want recevoir chaque dimanche soir un email récapitulant mon activité de la semaine et les meilleures offres à venir,
So que je reste engagé même hors session active.

**Acceptance Criteria:**

**Given** un utilisateur ayant accepté les emails (consentement marketing distinct du consentement transactionnel)
**When** le job `email.weekly_digest` est exécuté chaque dimanche 19h00 Europe/Paris
**Then** un email FR via Resend est envoyé avec : nombre swipes semaine, candidatures envoyées, statuts évolués, top 3 offres pour la semaine à venir, CTA "Ouvrir mon deck"
**And** un lien de désinscription un-clic conforme RGPD est présent en footer
**And** un événement Posthog `email.digest_sent` puis `email.digest_opened` (via tracking pixel anonymisé) est tracé
**And** le template HTML+text respecte l'accessibilité email (alt text images, contraste, tailles)
**And** la délivrabilité reste >95% mesurée via Resend

### Story 4.6: Préférences des canaux de communication

As a étudiant,
I want configurer finement quels canaux (push, email, sms futur) je reçois et leur fréquence,
So que je ne sois jamais spammé et que je garde le contrôle sur mes communications.

**Acceptance Criteria:**

**Given** un utilisateur sur `/parametres`
**When** il accède à la section "Notifications"
**Then** chaque canal (push, email transactionnel, email marketing, sms V2) a un toggle on/off
**And** pour chaque canal actif, fréquence configurable (quotidien, hebdomadaire, jamais) selon type
**And** la modification est sauvée via Server Action avec audit log `preferences.notifications_updated`
**And** la modification prend effet immédiatement (les jobs respectent les préférences au moment de l'exécution)
**And** une désinscription un-clic depuis n'importe quel email modifie automatiquement les préférences

### Story 4.7: Mini-coach IA pré-entretien (InterviewPrepCard)

As a étudiant qui a un entretien planifié dans 24h,
I want recevoir une fiche de préparation personnalisée avec résumé entreprise, questions probables et points forts du matching,
So que j'arrive préparé et confiant à l'entretien.

**Acceptance Criteria:**

**Given** une candidature au statut `interview_scheduled` avec `interview_at` renseigné
**When** un job `coach.prepare_interview` s'exécute 24h avant `interview_at`
**Then** Mistral génère : un résumé entreprise (3 lignes max), 3 questions probables FR (fondées sur la description offre + secteur), une liste des points forts du matching (issus de `match_scores.features`)
**And** le contenu est stocké dans `interview_preps` lié à l'application
**And** une notification push (si activée) + un email sont envoyés à l'utilisateur signalant "Ton entretien chez [Entreprise] est dans 24h ✨"
**And** un `<InterviewPrepCard>` (UX-DR13) est visible dans `/coach` et accessible depuis la candidature
**And** un événement Posthog `coach.interview_prep_generated` est tracé
**And** un audit log `coach.prep_created` est enregistré

---

## Epic 5: Engagement, Streaks & Social

L'utilisateur consulte ses streaks de jours actifs, débloque des badges aux jalons, génère un lien de parrainage trackable, partage anonymement des offres, et célèbre sa signature via un écran Wrapped partageable.

### Story 5.1: Composant DailyStreak avec heatmap historique

As a étudiant,
I want voir mon nombre de jours consécutifs d'utilisation avec une heatmap visuelle,
So que je sois motivé à revenir chaque jour et que mon engagement soit visible.

**Acceptance Criteria:**

**Given** un utilisateur connecté
**When** il ouvre `/deck` ou `/profil`
**Then** un chip `<DailyStreak>` (UX-DR7) s'affiche dans le top-right du header avec icône 🔥 et nombre de jours
**And** la couleur du chip est graduée : caché si 0, neutre 1-6j, coral 7-29j, primary avec glow 30j+
**And** un tap ouvre une bottom sheet avec heatmap calendar style Github (12 dernières semaines), liste badges débloqués, prochain jalon visible
**And** le streak est calculé sur `swipe_events` ou `app.opened` events distincts par jour (Europe/Paris)
**And** une journée sans activité casse le streak (passé à 0 le lendemain)
**And** un événement Posthog `streak.viewed` est tracé

### Story 5.2: Système de badges et déblocage aux jalons

As a étudiant,
I want débloquer des badges aux moments clés de mon parcours (premier swipe, première candidature, première réponse, signature, etc.),
So que ma progression soit visuellement reconnue et que je sois motivé à atteindre les jalons suivants.

**Acceptance Criteria:**

**Given** un catalogue de badges défini : "Premier swipe", "Première candidature", "Première réponse", "Premier entretien", "Première signature", "Streak 7j", "Streak 30j", "Premier parrainage", "10 candidatures", "50 candidatures"
**When** un événement déclencheur survient (matching avec règle badge)
**Then** une entrée `user_badges` est créée avec `{ user_id, badge_code, unlocked_at }`
**And** une animation `<ConfettiBurst>` (UX-DR10) intensity 'normal' se déclenche
**And** un toast empathique FR annonce le badge ("Bravo, tu as débloqué ton premier badge ! 🏆")
**And** le badge est visible dans `/profil/badges` avec illustration et description
**And** un événement Posthog `badge.unlocked` est tracé avec `{ badge_code }`
**And** la liste de badges et leurs critères est versionnée et auditée (pas de modification rétroactive)

### Story 5.3: Lien de parrainage unique avec tracking et récompense

As a étudiant satisfait,
I want générer un lien de parrainage unique à partager avec mes camarades pour qu'ils s'inscrivent,
So que je sois récompensé pour ma viralité organique et que SwipeJob grandisse.

**Acceptance Criteria:**

**Given** un utilisateur sur `/profil/parrainage`
**When** la page se charge
**Then** un lien unique `https://swipejob.fr/r/[code]` est généré automatiquement (code court 6 caractères alphanum)
**And** un bouton "Copier le lien", "Partager via WhatsApp", "Partager via SMS", "Partager par email" est proposé
**And** le compteur de filleuls (inscrits valides via mon lien) est affiché
**And** quand un nouveau visiteur s'inscrit via `/r/[code]`, l'attribution est tracée dans `referrals` avec `{ parrain_id, filleul_id, signed_up_at }`
**And** au premier swipe du filleul, l'attribution est validée et le parrain reçoit un badge "Premier parrainage" + (V2) bonus premium 7j
**And** un événement Posthog `referral.sent` puis `referral.signup` est tracé
**And** un audit log `referral.attributed` est enregistré
**And** les liens auto-générés respectent les règles anti-fraude (limite filleuls/jour, détection self-referral via IP/device)

### Story 5.4: Partage d'une offre avec lien anonymisé

As a étudiant,
I want partager une offre intéressante avec mes amis sans révéler mon profil ni que je l'ai swipée,
So que je sois utile à mon entourage sans compromettre ma vie privée.

**Acceptance Criteria:**

**Given** une offre consultée par l'utilisateur
**When** il clique sur "Partager cette offre"
**Then** un lien de type `https://swipejob.fr/offres/[slug]` est généré (Story 7.3 fournit la page publique)
**And** le lien ne contient aucun identifiant utilisateur (anonymisé)
**And** des options de partage natives (Web Share API) ou liens (WhatsApp, LinkedIn, Twitter, copier) sont proposées
**And** un événement Posthog `offer.shared` est tracé avec `{ offer_id, channel }` (pas de PII)
**And** un compteur de partages est incrémenté côté offre (anonyme, pour stats)

### Story 5.5: Écran WrappedShare à la signature

As a étudiant qui vient de signer,
I want voir un écran Wrapped célébrant mon parcours avec stats partageables sur Instagram et LinkedIn,
So que je termine mon expérience SwipeJob sur un moment mémorable et viral.

**Acceptance Criteria:**

**Given** une candidature passée au statut `signed` (Story 4.3)
**When** la page `<WrappedShare>` (UX-DR11) s'affiche
**Then** un layout plein écran avec animation d'entrée présente : "Tu as signé chez [Entreprise] ! 🎉" en `display-2xl`, stats parcours (durée recherche, candidatures envoyées, entretiens passés), illustration célébration
**And** des boutons proposent : "Partager Instagram Story", "Post LinkedIn", "Inviter un pote", "Voir mon dashboard"
**And** au clic Instagram, une image 1080x1920 px est générée dynamiquement (via `next/og` ou ImageResponse) avec design custom et partage natif Web Share API
**And** au clic LinkedIn, un texte pré-rédigé FR (modifiable) est ouvert dans LinkedIn share
**And** un événement Posthog `wrapped.shared` est tracé avec `{ channel }`
**And** l'écran est entièrement accessible (NFR-A1, NFR-A6) avec annonces ARIA des stats

---

## Epic 6: Privacy, RGPD Self-Service & Compliance

L'utilisateur consulte CGU/confidentialité, gère ses consentements granulaires, exporte ses données, demande suppression, bénéficie d'audit logs, anonymisation après 24 mois, conformité Loi Toubon, déclaration d'accessibilité.

### Story 6.1: Pages CGU, politique de confidentialité et cookies

As a SwipeJob (responsable conformité),
I want que toutes les pages légales (CGU, politique de confidentialité, cookies) soient accessibles à tout moment depuis le pied de page et claires en français,
So que les obligations RGPD/CNIL et information utilisateur soient respectées.

**Acceptance Criteria:**

**Given** un visiteur (authentifié ou non)
**When** il consulte les pages `/mentions-legales`, `/cgu`, `/politique-confidentialite`, `/cookies`
**Then** chaque page est en français clair (niveau B1-B2 max), structurée avec sommaire ancré, mise à jour datée
**And** la politique de confidentialité liste : finalités traitement, bases légales, durées conservation, droits utilisateur, contact DPO, transferts hors UE (ou absence)
**And** la page cookies liste tous les cookies/trackers, leur finalité, leur durée, leur source, avec boutons accept/reject par catégorie (analytics distinct du strictement nécessaire)
**And** un lien vers chaque page est présent dans le footer de toutes les pages
**And** les pages sont accessibles WCAG 2.1 AA (NFR-A1)
**And** un événement Posthog `legal.page_viewed` est tracé (pages publiques uniquement)

### Story 6.2: Gestion granulaire des consentements par finalité

As a utilisateur soucieux de sa vie privée,
I want pouvoir donner ou retirer mon consentement séparément pour chaque finalité (matching IA, marketing, analytics, lecture email pour détection réponses),
So que mes choix soient respectés et que la plateforme soit conforme à l'art. 7 RGPD.

**Acceptance Criteria:**

**Given** un utilisateur sur `/profil/confidentialite`
**When** il accède à la section "Consentements"
**Then** une liste de finalités est affichée avec toggle on/off pour chacune : matching IA (obligatoire pour utilisation app), marketing emails, analytics produit (Posthog), email read scanning (V2)
**And** chaque finalité a un descriptif FR clair de ce qui est fait avec les données
**And** une modification est sauvée immédiatement via Server Action avec audit log `consent.updated` (avec ancien/nouveau état)
**And** le retrait d'un consentement est appliqué dans les services dépendants (ex : retrait analytics → Posthog désactivé immédiatement)
**And** une entrée `consents` est versionnée pour conformité (preuve consentement avec horodatage et version politique)
**And** un événement Posthog `consent.updated` est tracé (méta-tracking sans PII)

### Story 6.3: Export des données personnelles JSON et PDF

As a utilisateur RGPD,
I want pouvoir demander l'export complet de mes données personnelles en JSON et PDF en moins de 24 heures,
So que je puisse exercer mon droit à la portabilité (art. 20 RGPD).

**Acceptance Criteria:**

**Given** un utilisateur sur `/profil/confidentialite/export`
**When** il clique "Demander l'export de mes données"
**Then** un job `rgpd.export` est enqueued avec `{ user_id, requested_at }`
**And** le worker collecte toutes les données : profil, préférences, CV, candidatures, swipe_events, badges, consents, audit_logs personnels
**And** un fichier JSON structuré (format standard JSON-LD ou schema clair) et un fichier PDF lisible humain sont générés
**And** les deux fichiers sont stockés dans R2 EU avec URL signée valide 7j
**And** un email est envoyé à l'utilisateur avec les liens download (lien expirant)
**And** la durée totale demande → email envoyé ≤24h (NFR garanti)
**And** un audit log `rgpd.export_completed` est enregistré
**And** un événement Posthog `rgpd.export_requested` est tracé

### Story 6.4: Demande de suppression complète du compte

As a utilisateur exerçant son droit à l'oubli,
I want demander la suppression complète de mon compte et de toutes mes données, exécutée sous 30 jours maximum,
So que mon droit à l'effacement (art. 17 RGPD) soit respecté.

**Acceptance Criteria:**

**Given** un utilisateur initiant une demande de suppression (depuis Story 1.10 ou `/profil/confidentialite/supprimer`)
**When** la confirmation 2-étapes est validée
**Then** un job `rgpd.delete` est enqueued avec `{ user_id, requested_at, scheduled_for: now + 30d }`
**And** le compte passe immédiatement à `pending_deletion` (déconnexion forcée, accès bloqué)
**And** un email de confirmation FR est envoyé avec date d'exécution effective et lien de rétractation (valide 7j)
**And** à l'exécution (30j après ou immédiat si rétractation absente après 7j), toutes les données PII sont supprimées physiquement (users, profiles, cvs, applications letters)
**And** les `audit_logs` et `ia_audit_logs` sont conservés mais anonymisés (user_id hashé) pour conformité 13 mois
**And** les fichiers R2 (CV, lettres, exports) sont supprimés physiquement
**And** un audit log `rgpd.deletion_executed` est enregistré
**And** un événement Posthog `rgpd.deletion_executed` est tracé (anonymisé)

### Story 6.5: Audit logs append-only des accès et modifications PII

As a SwipeJob (responsable conformité CNIL),
I want maintenir un journal immuable de tous les accès et modifications de données personnelles,
So que toute exfiltration ou manipulation soit auditable a posteriori sur 13 mois.

**Acceptance Criteria:**

**Given** la table `audit_logs` créée
**When** une action sensible survient (login, profile_update, cv_uploaded, application_sent, rgpd_request, consent_change, admin_action sur PII)
**Then** une entrée est insérée avec `{ id (cuid2), actor_id, actor_type ('user'|'admin'|'system'), action, resource_type, resource_id, ip_hashed, user_agent_hashed, payload_diff (JSONB sans PII brute), at }`
**And** la table est append-only : pas d'UPDATE/DELETE permis (enforcé via RLS ou contraintes app)
**And** la rétention est de 13 mois minimum (NFR-S7, NFR-O5)
**And** un export mensuel vers R2 EU est automatisé (archive froide)
**And** un dashboard admin permet de filtrer/rechercher les logs pour traitement RGPD (Story 8.5)
**And** les logs sont indexés sur `actor_id`, `resource_id`, `at` pour requête rapide
**And** aucune PII en clair n'est stockée dans les logs (hashes uniquement pour IP/UA)

### Story 6.6: Anonymisation automatique des CV >24 mois d'inactivité

As a SwipeJob (responsable RGPD),
I want anonymiser automatiquement les profils et CV d'utilisateurs inactifs depuis plus de 24 mois,
So que la durée de conservation des données soit proportionnée aux finalités (principe RGPD).

**Acceptance Criteria:**

**Given** un utilisateur sans activité (login, swipe, candidature) depuis ≥24 mois
**When** le job `rgpd.anonymize_inactive` s'exécute (mensuel)
**Then** les champs PII (nom complet, email, téléphone, école) sont remplacés par des hashes/pseudos
**And** les CV PDF dans R2 sont supprimés physiquement
**And** les `applications.cover_letter_text` sont supprimés
**And** le compte passe à `status: 'anonymized'`
**And** un email de notification est envoyé avant anonymisation (30j avant pour permettre réveil compte)
**And** un audit log `rgpd.anonymized` est enregistré
**And** les statistiques agrégées (swipes count, applications count) restent pour analyse produit anonyme

### Story 6.7: Conformité Loi Toubon et infrastructure i18n

As a SwipeJob (responsable conformité Loi Toubon),
I want garantir que toute communication produite par le système destinée au marché français est en français,
So que la plateforme respecte la Loi du 4 août 1994 (Loi Toubon).

**Acceptance Criteria:**

**Given** le code source de l'app
**When** un audit est effectué
**Then** aucune string en dur dans le code (toutes externalisées dans `apps/web/messages/fr.json`)
**And** `next-intl` est configuré avec locale `fr` par défaut, infrastructure prête pour ajouter `en`, `es`, `de` en V2 (NFR-L2)
**And** les caractères accentués et signes typographiques français (espaces insécables, guillemets «», apostrophes ') sont correctement encodés UTF-8 dans tous les outputs (NFR-L3)
**And** les lettres IA générées sont vérifiées en français exclusivement (prompt Mistral le force)
**And** les emails transactionnels et marketing sont en français
**And** les pages SEO publiques sont en français
**And** un test E2E `loi-toubon.spec.ts` vérifie qu'aucune string anglaise par défaut n'apparaît dans le rendu

### Story 6.8: Déclaration d'accessibilité publique et signalement

As a SwipeJob (responsable accessibilité),
I want maintenir une déclaration d'accessibilité publique à jour et offrir un mécanisme de signalement aux utilisateurs,
So que les obligations légales accessibilité (RGAA, NFR-A7) soient respectées.

**Acceptance Criteria:**

**Given** une page `/declaration-accessibilite`
**When** un visiteur la consulte
**Then** elle déclare le niveau de conformité (cible WCAG 2.1 AA), le périmètre audité, les non-conformités connues, la date du dernier audit
**And** un formulaire FR permet aux utilisateurs de signaler un défaut d'accessibilité (champs : URL concernée, description, contact optionnel)
**And** le signalement crée un ticket dans `accessibility_reports` table consulté par l'équipe
**And** la page est référencée dans le footer de toutes les pages publiques et app
**And** un audit interne axe-core en CI bloque tout build avec violations critiques (NFR-A8)
**And** un audit externe annuel est planifié et son résultat publié

---

## Epic 7: Public Marketing & SEO Discovery

Un visiteur non-connecté découvre SwipeJob via Google grâce à des pages SEO dynamiques par métier × ville × école, consulte une offre publique anonymisée, lit le blog. Google Jobs indexe via Schema.org.

### Story 7.1: Landing publique optimisée SEO et Core Web Vitals

As a visiteur potentiel,
I want découvrir SwipeJob via une landing publique rapide, claire et engageante,
So que je comprenne la valeur du produit en <10 secondes et m'inscrive.

**Acceptance Criteria:**

**Given** une visite anonyme sur `https://swipejob.fr/`
**When** la page se charge
**Then** elle est rendue en SSR/SSG via Next.js 15 avec hero (titre, sous-titre, CTA "S'inscrire gratuitement"), 3 features clés visuelles, 3 témoignages personas (Léa/Tom/Yasmine), section "Comment ça marche" en 3 étapes, FAQ, CTA final, footer complet
**And** FCP <1,5 s sur Slow 3G (NFR-P2), LCP <2,5 s (NFR-P3), Lighthouse Performance ≥90 (NFR-P9)
**And** toutes les images sont en formats next-gen (AVIF/WebP) avec `next/image` lazy loading
**And** aucun JS bloquant le rendu, fonts auto-héberges avec `next/font`
**And** Schema.org `Organization` + `WebSite` injectés dans le head
**And** Open Graph + Twitter Cards configurés
**And** un événement Posthog `landing.viewed` est tracé (avec consentement strictement nécessaire)

### Story 7.2: Pages SEO dynamiques par métier × ville × école

As a visiteur arrivant via Google,
I want trouver une page SwipeJob dédiée à ma recherche spécifique (ex : "alternance développeur Lyon"),
So que je découvre des offres pertinentes même avant inscription.

**Acceptance Criteria:**

**Given** des combinaisons valides (top 50 métiers × top 100 villes × top 200 écoles) générées dynamiquement
**When** un visiteur accède à `/alternance/[metier]/[ville]` ou `/stage/[metier]/[ville]/[ecole]`
**Then** la page est générée SSG (Next.js generateStaticParams) avec ISR (revalidate 24h)
**And** chaque page affiche : titre H1 unique FR ("Alternance Développeur à Lyon — SwipeJob"), description meta unique, 10 offres récentes pertinentes (anonymisées via Story 7.3), CTA inscription
**And** au minimum 5 000 pages indexables sont disponibles à terme
**And** chaque page a un permalink stable et un slug propre kebab-case
**And** Schema.org `BreadcrumbList` + `ItemList` injectés
**And** Open Graph dynamique par page

### Story 7.3: Page publique d'offre anonymisée

As a visiteur non-inscrit,
I want consulter une offre individuelle avec des infos utiles pour évaluer mon intérêt sans devoir m'inscrire,
So que la barrière à l'inscription soit basse et la conversion optimisée.

**Acceptance Criteria:**

**Given** une offre active avec un slug `/offres/[slug]`
**When** un visiteur consulte la page
**Then** la page affiche : titre, entreprise, ville, type contrat, durée, description, compétences requises, niveau attendu, salaire (fourchette si disponible), date publication
**And** un CTA "Candidater en 1 swipe" propose l'inscription gratuite
**And** un CTA "Voir 10 offres similaires" pointe vers une liste filtrée
**And** Schema.org `JobPosting` complet est injecté pour indexation Google Jobs (NFR FR59)
**And** la page est SSG avec ISR (revalidate 1h)
**And** aucune donnée recruteur sensible n'est exposée (email contact uniquement disponible après inscription)

### Story 7.4: Sitemap.xml et robots.txt dynamiques

As a moteur de recherche,
I want disposer d'un sitemap XML et d'un robots.txt cohérents reflétant la structure SEO,
So que toutes les pages publiques de SwipeJob soient indexées efficacement.

**Acceptance Criteria:**

**Given** le système SSG Next.js
**When** `/sitemap.xml` est requêté
**Then** il liste toutes les URLs publiques : landing, pages SEO dynamiques, pages offres, blog, pages légales
**And** chaque URL a `lastmod`, `changefreq`, `priority` cohérents
**And** la pagination du sitemap est gérée si >50 000 URLs (sitemap index)
**And** `/robots.txt` autorise les pages publiques, désallow `/api/*`, `/admin/*`, `/(app)/*`, `/etape-*/`
**And** le sitemap est régénéré à chaque déploiement et exposé immédiatement
**And** Google Search Console reçoit une notification automatique de mise à jour (ping)

### Story 7.5: Métadonnées Schema.org JobPosting complètes

As a SEO,
I want que chaque offre publique soit enrichie de métadonnées Schema.org JobPosting complètes pour Google Jobs,
So que les offres apparaissent dans la box "Offres d'emploi" de Google avec maximum de signaux.

**Acceptance Criteria:**

**Given** une page publique d'offre
**When** Google Bot crawle la page
**Then** un script JSON-LD `application/ld+json` valide est présent avec : `@type: JobPosting`, `title`, `description`, `datePosted`, `validThrough`, `hiringOrganization`, `jobLocation`, `employmentType` (FULL_TIME/PART_TIME/INTERN/CONTRACTOR), `baseSalary` (si dispo), `qualifications`, `educationRequirements`
**And** le markup passe Google Rich Results Test sans erreur
**And** un test automatisé `schema-jobposting.test.ts` valide la cohérence
**And** les offres anciennes (>30j) marquées `validThrough` passé sont automatiquement déréférencées

### Story 7.6: Bibliothèque de blog éditorial

As a étudiant en recherche,
I want accéder à des articles de conseils carrière, guides alternance, retours d'expérience,
So que je trouve de la valeur sur SwipeJob au-delà du seul matching.

**Acceptance Criteria:**

**Given** un système de blog `/blog/[slug]`
**When** un utilisateur authentifié (V1) ou public (V2) consulte le blog
**Then** la liste `/blog` affiche les articles paginés avec image, titre, extrait, date, auteur, temps lecture
**And** chaque article `/blog/[slug]` est rendu SSR/SSG avec markdown enrichi (MDX), images optimisées, table des matières, partage social
**And** les articles sont versionnés en git via dossier `content/blog/*.mdx` (V1 simple, pas de CMS)
**And** Schema.org `BlogPosting` est injecté
**And** une section "Articles similaires" propose 3 suggestions
**And** un événement Posthog `blog.article_read` est tracé

---

## Epic 8: Admin Back-Office & Compliance Operations

Un administrateur s'authentifie sur le back-office, modère les offres, gère les utilisateurs, traite les demandes RGPD, audite manuellement les scores IA, actionne le kill switch, consulte les KPIs.

### Story 8.1: Authentification admin sur back-office distinct

As a administrateur SwipeJob,
I want pouvoir m'authentifier sur l'interface admin `/admin` distincte de l'app utilisateur,
So que les outils internes soient sécurisés et que les rôles soient clairement séparés.

**Acceptance Criteria:**

**Given** un utilisateur avec `role: 'admin'` ou `role: 'moderator'` en base
**When** il accède à `/admin/*`
**Then** un middleware vérifie son rôle et redirige vers `/login?next=/admin` s'il n'est pas auth ou pas admin
**And** une fois auth admin, le layout admin (sidebar dédiée, top bar admin) s'affiche
**And** toute action admin déclenche un audit log `admin.action` avec détails (resource, action, actor)
**And** la session admin a une durée plus courte (8h vs 30j user) pour sécurité
**And** la 2FA est obligatoire pour les rôles `admin` (V2 si pas disponible V1, à minima password fort + monitoring login)
**And** rate limiting strict (10 tentatives login/heure/IP) pour `/admin/login`

### Story 8.2: Modération des offres ingérées

As a administrateur,
I want consulter et modérer les offres ingérées (signaler problématiques, supprimer, marquer prioritaires),
So que la qualité du catalogue soit maintenue et que les offres frauduleuses/discriminatoires soient retirées rapidement.

**Acceptance Criteria:**

**Given** un admin sur `/admin/offres`
**When** la page se charge
**Then** une liste paginée des offres affiche : titre, entreprise, source, status, quality_score, date_publication, swipes count, applications count
**And** des filtres permettent : par source, par status (active/expired/filled/flagged), par quality_score, par date
**And** chaque offre a des actions : "Voir détail", "Signaler problématique" (choix raison + commentaire), "Retirer", "Marquer prioritaire"
**And** "Retirer" passe l'offre à `status: 'admin_removed'` avec audit log et retire l'offre du matching et des pages publiques (NFR FR16)
**And** "Signaler" enregistre un `offer_flag` avec raison et déclenche éventuellement une suppression auto si seuil atteint
**And** un audit log `admin.offer_*` est enregistré pour toute action

### Story 8.3: Gestion des utilisateurs et états

As a administrateur,
I want consulter la liste des utilisateurs et leur état (actif/suspendu/supprimé/anonymisé),
So que je puisse répondre aux demandes support et gérer les abus.

**Acceptance Criteria:**

**Given** un admin sur `/admin/users`
**When** la page se charge
**Then** une liste paginée affiche : email (masqué partiellement), date inscription, dernière activité, status, role, swipes total, applications total
**And** une recherche par email exact ou ID est disponible
**And** chaque utilisateur a un détail `/admin/users/[id]` affichant son profil complet, son historique d'activité, ses audit logs personnels
**And** des actions admin : "Suspendre" (lock account avec raison), "Réactiver", "Anonymiser maintenant" (forcer anonymisation Story 6.6), "Supprimer définitivement"
**And** un audit log `admin.user_*` est enregistré pour toute action
**And** la consultation des données utilisateur par admin est elle-même loggée (NFR-S7 audit complet)

### Story 8.4: Traitement des demandes RGPD

As a administrateur RGPD/DPO,
I want consulter et traiter manuellement les demandes RGPD (export, suppression, rectification) qui nécessitent intervention humaine,
So que les obligations légales soient respectées dans les délais.

**Acceptance Criteria:**

**Given** un admin sur `/admin/rgpd-requests`
**When** la page se charge
**Then** une liste des demandes RGPD affiche : type (export/delete/rectify), user, requested_at, due_at (échéance), status, assigned_to
**And** chaque demande peut être traitée : marquer en cours, ajouter commentaire interne, exécuter manuellement si automation échouée, marquer comme complétée
**And** les demandes en retard (> SLA : 24h export, 30j delete) sont mises en avant en rouge
**And** un audit log `admin.rgpd_*` est enregistré pour toute manipulation
**And** un dashboard top-level affiche les SLAs RGPD (% dans les délais sur 30j)

### Story 8.5: Dashboard des métriques produit (KPIs)

As a équipe SwipeJob,
I want consulter un dashboard interne avec les KPIs produit définis dans les Success Criteria du PRD,
So que les décisions soient pilotées par les données.

**Acceptance Criteria:**

**Given** un admin sur `/admin/metrics`
**When** la page se charge
**Then** des cartes affichent les KPIs clés : DAU/WAU/MAU, signups/jour, swipes/user/jour, candidatures envoyées/jour, taux de réponse moyen, signatures totales, ARR estimé (V2), churn 7/30j, NPS V2
**And** chaque KPI est plotté sur 30j, 90j, 12 mois avec comparatif période précédente
**And** des filtres par cohorte (semaine inscription) et par persona (Léa/Tom/Yasmine via heuristiques école+âge+géo) sont disponibles
**And** un export CSV est disponible pour reporting
**And** les données sont rafraîchies toutes les heures (job ETL léger ou query directe avec cache)
**And** Posthog est la source de vérité product analytics, complété par DB queries pour KPIs business

### Story 8.6: Dashboard audit IA et kill switch matching

As a DPO et CTO,
I want consulter un dashboard d'audit IA et activer un kill switch d'urgence pour désactiver le matching IA,
So que les exigences IA Act (audit + kill switch NFR-F3/F5) soient opérationnelles.

**Acceptance Criteria:**

**Given** un admin sur `/admin/ia-audit`
**When** la page se charge
**Then** des stats affichent : nombre d'appels LLM/jour, latence moyenne, taux d'erreur, coûts (€), répartition par modèle (Mistral/Claude fallback), top features contributives
**And** une recherche permet d'auditer un utilisateur×offre spécifique en <30 s (NFR-F3) en affichant les `ia_audit_logs` pertinents avec features, score, prompt hash
**And** un audit de biais trimestriel (Story 2.9) est visible avec graphe d'évolution
**And** un kill switch UI permet de basculer `IA_MATCHING_ENABLED` à false en 2 clics (avec confirmation) — bascule immédiatement vers matching keyword+règles (NFR-F5)
**And** l'activation du kill switch déclenche : audit log `admin.ia_killswitch_toggled`, notification Slack/email équipe, bandeau visible côté users ("Matching simplifié temporairement actif")
**And** un historique des activations/désactivations kill switch est conservé pour audit
