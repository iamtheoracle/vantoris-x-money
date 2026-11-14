-- Run after migrations 001–005 against a disposable database as migration owner.
-- All fixtures are synthetic and the outer transaction is rolled back.
BEGIN;

DO $$
DECLARE
  m1 uuid := gen_random_uuid();
  m2 uuid := gen_random_uuid();
  clearing_id uuid := gen_random_uuid();
  a1 uuid := gen_random_uuid();
  a2 uuid := gen_random_uuid();
  opening_journal uuid := gen_random_uuid();
  op_id uuid := gen_random_uuid();
  result record;
  sender_balance numeric;
  receiver_balance numeric;
  captured_status text;
  journal_count integer;
BEGIN
  INSERT INTO vantoris_ledger.members(id,member_reference,status)
    VALUES (m1,'TEST-MEMBER-ONE','active'),(m2,'TEST-MEMBER-TWO','active');
  INSERT INTO vantoris_ledger.ledger_accounts(id,account_reference,member_id,account_type,currency)
    VALUES (clearing_id,'TEST-CLEARING',NULL,'internal_clearing','USD'),
           (a1,'TEST-MEMBER-ONE-USD',m1,'member_liability','USD'),
           (a2,'TEST-MEMBER-TWO-USD',m2,'member_liability','USD');

  INSERT INTO vantoris_ledger.journals(id,journal_type,source_reference,idempotency_key,description,created_by)
    VALUES(opening_journal,'opening_balance','TEST-OPENING','test-opening:'||m1,'Synthetic test opening balance','test');
  INSERT INTO vantoris_ledger.journal_entries(id,journal_id,ledger_account_id,currency,amount_cents)
    VALUES(gen_random_uuid(),opening_journal,clearing_id,'USD',10000),
          (gen_random_uuid(),opening_journal,a1,'USD',-10000);
  SELECT * INTO result FROM vantoris_ledger.create_internal_transfer_operation(
    op_id,m1,'TEST-MEMBER-ONE-USD','TEST-MEMBER-TWO-USD',3000,
    'test-transfer:'||op_id,repeat('a',64)
  );
  op_id := result.operation_id;
  SELECT * INTO result FROM vantoris_ledger.execute_internal_transfer(op_id,m1);
  IF result.duplicate THEN RAISE EXCEPTION 'First transfer unexpectedly marked duplicate'; END IF;
  SELECT -COALESCE(sum(amount_cents),0) INTO sender_balance
    FROM vantoris_ledger.journal_entries WHERE ledger_account_id=a1;
  SELECT -COALESCE(sum(amount_cents),0) INTO receiver_balance
    FROM vantoris_ledger.journal_entries WHERE ledger_account_id=a2;
  IF sender_balance<>7000 OR receiver_balance<>3000 THEN
    RAISE EXCEPTION 'Incorrect balances: sender %, receiver %',sender_balance,receiver_balance;
  END IF;

  SELECT status INTO captured_status FROM vantoris_ledger.outgoing_funds_holds WHERE id=result.hold_id;
  IF captured_status<>'captured' THEN RAISE EXCEPTION 'Transfer hold was not captured'; END IF;

  SELECT count(*) INTO journal_count FROM vantoris_ledger.journals
   WHERE journal_type='internal_transfer' AND source_reference=op_id::text;
  IF journal_count<>1 THEN RAISE EXCEPTION 'Expected exactly one transfer journal, got %',journal_count; END IF;

  SELECT * INTO result FROM vantoris_ledger.execute_internal_transfer(op_id,m1);
  IF NOT result.duplicate THEN RAISE EXCEPTION 'Retry was not idempotent'; END IF;

  SELECT * INTO result FROM vantoris_ledger.create_internal_transfer_operation(
    gen_random_uuid(),m1,'TEST-MEMBER-ONE-USD','TEST-MEMBER-TWO-USD',8000,
    'test-insufficient:'||m1,repeat('b',64)
  );
  BEGIN
    PERFORM * FROM vantoris_ledger.execute_internal_transfer(result.operation_id,m1);
    RAISE EXCEPTION 'Insufficient funds transfer unexpectedly succeeded';
  EXCEPTION WHEN SQLSTATE 'P0001' THEN
    IF SQLERRM<>'INSUFFICIENT_AVAILABLE_FUNDS' THEN RAISE; END IF;
  END;

  BEGIN
    UPDATE vantoris_ledger.journal_entries SET amount_cents=amount_cents WHERE journal_id=opening_journal;
    RAISE EXCEPTION 'Ledger UPDATE unexpectedly succeeded';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM='Ledger UPDATE unexpectedly succeeded' THEN RAISE; END IF;
  END;

  BEGIN
    UPDATE vantoris_ledger.audit_events SET action=action;
    RAISE EXCEPTION 'Audit UPDATE unexpectedly succeeded';
  EXCEPTION WHEN OTHERS THEN
    IF SQLERRM='Audit UPDATE unexpectedly succeeded' THEN RAISE; END IF;
  END;
END $$;

SET CONSTRAINTS ALL IMMEDIATE;
ROLLBACK;
