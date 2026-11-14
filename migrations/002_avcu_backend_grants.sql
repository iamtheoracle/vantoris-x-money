-- VANTORIS migration 002: least-privilege runtime grants.
-- A DBA creates vantoris_backend as a LOGIN, NOSUPERUSER, NOCREATEDB,
-- NOCREATEROLE role with a server-only password before this migration. Only the server receives credentials.
BEGIN;
GRANT USAGE ON SCHEMA vantoris_ledger TO vantoris_backend;
GRANT SELECT ON vantoris_ledger.members, vantoris_ledger.ledger_accounts,
  vantoris_ledger.journals, vantoris_ledger.journal_entries,
  vantoris_ledger.outgoing_funds_holds, vantoris_ledger.audit_events
TO vantoris_backend;
GRANT SELECT, INSERT ON vantoris_ledger.payment_operations TO vantoris_backend;
GRANT SELECT ON vantoris_ledger.staff_action_proposals,
  vantoris_ledger.staff_action_approvals TO vantoris_backend;
GRANT USAGE, SELECT ON SEQUENCE vantoris_ledger.audit_events_id_seq TO vantoris_backend;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON
  vantoris_ledger.members, vantoris_ledger.ledger_accounts,
  vantoris_ledger.journals, vantoris_ledger.journal_entries,
  vantoris_ledger.audit_events
FROM vantoris_backend;
COMMIT;
