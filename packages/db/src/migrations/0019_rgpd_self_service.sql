-- Stories 6.2 + 6.3 + 6.4 — RGPD self-service
--
-- 1. user_consents : append-only, latest row per (userId, purpose) fait foi.
-- 2. rgpd_exports : historique des demandes d'export.
-- 3. restoration_tokens : tokens de rétractation 7j pour annuler suppression.
-- 4. users.purged_at : marqueur exécution physique de la purge.

CREATE TABLE IF NOT EXISTS "user_consents" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "purpose" text NOT NULL,
  "granted" boolean NOT NULL,
  "policy_version" integer NOT NULL DEFAULT 1,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_user_consents_user_purpose_created"
  ON "user_consents" ("user_id", "purpose", "created_at");
--> statement-breakpoint

DO $$ BEGIN
  CREATE TYPE "rgpd_export_status" AS ENUM ('pending', 'completed', 'failed', 'expired');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "rgpd_exports" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "status" "rgpd_export_status" NOT NULL DEFAULT 'pending',
  "json_r2_key" text,
  "pdf_r2_key" text,
  "requested_at" timestamp with time zone NOT NULL DEFAULT now(),
  "completed_at" timestamp with time zone,
  "expires_at" timestamp with time zone,
  "error_message" text
);
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_rgpd_exports_user_requested"
  ON "rgpd_exports" ("user_id", "requested_at");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_rgpd_exports_status"
  ON "rgpd_exports" ("status");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "restoration_tokens" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_restoration_tokens_hash"
  ON "restoration_tokens" ("token_hash");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_restoration_tokens_user_id"
  ON "restoration_tokens" ("user_id");
--> statement-breakpoint

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "purged_at" timestamp with time zone;
