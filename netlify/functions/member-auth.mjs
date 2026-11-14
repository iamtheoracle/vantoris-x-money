import postgres from 'postgres';
import {
  createCipheriv, createDecipheriv, createHash, createHmac, randomBytes,
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

function centsToDecimal(value) {
  const cents = BigInt(String(value));
  const negative = cents < 0n;
  const absolute = negative ? -cents : cents;
  const whole = absolute / 100n;
  const fraction = String(absolute % 100n).padStart(2, '0');
  return `${negative ? '-' : ''}${whole.toString()}.${fraction}`;
}
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
    try { result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim()); }
    catch { /* Ignore malformed cookies; authentication will fail closed. */ }
  }
  return result;
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

const sessionCookie = (value, maxAge) =>
  `__Host-vantoris_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const csrfCookie = (value, maxAge) =>
  `__Host-vantoris_csrf=${value}; Path=/; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const mfaChallengeCookie = (value) => `__Host-vantoris_mfa_challenge=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=600`;
const mfaCsrfCookie = (value) => `__Host-vantoris_mfa_csrf=${value}; Path=/; Secure; SameSite=Strict; Max-Age=600`;
const clearMfaCookies = [
  '__Host-vantoris_mfa_challenge=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
  '__Host-vantoris_mfa_csrf=; Path=/; Secure; SameSite=Strict; Max-Age=0',
];
const clearCookies = [
  '__Host-vantoris_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
  '__Host-vantoris_csrf=; Path=/; Secure; SameSite=Strict; Max-Age=0',
];

function base32Encode(bytes) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = 0, buffer = 0, output = '';
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(buffer >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) output += alphabet[(buffer << (5 - bits)) & 31];
  return output;
}

function validateNewPassword(password) {
  return typeof password === 'string' && password.length >= 12 && password.length <= 256 &&
    /[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);
}

async function hashNewPassword(password) {
  if (!validateNewPassword(password)) throw new Error('PASSWORD_POLICY_FAILED');
  const salt = randomBytes(16);
  const derived = await scryptAsync(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1${salt.toString('base64')}${Buffer.from(derived).toString('base64')}`;
}

async function startMfaEnrollment(memberId, email) {
  const key = Buffer.from(process.env.VANTORIS_MFA_ENCRYPTION_KEY || '', 'base64');
  if (key.length !== 32) throw new Error('VANTORIS_MFA_ENCRYPTION_KEY must be a 32-byte base64 key');
  const secret = base32Encode(randomBytes(20));
  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, nonce);
  const ciphertext = Buffer.concat([cipher.update(Buffer.from(secret, 'utf8')), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const challenge = randomBytes(32).toString('base64url');
  const csrf = randomBytes(32).toString('base64url');
  const factorId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
  await database().begin(async tx => {
    await tx`SELECT vantoris_ledger.begin_member_mfa_enrollment(
      ${memberId},${sha256(challenge)},${factorId},${ciphertext},${nonce},${authTag},1,${expiresAt}
    )`;
  });
  const label = encodeURIComponent('Vantoris:' + email);
  const issuer = encodeURIComponent('Vantoris');
  const otpauthUri = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`;
  return json({
    error: 'mfa_setup_required',
    message: 'Set up your Vantoris authenticator, then enter its current six-digit code.',
    mfaSetup: { secret, otpauthUri },
  }, 200, [mfaChallengeCookie(challenge), mfaCsrfCookie(csrf)]);
}

async function confirmMfaEnrollment(request, body) {
  const cookie = cookies(request);
  const challenge = cookie.__Host-vantoris_mfa_challenge || '';
  const csrf = cookie.__Host-vantoris_mfa_csrf || '';
  const header = request.headers.get('x-csrf-token') || '';
  if (!challenge || !csrf || !header || csrf.length !== header.length ||
      !timingSafeEqual(Buffer.from(csrf), Buffer.from(header))) {
    return json({ error: 'csrf_invalid' }, 403);
  }
  const challengeHash = sha256(challenge);
  const factors = await database()`SELECT * FROM vantoris_ledger.get_member_mfa_enrollment_factor(${challengeHash})`;
  if (!factors.length) return json({ error: 'mfa_enrollment_expired' }, 401);
  let secret;
  try { secret = decryptMfaSecret(factors[0]); }
  catch { return json({ error: 'mfa_unavailable' }, 503); }
  const totpStep = verifyTotpStep(secret, body.otp);
  if (totpStep === null) return json({ error: 'mfa_code_invalid' }, 401);

  const sessionToken = randomBytes(32).toString('base64url');
  const csrfToken = randomBytes(32).toString('base64url');
  const sessionHash = sha256(sessionToken);
  const csrfHash = sha256(csrfToken);
  const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000);
  const member = await database().begin(async tx => {
    const rows = await tx`SELECT vantoris_ledger.complete_member_mfa_enrollment(
      ${challengeHash},${sessionHash},${csrfHash},${totpStep},${expiresAt}
    ) AS member_id`;
    const memberId = rows[0].member_id;
    await tx`SELECT vantoris_ledger.resolve_member_session(${sessionHash})`;
    const members = await tx`SELECT m.id,m.member_reference,m.status,c.email FROM vantoris_ledger.members m
      JOIN vantoris_ledger.member_credentials c ON c.member_id=m.id WHERE m.id=${memberId}`;
    return members[0];
  });
  if (!member) return json({ error: 'member_session_unavailable' }, 503);
  return json({
    member: { id: member.id, memberReference: member.member_reference, email: member.email, status: member.status, role: 'member' },
  }, 200, [sessionCookie(sessionToken, 43200), csrfCookie(csrfToken, 43200), ...clearMfaCookies]);
}

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

function verifyTotpStep(secret, suppliedCode, now = Date.now()) {
  if (!/^\d{6}$/.test(String(suppliedCode || ''))) return null;
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
    if (timingSafeEqual(expected, supplied)) return counter + drift;
  }
  return null;
}

function verifyTotp(secret, suppliedCode, now = Date.now()) {
  return verifyTotpStep(secret, suppliedCode, now) !== null;
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
        SELECT id,secret_ciphertext,nonce,auth_tag
          FROM vantoris_ledger.member_mfa_factors
         WHERE member_id=${member.member_id} AND verified_at IS NOT NULL AND disabled_at IS NULL
         ORDER BY enrolled_at DESC LIMIT 1
      `;
      if (!factors.length) return { error: 'mfa_enrollment_required', memberId: member.member_id, email: member.email };
      if (!otp) return { error: 'mfa_required' };
      let secret;
      try { secret = decryptMfaSecret(factors[0]); }
      catch { return { error: 'mfa_unavailable' }; }
      const totpStep = verifyTotpStep(secret, otp);
      if (totpStep === null) {
        await tx`SELECT vantoris_ledger.record_login_failure(${emailFingerprint},${ipFingerprint})`;
        return { error: 'invalid' };
      }
      const replay = await tx`SELECT vantoris_ledger.consume_member_totp_step(${factors[0].id},${totpStep}) AS accepted`;
      if (replay[0]?.accepted !== true) {
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
  if (result.error === 'mfa_enrollment_required') return await startMfaEnrollment(result.memberId,result.email);
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
  if (!csrf || !header || csrf.length > 200 || header.length !== csrf.length) return false;
  if (!timingSafeEqual(Buffer.from(header), Buffer.from(csrf))) return false;
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
    const limitRows = await tx`SELECT * FROM vantoris_ledger.get_member_transfer_limits(${auth.tokenHash})`;
    const transferLimits = limitRows.length ? {
      singleLimitCents: String(limitRows[0].single_limit_cents),
      dailyLimitCents: String(limitRows[0].daily_limit_cents),
      usedTodayCents: String(limitRows[0].used_today_cents),
      remainingTodayCents: String(limitRows[0].remaining_today_cents),
      singleLimit: centsToDecimal(limitRows[0].single_limit_cents),
      remainingToday: centsToDecimal(limitRows[0].remaining_today_cents),
    } : null;
    const activity = await tx`
      SELECT j.id,j.journal_type,j.description,j.created_at,e.amount_cents,e.currency,a.id AS account_id
        FROM vantoris_ledger.journal_entries e
        JOIN vantoris_ledger.journals j ON j.id=e.journal_id
        JOIN vantoris_ledger.ledger_accounts a ON a.id=e.ledger_account_id
       WHERE a.member_id=${auth.memberId}
       ORDER BY j.created_at DESC,e.created_at DESC
       LIMIT 40
    `;
    return {
      member: { id: rows[0].id, memberReference: rows[0].member_reference, email: rows[0].email, status: rows[0].status, role: 'member' },
      accounts: accounts.map(account => ({
        id: account.id,
        accountReference: account.account_reference,
        accountType: account.account_type,
        account_type: account.account_type,
        account_name: account.account_type.replace(/_/g, ' '),
        mask: '•••• ' + String(account.account_reference).slice(-4),
        currency: account.currency,
        balance: account.posted_balance_cents === null ? null : centsToDecimal(account.posted_balance_cents),
        availableBalance: account.available_balance_cents === null ? null : centsToDecimal(account.available_balance_cents),
        postedBalanceCents: account.posted_balance_cents === null ? null : String(account.posted_balance_cents),
        availableBalanceCents: account.available_balance_cents === null ? null : String(account.available_balance_cents),
        activeHoldCents: String(account.active_hold_cents || '0'),
      })),
      transferLimits,
      transactions: activity.map(item => ({
        id: item.id + ':' + item.account_id,
        journalId: item.id,
        account_id: item.account_id,
        type: item.journal_type,
        description: item.description,
        created_date: item.created_at,
        amount: centsToDecimal(-BigInt(String(item.amount_cents))),
        amountCents: String(-BigInt(String(item.amount_cents))),
        currency: item.currency,
        status: 'posted',
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
      SELECT * FROM vantoris_ledger.create_member_internal_transfer_operation(
        ${operationId},${auth.tokenHash},${source},${receiver},${amountCents},${idempotencyKey},${requestHash}
      )
    `;
    const posted = await tx`
      SELECT * FROM vantoris_ledger.execute_member_internal_transfer(
        ${claim[0].operation_id},${auth.tokenHash}
      )
    `;
    return { journalId: posted[0].journal_id, duplicate: posted[0].duplicate };
  });

  if (outcome.error === 'unauthorized') return json({ error: 'authentication_required' }, 401);
  if (outcome.error === 'csrf_invalid') return json({ error: 'csrf_invalid' }, 403);
  return json({ transfer: { journalId: outcome.journalId, duplicate: outcome.duplicate, status: 'posted' } }, 200);
}


async function currentAccount(request, accountId) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(accountId || ''))) return null;
  return await database().begin(async tx => {
    const auth = await authenticateMember(request, tx);
    if (!auth) return null;
    const rows = await tx`
      SELECT a.id,a.account_reference,a.account_type,a.currency,
             CASE WHEN COALESCE(e.entry_count,0)=0 THEN NULL ELSE e.posted_balance_cents END AS posted_balance_cents,
             CASE WHEN COALESCE(e.entry_count,0)=0 THEN NULL ELSE e.posted_balance_cents-COALESCE(h.active_hold_cents,0) END AS available_balance_cents,
             COALESCE(h.active_hold_cents,0) AS active_hold_cents
        FROM vantoris_ledger.ledger_accounts a
        LEFT JOIN LATERAL (SELECT count(*) AS entry_count,-sum(amount_cents) AS posted_balance_cents FROM vantoris_ledger.journal_entries WHERE ledger_account_id=a.id) e ON true
        LEFT JOIN LATERAL (SELECT sum(amount_cents) AS active_hold_cents FROM vantoris_ledger.outgoing_funds_holds WHERE ledger_account_id=a.id AND status='active') h ON true
       WHERE a.id=${accountId} AND a.member_id=${auth.memberId}
    `;
    if (!rows.length) return null;
    const activity = await tx`
      SELECT j.id,j.journal_type,j.description,j.created_at,e.amount_cents,e.currency,e.id AS entry_id
        FROM vantoris_ledger.journal_entries e
        JOIN vantoris_ledger.journals j ON j.id=e.journal_id
       WHERE e.ledger_account_id=${accountId}
       ORDER BY j.created_at DESC,e.created_at DESC LIMIT 100
    `;
    const a = rows[0];
    return {
      account: { id:a.id,accountReference:a.account_reference,account_type:a.account_type,account_name:a.account_type.replace(/_/g,' '),mask:'•••• '+String(a.account_reference).slice(-4),currency:a.currency,balance:a.posted_balance_cents===null?null:centsToDecimal(a.posted_balance_cents),availableBalance:a.available_balance_cents===null?null:centsToDecimal(a.available_balance_cents),postedBalanceCents:a.posted_balance_cents===null?null:String(a.posted_balance_cents),availableBalanceCents:a.available_balance_cents===null?null:String(a.available_balance_cents),activeHoldCents:String(a.active_hold_cents||'0') },
      transactions: activity.map(item=>({ id:item.entry_id,journalId:item.id,type:item.journal_type,description:item.description,created_date:item.created_at,amount:centsToDecimal(-BigInt(String(item.amount_cents))),currency:item.currency,status:'posted' })),
    };
  });
}

function csvCell(value) {
  let text = value === null || value === undefined ? '' : String(value);
  if (/^[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replace(/"/g,'""') + '"';
}

async function currentStatement(request, accountId, from, to) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(accountId || '')) || !/^\d{4}-\d{2}-\d{2}$/.test(String(from||'')) || !/^\d{4}-\d{2}-\d{2}$/.test(String(to||''))) {
    return json({ error:'invalid_statement_request' },400);
  }
  const fromDate = new Date(from+'T00:00:00.000Z');
  const toExclusive = new Date(Date.parse(to+'T00:00:00.000Z')+86400000);
  if (!Number.isFinite(fromDate.getTime()) || !Number.isFinite(toExclusive.getTime()) || toExclusive<=fromDate || toExclusive-fromDate>366*86400000) {
    return json({ error:'invalid_statement_range' },400);
  }
  const token = cookies(request).__Host-vantoris_session;
  if (!token || token.length>200) return json({ error:'authentication_required' },401);
  const tokenHash = sha256(token);
  const result = await database().begin(async tx => {
    const csrf = cookies(request).__Host-vantoris_csrf || '';
    const header = request.headers.get('x-csrf-token') || '';
    if (!csrf || !header || csrf.length !== header.length || !timingSafeEqual(Buffer.from(csrf),Buffer.from(header))) return { error:'csrf_invalid' };
    const csrfHash = sha256(csrf);
    const csrfRows = await tx`SELECT vantoris_ledger.verify_auth_csrf(${tokenHash},${csrfHash}) AS valid`;
    if (csrfRows[0]?.valid !== true) return { error:'csrf_invalid' };
    await tx`SELECT vantoris_ledger.record_member_statement_access(${tokenHash},${accountId},${fromDate},${toExclusive}) AS member_id`;
    const accounts = await tx`SELECT id,account_reference,currency FROM vantoris_ledger.ledger_accounts WHERE id=${accountId}`;
    if (!accounts.length) return null;
    const opening = await tx`
      SELECT count(*) AS entry_count,COALESCE(sum(e.amount_cents),0) AS amount_cents
        FROM vantoris_ledger.journal_entries e JOIN vantoris_ledger.journals j ON j.id=e.journal_id
       WHERE e.ledger_account_id=${accountId} AND j.created_at<${fromDate}
    `;
    const entries = await tx`
      SELECT j.id,j.journal_type,j.description,j.created_at,e.amount_cents,e.currency
        FROM vantoris_ledger.journal_entries e JOIN vantoris_ledger.journals j ON j.id=e.journal_id
       WHERE e.ledger_account_id=${accountId} AND j.created_at>=${fromDate} AND j.created_at<${toExclusive}
       ORDER BY j.created_at,e.created_at,e.id
    `;
    let running = BigInt(opening[0].entry_count)>0n ? -BigInt(String(opening[0].amount_cents)) : 0n;
    const hasAny = BigInt(opening[0].entry_count)>0n || entries.length>0;
    const lines = [
      ['Vantoris Member Statement'],
      ['Account reference',accounts[0].account_reference],
      ['Currency',accounts[0].currency],
      ['Period start',from],
      ['Period end',to],
      ['Opening balance',BigInt(opening[0].entry_count)>0n?centsToDecimal(running):''],
      [],
      ['Date','Journal reference','Type','Description','Debit','Credit','Running balance'],
    ];
    for (const entry of entries) {
      const amount=BigInt(String(entry.amount_cents));
      running-=amount;
      lines.push([entry.created_at.toISOString(),entry.id,entry.journal_type,entry.description,amount>0n?centsToDecimal(amount):'',amount<0n?centsToDecimal(-amount):'',centsToDecimal(running)]);
    }
    lines.push([],['Closing balance',hasAny?centsToDecimal(running):'']);
    const csv='\uFEFF'+lines.map(row=>row.map(csvCell).join(',')).join('\r\n');
    return {csv,accountReference:accounts[0].account_reference};
  });
  if (!result) return json({error:'account_not_found'},404);
  if (result.error === 'csrf_invalid') return json({error:'csrf_invalid'},403);
  return new Response(result.csv,{status:200,headers:{
    'content-type':'text/csv; charset=utf-8',
    'content-disposition':`attachment; filename="vantoris-statement-${accountId}-${from}-${to}.csv"`,
    'cache-control':'no-store, private','x-content-type-options':'nosniff','referrer-policy':'no-referrer'
  }});
}
async function activateMember(body) {
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (token.length < 24 || token.length > 200) return json({ error: 'activation_token_invalid' }, 400);
  let passwordHash;
  try { passwordHash = await hashNewPassword(body.password); }
  catch (error) { return json({ error: error.message === 'PASSWORD_POLICY_FAILED' ? 'password_policy_failed' : 'member_service_unavailable' }, 400); }
  const rows = await database()`SELECT vantoris_ledger.consume_member_activation(${sha256(token)},${passwordHash}) AS member_id`;
  const members = await database()`SELECT email FROM vantoris_ledger.member_credentials WHERE member_id=${rows[0].member_id}`;
  if (!members.length) return json({ error: 'member_credentials_unavailable' }, 503);
  return await startMfaEnrollment(rows[0].member_id,members[0].email);
}

async function resetMemberPassword(body) {
  const token = typeof body.token === 'string' ? body.token.trim() : '';
  if (token.length < 24 || token.length > 200) return json({ error: 'password_reset_token_invalid' }, 400);
  let passwordHash;
  try { passwordHash = await hashNewPassword(body.password); }
  catch (error) { return json({ error: error.message === 'PASSWORD_POLICY_FAILED' ? 'password_policy_failed' : 'member_service_unavailable' }, 400); }
  await database()`SELECT vantoris_ledger.consume_member_password_reset(${sha256(token)},${passwordHash})`;
  return json({ ok: true, message: 'Password updated. Sign in using your Vantoris authenticator.' }, 200, [...clearCookies,...clearMfaCookies]);
}

export default async function handler(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action') || 'me';
  if (request.method === 'GET' && action === 'account') {
    try {
      const data = await currentAccount(request,url.searchParams.get('id'));
      return data ? json(data) : json({error:'account_not_found'},404);
    } catch (error) {
      const message = String(error?.message || '');
      if (message.includes('MEMBER_SESSION_INVALID')) return json({error:'authentication_required'},401);
      return json({error:'account_service_unavailable'},503);
    }
  }
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
  if (!sameOrigin(request)) return json({ error: 'origin_not_allowed' }, 403);
  let body;
  try { body = await readBody(request); }
  catch (error) { return json({ error: error.message === 'REQUEST_TOO_LARGE' ? 'request_too_large' : 'invalid_json' }, error.message === 'REQUEST_TOO_LARGE' ? 413 : 400); }

  try {
    if (body.action === 'login') return await login(request, body);
    if (body.action === 'activate') return await activateMember(body);
    if (body.action === 'reset-password') return await resetMemberPassword(body);
    if (body.action === 'mfa-enroll-confirm') return await confirmMfaEnrollment(request, body);
    if (body.action === 'statement') return await currentStatement(request,body.accountId,body.from,body.to);
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
    if (message.includes('TRANSFER_OPERATION_NOT_OWNED_BY_MEMBER') || message.includes('SOURCE_ACCOUNT_NOT_OWNED_BY_MEMBER')) return json({ error: 'forbidden' }, 403);
    if (message.includes('RECIPIENT_MUST_BE_ANOTHER_MEMBER')) return json({ error: 'recipient_must_be_another_member' }, 400);
    if (message.includes('ACTIVATION_TOKEN_INVALID_OR_EXPIRED')) return json({ error: 'activation_token_invalid' }, 401);
    if (message.includes('PASSWORD_RESET_TOKEN_INVALID_OR_EXPIRED')) return json({ error: 'password_reset_token_invalid' }, 401);
    if (message.includes('MEMBER_NOT_ELIGIBLE_FOR_ACTIVATION') || message.includes('MEMBER_NOT_ELIGIBLE_FOR_PASSWORD_RESET')) return json({ error: 'member_not_eligible' }, 409);
    if (message.includes('MEMBER_CREDENTIALS_NOT_PROVISIONED')) return json({ error: 'member_credentials_unavailable' }, 409);
    if (message.includes('INVALID_PASSWORD_HASH')) return json({ error: 'password_policy_failed' }, 400);
    if (message.includes('MFA_ENROLLMENT_CHALLENGE_INVALID_OR_EXPIRED')) return json({ error: 'mfa_enrollment_expired' }, 401);
    if (message.includes('MEMBER_MFA_ALREADY_ENROLLED')) return json({ error: 'mfa_already_enrolled' }, 409);
    if (message.includes('MEMBER_NOT_READY_FOR_MFA') || message.includes('MFA_FACTOR_NOT_PENDING')) return json({ error: 'mfa_enrollment_unavailable' }, 409);
    if (message.includes('MEMBER_TRANSFER_LIMIT_NOT_CONFIGURED')) return json({ error: 'member_transfer_limit_not_configured' }, 409);
    if (message.includes('MEMBER_SINGLE_TRANSFER_LIMIT_EXCEEDED')) return json({ error: 'member_single_transfer_limit_exceeded' }, 409);
    if (message.includes('MEMBER_DAILY_TRANSFER_LIMIT_EXCEEDED')) return json({ error: 'member_daily_transfer_limit_exceeded' }, 409);
    if (message.includes('RECEIVER_ACCOUNT_NOT_FOUND')) return json({ error: 'recipient_account_not_found' }, 404);
    if (message.includes('BOTH_MEMBER_ACCOUNTS_MUST_BE_ACTIVE')) return json({ error: 'member_account_unavailable' }, 409);
    console.error('Vantoris member auth operation failed:', message.slice(0, 160));
    return json({ error: 'member_service_unavailable' }, 503);
  }
}

export { base32Decode, verifyPassword, verifyTotp, verifyTotpStep };
