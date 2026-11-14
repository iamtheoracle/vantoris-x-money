import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION_DIR = join(ROOT, 'migrations');

export function sha256(content) {
  return createHash('sha256').update(content).digest('hex');
}

export function stripTransactionBoundaries(content, filename = 'migration.sql') {
  const beginIndex = content.indexOf('BEGIN;');
  const commitIndex = content.lastIndexOf('COMMIT;');
  if (beginIndex < 0 || commitIndex <= beginIndex) {
    throw new Error(filename + ' must contain one outer BEGIN; and COMMIT; boundary');
  }
  const trailing = content.slice(commitIndex + 'COMMIT;'.length).replace(/^\s*--.*$/gm, '').trim();
  if (trailing) throw new Error(filename + ' contains SQL after its outer COMMIT');
  return content.slice(beginIndex + 'BEGIN;'.length, commitIndex);
}

export function loadMigrationFiles(directory = MIGRATION_DIR) {
  const names = readdirSync(directory)
    .filter(name => /^\d{3}_[a-z0-9_]+\.sql$/i.test(name))
    .sort((a, b) => Number(a.slice(0, 3)) - Number(b.slice(0, 3)));
  const migrations = names.map(filename => {
    const content = readFileSync(join(directory, filename), 'utf8');
    return {
      version: filename.slice(0, 3),
      filename,
      content,
      checksum: sha256(content),
    };
  });
  if (!migrations.length || migrations[0].version !== '000') {
    throw new Error('VANTORIS_MIGRATION_BOOTSTRAP_MISSING');
  }
  for (let index = 1; index < migrations.length; index += 1) {
    const expected = String(index).padStart(3, '0');
    if (migrations[index].version !== expected) {
      throw new Error('VANTORIS_MIGRATION_SEQUENCE_GAP:' + expected);
    }
  }
  const versions = new Set(migrations.map(item => item.version));
  if (versions.size !== migrations.length) throw new Error('VANTORIS_MIGRATION_VERSION_DUPLICATE');
  return migrations;
}

export function validateHistoryRows(expected, actual) {
  const byVersion = new Map(actual.map(row => [row.version, row]));
  for (const migration of expected) {
    const row = byVersion.get(migration.version);
    if (!row) throw new Error('VANTORIS_MIGRATION_HISTORY_MISSING:' + migration.version);
    if (row.filename !== migration.filename || row.checksum !== migration.checksum) {
      throw new Error('VANTORIS_MIGRATION_HISTORY_MISMATCH:' + migration.version);
    }
    byVersion.delete(migration.version);
  }
  if (byVersion.size) {
    throw new Error('VANTORIS_MIGRATION_HISTORY_UNKNOWN:' + [...byVersion.keys()].join(','));
  }
  return true;
}

function connectionString() {
  const value = process.env.VANTORIS_LEDGER_DATABASE_URL || process.env.DATABASE_URL;
  if (!value) throw new Error('VANTORIS_LEDGER_DATABASE_URL_OR_DATABASE_URL_REQUIRED');
  return value;
}

function psql(query, tuples = false) {
  const args = ['-X', '-q', '-v', 'ON_ERROR_STOP=1'];
  if (tuples) args.push('-t', '-A', '-F', '|');
  args.push(connectionString(), '-c', query);
  return execFileSync('psql', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit'],
    maxBuffer: 16 * 1024 * 1024,
  }).trim();
}

function sqlLiteral(value) {
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function readHistoryRows() {
  const output = psql(
    'SELECT version,filename,checksum FROM public.vantoris_schema_migrations ORDER BY version',
    true,
  );
  if (!output) return [];
  return output.split(/\r?\n/).filter(Boolean).map(line => {
    const [version, filename, checksum] = line.split('|');
    return { version, filename, checksum };
  });
}

function historyTableExists() {
  return psql("SELECT COALESCE(to_regclass('public.vantoris_schema_migrations')::text,'')", true) !== '';
}

function applyMigration(migration) {
  const body = stripTransactionBoundaries(migration.content, migration.filename);
  const query = [
    'BEGIN;',
    body,
    'INSERT INTO public.vantoris_schema_migrations(version,filename,checksum)',
    'VALUES (' + [
      sqlLiteral(migration.version),
      sqlLiteral(migration.filename),
      sqlLiteral(migration.checksum),
    ].join(',') + ');',
    'COMMIT;',
  ].join('\n');
  psql(query);
}

export async function applyVantorisMigrations({ verifyOnly = process.argv.includes('--verify-only') } = {}) {
  const migrations = loadMigrationFiles();
  const bootstrap = migrations[0];

  if (!historyTableExists()) {
    if (verifyOnly) throw new Error('VANTORIS_MIGRATION_HISTORY_TABLE_MISSING');
    applyMigration(bootstrap);
  } else {
    const bootstrapRow = readHistoryRows().find(row => row.version === '000');
    if (!bootstrapRow) {
      throw new Error('VANTORIS_MIGRATION_HISTORY_BASELINE_REQUIRED');
    }
    validateHistoryRows([bootstrap], [bootstrapRow]);
  }

  for (const migration of migrations.slice(1)) {
    const rows = readHistoryRows();
    const existing = rows.find(row => row.version === migration.version);
    if (existing) {
      validateHistoryRows([migration], [existing]);
      continue;
    }
    if (verifyOnly) throw new Error('VANTORIS_MIGRATION_HISTORY_MISSING:' + migration.version);
    const later = rows.find(row => row.version > migration.version);
    if (later) {
      throw new Error('VANTORIS_MIGRATION_HISTORY_GAP:' + migration.version + ':before:' + later.version);
    }
    applyMigration(migration);
  }

  validateHistoryRows(migrations, readHistoryRows());
  return { applied: migrations.length, versions: migrations.map(item => item.version) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  applyVantorisMigrations()
    .then(result => {
      process.stdout.write('Vantoris migrations verified: ' + result.applied + ' ordered checksums.\n');
    })
    .catch(error => {
      process.stderr.write(String(error?.stack || error) + '\n');
      process.exitCode = 1;
    });
}
