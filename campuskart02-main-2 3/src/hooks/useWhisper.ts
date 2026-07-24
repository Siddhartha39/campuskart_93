import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Whisper, AnonymousUser, Comment } from '../types/whisper';
import { ref, onValue, push, set, runTransaction, update, get, remove } from 'firebase/database';
import { database } from '../config/firebase';

// Get the correct base URL for sharing (use production URL for localhost)
const getShareBaseUrl = () => {
  const origin = window.location.origin;
  // If running on localhost, use the production domain instead
  if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
    // Replace with your actual production domain
    return 'https://campuskart.vercel.app'; // Change this to your actual domain
  }
  return origin;
};

const categories = ['Latest', 'Trending', 'Study', 'Placement', 'Confession', 'Fun', 'Hostel', 'Events', 'Questions'] as const;
const anonymousNamePool = ['Nova', 'Echo', 'Pixel', 'Lyra', 'Orion', 'Misty', 'Astra', 'Quill', 'Cove', 'Rune'];

const buildFallbackAuthor = (): AnonymousUser => ({
  id: `anon-${Date.now()}`,
  displayName: 'Anonymous',
  avatarSeed: `anon-${Date.now()}`,
  karma: 0,
  badges: [],
  posts: 0,
  comments: 0
});

const hashString = (value: string): number => {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
};

const buildAnonymousAuthor = (seed?: string): AnonymousUser => {
  if (!seed) {
    const randomName = anonymousNamePool[Math.floor(Math.random() * anonymousNamePool.length)] || 'Nova';
    const suffix = Math.floor(Math.random() * 900) + 100;
    return {
      id: `anon-${Date.now()}-${suffix}`,
      displayName: `${randomName}${suffix}`,
      avatarSeed: `${randomName}-${suffix}`,
      karma: 0,
      badges: [],
      posts: 0,
      comments: 0
    };
  }

  const hash = hashString(seed);
  const nameIndex = hash % anonymousNamePool.length;
  const randomName = anonymousNamePool[nameIndex] || 'Nova';
  const suffix = 100 + (hash % 900);
  return {
    id: `anon-${seed}-${suffix}`,
    displayName: `${randomName}${suffix}`,
    avatarSeed: seed,
    karma: 0,
    badges: [],
    posts: 0,
    comments: 0
  };
};

export const useWhisper = () => {
  const { currentUser, userData } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>('Latest');
  const [searchQuery, setSearchQuery] = useState('');
  const [whispers, setWhispers] = useState<Whisper[]>([]);
  const [selectedWhisper, setSelectedWhisper] = useState<Whisper | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [editingWhisper, setEditingWhisper] = useState<Whisper | null>(null);
  const [viewMode, setViewMode] = useState<'college' | 'open' | 'following'>('college');
  const [selectedAuthor, setSelectedAuthor] = useState<{ author: AnonymousUser; authorUid?: string | null } | null>(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const previousWhispersRef = useRef<Whisper[]>([]);

  const filteredWhispers = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return whispers.filter((whisper) => {
      if (selectedAuthor) {
        const authorMatch = selectedAuthor.authorUid
          ? whisper.authorUid === selectedAuthor.authorUid
          : whisper.author.id === selectedAuthor.author.id;
        if (!authorMatch) return false;
      } else {
        if (viewMode === 'college') {
          if (whisper.isOpenChat) return false;
          if (whisper.college !== userData?.college) return false;
        } else if (viewMode === 'open') {
          if (!whisper.isOpenChat) return false;
        } else if (viewMode === 'following') {
          const following = userData?.following || [];
          if (!whisper.authorUid || !following.includes(whisper.authorUid)) return false;
        }
      }

      const categoryMatch = activeCategory === 'Latest' || whisper.category === activeCategory;
      const searchableText = [
        whisper.message,
        whisper.category,
        whisper.id,
        whisper.author.displayName,
        ...(whisper.tags || [])
      ].join(' ').toLowerCase();
      const searchMatch = searchableText.includes(normalized);
      return categoryMatch && (normalized ? searchMatch : true);
    });
  }, [activeCategory, searchQuery, whispers, viewMode, selectedAuthor, userData?.college, userData?.following]);

  const openCreateModal = () => {
    setEditingWhisper(null);
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    setEditingWhisper(null);
  };

  const openEditModal = (whisper: Whisper) => {
    setEditingWhisper(whisper);
    setSelectedWhisper(whisper);
    setIsCreateOpen(true);
  };

  const openAuthorFeed = (author: AnonymousUser, authorUid?: string | null) => {
    setSelectedAuthor({ author, authorUid });
    setActiveCategory('Latest');
  };

  const closeAuthorFeed = () => setSelectedAuthor(null);

  const openCommentModal = (whisper: Whisper) => {
    setSelectedWhisper(whisper);
    setIsCommentOpen(true);
  };

  const closeCommentModal = () => {
    setSelectedWhisper(null);
    setIsCommentOpen(false);
  };

  const createWhisper = async (payload: {
    category: string;
    message: string;
    imageUrl?: string;
    imageUrls?: string[];
    allowComments: boolean;
    anonymous: boolean;
    isOpenChat?: boolean;
    poll?: Poll;
  }) => {
    const campusId = userData?.campusProfile?.id || userData?.campusId;
    const author: AnonymousUser = currentUser && campusId
      ? {
          id: campusId,
          displayName: payload.anonymous ? 'Anonymous' : campusId,
          avatarSeed: userData?.campusProfile?.avatarUrl || campusId,
          karma: 0,
          badges: [],
          posts: 0,
          comments: 0
        }
      : buildFallbackAuthor();

    const whisperId = editingWhisper?.id;
    const dbObj = {
      author,
      authorUid: currentUser?.uid || null,
      college: userData?.college || 'Unknown',
      category: payload.category || 'Fun',
      message: payload.message,
      imageUrl: payload.imageUrls?.[0] || payload.imageUrl || null,
      imageUrls: payload.imageUrls?.length ? payload.imageUrls : (payload.imageUrl ? [payload.imageUrl] : []),
      poll: payload.poll || undefined,
      isOpenChat: !!payload.isOpenChat,
      createdAt: editingWhisper?.createdAt || new Date().toISOString(),
      editedAt: editingWhisper ? new Date().toISOString() : undefined,
      likes: editingWhisper?.likes ?? 0,
      comments: editingWhisper ? undefined : {},
      reported: editingWhisper?.reported ?? false,
      allowComments: !!payload.allowComments,
      anonymous: !!payload.anonymous,
      shareCount: editingWhisper?.shareCount ?? 0,
      tags: [payload.category.toLowerCase()]
    } as any;

    Object.keys(dbObj).forEach((k) => {
      if ((dbObj as any)[k] === undefined) delete (dbObj as any)[k];
    });

    if (whisperId) {
      const whisperRef = ref(database, `whispers/${whisperId}`);
      await update(whisperRef, dbObj);
      setEditingWhisper(null);
    } else {
      const whispersRef = ref(database, 'whispers');
      const newRef = push(whispersRef);
      await set(newRef, dbObj);
    }

    setActiveCategory('Latest');
  };

  const voteWhisper = async (id: string, delta: number) => {
    if (!currentUser?.uid) return;
    const voteRef = ref(database, `whisperVotes/${id}/${currentUser.uid}`);
    try {
      const snap = await get(voteRef);
      const currentVote = snap.exists() ? snap.val() as number : 0;
      if (currentVote === delta) return;
      const likesRef = ref(database, `whispers/${id}/likes`);
      const change = delta - (currentVote || 0);
      await set(voteRef, delta);
      await runTransaction(likesRef, (current) => (current || 0) + change);
    } catch (e) {
      // ignore voting errors
    }
  };

  const toggleLike = (id: string) => voteWhisper(id, 1);

  const votePoll = async (whisperId: string, optionId: string) => {
    if (!currentUser?.uid) return;

    const voteRef = ref(database, `pollVotes/${whisperId}/${currentUser.uid}`);
    try {
      const voteSnap = await get(voteRef);
      const currentOptionId = voteSnap.exists() ? String(voteSnap.val()) : '';
      if (currentOptionId === optionId) return;

      const pollRef = ref(database, `whispers/${whisperId}/poll`);
      await runTransaction(pollRef, (currentPoll: any) => {
        if (!currentPoll || currentPoll.isClosed) return currentPoll;
        const options = Array.isArray(currentPoll.options) ? currentPoll.options : [];
        const nextOptions = options.map((option: any) => {
          if (option.id === optionId) {
            return { ...option, count: (option.count || 0) + 1 };
          }
          if (option.id === currentOptionId) {
            return { ...option, count: Math.max(0, (option.count || 0) - 1) };
          }
          return option;
        });
        const totalVotes = nextOptions.reduce((sum: number, option: any) => sum + (option.count || 0), 0);
        return {
          ...currentPoll,
          options: nextOptions,
          totalVotes
        };
      });
      await set(voteRef, optionId);
    } catch (e) {
      // ignore poll vote errors
    }
  };

  const shareWhisper = (id: string) => {
    const shareRef = ref(database, `whispers/${id}/shareCount`);
    runTransaction(shareRef, (current) => (current || 0) + 1);

    try {
      const baseUrl = getShareBaseUrl();
      const url = `${baseUrl}/campus-whisper?whisper=${id}`;
      const whisper = whispers.find((w) => w.id === id);
      const title = whisper ? (whisper.author.displayName === 'Anonymous' ? 'A whisper' : `${whisper.author.displayName}'s whisper`) : 'CampusWhisper';
      const message = whisper?.message || 'Check out this post on CampusKart';

      if (navigator.share) {
        navigator.share({ title, text: message, url }).catch(() => {
          // ignore share errors
        });
        return;
      }

      // Fallback: Share to WhatsApp, Telegram, or copy to clipboard
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${message}\n\n${url}`)}`;
      const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`;

      // Try to open WhatsApp directly
      window.open(whatsappUrl, '_blank', 'width=600,height=600');

      // Also copy to clipboard as backup
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          window.alert('✓ Whisper link copied to clipboard!\n\nYou can also share directly to:\n• WhatsApp\n• Telegram\n• Email\n• Any messaging app');
        }).catch(() => {
          // eslint-disable-next-line no-alert
          window.prompt('Copy this whisper link', url);
        });
      } else {
        // eslint-disable-next-line no-alert
        window.prompt('Copy this whisper link', url);
      }
    } catch (e) {
      // ignore any share-related errors
    }
  };

  const reportWhisper = async (id: string, reason?: string) => {
    try {
      const whisperRef = ref(database, `whispers/${id}`);
      const whisperSnap = await get(whisperRef);
      const whisperData = whisperSnap.exists() ? whisperSnap.val() : null;

      await update(whisperRef, { reported: true });

      const reportsRef = ref(database, `whisperReports/${id}`);
      const newRef = push(reportsRef);
      await set(newRef, {
        id: newRef.key,
        reporterUid: currentUser?.uid || null,
        reporterEmail: currentUser?.email || userData?.email || null,
        reporterName: userData?.name || null,
        whisperAuthorUid: whisperData?.authorUid || null,
        reason: reason?.trim() ? reason : 'No reason provided',
        whisperCategory: whisperData?.category || 'Unknown',
        whisperMessage: whisperData?.message || '',
        whisperImages: whisperData?.imageUrls || whisperData?.imageUrl ? (whisperData?.imageUrls || [whisperData?.imageUrl].filter(Boolean)) : [],
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      // ignore errors but don't crash UI
    }
  };

  const deleteWhisper = async (id: string) => {
    const whisperRef = ref(database, `whispers/${id}`);
    await remove(whisperRef).catch(() => null);
  };

  const refreshWhispers = () => {
    setHasNewPosts(false);
  };

  const addComment = async (whisperId: string, content: string, parentId?: string, options?: { mentions?: string[]; attachments?: string[] }) => {
    if (!content.trim()) return '';

    const campusId = userData?.campusProfile?.id || userData?.campusId;
    const author: AnonymousUser = currentUser && campusId
      ? {
          id: campusId,
          displayName: campusId,
          avatarSeed: userData?.campusProfile?.avatarUrl || campusId,
          karma: 0,
          badges: [],
          posts: 0,
          comments: 0
        }
      : buildFallbackAuthor();

    const commentsRef = ref(database, `whispers/${whisperId}/comments`);
    const newRef = push(commentsRef);
    const newCommentBase = {
      id: newRef.key,
      whisperId,
      author,
      authorUid: currentUser?.uid || null,
      content: content.trim(),
      createdAt: new Date().toISOString(),
      score: 0,
      likes: 0,
      upvotes: 0,
      downvotes: 0,
      parentId: parentId || null,
      isOwn: !!currentUser?.uid,
      replyCount: 0,
      attachments: options?.attachments || [],
      mentions: options?.mentions || [],
      pinned: false,
      reported: false,
      isDeleted: false,
      isBestAnswer: false
    } as any;

    try {
      await set(newRef, newCommentBase);
      if (parentId) {
        const parentRef = ref(database, `whispers/${whisperId}/comments/${parentId}`);
        const parentSnap = await get(parentRef);
        const parentData = parentSnap.exists() ? parentSnap.val() : null;
        const nextReplyCount = (parentData?.replyCount || 0) + 1;
        await update(parentRef, { replyCount: nextReplyCount });

        if (parentData?.authorUid && parentData.authorUid !== currentUser?.uid) {
          const notificationsRef = ref(database, `notifications/${parentData.authorUid}`);
          const notificationRef = push(notificationsRef);
          await set(notificationRef, {
            id: notificationRef.key,
            type: 'reply',
            whisperId,
            commentId: newRef.key,
            message: `${author.displayName} replied to your comment`,
            createdAt: new Date().toISOString(),
            read: false,
            actorName: author.displayName
          });
        }
      }
    } catch (e) {
      // ignore write errors
    }

    return newRef.key || '';
  };

  const voteComment = async (whisperId: string, commentId: string, delta: number) => {
    if (!currentUser?.uid) return;
    const commentRef = ref(database, `whispers/${whisperId}/comments/${commentId}`);
    const voteRef = ref(database, `commentVotes/${whisperId}/${commentId}/${currentUser.uid}`);

    try {
      const [commentSnap, voteSnap] = await Promise.all([get(commentRef), get(voteRef)]);
      const currentData = commentSnap.exists() ? commentSnap.val() : null;
      const currentVote = voteSnap.exists() ? Number(voteSnap.val()) : 0;
      if (currentVote === delta) return;

      const existingScore = Number(currentData?.score ?? currentData?.likes ?? 0);
      const existingUpvotes = Number(currentData?.upvotes ?? 0);
      const existingDownvotes = Number(currentData?.downvotes ?? 0);
      const change = delta - (currentVote || 0);
      const nextScore = existingScore + change;
      const nextUpvotes = existingUpvotes + (delta > 0 ? 1 : 0) - (currentVote > 0 ? 1 : 0);
      const nextDownvotes = existingDownvotes + (delta < 0 ? 1 : 0) - (currentVote < 0 ? 1 : 0);

      await set(voteRef, delta);
      await update(commentRef, {
        score: nextScore,
        likes: nextScore,
        upvotes: Math.max(0, nextUpvotes),
        downvotes: Math.max(0, nextDownvotes)
      });
    } catch (e) {
      // ignore vote errors
    }
  };

  const reportComment = async (whisperId: string, commentId: string) => {
    try {
      const commentRef = ref(database, `whispers/${whisperId}/comments/${commentId}`);
      await update(commentRef, { reported: true });
    } catch (e) {
      // ignore report errors
    }
  };

  const deleteComment = async (whisperId: string, commentId: string) => {
    try {
      const commentRef = ref(database, `whispers/${whisperId}/comments/${commentId}`);
      await update(commentRef, { isDeleted: true, content: '[deleted]' });
    } catch (e) {
      // ignore delete errors
    }
  };

  const editComment = async (whisperId: string, commentId: string, content: string, mentions?: string[]) => {
    try {
      const commentRef = ref(database, `whispers/${whisperId}/comments/${commentId}`);
      await update(commentRef, { content, mentions: mentions || [], editedAt: new Date().toISOString() });
    } catch (e) {
      // ignore edit errors
    }
  };

  const pinComment = async (whisperId: string, commentId: string) => {
    try {
      const commentRef = ref(database, `whispers/${whisperId}/comments/${commentId}`);
      const snap = await get(commentRef);
      const current = snap.exists() ? snap.val() : null;
      await update(commentRef, { pinned: !current?.pinned });
    } catch (e) {
      // ignore pin errors
    }
  };

  useEffect(() => {
    const whispersRef = ref(database, 'whispers');
    const unsub = onValue(whispersRef, (snapshot) => {
      const val = snapshot.val() || {};
      const list: Whisper[] = Object.entries(val).map(([key, value]) => {
        const w: any = value;
        const commentsObj = w.comments || {};
        const commentEntries: Comment[] = Object.entries(commentsObj)
          .filter(([, entry]) => entry && typeof entry === 'object')
          .map(([cid, c]: any) => ({
            id: cid,
            whisperId: key,
            author: c.author || buildFallbackAuthor(),
            content: c.content || '',
            createdAt: c.createdAt || new Date().toISOString(),
            editedAt: c.editedAt,
            likes: c.likes ?? c.score ?? 0,
            score: c.score ?? c.likes ?? 0,
            upvotes: c.upvotes ?? 0,
            downvotes: c.downvotes ?? 0,
            replies: [],
            parentId: c.parentId || undefined,
            isOwn: !!c.isOwn,
            authorUid: c.authorUid || null,
            replyCount: c.replyCount || 0,
            attachments: c.attachments || [],
            mentions: c.mentions || [],
            pinned: !!c.pinned,
            reported: !!c.reported,
            isDeleted: !!c.isDeleted,
            isBestAnswer: !!c.isBestAnswer,
            isTopContributor: (c.author?.karma || 0) >= 10
          }));

        const commentMap = new Map(commentEntries.map((comment) => [comment.id, comment]));
        const topLevelComments: Comment[] = [];
        commentEntries.forEach((comment) => {
          if (comment.parentId && commentMap.has(comment.parentId)) {
            const parent = commentMap.get(comment.parentId);
            if (parent) {
              parent.replies.push(comment);
            }
          } else {
            topLevelComments.push(comment);
          }
        });

        return {
          id: key,
          author: w.author,
          authorUid: w.authorUid,
          college: w.college || 'Unknown',
          isOpenChat: !!w.isOpenChat,
          category: w.category,
          message: w.message,
          imageUrl: w.imageUrl || undefined,
          imageUrls: w.imageUrls || (w.imageUrl ? [w.imageUrl] : []),
          createdAt: w.createdAt,
          editedAt: w.editedAt,
          likes: w.likes ?? 0,
          comments: topLevelComments.sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
          reported: !!w.reported,
          allowComments: w.allowComments ?? true,
          anonymous: !!w.anonymous,
          shareCount: w.shareCount ?? 0,
          poll: w.poll,
          tags: w.tags ?? []
        } as Whisper;
      }).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const hasFreshPosts = previousWhispersRef.current.length > 0 && list.length > previousWhispersRef.current.length;
      previousWhispersRef.current = list;
      setWhispers(list);
      if (hasFreshPosts) {
        setHasNewPosts(true);
      }
      setSelectedWhisper((current) => {
        if (!current) return null;
        return list.find((w) => w.id === current.id) || current;
      });
    });

    return () => unsub();
  }, []);

  return {
    categories: categories as string[],
    activeCategory,
    setActiveCategory,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    filteredWhispers,
    hasNewPosts,
    refreshWhispers,
    selectedWhisper,
    selectedAuthor,
    openAuthorFeed,
    closeAuthorFeed,
    isCreateOpen,
    isCommentOpen,
    editingWhisper,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    openCommentModal,
    closeCommentModal,
    createWhisper,
    toggleLike,
    voteWhisper,
    votePoll,
    shareWhisper,
    reportWhisper,
    deleteWhisper,
    addComment,
    voteComment,
    reportComment,
    deleteComment,
    editComment,
    pinComment
  };
};

