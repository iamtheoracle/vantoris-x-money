-- VANTORIS migration 012: dual-controlled member transfer limits.
BEGIN;
INSERT INTO vantoris_ledger.staff_role_capabilities(role_code,capability_code) VALUES
 ('super_administrator','limits.change.post'),('finance_controller','limits.change.post');

CREATE TABLE vantoris_ledger.member_transfer_limit_history (
 id uuid PRIMARY KEY,
 member_id uuid NOT NULL REFERENCES vantoris_ledger.members(id),
 single_limit_cents bigint NOT NULL CHECK(single_limit_cents>0),
 daily_limit_cents bigint NOT NULL CHECK(daily_limit_cents>=single_limit_cents),
 proposed_by_staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
 approved_by_staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
 posted_by_staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
 effective_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK(proposed_by_staff_id<>approved_by_staff_id),
 CHECK(proposed_by_staff_id<>posted_by_staff_id)
);
CREATE INDEX member_transfer_limits_current_idx ON vantoris_ledger.member_transfer_limit_history(member_id,effective_at DESC,id DESC);

CREATE OR REPLACE FUNCTION vantoris_ledger.post_approved_limit_change(p_session_token_hash bytea,p_proposal_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE poster_id uuid; proposer_id uuid; approver_id uuid; proposal vantoris_ledger.staff_action_proposals%ROWTYPE;
        target_member uuid; single_limit bigint; daily_limit bigint; history_id uuid:=gen_random_uuid();
BEGIN
 poster_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
 IF NOT vantoris_ledger.staff_has_capability(poster_id,'limits.change.post') THEN RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT * INTO proposal FROM vantoris_ledger.staff_action_proposals WHERE id=p_proposal_id FOR UPDATE;
 IF NOT FOUND OR proposal.action_type<>'change_limit' OR proposal.status<>'approved' THEN RAISE EXCEPTION 'LIMIT_CHANGE_NOT_APPROVED'; END IF;
 SELECT id INTO proposer_id FROM vantoris_ledger.staff_users WHERE staff_reference=proposal.proposed_by;
 SELECT u.id INTO approver_id FROM vantoris_ledger.staff_action_approvals a JOIN vantoris_ledger.staff_users u ON u.staff_reference=a.staff_id
  WHERE a.proposal_id=p_proposal_id AND a.decision='approve' LIMIT 1;
 IF proposer_id IS NULL OR approver_id IS NULL OR proposer_id=approver_id OR poster_id=proposer_id THEN
  RAISE EXCEPTION 'LIMIT_CHANGE_SEPARATION_OF_DUTIES_REQUIRED' USING ERRCODE='42501';
 END IF;
 BEGIN
  target_member:=(proposal.payload->>'member_id')::uuid;
  single_limit:=(proposal.payload->>'single_limit_cents')::bigint;
  daily_limit:=(proposal.payload->>'daily_limit_cents')::bigint;
 EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'LIMIT_CHANGE_PAYLOAD_INVALID'; END;
 IF single_limit<=0 OR daily_limit<single_limit THEN RAISE EXCEPTION 'LIMIT_CHANGE_VALUES_INVALID'; END IF;
 PERFORM 1 FROM vantoris_ledger.members WHERE id=target_member AND status='active' FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'LIMIT_MEMBER_NOT_ACTIVE'; END IF;
 INSERT INTO vantoris_ledger.member_transfer_limit_history(id,member_id,single_limit_cents,daily_limit_cents,proposed_by_staff_id,approved_by_staff_id,posted_by_staff_id)
 VALUES(history_id,target_member,single_limit,daily_limit,proposer_id,approver_id,poster_id);
 UPDATE vantoris_ledger.staff_action_proposals SET status='executed' WHERE id=p_proposal_id;
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||poster_id::text,'member_transfer_limits_changed','member',target_member::text,
  jsonb_build_object('proposal_id',p_proposal_id,'single_limit_cents',single_limit,'daily_limit_cents',daily_limit,
   'proposed_by_staff_id',proposer_id,'approved_by_staff_id',approver_id,'posted_by_staff_id',poster_id));
 RETURN history_id;
END $$;

-- Replace the initial claim function with a member-locked, daily-limit-aware version.
CREATE OR REPLACE FUNCTION vantoris_ledger.create_internal_transfer_operation(
 p_operation_id uuid,p_member_id uuid,p_source_account_ref text,p_receiver_account_ref text,
 p_amount_cents bigint,p_idempotency_key text,p_request_hash text)
RETURNS TABLE(operation_id uuid,operation_status text,duplicate boolean)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE prior vantoris_ledger.payment_operations%ROWTYPE; src vantoris_ledger.ledger_accounts%ROWTYPE;
        dst vantoris_ledger.ledger_accounts%ROWTYPE; member_limit vantoris_ledger.member_transfer_limit_history%ROWTYPE;
        daily_used numeric; day_start timestamptz;
BEGIN
 IF p_operation_id IS NULL OR p_member_id IS NULL OR p_idempotency_key IS NULL OR length(p_idempotency_key)=0 OR length(p_idempotency_key)>160 OR
    p_amount_cents IS NULL OR p_amount_cents<=0 OR p_request_hash IS NULL OR length(p_request_hash)<>64 OR p_request_hash ~ '[^0-9a-f]' THEN
  RAISE EXCEPTION 'INVALID_TRANSFER_IDEMPOTENCY_INPUT' USING ERRCODE='22023';
 END IF;
 PERFORM 1 FROM vantoris_ledger.members WHERE id=p_member_id AND status='active' FOR SHARE;
 IF NOT FOUND THEN RAISE EXCEPTION 'MEMBER_NOT_ACTIVE'; END IF;
 SELECT * INTO src FROM vantoris_ledger.ledger_accounts WHERE account_reference=p_source_account_ref AND member_id=p_member_id AND account_type='member_liability' AND currency='USD';
 IF NOT FOUND THEN RAISE EXCEPTION 'SOURCE_ACCOUNT_NOT_OWNED_BY_MEMBER' USING ERRCODE='42501'; END IF;
 SELECT * INTO dst FROM vantoris_ledger.ledger_accounts WHERE account_reference=p_receiver_account_ref AND account_type='member_liability' AND currency='USD';
 IF NOT FOUND THEN RAISE EXCEPTION 'RECEIVER_ACCOUNT_NOT_FOUND'; END IF;
 IF src.id=dst.id THEN RAISE EXCEPTION 'SAME_ACCOUNT_TRANSFER_NOT_ALLOWED'; END IF;
 IF dst.member_id=p_member_id THEN RAISE EXCEPTION 'RECIPIENT_MUST_BE_ANOTHER_MEMBER'; END IF;
 SELECT * INTO prior FROM vantoris_ledger.payment_operations WHERE member_id=p_member_id AND operation_type='internal_transfer' AND idempotency_key=p_idempotency_key FOR UPDATE;
 IF FOUND THEN
  IF prior.request_hash<>p_request_hash OR prior.source_account_id<>src.id OR prior.receiver_account_id<>dst.id OR prior.amount_cents<>p_amount_cents THEN
   RAISE EXCEPTION 'TRANSFER_IDEMPOTENCY_CONFLICT' USING ERRCODE='23505';
  END IF;
  RETURN QUERY SELECT prior.id,prior.status,true; RETURN;
 END IF;
 SELECT * INTO member_limit FROM vantoris_ledger.member_transfer_limit_history
  WHERE member_id=p_member_id ORDER BY effective_at DESC,id DESC LIMIT 1 FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'MEMBER_TRANSFER_LIMIT_NOT_CONFIGURED'; END IF;
 IF p_amount_cents>member_limit.single_limit_cents THEN RAISE EXCEPTION 'MEMBER_SINGLE_TRANSFER_LIMIT_EXCEEDED'; END IF;
 day_start:=date_trunc('day',clock_timestamp() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
 SELECT COALESCE(sum(amount_cents),0) INTO daily_used FROM vantoris_ledger.payment_operations
  WHERE member_id=p_member_id AND operation_type='internal_transfer' AND status='posted' AND created_at>=day_start;
 IF daily_used+p_amount_cents>member_limit.daily_limit_cents THEN RAISE EXCEPTION 'MEMBER_DAILY_TRANSFER_LIMIT_EXCEEDED'; END IF;
 INSERT INTO vantoris_ledger.payment_operations(id,member_id,source_account_id,receiver_account_id,amount_cents,operation_type,idempotency_key,request_hash,status)
 VALUES(p_operation_id,p_member_id,src.id,dst.id,p_amount_cents,'internal_transfer',p_idempotency_key,p_request_hash,'accepted');
 RETURN QUERY SELECT p_operation_id,'accepted'::text,false;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.reject_limit_history_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Member transfer limit history is append-only'; END $$;
CREATE TRIGGER member_transfer_limit_history_immutable BEFORE UPDATE OR DELETE ON vantoris_ledger.member_transfer_limit_history
 FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.reject_limit_history_mutation();
CREATE TRIGGER member_transfer_limit_history_no_truncate BEFORE TRUNCATE ON vantoris_ledger.member_transfer_limit_history
 FOR EACH STATEMENT EXECUTE FUNCTION vantoris_ledger.reject_limit_history_mutation();

REVOKE ALL ON FUNCTION vantoris_ledger.post_approved_limit_change(bytea,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.post_approved_limit_change(bytea,uuid) TO vantoris_backend;
REVOKE ALL ON ALL TABLES IN SCHEMA vantoris_ledger FROM PUBLIC;
CREATE OR REPLACE FUNCTION vantoris_ledger.get_member_transfer_limits(p_session_token_hash bytea)
RETURNS TABLE(single_limit_cents bigint,daily_limit_cents bigint,used_today_cents numeric,remaining_today_cents numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE v_member_id uuid; day_start timestamptz; current_limit vantoris_ledger.member_transfer_limit_history%ROWTYPE; used numeric;
BEGIN
 v_member_id:=vantoris_ledger.resolve_member_session(p_session_token_hash);
 SELECT * INTO current_limit FROM vantoris_ledger.member_transfer_limit_history
  WHERE member_transfer_limit_history.member_id=v_member_id
  ORDER BY effective_at DESC,id DESC LIMIT 1;
 IF NOT FOUND THEN RETURN; END IF;
 day_start:=date_trunc('day',clock_timestamp() AT TIME ZONE 'UTC') AT TIME ZONE 'UTC';
 SELECT COALESCE(sum(amount_cents),0) INTO used FROM vantoris_ledger.payment_operations
  WHERE payment_operations.member_id=v_member_id AND operation_type='internal_transfer'
    AND status='posted' AND created_at>=day_start;
 RETURN QUERY SELECT current_limit.single_limit_cents,current_limit.daily_limit_cents,used,
  GREATEST(current_limit.daily_limit_cents-used,0);
END $$;
REVOKE ALL ON FUNCTION vantoris_ledger.get_member_transfer_limits(bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.get_member_transfer_limits(bytea) TO vantoris_backend;
COMMIT;
