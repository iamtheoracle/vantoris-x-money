-- VANTORIS migration 003: atomic internal member-to-member transfer.
-- One caller transaction creates the hold, posts the balanced journal, captures
-- the hold, updates the operation and appends audit. No network or provider call.
BEGIN;

CREATE OR REPLACE FUNCTION vantoris_ledger.execute_internal_transfer(
  p_operation_id uuid,
  p_member_id uuid,
  p_source_account_ref text,
  p_receiver_account_ref text,
  p_amount_cents bigint,
  p_actor_id text,
  p_description text DEFAULT 'Internal member transfer'
)
RETURNS TABLE(journal_id uuid, hold_id uuid, duplicate boolean)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, vantoris_ledger
AS $$
DECLARE
  op vantoris_ledger.payment_operations%ROWTYPE;
  sender vantoris_ledger.ledger_accounts%ROWTYPE;
  receiver vantoris_ledger.ledger_accounts%ROWTYPE;
  sender_status text;
  receiver_status text;
  posted_balance numeric;
  active_holds numeric;
  new_hold_id uuid := gen_random_uuid();
  new_journal_id uuid := gen_random_uuid();
BEGIN
  IF p_amount_cents IS NULL OR p_amount_cents <= 0 OR
     p_actor_id IS NULL OR length(p_actor_id)=0 OR
     p_member_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_INTERNAL_TRANSFER_INPUT' USING ERRCODE='22023';
  END IF;

  SELECT * INTO op FROM vantoris_ledger.payment_operations
   WHERE id=p_operation_id AND operation_type='internal_transfer'
   FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'TRANSFER_OPERATION_NOT_FOUND'; END IF;
  IF op.status='posted' THEN
    SELECT j.id, h.id INTO journal_id, hold_id
      FROM vantoris_ledger.journals j
      JOIN vantoris_ledger.outgoing_funds_holds h ON h.operation_id=p_operation_id
     WHERE j.journal_type='internal_transfer' AND j.source_reference=p_operation_id::text;
    IF journal_id IS NULL OR hold_id IS NULL THEN
      RAISE EXCEPTION 'POSTED_TRANSFER_INTEGRITY_FAILURE';
    END IF;
    RETURN QUERY SELECT journal_id,hold_id,true;
    RETURN;
  END IF;
  IF op.status<>'accepted' THEN RAISE EXCEPTION 'TRANSFER_OPERATION_NOT_ACCEPTED'; END IF;

  SELECT * INTO sender FROM vantoris_ledger.ledger_accounts
   WHERE account_reference=p_source_account_ref AND member_id=p_member_id
     AND account_type='member_liability' AND currency='USD';
  IF NOT FOUND THEN RAISE EXCEPTION 'SOURCE_ACCOUNT_NOT_OWNED_BY_MEMBER' USING ERRCODE='42501'; END IF;
  SELECT * INTO receiver FROM vantoris_ledger.ledger_accounts
   WHERE account_reference=p_receiver_account_ref
     AND account_type='member_liability' AND currency='USD';
  IF NOT FOUND THEN RAISE EXCEPTION 'RECEIVER_ACCOUNT_NOT_FOUND'; END IF;
  IF sender.id=receiver.id THEN RAISE EXCEPTION 'SAME_ACCOUNT_TRANSFER_NOT_ALLOWED'; END IF;

  IF sender.id < receiver.id THEN
    PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=sender.id FOR UPDATE;
    PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=receiver.id FOR UPDATE;
  ELSE
    PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=receiver.id FOR UPDATE;
    PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=sender.id FOR UPDATE;
  END IF;

  SELECT m.status INTO sender_status FROM vantoris_ledger.members m WHERE m.id=sender.member_id;
  SELECT m.status INTO receiver_status FROM vantoris_ledger.members m WHERE m.id=receiver.member_id;
  IF sender_status IS DISTINCT FROM 'active' OR receiver_status IS DISTINCT FROM 'active' THEN
    RAISE EXCEPTION 'BOTH_MEMBER_ACCOUNTS_MUST_BE_ACTIVE';
  END IF;

  SELECT -COALESCE(sum(amount_cents),0) INTO posted_balance
    FROM vantoris_ledger.journal_entries WHERE ledger_account_id=sender.id;
  SELECT COALESCE(sum(amount_cents),0) INTO active_holds
    FROM vantoris_ledger.outgoing_funds_holds
   WHERE ledger_account_id=sender.id AND status='active';
  IF posted_balance-active_holds < p_amount_cents THEN
    RAISE EXCEPTION 'INSUFFICIENT_AVAILABLE_FUNDS' USING ERRCODE='P0001';
  END IF;

  INSERT INTO vantoris_ledger.outgoing_funds_holds
    (id,operation_id,ledger_account_id,amount_cents,status)
  VALUES (new_hold_id,p_operation_id,sender.id,p_amount_cents,'active');

  INSERT INTO vantoris_ledger.journals
    (id,journal_type,source_reference,idempotency_key,description,created_by)
  VALUES (new_journal_id,'internal_transfer',p_operation_id::text,
    'internal-transfer:'||p_operation_id::text,left(p_description,300),p_actor_id);
  INSERT INTO vantoris_ledger.journal_entries
    (id,journal_id,ledger_account_id,currency,amount_cents)
  VALUES
    (gen_random_uuid(),new_journal_id,sender.id,'USD',p_amount_cents),
    (gen_random_uuid(),new_journal_id,receiver.id,'USD',-p_amount_cents);

  UPDATE vantoris_ledger.outgoing_funds_holds
   SET status='captured',updated_at=clock_timestamp() WHERE id=new_hold_id;
  UPDATE vantoris_ledger.payment_operations
   SET status='posted',updated_at=clock_timestamp() WHERE id=p_operation_id;
  INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
  VALUES (p_actor_id,'internal_transfer_posted','journal',new_journal_id::text,
    jsonb_build_object('operation_id',p_operation_id,'hold_id',new_hold_id,
      'sender_account_id',sender.id,'receiver_account_id',receiver.id,
      'amount_cents',p_amount_cents));
  RETURN QUERY SELECT new_journal_id,new_hold_id,false;
END $$;

REVOKE ALL ON FUNCTION vantoris_ledger.execute_internal_transfer(uuid,uuid,text,text,bigint,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.execute_internal_transfer(uuid,uuid,text,text,bigint,text,text) TO vantoris_backend;

COMMIT;
