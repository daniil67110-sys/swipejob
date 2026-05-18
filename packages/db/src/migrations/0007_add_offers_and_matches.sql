-- Story 2.1 : pgvector pour embeddings d'offres (dim 1024 = Mistral-Embed)
CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint

CREATE TABLE "offer_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"api_url" text,
	"enabled" boolean DEFAULT true NOT NULL,
	"last_sync_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "offer_sources_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "offers" (
	"id" text PRIMARY KEY NOT NULL,
	"source_id" text NOT NULL,
	"external_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"company_name" text,
	"company_logo_url" text,
	"contract_type" text,
	"location_city" text,
	"location_lat" double precision,
	"location_lng" double precision,
	"remote_mode" text,
	"salary_min_monthly" integer,
	"salary_max_monthly" integer,
	"start_date" date,
	"duration" text,
	"requirements" jsonb,
	"embedding" vector(1024),
	"expires_at" timestamp with time zone,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "match_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"offer_id" text NOT NULL,
	"score" double precision NOT NULL,
	"explanation" jsonb,
	"computed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "offers" ADD CONSTRAINT "offers_source_id_offer_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."offer_sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "match_scores" ADD CONSTRAINT "match_scores_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_offer_sources_enabled" ON "offer_sources" USING btree ("enabled");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_offers_source_external" ON "offers" USING btree ("source_id","external_id");--> statement-breakpoint
CREATE INDEX "idx_offers_is_active" ON "offers" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_offers_expires_at" ON "offers" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_offers_contract_type" ON "offers" USING btree ("contract_type");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_match_scores_user_offer" ON "match_scores" USING btree ("user_id","offer_id");--> statement-breakpoint
CREATE INDEX "idx_match_scores_user_score" ON "match_scores" USING btree ("user_id","score");