import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { askOracle, loadOracleHistory } from '@/lib/oracleAssistant';
import ReactMarkdown from 'react-markdown';
import {
  Send, Bot, User, Loader2, ChevronDown, ChevronRight, Search, Plus,
  Menu, X, Trash2, Edit3, Check, CheckCheck, MoreVertical, ArrowLeft, Star
} from 'lucide-react';
import { getMessageKey, isStarred, toggleStar } from '@/lib/starredMessages';
import { useToast } from '@/components/ui/use-toast';
import { inspectCommandInput, executeElevatedCommand, clearConversationCompletely, redactCommandSecrets } from '@/lib/superCommand';
import { isSuperAdmin } from '@/lib/operationsAccess';

const COLORS = {
  container: '#F8FAFC',
  sidebar: '#FFFFFF',
  surface: '#F1F5F9',
  surfaceSent: '#071C38',
  border: 'rgba(7, 28, 56, 0.08)',
  textPrimary: '#071C38',
  textSecondary: '#64748B',
  accent: '#C9A227',
  accentBright: '#B08D57',
  bubbleOut: '#071C38',
  bubbleIn: '#FFFFFF',
  checkSent: '#94A3B8',
  checkRead: '#3B82F6',
};

// --- localStorage helpers for deleted convos & custom labels ---
const DELETED_KEY = 'vantoris_deleted_conversations';
const LABELS_KEY = 'vantoris_conversation_labels';

function getDeletedIds() {
  try { return JSON.parse(localStorage.getItem(DELETED_KEY) || '[]'); } catch { return []; }
}
function addDeletedId(id) {
  const ids = getDeletedIds();
  if (!ids.includes(id)) {
    ids.push(id);
    localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
  }
}
function getLabels() {
  try { return JSON.parse(localStorage.getItem(LABELS_KEY) || '{}'); } catch { return {}; }
}
function setLabel(convId, label) {
  const labels = getLabels();
  if (label && label.trim()) {
    labels[convId] = label.trim();
  } else {
    delete labels[convId];
  }
  localStorage.setItem(LABELS_KEY, JSON.stringify(labels));
}

export default function AgentChat({
  agentName = 'vantoris_assistant',
  title = 'Vantoris AI Assistant',
  subtitle = 'Platform-wide operations',
  suggestions = null,
  inputPlaceholder = 'Ask about members, applications, KYC status, account balances...',
  singleColumn = false,
  onClose = null,
  renderActionSuggestions = null
}) {
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [contextMenuConv, setContextMenuConv] = useState(null);
  const [renamingConv, setRenamingConv] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [mobileView, setMobileView] = useState(false);
  const [starredOnly, setStarredOnly] = useState(false);
  const [starredVersion, setStarredVersion] = useState(0);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  useEffect(() => { base44.auth.me().then(setUser).catch(() => {}); }, []);

  useEffect(() => { loadConversations(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadConversations() {
    try {
      const result = await loadOracleHistory();
      if (result.ok && result.threadId && result.messages?.length) {
        const messages = result.messages.map(item => ({ role: item.sender, content: item.body, created_date: item.created_date }));
        const conv = { id: result.threadId, agent_name: agentName, metadata: { name: 'AVCU Assistant' }, messages };
        setConversations([conv]);
        setActiveConv(conv);
        setMessages(messages);
      }
    } catch (e) {
      toast({ title: 'Chat load failed', description: 'Unable to load your saved assistant conversation.', variant: 'destructive' });
    }
    setLoadingConvs(false);
  }

  function startNewConversation() {
    setActiveConv(null);
    setMessages([]);
    setMobileView(true);
  }

  function generateConversationTitle(firstMessage) {
    // Titles are local and deterministic; they do not invoke an LLM or transmit extra content.
    const normalized = String(firstMessage || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return 'New conversation';
    return normalized.length > 44 ? normalized.slice(0, 41).trimEnd() + '…' : normalized;
  }

  function deleteConversation(convId) {
    addDeletedId(convId);
    const remaining = conversations.filter(c => c.id !== convId);
    setConversations(remaining);
    setContextMenuConv(null);
    if (activeConv?.id === convId) {
      const next = remaining[0] || null;
      setActiveConv(next);
      setMessages(next?.messages || []);
      if (!next) setMobileView(false);
    }
  }

  function startRenaming(conv) {
    setRenamingConv(conv.id);
    setRenameValue(conv._label || conv.metadata?.name || '');
    setContextMenuConv(null);
  }

  function confirmRename() {
    if (renamingConv) {
      setLabel(renamingConv, renameValue);
      setConversations(prev => prev.map(c =>
        c.id === renamingConv ? { ...c, _label: renameValue.trim() || null } : c
      ));
    }
    setRenamingConv(null);
    setRenameValue('');
  }

  async function sendMessage(contentOverride) {
    const raw = (contentOverride || input).trim();
    if (!raw || loading) return;
    setInput('');

    const me = user || (await base44.auth.me().catch(() => null));
    if (me && !user) setUser(me);

    const { elevated, cleanContent, hadToken } = inspectCommandInput(raw);
    const content = cleanContent || '';

    // Member (or non-super-admin) included the override token: strip, clear chat, no elevation
    if (hadToken && !elevated) {
      if (activeConv) {
        await clearConversationCompletely(activeConv);
        deleteConversation(activeConv.id);
      }
      setMessages([]);
      setActiveConv(null);
      setLoading(false);
      return;
    }

    if (!content && !elevated) return;

    setLoading(true);

    try {
      if (elevated) {
        const result = await executeElevatedCommand(content, me);

        const summary = redactCommandSecrets(
          result.message ||
            (result.ok
              ? 'Order executed under elevated authority.'
              : 'Order could not be completed.')
        );

        setActiveConv(null);
        setMessages([
          {
            role: 'assistant',
            content: summary + '\n\n(Session cleared.)',
            created_date: new Date().toISOString(),
          },
        ]);
        setLoading(false);
        return;
      }

      // All assistant responses are generated by the shared Oracle runtime.
      const userMessage = { role: 'user', content, created_date: new Date().toISOString() };
      const conv = activeConv || {
        id: crypto.randomUUID(),
        agent_name: agentName,
        metadata: { name: generateConversationTitle(content) },
        messages: [],
      };
      const pendingMessages = [...(conv.messages || []), userMessage];
      setMessages(pendingMessages);
      const result = await askOracle(content);
      if (!result.ok) throw new Error(result.text || 'Assistant unavailable');
      const assistantMessage = { role: 'assistant', content: result.text, created_date: new Date().toISOString() };
      const updated = { ...conv, id: result.threadId || conv.id, messages: [...pendingMessages, assistantMessage] };
      setConversations((previous) => [updated, ...previous.filter(item => item.id !== updated.id)]);
      setActiveConv(updated);
      setMessages(updated.messages);
      setLoading(false);

    } catch (e) {
      console.error('Send message error:', e);
      toast({
        title: 'Message failed',
        description: e.message || 'Unable to send message. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function getConvDisplay(conv) {
    if (conv._label) return conv._label;
    const name = conv.metadata?.name;
    if (name && name !== 'New Conversation' && name !== 'Conversation') return name;
    const firstUserMsg = conv.messages?.find(m => m.role === 'user');
    if (firstUserMsg?.content) {
      const text = firstUserMsg.content.trim();
      return text.length > 50 ? text.slice(0, 50) + '…' : text;
    }
    return 'New Conversation';
  }

  const filteredConversations = conversations.filter(conv =>
    getConvDisplay(conv).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className={`flex overflow-hidden relative ${singleColumn ? 'rounded-none' : 'rounded-xl'}`}
      style={{ height: singleColumn ? '100%' : 'calc(100vh - 140px)', background: COLORS.container, border: singleColumn ? 'none' : '1px solid ' + COLORS.border }}
    >
      {/* Conversation History Sidebar */}
      <div
        className={`flex-shrink-0 flex flex-col transition-all duration-300 overflow-hidden ${singleColumn ? 'relative' : 'absolute md:relative'} z-20 md:z-auto h-full ${singleColumn ? (mobileView ? 'hidden' : 'flex') : (mobileView ? 'hidden md:flex' : 'flex')}`}
        style={{ width: singleColumn ? '100%' : (sidebarOpen ? '300px' : '0'), borderRight: sidebarOpen || singleColumn ? '1px solid ' + COLORS.border : 'none', background: COLORS.sidebar }}
      >
        {/* New Conversation Button */}
        <div className="p-4" style={{ borderBottom: '1px solid ' + COLORS.border }}>
          <button
            onClick={startNewConversation}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-bold transition-all hover:opacity-90"
            style={{ background: COLORS.accentBright, color: '#FFFFFF' }}
          >
            <Plus size={16} strokeWidth={3} />
            New Conversation
          </button>
        </div>

        {/* Search */}
        <div className="px-3 py-3" style={{ borderBottom: '1px solid ' + COLORS.border }}>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: COLORS.textSecondary }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-full pl-9 pr-3 py-2 text-xs focus:outline-none transition-all selectable-content"
              style={{ background: COLORS.surface, color: COLORS.textPrimary, border: '1px solid ' + COLORS.border }}
            />
          </div>
        </div>

        {/* Conversation List — WhatsApp style */}
        <div className="flex-1 overflow-y-auto vantoris-scroll p-2">
          {loadingConvs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={16} className="animate-spin" style={{ color: COLORS.accent }} />
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center" style={{ color: COLORS.textSecondary }}>
              <Bot size={24} className="mx-auto mb-2 opacity-40" />
              <p className="text-xs">No conversations yet</p>
              <p className="text-[10px] opacity-50 mt-1">Start a new one to begin</p>
            </div>
          ) : (
            <div className="space-y-0.5">
              <p className="px-2 py-1.5 text-[10px] uppercase font-bold tracking-wider opacity-50" style={{ color: COLORS.textSecondary }}>Recent</p>
              {filteredConversations.map(conv => (
                <ConversationListItem
                  key={conv.id}
                  conv={conv}
                  display={getConvDisplay(conv)}
                  isActive={activeConv?.id === conv.id}
                  onSelect={() => { setActiveConv(conv); setMessages(conv.messages || []); setMobileView(true); }}
                  onDelete={() => deleteConversation(conv.id)}
                  onRename={() => startRenaming(conv)}
                  contextMenuConv={contextMenuConv}
                  setContextMenuConv={setContextMenuConv}
                  renaming={renamingConv === conv.id}
                  renameValue={renameValue}
                  setRenameValue={setRenameValue}
                  confirmRename={confirmRename}
                  cancelRename={() => { setRenamingConv(null); setRenameValue(''); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col overflow-hidden ${singleColumn ? (mobileView ? 'flex' : 'hidden') : (mobileView ? 'flex' : 'hidden md:flex')}`}>
        {/* WhatsApp-style Header */}
        <div className="flex items-center gap-3 p-3" style={{ borderBottom: '1px solid ' + COLORS.border, background: COLORS.sidebar }}>
          <button
            onClick={() => { setMobileView(false); setSidebarOpen(true); }}
            className={`${singleColumn ? '' : 'md:hidden'} p-2 rounded-full transition-all`}
            style={{ color: COLORS.textSecondary }}
          >
            <ArrowLeft size={18} />
          </button>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`${singleColumn ? 'hidden' : 'hidden md:flex'} p-2 rounded-full transition-all flex-shrink-0`}
            style={{ color: COLORS.textSecondary }}
            title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(201, 162, 39, 0.1)' }}>
              <Bot size={18} style={{ color: COLORS.accentBright }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate" style={{ color: COLORS.textPrimary }}>{title}</h3>
              <p className="text-[11px]" style={{ color: COLORS.textSecondary }}>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5" />
                {subtitle}
              </p>
            </div>
          </div>
          {activeConv && messages.length > 0 && (
            <button
              onClick={() => setStarredOnly(!starredOnly)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0 transition-all"
              style={{
                background: starredOnly ? 'rgba(201, 162, 39, 0.15)' : COLORS.surface,
                color: starredOnly ? COLORS.accentBright : COLORS.textSecondary,
                border: starredOnly ? '1px solid ' + COLORS.accent : '1px solid transparent',
              }}
              title="Show only starred messages"
            >
              <Star size={12} fill={starredOnly ? COLORS.accentBright : 'none'} />
              <span className="text-[11px]">Starred</span>
            </button>
          )}
          {activeConv && (
            <span
              className="text-[11px] px-3 py-1 rounded-full flex-shrink-0"
              style={{ background: COLORS.surface, color: COLORS.textSecondary }}
            >
              {messages.length} messages
            </span>
          )}
          {singleColumn && onClose && (
            <button
              onClick={onClose}
              className="p-2 rounded-full transition-all flex-shrink-0"
              style={{ color: COLORS.textSecondary }}
              title="Close"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Messages — WhatsApp chat backdrop */}
        <div
          className="flex-1 overflow-y-auto vantoris-scroll px-4 md:px-8 py-6 space-y-1"
          style={{
            background: COLORS.container,
          }}
        >
          {messages.length === 0 && !starredOnly && (
            <div className="h-full flex flex-col items-center justify-center text-center overflow-y-auto vantoris-scroll py-4">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'rgba(201, 162, 39, 0.08)' }}>
                <Bot size={32} style={{ color: COLORS.accentBright }} />
              </div>
              <h4 className="font-bold text-base mb-1" style={{ color: COLORS.textPrimary }}>What can I help you with?</h4>
              <p className="text-sm max-w-sm mb-6" style={{ color: COLORS.textSecondary }}>
                I have full access to your Vantoris platform. Ask me about members, accounts, applications, withdrawals, KYC status, and more.
              </p>
              {renderActionSuggestions
                ? renderActionSuggestions({ setInput, sendMessage })
                : (
                  <div className="space-y-2 w-full max-w-sm">
                    {(suggestions || [
                      'Show me pending applications',
                      'What is the total AUM?',
                      'List the top 10 accounts by balance',
                      'How many members completed KYC?',
                      'Rewrite this code for me',
                    ]).map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => setInput(suggestion)}
                        className="w-full text-left px-4 py-3 rounded-2xl text-xs transition-all hover:opacity-80"
                        style={{ background: 'rgba(7, 28, 56, 0.04)', color: COLORS.textSecondary, border: '1px solid ' + COLORS.border }}
                      >
                        → {suggestion}
                      </button>
                    ))}
                  </div>
                )}
            </div>
          )}

          {starredOnly && activeConv && messages.length > 0 &&
            messages.filter(msg => isStarred(activeConv.id, getMessageKey(msg))).length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Star size={32} style={{ color: COLORS.textSecondary, opacity: 0.4 }} />
              <p className="text-sm mt-3" style={{ color: COLORS.textSecondary }}>No starred messages</p>
              <p className="text-xs mt-1 opacity-60" style={{ color: COLORS.textSecondary }}>Star important messages to find them here</p>
            </div>
          )}
          {(() => {
            const displayed = starredOnly && activeConv
              ? messages.filter(msg => isStarred(activeConv.id, getMessageKey(msg)))
              : messages;
            return displayed.map((msg, idx) => {
              const prevMsg = displayed[idx - 1];
              const nextMsg = displayed[idx + 1];
              const isLastInGroup = !nextMsg || nextMsg.role !== msg.role;
              const isFirstInGroup = !prevMsg || prevMsg.role !== msg.role;
              return (
                <WhatsAppBubble
                  key={idx}
                  message={msg}
                  isLastInGroup={isLastInGroup}
                  isFirstInGroup={isFirstInGroup}
                  convId={activeConv?.id}
                  onStarToggle={() => setStarredVersion(v => v + 1)}
                />
              );
            });
          })()}

          {loading && (
            <div className="flex items-center gap-2 text-sm" style={{ color: COLORS.textSecondary }}>
              <div className="flex items-center gap-1 px-4 py-2.5 rounded-2xl rounded-bl-md" style={{ background: COLORS.bubbleIn, border: '1px solid ' + COLORS.border }}>
                <Loader2 size={14} className="animate-spin" style={{ color: COLORS.accent }} />
                <span className="text-xs">Typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* WhatsApp-style Input */}
        <div className="p-3" style={{ borderTop: '1px solid ' + COLORS.border, background: COLORS.sidebar }}>
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={inputPlaceholder}
                className="w-full rounded-3xl px-5 py-3 text-sm focus:outline-none resize-none max-h-24 selectable-content transition-all"
                style={{ background: COLORS.surface, color: COLORS.textPrimary, border: '1px solid ' + COLORS.border }}
                rows={1}
              />
            </div>
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="w-11 h-11 flex items-center justify-center rounded-full transition-all disabled:opacity-40 flex-shrink-0 hover:scale-105"
              style={{ background: COLORS.accentBright, color: '#FFFFFF' }}
              title="Send message"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-[10px] mt-1.5 opacity-50 text-center" style={{ color: COLORS.textSecondary }}>Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}

// --- WhatsApp-style conversation list item with context menu ---
function ConversationListItem({ conv, display, isActive, onSelect, onDelete, onRename, contextMenuConv, setContextMenuConv, renaming, renameValue, setRenameValue, confirmRename, cancelRename }) {
  const lastMsg = conv.messages?.[conv.messages?.length - 1];
  const date = new Date(conv.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  if (renaming) {
    return (
      <div className="px-2 py-2">
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') cancelRename(); }}
          className="w-full rounded-lg px-3 py-2 text-xs focus:outline-none selectable-content"
          style={{ background: COLORS.container, color: COLORS.textPrimary, border: '1px solid ' + COLORS.accent }}
        />
        <div className="flex gap-1 mt-1">
          <button onClick={confirmRename} className="flex-1 py-1.5 rounded-lg text-[10px] font-medium" style={{ background: COLORS.accent, color: '#FFFFFF' }}>
            <Check size={10} className="inline mr-1" /> Save
          </button>
          <button onClick={cancelRename} className="flex-1 py-1.5 rounded-lg text-[10px] font-medium" style={{ background: COLORS.surface, color: COLORS.textSecondary }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div
        onClick={onSelect}
        className="group w-full text-left px-3 py-3 rounded-xl cursor-pointer transition-all"
        style={{
          background: isActive ? 'rgba(201, 162, 39, 0.08)' : 'transparent',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: COLORS.surface }}>
            <Bot size={18} style={{ color: COLORS.accent }} />
          </div>
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="font-medium text-sm truncate" style={{ color: isActive ? COLORS.accentBright : COLORS.textPrimary }}>
                {display}
              </p>
              <span className="text-[10px] flex-shrink-0" style={{ color: COLORS.textSecondary }}>{date}</span>
            </div>
            {lastMsg && (
              <p className="text-xs mt-0.5 line-clamp-1" style={{ color: COLORS.textSecondary }}>
                {lastMsg.role === 'user' ? 'You: ' : ''}{lastMsg.content?.slice(0, 60)}
              </p>
            )}
          </div>
          {/* Context menu trigger */}
          <button
            onClick={(e) => { e.stopPropagation(); setContextMenuConv(contextMenuConv === conv.id ? null : conv.id); }}
            className="p-1.5 rounded-full transition-all flex-shrink-0 opacity-0 group-hover:opacity-100"
            style={{ color: COLORS.textSecondary }}
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenuConv === conv.id && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setContextMenuConv(null)} />
          <div
            className="absolute right-2 top-12 z-40 rounded-xl overflow-hidden min-w-[140px]"
            style={{ background: COLORS.surface, border: '1px solid ' + COLORS.border, boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
          >
            <button
              onClick={(e) => { e.stopPropagation(); onRename(); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-all hover:bg-white/5"
              style={{ color: COLORS.textPrimary }}
            >
              <Edit3 size={12} style={{ color: COLORS.accent }} /> Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-all hover:bg-red-500/10"
              style={{ color: '#ef4444', borderTop: '1px solid ' + COLORS.border }}
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// --- WhatsApp-style message bubble ---
function WhatsAppBubble({ message, isLastInGroup, isFirstInGroup, convId, onStarToggle }) {
  const isUser = message.role === 'user';
  const msgKey = getMessageKey(message);
  const starred = convId ? isStarred(convId, msgKey) : false;

  function handleStarClick(e) {
    e.stopPropagation();
    if (convId) {
      toggleStar(convId, msgKey);
      onStarToggle?.();
    }
  }

  const radius = isUser
    ? `rounded-2xl ${isLastInGroup ? 'rounded-br-md' : ''} ${isFirstInGroup ? '' : ''}`
    : `rounded-2xl ${isLastInGroup ? 'rounded-bl-md' : ''}`;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}>
      <div className={`max-w-[75%] md:max-w-[65%] relative group/star`}>
        {convId && (
          <button
            onClick={handleStarClick}
            className={`absolute -top-2.5 ${isUser ? '-left-6' : '-right-6'} p-1 rounded-full transition-all z-10 ${starred ? 'opacity-100' : 'opacity-0 group-hover/star:opacity-60 hover:!opacity-100'}`}
            title={starred ? 'Remove star' : 'Star this message'}
          >
            <Star size={13} fill={starred ? COLORS.accentBright : 'none'} style={{ color: starred ? COLORS.accentBright : COLORS.textSecondary }} />
          </button>
        )}
        <div
          className={`${radius} px-3.5 py-2 ${isUser ? 'vantoris-chat-bubble-out' : 'vantoris-chat-bubble-in'}`}
        >
          {message.content && (
            isUser ? (
              <p className="text-sm leading-relaxed whitespace-pre-wrap selectable-content">{message.content}</p>
            ) : (
              <ReactMarkdown
                className="text-sm leading-relaxed max-w-none [&_p]:my-1 [&_h1]:my-2 [&_h2]:my-2 [&_h3]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_li]:ml-4 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_table]:w-full [&_table]:text-xs [&_th]:px-2 [&_th]:py-1.5 [&_td]:px-2 [&_td]:py-1 [&_strong]:text-foreground [&_em]:text-inherit"
                components={{
                  code: ({ node, className, children, ...props }) => (
                    <code
                      className={className}
                      style={{ background: COLORS.container, color: COLORS.textPrimary }}
                      {...props}
                    >
                      {children}
                    </code>
                  ),
                  pre: ({ node, children, ...props }) => (
                    <pre
                      style={{ background: COLORS.container, border: '1px solid ' + COLORS.border }}
                      {...props}
                    >
                      {children}
                    </pre>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            )
          )}

          {message.tool_calls?.map((toolCall, idx) => (
            <ToolCallDisplay key={idx} toolCall={toolCall} />
          ))}

          {/* Timestamp + Read Receipt */}
          {isLastInGroup && (
            <div className={`flex items-center gap-1 mt-1 ${isUser ? 'justify-end' : 'justify-end'}`}>
              <span className="text-[10px]" style={{ color: COLORS.textSecondary }}>
                {message.created_date
                  ? new Date(message.created_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                  : ''}
              </span>
              {isUser && <CheckCheck size={12} style={{ color: COLORS.checkSent }} strokeWidth={2} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Tool call display ---
function ToolCallDisplay({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const status = toolCall.status || 'completed';
  const isFailed = ['failed', 'error'].includes(status);
  const statusColor = isFailed ? '#ef4444' : (status === 'pending' || status === 'running') ? COLORS.accent : '#16A34A';

  let parsedResults = null;
  try {
    parsedResults = typeof toolCall.results === 'string' ? JSON.parse(toolCall.results) : toolCall.results;
  } catch {
    parsedResults = toolCall.results;
  }

  const hideDetails = toolCall.display_projection?.hide_details && toolCall.display_projection?.details_redacted;

  if (hideDetails) {
    return (
      <div className="mt-2 text-xs" style={{ color: statusColor }}>
        {isFailed ? (toolCall.display_projection?.error_label || 'Failed') :
         status === 'pending' || status === 'running' ? (toolCall.display_projection?.active_label || 'Processing...') :
         (toolCall.display_projection?.label || toolCall.name)}
      </div>
    );
  }

  return (
    <div
      className="mt-2 text-xs rounded-xl overflow-hidden"
      style={{ border: '1px solid ' + COLORS.border, background: 'rgba(7, 28, 56, 0.04)' }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-all"
      >
        <div className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
          {expanded
            ? <ChevronDown size={14} style={{ color: COLORS.accent }} />
            : <ChevronRight size={14} style={{ color: COLORS.accent }} />
          }
        </div>
        <span className="font-semibold flex-1 uppercase tracking-wide text-[10px]" style={{ color: COLORS.textSecondary }}>
          {toolCall.name}
        </span>
        <span className="capitalize font-medium text-[10px]" style={{ color: statusColor }}>{status}</span>
      </button>
      {expanded && (
        <div className="px-3 py-2.5 space-y-2" style={{ borderTop: '1px solid ' + COLORS.border, background: 'rgba(7, 28, 56, 0.02)' }}>
          {toolCall.arguments_string && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5 opacity-60" style={{ color: COLORS.textSecondary }}>Parameters</p>
              <pre
                className="text-[11px] overflow-x-auto whitespace-pre-wrap p-2 rounded-lg"
                style={{ background: 'rgba(7, 28, 56, 0.06)', color: '#16A34A', border: '1px solid ' + COLORS.border }}
              >
                {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}
              </pre>
            </div>
          )}
          {parsedResults !== null && parsedResults !== undefined && (
            <div>
              <p className="text-[10px] uppercase tracking-widest font-bold mb-1.5 opacity-60" style={{ color: COLORS.textSecondary }}>Result</p>
              <pre
                className="text-[11px] overflow-x-auto whitespace-pre-wrap p-2 rounded-lg"
                style={{
                  background: 'rgba(7, 28, 56, 0.06)',
                  border: '1px solid ' + (isFailed ? 'rgba(239, 68, 68, 0.3)' : COLORS.border),
                  color: isFailed ? '#ef4444' : 'rgba(34, 197, 94, 0.8)',
                }}
              >
                {typeof parsedResults === 'string' ? parsedResults : JSON.stringify(parsedResults, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}