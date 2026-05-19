-- Epic 4 — Lifecycle & Coaching
--
-- 1. application_status : ajouter 'read', 'replied', 'interview_scheduled', 'signed', 'rejected'.
-- 2. applications : colonnes interview_at, signed_*, last_status_at + statusSource.
-- 3. preferences : colonnes notifications (push + email digest + marketing).
-- 4. interview_preps : table coach IA pré-entretien (Story 4.7).
-- 5. push_subscriptions : abonnements Web Push (Story 4.4).
-- 6. notification_events : journal d'envois (push + email digest) pour analytics + idempotence.

-- 1. Étendre application_status
ALTER TYPE "public"."application_status" ADD VALUE IF NOT EXISTS 'read';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE IF NOT EXISTS 'replied';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE IF NOT EXISTS 'interview_scheduled';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE IF NOT EXISTS 'signed';--> statement-breakpoint
ALTER TYPE "public"."application_status" ADD VALUE IF NOT EXISTS 'rejected';--> statement-breakpoint

-- 2. applications : colonnes lifecycle
ALTER TABLE "applications" ADD COLUMN "interview_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "signed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "signed_salary_annual_cents" integer;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "signed_company_snapshot" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "signed_job_title_snapshot" text;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "last_status_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "applications" ADD COLUMN "status_source" text;--> statement-breakpoint
CREATE INDEX "idx_applications_user_last_status_at" ON "applications" USING btree ("user_id","last_status_at");--> statement-breakpoint
CREATE INDEX "idx_applications_interview_at" ON "applications" USING btree ("interview_at") WHERE "interview_at" IS NOT NULL;--> statement-breakpoint

-- 3. preferences : colonnes notifications
ALTER TABLE "preferences" ADD COLUMN "push_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "push_time" text DEFAULT '08:00' NOT NULL;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "email_transactional_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "email_marketing_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "email_digest_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "email_digest_frequency" text DEFAULT 'weekly' NOT NULL;--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "email_unsubscribe_token" text;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_preferences_email_unsubscribe_token" ON "preferences" USING btree ("email_unsubscribe_token") WHERE "email_unsubscribe_token" IS NOT NULL;--> statement-breakpoint

-- 4. interview_preps (Story 4.7)
CREATE TABLE "interview_preps" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"company_summary" text NOT NULL,
	"probable_questions" text[] NOT NULL DEFAULT '{}',
	"matching_strengths" text[] NOT NULL DEFAULT '{}',
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"model" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "interview_preps" ADD CONSTRAINT "interview_preps_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_interview_preps_application" ON "interview_preps" USING btree ("application_id");--> statement-breakpoint

-- 5. push_subscriptions (Story 4.4)
CREATE TABLE "push_subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"user_agent" text,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_push_subscriptions_endpoint" ON "push_subscriptions" USING btree ("endpoint");--> statement-breakpoint
CREATE INDEX "idx_push_subscriptions_user" ON "push_subscriptions" USING btree ("user_id");--> statement-breakpoint

-- 6. notification_events
CREATE TABLE "notification_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"channel" text NOT NULL,
	"event_type" text NOT NULL,
	"reference_key" text,
	"metadata" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "notification_events" ADD CONSTRAINT "notification_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notification_events_user_at" ON "notification_events" USING btree ("user_id","at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_notification_events_reference" ON "notification_events" USING btree ("user_id","channel","event_type","reference_key") WHERE "reference_key" IS NOT NULL;
