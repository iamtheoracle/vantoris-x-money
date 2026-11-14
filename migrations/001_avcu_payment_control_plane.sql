-- VANTORIS INSTITUTIONAL LEDGER — migration 001
-- Vantoris-owned PostgreSQL is the sole system of record for institutional
-- capital, member liabilities, internal accounts, journals, holds and audit.
-- No external provider, payment rail or network is part of this schema.
-- Apply only to a Vantoris-administered database.
BEGIN;

CREATE SCHEMA IF NOT EXISTS vantoris_ledger;
REVOKE ALL ON SCHEMA vantoris_ledger FROM PUBLIC;

CREATE TABLE vantoris_ledger.members (
  id uuid PRIMARY KEY,
  member_reference text NOT NULL UNIQUE,
  status text NOT NULL CHECK (status IN ('invited','active','suspended','closed')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);

CREATE TABLE vantoris_ledger.ledger_accounts (
  id uuid PRIMARY KEY,
  account_reference text NOT NULL UNIQUE,
  member_id uuid REFERENCES vantoris_ledger.members(id),
  account_type text NOT NULL CHECK (account_type IN
    ('member_liability','institutional_capital','internal_clearing','suspense')),
  currency char(3) NOT NULL CHECK (currency = 'USD'),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  CHECK (
    (account_type = 'member_liability' AND member_id IS NOT NULL) OR
    (account_type <> 'member_liability' AND member_id IS NULL)
  ),
  UNIQUE (id, currency)
);
CREATE INDEX ledger_accounts_member_idx
  ON vantoris_ledger.ledger_accounts(member_id) WHERE member_id IS NOT NULL;

CREATE TABLE vantoris_ledger.journals (
  id uuid PRIMARY KEY,
  journal_type text NOT NULL CHECK (journal_type IN
    ('opening_balance','internal_transfer','deposit','withdrawal','reversal','manual')),
  source_reference text NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  description text NOT NULL,
  reversal_of uuid UNIQUE REFERENCES vantoris_ledger.journals(id),
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (journal_type, source_reference)
);

CREATE TABLE vantoris_ledger.journal_entries (
  id uuid PRIMARY KEY,
  journal_id uuid NOT NULL REFERENCES vantoris_ledger.journals(id),
  ledger_account_id uuid NOT NULL,
  currency char(3) NOT NULL CHECK (currency = 'USD'),
  amount_cents bigint NOT NULL CHECK (amount_cents <> 0),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  FOREIGN KEY (ledger_account_id, currency)
    REFERENCES vantoris_ledger.ledger_accounts(id, currency)
);
CREATE INDEX journal_entries_account_idx
  ON vantoris_ledger.journal_entries(ledger_account_id, created_at);
CREATE INDEX journal_entries_journal_idx
  ON vantoris_ledger.journal_entries(journal_id);

-- Positive cents are debits; negative cents are credits. Member liabilities
-- are credit-normal, so posted member balance = -SUM(entry.amount_cents).
CREATE OR REPLACE FUNCTION vantoris_ledger.assert_journal_balanced()
RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE target_id uuid; line_count bigint; net_cents numeric;
BEGIN
  target_id := CASE WHEN TG_TABLE_NAME = 'journals' THEN NEW.id ELSE NEW.journal_id END;
  SELECT count(*), COALESCE(sum(amount_cents), 0)
    INTO line_count, net_cents
    FROM vantoris_ledger.journal_entries WHERE journal_id = target_id;
  IF line_count < 2 OR net_cents <> 0 THEN
    RAISE EXCEPTION 'Journal % must contain at least two balanced entries (count %, net %)',
      target_id, line_count, net_cents USING ERRCODE = '23514';
  END IF;
  RETURN NULL;
END $$;

CREATE CONSTRAINT TRIGGER journal_balance_after_insert
AFTER INSERT ON vantoris_ledger.journals
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION vantoris_ledger.assert_journal_balanced();
CREATE CONSTRAINT TRIGGER entry_balance_after_insert
AFTER INSERT ON vantoris_ledger.journal_entries
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW
EXECUTE FUNCTION vantoris_ledger.assert_journal_balanced();

CREATE OR REPLACE FUNCTION vantoris_ledger.reject_ledger_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'Posted ledger facts are immutable; post a correcting or reversal journal';
END $$;
CREATE TRIGGER journals_immutable
BEFORE UPDATE OR DELETE ON vantoris_ledger.journals
FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.reject_ledger_mutation();
CREATE TRIGGER journal_entries_immutable
BEFORE UPDATE OR DELETE ON vantoris_ledger.journal_entries
FOR EACH ROW EXECUTE FUNCTION vantoris_ledger.reject_ledger_mutation();

CREATE TABLE vantoris_ledger.payment_operations (
  id uuid PRIMARY KEY,
  operation_type text NOT NULL CHECK (operation_type IN ('internal_transfer')),
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  status text NOT NULL CHECK (status IN ('accepted','held','posted','released','reversed','rejected')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  UNIQUE (operation_type, idempotency_key)
);

CREATE TABLE vantoris_ledger.outgoing_funds_holds (
  id uuid PRIMARY KEY,
  operation_id uuid NOT NULL UNIQUE REFERENCES vantoris_ledger.payment_operations(id),
  ledger_account_id uuid NOT NULL REFERENCES vantoris_ledger.ledger_accounts(id),
  amount_cents bigint NOT NULL CHECK (amount_cents > 0),
  status text NOT NULL CHECK (status IN ('active','captured','released')),
  release_reason text,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  updated_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX outgoing_holds_active_account_idx
  ON vantoris_ledger.outgoing_funds_holds(ledger_account_id)
  WHERE status = 'active';

CREATE TABLE vantoris_ledger.audit_events (
  id bigserial PRIMARY KEY,
  actor_id text NOT NULL,
  action text NOT NULL,
  object_type text NOT NULL,
  object_id text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE INDEX audit_events_object_idx
  ON vantoris_ledger.audit_events(object_type, object_id, created_at);

-- Proposals are not permissions by themselves. The service must authorize
-- proposer and approver against Vantoris's server-side staff directory.
CREATE TABLE vantoris_ledger.staff_action_proposals (
  id uuid PRIMARY KEY,
  action_type text NOT NULL CHECK (action_type IN ('reverse_journal','change_limit','manual_journal')),
  object_reference text NOT NULL,
  proposed_by text NOT NULL,
  payload jsonb NOT NULL,
  status text NOT NULL CHECK (status IN ('pending','approved','rejected','executed')),
  created_at timestamptz NOT NULL DEFAULT clock_timestamp()
);
CREATE TABLE vantoris_ledger.staff_action_approvals (
  proposal_id uuid NOT NULL REFERENCES vantoris_ledger.staff_action_proposals(id),
  staff_id text NOT NULL,
  decision text NOT NULL CHECK (decision IN ('approve','reject')),
  decided_at timestamptz NOT NULL DEFAULT clock_timestamp(),
  PRIMARY KEY (proposal_id, staff_id)
);
CREATE INDEX staff_action_proposals_pending_idx
  ON vantoris_ledger.staff_action_proposals(created_at) WHERE status = 'pending';

REVOKE ALL ON ALL TABLES IN SCHEMA vantoris_ledger FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA vantoris_ledger FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA vantoris_ledger FROM PUBLIC;

COMMIT;
