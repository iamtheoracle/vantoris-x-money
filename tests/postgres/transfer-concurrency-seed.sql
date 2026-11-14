-- Synthetic committed fixtures for the multi-session transfer race/rollback test.
-- Run only in the disposable PostgreSQL CI database after the migration integration SQL.
BEGIN;
DO $VANTORIS$
DECLARE
 sender_id uuid:='10000000-0000-4000-8000-000000000001';
 receiver_id uuid:='10000000-0000-4000-8000-000000000002';
 ops_staff uuid:='20000000-0000-4000-8000-000000000001';
 finance_staff uuid:='20000000-0000-4000-8000-000000000002';
 capital_id uuid:='30000000-0000-4000-8000-000000000001';
 clearing_id uuid:='30000000-0000-4000-8000-000000000002';
 suspense_id uuid:='30000000-0000-4000-8000-000000000003';
 sender_account_id uuid:='30000000-0000-4000-8000-000000000004';
 receiver_account_id uuid:='30000000-0000-4000-8000-000000000005';
 capital_floor_proposal uuid;
 capital_opening_proposal uuid;
 sender_opening_proposal uuid;
 limit_proposal uuid;
 collision_operation uuid:='40000000-0000-4000-8000-000000000001';
 collision_journal uuid:='50000000-0000-4000-8000-000000000001';
BEGIN
 INSERT INTO vantoris_ledger.members(id,member_reference,status) VALUES
  (sender_id,'CONCURRENCY-SENDER','active'),
  (receiver_id,'CONCURRENCY-RECEIVER','active');

 INSERT INTO vantoris_ledger.member_credentials(
  member_id,email,password_hash,email_verified_at,password_reset_required,mfa_required
 ) VALUES
  (sender_id,'concurrency-sender@example.test','scrypt-test-hash',clock_timestamp(),false,true),
  (receiver_id,'concurrency-receiver@example.test','scrypt-test-hash',clock_timestamp(),false,true);

 INSERT INTO vantoris_ledger.member_mfa_factors(
  id,member_id,factor_type,secret_ciphertext,nonce,auth_tag,encryption_key_version,verified_at
 ) VALUES
  (gen_random_uuid(),sender_id,'totp',decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp()),
  (gen_random_uuid(),receiver_id,'totp',decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp());

 INSERT INTO vantoris_ledger.staff_users(id,staff_reference,email,password_hash,status,mfa_required) VALUES
  (ops_staff,'CONCURRENCY-OPS','concurrency-ops@example.test','scrypt-test-hash','active',true),
  (finance_staff,'CONCURRENCY-FINANCE','concurrency-finance@example.test','scrypt-test-hash','active',true);

 INSERT INTO vantoris_ledger.staff_mfa_factors(
  id,staff_id,factor_type,secret_ciphertext,nonce,auth_tag,encryption_key_version,verified_at
 ) VALUES
  (gen_random_uuid(),ops_staff,'totp',decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp()),
  (gen_random_uuid(),finance_staff,'totp',decode('00','hex'),decode(repeat('00',12),'hex'),decode(repeat('00',16),'hex'),1,clock_timestamp());

 INSERT INTO vantoris_ledger.staff_role_assignments(staff_id,role_code,assigned_by_staff_id) VALUES
  (ops_staff,'operations_officer',finance_staff),
  (ops_staff,'finance_controller',finance_staff),
  (finance_staff,'finance_controller',ops_staff);

 PERFORM vantoris_ledger.create_member_session(
  sender_id,decode(repeat('e',64),'hex'),decode(repeat('f',64),'hex'),
  clock_timestamp()+interval '1 hour',clock_timestamp()
 );
 PERFORM vantoris_ledger.create_member_session(
  sender_id,decode(repeat('7',64),'hex'),decode(repeat('8',64),'hex'),
  clock_timestamp()+interval '1 hour',clock_timestamp()
 );
 PERFORM vantoris_ledger.create_staff_session(
  ops_staff,decode(repeat('a',64),'hex'),decode(repeat('b',64),'hex'),
  clock_timestamp()+interval '1 hour',clock_timestamp()
 );
 PERFORM vantoris_ledger.create_staff_session(
  finance_staff,decode(repeat('c',64),'hex'),decode(repeat('d',64),'hex'),
  clock_timestamp()+interval '1 hour',clock_timestamp()
 );

 capital_floor_proposal:=vantoris_ledger.create_staff_action_proposal(
  decode(repeat('a',64),'hex'),'capital_floor','concurrency-capital-floor',
  jsonb_build_object('minimum_unimpaired_cents',5000)
 );
 PERFORM vantoris_ledger.approve_staff_action_proposal(
  decode(repeat('c',64),'hex'),capital_floor_proposal,'approve'
 );
 PERFORM vantoris_ledger.execute_approved_staff_action(
  decode(repeat('c',64),'hex'),capital_floor_proposal
 );

 INSERT INTO vantoris_ledger.ledger_accounts(id,account_reference,member_id,account_type,currency) VALUES
  (capital_id,'CONCURRENCY-CAPITAL',NULL,'institutional_capital','USD'),
  (clearing_id,'CONCURRENCY-CLEARING',NULL,'internal_clearing','USD'),
  (suspense_id,'CONCURRENCY-SUSPENSE',NULL,'suspense','USD'),
  (sender_account_id,'CONCURRENCY-SENDER-USD',sender_id,'member_liability','USD'),
  (receiver_account_id,'CONCURRENCY-RECEIVER-USD',receiver_id,'member_liability','USD');

 capital_opening_proposal:=vantoris_ledger.create_staff_action_proposal(
  decode(repeat('a',64),'hex'),'manual_journal','concurrency-capital-opening',
  jsonb_build_object('description','Synthetic capital funding for concurrency test','entries',jsonb_build_array(
   jsonb_build_object('account_reference','CONCURRENCY-CLEARING','amount_cents',5000),
   jsonb_build_object('account_reference','CONCURRENCY-CAPITAL','amount_cents',-5000)
  ))
 );
 PERFORM vantoris_ledger.approve_staff_action_proposal(
  decode(repeat('c',64),'hex'),capital_opening_proposal,'approve'
 );
 PERFORM vantoris_ledger.post_approved_manual_journal(
  decode(repeat('c',64),'hex'),capital_opening_proposal
 );

 sender_opening_proposal:=vantoris_ledger.create_staff_action_proposal(
  decode(repeat('a',64),'hex'),'manual_journal','concurrency-sender-opening',
  jsonb_build_object('description','Synthetic sender opening liability','entries',jsonb_build_array(
   jsonb_build_object('account_reference','CONCURRENCY-CLEARING','amount_cents',10000),
   jsonb_build_object('account_reference','CONCURRENCY-SENDER-USD','amount_cents',-10000)
  ))
 );
 PERFORM vantoris_ledger.approve_staff_action_proposal(
  decode(repeat('c',64),'hex'),sender_opening_proposal,'approve'
 );
 PERFORM vantoris_ledger.post_approved_manual_journal(
  decode(repeat('c',64),'hex'),sender_opening_proposal
 );

 limit_proposal:=vantoris_ledger.create_staff_action_proposal(
  decode(repeat('a',64),'hex'),'change_limit','concurrency-sender-limits',
  jsonb_build_object('member_id',sender_id,'single_limit_cents',10000,'daily_limit_cents',20000)
 );
 PERFORM vantoris_ledger.approve_staff_action_proposal(
  decode(repeat('c',64),'hex'),limit_proposal,'approve'
 );
 PERFORM vantoris_ledger.post_approved_limit_change(
  decode(repeat('c',64),'hex'),limit_proposal
 );

 -- Force a failure after the transfer function has inserted its active hold.
 -- The pre-existing unique key collision makes the later journal insert fail.
 INSERT INTO vantoris_ledger.journals(
  id,journal_type,source_reference,idempotency_key,description,created_by
 ) VALUES(
  collision_journal,'manual','CONCURRENCY-ROLLBACK-COLLISION',
  'internal-transfer:'||collision_operation::text,
  'Synthetic idempotency collision for rollback test','test'
 );
 INSERT INTO vantoris_ledger.journal_entries(id,journal_id,ledger_account_id,currency,amount_cents) VALUES
  (gen_random_uuid(),collision_journal,suspense_id,'USD',1),
  (gen_random_uuid(),collision_journal,clearing_id,'USD',-1);
END;
$VANTORIS$;
COMMIT;
