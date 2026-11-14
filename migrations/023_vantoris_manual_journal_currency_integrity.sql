-- VANTORIS migration 023: derive approved manual-journal currency from locked ledger accounts.
-- Forward-only replacement; migration 011 and existing journals are not rewritten.
BEGIN;

CREATE OR REPLACE FUNCTION vantoris_ledger.post_approved_manual_journal(
  p_session_token_hash bytea,
  p_proposal_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path=pg_catalog,vantoris_ledger
AS $VANTORIS$
DECLARE
  poster_id uuid;
  poster_ref text;
  proposal vantoris_ledger.staff_action_proposals%ROWTYPE;
  proposer_id uuid;
  line_count integer;
  distinct_accounts integer;
  net_cents numeric;
  currency_count integer;
  journal_currency text;
  existing_journal_id uuid;
  new_journal_id uuid:=gen_random_uuid();
BEGIN
  poster_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
  IF poster_id IS NULL OR NOT COALESCE(
    vantoris_ledger.staff_has_capability(poster_id,'ledger.manual_journal.post'),
    false
  ) THEN
    RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501';
  END IF;

  SELECT * INTO proposal
    FROM vantoris_ledger.staff_action_proposals
   WHERE id=p_proposal_id
   FOR UPDATE;
  IF NOT FOUND OR proposal.action_type<>'manual_journal' THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_PROPOSAL_NOT_FOUND';
  END IF;

  SELECT id INTO proposer_id
    FROM vantoris_ledger.staff_users
   WHERE staff_reference=proposal.proposed_by;
  IF proposer_id IS NULL OR proposer_id=poster_id OR NOT EXISTS(
    SELECT 1
      FROM vantoris_ledger.staff_action_approvals
     WHERE proposal_id=p_proposal_id AND decision='approve'
  ) THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_SEPARATION_OF_DUTIES_REQUIRED' USING ERRCODE='42501';
  END IF;

  SELECT id INTO existing_journal_id
    FROM vantoris_ledger.journals
   WHERE idempotency_key='manual-journal:'||p_proposal_id::text;
  IF existing_journal_id IS NOT NULL THEN
    IF proposal.status='executed' THEN
      RETURN existing_journal_id;
    END IF;
    RAISE EXCEPTION 'MANUAL_JOURNAL_IDEMPOTENCY_CONFLICT';
  END IF;
  IF proposal.status='executed' THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_EXECUTION_RECORD_MISSING';
  END IF;
  IF proposal.status<>'approved' THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_NOT_APPROVED';
  END IF;

  IF jsonb_typeof(proposal.payload->'entries') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_REQUIRES_TWO_OR_MORE_LINES';
  END IF;
  IF jsonb_array_length(proposal.payload->'entries')<2 THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_REQUIRES_TWO_OR_MORE_LINES';
  END IF;
  IF COALESCE(proposal.payload->>'description','')='' THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_DESCRIPTION_REQUIRED';
  END IF;

  IF EXISTS(
    SELECT 1
      FROM jsonb_array_elements(proposal.payload->'entries') e
     WHERE COALESCE(e.value->>'account_reference','')=''
        OR COALESCE(e.value->>'amount_cents','') !~ '^-?[1-9][0-9]*$'
  ) THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_LINE_INVALID';
  END IF;

  IF EXISTS(
    SELECT 1
      FROM jsonb_array_elements(proposal.payload->'entries') e
     WHERE (e.value->>'amount_cents')::numeric < -9223372036854775808
        OR (e.value->>'amount_cents')::numeric > 9223372036854775807
  ) THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_AMOUNT_OUT_OF_RANGE';
  END IF;

  SELECT count(*),
         count(DISTINCT value->>'account_reference'),
         COALESCE(sum((value->>'amount_cents')::numeric),0)
    INTO line_count,distinct_accounts,net_cents
    FROM jsonb_array_elements(proposal.payload->'entries');

  IF line_count<2 OR distinct_accounts<2 OR net_cents<>0 THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_LINES_MUST_BALANCE';
  END IF;

  IF (
    SELECT count(*)
      FROM jsonb_array_elements(proposal.payload->'entries') e
      JOIN vantoris_ledger.ledger_accounts a
        ON a.account_reference=e.value->>'account_reference'
  )<>line_count THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_ACCOUNT_NOT_FOUND';
  END IF;

  PERFORM 1
    FROM vantoris_ledger.ledger_accounts a
   WHERE a.account_reference IN (
     SELECT value->>'account_reference'
       FROM jsonb_array_elements(proposal.payload->'entries')
   )
   ORDER BY a.id
   FOR UPDATE;

  SELECT count(DISTINCT a.currency),min(a.currency)
    INTO currency_count,journal_currency
    FROM jsonb_array_elements(proposal.payload->'entries') e
    JOIN vantoris_ledger.ledger_accounts a
      ON a.account_reference=e.value->>'account_reference';

  IF currency_count<>1 OR journal_currency IS NULL THEN
    RAISE EXCEPTION 'MANUAL_JOURNAL_CURRENCY_MISMATCH';
  END IF;

  SELECT staff_reference INTO poster_ref
    FROM vantoris_ledger.staff_users
   WHERE id=poster_id;

  INSERT INTO vantoris_ledger.journals(
    id,journal_type,source_reference,idempotency_key,description,created_by
  )
  VALUES(
    new_journal_id,'manual',p_proposal_id::text,
    'manual-journal:'||p_proposal_id::text,
    left(proposal.payload->>'description',300),
    'staff:'||poster_ref
  );

  INSERT INTO vantoris_ledger.journal_entries(
    id,journal_id,ledger_account_id,currency,amount_cents
  )
  SELECT gen_random_uuid(),new_journal_id,a.id,journal_currency,
         (e.value->>'amount_cents')::bigint
    FROM jsonb_array_elements(proposal.payload->'entries') e
    JOIN vantoris_ledger.ledger_accounts a
      ON a.account_reference=e.value->>'account_reference';

  UPDATE vantoris_ledger.staff_action_proposals
     SET status='executed'
   WHERE id=p_proposal_id;

  INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
  VALUES(
    'staff:'||poster_ref,
    'approved_manual_journal_posted',
    'journal',
    new_journal_id::text,
    jsonb_build_object(
      'proposal_id',p_proposal_id,
      'line_count',line_count,
      'net_cents',net_cents,
      'currency',journal_currency
    )
  );

  RETURN new_journal_id;
END;
$VANTORIS$;

REVOKE ALL ON FUNCTION vantoris_ledger.post_approved_manual_journal(bytea,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.post_approved_manual_journal(bytea,uuid) TO vantoris_backend;

COMMIT;
