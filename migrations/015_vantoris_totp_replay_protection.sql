-- VANTORIS migration 015: prevent TOTP replay for member and staff sessions.
BEGIN;
ALTER TABLE vantoris_ledger.member_mfa_factors ADD COLUMN last_used_step bigint CHECK(last_used_step IS NULL OR last_used_step>=0);
ALTER TABLE vantoris_ledger.staff_mfa_factors ADD COLUMN last_used_step bigint CHECK(last_used_step IS NULL OR last_used_step>=0);

CREATE OR REPLACE FUNCTION vantoris_ledger.consume_member_totp_step(p_factor_id uuid,p_step bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE changed integer;
BEGIN
 IF p_step IS NULL OR p_step<0 THEN RETURN false; END IF;
 UPDATE vantoris_ledger.member_mfa_factors SET last_used_step=p_step
  WHERE id=p_factor_id AND verified_at IS NOT NULL AND disabled_at IS NULL
    AND (last_used_step IS NULL OR last_used_step<p_step);
 GET DIAGNOSTICS changed=ROW_COUNT; RETURN changed=1;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.consume_staff_totp_step(p_factor_id uuid,p_step bigint)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE changed integer;
BEGIN
 IF p_step IS NULL OR p_step<0 THEN RETURN false; END IF;
 UPDATE vantoris_ledger.staff_mfa_factors SET last_used_step=p_step
  WHERE id=p_factor_id AND verified_at IS NOT NULL AND disabled_at IS NULL
    AND (last_used_step IS NULL OR last_used_step<p_step);
 GET DIAGNOSTICS changed=ROW_COUNT; RETURN changed=1;
END $$;

-- Replace the enrollment completion signature so the first accepted TOTP step is consumed atomically.
CREATE OR REPLACE FUNCTION vantoris_ledger.complete_member_mfa_enrollment(
 p_challenge_hash bytea,p_session_token_hash bytea,p_csrf_hash bytea,p_totp_step bigint,p_session_expires_at timestamptz)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE challenge vantoris_ledger.member_mfa_enrollment_challenges%ROWTYPE;
BEGIN
 IF p_totp_step IS NULL OR p_totp_step<0 THEN RAISE EXCEPTION 'INVALID_MFA_TOTP_STEP'; END IF;
 SELECT * INTO challenge FROM vantoris_ledger.member_mfa_enrollment_challenges WHERE token_hash=p_challenge_hash AND consumed_at IS NULL AND expires_at>clock_timestamp() FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'MFA_ENROLLMENT_CHALLENGE_INVALID_OR_EXPIRED' USING ERRCODE='28000'; END IF;
 UPDATE vantoris_ledger.member_mfa_factors SET verified_at=clock_timestamp(),last_used_step=p_totp_step
  WHERE id=challenge.factor_id AND member_id=challenge.member_id AND verified_at IS NULL AND disabled_at IS NULL;
 IF NOT FOUND THEN RAISE EXCEPTION 'MFA_FACTOR_NOT_PENDING'; END IF;
 UPDATE vantoris_ledger.member_mfa_enrollment_challenges SET consumed_at=clock_timestamp() WHERE token_hash=p_challenge_hash;
 PERFORM vantoris_ledger.create_member_session(challenge.member_id,p_session_token_hash,p_csrf_hash,p_session_expires_at,clock_timestamp());
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('member:'||challenge.member_id::text,'member_mfa_enrolled','member',challenge.member_id::text,jsonb_build_object('factor_id',challenge.factor_id,'totp_step',p_totp_step));
 RETURN challenge.member_id;
END $$;

REVOKE ALL ON FUNCTION vantoris_ledger.complete_member_mfa_enrollment(bytea,bytea,bytea,timestamptz) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION vantoris_ledger.complete_member_mfa_enrollment(bytea,bytea,bytea,timestamptz) FROM vantoris_backend;
REVOKE ALL ON FUNCTION vantoris_ledger.complete_member_mfa_enrollment(bytea,bytea,bytea,bigint,timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.consume_member_totp_step(uuid,bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.consume_staff_totp_step(uuid,bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.complete_member_mfa_enrollment(bytea,bytea,bytea,bigint,timestamptz) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.consume_member_totp_step(uuid,bigint) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.consume_staff_totp_step(uuid,bigint) TO vantoris_backend;
COMMIT;
