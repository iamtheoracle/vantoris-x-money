function readCsrfCookie() {
  const item = document.cookie.split(';').map(value => value.trim()).find(value => value.startsWith('__Host-vantoris_csrf='));
  return item ? decodeURIComponent(item.slice('__Host-vantoris_csrf='.length)) : '';
}

async function currentMemberId() {
  const response = await fetch('/api/member-auth?action=me', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { accept: 'application/json' },
  });
  if (!response.ok) throw new Error('authentication_required');
  const data = await response.json();
  const memberId = data?.member?.id;
  if (typeof memberId !== 'string' || !memberId) throw new Error('authentication_required');
  return memberId;
}

function historyStorageKey(memberId) {
  return 'vantoris_oracle_session_history:' + memberId;
}

function readSessionHistory(memberId) {
  try {
    const raw = sessionStorage.getItem(historyStorageKey(memberId));
    const messages = raw ? JSON.parse(raw) : [];
    return Array.isArray(messages) ? messages.slice(-40) : [];
  } catch {
    return [];
  }
}

function writeSessionHistory(memberId, messages) {
  try {
    sessionStorage.setItem(historyStorageKey(memberId), JSON.stringify(messages.slice(-40)));
  } catch {
    // Assistant responses remain visible in the current component even when session storage is unavailable.
  }
}

export async function loadOracleHistory() {
  try {
    const memberId = await currentMemberId();
    let deleted = [];
    try { deleted = JSON.parse(localStorage.getItem('vantoris_deleted_conversations') || '[]'); } catch { deleted = []; }
    return { ok: true, threadId: memberId, messages: deleted.includes(memberId) ? [] : readSessionHistory(memberId) };
  } catch {
    return { ok: false, error: 'authentication_required', messages: [] };
  }
}

export async function askOracle(message) {
  const prompt = typeof message === 'string' ? message.trim() : '';
  if (!prompt) return { ok: false, error: 'prompt_required', text: 'Enter a question to continue.' };
  if (prompt.length > 4000) return { ok: false, error: 'prompt_too_long', text: 'Keep your question under 4,000 characters.' };

  try {
    const memberId = await currentMemberId();
    const response = await fetch('/api/oracle', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        'x-csrf-token': readCsrfCookie(),
      },
      body: JSON.stringify({ message: prompt }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data?.ok !== true || typeof data.text !== 'string') {
      return {
        ok: false,
        error: data?.error || 'assistant_unavailable',
        text: data?.text || 'Vantoris Intelligence is unavailable. No AI response was generated.',
      };
    }

    let deleted = [];
    try { deleted = JSON.parse(localStorage.getItem('vantoris_deleted_conversations') || '[]'); } catch { deleted = []; }
    if (deleted.includes(memberId)) {
      localStorage.setItem('vantoris_deleted_conversations', JSON.stringify(deleted.filter(id => id !== memberId)));
    }
    const history = readSessionHistory(memberId);
    const now = new Date().toISOString();
    history.push({ sender: 'user', body: prompt, created_date: now });
    history.push({ sender: 'assistant', body: data.text, created_date: new Date().toISOString() });
    writeSessionHistory(memberId, history);

    return { ok: true, threadId: memberId, text: data.text, metadata: data.metadata || { mode: 'informational' } };
  } catch (error) {
    return {
      ok: false,
      error: error?.message === 'authentication_required' ? 'authentication_required' : 'assistant_unavailable',
      text: error?.message === 'authentication_required'
        ? 'Sign in to use Vantoris Intelligence.'
        : 'Vantoris Intelligence is temporarily unavailable. No AI response was generated.',
    };
  }
}
