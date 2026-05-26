-- Story 5.4 — Partage d'offres
--
-- Compteur de partages anonyme par offre. Pas de PII : on n'enregistre pas qui partage,
-- juste le total pour tri/stats côté admin (volume column dans BADGE_CATALOG futur).

ALTER TABLE "offers"
  ADD COLUMN IF NOT EXISTS "share_count" integer NOT NULL DEFAULT 0;
