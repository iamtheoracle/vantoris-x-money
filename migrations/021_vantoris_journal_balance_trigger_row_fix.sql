-- VANTORIS migration 021: correct deferred journal-balance trigger row handling.
-- Migration 001 installed this trigger for both journals and journal_entries.
-- A PL/pgSQL CASE expression may resolve a record field that does not exist on
-- the active trigger table. Use a branch so each row type accesses only its own field.
BEGIN;

CREATE OR REPLACE FUNCTION vantoris_ledger.assert_journal_balanced()
RETURNS trigger
LANGUAGE plpgsql
SET search_path=pg_catalog,vantoris_ledger
AS $$
DECLARE
  target_id uuid;
  line_count bigint;
  net_cents numeric;
BEGIN
  IF TG_TABLE_NAME='journals' THEN
    target_id:=NEW.id;
  ELSIF TG_TABLE_NAME='journal_entries' THEN
    target_id:=NEW.journal_id;
  ELSE
    RAISE EXCEPTION 'UNSUPPORTED_JOURNAL_BALANCE_TRIGGER_TABLE: %',TG_TABLE_NAME;
  END IF;

  SELECT count(*),COALESCE(sum(amount_cents),0)
    INTO line_count,net_cents
    FROM vantoris_ledger.journal_entries
   WHERE journal_id=target_id;

  IF line_count<2 OR net_cents<>0 THEN
    RAISE EXCEPTION 'Journal % must contain at least two balanced entries (count %, net %)',
      target_id,line_count,net_cents
      USING ERRCODE='23514';
  END IF;

  RETURN NULL;
END
$$;

REVOKE ALL ON FUNCTION vantoris_ledger.assert_journal_balanced() FROM PUBLIC;

COMMIT;
