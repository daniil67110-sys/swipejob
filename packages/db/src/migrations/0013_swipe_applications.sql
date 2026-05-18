CREATE TYPE "public"."swipe_direction" AS ENUM('left', 'right', 'up');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('pending_letter', 'letter_generated', 'pending_review', 'sent', 'cancelled_by_user', 'failed');--> statement-breakpoint
CREATE TYPE "public"."cover_letter_status" AS ENUM('generated', 'template_fallback', 'edited');--> statement-breakpoint
CREATE TABLE "swipe_events" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"offer_id" text NOT NULL,
	"direction" "swipe_direction" NOT NULL,
	"swiped_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_events" (
	"id" text PRIMARY KEY NOT NULL,
	"application_id" text NOT NULL,
	"event" text NOT NULL,
	"metadata" text,
	"at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"offer_id" text NOT NULL,
	"status" "application_status" DEFAULT 'pending_letter' NOT NULL,
	"cover_letter_text" text,
	"cover_letter_status" "cover_letter_status",
	"sent_at" timestamp with time zone,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "watchlist" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"offer_id" text NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preferences" ADD COLUMN "review_before_send" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "swipe_events" ADD CONSTRAINT "swipe_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "swipe_events" ADD CONSTRAINT "swipe_events_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "watchlist" ADD CONSTRAINT "watchlist_offer_id_offers_id_fk" FOREIGN KEY ("offer_id") REFERENCES "public"."offers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "idx_swipe_events_user_offer" ON "swipe_events" USING btree ("user_id","offer_id");--> statement-breakpoint
CREATE INDEX "idx_swipe_events_user_swiped_at" ON "swipe_events" USING btree ("user_id","swiped_at");--> statement-breakpoint
CREATE INDEX "idx_application_events_app_at" ON "application_events" USING btree ("application_id","at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_applications_user_offer_active" ON "applications" USING btree ("user_id","offer_id") WHERE "applications"."status" != 'cancelled_by_user';--> statement-breakpoint
CREATE INDEX "idx_applications_status" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_applications_user_sent_at" ON "applications" USING btree ("user_id","sent_at");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_watchlist_user_offer" ON "watchlist" USING btree ("user_id","offer_id");