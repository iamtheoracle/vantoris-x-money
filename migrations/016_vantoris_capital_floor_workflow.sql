-- VANTORIS migration 016: capital-floor proposals use the same auditable two-person workflow.
BEGIN;
ALTER TABLE vantoris_ledger.staff_action_proposals DROP CONSTRAINT IF EXISTS staff_action_proposals_action_type_check;
ALTER TABLE vantoris_ledger.staff_action_proposals ADD CONSTRAINT staff_action_proposals_action_type_check
 CHECK(action_type IN ('reverse_journal','change_limit','manual_journal','capital_floor'));
INSERT INTO vantoris_ledger.staff_role_capabilities(role_code,capability_code) VALUES
 ('super_administrator','capital.floor.post'),('finance_controller','capital.floor.post');

CREATE OR REPLACE FUNCTION vantoris_ledger.create_staff_action_proposal(
 p_session_token_hash bytea,p_action_type text,p_object_reference text,p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE v_staff_id uuid; v_staff_ref text; required_capability text; proposal_id uuid:=gen_random_uuid();
BEGIN
 v_staff_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
 required_capability:=CASE p_action_type
  WHEN 'reverse_journal' THEN 'ledger.reverse.propose'
  WHEN 'change_limit' THEN 'limits.change.propose'
  WHEN 'manual_journal' THEN 'ledger.manual_journal.propose'
  WHEN 'capital_floor' THEN 'capital.floor.propose' ELSE NULL END;
 IF required_capability IS NULL OR NOT vantoris_ledger.staff_has_capability(v_staff_id,required_capability) THEN RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT staff_reference INTO v_staff_ref FROM vantoris_ledger.staff_users WHERE id=v_staff_id;
 INSERT INTO vantoris_ledger.staff_action_proposals(id,action_type,object_reference,proposed_by,payload,status)
 VALUES(proposal_id,p_action_type,p_object_reference,v_staff_ref,p_payload,'pending');
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||v_staff_id::text,'staff_action_proposed','staff_action_proposal',proposal_id::text,jsonb_build_object('action_type',p_action_type,'object_reference',p_object_reference));
 RETURN proposal_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.approve_staff_action_proposal(
 p_session_token_hash bytea,p_proposal_id uuid,p_decision text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE v_staff_id uuid; v_staff_ref text; proposal vantoris_ledger.staff_action_proposals%ROWTYPE; required_capability text;
BEGIN
 IF p_decision NOT IN ('approve','reject') THEN RAISE EXCEPTION 'INVALID_STAFF_APPROVAL_DECISION'; END IF;
 v_staff_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
 SELECT * INTO proposal FROM vantoris_ledger.staff_action_proposals WHERE id=p_proposal_id FOR UPDATE;
 IF NOT FOUND OR proposal.status<>'pending' THEN RAISE EXCEPTION 'STAFF_ACTION_NOT_PENDING'; END IF;
 required_capability:=CASE proposal.action_type
  WHEN 'reverse_journal' THEN 'ledger.reverse.approve'
  WHEN 'change_limit' THEN 'limits.change.approve'
  WHEN 'manual_journal' THEN 'ledger.manual_journal.approve'
  WHEN 'capital_floor' THEN 'capital.floor.approve' ELSE NULL END;
 IF required_capability IS NULL OR NOT vantoris_ledger.staff_has_capability(v_staff_id,required_capability) THEN RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT staff_reference INTO v_staff_ref FROM vantoris_ledger.staff_users WHERE id=v_staff_id;
 INSERT INTO vantoris_ledger.staff_action_approvals(proposal_id,staff_id,decision) VALUES(p_proposal_id,v_staff_ref,p_decision);
 UPDATE vantoris_ledger.staff_action_proposals SET status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'rejected' END WHERE id=p_proposal_id;
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||v_staff_id::text,'staff_action_'||p_decision,'staff_action_proposal',p_proposal_id::text,jsonb_build_object('action_type',proposal.action_type));
 RETURN CASE WHEN p_decision='approve' THEN 'approved' ELSE 'rejected' END;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.post_approved_capital_floor(p_session_token_hash bytea,p_proposal_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE poster_id uuid; proposer_id uuid; approver_id uuid; proposal vantoris_ledger.staff_action_proposals%ROWTYPE;
        floor_cents bigint; prior_floor bigint; capital_balance numeric; policy_id uuid:=gen_random_uuid();
BEGIN
 poster_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
 IF NOT vantoris_ledger.staff_has_capability(poster_id,'capital.floor.post') THEN RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT * INTO proposal FROM vantoris_ledger.staff_action_proposals WHERE id=p_proposal_id FOR UPDATE;
 IF NOT FOUND OR proposal.action_type<>'capital_floor' OR proposal.status<>'approved' THEN RAISE EXCEPTION 'CAPITAL_FLOOR_NOT_APPROVED'; END IF;
 SELECT id INTO proposer_id FROM vantoris_ledger.staff_users WHERE staff_reference=proposal.proposed_by;
 SELECT u.id INTO approver_id FROM vantoris_ledger.staff_action_approvals a JOIN vantoris_ledger.staff_users u ON u.staff_reference=a.staff_id
  WHERE a.proposal_id=p_proposal_id AND a.decision='approve' LIMIT 1;
 IF proposer_id IS NULL OR approver_id IS NULL OR proposer_id=approver_id OR poster_id=proposer_id THEN
  RAISE EXCEPTION 'CAPITAL_FLOOR_SEPARATION_OF_DUTIES_REQUIRED' USING ERRCODE='42501';
 END IF;
 BEGIN floor_cents:=(proposal.payload->>'minimum_unimpaired_cents')::bigint;
 EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'INVALID_PERMANENT_CAPITAL_FLOOR'; END;
 IF floor_cents IS NULL OR floor_cents<=0 THEN RAISE EXCEPTION 'INVALID_PERMANENT_CAPITAL_FLOOR'; END IF;
 SELECT minimum_unimpaired_cents INTO prior_floor FROM vantoris_ledger.institutional_capital_policy_history ORDER BY effective_at DESC,id DESC LIMIT 1;
 IF prior_floor IS NOT NULL AND floor_cents<prior_floor THEN RAISE EXCEPTION 'PERMANENT_CAPITAL_FLOOR_CANNOT_BE_REDUCED'; END IF;
 IF EXISTS(SELECT 1 FROM vantoris_ledger.ledger_accounts WHERE account_type='institutional_capital') THEN
  SELECT -COALESCE(sum(e.amount_cents),0) INTO capital_balance FROM vantoris_ledger.journal_entries e
   JOIN vantoris_ledger.ledger_accounts a ON a.id=e.ledger_account_id WHERE a.account_type='institutional_capital';
  IF floor_cents>capital_balance THEN RAISE EXCEPTION 'CAPITAL_FLOOR_EXCEEDS_VERIFIED_LEDGER_CAPITAL'; END IF;
 END IF;
 INSERT INTO vantoris_ledger.institutional_capital_policy_history(id,minimum_unimpaired_cents,proposed_by_staff_id,approved_by_staff_id)
 VALUES(policy_id,floor_cents,proposer_id,approver_id);
 UPDATE vantoris_ledger.staff_action_proposals SET status='executed' WHERE id=p_proposal_id;
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||poster_id::text,'institutional_capital_floor_set','institutional_capital_policy',policy_id::text,
  jsonb_build_object('minimum_unimpaired_cents',floor_cents,'proposal_id',p_proposal_id,'proposed_by_staff_id',proposer_id,'approved_by_staff_id',approver_id));
 RETURN policy_id;
END $$;

REVOKE EXECUTE ON FUNCTION vantoris_ledger.set_institutional_capital_floor(bytea,bytea,bigint) FROM vantoris_backend;
REVOKE ALL ON FUNCTION vantoris_ledger.post_approved_capital_floor(bytea,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.post_approved_capital_floor(bytea,uuid) TO vantoris_backend;
CREATE OR REPLACE FUNCTION vantoris_ledger.execute_approved_staff_action(p_session_token_hash bytea,p_proposal_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $
DECLARE proposal vantoris_ledger.staff_action_proposals%ROWTYPE; result_id uuid;
BEGIN
 PERFORM vantoris_ledger.resolve_staff_session(p_session_token_hash);
 SELECT * INTO proposal FROM vantoris_ledger.staff_action_proposals WHERE id=p_proposal_id;
 IF NOT FOUND OR proposal.status<>'approved' THEN RAISE EXCEPTION 'STAFF_ACTION_NOT_APPROVED'; END IF;
 CASE proposal.action_type
  WHEN 'manual_journal' THEN result_id:=vantoris_ledger.post_approved_manual_journal(p_session_token_hash,p_proposal_id);
  WHEN 'reverse_journal' THEN result_id:=vantoris_ledger.post_approved_reversal(p_session_token_hash,p_proposal_id);
  WHEN 'change_limit' THEN result_id:=vantoris_ledger.post_approved_limit_change(p_session_token_hash,p_proposal_id);
  WHEN 'capital_floor' THEN result_id:=vantoris_ledger.post_approved_capital_floor(p_session_token_hash,p_proposal_id);
  ELSE RAISE EXCEPTION 'STAFF_ACTION_TYPE_NOT_SUPPORTED';
 END CASE;
 RETURN jsonb_build_object('proposalId',p_proposal_id,'actionType',proposal.action_type,'resultId',result_id,'status','executed');
END $;
REVOKE ALL ON FUNCTION vantoris_ledger.execute_approved_staff_action(bytea,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.execute_approved_staff_action(bytea,uuid) TO vantoris_backend;
COMMIT;
