/** Optional Vantoris Intelligence client. Disabled until a first-party private endpoint and controls are verified. */
export async function askPrivateModel() {
  return {
    ok: false,
    error: 'assistant_disabled',
    text: 'Vantoris Intelligence is currently unavailable. Core member, account and ledger services operate independently.',
    provider: null,
    plan: null,
    remaining: null,
    usage: null,
  };
}

export function privateLlmConfigured() {
  return false;
}
