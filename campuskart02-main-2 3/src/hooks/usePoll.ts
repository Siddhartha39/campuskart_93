import { useMemo, useState } from 'react';
import { Poll, Vote } from '../types/whisper';

export const usePoll = (initialPoll: Poll, initialHasVoted = false) => {
  const [poll, setPoll] = useState<Poll>(initialPoll);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [hasVoted, setHasVoted] = useState(initialHasVoted || initialPoll.hasVoted);

  const totalVotes = useMemo(
    () => poll.options.reduce((sum, option) => sum + option.count, 0),
    [poll.options]
  );

  const percentages = useMemo(
    () =>
      poll.options.map((option) => ({
        ...option,
        percent: totalVotes ? Math.round((option.count / totalVotes) * 100) : 0
      })),
    [poll.options, totalVotes]
  );

  const vote = (optionId: string, userId: string) => {
    if (hasVoted || poll.isClosed) return;
    setPoll((current) => ({
      ...current,
      options: current.options.map((option) =>
        option.id === optionId ? { ...option, count: option.count + 1 } : option
      ),
      totalVotes: current.totalVotes + 1
    }));
    setHasVoted(true);
    setVotes((current) => [
      ...current,
      {
        id: `vote-${Date.now()}`,
        pollId: poll.id,
        optionId,
        userId,
        createdAt: new Date().toISOString()
      }
    ]);
  };

  return {
    poll,
    percentages,
    hasVoted,
    totalVotes,
    vote
  };
};
