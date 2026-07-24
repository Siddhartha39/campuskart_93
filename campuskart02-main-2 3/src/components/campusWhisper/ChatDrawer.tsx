import React, { useState } from 'react';
import { X, Send, CircleDot } from 'lucide-react';
import { AnonymousUser } from '../../types/whisper';

interface ChatMessage {
  id: string;
  author: AnonymousUser;
  text: string;
  direction: 'incoming' | 'outgoing';
}

interface ChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  typing: boolean;
  online: boolean;
  onSend: (text: string) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({ isOpen, onClose, messages, typing, online, onSend }) => {
  const [draft, setDraft] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/40 p-4 sm:items-center sm:justify-center">
      <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/95 shadow-2xl shadow-slate-950/40">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-slate-400">Anonymous chat</p>
            <h3 className="text-lg font-semibold text-white">Chat with the campus ghost</h3>
          </div>
          <button onClick={onClose} className="rounded-full bg-white/5 p-3 text-slate-300 hover:bg-white/10 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="mb-5 flex items-center justify-between rounded-3xl border border-white/10 bg-slate-950/80 p-4 text-sm text-slate-300">
            <div className="flex items-center gap-2">
              <CircleDot className={`h-3.5 w-3.5 ${online ? 'text-emerald-400' : 'text-slate-500'}`} />
              {online ? 'Online' : 'Offline'}
            </div>
            {typing ? <span>Typing…</span> : <span>Socket ready</span>}
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[32rem] pb-2">
            {messages.map((message) => (
              <div key={message.id} className={`rounded-3xl p-4 ${message.direction === 'outgoing' ? 'bg-violet-500/15 self-end text-slate-100' : 'bg-slate-950/80 text-slate-200'}`}>
                <p className="text-sm leading-6">{message.text}</p>
                <p className="mt-2 text-xs text-slate-500">{message.author.displayName}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-3xl border border-white/10 bg-slate-950/80 px-4 py-4">
            <textarea
              rows={2}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Send an anonymous message..."
              className="w-full resize-none bg-transparent text-slate-100 outline-none placeholder:text-slate-500"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <button
                onClick={() => {
                  onSend(draft);
                  setDraft('');
                }}
                className="inline-flex items-center gap-2 rounded-full bg-violet-500 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-400 transition"
              >
                <Send className="h-4 w-4" /> Send
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};