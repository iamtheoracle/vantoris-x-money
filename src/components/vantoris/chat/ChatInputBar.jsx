import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Camera,
  Mic,
  Send,
  X,
  FileText,
  Image,
  MapPin,
  Paperclip,
} from 'lucide-react';

const ATTACHMENT_OPTIONS = [
  { id: 'document', label: 'Document', icon: FileText },
  { id: 'camera', label: 'Camera', icon: Camera },
  { id: 'image', label: 'Image', icon: Image },
  { id: 'location', label: 'Location', icon: MapPin },
];

export default function ChatInputBar({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [showAttachments, setShowAttachments] = useState(false);
  const [recording, setRecording] = useState(false);

  function handleSend() {
    const content = text.trim();
    if (!content || disabled) return;
    onSend(content);
    setText('');
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleVoiceToggle() {
    setRecording(!recording);
    if (!recording) {
      setTimeout(() => setRecording(false), 3000);
    }
  }

  return (
    <div className="relative">
      <AnimatePresence>
        {showAttachments && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-2 right-2 mb-2 vantoris-glass-dropdown p-3"
          >
            <div className="grid grid-cols-4 gap-2">
              {ATTACHMENT_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    onClick={() => setShowAttachments(false)}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-slate-100 transition"
                  >
                    <div className="w-10 h-10 rounded-xl bg-navy/8 flex items-center justify-center">
                      <Icon size={18} className="text-navy" />
                    </div>
                    <span className="text-[10px] text-gray font-medium">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2 px-3 py-2.5 bg-white border-t border-slate-200 safe-bottom">
        <button
          onClick={() => setShowAttachments(!showAttachments)}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all flex-shrink-0 ${
            showAttachments ? 'bg-navy text-white' : 'bg-slate-100 text-gray hover:bg-slate-200'
          }`}
        >
          {showAttachments ? <X size={18} /> : <Plus size={20} />}
        </button>

        <button className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-100 text-gray hover:bg-slate-200 transition flex-shrink-0">
          <Camera size={18} />
        </button>

        <div className="flex-1 relative">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="w-full resize-none bg-slate-100 rounded-2xl px-4 py-2.5 text-sm text-foreground placeholder:text-gray/60 focus:outline-none focus:bg-white focus:ring-1 focus:ring-navy/10 transition-all max-h-24"
            style={{ minHeight: '40px' }}
          />
        </div>

        {text.trim() ? (
          <button
            onClick={handleSend}
            disabled={disabled}
            className="w-9 h-9 flex items-center justify-center rounded-full bg-navy text-white hover:bg-navy/90 transition flex-shrink-0 disabled:opacity-40"
          >
            <Send size={16} />
          </button>
        ) : (
          <button
            onClick={handleVoiceToggle}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition flex-shrink-0 ${
              recording ? 'bg-crimson text-white' : 'bg-slate-100 text-gray hover:bg-slate-200'
            }`}
          >
            <Mic size={18} className={recording ? 'animate-pulse' : ''} />
          </button>
        )}
      </div>
    </div>
  );
}