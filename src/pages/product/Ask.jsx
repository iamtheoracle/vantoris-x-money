import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductShell from './ProductShell';
import { PROVIDERS, isConnected } from '@/lib/providers';
import { askPrivateModel } from '@/lib/privateLlm';

function parseSend(text) {
  const amount = text.match(/\$?\s*(\d+(?:\.\d{1,2})?)/);
  const to = text.match(/\bto\s+([A-Za-z0-9 .@_-]{2,40})/i);
  if (!/^\\s*(?:please\\s+)?(?:send|transfer|pay)\\b/i.test(text) || !amount) return null;
  return { type: 'send', amount: Number(amount[1]), to: (to?.[1] || '').trim() || 'recipient not named' };
}

function parseFlight(text) {
  if (!/book|flight/i.test(text)) return null;
  const route = text.match(/\b([A-Za-z]{3})\s*(?:to|-)\s*([A-Za-z]{3})\b/i);
  return { type: 'flight', from: route?.[1]?.toUpperCase() || 'origin not set', to: route?.[2]?.toUpperCase() || 'destination not set' };
}

export default function Ask() {
  const [input, setInput] = useState('');
  const [log, setLog] = useState([]);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastQuestion, setLastQuestion] = useState('');

  const status = useMemo(
    () => Object.values(PROVIDERS).map((provider) => `${provider.label}: ${provider.status}`),
    []
  );

  function push(role, text, extra = {}) {
    setLog((previous) => [...previous, { role, text, ...extra }]);
  }

  async function ask(question = input) {
    const q = question.trim();
    if (!q || loading) return;

    setInput('');
    setError('');
    setLastQuestion(q);
    push('you', q);

    const send = parseSend(q);
    const flight = parseFlight(q);
    if (send) {
      setDraft(send);
      push('vantoris', `Prepared send of $${send.amount.toFixed(2)} to ${send.to}. Nothing has been sent.`);
      return;
    }
    if (flight) {
      setDraft(flight);
      push('vantoris', `Prepared flight search ${flight.from} to ${flight.to}. Nothing is booked.`);
      return;
    }

    setLoading(true);
    try {
      const result = await askPrivateModel(q);
      if (result?.ok && typeof result.text === 'string' && result.text.trim()) {
        push('vantoris', result.text.trim(), { source: 'private' });
      } else {
        setError(result?.text || 'Vantoris Intelligence is unavailable. No AI answer was generated.');
      }
    } catch {
      setError('Vantoris Intelligence is temporarily unavailable. No AI answer was generated.');
    } finally {
      setLoading(false);
    }
  }

  function confirm() {
    if (!draft) return;
    if (draft.type === 'send') {
      if (!isConnected('payments')) {
        push('vantoris', `Not sent. Payments provider is not connected, so $${draft.amount.toFixed(2)} to ${draft.to} was not submitted.`, { to: '/move-money?action=send' });
      } else {
        push('vantoris', 'Payments provider is connected. Open Pay to authenticate and submit. This chat has not sent the money.', { to: '/move-money?action=send' });
      }
    } else if (draft.type === 'flight') {
      if (!isConnected('flights')) {
        push('vantoris', `Not booked. No flight inventory provider is connected for ${draft.from} to ${draft.to}.`, { to: '/travel' });
      } else {
        push('vantoris', 'Open Travel to review the fare. This chat has not booked the flight.', { to: '/travel' });
      }
    }
    setDraft(null);
  }

  return (
    <ProductShell kicker="Ask Vantoris" title="Ask" subtitle="Get clear answers and prepare actions. Payments and bookings are never reported as completed by this chat.">
      <div className="mb-4 space-y-1 rounded-2xl border border-slate-200 bg-white p-4 text-[11px] text-slate-500">
        {status.map((item) => <p key={item}>{item}</p>)}
      </div>

      <div className="mb-4 space-y-2" aria-live="polite" aria-relevant="additions">
        {log.map((message, index) => (
          <div key={index} className={`rounded-2xl px-4 py-3 text-sm ${message.role === 'you' ? 'bg-navy text-white' : 'border border-slate-200 bg-white'}`}>
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
            {message.to && <Link to={message.to} className="mt-2 inline-block text-xs font-semibold underline">Open</Link>}
          </div>
        ))}
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <p>{error}</p>
          <button type="button" onClick={() => ask(lastQuestion)} disabled={loading || !lastQuestion} className="mt-2 font-semibold underline disabled:opacity-50">Retry</button>
        </div>
      )}
      {loading && <p role="status" className="mb-3 text-sm text-slate-500">Vantoris Intelligence is thinking…</p>}

      {draft && (
        <div className="mb-4 rounded-2xl border border-brass/40 bg-brass/10 p-4 text-sm">
          <p className="font-semibold text-navy">{draft.type === 'send' ? `Send $${draft.amount.toFixed(2)}` : `Flight ${draft.from} → ${draft.to}`}</p>
          <p className="mt-1 text-slate-600">Confirm only opens the next step. It does not complete a transaction or booking.</p>
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={confirm} className="rounded-full bg-navy px-4 py-2 text-xs font-semibold text-white">Continue</button>
            <button type="button" onClick={() => setDraft(null)} className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold">Cancel</button>
          </div>
        </div>
      )}

      <form className="flex gap-2" onSubmit={(event) => { event.preventDefault(); ask(); }}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask a question, or try: Send $25 to Ada"
          aria-label="Ask Vantoris Intelligence"
          className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm"
          disabled={loading}
        />
        <button type="submit" disabled={loading || !input.trim()} className="rounded-xl bg-navy px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
          {loading ? 'Thinking…' : 'Ask'}
        </button>
      </form>
    </ProductShell>
  );
}
