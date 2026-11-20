import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { askOracle, loadOracleHistory } from '@/lib/oracleAssistant';
import { Send, Loader2, Sparkles, ChevronLeft, Clock, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import ShieldLogo from '@/components/vantoris/ShieldLogo';
import { isSuperAdmin } from '@/lib/operationsAccess';
import {
  inspectCommandInput,
  executeElevatedCommand,
  redactCommandSecrets,
} from '@/lib/superCommand';

/**
 * VantorisAssistant — the single customer-facing AI assistant.
 *
 * All assistant requests use the authenticated Oracle runtime. The runtime
 * owns persistent conversation history, specialist routing, policy checks,
 * and provider fallback; this component only renders the conversation.
 */
export default function VantorisAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Restore the member-scoped conversation persisted by Oracle.
  useEffect(() => {
    loadOracleHistory().then((result) => {
      if (result.ok && result.threadId) {
        setMessages((result.messages || []).map(item => ({ role: item.sender, content: item.body })));
      }
    }).catch(() => {});
  }, []);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const raw = input.trim();
    const { elevated, cleanContent, hadToken } = inspectCommandInput(raw, user);

    // Never keep credential in the input field
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    // Non-super-admin: strip credential silently if present; continue with clean text only
    const contentForAgent = cleanContent || (hadToken && !elevated ? '' : raw);
    if (!contentForAgent && !elevated) {
      if (hadToken) {
        // Member used override token without authority — clear any draft, no echo
        setMessages([]);
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Absolute command path (designated Super Admin only)
      if (elevated) {
        const result = await executeElevatedCommand(contentForAgent, user);
        const display =
          result.message ||
          (result.ok
            ? 'Order received and executed under elevated authority.'
            : result.message || 'Order could not be completed.');

        // Elevated operations are handled by the authorized command workflow, never by an AI agent.
        setMessages([{ role: 'assistant', content: redactCommandSecrets(display) }]);
        setMessages([
          { role: 'assistant', content: redactCommandSecrets(display) + '\n\n(Session cleared.)' },
        ]);
        setLoading(false);
        return;
      }

      // Use the same authenticated Oracle runtime as every other assistant surface.
      const userMessage = { role: 'user', content: contentForAgent };
      setMessages((prev) => [...prev, userMessage]);
      const result = await askOracle(contentForAgent);
      if (!result.ok) throw new Error(result.text || 'Assistant unavailable');
      setMessages((prev) => [...prev, { role: 'assistant', content: result.text }]);
      setLoading(false);

    } catch (err) {
      setError('The assistant is temporarily unavailable. Please try again.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I encountered an error processing your request. Please try again in a moment.',
          error: true,
        },
      ]);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="vantoris-glass-header sticky top-0 z-10 px-5 py-4 safe-top">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center gap-3">
            <Link to="/more" className="p-1.5 -ml-1.5 rounded-lg hover:bg-slate-100 transition-colors">
              <ChevronLeft size={20} className="text-gray" />
            </Link>
            <div className="w-10 h-10 rounded-xl bg-navy flex items-center justify-center">
              <ShieldLogo size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-foreground">Vantoris Assistant</h1>
                {isSuperAdmin(user) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-navy/10 text-navy text-[10px] font-bold uppercase tracking-wider rounded-full">
                    <Crown size={10} /> Ultimate Command
                  </span>
                )}
              </div>
              <p className="text-xs text-gray">{isSuperAdmin(user) ? 'Authorized for all operator capabilities' : 'AI Financial Guide'}</p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-5 py-2 max-w-3xl mx-auto w-full">
          <div className="bg-crimson/8 border border-crimson/15 rounded-lg px-3 py-2 text-xs text-crimson">
            {error}
          </div>
        </div>
      )}

      {loading && (
        <div className="px-5 py-2 max-w-3xl mx-auto w-full">
          <div className="flex items-center gap-2 text-xs text-gray">
            <Sparkles size={12} />
            <span>Vantoris Command processing...</span>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-2xl bg-navy/8 flex items-center justify-center mx-auto mb-4">
                <Sparkles size={28} className="text-navy" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-1">How can I help?</h2>
              <p className="text-sm text-gray">Ask me anything about your accounts, transactions, investments, HeroBox, or platform features.</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'vantoris-chat-bubble-out rounded-br-md'
                  : 'vantoris-chat-bubble-in rounded-bl-md'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{redactCommandSecrets(msg.content)}</p>
                {msg.created_date && (
                  <p className="text-[10px] text-gray/50 mt-1">
                    {new Date(msg.created_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="vantoris-chat-bubble-in rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-gray/40 animate-typing-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </div>

      <div className="vantoris-glass-nav sticky bottom-0 px-5 py-3 safe-bottom">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={e => {
              setInput(e.target.value);
              const el = e.target;
              el.style.height = 'auto';
              el.style.height = Math.min(el.scrollHeight, 120) + 'px';
            }}
            placeholder="Message Vantoris Assistant…"
            disabled={loading}
            rows={1}
            aria-label="Command input"
            className="flex-1 bg-white border border-border rounded-2xl px-4 py-2.5 text-sm leading-relaxed focus:border-brass/50 focus:outline-none disabled:opacity-50 selectable-content resize-none overflow-y-auto"
            style={{ maxHeight: '120px' }}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            aria-label="Send command"
            title="Send command"
            className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center disabled:opacity-30 hover:bg-navy/90 transition-colors flex-shrink-0"
          >
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </div>
  );
}