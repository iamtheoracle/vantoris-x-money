-- VANTORIS migration 010: protect permanent institutional capital from impairment.
BEGIN;
CREATE TABLE vantoris_ledger.institutional_capital_policy_history (
 id uuid PRIMARY KEY,
 minimum_unimpaired_cents bigint NOT NULL CHECK(minimum_unimpaired_cents>0),
 proposed_by_staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
 approved_by_staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
 effective_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(proposed_by_staff_id<>approved_by_staff_id)
);
CREATE INDEX institutional_capital_policy_current_idx ON vantoris_ledger.institutional_capital_policy_history(effective_at DESC,id DESC);

INSERT INTO vantoris_ledger.staff_role_capabilities(role_code,capability_code) VALUES
 ('super_administrator','capital.floor.propose'),('super_administrator','capital.floor.approve'),
 ('operations_officer','capital.floor.propose'),('finance_controller','capital.floor.approve');

CREATE OR REPLACE FUNCTION vantoris_ledger.set_institutional_capital_floor(
 p_proposer_session_hash bytea,p_approver_session_hash bytea,p_floor_cents bigint)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE proposer_id uuid; approver_id uuid; prior_floor bigint; capital_balance numeric; policy_id uuid:=gen_random_uuid();
BEGIN
 IF p_floor_cents IS NULL OR p_floor_cents<=0 THEN RAISE EXCEPTION 'INVALID_PERMANENT_CAPITAL_FLOOR'; END IF;
 proposer_id:=vantoris_ledger.resolve_staff_session(p_proposer_session_hash);
 approver_id:=vantoris_ledger.resolve_staff_session(p_approver_session_hash);
 IF proposer_id=approver_id THEN RAISE EXCEPTION 'CAPITAL_FLOOR_REQUIRES_TWO_STAFF'; END IF;
 IF NOT vantoris_ledger.staff_has_capability(proposer_id,'capital.floor.propose') OR
    NOT vantoris_ledger.staff_has_capability(approver_id,'capital.floor.approve') THEN
   RAISE EXCEPTION 'CAPITAL_FLOOR_CAPABILITY_REQUIRED' USING ERRCODE='42501';
 END IF;
 SELECT minimum_unimpaired_cents INTO prior_floor FROM vantoris_ledger.institutional_capital_policy_history
  ORDER BY effective_at DESC,id DESC LIMIT 1;
 IF prior_floor IS NOT NULL AND p_floor_cents<prior_floor THEN RAISE EXCEPTION 'PERMANENT_CAPITAL_FLOOR_CANNOT_BE_REDUCED'; END IF;
 IF EXISTS(SELECT 1 FROM vantoris_ledger.ledger_accounts WHERE account_type='institutional_capital') THEN
  SELECT -COALESCE(sum(e.amount_cents),0) INTO capital_balance
   FROM vantoris_ledger.journal_entries e JOIN vantoris_ledger.ledger_accounts a ON a.id=e.ledger_account_id
   WHERE a.account_type='institutional_capital';
  IF p_floor_cents>capital_balance THEN RAISE EXCEPTION 'CAPITAL_FLOOR_EXCEEDS_VERIFIED_LEDGER_CAPITAL'; END IF;
 END IF;
 INSERT INTO vantoris_ledger.institutional_capital_policy_history(id,minimum_unimpaired_cents,proposed_by_staff_id,approved_by_staff_id)
 VALUES(policy_id,p_floor_cents,proposer_id,approver_id);
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||approver_id::text,'institutional_capital_floor_set','institutional_capital_policy',policy_id::text,
  jsonb_build_object('minimum_unimpaired_cents',p_floor_cents,'proposed_by_staff_id',proposer_id,'approved_by_staff_id',approver_id));
 RETURN policy_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.guard_ledger_account_creation()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE floor_cents bigint; capital_balance numeric;
BEGIN
 IF NEW.account_type='institutional_capital' THEN
  IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.institutional_capital_policy_history) THEN
   RAISE EXCEPTION 'PERMANENT_CAPITAL_FLOOR_MUST_BE_APPROVED_FIRST';
  END IF;
 ELSIF NEW.account_type='member_liability' THEN
  SELECT minimum_unimpaired_cents INTO floor_cents FROM vantoris_ledger.institutional_capital_policy_history ORDER BY effective_at DESC,id DESC LIMIT 1;
  IF floor_cents IS NULL THEN RAISE EXCEPTION 'PERMANENT_CAPITAL_NOT_ESTABLISHED'; END IF;
  SELECT -COALESCE(sum(e.amount_cents),0) INTO capital_balance
   FROM vantoris_ledger.journal_entries e JOIN vantoris_ledger.ledger_accounts a ON a.id=e.ledger_account_id
   WHERE a.account_type='institutional_capital';
  IF capital_balance<floor_cents THEN RAISE EXCEPTION 'PERMANENT_CAPITAL_NOT_FUNDED_OR_IMPAIRED'; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER ledger_account_creation_capital_guard BEFORE INSERT ON vantoris_ledger.ledger_accounts
 FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.guard_ledger_account_creation();

CREATE OR REPLACE FUNCTION vantoris_ledger.assert_permanent_capital_unimpaired()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE capital_accounts bigint; floor_cents bigint; capital_balance numeric;
BEGIN
 SELECT count(*) INTO capital_accounts FROM vantoris_ledger.ledger_accounts WHERE account_type='institutional_capital';
 IF capital_accounts=0 THEN RETURN NULL; END IF;
 SELECT minimum_unimpaired_cents INTO floor_cents FROM vantoris_ledger.institutional_capital_policy_history ORDER BY effective_at DESC,id DESC LIMIT 1;
 IF floor_cents IS NULL THEN RAISE EXCEPTION 'PERMANENT_CAPITAL_POLICY_MISSING'; END IF;
 SELECT -COALESCE(sum(e.amount_cents),0) INTO capital_balance
  FROM vantoris_ledger.journal_entries e JOIN vantoris_ledger.ledger_accounts a ON a.id=e.ledger_account_id
  WHERE a.account_type='institutional_capital';
 IF capital_balance<floor_cents THEN
  RAISE EXCEPTION 'PERMANENT_CAPITAL_IMPAIRMENT_BLOCKED: balance %, protected floor %',capital_balance,floor_cents USING ERRCODE='23514';
 END IF;
 RETURN NULL;
END $$;
CREATE CONSTRAINT TRIGGER institutional_capital_floor_check
AFTER INSERT ON vantoris_ledger.journal_entries DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.assert_permanent_capital_unimpaired();

CREATE TRIGGER ledger_accounts_immutable BEFORE UPDATE OR DELETE ON vantoris_ledger.ledger_accounts
FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.reject_ledger_mutation();

CREATE OR REPLACE FUNCTION vantoris_ledger.reject_capital_policy_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Permanent capital policy history is append-only'; END $$;
CREATE TRIGGER institutional_capital_policy_immutable BEFORE UPDATE OR DELETE ON vantoris_ledger.institutional_capital_policy_history
FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.reject_capital_policy_mutation();
CREATE TRIGGER institutional_capital_policy_no_truncate BEFORE TRUNCATE ON vantoris_ledger.institutional_capital_policy_history
FOR EACH STATEMENT EXECUTE FUNCTION vantoris_ledger.reject_capital_policy_mutation();

REVOKE ALL ON ALL TABLES IN SCHEMA vantoris_ledger FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.set_institutional_capital_floor(bytea,bytea,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.set_institutional_capital_floor(bytea,bytea,bigint) TO vantoris_backend;
COMMIT;
