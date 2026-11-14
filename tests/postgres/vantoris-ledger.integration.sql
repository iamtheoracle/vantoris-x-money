-- Run after migrations 001–007 against a disposable PostgreSQL database as migration owner.
-- Fixtures are synthetic. The complete test transaction is rolled back.
BEGIN;
DO $$
DECLARE
 m1 uuid:=gen_random_uuid(); m2 uuid:=gen_random_uuid(); staff_id uuid:=gen_random_uuid();
 clearing_id uuid:=gen_random_uuid(); a1 uuid:=gen_random_uuid(); a2 uuid:=gen_random_uuid();
 opening_journal uuid:=gen_random_uuid(); op_id uuid:=gen_random_uuid();
 result record; sender_balance numeric; receiver_balance numeric; captured_status text; journal_count integer;
BEGIN
 INSERT INTO vantoris_ledger.members(id,member_reference,status) VALUES
  (m1,'TEST-MEMBER-ONE','active'),(m2,'TEST-MEMBER-TWO','active');
 INSERT INTO vantoris_ledger.member_credentials(member_id,email,password_hash,email_verified_at,password_reset_required,mfa_required)
 VALUES(m1,'member-one@example.test','scrypt-test-hash',clock_timestamp(),false,false),
       (m2,'member-two@example.test','scrypt-test-hash',clock_timestamp(),false,false);
 INSERT INTO vantoris_ledger.staff_users(id,staff_reference,email,password_hash,status,mfa_required)
 VALUES(staff_id,'TEST-STAFF-ONE','staff-one@example.test','scrypt-test-hash','active',true);
 INSERT INTO vantoris_ledger.staff_mfa_factors(id,staff_id,factor_type,secret_ciphertext,nonce,auth_tag,encryption_key_version,verified_at)
 VALUES(gen_random_uuid(),staff_id,'totp',decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp());
 PERFORM vantoris_ledger.create_member_session(m1,decode(repeat('c',64),'hex'),decode(repeat('d',64),'hex'),clock_timestamp()+interval '1 hour',NULL);
 PERFORM vantoris_ledger.create_member_session(m2,decode(repeat('e',64),'hex'),decode(repeat('f',64),'hex'),clock_timestamp()+interval '1 hour',NULL);
 PERFORM vantoris_ledger.create_staff_session(staff_id,decode(repeat('a',64),'hex'),decode(repeat('b',64),'hex'),clock_timestamp()+interval '1 hour',clock_timestamp());

 INSERT INTO vantoris_ledger.ledger_accounts(id,account_reference,member_id,account_type,currency) VALUES
  (clearing_id,'TEST-CLEARING',NULL,'internal_clearing','USD'),
  (a1,'TEST-MEMBER-ONE-USD',m1,'member_liability','USD'),
  (a2,'TEST-MEMBER-TWO-USD',m2,'member_liability','USD');
 INSERT INTO vantoris_ledger.journals(id,journal_type,source_reference,idempotency_key,description,created_by)
 VALUES(opening_journal,'opening_balance','TEST-OPENING','test-opening:'||m1,'Synthetic test opening balance','test');
 INSERT INTO vantoris_ledger.journal_entries(id,journal_id,ledger_account_id,currency,amount_cents) VALUES
  (gen_random_uuid(),opening_journal,clearing_id,'USD',10000),
  (gen_random_uuid(),opening_journal,a1,'USD',-10000);

 SELECT * INTO result FROM vantoris_ledger.create_internal_transfer_operation(
  op_id,m1,'TEST-MEMBER-ONE-USD','TEST-MEMBER-TWO-USD',3000,'test-transfer:'||op_id,repeat('a',64));
 op_id:=result.operation_id;
 SELECT * INTO result FROM vantoris_ledger.execute_internal_transfer(op_id,m1);
 IF result.duplicate THEN RAISE EXCEPTION 'First transfer unexpectedly marked duplicate'; END IF;
 SELECT -COALESCE(sum(amount_cents),0) INTO sender_balance FROM vantoris_ledger.journal_entries WHERE ledger_account_id=a1;
 SELECT -COALESCE(sum(amount_cents),0) INTO receiver_balance FROM vantoris_ledger.journal_entries WHERE ledger_account_id=a2;
 IF sender_balance<>7000 OR receiver_balance<>3000 THEN RAISE EXCEPTION 'Incorrect balances: sender %, receiver %',sender_balance,receiver_balance; END IF;
 SELECT status INTO captured_status FROM vantoris_ledger.outgoing_funds_holds WHERE id=result.hold_id;
 IF captured_status<>'captured' THEN RAISE EXCEPTION 'Transfer hold was not captured'; END IF;
 SELECT count(*) INTO journal_count FROM vantoris_ledger.journals WHERE journal_type='internal_transfer' AND source_reference=op_id::text;
 IF journal_count<>1 THEN RAISE EXCEPTION 'Expected exactly one transfer journal, got %',journal_count; END IF;
 SELECT * INTO result FROM vantoris_ledger.execute_internal_transfer(op_id,m1);
 IF NOT result.duplicate THEN RAISE EXCEPTION 'Transfer retry was not idempotent'; END IF;

 BEGIN
  PERFORM * FROM vantoris_ledger.create_internal_transfer_operation(gen_random_uuid(),m1,'TEST-MEMBER-ONE-USD','TEST-MEMBER-TWO-USD',3100,'test-transfer:'||op_id,repeat('a',64));
  RAISE EXCEPTION 'Idempotency payload conflict unexpectedly succeeded';
 EXCEPTION WHEN SQLSTATE '23505' THEN NULL; END;

 SELECT * INTO result FROM vantoris_ledger.create_internal_transfer_operation(
  gen_random_uuid(),m1,'TEST-MEMBER-ONE-USD','TEST-MEMBER-TWO-USD',8000,'test-insufficient:'||m1,repeat('b',64));
 BEGIN
  PERFORM * FROM vantoris_ledger.execute_internal_transfer(result.operation_id,m1);
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

-- Verify that the runtime role cannot see another member's records.
SET ROLE vantoris_backend;
SELECT vantoris_ledger.resolve_member_session(decode(repeat('c',64),'hex'));
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM vantoris_ledger.ledger_accounts;
 IF n<>1 THEN RAISE EXCEPTION 'Member one account scope leaked: % rows',n; END IF;
 SELECT count(*) INTO n FROM vantoris_ledger.members;
 IF n<>1 THEN RAISE EXCEPTION 'Member one member scope leaked: % rows',n; END IF;
 SELECT count(*) INTO n FROM vantoris_ledger.audit_events;
 IF n<>0 THEN RAISE EXCEPTION 'Member can read institutional audit events'; END IF;
 BEGIN UPDATE vantoris_ledger.ledger_accounts SET account_reference=account_reference WHERE account_reference='TEST-MEMBER-ONE-USD';
  RAISE EXCEPTION 'Runtime unexpectedly mutated account chart';
 EXCEPTION WHEN insufficient_privilege THEN NULL; END;
END $$;
SELECT vantoris_ledger.resolve_member_session(decode(repeat('e',64),'hex'));
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM vantoris_ledger.ledger_accounts;
 IF n<>1 THEN RAISE EXCEPTION 'Member two account scope leaked: % rows',n; END IF;
 SELECT count(*) INTO n FROM vantoris_ledger.members;
 IF n<>1 THEN RAISE EXCEPTION 'Member two member scope leaked: % rows',n; END IF;
END $$;
SELECT vantoris_ledger.resolve_staff_session(decode(repeat('a',64),'hex'));
DO $$ DECLARE n integer; BEGIN
 SELECT count(*) INTO n FROM vantoris_ledger.members;
 IF n<>2 THEN RAISE EXCEPTION 'MFA staff view should see both test members'; END IF;
 SELECT count(*) INTO n FROM vantoris_ledger.audit_events;
 IF n<1 THEN RAISE EXCEPTION 'Staff audit access missing'; END IF;
END $$;
RESET ROLE;
SET CONSTRAINTS ALL IMMEDIATE;
ROLLBACK;
