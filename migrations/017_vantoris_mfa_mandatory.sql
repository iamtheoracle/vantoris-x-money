-- VANTORIS migration 017: MFA is mandatory for every member and staff principal.
BEGIN;
ALTER TABLE vantoris_ledger.member_credentials ADD CONSTRAINT member_credentials_mfa_required_true CHECK (mfa_required IS TRUE);
ALTER TABLE vantoris_ledger.staff_users ADD CONSTRAINT staff_users_mfa_required_true CHECK (mfa_required IS TRUE);
COMMIT;
