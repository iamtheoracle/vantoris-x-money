-- VANTORIS migration 020: enforce distinct staff proposer and approver identities in PostgreSQL.
-- Forward-only hardening: migration 009 did not enforce separation at the approval-row boundary.
BEGIN;

CREATE OR REPLACE FUNCTION vantoris_ledger.enforce_staff_action_approval_separation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog,vantoris_ledger
AS $$
DECLARE proposer_reference text;
BEGIN
  SELECT p.proposed_by
    INTO proposer_reference
    FROM vantoris_ledger.staff_action_proposals p
   WHERE p.id=NEW.proposal_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'STAFF_ACTION_PROPOSAL_NOT_FOUND' USING ERRCODE='P0002';
  END IF;

  IF proposer_reference IS NULL OR proposer_reference=NEW.staff_id THEN
    RAISE EXCEPTION 'STAFF_SEPARATION_OF_DUTIES_REQUIRED'
      USING ERRCODE='42501';
  END IF;

  RETURN NEW;
END
$$;

CREATE TRIGGER staff_action_approval_separation
BEFORE INSERT ON vantoris_ledger.staff_action_approvals
FOR EACH ROW
EXECUTE FUNCTION vantoris_ledger.enforce_staff_action_approval_separation();

REVOKE ALL ON FUNCTION vantoris_ledger.enforce_staff_action_approval_separation() FROM PUBLIC;

COMMIT;
