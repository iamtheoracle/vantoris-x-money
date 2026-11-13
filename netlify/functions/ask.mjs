import { createClient } from '@base44/sdk';

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' },
});

function bearer(request) {
  const match = (request.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || '';
}

async function authenticate(token) {
  const client = createClient({
    appId: process.env.BASE44_APP_ID || process.env.VITE_BASE44_APP_ID || '6a3d85c1632966fefe16f3d4',
    token,
    serverUrl: process.env.BASE44_SERVER_URL || process.env.VITE_BASE44_SERVER_URL || 'https://vantoris.base44.app',
    requiresAuth: true,
  });
  const user = await client.auth.me();
  if (!user?.id) throw new Error('unauthorized');
  return { client, user };
}

const FREE_MONTHLY_REQUESTS = Number(process.env.AI_FREE_MONTHLY_REQUESTS || 30);
const PAID_MONTHLY_REQUESTS = Number(process.env.AI_PAID_MONTHLY_REQUESTS || 300);
const MAX_PROMPT_CHARS = 4000;
const MAX_OUTPUT_TOKENS = Math.min(1200, Math.max(128, Number(process.env.AI_MAX_OUTPUT_TOKENS || 700)));
const MAX_DAILY_SPEND_CENTS = Math.max(1, Number(process.env.AI_MAX_DAILY_SPEND_CENTS || 2000));
const MAX_REQUEST_COST_CENTS = Math.max(1, Number(process.env.AI_MAX_REQUEST_COST_CENTS || 10));

async function reserveUsage(userId, monthlyLimit) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) throw new Error('usage_limiter_not_configured');

  const now = new Date();
  const month = now.toISOString().slice(0, 7);
  const day = now.toISOString().slice(0, 10);
  const userKey = `vantage:ai:user:${userId}:${month}`;
  const spendKey = `vantage:ai:spend:${day}`;
  const minuteKey = `vantage:ai:minute:${userId}:${Math.floor(Date.now() / 60000)}`;
  const perMinuteLimit = Math.max(1, Number(process.env.AI_PER_MINUTE_REQUESTS || 5));
  const script = [
    "local u = tonumber(redis.call('GET', KEYS[1]) or '0')",
    "local s = tonumber(redis.call('GET', KEYS[2]) or '0')",
    "local m = tonumber(redis.call('GET', KEYS[3]) or '0')",
    "local ul = tonumber(ARGV[1])",
    "local sc = tonumber(ARGV[2])",
    "local sl = tonumber(ARGV[3])",
    "local ml = tonumber(ARGV[4])",
    "if u >= ul then return {0, u, s, 'user_limit'} end",
    "if s + sc > sl then return {0, u, s, 'daily_budget'} end",
    "if m >= ml then return {0, u, s, 'minute_limit'} end",
    "u = redis.call('INCR', KEYS[1])",
    "s = redis.call('INCRBY', KEYS[2], sc)",
    "m = redis.call('INCR', KEYS[3])",
    "redis.call('EXPIRE', KEYS[1], 2678400)",
    "redis.call('EXPIRE', KEYS[2], 172800)",
    "redis.call('EXPIRE', KEYS[3], 120)",
    "return {1, u, s, 'ok'}",
  ].join('; ');
  const response = await fetch(url.replace(/\/$/, ''), {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(['EVAL', script, '3', userKey, spendKey, minuteKey, String(monthlyLimit), String(MAX_REQUEST_COST_CENTS), String(MAX_DAILY_SPEND_CENTS), String(perMinuteLimit)]),
  });
  if (!response.ok) throw new Error('usage_store_unavailable');
  const payload = await response.json();
  const result = payload?.result;
  if (!Array.isArray(result)) throw new Error('usage_store_invalid_response');
  return { allowed: Number(result[0]) === 1, used: Number(result[1]) || 0, spendCents: Number(result[2]) || 0, reason: String(result[3] || 'unknown') };
}

const SYSTEM_PROMPT = 'You are Vantage Assistant, a careful information assistant for Vantage Private Investment. You do not have access to client accounts, balances, private member records, holdings, withdrawals, or identity documents. Never invent financial data, rates, performance, transactions, card status, bookings, or provider results. You are read-only: never claim to execute payments, transfers, card controls, account changes, or bookings. Provide general investment education only; do not give personalized investment instructions. Clearly distinguish general information from verified facts. Do not request passwords, PINs, or one-time codes.';

async function readOpenAICompatible({ url, key, model, prompt, provider }) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...(key ? { authorization: `Bearer ${key}` } : {}) },
    body: JSON.stringify({ model, messages: [{ role: 'system', content: SYSTEM_PROMPT }, { role: 'user', content: prompt }], max_tokens: MAX_OUTPUT_TOKENS, stream: false }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${provider}_http_${response.status}`);
  const data = await response.json();
  const text = data?.choices?.[0]?.message?.content;
  if (typeof text !== 'string' || !text.trim()) throw new Error(`${provider}_empty_response`);
  return { text: text.trim().slice(0, 20000), provider, usage: data.usage || null };
}

async function readGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('gemini_not_configured');
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({ systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { maxOutputTokens: MAX_OUTPUT_TOKENS } }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`gemini_http_${response.status}`);
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('');
  if (!text?.trim()) throw new Error('gemini_empty_response');
  return { text: text.trim().slice(0, 20000), provider: 'gemini', usage: data.usageMetadata || null };
}

async function readAnthropic(prompt) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('anthropic_not_configured');
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL || 'claude-3-5-haiku-latest', max_tokens: MAX_OUTPUT_TOKENS, system: SYSTEM_PROMPT, messages: [{ role: 'user', content: prompt }] }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`anthropic_http_${response.status}`);
  const data = await response.json();
  const text = data?.content?.filter((part) => part.type === 'text').map((part) => part.text).join('');
  if (!text?.trim()) throw new Error('anthropic_empty_response');
  return { text: text.trim().slice(0, 20000), provider: 'anthropic', usage: data.usage || null };
}

async function callBase44(client, prompt) {
  const invoke = client?.integrations?.Core?.InvokeLLM;
  if (typeof invoke !== 'function') throw new Error('base44_invoke_unavailable');
  const result = await invoke({ prompt: `${SYSTEM_PROMPT}\n\nMember question: ${prompt}` });
  const text = typeof result === 'string' ? result : result?.text || result?.response;
  if (typeof text !== 'string' || !text.trim()) throw new Error('base44_empty_response');
  return { text: text.trim().slice(0, 20000), provider: 'base44', usage: null };
}

async function callProvider(name, client, prompt) {
  if (name !== 'private') throw new Error('external_ai_provider_disabled');
  if (name === 'openrouter') {
    if (!process.env.OPENROUTER_API_KEY) throw new Error('openrouter_not_configured');
    return readOpenAICompatible({ url: 'https://openrouter.ai/api/v1/chat/completions', key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || 'openai/gpt-4o-mini', prompt, provider: 'openrouter' });
  }
  if (name === 'groq') {
    if (!process.env.GROQ_API_KEY) throw new Error('groq_not_configured');
    return readOpenAICompatible({ url: 'https://api.groq.com/openai/v1/chat/completions', key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile', prompt, provider: 'groq' });
  }
  if (name === 'gemini') return readGemini(prompt);
  if (name === 'anthropic') return readAnthropic(prompt);
  if (name === 'base44') return callBase44(client, prompt);
  if (name === 'private') {
    if (!process.env.VANTAGE_PRIVATE_LLM_URL) throw new Error('private_not_configured');
    const endpoint = new URL(process.env.VANTAGE_PRIVATE_LLM_URL);
    if (endpoint.protocol !== 'https:') throw new Error('private_invalid_url');
    return readOpenAICompatible({ url: endpoint.toString(), key: process.env.VANTAGE_PRIVATE_LLM_KEY || '', model: process.env.VANTAGE_PRIVATE_LLM_MODEL || 'qwen2.5:7b', prompt, provider: 'private' });
  }
  throw new Error('unknown_provider');
}

function providerOrder() {
  // Private endpoint only. No external AI provider fallback is enabled.
  return ['private'];
}

export default async function handler(request) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  const token = bearer(request);
  if (!token) return json({ error: 'authentication_required', message: 'Sign in to use Vantage Assistant.' }, 401);

  let client, user;
  try { ({ client, user } = await authenticate(token)); }
  catch { return json({ error: 'authentication_required', message: 'Your member session could not be verified.' }, 401); }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: 'invalid_json', message: 'Request body must be valid JSON.' }, 400); }
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  if (!prompt) return json({ error: 'empty_prompt', message: 'Enter a question first.' }, 400);
  if (prompt.length > MAX_PROMPT_CHARS) return json({ error: 'prompt_too_long', message: 'Keep your question under 4,000 characters.' }, 413);

  const subscriberIds = new Set((process.env.AI_SUBSCRIBER_USER_IDS || '').split(',').map((id) => id.trim()).filter(Boolean));
  const isSubscriber = subscriberIds.has(String(user.id));
  const monthlyLimit = isSubscriber ? PAID_MONTHLY_REQUESTS : FREE_MONTHLY_REQUESTS;
  let reservation;
  try { reservation = await reserveUsage(String(user.id), monthlyLimit); }
  catch (error) {
    const reason = error?.message || 'usage_store_unavailable';
    return json({ error: reason, message: 'AI usage controls are temporarily unavailable. Please try again later.' }, 503);
  }
  if (!reservation.allowed) {
    const messages = {
      daily_budget: ['daily_budget_reached', 'The daily AI service budget has been reached. Please try again tomorrow.'],
      minute_limit: ['rate_limited', 'You are sending requests too quickly. Wait a moment and try again.'],
      user_limit: ['monthly_allowance_reached', 'You have reached your monthly AI allowance. Your allowance will reset next month.'],
    };
    const [error, message] = messages[reservation.reason] || messages.user_limit;
    return json({ error, message }, 429);
  }

  const failures = [];
  for (const provider of providerOrder()) {
    try {
      const result = await callProvider(provider, client, prompt);
      return json({ text: result.text, provider: result.provider, usage: result.usage, plan: isSubscriber ? 'subscriber' : 'free', remaining: Math.max(0, monthlyLimit - reservation.used) });
    } catch (error) {
      failures.push({ provider, error: String(error?.message || 'provider_failed').slice(0, 100) });
    }
  }
  console.error('All AI providers failed', { userId: user.id, failures });
  return json({ error: 'all_providers_unavailable', message: 'Vantage Assistant is temporarily unavailable. No AI answer was generated.' }, 503);
}
