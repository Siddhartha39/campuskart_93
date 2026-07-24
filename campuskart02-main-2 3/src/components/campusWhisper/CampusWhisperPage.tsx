import React, { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ref, get, update } from 'firebase/database';
import { database } from '../../config/firebase';
import { useWhisper } from '../../hooks/useWhisper';
import { WhisperFeed } from './WhisperFeed';
import { CreateWhisperModal } from './CreateWhisperModal';
import { CommentModal } from './CommentModal';
import { useAuth } from '../../contexts/AuthContext';
import { CampusIdModal } from './CampusIdModal';
import BackButton from '../common/BackButton';

export const CampusWhisperPage: React.FC = () => {
  const whisper = useWhisper();
  const { currentUser, userData } = useAuth();
  const [showIdModal, setShowIdModal] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser && userData && !userData.campusProfile) {
      setShowIdModal(true);
    } else if (userData?.campusProfile) {
      setShowIdModal(false);
    }
  }, [currentUser, userData]);

  const isFollowingAuthor = (authorUid?: string | null) => {
    if (!authorUid || !userData?.following) return false;
    return userData.following.includes(authorUid);
  };

  const toggleFollow = async (authorUid?: string | null) => {
    if (!currentUser || !userData || !authorUid) return;
    if (followLoading) return;
    setFollowLoading(true);

    try {
      const currentUserRef = ref(database, `users/${currentUser.uid}`);
      const authorRef = ref(database, `users/${authorUid}`);
      const [authorSnap, userSnap] = await Promise.all([get(authorRef), get(currentUserRef)]);

      const currentFollowing: string[] = userData.following || [];
      const authorFollowers: string[] = authorSnap.exists() ? authorSnap.val().followers || [] : [];
      const isFollowing = currentFollowing.includes(authorUid);
      const updatedFollowing = isFollowing
        ? currentFollowing.filter((uid) => uid !== authorUid)
        : [...currentFollowing, authorUid];
      const updatedFollowers = isFollowing
        ? authorFollowers.filter((uid: string) => uid !== currentUser.uid)
        : [...authorFollowers, currentUser.uid];

      await update(currentUserRef, { following: updatedFollowing });
      await update(authorRef, { followers: updatedFollowers });
    } catch (error) {
      console.error('Unable to toggle follow on whisper author', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const openDirectChat = async (authorUid?: string | null) => {
    if (!authorUid) return;
    try {
      const authorSnap = await get(ref(database, `users/${authorUid}`));
      const authorCampusId = authorSnap.exists() ? authorSnap.val()?.campusProfile?.id || authorSnap.val()?.campusId || '' : '';
      navigate(`/messages?userId=${encodeURIComponent(authorUid)}&chatType=whisper&whisperAuthorId=${encodeURIComponent(authorUid)}&whisperAuthorCampusId=${encodeURIComponent(authorCampusId)}`);
    } catch (error) {
      console.error('Unable to open whisper direct chat', error);
      navigate(`/messages?userId=${encodeURIComponent(authorUid)}&chatType=whisper&whisperAuthorId=${encodeURIComponent(authorUid)}`);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.55),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.45),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.45),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.38),_transparent_26%),linear-gradient(180deg,_#bae6fd_0%,_#93c5fd_45%,_#dbeafe_100%)] py-10 text-slate-100">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 -left-16 h-96 w-96 rounded-full bg-cyan-400/45 blur-3xl opacity-95 animate-ping" />
        <div className="absolute top-8 right-12 h-80 w-80 rounded-full bg-sky-500/35 blur-3xl opacity-90 animate-pulse" />
        <div className="absolute bottom-10 left-1/4 h-72 w-72 rounded-full bg-violet-500/45 blur-3xl opacity-85 animate-pulse" />
        <div className="absolute bottom-24 right-1/4 h-60 w-60 rounded-full bg-pink-500/35 blur-3xl opacity-80 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/30 blur-2xl opacity-90" />
        <div className="absolute top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl opacity-80 animate-pulse" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
          {/* Header Section */}
          <div className="mb-6 flex justify-start">
            <BackButton toHomeFallback="/dashboard" className="border-slate-300 bg-white/90 text-slate-900 hover:bg-slate-100" />
          </div>
          <div className="rounded-[2rem] border border-slate-800 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(236,72,153,0.14),_transparent_18%),linear-gradient(180deg,_#020617_0%,_#111827_100%)] shadow-2xl shadow-slate-950/30 p-8 lg:p-12 overflow-hidden mb-8">
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] items-center">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-sky-300/30 bg-slate-950/80 px-4 py-2 text-sm text-slate-100">
                  👻 CampusWhisper
                </p>
                <h1 className="mt-6 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  Speak Freely.
                  <span className="block bg-gradient-to-r from-cyan-300 to-sky-400 bg-clip-text text-transparent">
                    Stay Anonymous.
                  </span>
                </h1>
                <p className="mt-4 max-w-2xl text-slate-300 text-lg leading-8">
                  Share campus pulse, ask questions, and discover anonymous thoughts with community-safe design and rich interactions.
                </p>
              </div>

              <div className="rounded-[2rem] border border-slate-700 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_18%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.16),_transparent_20%),linear-gradient(180deg,_#020617_0%,_#111827_100%)] p-6 shadow-lg shadow-slate-950/20 transition-all duration-300 hover:-translate-y-1">
                <div className="flex items-center gap-3 rounded-full border border-slate-600 bg-slate-950/90 p-4">
                  <Search className="h-5 w-5 text-cyan-300" />
                  <input
                    value={whisper.searchQuery}
                    onChange={(event) => whisper.setSearchQuery(event.target.value)}
                    placeholder="Search whispers..."
                    className="w-full bg-transparent text-slate-100 placeholder:text-slate-400 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
          {/* View Mode Tabs */}
          <div className="mb-8 flex flex-wrap gap-3 justify-center lg:justify-start">
            <button
              onClick={() => { whisper.closeAuthorFeed(); whisper.setViewMode('college'); }}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                whisper.viewMode === 'college' && !whisper.selectedAuthor
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-500/20'
                  : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              🏫 {userData?.college || 'Campus'} Chat
            </button>
            <button
              onClick={() => { whisper.closeAuthorFeed(); whisper.setViewMode('open'); }}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                whisper.viewMode === 'open' && !whisper.selectedAuthor
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-500/20'
                  : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              🌐 Open Chat
            </button>
            <button
              onClick={() => { whisper.closeAuthorFeed(); whisper.setViewMode('following'); }}
              className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                whisper.viewMode === 'following' && !whisper.selectedAuthor
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-500/20'
                  : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              ⭐ Following
            </button>
          </div>

          {/* Category Buttons */}
          <div className="mb-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] items-center">
            <div className="flex flex-wrap gap-3 justify-center sm:justify-start min-w-0">
              {['Latest', 'Study', 'Confession', 'Fun', 'Questions'].map((item) => (
                <button
                  key={item}
                  onClick={() => whisper.setActiveCategory(item)}
                  className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                    whisper.activeCategory === item
                      ? 'bg-slate-900 text-white shadow-lg shadow-slate-500/20'
                      : 'bg-white/90 text-slate-700 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex justify-center sm:justify-end">
              <button
                onClick={() => whisper.openCreateModal()}
                className="px-6 py-2 rounded-full bg-sky-600 text-white font-semibold hover:bg-sky-500 transition-all duration-300 shadow-xl shadow-sky-500/20"
              >
                + Post
              </button>
            </div>
          </div>
        </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-20">
        <div className="grid gap-8">
          <div className="space-y-6">
            <div className="mb-4 flex flex-col gap-3 rounded-[2rem] border border-slate-700/70 bg-slate-950/95 px-4 py-3 text-sm text-slate-100 shadow-lg shadow-slate-950/20 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 flex-1 font-medium text-slate-100 break-words">
                {whisper.selectedAuthor ? (
                  `Showing whispers by ${whisper.selectedAuthor.author.displayName}`
                ) : whisper.viewMode === 'college' ? (
                  `Showing posts from ${userData?.college || 'your college'} only`
                ) : whisper.viewMode === 'open' ? (
                  'Showing posts from all colleges'
                ) : (
                  'Showing whispers from users you follow'
                )}
              </div>
              {whisper.hasNewPosts ? (
                <button onClick={whisper.refreshWhispers} className="rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-white hover:bg-cyan-500/20">
                  New posts • Refresh
                </button>
              ) : null}
            </div>
            {whisper.selectedAuthor ? (
              <div className="mb-4 flex flex-col gap-3 rounded-3xl border border-slate-700 bg-slate-950/80 p-4 text-sm text-slate-300 shadow-xl sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-white text-base font-semibold">{whisper.selectedAuthor.author.displayName}</p>
                  <p className="text-slate-400">View only this author’s whispers.</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => toggleFollow(whisper.selectedAuthor?.authorUid)}
                    disabled={followLoading}
                    className={`rounded-full px-5 py-3 text-sm font-semibold transition ${isFollowingAuthor(whisper.selectedAuthor.authorUid) ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400' : 'bg-slate-900/70 text-white hover:bg-slate-900/90'}`}
                  >
                    {followLoading ? 'Saving...' : isFollowingAuthor(whisper.selectedAuthor.authorUid) ? 'Following' : 'Follow'}
                  </button>
                  <button
                    onClick={() => openDirectChat(whisper.selectedAuthor.authorUid)}
                    className="rounded-full border border-slate-700 bg-slate-900/70 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-900/90"
                  >
                    Message
                  </button>
                  <button
                    onClick={whisper.closeAuthorFeed}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300 hover:bg-white/10"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
            <WhisperFeed
              whispers={whisper.filteredWhispers}
              currentUserId={currentUser?.uid}
              openCommentModal={whisper.openCommentModal}
              onEdit={whisper.openEditModal}
              onDelete={whisper.deleteWhisper}
              toggleLike={whisper.toggleLike}
              voteWhisper={whisper.voteWhisper}
              votePoll={whisper.votePoll}
              shareWhisper={whisper.shareWhisper}
              reportWhisper={whisper.reportWhisper}
              onOpenAuthor={whisper.openAuthorFeed}
              onToggleFollow={toggleFollow}
              isFollowingAuthor={isFollowingAuthor}
              onDirectChat={openDirectChat}
              viewMode={whisper.selectedAuthor ? 'open' : whisper.viewMode}
            />
          </div>
        </div>
      </div>

      <CreateWhisperModal
        isOpen={whisper.isCreateOpen}
        onClose={whisper.closeCreateModal}
        onSubmit={whisper.createWhisper}
        editingWhisper={whisper.editingWhisper ? {
          id: whisper.editingWhisper.id,
          category: whisper.editingWhisper.category,
          message: whisper.editingWhisper.message,
          imageUrl: whisper.editingWhisper.imageUrl,
          anonymous: whisper.editingWhisper.anonymous
        } : null}
        isOpenChatMode={whisper.viewMode === 'open'}
      />

      <CommentModal
        isOpen={whisper.isCommentOpen}
        onClose={whisper.closeCommentModal}
        whisper={whisper.selectedWhisper}
        onAddComment={whisper.addComment}
        onVoteComment={whisper.voteComment}
        onReportComment={whisper.reportComment}
        onDeleteComment={whisper.deleteComment}
        onEditComment={whisper.editComment}
        onPinComment={whisper.pinComment}
      />

      <div className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2">
        <button
          onClick={() => whisper.openCreateModal()}
          className="rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-8 py-4 text-sm font-semibold text-white shadow-2xl shadow-violet-500/40 hover:from-violet-500 hover:to-violet-400 transition-all transform hover:scale-105"
        >
          ✨ Post a Whisper
        </button>
      </div>

      {/* Whisper ID modal shown when user doesn't have a campus profile id */}
      <CampusIdModal isOpen={showIdModal} onClose={() => setShowIdModal(false)} />
    </div>
  );
};
