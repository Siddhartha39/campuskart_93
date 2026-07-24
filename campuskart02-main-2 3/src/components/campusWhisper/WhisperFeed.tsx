import React from 'react';
import { Whisper, AnonymousUser } from '../../types/whisper';
import { WhisperCard } from './WhisperCard';

interface WhisperFeedProps {
  whispers: Whisper[];
  currentUserId?: string | null;
  openCommentModal: (whisper: Whisper) => void;
  onEdit?: (whisper: Whisper) => void;
  onDelete?: (id: string) => void;
  toggleLike: (id: string) => void;
  shareWhisper: (id: string) => void;
  reportWhisper: (id: string, reason?: string) => void;
  voteWhisper?: (id: string, delta: number) => void;
  votePoll?: (id: string, optionId: string) => void;
  onOpenAuthor?: (author: AnonymousUser, authorUid?: string | null) => void;
  onToggleFollow?: (authorUid: string) => void;
  isFollowingAuthor?: (authorUid: string) => boolean;
  onDirectChat?: (authorUid: string) => void;
  viewMode?: 'college' | 'open' | 'following';
}

export const WhisperFeed: React.FC<WhisperFeedProps> = ({ whispers, currentUserId, openCommentModal, onEdit, onDelete, toggleLike, shareWhisper, reportWhisper, voteWhisper, votePoll, onOpenAuthor, onToggleFollow, isFollowingAuthor, onDirectChat, viewMode = 'college' }) => {
  const [sort, setSort] = React.useState<'new' | 'top'>('new');
  const [whisperToDelete, setWhisperToDelete] = React.useState<Whisper | null>(null);

  const confirmDelete = async () => {
    if (!whisperToDelete || !onDelete) {
      setWhisperToDelete(null);
      return;
    }
    await onDelete(whisperToDelete.id);
    setWhisperToDelete(null);
  };

  const sorted = React.useMemo(() => {
    if (sort === 'new') return [...whispers].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (sort === 'top') return [...whispers].sort((a, b) => (b.likes || 0) - (a.likes || 0));
    return whispers;
  }, [whispers, sort]);
  return (
    <section className="space-y-6">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <span className="uppercase tracking-[0.2em] text-violet-400">Sort</span>
          <button onClick={() => setSort('new')} className={`px-3 py-1 rounded-full transition ${sort === 'new' ? 'bg-white/20 text-white border border-white/30' : 'bg-white/10 text-gray-400 border border-white/10 hover:bg-white/15'}`}>New</button>
          <button onClick={() => setSort('top')} className={`px-3 py-1 rounded-full transition ${sort === 'top' ? 'bg-white/20 text-white border border-white/30' : 'bg-white/10 text-gray-400 border border-white/10 hover:bg-white/15'}`}>Top</button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-[2rem] border border-white/10 bg-white/5 backdrop-blur-sm p-10 text-center text-gray-400 shadow-xl">
          No whispers match your search yet. Try another category or ask your own anonymous question.
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {sorted.map((whisper) => (
              <WhisperCard
                key={whisper.id}
                whisper={whisper}
                canEdit={currentUserId ? whisper.authorUid === currentUserId : false}
                onEdit={onEdit ? () => onEdit(whisper) : undefined}
                onDelete={onDelete ? () => setWhisperToDelete(whisper) : undefined}
                onComment={() => openCommentModal(whisper)}
                onUpvote={() => voteWhisper ? voteWhisper(whisper.id, 1) : toggleLike(whisper.id)}
                onDownvote={voteWhisper ? () => voteWhisper(whisper.id, -1) : undefined}
                onShare={() => shareWhisper(whisper.id)}
                onReport={(reason?: string) => reportWhisper(whisper.id, reason)}
                onOpenAuthor={() => onOpenAuthor?.(whisper.author, whisper.authorUid)}
                onToggleFollow={whisper.authorUid && onToggleFollow ? () => onToggleFollow(whisper.authorUid) : undefined}
                onVotePoll={votePoll}
                isFollowing={whisper.authorUid ? isFollowingAuthor?.(whisper.authorUid) : false}
                onDirectChat={whisper.authorUid && onDirectChat ? () => onDirectChat(whisper.authorUid) : undefined}
                viewMode={viewMode}
              />
            ))}
          </div>
          {whisperToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
              <div className="w-full max-w-md rounded-[2rem] bg-slate-900 border border-slate-700 p-6 shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-3">Confirm Delete</h3>
                <p className="text-slate-300 mb-5">Are you sure you want to delete this whisper? This action cannot be undone.</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setWhisperToDelete(null)}
                    className="w-full sm:w-auto rounded-full border border-slate-700 bg-slate-800 px-4 py-2 text-slate-200 hover:bg-slate-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="w-full sm:w-auto rounded-full bg-rose-600 px-4 py-2 text-white hover:bg-rose-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
};