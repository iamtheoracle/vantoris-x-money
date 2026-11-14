import postgres from 'postgres';
import { createHash, timingSafeEqual } from 'node:crypto';

let sql;
function database() {
  if (sql) return sql;
  const url = process.env.VANTORIS_LEDGER_DATABASE_URL;
  if (!url) throw new Error('VANTORIS_LEDGER_DATABASE_URL is not configured');
  const parsed = new URL(url);
  if (!['postgres:', 'postgresql:'].includes(parsed.protocol)) throw new Error('Vantoris ledger URL must use PostgreSQL');
  sql = postgres(url, {
    ssl: process.env.VANTORIS_DATABASE_SSL === 'disable' ? false : 'require',
    max: 4,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    onnotice: () => {},
  });
  return sql;
}

const sha256 = value => createHash('sha256').update(value).digest();
const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
    'pragma': 'no-cache',
  },
});

function readCookies(request) {
  const result = {};
  for (const part of (request.headers.get('cookie') || '').split(';')) {
    const index = part.indexOf('=');
    if (index < 0) continue;
    try { result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim()); }
    catch { /* malformed cookies fail closed */ }
  }
  return result;
}

function sameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try { return new URL(origin).origin === new URL(request.url).origin; }
  catch { return false; }
}

function constantTimeEqual(left, right) {
  if (typeof left !== 'string' || typeof right !== 'string' || !left || !right) return false;
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function privateEndpoint() {
  const raw = process.env.VANTORIS_PRIVATE_LLM_URL;
  const model = process.env.VANTORIS_PRIVATE_LLM_MODEL;
  if (!raw || !model) return null;
  const url = new URL(raw);
  const loopback = ['localhost', '127.0.0.1', '::1'].includes(url.hostname);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && loopback)) {
    throw new Error('VANTORIS_PRIVATE_LLM_URL must use HTTPS except for loopback development');
  }
  if (!url.pathname.endsWith('/v1/chat/completions')) {
    url.pathname = url.pathname.replace(/\/$/, '') + '/v1/chat/completions';
  }
  return { url: url.toString(), model };
}

async function authorizeAndLimit(request) {
  const cookie = readCookies(request);
  const sessionToken = cookie.__Host-vantoris_session || '';
  const csrfCookie = cookie.__Host-vantoris_csrf || '';
  const csrfHeader = request.headers.get('x-csrf-token') || '';
  if (!sessionToken || !constantTimeEqual(csrfCookie, csrfHeader)) return { status: 401, error: 'authentication_required' };

  const tokenHash = sha256(sessionToken);
  const csrfHash = sha256(csrfHeader);
  return database().begin(async tx => {
    const member = await tx.unsafe('SELECT vantoris_ledger.resolve_member_session($1) AS member_id', [tokenHash]);
    if (!member[0]?.member_id) return { status: 401, error: 'authentication_required' };

    const csrf = await tx.unsafe('SELECT vantoris_ledger.verify_auth_csrf($1,$2) AS valid', [tokenHash, csrfHash]);
    if (csrf[0]?.valid !== true) return { status: 403, error: 'csrf_invalid' };

    const usage = await tx.unsafe('SELECT vantoris_ledger.consume_member_assistant_request($1,5,50) AS allowed', [tokenHash]);
    if (usage[0]?.allowed !== true) return { status: 429, error: 'assistant_rate_limit' };
    return { status: 200 };
  });
}

async function readBody(request) {
  const raw = await request.text();
  if (raw.length > 16_384) throw new Error('REQUEST_TOO_LARGE');
  try { return JSON.parse(raw); }
  catch { throw new Error('INVALID_JSON'); }
}

export default async function handler(request) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  if (!sameOrigin(request)) return json({ error: 'origin_not_allowed' }, 403);

  let body;
  try { body = await readBody(request); }
  catch (error) {
    return json({ error: error.message === 'REQUEST_TOO_LARGE' ? 'request_too_large' : 'invalid_json' },
      error.message === 'REQUEST_TOO_LARGE' ? 413 : 400);
  }

  const prompt = typeof body?.message === 'string' ? body.message.trim() : '';
  if (!prompt) return json({ error: 'prompt_required', text: 'Enter a question to continue.' }, 400);
  if (prompt.length > 4000) return json({ error: 'prompt_too_long', text: 'Keep your question under 4,000 characters.' }, 413);

  let endpoint;
  try { endpoint = privateEndpoint(); }
  catch { return json({ error: 'assistant_configuration_invalid', text: 'Vantoris Intelligence is unavailable.' }, 503); }
  if (!endpoint) return json({ error: 'assistant_not_configured', text: 'Vantoris Intelligence is not configured. No AI response was generated.' }, 503);

  try {
    const authorization = await authorizeAndLimit(request);
    if (authorization.status !== 200) return json({ error: authorization.error }, authorization.status);

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(process.env.VANTORIS_PRIVATE_LLM_KEY ? { authorization: 'Bearer ' + process.env.VANTORIS_PRIVATE_LLM_KEY } : {}),
      },
      body: JSON.stringify({
        model: endpoint.model,
        messages: [
          {
            role: 'system',
            content: 'You are Vantoris Intelligence, an optional informational assistant. You have no access to member accounts, balances, identity records, staff data, institutional capital, or private documents. Never claim to read or verify those records. Never initiate, approve, post, reverse, reserve, or settle financial actions. Never claim an action or booking is complete. Do not request passwords, PINs, MFA codes, or account credentials. Give general educational information only, clearly state uncertainty, and direct account-specific requests to authenticated Vantoris support.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 900,
        stream: false,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) return json({ error: 'assistant_provider_unavailable', text: 'Vantoris Intelligence is temporarily unavailable. No response was generated.' }, 503);
    const data = await response.json();
    const answer = data?.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) return json({ error: 'assistant_empty_response', text: 'No assistant response was returned.' }, 503);
    return json({ ok: true, text: answer.trim().slice(0, 12_000), metadata: { model: endpoint.model, mode: 'informational' } });
  } catch (error) {
    const errorMessage = String(error?.message || '');
    if (errorMessage.includes('MEMBER_SESSION_INVALID')) return json({ error: 'authentication_required' }, 401);
    console.error('Vantoris Intelligence request failed:', errorMessage.slice(0, 100));
    return json({ error: 'assistant_unavailable', text: 'Vantoris Intelligence is temporarily unavailable. No response was generated.' }, 503);
  }
}
