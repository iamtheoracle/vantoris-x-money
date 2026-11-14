-- VANTORIS migration 006: first-party member/staff identity and sessions.
-- Credentials, sessions, MFA secrets and identity documents remain under Vantoris control.
BEGIN;

CREATE TABLE vantoris_ledger.staff_users (
  id uuid PRIMARY KEY,
  staff_reference text NOT NULL UNIQUE,
  email text NOT NULL,
  password_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('invited','active','suspended','closed')),
  mfa_required boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE UNIQUE INDEX staff_users_email_lower_idx ON vantoris_ledger.staff_users(lower(email));

CREATE TABLE vantoris_ledger.member_credentials (
  member_id uuid PRIMARY KEY REFERENCES vantoris_ledger.members(id),
  email text NOT NULL,
  password_hash text NOT NULL,
  email_verified_at timestamptz,
  password_reset_required boolean NOT NULL DEFAULT true,
  mfa_required boolean NOT NULL DEFAULT true,
  failed_login_count integer NOT NULL DEFAULT 0 CHECK (failed_login_count >= 0),
  locked_until timestamptz,
  password_changed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE UNIQUE INDEX member_credentials_email_lower_idx ON vantoris_ledger.member_credentials(lower(email));

-- Stable crosswalk preserves historical source IDs without reusing vendor IDs as primary keys.
CREATE TABLE vantoris_ledger.member_legacy_identities (
  member_id uuid NOT NULL REFERENCES vantoris_ledger.members(id),
  source_system text NOT NULL,
  source_identity text NOT NULL,
  imported_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (source_system,source_identity),
  UNIQUE (member_id,source_system)
);

CREATE TABLE vantoris_ledger.auth_sessions (
  id uuid PRIMARY KEY,
  principal_type text NOT NULL CHECK (principal_type IN ('member','staff')),
  member_id uuid REFERENCES vantoris_ledger.members(id),
  staff_id uuid REFERENCES vantoris_ledger.staff_users(id),
  token_hash bytea NOT NULL UNIQUE CHECK (octet_length(token_hash)=32),
  csrf_hash bytea NOT NULL CHECK (octet_length(csrf_hash)=32),
  mfa_verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  last_seen_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  ip_fingerprint bytea,
  user_agent_fingerprint bytea,
  CHECK ((principal_type='member' AND member_id IS NOT NULL AND staff_id IS NULL) OR
         (principal_type='staff' AND staff_id IS NOT NULL AND member_id IS NULL))
);
CREATE INDEX auth_sessions_member_active_idx ON vantoris_ledger.auth_sessions(member_id,expires_at) WHERE revoked_at IS NULL;
CREATE INDEX auth_sessions_staff_active_idx ON vantoris_ledger.auth_sessions(staff_id,expires_at) WHERE revoked_at IS NULL;

CREATE TABLE vantoris_ledger.member_mfa_factors (
  id uuid PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES vantoris_ledger.members(id),
  factor_type text NOT NULL CHECK (factor_type IN ('totp')),
  secret_ciphertext bytea NOT NULL,
  nonce bytea NOT NULL CHECK (octet_length(nonce)=12),
  auth_tag bytea NOT NULL CHECK (octet_length(auth_tag)=16),
  encryption_key_version integer NOT NULL CHECK (encryption_key_version > 0),
  enrolled_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  verified_at timestamptz,
  disabled_at timestamptz
);
CREATE UNIQUE INDEX member_mfa_one_active_totp_idx ON vantoris_ledger.member_mfa_factors(member_id)
  WHERE factor_type='totp' AND disabled_at IS NULL;

CREATE TABLE vantoris_ledger.staff_mfa_factors (
  id uuid PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
  factor_type text NOT NULL CHECK (factor_type IN ('totp')),
  secret_ciphertext bytea NOT NULL,
  nonce bytea NOT NULL CHECK (octet_length(nonce)=12),
  auth_tag bytea NOT NULL CHECK (octet_length(auth_tag)=16),
  encryption_key_version integer NOT NULL CHECK (encryption_key_version > 0),
  enrolled_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  verified_at timestamptz,
  disabled_at timestamptz
);
CREATE UNIQUE INDEX staff_mfa_one_active_totp_idx ON vantoris_ledger.staff_mfa_factors(staff_id)
  WHERE factor_type='totp' AND disabled_at IS NULL;

CREATE TABLE vantoris_ledger.member_recovery_codes (
  id uuid PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES vantoris_ledger.members(id),
  code_hash bytea NOT NULL CHECK (octet_length(code_hash)=32),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  used_at timestamptz,
  UNIQUE (member_id,code_hash)
);
CREATE TABLE vantoris_ledger.staff_recovery_codes (
  id uuid PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
  code_hash bytea NOT NULL CHECK (octet_length(code_hash)=32),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  used_at timestamptz,
  UNIQUE (staff_id,code_hash)
);

-- Identity evidence is encrypted before it enters PostgreSQL. The encryption key
-- is held only by Vantoris server operations, never by the browser or a vendor.
CREATE TABLE vantoris_ledger.member_identity_documents (
  id uuid PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES vantoris_ledger.members(id),
  document_type text NOT NULL CHECK (document_type IN ('government_id','proof_of_address','selfie','business_document','other')),
  ciphertext bytea NOT NULL,
  nonce bytea NOT NULL CHECK (octet_length(nonce)=12),
  auth_tag bytea NOT NULL CHECK (octet_length(auth_tag)=16),
  encryption_key_version integer NOT NULL CHECK (encryption_key_version > 0),
  content_sha256 bytea NOT NULL CHECK (octet_length(content_sha256)=32),
  media_type text NOT NULL,
  uploaded_by_member_id uuid REFERENCES vantoris_ledger.members(id),
  review_status text NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending','approved','rejected','needs_information')),
  reviewed_by_staff_id uuid REFERENCES vantoris_ledger.staff_users(id),
  review_note text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  reviewed_at timestamptz,
  CHECK (uploaded_by_member_id IS NULL OR uploaded_by_member_id=member_id),
  CHECK (reviewed_by_staff_id IS NULL OR reviewed_at IS NOT NULL)
);
CREATE INDEX member_identity_documents_member_idx ON vantoris_ledger.member_identity_documents(member_id,created_at DESC);

CREATE TABLE vantoris_ledger.member_identity_reviews (
  id uuid PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES vantoris_ledger.members(id),
  document_id uuid REFERENCES vantoris_ledger.member_identity_documents(id),
  reviewer_staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
  decision text NOT NULL CHECK (decision IN ('approved','rejected','needs_information')),
  rationale text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

ALTER TABLE vantoris_ledger.staff_action_proposals
  ADD CONSTRAINT staff_action_proposals_proposer_fk
  FOREIGN KEY (proposed_by) REFERENCES vantoris_ledger.staff_users(staff_reference);
ALTER TABLE vantoris_ledger.staff_action_approvals
  ADD CONSTRAINT staff_action_approvals_staff_fk
  FOREIGN KEY (staff_id) REFERENCES vantoris_ledger.staff_users(staff_reference);

CREATE OR REPLACE FUNCTION vantoris_ledger.reject_staff_self_approval()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE proposer text;
BEGIN
  SELECT proposed_by INTO proposer FROM vantoris_ledger.staff_action_proposals WHERE id=NEW.proposal_id;
  IF proposer IS NULL OR proposer=NEW.staff_id THEN
    RAISE EXCEPTION 'STAFF_SEPARATION_OF_DUTIES_REQUIRED' USING ERRCODE='42501';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER staff_action_approval_separation
BEFORE INSERT ON vantoris_ledger.staff_action_approvals
FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.reject_staff_self_approval();

CREATE OR REPLACE FUNCTION vantoris_ledger.resolve_member_session(p_token_hash bytea)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, vantoris_ledger
AS $$
DECLARE resolved_member uuid;
BEGIN
  SELECT s.member_id INTO resolved_member
    FROM vantoris_ledger.auth_sessions s
    JOIN vantoris_ledger.members m ON m.id=s.member_id
    JOIN vantoris_ledger.member_credentials c ON c.member_id=m.id
   WHERE s.principal_type='member' AND s.token_hash=p_token_hash
     AND s.revoked_at IS NULL AND s.expires_at>clock_timestamp() AND m.status='active'
     AND c.email_verified_at IS NOT NULL AND c.password_reset_required=false
     AND (c.mfa_required=false OR s.mfa_verified_at IS NOT NULL)
   FOR UPDATE OF s;
  IF resolved_member IS NULL THEN RAISE EXCEPTION 'MEMBER_SESSION_INVALID' USING ERRCODE='28000'; END IF;
  UPDATE vantoris_ledger.auth_sessions SET last_seen_at=clock_timestamp() WHERE token_hash=p_token_hash;
  PERFORM set_config('vantoris.member_id',resolved_member::text,true);
  PERFORM set_config('vantoris.staff_id','',true);
  RETURN resolved_member;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.resolve_staff_session(p_token_hash bytea)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, vantoris_ledger
AS $$
DECLARE resolved_staff uuid;
BEGIN
  SELECT s.staff_id INTO resolved_staff
    FROM vantoris_ledger.auth_sessions s
    JOIN vantoris_ledger.staff_users u ON u.id=s.staff_id
   WHERE s.principal_type='staff' AND s.token_hash=p_token_hash
     AND s.revoked_at IS NULL AND s.expires_at>clock_timestamp()
     AND s.mfa_verified_at IS NOT NULL AND u.status='active' AND u.mfa_required=true
   FOR UPDATE OF s;
  IF resolved_staff IS NULL THEN RAISE EXCEPTION 'STAFF_SESSION_INVALID_OR_MFA_REQUIRED' USING ERRCODE='28000'; END IF;
  UPDATE vantoris_ledger.auth_sessions SET last_seen_at=clock_timestamp() WHERE token_hash=p_token_hash;
  PERFORM set_config('vantoris.staff_id',resolved_staff::text,true);
  PERFORM set_config('vantoris.member_id','',true);
  RETURN resolved_staff;
END $$;

REVOKE ALL ON ALL TABLES IN SCHEMA vantoris_ledger FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA vantoris_ledger FROM PUBLIC;
COMMIT;
