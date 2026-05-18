-- Story 1.9 : pg_trgm pour fuzzy search sur noms d'écoles
CREATE EXTENSION IF NOT EXISTS "pg_trgm";--> statement-breakpoint

CREATE TABLE "schools" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"name_normalized" text NOT NULL,
	"acronym" text,
	"type" text,
	"city" text,
	"unverified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "current_school" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "education_level" text;--> statement-breakpoint
CREATE INDEX "idx_schools_name_normalized" ON "schools" USING btree ("name_normalized");--> statement-breakpoint
-- Index trigram pour similarity() fuzzy search
CREATE INDEX "idx_schools_name_trgm" ON "schools" USING gin ("name_normalized" gin_trgm_ops);
