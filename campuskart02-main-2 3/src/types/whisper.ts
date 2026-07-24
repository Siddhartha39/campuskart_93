export interface AnonymousUser {
  id: string;
  displayName: string;
  avatarSeed: string;
  karma: number;
  badges: string[];
  posts: number;
  comments: number;
  online?: boolean;
}

export interface Vote {
  id: string;
  pollId: string;
  optionId: string;
  userId: string;
  createdAt: string;
}

export interface PollOption {
  id: string;
  label: string;
  count: number;
}

export interface Poll {
  id: string;
  question: string;
  options: PollOption[];
  createdAt: string;
  totalVotes: number;
  hasVoted: boolean;
  expiresAt?: string;
  isClosed: boolean;
}

export interface Answer {
  id: string;
  questionId: string;
  author: AnonymousUser;
  content: string;
  createdAt: string;
  likes: number;
  isHelpful: boolean;
}

export interface Question {
  id: string;
  prompt: string;
  author: AnonymousUser;
  createdAt: string;
  answers: Answer[];
  helpfulCount: number;
  anonymous: boolean;
}

export interface Comment {
  id: string;
  whisperId: string;
  author: AnonymousUser;
  content: string;
  createdAt: string;
  editedAt?: string;
  likes?: number;
  score?: number;
  upvotes?: number;
  downvotes?: number;
  replies: Comment[];
  parentId?: string;
  isOwn?: boolean;
  authorUid?: string | null;
  replyCount?: number;
  attachments?: string[];
  mentions?: string[];
  pinned?: boolean;
  reported?: boolean;
  isDeleted?: boolean;
  isNew?: boolean;
  isBestAnswer?: boolean;
  isTopContributor?: boolean;
}

export interface Whisper {
  id: string;
  author: AnonymousUser;
  authorUid?: string;
  college?: string;
  category: string;
  message: string;
  imageUrl?: string;
  imageUrls?: string[];
  createdAt: string;
  editedAt?: string;
  likes: number;
  comments: Comment[];
  reported: boolean;
  allowComments: boolean;
  anonymous: boolean;
  shareCount: number;
  poll?: Poll;
  question?: Question;
  tags?: string[];
  isOpenChat?: boolean;
  whisperId?: string;
}
