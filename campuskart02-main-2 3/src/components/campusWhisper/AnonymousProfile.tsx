import React from 'react';
import { Award, Sparkles, ShieldCheck, Users } from 'lucide-react';
import { anonymousNames } from '../../data/anonymousNames';

const profile = {
  displayName: anonymousNames[8],
  karma: 1240,
  badges: ['Campus Whisperer', 'Night Owl', 'Silent Supporter'],
  posts: 78,
  comments: 196
};

export const AnonymousProfile: React.FC = () => {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/85 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-[1.5rem] bg-gradient-to-br from-violet-500 via-sky-500 to-indigo-500 flex items-center justify-center text-2xl font-semibold text-white shadow-lg shadow-violet-500/20">
          {profile.displayName.charAt(0)}
        </div>
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-violet-300">Anonymous profile</p>
          <h3 className="text-2xl font-semibold text-white">{profile.displayName}</h3>
        </div>
      </div>

      <div className="mt-6 space-y-4 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
        <div className="flex items-center justify-between gap-3 text-sm text-slate-400">
          <span>Karma</span>
          <span className="font-semibold text-white">{profile.karma}</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-300">
            <div className="inline-flex items-center gap-2 text-violet-300 mb-3">
              <Sparkles className="h-4 w-4" /> Posts
            </div>
            <p className="text-xl font-semibold text-white">{profile.posts}</p>
          </div>
          <div className="rounded-3xl bg-slate-900/90 p-4 text-sm text-slate-300">
            <div className="inline-flex items-center gap-2 text-sky-300 mb-3">
              <Users className="h-4 w-4" /> Comments
            </div>
            <p className="text-xl font-semibold text-white">{profile.comments}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {profile.badges.map((badge) => (
          <span key={badge} className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
            <Award className="h-4 w-4 text-violet-300" /> {badge}
          </span>
        ))}
      </div>

      <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/80 p-5 text-sm text-slate-400">
        Identity stays hidden until both sides agree to reveal. Keep the whisper safe and anonymous.
      </div>
    </div>
  );
};