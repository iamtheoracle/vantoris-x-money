import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  sha256,
  stripTransactionBoundaries,
  loadMigrationFiles,
  validateHistoryRows,
} from '../scripts/apply-vantoris-migrations.mjs';

test('migration transaction boundaries are stripped without altering SQL body', () => {
  const source = '-- test migration\nBEGIN;\nCREATE TABLE example(id integer);\nCOMMIT;\n';
  assert.equal(stripTransactionBoundaries(source, '001_test.sql'), '\nCREATE TABLE example(id integer);\n');
});

test('migration transaction boundary parser fails closed', () => {
  assert.throws(() => stripTransactionBoundaries('CREATE TABLE example(id integer);'), /outer BEGIN/);
  assert.throws(() => stripTransactionBoundaries('BEGIN;\nCREATE TABLE example(id integer);'), /outer BEGIN/);
  assert.throws(() => stripTransactionBoundaries('BEGIN;\nCREATE TABLE example(id integer);\nCOMMIT;\nSELECT 1;'), /SQL after its outer COMMIT/);
});

test('migration files are discovered in a contiguous version sequence', () => {
  const directory = mkdtempSync(join(tmpdir(), 'vantoris-migrations-'));
  try {
    writeFileSync(join(directory, '000_vantoris_migration_history.sql'), 'BEGIN;\nSELECT 0;\nCOMMIT;\n');
    writeFileSync(join(directory, '001_first.sql'), 'BEGIN;\nSELECT 1;\nCOMMIT;\n');
    writeFileSync(join(directory, '002_second.sql'), 'BEGIN;\nSELECT 2;\nCOMMIT;\n');
    const migrations = loadMigrationFiles(directory);
    assert.deepEqual(migrations.map(item => item.version), ['000', '001', '002']);
    assert.equal(migrations[1].checksum, sha256(migrations[1].content));
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('migration file sequence gaps are rejected', () => {
  const directory = mkdtempSync(join(tmpdir(), 'vantoris-migration-gap-'));
  try {
    writeFileSync(join(directory, '000_vantoris_migration_history.sql'), 'BEGIN;\nSELECT 0;\nCOMMIT;\n');
    writeFileSync(join(directory, '002_second.sql'), 'BEGIN;\nSELECT 2;\nCOMMIT;\n');
    assert.throws(() => loadMigrationFiles(directory), /SEQUENCE_GAP:001/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test('migration history verification rejects missing, changed and unknown rows', () => {
  const expected = [
    { version: '000', filename: '000_history.sql', checksum: 'a'.repeat(64) },
    { version: '001', filename: '001_first.sql', checksum: 'b'.repeat(64) },
  ];
  assert.equal(validateHistoryRows(expected, expected), true);
  assert.throws(() => validateHistoryRows(expected, [expected[0]]), /HISTORY_MISSING:001/);
  assert.throws(() => validateHistoryRows(expected, [
    expected[0],
    { ...expected[1], checksum: 'c'.repeat(64) },
  ]), /HISTORY_MISMATCH:001/);
  assert.throws(() => validateHistoryRows(expected, [
    ...expected,
    { version: '999', filename: '999_unknown.sql', checksum: 'd'.repeat(64) },
  ]), /HISTORY_UNKNOWN:999/);
});
