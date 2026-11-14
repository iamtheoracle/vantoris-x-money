-- VANTORIS migration 003: atomic internal member-to-member transfer.
-- Operation claims bind the member, both accounts and amount. Hold, journal, capture and audit commit together.
BEGIN;
CREATE OR REPLACE FUNCTION vantoris_ledger.create_internal_transfer_operation(
 p_operation_id uuid,p_member_id uuid,p_source_account_ref text,p_receiver_account_ref text,
 p_amount_cents bigint,p_idempotency_key text,p_request_hash text)
RETURNS TABLE(operation_id uuid,operation_status text,duplicate boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE prior vantoris_ledger.payment_operations%ROWTYPE; src vantoris_ledger.ledger_accounts%ROWTYPE; dst vantoris_ledger.ledger_accounts%ROWTYPE;
BEGIN
 IF p_operation_id IS NULL OR p_member_id IS NULL OR p_idempotency_key IS NULL OR length(p_idempotency_key)=0 OR length(p_idempotency_key)>160 OR p_amount_cents IS NULL OR p_amount_cents<=0 OR p_request_hash IS NULL OR length(p_request_hash)<>64 OR p_request_hash ~ '[^0-9a-f]' THEN RAISE EXCEPTION 'INVALID_TRANSFER_IDEMPOTENCY_INPUT' USING ERRCODE='22023'; END IF;
 PERFORM 1 FROM vantoris_ledger.members WHERE id=p_member_id AND status='active' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'MEMBER_NOT_ACTIVE'; END IF;
 SELECT * INTO src FROM vantoris_ledger.ledger_accounts WHERE account_reference=p_source_account_ref AND member_id=p_member_id AND account_type='member_liability' AND currency='USD';
 IF NOT FOUND THEN RAISE EXCEPTION 'SOURCE_ACCOUNT_NOT_OWNED_BY_MEMBER' USING ERRCODE='42501'; END IF;
 SELECT * INTO dst FROM vantoris_ledger.ledger_accounts WHERE account_reference=p_receiver_account_ref AND account_type='member_liability' AND currency='USD';
 IF NOT FOUND THEN RAISE EXCEPTION 'RECEIVER_ACCOUNT_NOT_FOUND'; END IF;
 IF src.id=dst.id THEN RAISE EXCEPTION 'SAME_ACCOUNT_TRANSFER_NOT_ALLOWED'; END IF;
 INSERT INTO vantoris_ledger.payment_operations(id,member_id,source_account_id,receiver_account_id,amount_cents,operation_type,idempotency_key,request_hash,status)
 VALUES(p_operation_id,p_member_id,src.id,dst.id,p_amount_cents,'internal_transfer',p_idempotency_key,p_request_hash,'accepted')
 ON CONFLICT(member_id,operation_type,idempotency_key) DO NOTHING;
 SELECT * INTO prior FROM vantoris_ledger.payment_operations WHERE member_id=p_member_id AND operation_type='internal_transfer' AND idempotency_key=p_idempotency_key FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'TRANSFER_OPERATION_CLAIM_MISSING'; END IF;
 IF prior.request_hash<>p_request_hash OR prior.source_account_id<>src.id OR prior.receiver_account_id<>dst.id OR prior.amount_cents<>p_amount_cents THEN RAISE EXCEPTION 'TRANSFER_IDEMPOTENCY_CONFLICT' USING ERRCODE='23505'; END IF;
 RETURN QUERY SELECT prior.id,prior.status,(prior.id<>p_operation_id);
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.execute_internal_transfer(p_operation_id uuid,p_member_id uuid)
RETURNS TABLE(journal_id uuid,hold_id uuid,duplicate boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE op vantoris_ledger.payment_operations%ROWTYPE; src vantoris_ledger.ledger_accounts%ROWTYPE; dst vantoris_ledger.ledger_accounts%ROWTYPE; src_status text; dst_status text; posted numeric; holds numeric; h_id uuid:=gen_random_uuid(); j_id uuid:=gen_random_uuid(); actor text;
BEGIN
 IF p_operation_id IS NULL OR p_member_id IS NULL THEN RAISE EXCEPTION 'INVALID_INTERNAL_TRANSFER_INPUT' USING ERRCODE='22023'; END IF;
 SELECT * INTO op FROM vantoris_ledger.payment_operations WHERE id=p_operation_id AND operation_type='internal_transfer' FOR UPDATE;
 IF NOT FOUND OR op.member_id<>p_member_id THEN RAISE EXCEPTION 'TRANSFER_OPERATION_NOT_OWNED_BY_MEMBER' USING ERRCODE='42501'; END IF;
 IF op.status='posted' THEN
  SELECT j.id,h.id INTO journal_id,hold_id FROM vantoris_ledger.journals j JOIN vantoris_ledger.outgoing_funds_holds h ON h.operation_id=p_operation_id WHERE j.journal_type='internal_transfer' AND j.source_reference=p_operation_id::text;
  IF journal_id IS NULL OR hold_id IS NULL THEN RAISE EXCEPTION 'POSTED_TRANSFER_INTEGRITY_FAILURE'; END IF;
  RETURN QUERY SELECT journal_id,hold_id,true; RETURN;
 END IF;
 IF op.status<>'accepted' THEN RAISE EXCEPTION 'TRANSFER_OPERATION_NOT_ACCEPTED'; END IF;
 SELECT * INTO src FROM vantoris_ledger.ledger_accounts WHERE id=op.source_account_id;
 SELECT * INTO dst FROM vantoris_ledger.ledger_accounts WHERE id=op.receiver_account_id;
 IF src.id IS NULL OR src.member_id<>p_member_id OR dst.id IS NULL OR dst.account_type<>'member_liability' THEN RAISE EXCEPTION 'TRANSFER_ACCOUNT_CONFIGURATION_INVALID'; END IF;
 PERFORM 1 FROM vantoris_ledger.members WHERE id IN(src.member_id,dst.member_id) ORDER BY id FOR SHARE;
 IF src.id<dst.id THEN
  PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=src.id FOR UPDATE;
  PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=dst.id FOR UPDATE;
 ELSE
  PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=dst.id FOR UPDATE;
  PERFORM 1 FROM vantoris_ledger.ledger_accounts WHERE id=src.id FOR UPDATE;
 END IF;
 SELECT status INTO src_status FROM vantoris_ledger.members WHERE id=src.member_id;
 SELECT status INTO dst_status FROM vantoris_ledger.members WHERE id=dst.member_id;
 IF src_status IS DISTINCT FROM 'active' OR dst_status IS DISTINCT FROM 'active' THEN RAISE EXCEPTION 'BOTH_MEMBER_ACCOUNTS_MUST_BE_ACTIVE'; END IF;
 SELECT -COALESCE(sum(amount_cents),0) INTO posted FROM vantoris_ledger.journal_entries WHERE ledger_account_id=src.id;
 SELECT COALESCE(sum(amount_cents),0) INTO holds FROM vantoris_ledger.outgoing_funds_holds WHERE ledger_account_id=src.id AND status='active';
 IF posted-holds<op.amount_cents THEN RAISE EXCEPTION 'INSUFFICIENT_AVAILABLE_FUNDS' USING ERRCODE='P0001'; END IF;
 actor:='member:'||p_member_id::text;
 INSERT INTO vantoris_ledger.outgoing_funds_holds(id,operation_id,ledger_account_id,amount_cents,status) VALUES(h_id,p_operation_id,src.id,op.amount_cents,'active');
 INSERT INTO vantoris_ledger.journals(id,journal_type,source_reference,idempotency_key,description,created_by) VALUES(j_id,'internal_transfer',p_operation_id::text,'internal-transfer:'||p_operation_id::text,'Internal member transfer',actor);
 INSERT INTO vantoris_ledger.journal_entries(id,journal_id,ledger_account_id,currency,amount_cents) VALUES(gen_random_uuid(),j_id,src.id,'USD',op.amount_cents),(gen_random_uuid(),j_id,dst.id,'USD',-op.amount_cents);
 UPDATE vantoris_ledger.outgoing_funds_holds SET status='captured',updated_at=clock_timestamp() WHERE id=h_id;
 UPDATE vantoris_ledger.payment_operations SET status='posted',updated_at=clock_timestamp() WHERE id=p_operation_id;
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details) VALUES(actor,'internal_transfer_posted','journal',j_id::text,jsonb_build_object('operation_id',p_operation_id,'hold_id',h_id,'sender_account_id',src.id,'receiver_account_id',dst.id,'amount_cents',op.amount_cents));
 RETURN QUERY SELECT j_id,h_id,false;
END $$;

REVOKE ALL ON FUNCTION vantoris_ledger.create_internal_transfer_operation(uuid,uuid,text,text,bigint,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.create_internal_transfer_operation(uuid,uuid,text,text,bigint,text,text) TO vantoris_backend;
REVOKE ALL ON FUNCTION vantoris_ledger.execute_internal_transfer(uuid,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.execute_internal_transfer(uuid,uuid) TO vantoris_backend;
COMMIT;
