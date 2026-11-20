import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, Send, Sparkles, UserRound } from 'lucide-react';
import { askPrivateModel } from '@/lib/privateLlm';

const suggestions = [
  'Explain a bank transfer in simple words',
  'How can I keep my account safer?',
  'What should I check before requesting a service?',
];

function memberDataRoute(question) {
  if (/balance|available funds|how much.*account/i.test(question)) return { path: '/money', label: 'Open Money to view backend-reported account records.' };
  if (/transactions?|spending history|payment history/i.test(question)) return { path: '/transactions', label: 'Open Transactions to view records returned for your account.' };
  if (/kyc|identity verification|verification status/i.test(question)) return { path: '/profile', label: 'Open Profile to review the information available for your account.' };
  if (/services? can i request|request a service/i.test(question)) return { path: '/services', label: 'Open Services to view available requests.' };
  return null;
}

export default function MemberAdvisorChat() {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hello. I can explain banking concepts and help you find the right place in Vantoris. I cannot see or verify account details from this chat, and I will not claim to move money or change your account.' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function sendQuestion(question = input) {
    const prompt = question.trim();
    if (!prompt || loading) return;
    setInput('');
    setError('');
    setMessages((current) => [...current, { role: 'user', text: prompt }]);
    const route = memberDataRoute(prompt);
    if (route) {
      setMessages((current) => [...current, { role: 'assistant', text: route.label, link: route.path }]);
      return;
    }
    setLoading(true);
    try {
      const result = await askPrivateModel(prompt);
      if (result?.ok && typeof result.text === 'string' && result.text.trim()) {
        setMessages((current) => [...current, { role: 'assistant', text: result.text.trim() }]);
      } else {
        setError(result?.text || 'Vantoris Intelligence is unavailable. No AI answer was generated.');
      }
    } catch {
      setError('Vantoris Intelligence is temporarily unavailable. No AI answer was generated.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mx-auto flex min-h-[65vh] max-w-3xl flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-3 border-b border-slate-100 bg-navy px-5 py-4 text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-brass/30 bg-brass/10 text-brass"><Sparkles size={19} /></span>
        <div><h2 className="font-semibold">Vantoris Intelligence</h2><p className="text-xs text-white/60">Member help · private AI when configured</p></div>
      </header>
      <div className="flex-1 space-y-3 p-4 sm:p-5" aria-live="polite" aria-relevant="additions">
        {messages.map((message, index) => <div key={index} className={'flex gap-2.5 ' + (message.role === 'user' ? 'flex-row-reverse' : '')}>
          <span className={'flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl ' + (message.role === 'user' ? 'bg-slate-100 text-navy' : 'bg-brass/10 text-brass')} aria-hidden="true">{message.role === 'user' ? <UserRound size={16} /> : <Bot size={16} />}</span>
          <div className={'max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ' + (message.role === 'user' ? 'bg-navy text-white' : 'border border-slate-100 bg-slate-50 text-slate-700')}>
            <p className="whitespace-pre-wrap break-words">{message.text}</p>
            {message.link && <Link to={message.link} className="mt-2 inline-block font-semibold text-navy underline">Open page</Link>}
          </div>
        </div>)}
        {loading && <p role="status" className="pl-10 text-xs text-slate-500">Thinking…</p>}
        {error && <div role="alert" className="ml-10 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p>{error}</p><button type="button" onClick={() => sendQuestion(messages.filter(m => m.role === 'user').at(-1)?.text || '')} className="mt-2 font-semibold underline">Retry</button></div>}
      </div>
      {messages.length <= 1 && <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-5">{suggestions.map((item) => <button key={item} type="button" onClick={() => sendQuestion(item)} disabled={loading} className="rounded-full border border-slate-200 px-3 py-2 text-left text-xs text-slate-600 hover:border-brass/50 hover:text-navy disabled:opacity-50">{item}</button>)}</div>}
      <form className="flex gap-2 border-t border-slate-100 p-3 sm:p-4" onSubmit={(event) => { event.preventDefault(); sendQuestion(); }}>
        <input value={input} onChange={(event) => setInput(event.target.value)} disabled={loading} aria-label="Message Vantoris Intelligence" placeholder="Ask a question…" className="h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-brass" />
        <button type="submit" disabled={loading || !input.trim()} aria-label="Send message" className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-navy text-white disabled:opacity-40"><Send size={17} /></button>
      </form>
    </section>
  );
}
