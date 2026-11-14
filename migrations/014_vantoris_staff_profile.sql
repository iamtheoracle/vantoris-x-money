-- VANTORIS migration 014: staff profile resolution through first-party MFA sessions.
BEGIN;
CREATE OR REPLACE FUNCTION vantoris_ledger.get_staff_profile(p_session_token_hash bytea)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE v_staff_id uuid; result jsonb;
BEGIN
 v_staff_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
 SELECT jsonb_build_object(
   'id',u.id,'staffReference',u.staff_reference,'email',u.email,'status',u.status,
   'roles',COALESCE(jsonb_agg(DISTINCT a.role_code) FILTER(WHERE a.role_code IS NOT NULL),'[]'::jsonb),
   'capabilities',COALESCE(jsonb_agg(DISTINCT c.capability_code) FILTER(WHERE c.capability_code IS NOT NULL),'[]'::jsonb)
 ) INTO result
 FROM vantoris_ledger.staff_users u
 LEFT JOIN vantoris_ledger.staff_role_assignments a ON a.staff_id=u.id AND a.revoked_at IS NULL
 LEFT JOIN vantoris_ledger.staff_role_capabilities c ON c.role_code=a.role_code
 WHERE u.id=v_staff_id GROUP BY u.id,u.staff_reference,u.email,u.status;
 IF result IS NULL THEN RAISE EXCEPTION 'STAFF_PROFILE_NOT_FOUND' USING ERRCODE='28000'; END IF;
 RETURN result;
END $$;
REVOKE ALL ON FUNCTION vantoris_ledger.get_staff_profile(bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.get_staff_profile(bytea) TO vantoris_backend;
CREATE OR REPLACE FUNCTION vantoris_ledger.execute_approved_staff_action(p_session_token_hash bytea,p_proposal_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $
DECLARE proposal vantoris_ledger.staff_action_proposals%ROWTYPE; result_id uuid; actor_id uuid;
BEGIN
 actor_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
 SELECT * INTO proposal FROM vantoris_ledger.staff_action_proposals WHERE id=p_proposal_id;
 IF NOT FOUND OR proposal.status<>'approved' THEN RAISE EXCEPTION 'STAFF_ACTION_NOT_APPROVED'; END IF;
 CASE proposal.action_type
  WHEN 'manual_journal' THEN result_id:=vantoris_ledger.post_approved_manual_journal(p_session_token_hash,p_proposal_id);
  WHEN 'reverse_journal' THEN result_id:=vantoris_ledger.post_approved_reversal(p_session_token_hash,p_proposal_id);
  WHEN 'change_limit' THEN result_id:=vantoris_ledger.post_approved_limit_change(p_session_token_hash,p_proposal_id);
  ELSE RAISE EXCEPTION 'STAFF_ACTION_TYPE_NOT_SUPPORTED';
 END CASE;
 RETURN jsonb_build_object('proposalId',p_proposal_id,'actionType',proposal.action_type,'resultId',result_id,'status','executed');
END $;
REVOKE ALL ON FUNCTION vantoris_ledger.execute_approved_staff_action(bytea,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.execute_approved_staff_action(bytea,uuid) TO vantoris_backend;
COMMIT;
