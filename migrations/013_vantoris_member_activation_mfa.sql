-- VANTORIS migration 013: Vantoris-issued member activation, password recovery and MFA enrollment.
BEGIN;
INSERT INTO vantoris_ledger.staff_role_capabilities(role_code,capability_code) VALUES
 ('super_administrator','members.credentials.reset'),('membership_officer','members.credentials.reset');

CREATE TABLE vantoris_ledger.member_activation_tokens (
 id uuid PRIMARY KEY,member_id uuid NOT NULL REFERENCES vantoris_ledger.members(id),
 token_hash bytea NOT NULL UNIQUE CHECK(octet_length(token_hash)=32),
 issued_by_staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
 expires_at timestamptz NOT NULL,consumed_at timestamptz,revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE vantoris_ledger.member_password_reset_tokens (
 id uuid PRIMARY KEY,member_id uuid NOT NULL REFERENCES vantoris_ledger.members(id),
 token_hash bytea NOT NULL UNIQUE CHECK(octet_length(token_hash)=32),
 issued_by_staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
 expires_at timestamptz NOT NULL,consumed_at timestamptz,revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE vantoris_ledger.member_mfa_enrollment_challenges (
 token_hash bytea PRIMARY KEY CHECK(octet_length(token_hash)=32),
 member_id uuid NOT NULL REFERENCES vantoris_ledger.members(id),
 factor_id uuid NOT NULL REFERENCES vantoris_ledger.member_mfa_factors(id),
 expires_at timestamptz NOT NULL,consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE OR REPLACE FUNCTION vantoris_ledger.issue_member_activation_token(
 p_staff_session_hash bytea,p_member_id uuid,p_token_hash bytea,p_expires_at timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE staff_id uuid; token_id uuid:=gen_random_uuid();
BEGIN
 staff_id:=vantoris_ledger.resolve_staff_session(p_staff_session_hash);
 IF NOT vantoris_ledger.staff_has_capability(staff_id,'members.activate') THEN RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501'; END IF;
 IF octet_length(p_token_hash)<>32 OR p_expires_at<=clock_timestamp() OR p_expires_at>clock_timestamp()+interval '7 days' THEN RAISE EXCEPTION 'INVALID_ACTIVATION_TOKEN'; END IF;
 IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.members m JOIN vantoris_ledger.member_credentials c ON c.member_id=m.id
   WHERE m.id=p_member_id AND m.status='active' AND (c.email_verified_at IS NULL OR c.password_reset_required=true)) THEN
  RAISE EXCEPTION 'MEMBER_NOT_ELIGIBLE_FOR_ACTIVATION';
 END IF;
 UPDATE vantoris_ledger.member_activation_tokens SET revoked_at=clock_timestamp() WHERE member_id=p_member_id AND consumed_at IS NULL AND revoked_at IS NULL;
 INSERT INTO vantoris_ledger.member_activation_tokens(id,member_id,token_hash,issued_by_staff_id,expires_at)
 VALUES(token_id,p_member_id,p_token_hash,staff_id,p_expires_at);
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||staff_id::text,'member_activation_token_issued','member',p_member_id::text,jsonb_build_object('token_id',token_id,'expires_at',p_expires_at));
 RETURN token_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.consume_member_activation(p_token_hash bytea,p_password_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE token_row vantoris_ledger.member_activation_tokens%ROWTYPE;
BEGIN
 IF p_password_hash !~ '^scrypt\$16384\$8\$1\$[A-Za-z0-9+/]+={0,2}\$[A-Za-z0-9+/]+={0,2}$' THEN RAISE EXCEPTION 'INVALID_PASSWORD_HASH'; END IF;
 SELECT * INTO token_row FROM vantoris_ledger.member_activation_tokens WHERE token_hash=p_token_hash AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at>clock_timestamp() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'ACTIVATION_TOKEN_INVALID_OR_EXPIRED' USING ERRCODE='28000'; END IF;
 UPDATE vantoris_ledger.member_credentials SET password_hash=p_password_hash,email_verified_at=clock_timestamp(),password_reset_required=false,
  password_changed_at=clock_timestamp(),updated_at=clock_timestamp() WHERE member_id=token_row.member_id;
 IF NOT FOUND THEN RAISE EXCEPTION 'MEMBER_CREDENTIALS_NOT_PROVISIONED'; END IF;
 UPDATE vantoris_ledger.member_activation_tokens SET consumed_at=clock_timestamp() WHERE id=token_row.id;
 UPDATE vantoris_ledger.auth_sessions SET revoked_at=clock_timestamp() WHERE member_id=token_row.member_id AND revoked_at IS NULL;
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('member:'||token_row.member_id::text,'member_account_activated','member',token_row.member_id::text,jsonb_build_object('activation_token_id',token_row.id));
 RETURN token_row.member_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.issue_member_password_reset_token(
 p_staff_session_hash bytea,p_member_id uuid,p_token_hash bytea,p_expires_at timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE staff_id uuid; token_id uuid:=gen_random_uuid();
BEGIN
 staff_id:=vantoris_ledger.resolve_staff_session(p_staff_session_hash);
 IF NOT vantoris_ledger.staff_has_capability(staff_id,'members.credentials.reset') THEN RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501'; END IF;
 IF octet_length(p_token_hash)<>32 OR p_expires_at<=clock_timestamp() OR p_expires_at>clock_timestamp()+interval '24 hours' THEN RAISE EXCEPTION 'INVALID_PASSWORD_RESET_TOKEN'; END IF;
 IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.members m JOIN vantoris_ledger.member_credentials c ON c.member_id=m.id
   WHERE m.id=p_member_id AND m.status='active' AND c.email_verified_at IS NOT NULL) THEN RAISE EXCEPTION 'MEMBER_NOT_ELIGIBLE_FOR_PASSWORD_RESET'; END IF;
 UPDATE vantoris_ledger.member_password_reset_tokens SET revoked_at=clock_timestamp() WHERE member_id=p_member_id AND consumed_at IS NULL AND revoked_at IS NULL;
 INSERT INTO vantoris_ledger.member_password_reset_tokens(id,member_id,token_hash,issued_by_staff_id,expires_at)
 VALUES(token_id,p_member_id,p_token_hash,staff_id,p_expires_at);
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||staff_id::text,'member_password_reset_token_issued','member',p_member_id::text,jsonb_build_object('token_id',token_id,'expires_at',p_expires_at));
 RETURN token_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.consume_member_password_reset(p_token_hash bytea,p_password_hash text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE token_row vantoris_ledger.member_password_reset_tokens%ROWTYPE;
BEGIN
 IF p_password_hash !~ '^scrypt\$16384\$8\$1\$[A-Za-z0-9+/]+={0,2}\$[A-Za-z0-9+/]+={0,2}$' THEN RAISE EXCEPTION 'INVALID_PASSWORD_HASH'; END IF;
 SELECT * INTO token_row FROM vantoris_ledger.member_password_reset_tokens WHERE token_hash=p_token_hash AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at>clock_timestamp() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'PASSWORD_RESET_TOKEN_INVALID_OR_EXPIRED' USING ERRCODE='28000'; END IF;
 UPDATE vantoris_ledger.member_credentials SET password_hash=p_password_hash,password_reset_required=false,password_changed_at=clock_timestamp(),updated_at=clock_timestamp()
  WHERE member_id=token_row.member_id;
 UPDATE vantoris_ledger.member_password_reset_tokens SET consumed_at=clock_timestamp() WHERE id=token_row.id;
 UPDATE vantoris_ledger.auth_sessions SET revoked_at=clock_timestamp() WHERE member_id=token_row.member_id AND revoked_at IS NULL;
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('member:'||token_row.member_id::text,'member_password_reset_completed','member',token_row.member_id::text,jsonb_build_object('reset_token_id',token_row.id));
 RETURN token_row.member_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.begin_member_mfa_enrollment(
 p_member_id uuid,p_challenge_hash bytea,p_factor_id uuid,p_ciphertext bytea,p_nonce bytea,p_auth_tag bytea,p_key_version integer,p_expires_at timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
BEGIN
 IF octet_length(p_challenge_hash)<>32 OR octet_length(p_nonce)<>12 OR octet_length(p_auth_tag)<>16 OR p_key_version<=0 OR
    p_expires_at<=clock_timestamp() OR p_expires_at>clock_timestamp()+interval '10 minutes' THEN RAISE EXCEPTION 'INVALID_MFA_ENROLLMENT_CHALLENGE'; END IF;
 IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.members m JOIN vantoris_ledger.member_credentials c ON c.member_id=m.id
   WHERE m.id=p_member_id AND m.status='active' AND c.email_verified_at IS NOT NULL AND c.password_reset_required=false) THEN
  RAISE EXCEPTION 'MEMBER_NOT_READY_FOR_MFA';
 END IF;
 IF EXISTS(SELECT 1 FROM vantoris_ledger.member_mfa_factors WHERE member_id=p_member_id AND verified_at IS NOT NULL AND disabled_at IS NULL) THEN
  RAISE EXCEPTION 'MEMBER_MFA_ALREADY_ENROLLED';
 END IF;
 UPDATE vantoris_ledger.member_mfa_factors SET disabled_at=clock_timestamp()
  WHERE member_id=p_member_id AND verified_at IS NULL AND disabled_at IS NULL;
 INSERT INTO vantoris_ledger.member_mfa_factors(id,member_id,factor_type,secret_ciphertext,nonce,auth_tag,encryption_key_version)
 VALUES(p_factor_id,p_member_id,'totp',p_ciphertext,p_nonce,p_auth_tag,p_key_version);
 INSERT INTO vantoris_ledger.member_mfa_enrollment_challenges(token_hash,member_id,factor_id,expires_at)
 VALUES(p_challenge_hash,p_member_id,p_factor_id,p_expires_at);
 RETURN p_factor_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.get_member_mfa_enrollment_factor(p_challenge_hash bytea)
RETURNS TABLE(member_id uuid,factor_id uuid,secret_ciphertext bytea,nonce bytea,auth_tag bytea,encryption_key_version integer)
LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
 SELECT c.member_id,f.id,f.secret_ciphertext,f.nonce,f.auth_tag,f.encryption_key_version
  FROM vantoris_ledger.member_mfa_enrollment_challenges c
  JOIN vantoris_ledger.member_mfa_factors f ON f.id=c.factor_id AND f.member_id=c.member_id
 WHERE c.token_hash=p_challenge_hash AND c.consumed_at IS NULL AND c.expires_at>clock_timestamp() AND f.verified_at IS NULL AND f.disabled_at IS NULL;
$$;

CREATE OR REPLACE FUNCTION vantoris_ledger.complete_member_mfa_enrollment(
 p_challenge_hash bytea,p_session_token_hash bytea,p_csrf_hash bytea,p_session_expires_at timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE challenge vantoris_ledger.member_mfa_enrollment_challenges%ROWTYPE;
BEGIN
 SELECT * INTO challenge FROM vantoris_ledger.member_mfa_enrollment_challenges WHERE token_hash=p_challenge_hash AND consumed_at IS NULL AND expires_at>clock_timestamp() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'MFA_ENROLLMENT_CHALLENGE_INVALID_OR_EXPIRED' USING ERRCODE='28000'; END IF;
 UPDATE vantoris_ledger.member_mfa_factors SET verified_at=clock_timestamp() WHERE id=challenge.factor_id AND member_id=challenge.member_id AND verified_at IS NULL AND disabled_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'MFA_FACTOR_NOT_PENDING'; END IF;
 UPDATE vantoris_ledger.member_mfa_enrollment_challenges SET consumed_at=clock_timestamp() WHERE token_hash=p_challenge_hash;
 PERFORM vantoris_ledger.create_member_session(challenge.member_id,p_session_token_hash,p_csrf_hash,p_session_expires_at,clock_timestamp());
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('member:'||challenge.member_id::text,'member_mfa_enrolled','member',challenge.member_id::text,jsonb_build_object('factor_id',challenge.factor_id));
 RETURN challenge.member_id;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA vantoris_ledger FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.issue_member_activation_token(bytea,uuid,bytea,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.consume_member_activation(bytea,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.issue_member_password_reset_token(bytea,uuid,bytea,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.consume_member_password_reset(bytea,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.begin_member_mfa_enrollment(uuid,bytea,uuid,bytea,bytea,bytea,integer,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.get_member_mfa_enrollment_factor(bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.complete_member_mfa_enrollment(bytea,bytea,bytea,timestamptz) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.issue_member_activation_token(bytea,uuid,bytea,timestamptz) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.consume_member_activation(bytea,text) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.issue_member_password_reset_token(bytea,uuid,bytea,timestamptz) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.consume_member_password_reset(bytea,text) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.begin_member_mfa_enrollment(uuid,bytea,uuid,bytea,bytea,bytea,integer,timestamptz) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.get_member_mfa_enrollment_factor(bytea) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.complete_member_mfa_enrollment(bytea,bytea,bytea,timestamptz) TO vantoris_backend;
COMMIT;
