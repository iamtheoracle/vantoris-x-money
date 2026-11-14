import test from 'node:test';
import assert from 'node:assert/strict';
import { scryptSync } from 'node:crypto';
import { base32Decode, verifyPassword, verifyTotp, verifyTotpStep } from '../netlify/functions/member-auth.mjs';

test('TOTP verifier accepts the RFC 6238 SHA-1 six-digit vector', () => {
  const secret = Buffer.from('12345678901234567890');
  assert.equal(verifyTotp(secret, '287082', 59000), true);
  assert.equal(verifyTotp(secret, '287083', 59000), false);
  assert.equal(verifyTotpStep(secret, '287082', 59000), 1);
  assert.equal(verifyTotpStep(secret, '287083', 59000), null);
});

test('Base32 decoder rejects invalid alphabet characters', () => {
  assert.throws(() => base32Decode('NOT*BASE32'));
});

test('Scrypt password verifier checks parameters and constant-time digest equality', async () => {
  const password = 'Vantoris-test-password-2030!';
  const salt = Buffer.from('0123456789abcdef0123456789abcdef');
  const derived = scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  const encoded = ['scrypt','16384','8','1',salt.toString('base64'),derived.toString('base64')].join('$');
  assert.equal(await verifyPassword(password, encoded), true);
  assert.equal(await verifyPassword('incorrect-password', encoded), false);
  assert.equal(await verifyPassword(password, 'invalid-hash'), false);
});
