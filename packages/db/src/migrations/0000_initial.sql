-- Extensions Postgres requises (architecture.md ligne 297 + Story 1.2.5 décision 2-3)
CREATE EXTENSION IF NOT EXISTS "citext";--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS "vector";--> statement-breakpoint

CREATE TYPE "public"."auth_source" AS ENUM('GOOGLE', 'EMAIL', 'APPLE', 'MAGIC_LINK', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."consent_status" AS ENUM('PENDING', 'GRANTED', 'PENDING_PARENTAL_CONSENT', 'REFUSED');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TYPE "public"."actor_type" AS ENUM('USER', 'SYSTEM', 'ADMIN');--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" "citext" NOT NULL,
	"email_verified_at" timestamp with time zone,
	"name" text,
	"image" text,
	"locale" text DEFAULT 'fr-FR' NOT NULL,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"source" "auth_source" DEFAULT 'UNKNOWN' NOT NULL,
	"birth_date" date,
	"consent_status" "consent_status" DEFAULT 'PENDING' NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" bigint,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verification_tokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp with time zone NOT NULL,
	CONSTRAINT "verification_tokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"phone" text,
	"city" text,
	"bio" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- APPEND-ONLY : aucune opération UPDATE/DELETE autorisée sur audit_logs (RGPD)
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"actor_type" "actor_type" NOT NULL,
	"event" text NOT NULL,
	"target_type" text,
	"target_id" text,
	"metadata" jsonb,
	"ip_address" "inet",
	"user_agent" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
-- APPEND-ONLY : aucune opération UPDATE/DELETE autorisée sur ia_audit_logs (IA Act)
CREATE TABLE "ia_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"model" text NOT NULL,
	"provider" text NOT NULL,
	"prompt_hash" text NOT NULL,
	"feature_type" text NOT NULL,
	"latency_ms" bigint NOT NULL,
	"tokens_input" integer,
	"tokens_output" integer,
	"success" boolean NOT NULL,
	"error_code" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ia_audit_logs" ADD CONSTRAINT "ia_audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_users_deleted_at" ON "users" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_accounts_provider_account_id" ON "accounts" USING btree ("provider","provider_account_id");--> statement-breakpoint
CREATE INDEX "idx_accounts_user_id" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_expires" ON "sessions" USING btree ("expires");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_profiles_user_id" ON "profiles" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_actor_id" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_event" ON "audit_logs" USING btree ("event");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_target_id" ON "audit_logs" USING btree ("target_id");--> statement-breakpoint
CREATE INDEX "idx_ia_audit_logs_user_id" ON "ia_audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ia_audit_logs_feature_type" ON "ia_audit_logs" USING btree ("feature_type");--> statement-breakpoint
CREATE INDEX "idx_ia_audit_logs_created_at" ON "ia_audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_ia_audit_logs_model" ON "ia_audit_logs" USING btree ("model");