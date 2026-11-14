import oracle from './oracle.mjs';

/**
 * Compatibility alias for existing clients. The legacy path now delegates to
 * the same member-authenticated, rate-limited, informational Vantoris endpoint.
 */
export default async function handler(request) {
  if (request.method !== 'POST') return oracle(request);

  let payload = {};
  try { payload = await request.clone().json(); } catch { /* oracle returns the canonical JSON error */ }
  const message = typeof payload.message === 'string'
    ? payload.message
    : typeof payload.prompt === 'string'
      ? payload.prompt
      : '';

  const adapted = new Request(request, {
    body: JSON.stringify({ message }),
  });
  const response = await oracle(adapted);
  const data = await response.json().catch(() => ({}));
  if (data.ok === true && typeof data.text === 'string') data.response = data.text;
  return new Response(JSON.stringify(data), {
    status: response.status,
    headers: response.headers,
  });
}
