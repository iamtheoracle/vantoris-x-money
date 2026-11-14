import test from 'node:test';
import assert from 'node:assert/strict';
import { MIGRATION_MANIFEST } from '../netlify/functions/migrationManifest.mjs';
import { validateVantorisMigrationRows, assertVantorisMigrationHistory } from '../netlify/functions/migration-guard.mjs';

test('runtime manifest has the bootstrap and every versioned migration', () => {
  assert.equal(MIGRATION_MANIFEST[0].version, '000');
  assert.equal(MIGRATION_MANIFEST.length, 24);
  assert.equal(MIGRATION_MANIFEST.at(-1).version, '023');
  assert(MIGRATION_MANIFEST.every(row => /^[a-f0-9]{64}$/.test(row.checksum)));
});

test('runtime history validation rejects missing, changed and unknown migrations', () => {
  assert.equal(validateVantorisMigrationRows(MIGRATION_MANIFEST, MIGRATION_MANIFEST), true);
  assert.throws(() => validateVantorisMigrationRows(MIGRATION_MANIFEST, MIGRATION_MANIFEST.slice(1)), /COUNT_MISMATCH/);
  const changed = MIGRATION_MANIFEST.map(row => ({ ...row }));
  changed[1].checksum = 'f'.repeat(64);
  assert.throws(() => validateVantorisMigrationRows(MIGRATION_MANIFEST, changed), /HISTORY_MISMATCH:001/);
  const extra = [...MIGRATION_MANIFEST, { version: '999', filename: '999_extra.sql', checksum: 'e'.repeat(64) }];
  assert.throws(() => validateVantorisMigrationRows(MIGRATION_MANIFEST, extra), /COUNT_MISMATCH/);
});

test('database startup guard refuses an absent or inconsistent history table', async () => {
  const guard = await import('../netlify/functions/migration-guard.mjs?missing-history');
  await assert.rejects(
    () => guard.assertVantorisMigrationHistory({ unsafe: async () => [] }),
    /VANTORIS_MIGRATION_HISTORY_INVALID/,
  );
  const mismatchGuard = await import('../netlify/functions/migration-guard.mjs?checksum-mismatch');
  const mismatch = MIGRATION_MANIFEST.map(row => ({ ...row }));
  mismatch[0].checksum = '0'.repeat(64);
  await assert.rejects(
    () => mismatchGuard.assertVantorisMigrationHistory({ unsafe: async () => mismatch }),
    /VANTORIS_MIGRATION_HISTORY_INVALID/,
  );
});
