import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, MessageSquare, Share2, Flag, Clock3, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Bookmark } from 'lucide-react';
import { Whisper } from '../../types/whisper';
import { PollCard } from './PollCard';
import { normalizeSupabasePublicUrl } from '../../config/supabase';

interface WhisperCardProps {
  whisper: Whisper;
  onUpvote: () => void;
  onDownvote?: () => void;
  onComment: () => void;
  onShare: () => void;
  onReport: (reason?: string) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onOpenAuthor?: () => void;
  onToggleFollow?: () => void;
  onVotePoll?: (whisperId: string, optionId: string) => void;
  isFollowing?: boolean;
  onDirectChat?: () => void;
  canEdit?: boolean;
  viewMode?: 'college' | 'open' | 'following';
}

const formatTime = (dateString: string) => {
  const diff = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
};

const WhisperCardComponent: React.FC<WhisperCardProps> = ({ whisper, onUpvote, onDownvote, onComment, onShare, onReport, onEdit, onDelete, onOpenAuthor, onToggleFollow, onVotePoll, isFollowing, onDirectChat, canEdit, viewMode = 'college' }) => {
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  const openReport = () => { setReportReason(''); setIsReporting(true); };
  const cancelReport = () => { setIsReporting(false); setReportReason(''); };
  const submitReport = () => { onReport(reportReason || undefined); cancelReport(); };
  const openZoom = (index = 0) => { setActiveImageIndex(index); setIsZoomOpen(true); };
  const closeZoom = () => setIsZoomOpen(false);

  useEffect(() => {
    if (!isZoomOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeZoom();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isZoomOpen]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [whisper.id, whisper.imageUrls?.length]);

  return (
    <article className="w-full flex flex-col gap-2 rounded-3xl border border-slate-700 bg-gradient-to-br from-slate-900/80 to-slate-800/80 shadow-2xl shadow-slate-950/30 backdrop-blur-xl p-2.5 transition-transform duration-200 ease-out hover:-translate-y-1 hover:shadow-xl md:flex-row">
      <div className="flex flex-col items-center rounded-2xl bg-slate-900/85 px-2 py-1.5 text-slate-100 shadow-inner">
        <button aria-label="upvote" className="p-1 rounded-full transition hover:bg-slate-800 hover:text-sky-300" onClick={onUpvote}><ChevronUp className="h-4.5 w-4.5" /></button>
        <div className="mx-1 text-center font-semibold text-xs text-white">{whisper.likes}</div>
        <button aria-label="downvote" className="p-1 rounded-full transition hover:bg-slate-800 hover:text-cyan-300" onClick={onDownvote}><ChevronDown className="h-4.5 w-4.5" /></button>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-start justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-500 to-cyan-400 flex items-center justify-center text-[10px] font-semibold text-slate-950">{whisper.author.displayName.charAt(0)}</div>
              <div>
                <button type="button" onClick={onOpenAuthor} className="flex items-center gap-2 text-left text-sm font-semibold text-white transition hover:text-cyan-300">
                  {whisper.author.displayName}
                  {viewMode === 'open' && whisper.college && (
                    <span className="inline-flex items-center rounded-full bg-gradient-to-r from-sky-500/20 to-cyan-500/20 px-2 py-1 text-xs font-medium text-cyan-200 border border-cyan-500/30">
                      🏫 {whisper.college}
                    </span>
                  )}
                </button>
                <div className="text-xs text-slate-400 flex items-center gap-2"><Clock3 className="h-3 w-3" />{formatTime(whisper.createdAt)} · {whisper.category}</div>
              </div>
            </div>
            {onToggleFollow && whisper.authorUid ? (
              <button
                type="button"
                onClick={onToggleFollow}
                className={`rounded-full px-3 py-2 text-xs font-semibold transition ${isFollowing ? 'bg-emerald-500/20 text-white hover:bg-emerald-500/30' : 'border border-slate-700 bg-slate-900/80 text-white hover:border-slate-500 hover:bg-slate-800'}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            ) : null}
          </div>
          <div className="text-xs text-slate-400">{whisper.anonymous ? 'Anonymous' : ''}</div>
        </div>

        <div className="mt-1.5 text-slate-100 leading-6 text-sm">
          {typeof whisper.message === 'string' ? (
            (() => {
              const maxPreview = 280;
              const isLong = whisper.message.length > maxPreview;
              if (isLong && !expanded) {
                return (
                  <>
                    <span>{whisper.message.slice(0, maxPreview)}…</span>
                    <button onClick={() => setExpanded(true)} className="ml-2 text-xs font-semibold text-cyan-300 hover:underline">Read more</button>
                  </>
                );
              }
              return (
                <>
                  <span>{whisper.message}</span>
                  {isLong && (
                    <button onClick={() => setExpanded(false)} className="ml-2 text-xs font-semibold text-cyan-300 hover:underline">Show less</button>
                  )}
                </>
              );
            })()
          ) : null}
        </div>

        {whisper.poll ? (
          <div className="mt-4 mx-auto w-full max-w-xl rounded-3xl border border-slate-700 bg-slate-950/90 p-3 shadow-sm shadow-slate-950/40">
            <PollCard poll={whisper.poll} onVote={onVotePoll ? (optionId) => onVotePoll(whisper.id, optionId) : undefined} />
          </div>
        ) : null}

        {whisper.imageUrls && whisper.imageUrls.length > 0 ? (
          <>
            <div className="relative mt-3 overflow-hidden rounded-3xl border border-slate-700 bg-slate-900/70 min-h-[140px] flex items-center justify-center">
              <button
                type="button"
                onClick={() => setActiveImageIndex((prev) => (prev - 1 + whisper.imageUrls!.length) % whisper.imageUrls!.length)}
                className="absolute left-2 top-1/2 z-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveImageIndex((prev) => (prev + 1) % whisper.imageUrls!.length)}
                className="absolute right-2 top-1/2 z-20 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white transition hover:bg-black/60"
                aria-label="Next image"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => openZoom(activeImageIndex)}
                className="w-full"
              >
                <img
                  src={normalizeSupabasePublicUrl(whisper.imageUrls[activeImageIndex])}
                  alt={`whisper-${activeImageIndex + 1}`}
                  className="w-full max-h-[55vh] object-contain"
                />
              </button>
            </div>
            {whisper.imageUrls.length > 1 ? (
              <div className="mt-3 flex items-center justify-center gap-2">
                {whisper.imageUrls.map((_, dotIndex) => (
                  <button
                    key={`dot-${dotIndex}`}
                    type="button"
                    onClick={() => setActiveImageIndex(dotIndex)}
                    className={`h-2.5 w-2.5 rounded-full ${activeImageIndex === dotIndex ? 'bg-cyan-300' : 'bg-slate-600'} transition`}
                    aria-label={`View image ${dotIndex + 1}`}
                  />
                ))}
              </div>
            ) : null}
            {isZoomOpen && createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4">
                <div className="absolute inset-0" aria-hidden="true" onClick={closeZoom} />
                <div className="relative max-h-[95vh] max-w-[95vw] overflow-hidden rounded-3xl shadow-2xl">
                  <button
                    type="button"
                    onClick={closeZoom}
                    className="absolute right-4 top-4 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-950/90 text-white transition hover:bg-slate-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev - 1 + whisper.imageUrls!.length) % whisper.imageUrls!.length); }}
                    className="absolute left-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/90 text-white transition hover:bg-slate-800"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setActiveImageIndex((prev) => (prev + 1) % whisper.imageUrls!.length); }}
                    className="absolute right-4 top-1/2 z-20 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-slate-950/90 text-white transition hover:bg-slate-800"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  <div className="flex h-full w-full items-center justify-center bg-black/0 p-4">
                    <img
                      src={normalizeSupabasePublicUrl(whisper.imageUrls?.[activeImageIndex] || '')}
                      alt={`whisper enlarged ${activeImageIndex + 1}`}
                      className="max-h-[90vh] max-w-[90vw] rounded-3xl object-contain"
                    />
                  </div>
                </div>
              </div>,
              document.body,
            )}
          </>
        ) : null}

        <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-100">
          <button onClick={onComment} className="inline-flex items-center gap-1 rounded-full border border-violet-300 bg-violet-500/15 px-2 py-1.5 text-white transition duration-300 hover:border-violet-200 hover:bg-violet-500/25 hover:text-white"><MessageSquare className="h-4 w-4" /> {whisper.comments.length}</button>
          <button onClick={onShare} className="inline-flex items-center gap-1 rounded-full border border-sky-300 bg-sky-500/15 px-2 py-1.5 text-white transition duration-300 hover:border-sky-200 hover:bg-sky-500/25 hover:text-white"><Share2 className="h-4 w-4" /> Share</button>
          {onDirectChat ? (
            <button onClick={onDirectChat} className="inline-flex items-center gap-1 rounded-full border border-cyan-300 bg-cyan-500/15 px-2 py-1.5 text-white transition duration-300 hover:border-cyan-200 hover:bg-cyan-500/25 hover:text-white">
              <MessageSquare className="h-4 w-4" /> Chat
            </button>
          ) : null}
          <>
            <button onClick={openReport} className="inline-flex items-center gap-1 rounded-full border border-fuchsia-300 bg-fuchsia-500/15 px-2 py-1.5 text-white transition duration-300 hover:border-fuchsia-200 hover:bg-fuchsia-500/25 hover:text-white"><Flag className="h-4 w-4" /> Report</button>
            {isReporting && createPortal(
              <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 px-4 py-8">
                <div className="w-full max-w-lg rounded-2xl bg-slate-950 p-6 shadow-2xl ring-1 ring-white/10">
                  <h3 className="text-lg font-semibold text-white">Report whisper</h3>
                  <p className="mt-1 text-sm text-slate-300">Help us understand the issue. This is optional but helps moderators review faster.</p>
                  <textarea
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    placeholder="Optional: what's the reason? (e.g., harassment, spam, personal info)"
                    className="mt-4 w-full min-h-[100px] rounded-2xl border border-slate-700 bg-slate-900 p-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <div className="mt-4 flex justify-end gap-3">
                    <button type="button" onClick={cancelReport} className="px-4 py-2 rounded-2xl bg-slate-800 text-slate-300 hover:bg-slate-700">Cancel</button>
                    <button type="button" onClick={submitReport} className="px-4 py-2 rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400">Submit Report</button>
                  </div>
                </div>
              </div>,
              document.body,
            )}
          </>
          {canEdit ? (
            <>
              <button onClick={onEdit} className="inline-flex items-center gap-2 text-slate-300 hover:text-white hover:underline">Edit</button>
              <button onClick={onDelete} className="inline-flex items-center gap-2 text-rose-300 hover:text-rose-100">Delete</button>
            </>
          ) : null}
          <button className="ml-auto inline-flex items-center gap-2 text-slate-400 transition hover:text-white"><Bookmark className="h-4 w-4" /> Save</button>
        </div>
      </div>
    </article>
  );
};

export const WhisperCard = React.memo(WhisperCardComponent);