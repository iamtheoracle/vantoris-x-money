-- VANTORIS migration 004: institutional audit is append-only.
BEGIN;
CREATE OR REPLACE FUNCTION vantoris_ledger.reject_audit_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Vantoris audit events are append-only';
END $$;
CREATE TRIGGER audit_events_immutable
BEFORE UPDATE OR DELETE ON vantoris_ledger.audit_events
FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.reject_audit_mutation();
REVOKE UPDATE, DELETE, TRUNCATE ON vantoris_ledger.audit_events FROM vantoris_backend;
GRANT SELECT, INSERT ON vantoris_ledger.audit_events TO vantoris_backend;
COMMIT;
