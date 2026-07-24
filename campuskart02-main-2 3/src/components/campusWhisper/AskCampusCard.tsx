import React from 'react';
import { HelpCircle, Sparkles, CheckCircle } from 'lucide-react';

export const AskCampusCard: React.FC = () => {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 text-slate-100">
        <div className="rounded-3xl bg-sky-500/15 p-3 text-sky-200">
          <HelpCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-sky-300">Ask campus</p>
          <h3 className="text-xl font-semibold text-white">Submit a question anonymously.</h3>
        </div>
      </div>
      <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/80 p-5 text-slate-300">
        <p className="text-sm">Ask about placements, lifestyle, or the latest campus gossip without revealing your identity.</p>
        <div className="mt-5 grid gap-3">
          <div className="rounded-3xl bg-slate-900/90 p-4">
            <p className="text-sm text-slate-400">Anonymous questions</p>
            <p className="mt-2 text-white font-semibold">From exam tips to club hacks, post without fear.</p>
          </div>
          <div className="rounded-3xl bg-slate-900/90 p-4">
            <div className="inline-flex items-center gap-2 text-sm text-emerald-300 mb-2">
              <CheckCircle className="h-4 w-4" /> Helpful answers
            </div>
            <p className="text-slate-400">Vote the best answer and keep the thread useful for everyone.</p>
          </div>
        </div>
      </div>
    </div>
  );
};