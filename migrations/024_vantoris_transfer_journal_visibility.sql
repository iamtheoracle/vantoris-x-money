-- VANTORIS migration 024: enforce complete journal visibility and defer transfer balance checks.
-- Forward-only fix discovered by committed multi-session transfer integration.
BEGIN;

CREATE OR REPLACE FUNCTION vantoris_ledger.assert_journal_balanced()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog,vantoris_ledger
SET row_security=off
AS $VANTORIS$
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
END;
$VANTORIS$;

CREATE OR REPLACE FUNCTION vantoris_ledger.assert_permanent_capital_unimpaired()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog,vantoris_ledger
SET row_security=off
AS $VANTORIS$
DECLARE
  capital_accounts bigint;
  floor_cents bigint;
  capital_balance numeric;
BEGIN
  SELECT count(*) INTO capital_accounts
    FROM vantoris_ledger.ledger_accounts
   WHERE account_type='institutional_capital';
  IF capital_accounts=0 THEN RETURN NULL; END IF;

  SELECT minimum_unimpaired_cents INTO floor_cents
    FROM vantoris_ledger.institutional_capital_policy_history
   ORDER BY effective_at DESC,id DESC
   LIMIT 1;
  IF floor_cents IS NULL THEN
    RAISE EXCEPTION 'PERMANENT_CAPITAL_POLICY_MISSING';
  END IF;

  SELECT -COALESCE(sum(e.amount_cents),0) INTO capital_balance
    FROM vantoris_ledger.journal_entries e
    JOIN vantoris_ledger.ledger_accounts a ON a.id=e.ledger_account_id
   WHERE a.account_type='institutional_capital';

  IF capital_balance<floor_cents THEN
    RAISE EXCEPTION 'PERMANENT_CAPITAL_IMPAIRMENT_BLOCKED: balance %, protected floor %',
      capital_balance,floor_cents
      USING ERRCODE='23514';
  END IF;
  RETURN NULL;
END;
$VANTORIS$;

CREATE OR REPLACE FUNCTION vantoris_ledger.guard_ledger_account_creation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog,vantoris_ledger
SET row_security=off
AS $VANTORIS$
DECLARE
  floor_cents bigint;
  capital_balance numeric;
BEGIN
  IF NEW.account_type='institutional_capital' THEN
    IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.institutional_capital_policy_history) THEN
      RAISE EXCEPTION 'PERMANENT_CAPITAL_FLOOR_MUST_BE_APPROVED_FIRST';
    END IF;
  ELSIF NEW.account_type='member_liability' THEN
    SELECT minimum_unimpaired_cents INTO floor_cents
      FROM vantoris_ledger.institutional_capital_policy_history
     ORDER BY effective_at DESC,id DESC
     LIMIT 1;
    IF floor_cents IS NULL THEN
      RAISE EXCEPTION 'PERMANENT_CAPITAL_NOT_ESTABLISHED';
    END IF;
    SELECT -COALESCE(sum(e.amount_cents),0) INTO capital_balance
      FROM vantoris_ledger.journal_entries e
      JOIN vantoris_ledger.ledger_accounts a ON a.id=e.ledger_account_id
     WHERE a.account_type='institutional_capital';
    IF capital_balance<floor_cents THEN
      RAISE EXCEPTION 'PERMANENT_CAPITAL_NOT_FUNDED_OR_IMPAIRED';
    END IF;
  END IF;
  RETURN NEW;
END;
$VANTORIS$;

CREATE OR REPLACE FUNCTION vantoris_ledger.execute_member_internal_transfer(
  p_operation_id uuid,
  p_session_token_hash bytea
)
RETURNS TABLE(journal_id uuid,hold_id uuid,duplicate boolean)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog,vantoris_ledger
AS $VANTORIS$
DECLARE
  member_id uuid;
BEGIN
  member_id:=vantoris_ledger.resolve_member_session(p_session_token_hash);
  SET CONSTRAINTS journal_balance_after_insert,entry_balance_after_insert,institutional_capital_floor_check DEFERRED;
  RETURN QUERY
    SELECT *
      FROM vantoris_ledger.execute_internal_transfer(p_operation_id,member_id);
END;
$VANTORIS$;

REVOKE ALL ON FUNCTION vantoris_ledger.assert_journal_balanced() FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.assert_permanent_capital_unimpaired() FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.guard_ledger_account_creation() FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.execute_member_internal_transfer(uuid,bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.execute_member_internal_transfer(uuid,bytea) TO vantoris_backend;

COMMIT;
