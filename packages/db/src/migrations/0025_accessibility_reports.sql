CREATE TYPE "public"."accessibility_report_status" AS ENUM('open', 'acknowledged', 'resolved', 'wontfix');--> statement-breakpoint
CREATE TABLE "accessibility_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"description" text NOT NULL,
	"contact_email" text,
	"status" "accessibility_report_status" DEFAULT 'open' NOT NULL,
	"admin_notes" text,
	"reporter_ip_hashed" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_accessibility_reports_status" ON "accessibility_reports" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_accessibility_reports_created_at" ON "accessibility_reports" USING btree ("created_at");