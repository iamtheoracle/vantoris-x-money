import postgres from 'postgres';
import {
  createDecipheriv, createHash, createHmac, randomBytes,
  scrypt, timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt);
let sql;

function database() {
  if (sql) return sql;
  const url = process.env.VANTORIS_LEDGER_DATABASE_URL;
  if (!url) throw new Error('VANTORIS_LEDGER_DATABASE_URL is not configured');
  const parsed = new URL(url);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('Vantoris ledger URL must use PostgreSQL');
  sql = postgres(url, {
    ssl: process.env.VANTORIS_DATABASE_SSL === 'disable' ? false : 'require',
    max: 8,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => {},
  });
  return sql;
}

const sha256 = (value) => createHash('sha256').update(value).digest();
const json = (body, status = 200, cookies = []) => {
  const headers = new Headers({
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'pragma': 'no-cache',
  });
  for (const cookie of cookies) headers.append('set-cookie', cookie);
  return new Response(JSON.stringify(body), { status, headers });
};

function cookies(request) {
  const result = {};
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return result;
}

const sessionCookie = (value, maxAge) =>
  `__Host-vantoris_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const csrfCookie = (value, maxAge) =>
  `__Host-vantoris_csrf=${value}; Path=/; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const clearCookies = [
  '__Host-vantoris_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
  '__Host-vantoris_csrf=; Path=/; Secure; SameSite=Strict; Max-Age=0',
];

function base32Decode(value) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = String(value).toUpperCase().replace(/=+|\s+/g, '');
  let bits = 0, buffer = 0;
  const output = [];
  for (const character of clean) {
    const digit = alphabet.indexOf(character);
    if (digit < 0) throw new Error('INVALID_MFA_SECRET');
    buffer = (buffer << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      output.push((buffer >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(output);
}

function decryptMfaSecret(row) {
  const key = Buffer.from(process.env.VANTORIS_MFA_ENCRYPTION_KEY || '', 'base64');
  if (key.length !== 32) throw new Error('VANTORIS_MFA_ENCRYPTION_KEY must be a 32-byte base64 key');
  const decipher = createDecipheriv('aes-256-gcm', key, row.nonce);
  decipher.setAuthTag(row.auth_tag);
  const plaintext = Buffer.concat([decipher.update(row.secret_ciphertext), decipher.final()]);
  return base32Decode(plaintext.toString('utf8'));
}

function verifyTotp(secret, suppliedCode, now = Date.now()) {
  if (!/^\d{6}$/.test(String(suppliedCode || ''))) return false;
  const supplied = Buffer.from(String(suppliedCode));
  const counter = Math.floor(now / 30000);
  for (let drift = -1; drift <= 1; drift += 1) {
    const moving = Buffer.alloc(8);
    moving.writeBigUInt64BE(BigInt(counter + drift));
    const digest = createHmac('sha1', secret).update(moving).digest();
    const offset = digest[digest.length - 1] & 0x0f;
    const binary = ((digest[offset] & 0x7f) << 24) |
      ((digest[offset + 1] & 0xff) << 16) |
      ((digest[offset + 2] & 0xff) << 8) |
      (digest[offset + 3] & 0xff);
    const expected = Buffer.from(String(binary % 1000000).padStart(6, '0'));
    if (timingSafeEqual(expected, supplied)) return true;
  }
  return false;
}

async function verifyPassword(password, encoded) {
  const parts = String(encoded || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const N = Number(parts[1]), r = Number(parts[2]), p = Number(parts[3]);
  const salt = Buffer.from(parts[4], 'base64');
  const expected = Buffer.from(parts[5], 'base64');
  if (!Number.isInteger(N) || N < 16384 || N > 131072 || !Number.isInteger(r) || r < 1 || r > 16 ||
      !Number.isInteger(p) || p < 1 || p > 4 || salt.length < 16 || expected.length !== 64) return false;
  const actual = await scryptAsync(password, salt, expected.length, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return timingSafeEqual(Buffer.from(actual), expected);
}

async function dummyPasswordWork(password) {
  const salt = Buffer.from('dmFudG9yaXMtaW52YWxpZC1sb2dpbi1zYWx0');
  await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
}

function clientFingerprint(request) {
  const ip = request.headers.get('x-nf-client-connection-ip') ||
    (request.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown';
  return sha256(ip);
}

async function readBody(request) {
  const length = Number(request.headers.get('content-length') || 0);
  if (length > 16000) throw new Error('REQUEST_TOO_LARGE');
  const raw = await request.text();
  if (Buffer.byteLength(raw) > 16000) throw new Error('REQUEST_TOO_LARGE');
  return JSON.parse(raw || '{}');
}

async function login(request, body) {
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  const password = typeof body.password === 'string' ? body.password : '';
  const otp = typeof body.otp === 'string' ? body.otp.trim() : '';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 1 || password.length > 1024) {
    return json({ error: 'invalid_credentials', message: 'The email or password is incorrect.' }, 401);
  }

  const db = database();
  const emailFingerprint = sha256(email);
  const ipFingerprint = clientFingerprint(request);
  const locked = await db`SELECT vantoris_ledger.is_login_locked(${emailFingerprint},${ipFingerprint}) AS locked`;
  if (locked[0]?.locked) return json({ error: 'login_temporarily_locked', message: 'Sign-in is temporarily locked. Please try again later.' }, 429);

  const result = await db.begin(async tx => {
    const rows = await tx`
      SELECT c.member_id,c.email,c.password_hash,c.mfa_required,c.email_verified_at,
             c.password_reset_required,m.member_reference,m.status
        FROM vantoris_ledger.member_credentials c
        JOIN vantoris_ledger.members m ON m.id=c.member_id
       WHERE lower(c.email)=${email}
       FOR UPDATE OF c
    `;
    const member = rows[0];
    if (!member || member.status !== 'active') {
      await dummyPasswordWork(password);
      await tx`SELECT vantoris_ledger.record_login_failure(${emailFingerprint},${ipFingerprint})`;
      return { error: 'invalid' };
    }

    const validPassword = await verifyPassword(password, member.password_hash);
    if (!validPassword || !member.email_verified_at || member.password_reset_required) {
      await tx`SELECT vantoris_ledger.record_login_failure(${emailFingerprint},${ipFingerprint})`;
      return { error: 'invalid' };
    }

    let mfaVerifiedAt = null;
    if (member.mfa_required) {
      const factors = await tx`
        SELECT secret_ciphertext,nonce,auth_tag
          FROM vantoris_ledger.member_mfa_factors
         WHERE member_id=${member.member_id} AND verified_at IS NOT NULL AND disabled_at IS NULL
         ORDER BY enrolled_at DESC LIMIT 1
      `;
      if (!factors.length) return { error: 'mfa_enrollment_required' };
      if (!otp) return { error: 'mfa_required' };
      let secret;
      try { secret = decryptMfaSecret(factors[0]); }
      catch { return { error: 'mfa_unavailable' }; }
      if (!verifyTotp(secret, otp)) {
        await tx`SELECT vantoris_ledger.record_login_failure(${emailFingerprint},${ipFingerprint})`;
        return { error: 'invalid' };
      }
      mfaVerifiedAt = new Date();
    }

    const sessionToken = randomBytes(32).toString('base64url');
    const csrfToken = randomBytes(32).toString('base64url');
    const tokenHash = sha256(sessionToken);
    const csrfHash = sha256(csrfToken);
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
    await tx`
      SELECT vantoris_ledger.create_member_session(
        ${member.member_id},${tokenHash},${csrfHash},${expiresAt},${mfaVerifiedAt}
      )
    `;
    await tx`SELECT vantoris_ledger.clear_login_failures(${emailFingerprint},${ipFingerprint})`;
    return {
      member: { id: member.member_id, memberReference: member.member_reference, email: member.email, status: member.status, role: 'member' },
      sessionToken,
      csrfToken,
    };
  });

  if (result.error === 'mfa_required') return json({ error: 'mfa_required', message: 'Enter the current code from your authenticator.' }, 200);
  if (result.error === 'mfa_enrollment_required') return json({ error: 'mfa_enrollment_required', message: 'Your Vantoris security setup must be completed before sign-in.' }, 403);
  if (result.error === 'mfa_unavailable') return json({ error: 'mfa_unavailable', message: 'Vantoris could not verify your security factor. Contact member support.' }, 503);
  if (result.error) return json({ error: 'invalid_credentials', message: 'The email or password is incorrect.' }, 401);

  return json({ member: result.member }, 200, [
    sessionCookie(result.sessionToken, 43200),
    csrfCookie(result.csrfToken, 43200),
  ]);
}

async function authenticateMember(request, tx) {
  const cookie = cookies(request);
  const token = cookie.__Host-vantoris_session;
  if (!token || token.length > 200) return null;
  const tokenHash = sha256(token);
  const resolved = await tx`SELECT vantoris_ledger.resolve_member_session(${tokenHash}) AS member_id`;
  return resolved[0]?.member_id ? { memberId: resolved[0].member_id, tokenHash, cookie } : null;
}

async function verifyCsrf(request, tx, auth) {
  const csrf = auth.cookie.__Host-vantoris_csrf || '';
  const header = request.headers.get('x-csrf-token') || '';
  if (!csrf || !header || csrf.length > 200 || header !== csrf) return false;
  const csrfHash = sha256(csrf);
  const rows = await tx`SELECT vantoris_ledger.verify_auth_csrf(${auth.tokenHash},${csrfHash}) AS valid`;
  return rows[0]?.valid === true;
}

async function currentMember(request) {
  return await database().begin(async tx => {
    const auth = await authenticateMember(request, tx);
    if (!auth) return null;
    const rows = await tx`
      SELECT m.id,m.member_reference,m.status,c.email
        FROM vantoris_ledger.members m
        JOIN vantoris_ledger.member_credentials c ON c.member_id=m.id
       WHERE m.id=${auth.memberId}
    `;
    if (!rows.length) return null;
    const accounts = await tx`
      SELECT a.id,a.account_reference,a.account_type,a.currency,
             CASE WHEN COALESCE(e.entry_count,0)=0 THEN NULL ELSE e.posted_balance_cents END AS posted_balance_cents,
             CASE WHEN COALESCE(e.entry_count,0)=0 THEN NULL ELSE e.posted_balance_cents-COALESCE(h.active_hold_cents,0) END AS available_balance_cents,
             COALESCE(h.active_hold_cents,0) AS active_hold_cents
        FROM vantoris_ledger.ledger_accounts a
        LEFT JOIN LATERAL (
          SELECT count(*) AS entry_count,-sum(amount_cents) AS posted_balance_cents
            FROM vantoris_ledger.journal_entries WHERE ledger_account_id=a.id
        ) e ON true
        LEFT JOIN LATERAL (
          SELECT sum(amount_cents) AS active_hold_cents
            FROM vantoris_ledger.outgoing_funds_holds WHERE ledger_account_id=a.id AND status='active'
        ) h ON true
       WHERE a.member_id=${auth.memberId}
       ORDER BY a.created_at,a.id
    `;
    return {
      member: { id: rows[0].id, memberReference: rows[0].member_reference, email: rows[0].email, status: rows[0].status, role: 'member' },
      accounts: accounts.map(account => ({
        id: account.id,
        accountReference: account.account_reference,
        accountType: account.account_type,
        currency: account.currency,
        postedBalanceCents: account.posted_balance_cents === null ? null : Number(account.posted_balance_cents),
        availableBalanceCents: account.available_balance_cents === null ? null : Number(account.available_balance_cents),
        activeHoldCents: Number(account.active_hold_cents || 0),
      })),
    };
  });
}

async function transfer(request, body) {
  const source = typeof body.sourceAccountReference === 'string' ? body.sourceAccountReference.trim() : '';
  const receiver = typeof body.receiverAccountReference === 'string' ? body.receiverAccountReference.trim() : '';
  const amountCents = body.amountCents;
  const idempotencyKey = request.headers.get('idempotency-key') || body.idempotencyKey || '';
  if (!source || !receiver || source.length > 160 || receiver.length > 160 ||
      !Number.isSafeInteger(amountCents) || amountCents <= 0 ||
      typeof idempotencyKey !== 'string' || idempotencyKey.length < 8 || idempotencyKey.length > 160) {
    return json({ error: 'invalid_transfer_request' }, 400);
  }

  const db = database();
  const outcome = await db.begin(async tx => {
    const auth = await authenticateMember(request, tx);
    if (!auth) return { error: 'unauthorized' };
    if (!await verifyCsrf(request, tx, auth)) return { error: 'csrf_invalid' };
    const canonical = JSON.stringify({
      memberId: auth.memberId,
      sourceAccountReference: source,
      receiverAccountReference: receiver,
      amountCents,
    });
    const requestHash = sha256(canonical).toString('hex');
    const operationId = crypto.randomUUID();
    const claim = await tx`
      SELECT * FROM vantoris_ledger.create_internal_transfer_operation(
        ${operationId},${auth.memberId},${source},${receiver},${amountCents},${idempotencyKey},${requestHash}
      )
    `;
    const posted = await tx`
      SELECT * FROM vantoris_ledger.execute_internal_transfer(
        ${claim[0].operation_id},${auth.memberId}
      )
    `;
    return { journalId: posted[0].journal_id, duplicate: posted[0].duplicate };
  });

  if (outcome.error === 'unauthorized') return json({ error: 'authentication_required' }, 401);
  if (outcome.error === 'csrf_invalid') return json({ error: 'csrf_invalid' }, 403);
  return json({ transfer: { journalId: outcome.journalId, duplicate: outcome.duplicate, status: 'posted' } }, 200);
}

export default async function handler(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'me';
  if (request.method === 'GET' && action === 'me') {
    try {
      const data = await currentMember(request);
      return data ? json(data) : json({ error: 'authentication_required' }, 401);
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('MEMBER_SESSION_INVALID')) return json({ error: 'authentication_required' }, 401);
      console.error('Vantoris member session check failed:', message.slice(0, 120));
      return json({ error: 'member_service_unavailable' }, 503);
    }
  }

  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  let body;
  try { body = await readBody(request); }
  catch (error) { return json({ error: error.message === 'REQUEST_TOO_LARGE' ? 'request_too_large' : 'invalid_json' }, error.message === 'REQUEST_TOO_LARGE' ? 413 : 400); }

  try {
    if (body.action === 'login') return await login(request, body);
    if (body.action === 'logout') {
      const result = await database().begin(async tx => {
        const auth = await authenticateMember(request, tx);
        if (!auth) return { revoked: false };
        if (!await verifyCsrf(request, tx, auth)) return { csrfInvalid: true };
        const rows = await tx`SELECT vantoris_ledger.revoke_auth_session(${auth.tokenHash}) AS revoked`;
        return { revoked: rows[0]?.revoked === true };
      });
      if (result.csrfInvalid) return json({ error: 'csrf_invalid' }, 403);
      return json({ ok: true }, 200, clearCookies);
    }
    if (body.action === 'transfer') return await transfer(request, body);
    return json({ error: 'unknown_action' }, 400);
  } catch (error) {
    const message = String(error?.message || '');
    if (message.includes('INSUFFICIENT_AVAILABLE_FUNDS')) return json({ error: 'insufficient_available_funds' }, 409);
    if (message.includes('TRANSFER_IDEMPOTENCY_CONFLICT')) return json({ error: 'idempotency_conflict' }, 409);
    if (message.includes('TRANSFER_OPERATION_NOT_OWNED_BY_MEMBER')) return json({ error: 'forbidden' }, 403);
    console.error('Vantoris member auth operation failed:', message.slice(0, 160));
    return json({ error: 'member_service_unavailable' }, 503);
  }
}
