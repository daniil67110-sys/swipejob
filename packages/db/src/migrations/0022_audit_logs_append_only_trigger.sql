-- Story 6.5 — Enforce append-only sur audit_logs au niveau Postgres (CNIL/NFR-S7).
--
-- Trigger BEFORE UPDATE/DELETE qui RAISE EXCEPTION sauf opt-in explicite :
-- - UPDATE : interdit sauf si session a `set_config('audit_logs.allow_modify','true',true)`
--   (utilisé uniquement par le job RGPD pour anonymiser actor_id après purge).
-- - DELETE : interdit pour rows < 13 mois (rétention CNIL). Permis au-delà pour
--   permettre la rétention automatique post-archive R2.

CREATE OR REPLACE FUNCTION audit_logs_enforce_append_only()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF current_setting('audit_logs.allow_modify', true) = 'true' THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'audit_logs is append-only (Story 6.5). Use set_config(''audit_logs.allow_modify'',''true'',true) within the transaction for RGPD anonymization.';
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF current_setting('audit_logs.allow_modify', true) = 'true' THEN
      RETURN OLD;
    END IF;
    IF OLD.created_at < (now() - interval '13 months') THEN
      RETURN OLD;
    END IF;
    RAISE EXCEPTION 'audit_logs DELETE forbidden for rows < 13 months (CNIL retention).';
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
--> statement-breakpoint

DROP TRIGGER IF EXISTS audit_logs_append_only_update ON "audit_logs";
--> statement-breakpoint

CREATE TRIGGER audit_logs_append_only_update
  BEFORE UPDATE ON "audit_logs"
  FOR EACH ROW
  EXECUTE FUNCTION audit_logs_enforce_append_only();
--> statement-breakpoint

DROP TRIGGER IF EXISTS audit_logs_append_only_delete ON "audit_logs";
--> statement-breakpoint

CREATE TRIGGER audit_logs_append_only_delete
  BEFORE DELETE ON "audit_logs"
  FOR EACH ROW
  EXECUTE FUNCTION audit_logs_enforce_append_only();
