CREATE TABLE "preferences" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"contract_types" text[] DEFAULT '{}' NOT NULL,
	"durations" text[] DEFAULT '{}' NOT NULL,
	"cities" text[] DEFAULT '{}' NOT NULL,
	"geo_radius_km" integer DEFAULT 50,
	"work_modes" text[] DEFAULT '{}' NOT NULL,
	"sectors" text[] DEFAULT '{}' NOT NULL,
	"company_sizes" text[] DEFAULT '{}' NOT NULL,
	"salary_min_monthly" integer,
	"salary_max_monthly" integer,
	"desired_start_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preferences" ADD CONSTRAINT "preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_preferences_user_id" ON "preferences" USING btree ("user_id");