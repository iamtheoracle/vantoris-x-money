import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function InternalComments({ entityType, entityId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!entityId) return;
    loadComments();
  }, [entityId]);

  async function loadComments() {
    try {
      const all = await base44.entities.InternalComment.filter(
        { entity_type: entityType, entity_id: entityId },
        'created_date',
        100
      );
      setComments(all);
    } catch (e) {
      console.error(e);
      toast({ title: 'Load failed', description: e.message || 'Unable to load comments.', variant: 'destructive' });
    }
    setLoading(false);
  }

  async function handleAdd() {
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.InternalComment.create({
        entity_type: entityType,
        entity_id: entityId,
        user_id: me.id,
        author_name: me.full_name || me.email || 'Admin',
        content: content.trim(),
      });
      setContent('');
      loadComments();
      toast({ title: 'Comment added', description: 'Your internal comment has been posted.' });
    } catch (e) {
      console.error(e);
      toast({ title: 'Comment failed', description: e.message || 'Unable to add comment.', variant: 'destructive' });
    }
    setSubmitting(false);
  }

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare size={16} className="text-brass" />
        <h3 className="text-white font-semibold text-sm">Internal Comments</h3>
        {comments.length > 0 && (
          <span className="text-[#AAB4C3] text-xs">({comments.length})</span>
        )}
      </div>

      {/* Comments list */}
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-brass/30 border-t-brass rounded-full animate-spin" />
        </div>
      ) : comments.length > 0 ? (
        <div className="space-y-2 mb-3">
          {comments.map(c => (
            <div key={c.id} className="bg-[#1a2535] border border-[#242D38]/60 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-6 h-6 rounded-full bg-brass/15 flex items-center justify-center">
                  <span className="text-brass text-[10px] font-bold">
                    {(c.author_name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-white text-xs font-medium">{c.author_name}</span>
                <span className="text-[#AAB4C3]/60 text-[10px]">
                  {new Date(c.created_date).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-[#AAB4C3] text-sm pl-8">{c.content}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[#AAB4C3]/50 text-xs mb-3">No comments yet. Start the discussion below.</p>
      )}

      {/* Add comment */}
      <div className="flex gap-2">
        <input
          value={content}
          onChange={e => setContent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); } }}
          placeholder="Write a comment..."
          className="flex-1 bg-[#242D38] border border-[#242D38] rounded-xl px-4 py-2.5 text-white text-sm focus:border-brass/50 focus:outline-none"
        />
        <button
          onClick={handleAdd}
          disabled={!content.trim() || submitting}
          className="px-4 py-2.5 bg-brass/15 text-brass rounded-xl flex items-center gap-1.5 hover:bg-brass/25 transition-all disabled:opacity-40 flex-shrink-0"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}