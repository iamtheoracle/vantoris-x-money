import React, { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { CheckCheck, ChevronRight, ChevronDown, Star } from 'lucide-react';
import { getMessageKey, isStarred, toggleStar } from '@/lib/starredMessages';
import VantorisMonogram from '@/components/vantoris/brand/VantorisMonogram';

const REACTIONS = ['👍', '❤️', '👏', '🔥', '💯'];

export default function ChatMessage({ message, isUser, showAvatar, isLastInGroup, convId, onStarToggle }) {
  const [showReactions, setShowReactions] = useState(false);
  const [reaction, setReaction] = useState(null);
  const [toolCallExpanded, setToolCallExpanded] = useState({});
  const msgKey = getMessageKey(message);
  const starred = convId ? isStarred(convId, msgKey) : false;

  function handleStarClick(e) {
    e.stopPropagation();
    if (convId) {
      toggleStar(convId, msgKey);
      onStarToggle?.();
    }
  }

  function handleReaction(emoji) {
    setReaction(emoji);
    setShowReactions(false);
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} ${isLastInGroup ? 'mb-3' : 'mb-0.5'}`}>
      <div className={`flex gap-2 max-w-[82%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className="w-7 h-7 flex-shrink-0 self-end">
          {showAvatar && !isUser && (
            <div className="w-7 h-7 rounded-full bg-navy/8 flex items-center justify-center">
              <VantorisMonogram size={18} variant="flat" theme="light" />
            </div>
          )}
          {showAvatar && isUser && (
            <div className="w-7 h-7 rounded-full bg-gold/15 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gold uppercase">You</span>
            </div>
          )}
        </div>

        {/* Bubble */}
        <div className="relative group">
          {/* Star button */}
          {convId && (
            <button
              onClick={handleStarClick}
              className={`absolute -top-2.5 ${isUser ? '-left-6' : '-right-6'} p-1 rounded-full transition-all z-10 ${starred ? 'opacity-100' : 'opacity-0 group-hover:opacity-60 hover:!opacity-100'}`}
              title={starred ? 'Remove star' : 'Star this message'}
            >
              <Star size={13} fill={starred ? 'currentColor' : 'none'} className={starred ? 'text-gold' : 'text-gray'} />
            </button>
          )}
          <div
            className={`rounded-2xl px-3.5 py-2.5 ${
              isUser
                ? 'vantoris-chat-bubble-out text-white rounded-br-md'
                : 'vantoris-chat-bubble-in text-foreground rounded-bl-md'
            }`}
            onDoubleClick={() => setShowReactions(!showReactions)}
          >
            {message.content && (
              isUser ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              ) : (
                <ReactMarkdown
                  className="text-sm leading-relaxed prose prose-sm max-w-none [&_p]:my-0.5 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_strong]:font-semibold [&_code]:bg-slate-100 [&_code]:px-1 [&_code]:rounded"
                >
                  {message.content}
                </ReactMarkdown>
              )
            )}

            {/* Tool calls */}
            {message.tool_calls?.map((tc, idx) => (
              <ToolCallInline
                key={idx}
                toolCall={tc}
                expanded={toolCallExpanded[idx] || false}
                onToggle={() => setToolCallExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }))}
              />
            ))}

            {/* Reaction badge */}
            {reaction && (
              <span className="absolute -bottom-2.5 left-2 text-xs bg-white border border-slate-200 rounded-full px-1.5 py-0.5 shadow-sm">
                {reaction}
              </span>
            )}
          </div>

          {/* Reaction picker */}
          {showReactions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`absolute -top-10 ${isUser ? 'right-0' : 'left-0'} flex items-center gap-0.5 bg-white border border-slate-200 rounded-full px-1.5 py-1 shadow-lg z-10`}
            >
              {REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-base hover:scale-125 transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </motion.div>
          )}

          {/* Timestamp + read receipt */}
          {isLastInGroup && (
            <div className={`flex items-center gap-1 mt-0.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
              <span className="text-[10px] text-gray/60">
                {message.timestamp || formatTime(message.created_date)}
              </span>
              {isUser && <CheckCheck size={12} className="text-navy/40" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolCallInline({ toolCall, expanded, onToggle }) {
  const status = toolCall.status || 'completed';
  const isFailed = ['failed', 'error'].includes(status);
  const statusColor = isFailed ? 'text-crimson' : status === 'pending' || status === 'running' ? 'text-gold' : 'text-mint';
  const hideDetails = toolCall.display_projection?.hide_details && toolCall.display_projection?.details_redacted;

  if (hideDetails) {
    return (
      <div className="mt-1.5 text-xs">
        <span className={statusColor}>
          {isFailed ? (toolCall.display_projection?.error_label || 'Failed') :
           status === 'pending' || status === 'running' ? (toolCall.display_projection?.active_label || 'Processing...') :
           (toolCall.display_projection?.label || toolCall.name)}
        </span>
      </div>
    );
  }

  return (
    <div className="mt-1.5 text-xs border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
      <button onClick={onToggle} className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-slate-100 transition">
        {expanded ? <ChevronDown size={11} className="text-gray" /> : <ChevronRight size={11} className="text-gray" />}
        <span className="text-gray font-medium">{toolCall.name}</span>
        <span className={`ml-auto ${statusColor} capitalize`}>{status}</span>
      </button>
      {expanded && (
        <div className="px-2.5 py-1.5 border-t border-slate-200 space-y-1.5">
          {toolCall.arguments_string && (
            <div>
              <p className="text-gray text-[9px] uppercase tracking-wider mb-0.5">Parameters</p>
              <pre className="text-gray text-[10px] overflow-x-auto whitespace-pre-wrap">
                {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}
              </pre>
            </div>
          )}
          {toolCall.results && (
            <div>
              <p className="text-gray text-[9px] uppercase tracking-wider mb-0.5">Result</p>
              <pre className={`text-[10px] overflow-x-auto whitespace-pre-wrap ${isFailed ? 'text-crimson' : 'text-mint'}`}>
                {(() => { try { return typeof toolCall.results === 'string' ? toolCall.results : JSON.stringify(toolCall.results, null, 2); } catch { return String(toolCall.results); } })()}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}