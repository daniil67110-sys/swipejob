CREATE TYPE "public"."offer_status" AS ENUM('active', 'expired', 'filled', 'archived');--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "status" "offer_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
-- Story 2.6 backfill : aligner status sur is_active existant (sinon les
-- offres déjà désactivées via is_active=false redeviendraient 'active').
UPDATE "offers" SET "status" = CASE WHEN "is_active" THEN 'active'::offer_status ELSE 'archived'::offer_status END;--> statement-breakpoint
CREATE INDEX "idx_offers_status_active" ON "offers" USING btree ("status") WHERE "offers"."status" = 'active';