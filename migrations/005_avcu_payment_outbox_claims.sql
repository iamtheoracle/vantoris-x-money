-- VANTORIS migration 005: intentionally no provider outbox.
-- Internal ledger posting is final in the database transaction. No projection
-- to Base44, bank, processor, card network or external service is required.
BEGIN;
COMMENT ON SCHEMA vantoris_ledger IS
  'Vantoris-owned institutional ledger. Internal member transfers are posted locally; no provider outbox exists.';
COMMIT;
