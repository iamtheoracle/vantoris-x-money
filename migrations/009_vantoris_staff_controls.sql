-- VANTORIS migration 009: staff capabilities and independent dual-control approvals.
BEGIN;
CREATE TABLE vantoris_ledger.staff_roles (
 role_code text PRIMARY KEY,description text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE vantoris_ledger.staff_role_capabilities (
 role_code text NOT NULL REFERENCES vantoris_ledger.staff_roles(role_code),
 capability_code text NOT NULL,PRIMARY KEY(role_code,capability_code)
);
CREATE TABLE vantoris_ledger.staff_role_assignments (
 staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
 role_code text NOT NULL REFERENCES vantoris_ledger.staff_roles(role_code),
 assigned_by_staff_id uuid NOT NULL REFERENCES vantoris_ledger.staff_users(id),
 assigned_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 revoked_at timestamptz,
 PRIMARY KEY(staff_id,role_code,assigned_at),
 CHECK(staff_id<>assigned_by_staff_id)
);
CREATE INDEX staff_role_assignments_active_idx ON vantoris_ledger.staff_role_assignments(staff_id,role_code) WHERE revoked_at IS NULL;

INSERT INTO vantoris_ledger.staff_roles(role_code,description) VALUES
 ('super_administrator','Vantoris institutional system authority'),
 ('membership_officer','Member admission and credential activation'),
 ('identity_reviewer','Vantoris identity evidence review'),
 ('operations_officer','Operational review and proposal initiation'),
 ('finance_controller','Independent financial approval and posting'),
 ('auditor','Read-only institutional audit and ledger review'),
 ('support_officer','Member support with limited account visibility');

INSERT INTO vantoris_ledger.staff_role_capabilities(role_code,capability_code) VALUES
 ('super_administrator','members.activate'),('super_administrator','identity.review'),('super_administrator','members.view'),('super_administrator','audit.read'),
 ('super_administrator','ledger.read'),('super_administrator','ledger.reverse.propose'),('super_administrator','ledger.reverse.approve'),
 ('super_administrator','ledger.reverse.post'),('super_administrator','ledger.manual_journal.propose'),('super_administrator','ledger.manual_journal.approve'),
 ('super_administrator','ledger.manual_journal.post'),('super_administrator','limits.change.propose'),('super_administrator','limits.change.approve'),
 ('super_administrator','staff.manage'),
 ('membership_officer','members.activate'),('membership_officer','members.view'),
 ('identity_reviewer','identity.review'),('identity_reviewer','members.view'),
 ('operations_officer','members.view'),('operations_officer','ledger.read'),('operations_officer','ledger.reverse.propose'),
 ('operations_officer','ledger.manual_journal.propose'),('operations_officer','limits.change.propose'),('operations_officer','audit.read'),
 ('finance_controller','ledger.read'),('finance_controller','ledger.reverse.approve'),('finance_controller','ledger.reverse.post'),
 ('finance_controller','ledger.manual_journal.approve'),('finance_controller','ledger.manual_journal.post'),
 ('finance_controller','limits.change.approve'),('finance_controller','audit.read'),
 ('auditor','members.view'),('auditor','ledger.read'),('auditor','audit.read'),
 ('support_officer','members.view');

CREATE OR REPLACE FUNCTION vantoris_ledger.staff_has_capability(p_staff_id uuid,p_capability text)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
 SELECT EXISTS(SELECT 1 FROM vantoris_ledger.staff_role_assignments a
  JOIN vantoris_ledger.staff_role_capabilities c ON c.role_code=a.role_code
  JOIN vantoris_ledger.staff_users u ON u.id=a.staff_id
  WHERE a.staff_id=p_staff_id AND a.revoked_at IS NULL AND u.status='active' AND c.capability_code=p_capability);
$$;

CREATE OR REPLACE FUNCTION vantoris_ledger.create_staff_action_proposal(
 p_session_token_hash bytea,p_action_type text,p_object_reference text,p_payload jsonb)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE staff_id uuid; staff_ref text; required_capability text; proposal_id uuid:=gen_random_uuid();
BEGIN
 staff_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
 required_capability:=CASE p_action_type WHEN 'reverse_journal' THEN 'ledger.reverse.propose' WHEN 'change_limit' THEN 'limits.change.propose' WHEN 'manual_journal' THEN 'ledger.manual_journal.propose' ELSE NULL END;
 IF required_capability IS NULL OR NOT vantoris_ledger.staff_has_capability(staff_id,required_capability) THEN RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT staff_reference INTO staff_ref FROM vantoris_ledger.staff_users WHERE id=staff_id;
 INSERT INTO vantoris_ledger.staff_action_proposals(id,action_type,object_reference,proposed_by,payload,status)
 VALUES(proposal_id,p_action_type,p_object_reference,staff_ref,p_payload,'pending');
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||staff_id::text,'staff_action_proposed','staff_action_proposal',proposal_id::text,jsonb_build_object('action_type',p_action_type,'object_reference',p_object_reference));
 RETURN proposal_id;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.approve_staff_action_proposal(
 p_session_token_hash bytea,p_proposal_id uuid,p_decision text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE staff_id uuid; staff_ref text; proposal vantoris_ledger.staff_action_proposals%ROWTYPE; required_capability text;
BEGIN
 IF p_decision NOT IN ('approve','reject') THEN RAISE EXCEPTION 'INVALID_STAFF_APPROVAL_DECISION'; END IF;
 staff_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
 SELECT * INTO proposal FROM vantoris_ledger.staff_action_proposals WHERE id=p_proposal_id FOR UPDATE;
 IF NOT FOUND OR proposal.status<>'pending' THEN RAISE EXCEPTION 'STAFF_ACTION_NOT_PENDING'; END IF;
 required_capability:=CASE proposal.action_type WHEN 'reverse_journal' THEN 'ledger.reverse.approve' WHEN 'change_limit' THEN 'limits.change.approve' WHEN 'manual_journal' THEN 'ledger.manual_journal.approve' ELSE NULL END;
 IF required_capability IS NULL OR NOT vantoris_ledger.staff_has_capability(staff_id,required_capability) THEN RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT staff_reference INTO staff_ref FROM vantoris_ledger.staff_users WHERE id=staff_id;
 INSERT INTO vantoris_ledger.staff_action_approvals(proposal_id,staff_id,decision) VALUES(p_proposal_id,staff_ref,p_decision);
 UPDATE vantoris_ledger.staff_action_proposals SET status=CASE WHEN p_decision='approve' THEN 'approved' ELSE 'rejected' END WHERE id=p_proposal_id;
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||staff_id::text,'staff_action_'||p_decision,'staff_action_proposal',p_proposal_id::text,jsonb_build_object('action_type',proposal.action_type));
 RETURN CASE WHEN p_decision='approve' THEN 'approved' ELSE 'rejected' END;
END $$;

CREATE OR REPLACE FUNCTION vantoris_ledger.protect_staff_approval_rows()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Staff approvals are append-only'; END $$;
CREATE TRIGGER staff_action_approvals_immutable BEFORE UPDATE OR DELETE ON vantoris_ledger.staff_action_approvals
 FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.protect_staff_approval_rows();
CREATE TRIGGER staff_action_approvals_no_truncate BEFORE TRUNCATE ON vantoris_ledger.staff_action_approvals
 FOR EACH STATEMENT EXECUTE FUNCTION vantoris_ledger.protect_staff_approval_rows();

CREATE OR REPLACE FUNCTION vantoris_ledger.protect_staff_proposal_changes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
 IF NEW.action_type IS DISTINCT FROM OLD.action_type OR NEW.object_reference IS DISTINCT FROM OLD.object_reference OR
    NEW.proposed_by IS DISTINCT FROM OLD.proposed_by OR NEW.payload IS DISTINCT FROM OLD.payload THEN
   RAISE EXCEPTION 'Staff action proposal facts are immutable';
 END IF;
 IF NOT ((OLD.status='pending' AND NEW.status IN ('approved','rejected')) OR (OLD.status='approved' AND NEW.status='executed')) THEN
   RAISE EXCEPTION 'Invalid staff action proposal state transition';
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER staff_action_proposal_state_guard BEFORE UPDATE ON vantoris_ledger.staff_action_proposals
 FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.protect_staff_proposal_changes();
CREATE TRIGGER staff_action_proposals_no_delete BEFORE DELETE ON vantoris_ledger.staff_action_proposals
 FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.protect_staff_approval_rows();
CREATE TRIGGER staff_action_proposals_no_truncate BEFORE TRUNCATE ON vantoris_ledger.staff_action_proposals
 FOR EACH STATEMENT EXECUTE FUNCTION vantoris_ledger.protect_staff_approval_rows();

REVOKE ALL ON ALL TABLES IN SCHEMA vantoris_ledger FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.staff_has_capability(uuid,text) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.create_staff_action_proposal(bytea,text,text,jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION vantoris_ledger.approve_staff_action_proposal(bytea,uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.staff_has_capability(uuid,text) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.create_staff_action_proposal(bytea,text,text,jsonb) TO vantoris_backend;
GRANT EXECUTE ON FUNCTION vantoris_ledger.approve_staff_action_proposal(bytea,uuid,text) TO vantoris_backend;
COMMIT;
