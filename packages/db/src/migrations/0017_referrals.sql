-- Story 5.3 — Parrainage
--
-- 1. referral_codes : code unique 6 chars par user (alphabet safe sans O/0/I/1/L/U).
-- 2. referrals : une row par filleul, signupAt + validatedAt (au 1er swipe).

CREATE TABLE IF NOT EXISTS "referral_codes" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code" text NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_referral_codes_user_id"
  ON "referral_codes" ("user_id");
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_referral_codes_code"
  ON "referral_codes" ("code");
--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "referrals" (
  "id" text PRIMARY KEY NOT NULL,
  "referrer_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "referee_user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "code" text NOT NULL,
  "signup_at" timestamp with time zone NOT NULL DEFAULT now(),
  "validated_at" timestamp with time zone
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_referrals_referee_user_id"
  ON "referrals" ("referee_user_id");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_referrals_referrer_user_id"
  ON "referrals" ("referrer_user_id");
