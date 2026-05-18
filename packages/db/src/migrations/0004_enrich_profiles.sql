ALTER TABLE "profiles" ADD COLUMN "headline" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "linkedin_url" text;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "experiences" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "educations" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "skills" jsonb;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "languages" jsonb;