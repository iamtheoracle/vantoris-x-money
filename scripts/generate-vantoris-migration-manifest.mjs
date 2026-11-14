import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMigrationFiles } from './apply-vantoris-migrations.mjs';

const ROOT = join(fileURLToPath(new URL('..', import.meta.url)));
const FUNCTIONS_DIR = join(ROOT, 'netlify', 'functions');
const OUTPUT = join(FUNCTIONS_DIR, 'migrationManifest.mjs');

const manifest = loadMigrationFiles().map(({ version, filename, checksum }) => ({
  version,
  filename,
  checksum,
}));

mkdirSync(FUNCTIONS_DIR, { recursive: true });
writeFileSync(
  OUTPUT,
  'export const MIGRATION_MANIFEST = Object.freeze(' +
    JSON.stringify(manifest, null, 2) +
    ');\n',
  'utf8',
);

process.stdout.write('Generated Vantoris migration manifest for ' + manifest.length + ' migrations.\n');
