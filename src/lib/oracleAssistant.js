import { base44 } from '@/api/base44Client';

/** Route every browser assistant through the authenticated Oracle runtime. */
export async function askOracle(message, options = {}) {
  const prompt = typeof message === 'string' ? message.trim() : '';
  if (!prompt && options.action !== 'history') return { ok: false, error: 'prompt_required', text: 'Enter a question to continue.' };
  if (prompt.length > 4000) return { ok: false, error: 'prompt_too_long', text: 'Please keep your question under 4,000 characters.' };
  try {
    const result = await base44.functions.invoke('oracleRuntime', { message: prompt, action: options.action || 'process' });
    const data = result?.data ?? result;
    const text = typeof data?.response === 'string' ? data.response : '';
    if (!text && options.action !== 'history') return { ok: false, error: data?.error || 'empty_response', text: 'The assistant did not return a response. Please try again.' };
    return { ok: true, ...data, text };
  } catch (error) {
    return { ok: false, error: 'assistant_unavailable', text: 'The assistant is temporarily unavailable. Please try again.' };
  }
}

export async function loadOracleHistory() {
  return askOracle('', { action: 'history' });
}
