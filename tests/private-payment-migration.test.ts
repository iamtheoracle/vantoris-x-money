function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test('Vantoris ledger migration defines the institutional books', async () => {
  const sql = await Deno.readTextFile('migrations/001_avcu_payment_control_plane.sql');
  for (const table of ['members','ledger_accounts','journals','journal_entries','payment_operations','outgoing_funds_holds','audit_events','staff_action_proposals','staff_action_approvals']) {
    assert(sql.includes('CREATE TABLE vantoris_ledger.' + table), 'Missing Vantoris ledger table: ' + table);
  }
  assert(sql.includes("'member_liability','institutional_capital','internal_clearing','suspense'"), 'Capital and member liabilities must be distinct account types.');
  assert(sql.includes('DEFERRABLE INITIALLY DEFERRED'), 'Journal balance must be checked at transaction commit.');
  assert(sql.includes('line_count < 2 OR net_cents <> 0'), 'Journals require at least two balanced lines.');
  assert(sql.includes('reject_ledger_mutation'), 'Posted journals and entries must be immutable.');
  assert(!/provider_events|bank_receipts|payment_outbox|ACH|FEDWIRE|plaid|base44/i.test(sql), 'Institutional ledger schema must not depend on external payment providers.');
});

Deno.test('Vantoris runtime grants do not permit direct ledger mutation', async () => {
  const sql = await Deno.readTextFile('migrations/002_avcu_backend_grants.sql');
  assert(sql.includes('TO vantoris_backend'), 'Runtime grants must target Vantoris backend role.');
  assert(sql.includes('GRANT SELECT ON vantoris_ledger.members'), 'Runtime needs scoped member lookup.');
  assert(!/GRANT\s+[^;]*\b(INSERT|UPDATE|DELETE|TRUNCATE)\b[^;]*ON\s+vantoris_ledger\.(members|ledger_accounts|journals|journal_entries)/i.test(sql), 'Runtime must not directly mutate members, accounts or posted ledger rows.');
  assert(!/GRANT\s+ALL/i.test(sql), 'Runtime must not receive blanket privileges.');
});

Deno.test('Vantoris internal transfer is one atomic database operation', async () => {
  const sql = await Deno.readTextFile('migrations/003_avcu_outgoing_funds_holds.sql');
  for (const required of [
    'create_internal_transfer_operation','execute_internal_transfer',
    'FOR UPDATE','FOR SHARE','INSUFFICIENT_AVAILABLE_FUNDS',
    "status='captured'","status='posted'",'internal_transfer_posted',
    'GRANT EXECUTE ON FUNCTION vantoris_ledger.execute_internal_transfer',
  ]) assert(sql.includes(required), 'Missing transfer invariant: ' + required);
  assert(!/provider|plaid|ACH|FEDWIRE|base44/i.test(sql), 'Internal transfers must not call external rails.');
});

Deno.test('Vantoris audit rejects UPDATE, DELETE and TRUNCATE', async () => {
  const sql = await Deno.readTextFile('migrations/004_avcu_payment_audit_hardening.sql');
  assert(sql.includes('BEFORE UPDATE OR DELETE ON vantoris_ledger.audit_events'), 'Audit row mutation trigger missing.');
  assert(sql.includes('BEFORE TRUNCATE ON vantoris_ledger.audit_events'), 'Audit truncate trigger missing.');
  assert(sql.includes('REVOKE UPDATE, DELETE, TRUNCATE ON vantoris_ledger.audit_events FROM vantoris_backend'), 'Runtime audit mutation privileges must be revoked.');
});

Deno.test('Vantoris has no external payment projection outbox', async () => {
  const sql = await Deno.readTextFile('migrations/005_avcu_payment_outbox_claims.sql');
  assert(sql.includes('no provider outbox'), 'Migration must explicitly retire the provider projection outbox.');
  assert(!/CREATE TABLE|ALTER TABLE|payment_outbox|Base44|Plaid|ACH|FEDWIRE/i.test(sql), 'No provider outbox schema may be created.');
});

Deno.test('Vantoris identity and session records remain first-party', async () => {
  const sql = await Deno.readTextFile('migrations/006_vantoris_identity_and_sessions.sql');
  for (const table of ['staff_users','member_credentials','member_legacy_identities','auth_sessions','member_mfa_factors','staff_mfa_factors','member_identity_documents','member_identity_reviews']) {
    assert(sql.includes('CREATE TABLE vantoris_ledger.' + table), 'Missing Vantoris identity table: ' + table);
  }
  assert(sql.includes('secret_ciphertext bytea'), 'MFA secrets must be encrypted at rest.');
  assert(sql.includes('ciphertext bytea'), 'Identity documents must be encrypted at rest.');
  assert(sql.includes('source_system text NOT NULL'), 'Legacy identity crosswalk is required to preserve existing member identities.');
  assert(sql.includes('STAFF_SEPARATION_OF_DUTIES_REQUIRED'), 'A proposer must not approve their own staff action.');
});

Deno.test('Vantoris sessions enforce MFA and member-scoped PostgreSQL RLS', async () => {
  const auth = await Deno.readTextFile('migrations/006_vantoris_identity_and_sessions.sql');
  const rls = await Deno.readTextFile('migrations/007_vantoris_session_rls.sql');
  assert(auth.includes('c.email_verified_at IS NOT NULL'), 'Member session requires Vantoris-verified email.');
  assert(auth.includes('c.mfa_required=false OR s.mfa_verified_at IS NOT NULL'), 'Member session must satisfy MFA when required.');
  assert(auth.includes('s.mfa_verified_at IS NOT NULL AND u.status=\'active\''), 'Staff session must be active and MFA verified.');
  for (const table of ['members','ledger_accounts','journals','journal_entries','payment_operations','outgoing_funds_holds','audit_events']) {
    assert(rls.includes('ALTER TABLE vantoris_ledger.' + table + ' ENABLE ROW LEVEL SECURITY'), 'Missing RLS on ' + table);
  }
  assert(rls.includes('resolve_member_session'), 'Member session resolver must establish server-side member context.');
  assert(rls.includes('resolve_staff_session'), 'Staff session resolver must require a staff session.');
  assert(!/GRANT SELECT ON[^;]*auth_sessions/i.test(rls), 'Runtime must not directly read all raw session token hashes.');
});

Deno.test('Vantoris login throttling and CSRF checks are database-owned', async () => {
  const sql = await Deno.readTextFile('migrations/008_vantoris_auth_rate_limits.sql');
  assert(sql.includes('auth_login_attempts'), 'Login attempts must be stored by Vantoris.');
  assert(sql.includes("interval '15 minutes'"), 'Failed-login window and lock duration must be bounded.');
  assert(sql.includes('verify_auth_csrf'), 'State-changing member requests must verify session-bound CSRF.');
  assert(sql.includes('GRANT EXECUTE ON FUNCTION vantoris_ledger.record_login_failure'), 'Backend must use the database throttling function.');
});

Deno.test('Vantoris staff financial actions require independent capabilities and approval', async () => {
  const sql = await Deno.readTextFile('migrations/009_vantoris_staff_controls.sql');
  assert(sql.includes('staff_role_capabilities'), 'Staff capability registry missing.');
  assert(sql.includes('ledger.reverse.propose'), 'Reversal proposal capability missing.');
  assert(sql.includes('ledger.reverse.approve'), 'Independent reversal approval capability missing.');
  assert(sql.includes('ledger.manual_journal.propose'), 'Manual journal proposal capability missing.');
  assert(sql.includes('ledger.manual_journal.approve'), 'Independent manual journal approval capability missing.');
  assert(sql.includes('STAFF_SEPARATION_OF_DUTIES_REQUIRED') || sql.includes('staff_action_approval_separation'), 'Proposer must not approve their own action.');
  assert(sql.includes('staff_action_approvals_immutable'), 'Staff approvals must be append-only.');
  assert(sql.includes('protect_staff_proposal_changes'), 'Staff proposal payloads must be immutable.');
});

Deno.test('Vantoris permanent capital is separately protected and cannot be impaired', async () => {
  const sql = await Deno.readTextFile('migrations/010_vantoris_permanent_capital_protection.sql');
  assert(sql.includes('institutional_capital_policy_history'), 'Permanent capital floor history missing.');
  assert(sql.includes('CHECK(proposed_by_staff_id<>approved_by_staff_id)'), 'Capital floor must require two distinct staff members.');
  assert(sql.includes('PERMANENT_CAPITAL_FLOOR_CANNOT_BE_REDUCED'), 'Permanent capital floor cannot be lowered.');
  assert(sql.includes('PERMANENT_CAPITAL_IMPAIRMENT_BLOCKED'), 'A journal that impairs capital must be rejected.');
  assert(sql.includes('ledger_account_creation_capital_guard'), 'Member liabilities must not be opened before capital is funded.');
  assert(sql.includes('institutional_capital_policy_immutable'), 'Capital policy history must be append-only.');
});

Deno.test('Member transfer functions derive identity from a verified session token', async () => {
  const sql = await Deno.readTextFile('migrations/007_vantoris_session_rls.sql');
  assert(sql.includes('create_member_internal_transfer_operation'), 'Session-bound transfer claim function missing.');
  assert(sql.includes('execute_member_internal_transfer'), 'Session-bound transfer execution function missing.');
  assert(sql.includes('resolve_member_session(p_session_token_hash)'), 'Transfer actor must be resolved from the Vantoris session token.');
  assert(sql.includes('REVOKE EXECUTE ON FUNCTION vantoris_ledger.execute_internal_transfer'), 'Runtime must not call the transitional member-ID transfer function directly.');
});

Deno.test('Manual journals and reversals are posted only after independent approval', async () => {
  const sql = await Deno.readTextFile('migrations/011_vantoris_approved_journal_posting.sql');
  assert(sql.includes('post_approved_manual_journal'), 'Approved manual journal poster missing.');
  assert(sql.includes('post_approved_reversal'), 'Approved reversal poster missing.');
  assert(sql.includes('MANUAL_JOURNAL_SEPARATION_OF_DUTIES_REQUIRED'), 'Manual journal poster must differ from proposer.');
  assert(sql.includes('REVERSAL_SEPARATION_OF_DUTIES_REQUIRED'), 'Reversal poster must differ from proposer.');
  assert(sql.includes('INSERT INTO vantoris_ledger.journal_entries'), 'Staff actions must post ledger entries, not mutate balances.');
  assert(sql.includes("SET status='executed'"), 'Approved proposal must move through its executed lifecycle.');
});

Deno.test('Member transfer limits require dual approval and serialize concurrent requests', async () => {
  const sql = await Deno.readTextFile('migrations/012_vantoris_member_transfer_limits.sql');
  assert(sql.includes('member_transfer_limit_history'), 'Append-only member limit history missing.');
  assert(sql.includes('post_approved_limit_change'), 'Approved limit change poster missing.');
  assert(sql.includes('MEMBER_SINGLE_TRANSFER_LIMIT_EXCEEDED'), 'Single transfer limit check missing.');
  assert(sql.includes('MEMBER_DAILY_TRANSFER_LIMIT_EXCEEDED'), 'Daily transfer limit check missing.');
  assert(sql.includes('FOR UPDATE'), 'Per-member limit row must serialize concurrent transfer claims.');
  assert(sql.includes('MEMBER_TRANSFER_LIMIT_NOT_CONFIGURED'), 'No invented default limit may be assumed.');
});

Deno.test('Vantoris transfer limit changes require two-person approval and immutable history', async () => {
  const sql = await Deno.readTextFile('migrations/012_vantoris_member_transfer_limits.sql');
  assert(sql.includes('member_transfer_limit_history'), 'Member transfer limit history missing.');
  assert(sql.includes('post_approved_limit_change'), 'Approved limit posting function missing.');
  assert(sql.includes('MEMBER_SINGLE_TRANSFER_LIMIT_EXCEEDED'), 'Single limit enforcement missing.');
  assert(sql.includes('MEMBER_DAILY_TRANSFER_LIMIT_EXCEEDED'), 'Daily limit enforcement missing.');
  assert(sql.includes('MEMBER_TRANSFER_LIMIT_NOT_CONFIGURED'), 'Missing limits must fail closed.');
  assert(sql.includes('member_transfer_limit_history_immutable'), 'Limit history must be append-only.');
});
