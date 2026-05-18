CREATE TYPE "public"."cv_parsing_status" AS ENUM('pending', 'completed', 'failed');--> statement-breakpoint
CREATE TABLE "cvs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"r2_key" text NOT NULL,
	"original_filename" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"mime_type" text NOT NULL,
	"parsing_status" "cv_parsing_status" DEFAULT 'pending' NOT NULL,
	"parsing_error" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cvs_r2_key_unique" UNIQUE("r2_key")
);
--> statement-breakpoint
ALTER TABLE "cvs" ADD CONSTRAINT "cvs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cvs_user_id" ON "cvs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_cvs_parsing_status" ON "cvs" USING btree ("parsing_status");