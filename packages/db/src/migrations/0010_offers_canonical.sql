ALTER TABLE "offers" ADD COLUMN "canonical_id" text;--> statement-breakpoint
ALTER TABLE "offers" ADD COLUMN "deduped_at" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_offers_canonical_id" ON "offers" USING btree ("canonical_id");--> statement-breakpoint
CREATE INDEX "idx_offers_not_deduped" ON "offers" USING btree ("id") WHERE "offers"."deduped_at" IS NULL;