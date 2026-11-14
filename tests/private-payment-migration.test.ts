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
