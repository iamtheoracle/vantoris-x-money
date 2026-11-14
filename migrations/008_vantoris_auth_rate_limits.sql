-- VANTORIS migration 008: database-backed login throttling and CSRF verification.
BEGIN;
CREATE TABLE vantoris_ledger.auth_login_attempts (
 email_fingerprint bytea NOT NULL CHECK(octet_length(email_fingerprint)=32),
 ip_fingerprint bytea NOT NULL CHECK(octet_length(ip_fingerprint)=32),
 attempts integer NOT NULL CHECK(attempts>=0),
 window_started_at timestamptz NOT NULL,
 locked_until timestamptz,
 updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 PRIMARY KEY(email_fingerprint,ip_fingerprint)
);

CREATE OR REPLACE FUNCTION vantoris_ledger.is_login_locked(p_email_fingerprint bytea,p_ip_fingerprint bytea)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
 SELECT EXISTS(SELECT 1 FROM vantoris_ledger.auth_login_attempts WHERE email_fingerprint=p_email_fingerprint AND ip_fingerprint=p_ip_fingerprint AND locked_until>clock_timestamp());
$$;

CREATE OR REPLACE FUNCTION vantoris_ledger.record_login_failure(p_email_fingerprint bytea,p_ip_fingerprint bytea)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE row_data vantoris_ledger.auth_login_attempts%ROWTYPE; now_at timestamptz:=clock_timestamp();
BEGIN
 IF octet_length(p_email_fingerprint)<>32 OR octet_length(p_ip_fingerprint)<>32 THEN RAISE EXCEPTION 'INVALID_LOGIN_FINGERPRINT'; END IF;
 SELECT * INTO row_data FROM vantoris_ledger.auth_login_attempts WHERE email_fingerprint=p_email_fingerprint AND ip_fingerprint=p_ip_fingerprint FOR UPDATE;
 IF NOT FOUND THEN
  INSERT INTO vantoris_ledger.auth_login_attempts(email_fingerprint,ip_fingerprint,attempts,window_started_at)
  VALUES(p_email_fingerprint,p_ip_fingerprint,1,now_at) RETURNING * INTO row_data;
 ELSE
  IF row_data.window_started_at<now_at-interval '15 minutes' THEN row_data.attempts:=1; row_data.window_started_at:=now_at; row_data.locked_until:=NULL;
  ELSE row_data.attempts:=row_data.attempts+1; END IF;
  IF row_data.attempts>=5 THEN row_data.locked_until:=now_at+interval '15 minutes'; END IF;
  UPDATE vantoris_ledger.auth_login_attempts SET attempts=row_data.attempts,window_started_at=row_data.window_started_at,locked_until=row_data.locked_until,updated_at=now_at
   WHERE email_fingerprint=p_email_fingerprint AND ip_fingerprint=p_ip_fingerprint;
 END IF;
 RETURN row_data.locked_until;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.clear_login_failures(p_email_fingerprint bytea,p_ip_fingerprint bytea)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
 DELETE FROM vantoris_ledger.auth_login_attempts WHERE email_fingerprint=p_email_fingerprint AND ip_fingerprint=p_ip_fingerprint;
$$;

CREATE OR REPLACE FUNCTION vantoris_ledger.verify_auth_csrf(p_token_hash bytea,p_csrf_hash bytea)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
 SELECT EXISTS(SELECT 1 FROM vantoris_ledger.auth_sessions WHERE token_hash=p_token_hash AND csrf_hash=p_csrf_hash AND revoked_at IS NULL AND expires_at>clock_timestamp());
$$;

REVOKE ALL ON ALL TABLES IN SCHEMA vantoris_ledger FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.is_login_locked(bytea,bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.record_login_failure(bytea,bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.clear_login_failures(bytea,bytea) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.verify_auth_csrf(bytea,bytea) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.is_login_locked(bytea,bytea) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.record_login_failure(bytea,bytea) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.clear_login_failures(bytea,bytea) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.verify_auth_csrf(bytea,bytea) TO vantoris_backend;
COMMIT;
