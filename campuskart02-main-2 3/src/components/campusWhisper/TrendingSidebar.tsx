import React from 'react';
import { TrendingUp, Sparkles, Clock3, Heart } from 'lucide-react';

const trendingItems = [
  { label: 'Library late-night buzz', count: 96 },
  { label: 'Placement preparation tips', count: 82 },
  { label: 'Mess hall secrets', count: 71 },
  { label: 'Event rumors', count: 63 }
];

export const TrendingSidebar: React.FC = () => {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 text-slate-100">
        <div className="rounded-3xl bg-violet-500/15 p-3 text-violet-200">
          <TrendingUp className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Trending</p>
          <h3 className="text-xl font-semibold text-white">Campus pulse</h3>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {trendingItems.map((item, index) => (
          <div key={item.label} className="rounded-3xl border border-white/10 bg-slate-950/80 p-4">
            <div className="flex items-center justify-between gap-3 text-slate-100">
              <span className="font-medium">{item.label}</span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-300">{item.count}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{index === 0 ? 'Hot topic' : 'Rising conversation'}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
        <div className="flex items-center gap-3 text-slate-200">
          <Sparkles className="h-5 w-5 text-rose-300" />
          <p className="text-sm">Top whisper of the hour: confessions and quiz night hacks.</p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 text-sm text-slate-400">
          <div className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" /> Live updates
          </div>
          <div className="inline-flex items-center gap-2">
            <Heart className="h-4 w-4 text-rose-300" /> Community votes
          </div>
        </div>
      </div>
    </div>
  );
};