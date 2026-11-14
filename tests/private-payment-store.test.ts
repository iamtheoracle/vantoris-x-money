function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

Deno.test('Vantoris transfer integration SQL exercises the atomic ledger lifecycle', async () => {
  const sql = await Deno.readTextFile('tests/postgres/vantoris-ledger.integration.sql');
  for (const invariant of [
    'create_internal_transfer_operation','execute_internal_transfer',
    'INSUFFICIENT_AVAILABLE_FUNDS','status','captured',
    'journal_entries','audit_events','ROLLBACK',
  ]) assert(sql.includes(invariant), 'Missing disposable PostgreSQL test assertion: ' + invariant);
  assert(sql.includes('SET CONSTRAINTS ALL IMMEDIATE'), 'Deferred journal checks must be forced before the disposable test rolls back.');
});

Deno.test('Vantoris transfer function uses a stable internal-only contract', async () => {
  const sql = await Deno.readTextFile('migrations/003_avcu_outgoing_funds_holds.sql');
  assert(sql.includes('CREATE OR REPLACE FUNCTION vantoris_ledger.execute_internal_transfer'), 'Atomic transfer function missing.');
  assert(sql.includes('CREATE OR REPLACE FUNCTION vantoris_ledger.create_internal_transfer_operation'), 'Idempotency claim function missing.');
  assert(!/plaid|ACH|FEDWIRE|provider|bank|base44/i.test(sql), 'Transfer SQL must remain independent of outside networks.');
});
