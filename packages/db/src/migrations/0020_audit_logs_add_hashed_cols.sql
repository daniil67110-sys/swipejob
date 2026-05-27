ALTER TABLE "audit_logs" ADD COLUMN "ip_hashed" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "user_agent_hashed" text;