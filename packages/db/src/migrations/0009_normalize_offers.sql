ALTER TABLE "offers" ADD COLUMN "quality_score" double precision;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "source_url" text;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "contact_email" "citext";--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "published_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "normalized_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_offers_quality_high" ON "offers" USING btree ("quality_score") WHERE "offers"."quality_score" >= 0.6;--> statement-breakpoint
CREATE INDEX "idx_offers_not_normalized" ON "offers" USING btree ("id") WHERE "offers"."normalized_at" IS NULL;