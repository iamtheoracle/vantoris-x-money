-- Run after migrations 001–019 against a disposable PostgreSQL database as migration owner.
-- All fixtures are synthetic. The complete test transaction is rolled back.
BEGIN;
DO $$
DECLARE
 m1 uuid:=gen_random_uuid(); m2 uuid:=gen_random_uuid(); m3 uuid:=gen_random_uuid();
 ops_staff uuid:=gen_random_uuid(); finance_staff uuid:=gen_random_uuid(); support_staff uuid:=gen_random_uuid(); identity_staff uuid:=gen_random_uuid();
 ops_factor_id uuid:=gen_random_uuid(); finance_factor_id uuid:=gen_random_uuid(); support_factor_id uuid:=gen_random_uuid(); identity_factor_id uuid:=gen_random_uuid(); m1_factor_id uuid:=gen_random_uuid(); m2_factor_id uuid:=gen_random_uuid();
 capital_id uuid:=gen_random_uuid(); clearing_id uuid:=gen_random_uuid(); suspense_id uuid:=gen_random_uuid(); a1 uuid:=gen_random_uuid(); a2 uuid:=gen_random_uuid();
 capital_journal uuid:=gen_random_uuid(); opening_journal uuid:=gen_random_uuid(); impairment_journal uuid:=gen_random_uuid(); op_id uuid:=gen_random_uuid();
 activation_hash bytea:=decode(repeat('1',64),'hex'); reset_hash bytea:=decode(repeat('2',64),'hex'); mfa_challenge_hash bytea:=decode(repeat('3',64),'hex');
 mfa_session_hash bytea:=decode(repeat('4',64),'hex'); mfa_csrf_hash bytea:=decode(repeat('5',64),'hex'); mfa_factor_id uuid:=gen_random_uuid();
 mfa_totp_step bigint:=floor(extract(epoch from clock_timestamp())/30)::bigint; staff_totp_step bigint:=floor(extract(epoch from clock_timestamp())/30)::bigint; manual_proposal uuid; manual_journal uuid; reversal_proposal uuid; reversal_journal uuid; limit_proposal uuid; limit_history uuid;
 capital_proposal uuid; capital_opening_proposal uuid; opening_proposal uuid; identity_document_id uuid; identity_review_id uuid;
 result record; sender_balance numeric; receiver_balance numeric; captured_status text; journal_count integer;
BEGIN
 INSERT INTO vantoris_ledger.members(id,member_reference,status) VALUES
  (m1,'TEST-MEMBER-ONE','active'),(m2,'TEST-MEMBER-TWO','active'),(m3,'TEST-MEMBER-THREE','active');
 INSERT INTO vantoris_ledger.member_credentials(member_id,email,password_hash,email_verified_at,password_reset_required,mfa_required)
 VALUES(m1,'member-one@example.test','scrypt-test-hash',clock_timestamp(),false,true),
       (m2,'member-two@example.test','scrypt-test-hash',clock_timestamp(),false,true),
       (m3,'member-three@example.test','scrypt-placeholder',NULL,true,true);
 INSERT INTO vantoris_ledger.staff_users(id,staff_reference,email,password_hash,status,mfa_required) VALUES
  (ops_staff,'TEST-STAFF-OPS','ops@example.test','scrypt-test-hash','active',true),
  (finance_staff,'TEST-STAFF-FINANCE','finance@example.test','scrypt-test-hash','active',true),
  (support_staff,'TEST-STAFF-SUPPORT','support@example.test','scrypt-test-hash','active',true),
  (identity_staff,'TEST-STAFF-IDENTITY','identity@example.test','scrypt-test-hash','active',true);
 INSERT INTO vantoris_ledger.staff_mfa_factors(id,staff_id,factor_type,secret_ciphertext,nonce,auth_tag,encryption_key_version,verified_at) VALUES
  (ops_factor_id,ops_staff,'totp',decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp()),
  (finance_factor_id,finance_staff,'totp',decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp()),
  (support_factor_id,support_staff,'totp',decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp()),
  (identity_factor_id,identity_staff,'totp',decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp());
 INSERT INTO vantoris_ledger.member_mfa_factors(id,member_id,factor_type,secret_ciphertext,nonce,auth_tag,encryption_key_version,verified_at) VALUES
  (m1_factor_id,m1,'totp',decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp()),
  (m2_factor_id,m2,'totp',decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp());
 INSERT INTO vantoris_ledger.staff_role_assignments(staff_id,role_code,assigned_by_staff_id) VALUES
  (ops_staff,'operations_officer',finance_staff),
  (finance_staff,'finance_controller',ops_staff),
  (support_staff,'support_officer',ops_staff),
  (support_staff,'membership_officer',ops_staff),
  (identity_staff,'identity_reviewer',ops_staff);
 PERFORM vantoris_ledger.create_member_session(m1,decode(repeat('c',64),'hex'),decode(repeat('d',64),'hex'),clock_timestamp()+interval '1 hour',clock_timestamp());
 PERFORM vantoris_ledger.create_member_session(m2,decode(repeat('e',64),'hex'),decode(repeat('f',64),'hex'),clock_timestamp()+interval '1 hour',clock_timestamp());
 PERFORM vantoris_ledger.create_staff_session(ops_staff,decode(repeat('a',64),'hex'),decode(repeat('b',64),'hex'),clock_timestamp()+interval '1 hour',clock_timestamp());
 PERFORM vantoris_ledger.create_staff_session(finance_staff,decode(repeat('g',64),'hex'),decode(repeat('h',64),'hex'),clock_timestamp()+interval '1 hour',clock_timestamp());
 PERFORM vantoris_ledger.create_staff_session(support_staff,decode(repeat('i',64),'hex'),decode(repeat('j',64),'hex'),clock_timestamp()+interval '1 hour',clock_timestamp());
 PERFORM vantoris_ledger.create_staff_session(identity_staff,decode(repeat('k',64),'hex'),decode(repeat('l',64),'hex'),clock_timestamp()+interval '1 hour',clock_timestamp());

 -- Member activation, password reset and MFA enrollment are controlled by Vantoris staff.
 PERFORM vantoris_ledger.issue_member_activation_token(decode(repeat('i',64),'hex'),m3,activation_hash,clock_timestamp()+interval '1 hour');
 PERFORM vantoris_ledger.consume_member_activation(activation_hash,'scrypt$16384$8$1$YWJjZA==$YWJjZA==');
 PERFORM vantoris_ledger.issue_member_password_reset_token(decode(repeat('i',64),'hex'),m3,reset_hash,clock_timestamp()+interval '1 hour');
 PERFORM vantoris_ledger.consume_member_password_reset(reset_hash,'scrypt$16384$8$1$YWJjZA==$YWJjZA==');
 PERFORM vantoris_ledger.begin_member_mfa_enrollment(m3,mfa_challenge_hash,mfa_factor_id,
  decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp()+interval '10 minutes');
 PERFORM vantoris_ledger.complete_member_mfa_enrollment(mfa_challenge_hash,mfa_session_hash,mfa_csrf_hash,
  mfa_totp_step,clock_timestamp()+interval '1 hour');
 IF vantoris_ledger.consume_member_totp_step(mfa_factor_id,mfa_totp_step) THEN
  RAISE EXCEPTION 'Member TOTP step replay was accepted';
 END IF;
 IF NOT vantoris_ledger.consume_staff_totp_step(ops_factor_id,staff_totp_step) THEN
  RAISE EXCEPTION 'First staff TOTP step was rejected';
 END IF;
 IF vantoris_ledger.consume_staff_totp_step(ops_factor_id,staff_totp_step) THEN
  RAISE EXCEPTION 'Staff TOTP step replay was accepted';
 END IF;
 PERFORM vantoris_ledger.resolve_member_session(mfa_session_hash);

 -- Vantoris receives encrypted identity evidence and makes the review decision itself.
 identity_document_id:=vantoris_ledger.store_member_identity_document(
  decode(repeat('c',64),'hex'),'government_id',decode('255044462d31','hex'),
  decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,
  decode(repeat('a',64),'hex'),'application/pdf','test-government-id.pdf'
 );
 IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.read_member_identity_document(decode(repeat('c',64),'hex'),identity_document_id)) THEN
  RAISE EXCEPTION 'Member cannot retrieve own identity document';
 END IF;
 BEGIN
  PERFORM * FROM vantoris_ledger.read_member_identity_document(decode(repeat('e',64),'hex'),identity_document_id);
  RAISE EXCEPTION 'Member could retrieve another member identity document';
 EXCEPTION WHEN SQLSTATE 'P0002' THEN NULL;
 END;
 identity_review_id:=vantoris_ledger.review_member_identity_document(decode(repeat('k',64),'hex'),identity_document_id,'approved','Synthetic identity review approved by Vantoris staff');
 IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.member_identity_reviews WHERE id=identity_review_id AND reviewer_staff_id=identity_staff AND decision='approved') THEN
  RAISE EXCEPTION 'Vantoris identity review was not recorded';
 END IF;
 IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.member_identity_documents WHERE id=identity_document_id AND review_status='approved') THEN
  RAISE EXCEPTION 'Identity document status was not updated';
 END IF;
 BEGIN
  PERFORM * FROM vantoris_ledger.read_staff_identity_document(decode(repeat('i',64),'hex'),identity_document_id);
  RAISE EXCEPTION 'Support staff without identity.review could read identity evidence';
 EXCEPTION WHEN insufficient_privilege THEN NULL;
 END;

 -- MFA cannot be disabled for member or staff principals.
 BEGIN
  UPDATE vantoris_ledger.member_credentials SET mfa_required=false WHERE member_id=m1;
  RAISE EXCEPTION 'Member MFA disable unexpectedly succeeded';
 EXCEPTION WHEN check_violation THEN NULL;
 END;
 BEGIN
  UPDATE vantoris_ledger.staff_users SET mfa_required=false WHERE id=ops_staff;
  RAISE EXCEPTION 'Staff MFA disable unexpectedly succeeded';
 EXCEPTION WHEN check_violation THEN NULL;
 END;

 -- Permanent capital floor is proposed by operations, approved by finance and posted by finance.
 capital_proposal:=vantoris_ledger.create_staff_action_proposal(
  decode(repeat('a',64),'hex'),'capital_floor','institutional-capital',
  jsonb_build_object('minimum_unimpaired_cents',5000)
 );
 PERFORM vantoris_ledger.approve_staff_action_proposal(decode(repeat('g',64),'hex'),capital_proposal,'approve');
 PERFORM vantoris_ledger.execute_approved_staff_action(decode(repeat('g',64),'hex'),capital_proposal);

 INSERT INTO vantoris_ledger.ledger_accounts(id,account_reference,member_id,account_type,currency) VALUES
  (capital_id,'TEST-PERMANENT-CAPITAL',NULL,'institutional_capital','USD'),
  (clearing_id,'TEST-CLEARING',NULL,'internal_clearing','USD'),
  (suspense_id,'TEST-SUSPENSE',NULL,'suspense','USD');

 -- The opening capital is a dual-approved manual journal, never a typed balance.
 capital_opening_proposal:=vantoris_ledger.create_staff_action_proposal(
  decode(repeat('a',64),'hex'),'manual_journal','capital-opening',
  jsonb_build_object('description','Synthetic permanent capital contribution','entries',jsonb_build_array(
   jsonb_build_object('account_reference','TEST-CLEARING','amount_cents',5000),
   jsonb_build_object('account_reference','TEST-PERMANENT-CAPITAL','amount_cents',-5000)
  ))
 );
 PERFORM vantoris_ledger.approve_staff_action_proposal(decode(repeat('g',64),'hex'),capital_opening_proposal,'approve');
 capital_journal:=vantoris_ledger.post_approved_manual_journal(decode(repeat('g',64),'hex'),capital_opening_proposal);

 INSERT INTO vantoris_ledger.ledger_accounts(id,account_reference,member_id,account_type,currency) VALUES
  (a1,'TEST-MEMBER-ONE-USD',m1,'member_liability','USD'),
  (a2,'TEST-MEMBER-TWO-USD',m2,'member_liability','USD');

 -- The member opening liability is another balanced journal, not a balance field.
 opening_proposal:=vantoris_ledger.create_staff_action_proposal(
  decode(repeat('a',64),'hex'),'manual_journal','member-opening',
  jsonb_build_object('description','Synthetic member opening liability','entries',jsonb_build_array(
   jsonb_build_object('account_reference','TEST-CLEARING','amount_cents',10000),
   jsonb_build_object('account_reference','TEST-MEMBER-ONE-USD','amount_cents',-10000)
  ))
 );
 PERFORM vantoris_ledger.approve_staff_action_proposal(decode(repeat('g',64),'hex'),opening_proposal,'approve');
 opening_journal:=vantoris_ledger.post_approved_manual_journal(decode(repeat('g',64),'hex'),opening_proposal);

 -- A balanced journal that would reduce permanent capital below its floor must fail at commit.
 BEGIN
  INSERT INTO vantoris_ledger.journals(id,journal_type,source_reference,idempotency_key,description,created_by)
   VALUES(impairment_journal,'manual','TEST-CAPITAL-IMPAIRMENT','test-capital-impairment','Must be rejected','test');
  INSERT INTO vantoris_ledger.journal_entries(id,journal_id,ledger_account_id,currency,amount_cents) VALUES
   (gen_random_uuid(),impairment_journal,capital_id,'USD',1000),
   (gen_random_uuid(),impairment_journal,clearing_id,'USD',-1000);
  SET CONSTRAINTS institutional_capital_floor_check IMMEDIATE;
  RAISE EXCEPTION 'Permanent capital impairment unexpectedly succeeded';
 EXCEPTION WHEN check_violation THEN
  IF SQLERRM NOT LIKE 'PERMANENT_CAPITAL_IMPAIRMENT_BLOCKED%' THEN RAISE; END IF;
 END;

 -- Manual journal proposal, independent approval and posting by finance staff.
 manual_proposal:=vantoris_ledger.create_staff_action_proposal(
  decode(repeat('a',64),'hex'),'manual_journal','test-manual-journal',
  jsonb_build_object('description','Synthetic manual reclassification','entries',jsonb_build_array(
   jsonb_build_object('account_reference','TEST-CLEARING','amount_cents',100),
   jsonb_build_object('account_reference','TEST-SUSPENSE','amount_cents',-100)
  ))
 );
 PERFORM vantoris_ledger.approve_staff_action_proposal(decode(repeat('g',64),'hex'),manual_proposal,'approve');
 manual_journal:=vantoris_ledger.post_approved_manual_journal(decode(repeat('g',64),'hex'),manual_proposal);
 IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.staff_action_proposals WHERE id=manual_proposal AND status='executed') THEN
  RAISE EXCEPTION 'Approved manual journal proposal was not executed';
 END IF;

 -- Reverse that manual journal using a second independently approved action.
 reversal_proposal:=vantoris_ledger.create_staff_action_proposal(
  decode(repeat('a',64),'hex'),'reverse_journal',manual_journal::text,
  jsonb_build_object('reason','Synthetic test reversal')
 );
 PERFORM vantoris_ledger.approve_staff_action_proposal(decode(repeat('g',64),'hex'),reversal_proposal,'approve');
 reversal_journal:=vantoris_ledger.post_approved_reversal(decode(repeat('g',64),'hex'),reversal_proposal);
 IF NOT EXISTS(SELECT 1 FROM vantoris_ledger.journals WHERE id=reversal_journal AND reversal_of=manual_journal) THEN
  RAISE EXCEPTION 'Reversal journal was not linked to original';
 END IF;

 -- Member transfer limits are created only through a separate proposal, approval and posting.
 limit_proposal:=vantoris_ledger.create_staff_action_proposal(
  decode(repeat('a',64),'hex'),'change_limit',m1::text,
  jsonb_build_object('member_id',m1,'single_limit_cents',9000,'daily_limit_cents',10000)
 );
 PERFORM vantoris_ledger.approve_staff_action_proposal(decode(repeat('g',64),'hex'),limit_proposal,'approve');
 limit_history:=vantoris_ledger.post_approved_limit_change(decode(repeat('g',64),'hex'),limit_proposal);

 SELECT * INTO result FROM vantoris_ledger.create_member_internal_transfer_operation(
  op_id,decode(repeat('c',64),'hex'),'TEST-MEMBER-ONE-USD','TEST-MEMBER-TWO-USD',3000,'test-transfer:'||op_id,repeat('a',64));
 op_id:=result.operation_id;
 SELECT * INTO result FROM vantoris_ledger.execute_member_internal_transfer(op_id,decode(repeat('c',64),'hex'));
 IF result.duplicate THEN RAISE EXCEPTION 'First transfer unexpectedly marked duplicate'; END IF;
 SELECT -COALESCE(sum(amount_cents),0) INTO sender_balance FROM vantoris_ledger.journal_entries WHERE ledger_account_id=a1;
 SELECT -COALESCE(sum(amount_cents),0) INTO receiver_balance FROM vantoris_ledger.journal_entries WHERE ledger_account_id=a2;
 IF sender_balance<>7000 OR receiver_balance<>3000 THEN RAISE EXCEPTION 'Incorrect balances: sender %, receiver %',sender_balance,receiver_balance; END IF;
 SELECT status INTO captured_status FROM vantoris_ledger.outgoing_funds_holds WHERE id=result.hold_id;
 IF captured_status<>'captured' THEN RAISE EXCEPTION 'Transfer hold was not captured'; END IF;
 SELECT count(*) INTO journal_count FROM vantoris_ledger.journals WHERE journal_type='internal_transfer' AND source_reference=op_id::text;
 IF journal_count<>1 THEN RAISE EXCEPTION 'Expected exactly one transfer journal, got %',journal_count; END IF;
 SELECT * INTO result FROM vantoris_ledger.execute_member_internal_transfer(op_id,decode(repeat('c',64),'hex'));
 IF NOT result.duplicate THEN RAISE EXCEPTION 'Transfer retry was not idempotent'; END IF;
 BEGIN
  PERFORM * FROM vantoris_ledger.create_member_internal_transfer_operation(gen_random_uuid(),decode(repeat('c',64),'hex'),'TEST-MEMBER-ONE-USD','TEST-MEMBER-TWO-USD',3100,'test-transfer:'||op_id,repeat('a',64));
  RAISE EXCEPTION 'Idempotency payload conflict unexpectedly succeeded';
 EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;
 -- Single and daily limits are enforced before a transfer operation is claimed.
 BEGIN
  PERFORM * FROM vantoris_ledger.create_member_internal_transfer_operation(
   gen_random_uuid(),decode(repeat('c',64),'hex'),'TEST-MEMBER-ONE-USD','TEST-MEMBER-TWO-USD',10000,'test-single-limit:'||m1,repeat('b',64));
  RAISE EXCEPTION 'Single transfer limit unexpectedly bypassed';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'MEMBER_SINGLE_TRANSFER_LIMIT_EXCEEDED' THEN RAISE; END IF; END;
 BEGIN
  PERFORM * FROM vantoris_ledger.create_member_internal_transfer_operation(
   gen_random_uuid(),decode(repeat('c',64),'hex'),'TEST-MEMBER-ONE-USD','TEST-MEMBER-TWO-USD',8000,'test-daily-limit:'||m1,repeat('c',64));
  RAISE EXCEPTION 'Daily transfer limit unexpectedly bypassed';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'MEMBER_DAILY_TRANSFER_LIMIT_EXCEEDED' THEN RAISE; END IF; END;

 -- A second dual-approved limit change permits the request to reach the funds check.
 limit_proposal:=vantoris_ledger.create_staff_action_proposal(
  decode(repeat('a',64),'hex'),'change_limit',m1::text,
  jsonb_build_object('member_id',m1,'single_limit_cents',9000,'daily_limit_cents',15000)
 );
 PERFORM vantoris_ledger.approve_staff_action_proposal(decode(repeat('g',64),'hex'),limit_proposal,'approve');
 limit_history:=vantoris_ledger.post_approved_limit_change(decode(repeat('g',64),'hex'),limit_proposal);

 SELECT * INTO result FROM vantoris_ledger.create_member_internal_transfer_operation(
  gen_random_uuid(),decode(repeat('c',64),'hex'),'TEST-MEMBER-ONE-USD','TEST-MEMBER-TWO-USD',8000,'test-insufficient:'||m1,repeat('d',64));
 BEGIN
  PERFORM * FROM vantoris_ledger.execute_member_internal_transfer(result.operation_id,decode(repeat('c',64),'hex'));
  RAISE EXCEPTION 'Insufficient funds transfer unexpectedly succeeded';
 EXCEPTION WHEN SQLSTATE 'P0001' THEN IF SQLERRM<>'INSUFFICIENT_AVAILABLE_FUNDS' THEN RAISE; END IF; END;
 BEGIN
  UPDATE vantoris_ledger.journal_entries SET amount_cents=amount_cents WHERE journal_id=opening_journal;
  RAISE EXCEPTION 'Ledger UPDATE unexpectedly succeeded';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='Ledger UPDATE unexpectedly succeeded' THEN RAISE; END IF; END;
 BEGIN
  UPDATE vantoris_ledger.audit_events SET action=action;
  RAISE EXCEPTION 'Audit UPDATE unexpectedly succeeded';
 EXCEPTION WHEN OTHERS THEN IF SQLERRM='Audit UPDATE unexpectedly succeeded' THEN RAISE; END IF; END;
END $$;

SET ROLE vantoris_backend;
SELECT vantoris_ledger.resolve_member_session(decode(repeat('c',64),'hex'));
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM vantoris_ledger.ledger_accounts; IF n<>1 THEN RAISE EXCEPTION 'Member one account scope leaked: %',n; END IF;
 SELECT count(*) INTO n FROM vantoris_ledger.members; IF n<>1 THEN RAISE EXCEPTION 'Member one member scope leaked: %',n; END IF;
 SELECT count(*) INTO n FROM vantoris_ledger.audit_events; IF n<>0 THEN RAISE EXCEPTION 'Member can read institutional audit events'; END IF;
 BEGIN UPDATE vantoris_ledger.ledger_accounts SET account_reference=account_reference WHERE account_reference='TEST-MEMBER-ONE-USD';
  RAISE EXCEPTION 'Runtime unexpectedly mutated account chart'; EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT vantoris_ledger.resolve_member_session(decode(repeat('e',64),'hex'));
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM vantoris_ledger.ledger_accounts; IF n<>1 THEN RAISE EXCEPTION 'Member two account scope leaked: %',n; END IF;
 SELECT count(*) INTO n FROM vantoris_ledger.members; IF n<>1 THEN RAISE EXCEPTION 'Member two member scope leaked: %',n; END IF;
END $$;
SELECT vantoris_ledger.resolve_staff_session(decode(repeat('a',64),'hex'));
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM vantoris_ledger.members; IF n<>3 THEN RAISE EXCEPTION 'Operations staff member access missing'; END IF;
 SELECT count(*) INTO n FROM vantoris_ledger.audit_events; IF n<1 THEN RAISE EXCEPTION 'Operations staff audit access missing'; END IF;
 SELECT count(*) INTO n FROM vantoris_ledger.ledger_accounts; IF n<>5 THEN RAISE EXCEPTION 'Operations staff ledger access missing: %',n; END IF;
END $$;
SELECT vantoris_ledger.resolve_staff_session(decode(repeat('i',64),'hex'));
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM vantoris_ledger.members; IF n<>3 THEN RAISE EXCEPTION 'Support officer member profile access missing'; END IF;
 SELECT count(*) INTO n FROM vantoris_ledger.ledger_accounts; IF n<>0 THEN RAISE EXCEPTION 'Support officer must not see ledger accounts'; END IF;
 SELECT count(*) INTO n FROM vantoris_ledger.audit_events; IF n<>0 THEN RAISE EXCEPTION 'Support officer must not see institutional audit'; END IF;
END $$;
RESET ROLE;
SET CONSTRAINTS ALL IMMEDIATE;
ROLLBACK;
