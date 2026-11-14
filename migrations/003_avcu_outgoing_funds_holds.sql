-- VANTORIS migration 003: internal member-to-member transfer lifecycle.
-- Reservation and posting use Vantoris's ledger only. No provider or network.
BEGIN;

CREATE OR REPLACE FUNCTION vantoris_ledger.reserve_outgoing_funds(
  p_operation_id uuid, p_member_id uuid, p_account_ref text,
  p_amount_cents bigint, p_actor_id text
)
RETURNS TABLE(hold_id uuid, available_after_cents bigint, duplicate boolean)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, vantoris_ledger
AS $$
DECLARE
  account_row vantoris_ledger.ledger_accounts%ROWTYPE;
  posted_balance numeric;
  active_holds numeric;
  existing vantoris_ledger.outgoing_funds_holds%ROWTYPE;
  new_id uuid := gen_random_uuid();
BEGIN
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 OR p_actor_id IS NULL OR length(p_actor_id)=0 THEN
    RAISE EXCEPTION 'INVALID_TRANSFER_INPUT' USING ERRCODE='22023';
  END IF;
  SELECT * INTO account_row FROM vantoris_ledger.ledger_accounts
   WHERE account_reference=p_account_ref AND member_id=p_member_id
     AND account_type='member_liability' AND currency='USD' FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'SOURCE_ACCOUNT_NOT_OWNED_BY_MEMBER' USING ERRCODE='42501'; END IF;

  SELECT * INTO existing FROM vantoris_ledger.outgoing_funds_holds
   WHERE operation_id=p_operation_id FOR UPDATE;
  IF FOUND THEN
    IF existing.ledger_account_id<>account_row.id OR existing.amount_cents<>p_amount_cents THEN
      RAISE EXCEPTION 'HOLD_IDEMPOTENCY_CONFLICT' USING ERRCODE='23505';
    END IF;
    IF existing.status<>'active' THEN RAISE EXCEPTION 'HOLD_ALREADY_FINALIZED'; END IF;
    SELECT -COALESCE(sum(amount_cents),0) INTO posted_balance
      FROM vantoris_ledger.journal_entries WHERE ledger_account_id=account_row.id;
    SELECT COALESCE(sum(amount_cents),0) INTO active_holds
      FROM vantoris_ledger.outgoing_funds_holds
     WHERE ledger_account_id=account_row.id AND status='active';
    RETURN QUERY SELECT existing.id,(posted_balance-active_holds)::bigint,true;
    RETURN;
  END IF;

  SELECT -COALESCE(sum(amount_cents),0) INTO posted_balance
    FROM vantoris_ledger.journal_entries WHERE ledger_account_id=account_row.id;
  SELECT COALESCE(sum(amount_cents),0) INTO active_holds
    FROM vantoris_ledger.outgoing_funds_holds
   WHERE ledger_account_id=account_row.id AND status='active';
  IF posted_balance-active_holds < p_amount_cents THEN
    RAISE EXCEPTION 'INSUFFICIENT_AVAILABLE_FUNDS' USING ERRCODE='P0001';
  END IF;

  INSERT INTO vantoris_ledger.outgoing_funds_holds
    (id,operation_id,ledger_account_id,amount_cents,status)
  VALUES (new_id,p_operation_id,account_row.id,p_amount_cents,'active');
  UPDATE vantoris_ledger.payment_operations SET status='held',updated_at=clock_timestamp()
   WHERE id=p_operation_id AND status IN ('accepted','held');
  IF NOT FOUND THEN RAISE EXCEPTION 'TRANSFER_OPERATION_NOT_OPEN'; END IF;
  INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
  VALUES (p_actor_id,'transfer_funds_held','payment_operation',p_operation_id::text,
    jsonb_build_object('hold_id',new_id,'source_account_id',account_row.id,
      'amount_cents',p_amount_cents,'available_after_cents',posted_balance-active_holds-p_amount_cents));
  RETURN QUERY SELECT new_id,(posted_balance-active_holds-p_amount_cents)::bigint,false;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.post_internal_transfer(
  p_operation_id uuid, p_receiver_account_ref text, p_actor_id text,
  p_description text DEFAULT 'Internal member transfer'
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, vantoris_ledger
AS $$
DECLARE
  hold_row vantoris_ledger.outgoing_funds_holds%ROWTYPE;
  sender vantoris_ledger.ledger_accounts%ROWTYPE;
  receiver vantoris_ledger.ledger_accounts%ROWTYPE;
  journal_id uuid := gen_random_uuid();
  first_id uuid;
  second_id uuid;
BEGIN
  SELECT * INTO hold_row FROM vantoris_ledger.outgoing_funds_holds
   WHERE operation_id=p_operation_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'ACTIVE_TRANSFER_HOLD_REQUIRED'; END IF;
  first_id := hold_row.ledger_account_id;
  SELECT * INTO receiver FROM vantoris_ledger.ledger_accounts
   WHERE account_reference=p_receiver_account_ref
     AND account_type='member_liability' AND currency='USD';
  IF NOT FOUND THEN RAISE EXCEPTION 'RECEIVER_ACCOUNT_NOT_FOUND'; END IF;
  IF receiver.id=first_id THEN RAISE EXCEPTION 'SAME_ACCOUNT_TRANSFER_NOT_ALLOWED'; END IF;

  -- Deterministic lock order prevents opposing transfers deadlocking.
  IF first_id < receiver.id THEN
    PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=first_id FOR UPDATE;
    PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=receiver.id FOR UPDATE;
  ELSE
    PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=receiver.id FOR UPDATE;
    PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=first_id FOR UPDATE;
  END IF;
  SELECT * INTO hold_row FROM vantoris_ledger.outgoing_funds_holds
   WHERE operation_id=p_operation_id FOR UPDATE;
  IF hold_row.status='captured' THEN
    SELECT id INTO journal_id FROM vantoris_ledger.journals
     WHERE journal_type='internal_transfer' AND source_reference=p_operation_id::text;
    RETURN journal_id;
  END IF;
  IF hold_row.status<>'active' THEN RAISE EXCEPTION 'ACTIVE_TRANSFER_HOLD_REQUIRED'; END IF;

  INSERT INTO vantoris_ledger.journals
    (id,journal_type,source_reference,idempotency_key,description,created_by)
  VALUES (journal_id,'internal_transfer',p_operation_id::text,
    'internal-transfer:'||p_operation_id::text,left(p_description,300),p_actor_id);
  INSERT INTO vantoris_ledger.journal_entries
    (id,journal_id,ledger_account_id,currency,amount_cents)
  VALUES
    (gen_random_uuid(),journal_id,hold_row.ledger_account_id,'USD',hold_row.amount_cents),
    (gen_random_uuid(),journal_id,receiver.id,'USD',-hold_row.amount_cents);

  UPDATE vantoris_ledger.outgoing_funds_holds
   SET status='captured',updated_at=clock_timestamp() WHERE id=hold_row.id;
  UPDATE vantoris_ledger.payment_operations
   SET status='posted',updated_at=clock_timestamp() WHERE id=p_operation_id AND status='held';
  IF NOT FOUND THEN RAISE EXCEPTION 'TRANSFER_OPERATION_NOT_HELD'; END IF;
  INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
  VALUES (p_actor_id,'internal_transfer_posted','journal',journal_id::text,
    jsonb_build_object('operation_id',p_operation_id,'sender_account_id',hold_row.ledger_account_id,
      'receiver_account_id',receiver.id,'amount_cents',hold_row.amount_cents));
  RETURN journal_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.release_outgoing_funds(
  p_operation_id uuid, p_actor_id text, p_reason text
)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, vantoris_ledger
AS $$
DECLARE hold_row vantoris_ledger.outgoing_funds_holds%ROWTYPE;
BEGIN
  SELECT * INTO hold_row FROM vantoris_ledger.outgoing_funds_holds
   WHERE operation_id=p_operation_id;
  IF NOT FOUND THEN RETURN false; END IF;
  PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=hold_row.ledger_account_id FOR UPDATE;
  SELECT * INTO hold_row FROM vantoris_ledger.outgoing_funds_holds
   WHERE operation_id=p_operation_id FOR UPDATE;
  IF hold_row.status='released' THEN RETURN true; END IF;
  IF hold_row.status<>'active' THEN RAISE EXCEPTION 'HOLD_ALREADY_CAPTURED'; END IF;
  UPDATE vantoris_ledger.outgoing_funds_holds
   SET status='released',release_reason=left(p_reason,300),updated_at=clock_timestamp()
   WHERE id=hold_row.id;
  UPDATE vantoris_ledger.payment_operations SET status='released',updated_at=clock_timestamp()
   WHERE id=p_operation_id AND status='held';
  INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
  VALUES (p_actor_id,'transfer_funds_released','outgoing_funds_hold',hold_row.id::text,
    jsonb_build_object('operation_id',p_operation_id,'reason',left(p_reason,300)));
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION vantoris_ledger.reserve_outgoing_funds(uuid,uuid,text,bigint,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.post_internal_transfer(uuid,text,text,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.release_outgoing_funds(uuid,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.reserve_outgoing_funds(uuid,uuid,text,bigint,text) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.post_internal_transfer(uuid,text,text,text) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.release_outgoing_funds(uuid,text,text) TO vantoris_backend;
COMMIT;
