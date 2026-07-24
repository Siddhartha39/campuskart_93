import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Reply, Trash2, Edit3, Flag, Share2, Pin, Search, ChevronDown, ChevronRight, Clock3, Sparkles, ImagePlus, SendHorizonal, ArrowUp, ArrowDown, EyeOff } from 'lucide-react';
import { Whisper, Comment } from '../../types/whisper';
import { uploadSupabaseFile, SUPABASE_BUCKETS, normalizeSupabasePublicUrl } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  whisper: Whisper | null;
  onAddComment: (whisperId: string, content: string, parentId?: string, options?: { mentions?: string[]; attachments?: string[] }) => Promise<string> | string;
  onVoteComment: (whisperId: string, commentId: string, delta: number) => Promise<void> | void;
  onReportComment: (whisperId: string, commentId: string) => Promise<void> | void;
  onDeleteComment: (whisperId: string, commentId: string) => Promise<void> | void;
  onEditComment: (whisperId: string, commentId: string, content: string, mentions?: string[]) => Promise<void> | void;
  onPinComment: (whisperId: string, commentId: string) => Promise<void> | void;
}

const formatTimeLabel = (dateString?: string) => {
  if (!dateString) return 'just now';
  const diffMs = Date.now() - new Date(dateString).getTime();
  const diffMins = Math.max(1, Math.floor(diffMs / 60000));
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateString).toLocaleDateString();
};

const extractMentions = (text: string) => Array.from(text.matchAll(/@([a-zA-Z0-9_]+)/g)).map((match) => match[1]);

export const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onClose, whisper, onAddComment, onVoteComment, onReportComment, onDeleteComment, onEditComment, onPinComment }) => {
  const { currentUser } = useAuth();
  const [draft, setDraft] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'top' | 'new' | 'old' | 'upvoted'>('top');
  const [showUnansweredOnly, setShowUnansweredOnly] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [visibleCount, setVisibleCount] = useState(6);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [localComments, setLocalComments] = useState<Comment[]>([]);
  const [lastPostedId, setLastPostedId] = useState<string | null>(null);
  const [pendingVotes, setPendingVotes] = useState<Record<string, number>>({});
  const [userVotes, setUserVotes] = useState<Record<string, number>>({});
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const rebuildCommentTree = (comments: Comment[]): Comment[] => {
    const commentMap = new Map(comments.map((c) => [c.id, { ...c, replies: [] }]));
    const topLevel: Comment[] = [];
    comments.forEach((comment) => {
      if (comment.parentId && commentMap.has(comment.parentId)) {
        const parent = commentMap.get(comment.parentId);
        if (parent) parent.replies.push(commentMap.get(comment.id)!);
      } else {
        topLevel.push(commentMap.get(comment.id)!);
      }
    });
    return topLevel;
  };

  useEffect(() => {
    if (whisper?.comments) {
      setLocalComments(rebuildCommentTree(
        whisper.comments.map((comment) => ({ ...comment, whisperId: comment.whisperId || whisper.id }))
      ));
    } else {
      setLocalComments([]);
    }
  }, [whisper?.comments, whisper?.id]);

  useEffect(() => {
    if (!lastPostedId) return;
    const el = document.getElementById(`comment-${lastPostedId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [lastPostedId, localComments]);

  const findCommentInTree = (comments: Comment[], id: string): Comment | null => {
    for (const comment of comments) {
      if (comment.id === id) return comment;
      if (comment.replies?.length) {
        const found = findCommentInTree(comment.replies, id);
        if (found) return found;
      }
    }
    return null;
  };

  const activeParent = useMemo(() => findCommentInTree(localComments, replyTo || '') || null, [localComments, replyTo]);

  const filteredComments = useMemo(() => {
    const normalize = (value: string) => value.toLowerCase();
    const search = normalize(searchTerm.trim());
    const walk = (comments: Comment[]): Comment[] => comments.flatMap((comment) => {
      const matchesSearch = !search || normalize(comment.content).includes(search) || normalize(comment.author.displayName).includes(search) || (comment.mentions || []).some((mention) => normalize(mention).includes(search));
      const replies = (comment.replies || []).filter((reply) => !reply.isDeleted);
      const childMatches = replies.some((reply) => normalize(reply.content).includes(search) || normalize(reply.author.displayName).includes(search));
      const include = matchesSearch || childMatches;
      if (!include) return [];
      return [{ ...comment, replies: walk(replies) }];
    });

    const rootComments = walk(localComments.filter((comment) => !comment.isDeleted));
    const visible = rootComments.filter((comment) => {
      if (showUnansweredOnly && (comment.replies?.length || 0) > 0) return false;
      return true;
    });

    const sortCommentTree = (comments: Comment[]): Comment[] => {
      const sorted = [...comments].sort((a, b) => {
        if (sortBy === 'new') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        if (sortBy === 'old') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        if (sortBy === 'upvoted') return (b.score ?? b.likes ?? 0) - (a.score ?? a.likes ?? 0);
        return (b.score ?? b.likes ?? 0) - (a.score ?? a.likes ?? 0);
      });
      return sorted.map((comment) => ({ ...comment, replies: sortCommentTree(comment.replies || []) }));
    };

    return sortCommentTree(visible);
  }, [localComments, searchTerm, showUnansweredOnly, sortBy]);

  const visibleTopLevelComments = filteredComments.slice(0, visibleCount);

  const toggleLike = (commentId: string, delta: number) => {
    const currentVote = userVotes[commentId] || 0;
    if (currentVote === delta) return;
    setPendingVotes((prev) => ({ ...prev, [commentId]: delta }));
    setUserVotes((prev) => ({ ...prev, [commentId]: delta }));
    setLocalComments((prev) => prev.map((comment) => {
      if (comment.id !== commentId) return comment;
      const change = delta - (currentVote || 0);
      const nextScore = (comment.score ?? comment.likes ?? 0) + change;
      return { ...comment, score: nextScore, likes: nextScore, upvotes: (comment.upvotes ?? 0) + (delta > 0 ? 1 : 0) - (currentVote > 0 ? 1 : 0), downvotes: (comment.downvotes ?? 0) + (delta < 0 ? 1 : 0) - (currentVote < 0 ? 1 : 0) };
    }));
    onVoteComment(whisper!.id, commentId, delta);
  };

  const handleDelete = async (commentId: string) => {
    setLocalComments((prev) => prev.map((comment) => comment.id === commentId ? { ...comment, isDeleted: true, content: '[deleted]' } : comment));
    await onDeleteComment(whisper!.id, commentId);
  };

  const handleEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setDraft(comment.content);
    setReplyTo(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleReport = async (commentId: string) => {
    await onReportComment(whisper!.id, commentId);
  };

  const handleCopyLink = async (commentId: string) => {
    const url = `${window.location.origin}/campus-whisper?whisper=${whisper?.id || ''}&comment=${commentId}`;
    try {
      await navigator.clipboard.writeText(url);
      window.alert('Comment link copied');
    } catch (e) {
      window.prompt('Copy comment link', url);
    }
  };

  const handleShare = async (commentId: string) => {
    const url = `${window.location.origin}/campus-whisper?whisper=${whisper?.id || ''}&comment=${commentId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'CampusWhisper comment', text: 'Check this comment', url });
      } else {
        await navigator.clipboard.writeText(url);
        window.alert('Comment link copied');
      }
    } catch (e) {
      // ignore share errors
    }
  };

  const handleSubmit = async () => {
    if (!whisper || !draft.trim()) return;
    setSubmitting(true);
    try {
      const mentions = extractMentions(draft);
      const payload = { mentions, attachments: attachmentUrl ? [attachmentUrl] : [] };
      const commentId = editingId
        ? await onEditComment(whisper.id, editingId, draft, mentions)
        : await onAddComment(whisper.id, draft, replyTo || undefined, payload);
      setDraft('');
      setReplyTo(null);
      setEditingId(null);
      setAttachmentUrl(null);
      setAttachmentName('');
      if (typeof commentId === 'string' && commentId) {
        setLastPostedId(commentId);
      }
    } catch (e) {
      // ignore post errors
    }
    setSubmitting(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !whisper) return;
    setUploading(true);
    try {
      const url = await uploadSupabaseFile(SUPABASE_BUCKETS.whispers, `comments/${whisper.id}/${Date.now()}-${file.name}`, file);
      setAttachmentUrl(url);
      setAttachmentName(file.name);
    } catch (e) {
      window.alert('Image upload failed');
    }
    setUploading(false);
  };

  const addEmoji = (emoji: string) => {
    const nextValue = `${draft}${emoji}`;
    setDraft(nextValue);
    requestAnimationFrame(() => {
      textareaRef.current?.focus();
    });
  };

  const toggleReplyExpanded = (commentId: string) => {
    setExpanded((prev) => ({ ...prev, [commentId]: !prev[commentId] }));
  };

  const renderComment = (comment: Comment, depth = 0): React.ReactNode => {
    const isReplying = replyTo === comment.id;
    const isEditing = editingId === comment.id;
    const isCollapsed = collapsed[comment.id];
    const revealChildren = expanded[comment.id] || depth < 1;
    const visibleReplies = comment.replies?.slice(0, revealChildren ? 3 : 0) || [];
    const hiddenReplies = Math.max(0, (comment.replies?.length || 0) - visibleReplies.length);
    const isPinned = comment.pinned;
    const isNew = comment.isNew || (Date.now() - new Date(comment.createdAt).getTime() < 5 * 60 * 1000);

    return (
      <div id={`comment-${comment.id}`} key={comment.id} className={`rounded-2xl border transition-all duration-300 ${isNew ? 'border-cyan-400/40 bg-cyan-500/10 shadow-lg shadow-cyan-500/10' : 'border-slate-800/80 bg-slate-950/70'} p-4 ${depth > 0 ? 'ml-4 md:ml-6' : ''}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 text-sm font-semibold text-white">
              {(comment.author.displayName || comment.id).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-white break-all">{comment.author.displayName || comment.id}</p>
                {comment.isBestAnswer ? <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">Best Answer</span> : null}
                {comment.isTopContributor ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-300">Top Contributor</span> : null}
                {isPinned ? <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-300">Pinned</span> : null}
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
                <Clock3 className="h-3.5 w-3.5" />
                <span>{formatTimeLabel(comment.createdAt)}</span>
                {comment.editedAt ? <span>• edited</span> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
            {comment.pinned ? <Pin className="h-3.5 w-3.5 text-violet-300" /> : null}
            <span className="rounded-full border border-slate-700 px-2 py-1">{comment.score ?? comment.likes ?? 0} pts</span>
          </div>
        </div>

        <div className="mt-3 space-y-3">
          <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{comment.content}</p>
          {comment.attachments?.length ? (
            <div className="overflow-hidden rounded-2xl border border-slate-800">
              <img src={normalizeSupabasePublicUrl(comment.attachments[0])} alt="comment attachment" className="h-48 w-full object-cover" />
            </div>
          ) : null}
          {comment.mentions?.length ? (
            <div className="flex flex-wrap gap-2 text-xs text-cyan-300">
              {comment.mentions.map((mention) => <span key={mention} className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-1">@{mention}</span>)}
            </div>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-300">
          <button onClick={() => toggleLike(comment.id, 1)} disabled={userVotes[comment.id] === 1} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 transition hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowUp className="h-4 w-4" /> Up
          </button>
          <button onClick={() => toggleLike(comment.id, -1)} disabled={userVotes[comment.id] === -1} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 transition hover:border-pink-500 hover:text-pink-300 disabled:opacity-50 disabled:cursor-not-allowed">
            <ArrowDown className="h-4 w-4" /> Down
          </button>
          <button onClick={() => { setReplyTo(comment.id); setEditingId(null); setDraft(''); }} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 transition hover:border-cyan-400 hover:text-cyan-300">
            <Reply className="h-4 w-4" /> Reply
          </button>
          {comment.authorUid === whisper?.authorUid || comment.isOwn ? (
            <>
              <button onClick={() => handleEdit(comment)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 transition hover:border-cyan-400 hover:text-cyan-300">
                <Edit3 className="h-4 w-4" /> Edit
              </button>
              <button onClick={() => handleDelete(comment.id)} className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-rose-300 transition hover:bg-rose-500/20">
                <Trash2 className="h-4 w-4" /> Delete
              </button>
            </>
          ) : null}
          <button onClick={() => handleReport(comment.id)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 transition hover:border-amber-400 hover:text-amber-300">
            <Flag className="h-4 w-4" /> Report
          </button>
          <button onClick={() => handleShare(comment.id)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 transition hover:border-cyan-400 hover:text-cyan-300">
            <Share2 className="h-4 w-4" /> Share
          </button>
          {whisper?.authorUid === comment.authorUid || whisper?.authorUid === currentUser?.uid ? (
            <button onClick={() => onPinComment(whisper.id, comment.id)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 transition hover:border-violet-400 hover:text-violet-300">
              <Pin className="h-4 w-4" /> Pin
            </button>
          ) : null}
        </div>

        {(comment.replies?.length || 0) > 0 ? (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <button onClick={() => setCollapsed((prev) => ({ ...prev, [comment.id]: !prev[comment.id] }))} className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/70 px-2 py-1">
              {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {isCollapsed ? 'Expand' : 'Collapse'} replies
            </button>
            <span>{comment.replies?.length || 0} replies</span>
          </div>
        ) : null}

        {!isCollapsed && (comment.replies?.length || 0) > 0 ? (
          <div className="mt-4 border-l border-slate-800/80 pl-4">
            <div className="space-y-3">
              {visibleReplies.map((reply) => (
                <div key={reply.id} className="relative">
                  <div className="absolute left-[-14px] top-4 h-full w-px bg-slate-800" />
                  {renderComment(reply, depth + 1)}
                </div>
              ))}
            </div>
            {hiddenReplies > 0 ? (
              <button onClick={() => toggleReplyExpanded(comment.id)} className="mt-3 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-300">
                View {hiddenReplies} more replies
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  };

  if (!isOpen || !whisper) return null;

  return (
    <div onClick={onClose} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950 shadow-2xl shadow-slate-950/80">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Comments</p>
            <h2 className="mt-1 text-xl font-semibold text-white">Whisper thread</h2>
            <p className="mt-1 text-sm text-slate-400">{localComments.filter((comment) => !comment.isDeleted).length} comments • live updates</p>
          </div>
          <button onClick={onClose} className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800">
            <X className="h-4 w-4" /> Close
          </button>
        </header>

        <div className="flex-1 overflow-auto px-4 py-4 sm:px-6">
          <div className="mb-5 rounded-[1.5rem] border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-violet-500 font-semibold text-white">
                {whisper.author.displayName.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm text-slate-200">{whisper.author.displayName}</p>
                <p className="text-xs text-slate-400">{whisper.category} · {new Date(whisper.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-slate-200">{whisper.message}</p>
          </div>

          <div className="mb-5 flex flex-col gap-3 rounded-[1.25rem] border border-slate-800 bg-slate-900/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
              <Search className="h-4 w-4 text-cyan-300" />
              <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search comments" className="w-full bg-transparent outline-none placeholder:text-slate-500 sm:w-40" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => textareaRef.current?.focus()}
                className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-400 hover:text-cyan-200"
              >
                Write comment
              </button>
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as 'top' | 'new' | 'old' | 'upvoted')} className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300">
                <option value="top">Top</option>
                <option value="new">New</option>
                <option value="old">Old</option>
                <option value="upvoted">Most Upvoted</option>
              </select>
              <button onClick={() => setShowUnansweredOnly((value) => !value)} className={`rounded-full border px-3 py-2 text-sm transition ${showUnansweredOnly ? 'border-cyan-400/40 bg-cyan-500/10 text-cyan-200' : 'border-slate-700 bg-slate-950/70 text-slate-300'}`}>
                <span className="inline-flex items-center gap-2"><EyeOff className="h-4 w-4" /> Unanswered only</span>
              </button>
            </div>
          </div>

          {filteredComments.length === 0 ? (
            <div className="rounded-[1.25rem] border border-slate-800 bg-slate-900/70 p-6 text-center text-sm text-slate-400">No comments yet. Start the conversation.</div>
          ) : (
            <div className="space-y-4">
              {visibleTopLevelComments.map((comment) => renderComment(comment))}
              {visibleCount < filteredComments.length ? (
                <button onClick={() => setVisibleCount((value) => value + 6)} className="w-full rounded-2xl border border-slate-700 bg-slate-900/70 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300">
                  Load more comments
                </button>
              ) : null}
            </div>
          )}

          <div className="mt-6 rounded-[1.25rem] border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Compose</p>
                <p className="mt-1 text-sm text-slate-400">{replyTo ? `Replying to ${activeParent?.whisperId || activeParent?.id || 'selected comment'}` : editingId ? 'Editing your comment' : 'Share your take'}</p>
              </div>
              <div className="text-sm text-slate-400">{draft.length}/500</div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {['😊', '😂', '🔥', '💯', '🙏', '🚀', '✨', '😎'].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => addEmoji(emoji)}
                  className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900"
                >
                  {emoji}
                </button>
              ))}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 hover:bg-slate-900 transition">
                <ImagePlus className="h-4 w-4" /> Attach image
                <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
              </label>
            </div>

            <textarea
              ref={textareaRef}
              rows={5}
              value={draft}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
                  event.preventDefault();
                  handleSubmit();
                }
                if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                  event.preventDefault();
                  handleSubmit();
                }
                if (event.key === 'Escape') {
                  setReplyTo(null);
                  setEditingId(null);
                  setDraft('');
                }
              }}
              onChange={(event) => setDraft(event.target.value.slice(0, 500))}
              placeholder="Write your anonymous comment... mention someone with @username"
              className="mt-4 w-full resize-none rounded-[1rem] border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500"
            />

            {attachmentName ? <div className="mt-3 rounded-full border border-cyan-400/20 bg-cyan-500/10 px-3 py-2 text-sm text-cyan-200">Attached: {attachmentName}</div> : null}

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Sparkles className="h-4 w-4 text-cyan-300" />
                <span>Ctrl/Cmd + Enter to post</span>
              </div>
              <div className="flex items-center gap-2">
                {replyTo || editingId ? (
                  <button onClick={() => { setReplyTo(null); setEditingId(null); setDraft(''); }} className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-800">
                    Cancel
                  </button>
                ) : null}
                <button disabled={submitting || uploading || !draft.trim()} onClick={handleSubmit} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60">
                  <SendHorizonal className="h-4 w-4" /> {submitting ? 'Posting...' : editingId ? 'Save edit' : 'Post comment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

