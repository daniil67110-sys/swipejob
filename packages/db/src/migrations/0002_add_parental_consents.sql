CREATE TYPE "public"."parental_consent_status" AS ENUM('PENDING', 'GRANTED', 'REFUSED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "parental_consents" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"parent_name" text NOT NULL,
	"parent_email" "citext" NOT NULL,
	"status" "parental_consent_status" DEFAULT 'PENDING' NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"responded_at" timestamp with time zone,
	"ip_address" text,
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "parental_consents" ADD CONSTRAINT "parental_consents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_parental_consents_user_id" ON "parental_consents" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_parental_consents_status" ON "parental_consents" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_parental_consents_token_hash" ON "parental_consents" USING btree ("token_hash");