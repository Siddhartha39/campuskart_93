import React from 'react';
import { MessageSquare, Plus, Send, ArrowRight } from 'lucide-react';

interface FloatingWhisperButtonProps {
  onOpen: () => void;
  onChat: () => void;
}

export const FloatingWhisperButton: React.FC<FloatingWhisperButtonProps> = ({ onOpen, onChat }) => {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <button
        type="button"
        onClick={onChat}
        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/95 px-5 py-3 text-sm font-semibold text-slate-100 shadow-2xl shadow-slate-950/40 transition hover:-translate-y-0.5 hover:bg-slate-800"
      >
        <MessageSquare className="h-4 w-4" /> Chat
      </button>
      <button
        type="button"
        onClick={onOpen}
        className="inline-flex items-center justify-center rounded-full bg-violet-500 px-5 py-4 text-white shadow-2xl shadow-violet-500/30 transition hover:scale-105"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
};