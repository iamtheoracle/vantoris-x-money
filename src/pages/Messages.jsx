import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Bell, CheckCheck, Shield, ArrowDownLeft, ArrowUpRight, Info, Send,
  MessageCircle, ChevronRight, X, Trash2, Edit3, Check, MoreVertical,
  ArrowLeft, Plus, Search, User
} from 'lucide-react';
import { OPERATIONS_EMAIL } from '@/lib/businessConfig';
import ReadReceipt from '@/components/vantoris/chat/ReadReceipt';
import { useToast } from '@/components/ui/use-toast';

const typeIcons = {
  success: { icon: CheckCheck, bg: 'bg-emerald-500/15', color: 'text-emerald-400' },
  warning: { icon: Shield, bg: 'bg-amber-500/15', color: 'text-amber-400' },
  action: { icon: ArrowUpRight, bg: 'bg-red-500/15', color: 'text-red-400' },
  info: { icon: Info, bg: 'bg-blue-500/15', color: 'text-blue-400' },
};

// localStorage helpers for custom labels
const LABELS_KEY = 'vantoris_member_thread_labels';
function getLabels() { try { return JSON.parse(localStorage.getItem(LABELS_KEY) || '{}'); } catch { return {}; } }
function setLabel(id, label) {
  const labels = getLabels();
  if (label && label.trim()) labels[id] = label.trim();
  else delete labels[id];
  localStorage.setItem(LABELS_KEY, JSON.stringify(labels));
}

export default function Messages() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [repliedIds, setRepliedIds] = useState([]);
  const [threads, setThreads] = useState([]);
  const [openThread, setOpenThread] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [threadReply, setThreadReply] = useState('');
  const [contextMenuThread, setContextMenuThread] = useState(null);
  const [renamingThread, setRenamingThread] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [showConversations, setShowConversations] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  async function loadData() {
    const me = await base44.auth.me();
    setUser(me);
    const [notifs, thrds] = await Promise.all([
      base44.entities.Notification.filter({ user_id: me.id }, '-created_date', 50),
      base44.entities.MessageThread.filter({ user_id: me.id }, '-created_date', 50),
    ]);
    const labels = getLabels();
    thrds.forEach(t => { t._label = labels[t.id] || null; });
    setNotifications(notifs);
    setThreads(thrds);
    setLoading(false);
    const unread = notifs.filter(n => !n.read);
    for (const n of unread) {
      base44.entities.Notification.update(n.id, { read: true });
    }
  }

  async function sendReply(notif) {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      const subject = notif.title || 'Message to Support';
      const existing = threads.find(t => t.subject === subject && t.status !== 'closed');
      let threadId;
      if (existing) {
        threadId = existing.id;
      } else {
        const thread = await base44.entities.MessageThread.create({
          user_id: user.id, subject,
          last_message: replyText, last_sender: 'member',
          last_message_date: new Date().toISOString(),
          unread_by_member: false, unread_by_admin: true,
        });
        threadId = thread.id;
      }
      await base44.entities.ThreadMessage.create({
        thread_id: threadId, user_id: user.id,
        sender: 'member', body: replyText,
      });
      await base44.entities.MessageThread.update(threadId, {
        last_message: replyText.slice(0, 200), last_sender: 'member',
        last_message_date: new Date().toISOString(), unread_by_admin: true,
      });
      await base44.integrations.Core.SendEmail({
        to: OPERATIONS_EMAIL,
        subject: `Member Message: ${subject}`,
        body: `Member: ${user?.full_name || 'Unknown'} (${user?.email || 'No email'})\n\nOriginal Notification: ${notif.title}\n${notif.message}\n\nMember Reply:\n${replyText}\n\nView and reply in the Operations Center under Member Messages.`,
      });
      setRepliedIds(prev => [...prev, notif.id]);
      setReplyingTo(null);
      setReplyText('');
      loadData();
      toast({ title: 'Reply sent', description: 'Your message has been sent to support.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Reply failed', description: e.message || 'Unable to send reply.', variant: 'destructive' });
    }
    setSending(false);
  }

  async function openConversation(thread) {
    setOpenThread(thread);
    setThreadReply('');
    setShowConversations(true);
    try {
      const msgs = await base44.entities.ThreadMessage.filter({ thread_id: thread.id }, 'created_date', 200);
      setThreadMessages(msgs);
      if (thread.unread_by_member) {
        await base44.entities.MessageThread.update(thread.id, { unread_by_member: false });
        setThreads(prev => prev.map(t => t.id === thread.id ? { ...t, unread_by_member: false } : t));
      }
      const adminUnread = msgs.filter(m => m.sender === 'admin' && !m.read);
      for (const m of adminUnread) {
        base44.entities.ThreadMessage.update(m.id, { read: true });
      }
      if (adminUnread.length > 0) {
        setThreadMessages(prev => prev.map(m => m.sender === 'admin' ? { ...m, read: true } : m));
      }
    } catch (e) {
      console.error(e);
      toast({ title: 'Load failed', description: e.message || 'Unable to open conversation.', variant: 'destructive' });
    }
  }

  async function sendThreadReply() {
    if (!threadReply.trim() || !openThread) return;
    setSending(true);
    try {
      await base44.entities.ThreadMessage.create({
        thread_id: openThread.id, user_id: user.id,
        sender: 'member', body: threadReply,
      });
      await base44.entities.MessageThread.update(openThread.id, {
        last_message: threadReply.slice(0, 200), last_sender: 'member',
        last_message_date: new Date().toISOString(), unread_by_admin: true,
      });
      await base44.integrations.Core.SendEmail({
        to: OPERATIONS_EMAIL,
        subject: `Member Reply: ${openThread.subject}`,
        body: `Member: ${user?.full_name || 'Unknown'} (${user?.email || 'No email'})\n\nMember Reply:\n${threadReply}\n\nView and reply in the Operations Center under Member Messages.`,
      });
      const msgs = await base44.entities.ThreadMessage.filter({ thread_id: openThread.id }, 'created_date', 200);
      setThreadMessages(msgs);
      setThreadReply('');
      loadData();
      toast({ title: 'Message sent', description: 'Your reply has been sent to support.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Send failed', description: e.message || 'Unable to send message.', variant: 'destructive' });
    }
    setSending(false);
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
      if (openThread?.id === threadId) {
        setOpenThread(null);
        setShowConversations(false);
      }
    } catch (e) {
      console.error('Delete thread error:', e);
      toast({ title: 'Delete failed', description: e.message || 'Unable to delete conversation.', variant: 'destructive' });
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
      if (openThread?.id === renamingThread) {
        setOpenThread(prev => ({ ...prev, _label: renameValue.trim() || null }));
      }
    }
    setRenamingThread(null);
    setRenameValue('');
  }

  function getThreadDisplay(thread) {
    return thread._label || thread.subject || 'Conversation';
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendThreadReply();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
      </div>
    );
  }

  const activeThreads = threads.filter(t => t.status !== 'closed' && t.last_sender === 'admin');
  const filteredThreads = threads.filter(t =>
    getThreadDisplay(t).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-3 md:px-5 pt-4 md:pt-6">
      <h1 className="text-xl md:text-2xl font-bold text-foreground mb-1">Messages</h1>
      <p className="text-muted-foreground text-sm mb-4">{activeThreads.length > 0 ? `${activeThreads.length} active conversations · ` : ''}{notifications.length} notifications</p>

      {/* WhatsApp-style Conversation List */}
      {threads.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-foreground font-semibold text-sm">Conversations</h3>
            <span className="text-xs text-muted-foreground">{threads.length} total</span>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search conversations..."
              className="w-full rounded-full pl-9 pr-3 py-2 text-xs bg-muted focus:outline-none focus:ring-1 focus:ring-ring/30 transition-all selectable-content"
            />
          </div>

          <div className="vantoris-card overflow-hidden">
            {filteredThreads.map((thread, idx) => (
              <div key={thread.id} className="relative">
                <button
                  onClick={() => openConversation(thread)}
                  className={`group w-full text-left px-4 py-3 flex items-center gap-3 transition-all hover:bg-muted/50 ${thread.unread_by_member ? 'bg-primary/5' : ''} ${idx > 0 ? 'border-t border-border' : ''}`}
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10">
                    <MessageCircle size={18} className="text-primary" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${thread.unread_by_member ? 'font-bold text-foreground' : 'font-medium text-foreground'}`}>
                        {getThreadDisplay(thread)}
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
                          {thread.last_sender === 'admin' ? 'Staff' : 'You'}:
                        </span>{' '}{thread.last_message || 'No messages yet'}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {thread.unread_by_member && <span className="w-2 h-2 rounded-full bg-primary" />}
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
            ))}
          </div>
        </div>
      )}

      {/* Notifications */}
      <h3 className="text-foreground font-semibold text-sm mb-3">Notifications</h3>
      {notifications.length === 0 ? (
        <div className="vantoris-card p-8 text-center">
          <Bell size={32} className="text-muted-foreground mx-auto mb-3" />
          <p className="text-foreground font-medium mb-1">No Notifications</p>
          <p className="text-muted-foreground text-sm">You're all caught up.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map(notif => {
            const t = typeIcons[notif.type] || typeIcons.info;
            const Icon = t.icon;
            return (
              <div key={notif.id} className={`vantoris-card p-4 flex items-start gap-3 ${!notif.read ? 'border-primary/20' : ''}`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${t.bg}`}>
                  <Icon size={16} className={t.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-foreground text-sm font-medium">{notif.title}</p>
                    {!notif.read && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                  </div>
                  <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{notif.message}</p>
                  <p className="text-muted-foreground/50 text-[10px] mt-1">
                    {new Date(notif.created_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {repliedIds.includes(notif.id) ? (
                    <p className="text-emerald-500 text-[11px] mt-2 flex items-center gap-1">
                      <CheckCheck size={12} /> Reply sent — see Conversations above
                    </p>
                  ) : replyingTo === notif.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Type your reply…"
                        rows={2}
                        className="w-full bg-muted rounded-xl px-3 py-2 text-foreground text-sm focus:ring-1 focus:ring-primary/30 focus:outline-none resize-none selectable-content"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => sendReply(notif)}
                          disabled={sending || !replyText.trim()}
                          className="flex-1 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 disabled:opacity-40"
                        >
                          <Send size={12} /> Send
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(''); }}
                          className="px-3 py-2 bg-muted text-muted-foreground text-xs font-medium rounded-xl"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setReplyingTo(notif.id); setReplyText(''); }}
                      className="text-primary text-[11px] font-medium mt-2"
                    >
                      Reply
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* WhatsApp-style Conversation Dialog */}
      {openThread && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background">
          {/* Chat Header */}
          <div className="flex items-center gap-3 px-4 py-3 vantoris-glass-header safe-top">
            <button onClick={() => { setOpenThread(null); setShowConversations(false); }} className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-all">
              <ArrowLeft size={20} />
            </button>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm text-foreground truncate">{getThreadDisplay(openThread)}</h3>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                {openThread.status === 'closed' ? (
                  <span className="flex items-center gap-1"><CheckCheck size={10} /> Conversation closed</span>
                ) : (
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Vantoris Support · Online</span>
                )}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto vantoris-scroll px-4 py-4 vantoris-mesh-bg">
            <div className="space-y-1">
              {threadMessages.map((msg, idx) => {
                const prevMsg = threadMessages[idx - 1];
                const nextMsg = threadMessages[idx + 1];
                const isLastInGroup = !nextMsg || nextMsg.sender !== msg.sender;
                return (
                  <WhatsAppThreadBubble key={msg.id} msg={msg} isLastInGroup={isLastInGroup} />
                );
              })}
              {threadMessages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-48 text-center">
                  <MessageCircle size={28} className="text-muted-foreground/40 mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Send a message to start the conversation</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input */}
          {openThread.status !== 'closed' ? (
            <div className="px-3 py-3 bg-background border-t border-border safe-bottom">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <textarea
                    value={threadReply}
                    onChange={(e) => setThreadReply(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message…"
                    rows={1}
                    className="w-full rounded-3xl px-5 py-3 text-sm bg-muted text-foreground focus:outline-none resize-none max-h-24 selectable-content"
                    style={{ minHeight: '44px' }}
                  />
                </div>
                <button
                  onClick={sendThreadReply}
                  disabled={sending || !threadReply.trim()}
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
    </div>
  );
}

// WhatsApp-style message bubble for thread messages
function WhatsAppThreadBubble({ msg, isLastInGroup }) {
  const isAdmin = msg.sender === 'admin';
  const time = new Date(msg.created_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}>
      <div className={`max-w-[75%] md:max-w-[65%]`}>
        <div
          className={`rounded-2xl px-3.5 py-2 ${
            isAdmin ? 'vantoris-chat-bubble-in text-foreground rounded-bl-md' : 'vantoris-chat-bubble-out text-white rounded-br-md'
          }`}
        >
          {isAdmin && msg.admin_name && (
            <p className="text-primary text-[10px] font-semibold mb-0.5">{msg.admin_name}</p>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-wrap selectable-content">{msg.body}</p>
          {isLastInGroup && (
            <div className="flex items-center justify-end gap-1 mt-0.5">
              <span className="text-[10px] text-muted-foreground">{time}</span>
              {!isAdmin && <ReadReceipt read={msg.read} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}