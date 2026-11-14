import { MIGRATION_MANIFEST } from './migrationManifest.mjs';

let verifiedAt = 0;
let verificationPromise = null;
const CACHE_MS = 30_000;

export function validateVantorisMigrationRows(expected, actual) {
  if (!Array.isArray(actual) || actual.length !== expected.length) {
    throw new Error('VANTORIS_MIGRATION_HISTORY_COUNT_MISMATCH');
  }
  const byVersion = new Map(actual.map(row => [String(row.version), row]));
  for (const migration of expected) {
    const row = byVersion.get(migration.version);
    if (!row || row.filename !== migration.filename || row.checksum !== migration.checksum) {
      throw new Error('VANTORIS_MIGRATION_HISTORY_MISMATCH:' + migration.version);
    }
    byVersion.delete(migration.version);
  }
  if (byVersion.size) throw new Error('VANTORIS_MIGRATION_HISTORY_UNKNOWN');
  return true;
}

export async function assertVantorisMigrationHistory(sql) {
  if (Date.now() - verifiedAt < CACHE_MS) return true;
  if (!verificationPromise) {
    verificationPromise = (async () => {
      const rows = await sql.unsafe(
        'SELECT version,filename,checksum FROM public.vantoris_schema_migrations ORDER BY version',
      );
      validateVantorisMigrationRows(MIGRATION_MANIFEST, rows);
      verifiedAt = Date.now();
      return true;
    })().catch(error => {
      verifiedAt = 0;
      throw new Error('VANTORIS_MIGRATION_HISTORY_INVALID', { cause: error });
    }).finally(() => {
      verificationPromise = null;
    });
  }
  return verificationPromise;
}
