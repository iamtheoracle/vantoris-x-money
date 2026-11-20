import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import OperationsPageLayout from '@/components/vantoris/OperationsPageLayout';
import {
  MessageSquare, Send, CheckCheck, User, Trash2, Edit3, Check,
  MoreVertical, ArrowLeft, Search, X
} from 'lucide-react';
import ReadReceipt from '@/components/vantoris/chat/ReadReceipt';
import { useToast } from '@/components/ui/use-toast';

// localStorage helpers for custom labels
const LABELS_KEY = 'vantoris_admin_thread_labels';
function getLabels() { try { return JSON.parse(localStorage.getItem(LABELS_KEY) || '{}'); } catch { return {}; } }
function setLabel(id, label) {
  const labels = getLabels();
  if (label && label.trim()) labels[id] = label.trim();
  else delete labels[id];
  localStorage.setItem(LABELS_KEY, JSON.stringify(labels));
}

export default function MemberMessages() {
  const [threads, setThreads] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [contextMenuThread, setContextMenuThread] = useState(null);
  const [renamingThread, setRenamingThread] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showConversation, setShowConversation] = useState(false);
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadData() {
    try {
      const [thrds, usrs] = await Promise.all([
        base44.entities.MessageThread.list('-created_date', 100),
        base44.entities.User.list('-created_date', 200),
      ]);
      const labels = getLabels();
      thrds.forEach(t => { t._label = labels[t.id] || null; });
      setThreads(thrds);
      setUsers(usrs);
      } catch (e) {
      console.error(e);
      toast({ title: 'Load failed', description: e.message || 'Unable to load messages.', variant: 'destructive' });
      }
      setLoading(false);
  }

  function getUser(id) { return users.find(u => u.id === id); }

  async function openThread(thread) {
    setSelected(thread);
    setReply('');
    setShowConversation(true);
    setContextMenuThread(null);
    try {
      const msgs = await base44.entities.ThreadMessage.filter({ thread_id: thread.id }, 'created_date', 200);
      setMessages(msgs);
      if (thread.unread_by_admin) {
        await base44.entities.MessageThread.update(thread.id, { unread_by_admin: false });
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, unread_by_admin: false } : t));
      }
      const memberUnread = msgs.filter(m => m.sender === 'member' && !m.read);
      for (const m of memberUnread) {
        base44.entities.ThreadMessage.update(m.id, { read: true });
      }
      if (memberUnread.length > 0) {
        setMessages(prev => prev.map(m => m.sender === 'member' ? { ...m, read: true } : m));
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Thread error', description: e.message || 'Unable to open conversation.', variant: 'destructive' });
    }
  }

  async function sendReply() {
    if (!reply.trim() || !selected) return;
    setSending(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.ThreadMessage.create({
        thread_id: selected.id, user_id: selected.user_id,
        sender: 'admin', body: reply,
        admin_name: me?.full_name || 'Vantoris Support',
      });
      await base44.entities.MessageThread.update(selected.id, {
        last_message: reply.slice(0, 200), last_sender: 'admin',
        last_message_date: new Date().toISOString(),
        unread_by_member: true, unread_by_admin: false,
      });
      const member = getUser(selected.user_id);
      if (member?.email) {
        await base44.integrations.Core.SendEmail({
          to: member.email,
          subject: `Vantoris Support: ${selected.subject}`,
          body: `Dear ${member.full_name || 'Member'},\n\nYou have a new reply from Vantoris Support:\n\n${reply}\n\nView the full conversation in your Vantoris app under Messages.\n\nWarm regards,\nThe Vantoris Team`,
        });
      }
      const msgs = await base44.entities.ThreadMessage.filter({ thread_id: selected.id }, 'created_date', 200);
      setMessages(msgs);
      setReply('');
      loadData();
      toast({ title: 'Reply sent', description: 'Your message has been sent to the member.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Reply failed', description: e.message || 'Unable to send reply.', variant: 'destructive' });
    }
    setSending(false);
  }

  async function closeThread() {
    if (!selected) return;
    try {
      await base44.entities.MessageThread.update(selected.id, { status: 'closed' });
      setSelected(null);
      setShowConversation(false);
      loadData();
      toast({ title: 'Thread closed', description: 'The conversation has been closed.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Close failed', description: e.message || 'Unable to close thread.', variant: 'destructive' });
    }
  }

  async function deleteThread(threadId) {
    try {
      const msgs = await base44.entities.ThreadMessage.filter({ thread_id: threadId }, 'created_date', 500);
      for (const m of msgs) {
        await base44.entities.ThreadMessage.delete(m.id);
      }
      await base44.entities.MessageThread.delete(threadId);
      setThreads(prev => prev.filter(t => t.id !== threadId));
      setContextMenuThread(null);
      if (selected?.id === threadId) {
        setSelected(null);
        setShowConversation(false);
      }
    } catch (e) {
      console.error('Delete thread error:', e);
      toast({ title: 'Delete failed', description: e.message || 'Unable to delete thread.', variant: 'destructive' });
    }
  }

  function startRenaming(thread) {
    setRenamingThread(thread.id);
    setRenameValue(thread._label || thread.subject || '');
    setContextMenuThread(null);
  }

  function confirmRename() {
    if (renamingThread) {
      setLabel(renamingThread, renameValue);
      setThreads(prev => prev.map(t =>
        t.id === renamingThread ? { ...t, _label: renameValue.trim() || null } : t
      ));
      if (selected?.id === renamingThread) {
        setSelected(prev => ({ ...prev, _label: renameValue.trim() || null }));
      }
    }
    setRenamingThread(null);
    setRenameValue('');
  }

  function getThreadDisplay(thread) {
    const member = getUser(thread.user_id);
    return thread._label || (member?.full_name ? `${member.full_name} — ${thread.subject}` : thread.subject) || 'Conversation';
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  }

  if (loading) {
    return (
      <OperationsPageLayout title="Member Messages" description="Reply to member inquiries" icon={MessageSquare}>
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      </OperationsPageLayout>
    );
  }

  const unreadCount = threads.filter(t => t.unread_by_admin).length;
  const filteredThreads = threads.filter(t =>
    getThreadDisplay(t).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <OperationsPageLayout title="Member Messages" description="Reply to member inquiries within the app" icon={MessageSquare}>
      {unreadCount > 0 && (
        <div className="mb-4 inline-flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-xl text-xs font-medium">
          <MessageSquare size={12} /> {unreadCount} unread {unreadCount === 1 ? 'thread' : 'threads'}
        </div>
      )}

      {threads.length === 0 ? (
        <div className="vantoris-card p-8 text-center">
          <MessageSquare size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No Member Messages</p>
          <p className="text-muted-foreground text-sm">Member replies will appear here as conversation threads.</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by member name or subject..."
              className="w-full rounded-full pl-9 pr-3 py-2 text-xs bg-card border border-border focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all selectable-content"
            />
          </div>

          {/* WhatsApp-style Conversation List */}
          <div className="vantoris-card overflow-hidden">
            {filteredThreads.map((thread, idx) => {
              const member = getUser(thread.user_id);
              return (
                <div key={thread.id} className="relative">
                  <button
                    onClick={() => openThread(thread)}
                    className={`group w-full text-left px-4 py-3 flex items-center gap-3 transition-all hover:bg-muted/50 ${thread.unread_by_admin ? 'bg-primary/5' : ''} ${idx > 0 ? 'border-t border-border' : ''}`}
                  >
                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                      <User size={18} className="text-primary" />
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${thread.unread_by_admin ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                          {member?.full_name || 'Unknown Member'}
                        </p>
                        <span className="text-[10px] text-muted-foreground flex-shrink-0">
                          {thread.last_message_date
                            ? new Date(thread.last_message_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                            : new Date(thread.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-0.5">
                        <p className="text-xs text-muted-foreground line-clamp-1 flex-1">
                          <span className={thread.last_sender === 'admin' ? 'text-primary' : 'text-emerald-500'}>
                            {thread.last_sender === 'admin' ? 'You' : 'Member'}:
                          </span>{' '}{thread.last_message || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {thread.unread_by_admin && <span className="w-2 h-2 rounded-full bg-primary" />}
                          {thread.status === 'closed' && <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">Closed</span>}
                        </div>
                      </div>
                    </div>
                    {/* Context menu trigger */}
                    <button
                      onClick={(e) => { e.stopPropagation(); setContextMenuThread(contextMenuThread === thread.id ? null : thread.id); }}
                      className="p-1.5 rounded-full transition-all flex-shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:bg-muted"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </button>

                  {/* Rename input */}
                  {renamingThread === thread.id && (
                    <div className="px-4 py-2 bg-muted/30 border-t border-border">
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') confirmRename(); if (e.key === 'Escape') { setRenamingThread(null); setRenameValue(''); } }}
                        placeholder="Enter conversation label..."
                        className="w-full rounded-lg px-3 py-2 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-primary/30 selectable-content"
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={confirmRename} className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-primary text-primary-foreground flex items-center justify-center gap-1">
                          <Check size={10} /> Save Label
                        </button>
                        <button onClick={() => { setRenamingThread(null); setRenameValue(''); }} className="flex-1 py-1.5 rounded-lg text-[10px] font-medium bg-muted text-muted-foreground">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Context Menu */}
                  {contextMenuThread === thread.id && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setContextMenuThread(null)} />
                      <div className="absolute right-3 top-14 z-40 rounded-xl overflow-hidden min-w-[140px] bg-popover border border-border shadow-lg">
                        <button
                          onClick={() => startRenaming(thread)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-foreground hover:bg-muted transition-all"
                        >
                          <Edit3 size={12} className="text-primary" /> Label
                        </button>
                        <button
                          onClick={() => deleteThread(thread.id)}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-destructive hover:bg-destructive/10 transition-all border-t border-border"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* WhatsApp-style Conversation View */}
      {selected && showConversation && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-4 py-3 vantoris-glass-header safe-top">
            <button onClick={() => { setShowConversation(false); setSelected(null); }} className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-all">
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">
                {getUser(selected.user_id)?.full_name || 'Member'}
              </h3>
              <p className="text-[11px] text-muted-foreground truncate flex items-center gap-1">
                {selected._label || selected.subject} · {getUser(selected.user_id)?.email || ''}
              </p>
            </div>
            {selected.status !== 'closed' && (
              <button onClick={closeThread} className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-all">
                Close
              </button>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto vantoris-scroll px-4 py-4 vantoris-mesh-bg">
            <div className="space-y-1">
              {messages.map((msg, idx) => {
                const nextMsg = messages[idx + 1];
                const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender;
                return (
                  <WhatsAppThreadBubble key={msg.id} msg={msg} isLastInGroup={isLastInGroup} />
                );
              })}
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <MessageSquare size={28} className="text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          {selected.status !== 'closed' ? (
            <div className="px-3 py-3 bg-background border-t border-border safe-bottom">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your reply…"
                    rows={1}
                    className="w-full rounded-3xl px-5 py-3 text-sm bg-muted text-foreground focus:outline-none resize-none max-h-24 selectable-content"
                    style={{ minHeight: '44px' }}
                  />
                </div>
                <button
                  onClick={sendReply}
                  disabled={sending || !reply.trim()}
                  className="w-11 h-11 flex items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40 flex-shrink-0 hover:opacity-90 transition-all"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="px-4 py-4 bg-background border-t border-border flex items-center justify-center gap-2 text-muted-foreground text-xs safe-bottom">
              <CheckCheck size={14} /> This conversation is closed
            </div>
          )}
        </div>
      )}
    </OperationsPageLayout>
  );
}

// WhatsApp-style message bubble for admin thread messages
function WhatsAppThreadBubble({ msg, isLastInGroup }) {
  const isAdmin = msg.sender === 'admin';
  const time = new Date(msg.created_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className={`flex ${isAdmin ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}>
      <div className={`max-w-[75%] md:max-w-[65%]`}>
        <div
          className={`rounded-2xl px-3.5 py-2 ${
            isAdmin ? 'vantoris-chat-bubble-out text-white rounded-br-md' : 'vantoris-chat-bubble-in text-foreground rounded-bl-md'
          }`}
        >
          {!isAdmin && (
            <p className="text-emerald-500 text-[10px] font-semibold mb-0.5">Member</p>
          )}
          {isAdmin && msg.admin_name && (
            <p className="text-primary-foreground/70 text-[10px] font-semibold mb-0.5">{msg.admin_name}</p>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap selectable-content">{msg.body}</p>
          {isLastInGroup && (
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-[10px] text-muted-foreground">{time}</span>
              {isAdmin && <ReadReceipt read={msg.read} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}