-- VANTORIS migration 020: harden the existing database-enforced staff separation trigger.
-- Migration 006 already installs staff_action_approval_separation; replace its function safely,
-- preserving the existing trigger and avoiding a duplicate trigger on the same table.
BEGIN;

CREATE OR REPLACE FUNCTION vantoris_ledger.reject_staff_self_approval()
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

  IF NOT FOUND OR proposer_reference IS NULL OR proposer_reference=NEW.staff_id THEN
    RAISE EXCEPTION 'STAFF_SEPARATION_OF_DUTIES_REQUIRED'
      USING ERRCODE='42501';
  END IF;

  RETURN NEW;
END
$$;

REVOKE ALL ON FUNCTION vantoris_ledger.reject_staff_self_approval() FROM PUBLIC;

COMMIT;
