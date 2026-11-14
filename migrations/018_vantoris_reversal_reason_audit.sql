-- VANTORIS migration 018: record the staff-supplied reason in every reversal journal and audit event.
BEGIN;
CREATE OR REPLACE FUNCTION vantoris_ledger.post_approved_reversal(p_session_token_hash bytea,p_proposal_id uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,vantoris_ledger AS $$
DECLARE poster_id uuid; poster_ref text; proposer_id uuid; proposal vantoris_ledger.staff_action_proposals%ROWTYPE;
        original vantoris_ledger.journals%ROWTYPE; new_journal_id uuid:=gen_random_uuid(); original_count integer; reason text;
BEGIN
 poster_id:=vantoris_ledger.resolve_staff_session(p_session_token_hash);
 IF NOT vantoris_ledger.staff_has_capability(poster_id,'ledger.reverse.post') THEN RAISE EXCEPTION 'STAFF_CAPABILITY_REQUIRED' USING ERRCODE='42501'; END IF;
 SELECT * INTO proposal FROM vantoris_ledger.staff_action_proposals WHERE id=p_proposal_id FOR UPDATE;
 IF NOT FOUND OR proposal.action_type<>'reverse_journal' OR proposal.status<>'approved' THEN RAISE EXCEPTION 'REVERSAL_NOT_APPROVED'; END IF;
 reason:=nullif(left(btrim(COALESCE(proposal.payload->>'reason','')),500),'');
 IF reason IS NULL THEN RAISE EXCEPTION 'REVERSAL_REASON_REQUIRED'; END IF;
 SELECT id INTO proposer_id FROM vantoris_ledger.staff_users WHERE staff_reference=proposal.proposed_by;
 IF proposer_id IS NULL OR proposer_id=poster_id OR NOT EXISTS(
   SELECT 1 FROM vantoris_ledger.staff_action_approvals WHERE proposal_id=p_proposal_id AND decision='approve') THEN
  RAISE EXCEPTION 'REVERSAL_SEPARATION_OF_DUTIES_REQUIRED' USING ERRCODE='42501';
 END IF;
 SELECT * INTO original FROM vantoris_ledger.journals WHERE id=proposal.object_reference::uuid FOR UPDATE;
 IF NOT FOUND OR original.journal_type='reversal' OR EXISTS(SELECT 1 FROM vantoris_ledger.journals WHERE reversal_of=original.id) THEN
  RAISE EXCEPTION 'JOURNAL_NOT_REVERSIBLE_OR_ALREADY_REVERSED';
 END IF;
 SELECT count(*) INTO original_count FROM vantoris_ledger.journal_entries WHERE journal_id=original.id;
 IF original_count<2 THEN RAISE EXCEPTION 'ORIGINAL_JOURNAL_INVALID'; END IF;
 PERFORM 1 FROM vantoris_ledger.ledger_accounts a
  WHERE a.id IN (SELECT ledger_account_id FROM vantoris_ledger.journal_entries WHERE journal_id=original.id)
  ORDER BY a.id FOR UPDATE;
 SELECT staff_reference INTO poster_ref FROM vantoris_ledger.staff_users WHERE id=poster_id;
 INSERT INTO vantoris_ledger.journals(id,journal_type,source_reference,idempotency_key,description,reversal_of,created_by)
 VALUES(new_journal_id,'reversal',p_proposal_id::text,'reversal:'||p_proposal_id::text,
   left('Reversal of journal '||original.id::text||': '||reason,300),original.id,'staff:'||poster_ref);
 INSERT INTO vantoris_ledger.journal_entries(id,journal_id,ledger_account_id,currency,amount_cents)
 SELECT gen_random_uuid(),new_journal_id,ledger_account_id,currency,-amount_cents
  FROM vantoris_ledger.journal_entries WHERE journal_id=original.id;
 UPDATE vantoris_ledger.staff_action_proposals SET status='executed' WHERE id=p_proposal_id;
 INSERT INTO vantoris_ledger.audit_events(actor_id,action,object_type,object_id,details)
 VALUES('staff:'||poster_ref,'approved_journal_reversed','journal',new_journal_id::text,
  jsonb_build_object('proposal_id',p_proposal_id,'original_journal_id',original.id,'reversal_journal_id',new_journal_id,'reason',reason));
 RETURN new_journal_id;
END $$;
REVOKE ALL ON FUNCTION vantoris_ledger.post_approved_reversal(bytea,uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION vantoris_ledger.post_approved_reversal(bytea,uuid) TO vantoris_backend;
COMMIT;
