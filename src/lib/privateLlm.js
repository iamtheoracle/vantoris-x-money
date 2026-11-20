/** Backward-compatible wrapper; all browser AI requests use Oracle runtime. */
import { askOracle } from '@/lib/oracleAssistant';

export async function askPrivateModel(prompt) {
  const result = await askOracle(prompt);
  return {
    ok: result.ok,
    error: result.error,
    text: result.text,
    provider: result.metadata?.model || 'oracle-runtime',
    plan: result.metadata?.plan || 'member',
    remaining: result.metadata?.remaining ?? null,
    usage: result.metadata || null,
    routing: result.routing || null,
    workspaceId: result.workspaceId || null,
  };
}

export function privateLlmConfigured() {
  // Provider configuration is server-only and is not exposed to browser code.
  return null;
}
