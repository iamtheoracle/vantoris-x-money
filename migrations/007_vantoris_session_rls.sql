-- VANTORIS migration 007: server-owned sessions and member/staff row isolation.
BEGIN;

CREATE OR REPLACE FUNCTION vantoris_ledger.create_member_session(
 p_member_id uuid,p_token_hash bytea,p_csrf_hash bytea,p_expires_at timestamptz,p_mfa_verified_at timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE session_id uuid:=gen_random_uuid(); cred vantoris_ledger.member_credentials%ROWTYPE;
BEGIN
 IF octet_length(p_token_hash)<>32 OR octet_length(p_csrf_hash)<>32 OR p_expires_at<=clock_timestamp() OR p_expires_at>clock_timestamp()+interval '30 days' THEN RAISE EXCEPTION 'INVALID_MEMBER_SESSION_INPUT'; END IF;
 SELECT * INTO cred FROM vantoris_ledger.member_credentials WHERE member_id=p_member_id FOR UPDATE;
 IF NOT FOUND OR cred.email_verified_at IS NULL OR cred.password_reset_required THEN RAISE EXCEPTION 'MEMBER_CREDENTIALS_NOT_READY' USING ERRCODE='28000'; END IF;
 IF cred.mfa_required AND (p_mfa_verified_at IS NULL OR NOT EXISTS(SELECT 1 FROM vantoris_ledger.member_mfa_factors WHERE member_id=p_member_id AND verified_at IS NOT NULL AND disabled_at IS NULL)) THEN RAISE EXCEPTION 'MEMBER_MFA_REQUIRED' USING ERRCODE='28000'; END IF;
 IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.members WHERE id=p_member_id AND status='active') THEN RAISE EXCEPTION 'MEMBER_NOT_ACTIVE'; END IF;
 INSERT INTO vantoris_ledger.auth_sessions(id,principal_type,member_id,token_hash,csrf_hash,mfa_verified_at,expires_at)
 VALUES(session_id,'member',p_member_id,p_token_hash,p_csrf_hash,p_mfa_verified_at,p_expires_at);
 RETURN session_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.create_staff_session(
 p_staff_id uuid,p_token_hash bytea,p_csrf_hash bytea,p_expires_at timestamptz,p_mfa_verified_at timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE session_id uuid:=gen_random_uuid();
BEGIN
 IF octet_length(p_token_hash)<>32 OR octet_length(p_csrf_hash)<>32 OR p_expires_at<=clock_timestamp() OR p_expires_at>clock_timestamp()+interval '12 hours' OR p_mfa_verified_at IS NULL THEN RAISE EXCEPTION 'INVALID_STAFF_SESSION_INPUT'; END IF;
 IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.staff_users WHERE id=p_staff_id AND status='active' AND mfa_required=true) THEN RAISE EXCEPTION 'STAFF_NOT_ACTIVE_OR_MFA_REQUIRED' USING ERRCODE='28000'; END IF;
 IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.staff_mfa_factors WHERE staff_id=p_staff_id AND verified_at IS NOT NULL AND disabled_at IS NULL) THEN RAISE EXCEPTION 'STAFF_MFA_NOT_ENROLLED' USING ERRCODE='28000'; END IF;
 INSERT INTO vantoris_ledger.auth_sessions(id,principal_type,staff_id,token_hash,csrf_hash,mfa_verified_at,expires_at)
 VALUES(session_id,'staff',p_staff_id,p_token_hash,p_csrf_hash,p_mfa_verified_at,p_expires_at);
 RETURN session_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.revoke_auth_session(p_token_hash bytea)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE affected integer;
BEGIN
 UPDATE vantoris_ledger.auth_sessions SET revoked_at=clock_timestamp()
  WHERE token_hash=p_token_hash AND revoked_at IS NULL;
 GET DIAGNOSTICS affected=ROW_COUNT;
 RETURN affected=1;
END $$;

-- Member queries must call resolve_member_session(token_hash) and perform
-- all subsequent reads in that same transaction. Staff reads require a
-- separate MFA-verified resolve_staff_session(token_hash) call.
ALTER TABLE vantoris_ledger.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE vantoris_ledger.ledger_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vantoris_ledger.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vantoris_ledger.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE vantoris_ledger.payment_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vantoris_ledger.outgoing_funds_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE vantoris_ledger.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE vantoris_ledger.staff_action_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vantoris_ledger.staff_action_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vantoris_ledger.member_identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vantoris_ledger.member_identity_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY members_self_or_staff_read ON vantoris_ledger.members FOR SELECT TO vantoris_backend
 USING (id=NULLIF(current_setting('vantoris.member_id',true),'')::uuid OR NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL);
CREATE POLICY accounts_self_or_staff_read ON vantoris_ledger.ledger_accounts FOR SELECT TO vantoris_backend
 USING (member_id=NULLIF(current_setting('vantoris.member_id',true),'')::uuid OR NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL);
CREATE POLICY entries_self_or_staff_read ON vantoris_ledger.journal_entries FOR SELECT TO vantoris_backend
 USING (EXISTS(SELECT 1 FROM vantoris_ledger.ledger_accounts a WHERE a.id=ledger_account_id AND
   (a.member_id=NULLIF(current_setting('vantoris.member_id',true),'')::uuid OR NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL)));
CREATE POLICY journals_self_or_staff_read ON vantoris_ledger.journals FOR SELECT TO vantoris_backend
 USING (EXISTS(SELECT 1 FROM vantoris_ledger.journal_entries e JOIN vantoris_ledger.ledger_accounts a ON a.id=e.ledger_account_id
   WHERE e.journal_id=journals.id AND (a.member_id=NULLIF(current_setting('vantoris.member_id',true),'')::uuid OR NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL)));
CREATE POLICY operations_self_or_staff_read ON vantoris_ledger.payment_operations FOR SELECT TO vantoris_backend
 USING (member_id=NULLIF(current_setting('vantoris.member_id',true),'')::uuid OR NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL);
CREATE POLICY holds_self_or_staff_read ON vantoris_ledger.outgoing_funds_holds FOR SELECT TO vantoris_backend
 USING (EXISTS(SELECT 1 FROM vantoris_ledger.ledger_accounts a WHERE a.id=ledger_account_id AND
   (a.member_id=NULLIF(current_setting('vantoris.member_id',true),'')::uuid OR NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL)));
CREATE POLICY audit_staff_read ON vantoris_ledger.audit_events FOR SELECT TO vantoris_backend
 USING (NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL);
CREATE POLICY staff_proposals_staff_read ON vantoris_ledger.staff_action_proposals FOR SELECT TO vantoris_backend
 USING (NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL);
CREATE POLICY staff_approvals_staff_read ON vantoris_ledger.staff_action_approvals FOR SELECT TO vantoris_backend
 USING (NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL);
CREATE POLICY identity_documents_member_or_staff_read ON vantoris_ledger.member_identity_documents FOR SELECT TO vantoris_backend
 USING (member_id=NULLIF(current_setting('vantoris.member_id',true),'')::uuid OR NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL);
CREATE POLICY identity_documents_member_or_staff_insert ON vantoris_ledger.member_identity_documents FOR INSERT TO vantoris_backend
 WITH CHECK (member_id=NULLIF(current_setting('vantoris.member_id',true),'')::uuid OR NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL);
CREATE POLICY identity_reviews_member_or_staff_read ON vantoris_ledger.member_identity_reviews FOR SELECT TO vantoris_backend
 USING (member_id=NULLIF(current_setting('vantoris.member_id',true),'')::uuid OR NULLIF(current_setting('vantoris.staff_id',true),'') IS NOT NULL);

GRANT SELECT ON vantoris_ledger.member_credentials,vantoris_ledger.staff_users,
 vantoris_ledger.member_mfa_factors,vantoris_ledger.staff_mfa_factors,
 vantoris_ledger.member_recovery_codes,vantoris_ledger.staff_recovery_codes,
 vantoris_ledger.member_legacy_identities,vantoris_ledger.member_identity_documents,
 vantoris_ledger.member_identity_reviews TO vantoris_backend;
GRANT INSERT ON vantoris_ledger.member_identity_documents TO vantoris_backend;
GRANT USAGE ON SCHEMA vantoris_ledger TO vantoris_backend;
REVOKE ALL ON FUNCTION vantoris_ledger.create_member_session(uuid,bytea,bytea,timestamptz,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.create_staff_session(uuid,bytea,bytea,timestamptz,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.revoke_auth_session(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.resolve_member_session(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.resolve_staff_session(bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.create_member_session(uuid,bytea,bytea,timestamptz,timestamptz) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.create_staff_session(uuid,bytea,bytea,timestamptz,timestamptz) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.revoke_auth_session(bytea) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.resolve_member_session(bytea) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.resolve_staff_session(bytea) TO vantoris_backend;
COMMIT;
