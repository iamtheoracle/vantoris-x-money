const json = (body, status = 503) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store, private',
    'x-content-type-options': 'nosniff',
    'referrer-policy': 'no-referrer',
  },
});

export default async function handler(request) {
  if (request.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  return json({
    error: 'assistant_disabled',
    message: 'Vantoris Intelligence is not enabled. No assistant provider is connected, and no core institutional operation depends on this service.',
  }, 503);
}
