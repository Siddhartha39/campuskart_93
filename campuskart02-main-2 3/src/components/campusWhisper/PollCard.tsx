import React from 'react';
import { usePoll } from '../../hooks/usePoll';
import { Poll } from '../../types/whisper';

interface PollCardProps {
  poll: Poll;
  onVote?: (optionId: string) => Promise<void> | void;
}

export const PollCard: React.FC<PollCardProps> = ({ poll, onVote }) => {
  const { poll: statePoll, percentages, hasVoted, totalVotes, vote } = usePoll(poll);

  const handleVote = async (optionId: string) => {
    vote(optionId, 'anon-user');
    if (onVote) {
      await onVote(optionId);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-700 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.12),_transparent_22%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.12),_transparent_22%),linear-gradient(180deg,_#111827_0%,_#0f172a_100%)] bg-[length:200%_200%] animate-gradient-move shadow-sm p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Poll</p>
          <h3 className="mt-1 text-base font-semibold text-white">{statePoll.question}</h3>
        </div>
        <span className="rounded-full bg-slate-800 px-2 py-1 text-[11px] text-slate-300">{totalVotes} votes</span>
      </div>

      <div className="mt-4 space-y-2">
        {percentages.map((option) => (
          <div key={option.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-700">{option.label}</span>
              <span className="text-slate-500">{option.percent}%</span>
            </div>
            <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
              <div className="h-full rounded-full bg-sky-500" style={{ width: `${option.percent}%` }} />
            </div>
            {!hasVoted ? (
              <button
                onClick={() => handleVote(option.id)}
                className="mt-3 w-full rounded-full bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500 transition"
              >
                Vote
              </button>
            ) : null}
          </div>
        ))}
      </div>

      {hasVoted ? (
        <p className="mt-4 text-sm text-slate-400">Thanks for voting — results update in real time.</p>
      ) : (
        <p className="mt-4 text-sm text-slate-400">Vote once and see the campus consensus.</p>
      )}
    </div>
  );
};