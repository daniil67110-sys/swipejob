ALTER TABLE "users" ADD COLUMN "profile_embedding" vector(1024);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "embedding_computed_at" timestamp with time zone;--> statement-breakpoint
-- Story 2.8 : index ivfflat pour ANN cosine search sur offers.embedding.
-- lists=100 optimal pour <100k offres (à augmenter sqrt(N) si croissance).
CREATE INDEX IF NOT EXISTS "idx_offers_embedding_cosine" ON "offers" USING ivfflat ("embedding" vector_cosine_ops) WITH (lists = 100);