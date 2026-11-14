import { askOracle } from '@/lib/oracleAssistant';

/** Compatibility adapter for existing informational assistant screens. */
export async function askPrivateModel(prompt) {
  const result = await askOracle(prompt);
  return {
    ok: result.ok,
    error: result.error,
    text: result.text,
    provider: result.metadata?.model || (result.ok ? 'vantoris-private' : null),
    plan: 'member',
    remaining: null,
    usage: result.metadata || null,
    routing: null,
    workspaceId: null,
  };
}

export function privateLlmConfigured() {
  // Provider configuration is server-only and is never exposed to browser code.
  return null;
}
