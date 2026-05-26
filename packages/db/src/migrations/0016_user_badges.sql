-- Stories 5.1 + 5.2 — Engagement
--
-- 1. user_badges : table de déblocage de badges (append-only).
--    Une row par (userId, badgeCode). Le catalogue est versionné en code.

CREATE TABLE IF NOT EXISTS "user_badges" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "badge_code" text NOT NULL,
  "unlocked_at" timestamp with time zone NOT NULL DEFAULT now()
);
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "idx_user_badges_user_badge"
  ON "user_badges" ("user_id", "badge_code");
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "idx_user_badges_user_unlocked_at"
  ON "user_badges" ("user_id", "unlocked_at");
