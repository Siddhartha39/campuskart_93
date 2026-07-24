import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { database } from '../../config/firebase';
import { ref, push, onValue, update, remove } from 'firebase/database';
import { 
  Users, 
  Plus, 
  MessageCircle, 
  Calendar, 
  GraduationCap,
  Target,
  Clock,
  User,
  Edit,
  Trash2
} from 'lucide-react';
import BackButton from '../common/BackButton';

interface RecruitmentPost {
  id: string;
  recruiterId: string;
  recruiterName: string;
  recruiterCollege: string;
  purpose: string;
  maxStudents: number;
  event: string;
  qualities: string;
  years: string[];
  description: string;
  createdAt: number;
  isActive: boolean;
}

export const TeammateFinder: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [posts, setPosts] = useState<RecruitmentPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPost, setEditingPost] = useState<RecruitmentPost | null>(null);
  const [postToDelete, setPostToDelete] = useState<RecruitmentPost | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollege, setSelectedCollege] = useState('all');
  const [selectedCollegeInitialized, setSelectedCollegeInitialized] = useState(false);

  useEffect(() => {
    if (!selectedCollegeInitialized && userData?.college) {
      setSelectedCollege(userData.college);
      setSelectedCollegeInitialized(true);
    }
  }, [userData?.college, selectedCollegeInitialized]);

  // Form state
  const [formData, setFormData] = useState({
    purpose: '',
    maxStudents: 1,
    event: '',
    qualities: '',
    years: [] as string[],
    description: ''
  });

  const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Any Year'];
  const collegeOptions = ['all', ...(Array.from(new Set([
    ...(userData?.college ? [userData.college] : []),
    ...posts.map((post) => post.recruiterCollege)
  ].filter(Boolean))) as string[])];

  useEffect(() => {
    const postsRef = ref(database, 'recruitmentPosts');
    const unsubscribe = onValue(postsRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const postsList = Object.keys(data)
          .map(key => ({ id: key, ...data[key] }))
          .filter(post => post.isActive)
          .sort((a, b) => b.createdAt - a.createdAt);
        setPosts(postsList);
      } else {
        setPosts([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleYearChange = (year: string) => {
    setFormData(prev => ({
      ...prev,
      years: prev.years.includes(year) 
        ? prev.years.filter(y => y !== year)
        : [...prev.years, year]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !userData) return;

    try {
      if (editingPost) {
        // Update existing post
        const postRef = ref(database, `recruitmentPosts/${editingPost.id}`);
        await update(postRef, {
          ...formData,
          years: formData.years.length === 0 ? ['Any Year'] : formData.years,
          updatedAt: Date.now()
        });
        setEditingPost(null);
      } else {
        // Create new post
        const postData = {
          recruiterId: currentUser.uid,
          recruiterName: userData.name,
          recruiterCollege: userData.college,
          ...formData,
          years: formData.years.length === 0 ? ['Any Year'] : formData.years,
          createdAt: Date.now(),
          isActive: true
        };
        await push(ref(database, 'recruitmentPosts'), postData);
      }
      
      // Reset form
      setFormData({
        purpose: '',
        maxStudents: 1,
        event: '',
        qualities: '',
        years: [],
        description: ''
      });
      setShowForm(false);
    } catch (error) {
      console.error('Error saving recruitment post:', error);
    }
  };

  const handleEdit = (post: RecruitmentPost) => {
    setEditingPost(post);
    setFormData({
      purpose: post.purpose,
      maxStudents: post.maxStudents,
      event: post.event,
      qualities: post.qualities,
      years: post.years,
      description: post.description
    });
    setShowForm(true);
  };

  const handleDelete = async (postId: string) => {
    try {
      await remove(ref(database, `recruitmentPosts/${postId}`));
      setPostToDelete(null);
    } catch (error) {
      console.error('Error deleting recruitment post:', error);
    }
  };

  const confirmDelete = (post: RecruitmentPost) => {
    setPostToDelete(post);
  };

  const cancelDelete = () => {
    setPostToDelete(null);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingPost(null);
    setFormData({
      purpose: '',
      maxStudents: 1,
      event: '',
      qualities: '',
      years: [],
      description: ''
    });
  };

  const handleMessage = async (post: RecruitmentPost) => {
    if (!currentUser || post.recruiterId === currentUser.uid) return;

    try {
      // Create or find existing chat
      const chatId = `recruitment_${currentUser.uid}_${post.recruiterId}_${post.id}`;
      
      // Create chat metadata
      await update(ref(database, `chats/${chatId}/meta`), {
        recruitmentPostId: post.id,
        recruitmentPurpose: post.purpose,
        updatedAt: Date.now(),
        lastMessage: 'Started recruitment conversation',
        lastSender: currentUser.uid,
        users: {
          [currentUser.uid]: true,
          [post.recruiterId]: true
        },
        type: 'recruitment'
      });

      // Index chat for both users
      await update(ref(database, `userChats/${currentUser.uid}`), { [chatId]: true });
      await update(ref(database, `userChats/${post.recruiterId}`), { [chatId]: true });

      // Send initial message
      await push(ref(database, `chats/${chatId}/messages`), {
        type: 'recruitment_inquiry',
        text: `Hi! I'm interested in joining your team for "${post.purpose}". Let's discuss!`,
        senderId: currentUser.uid,
        createdAt: Date.now(),
        recruitmentPostId: post.id
      });

      // Send notification to recruiter
      await push(ref(database, `notifications/${post.recruiterId}`), {
        type: 'recruitment_message',
        chatId,
        recruitmentPostId: post.id,
        text: `Someone is interested in your recruitment post: "${post.purpose}"`,
        read: false,
        createdAt: Date.now(),
        from: currentUser.uid
      });

      // Redirect to messages
      window.location.href = `/messages?chatId=${encodeURIComponent(chatId)}`;
    } catch (error) {
      console.error('Error creating recruitment chat:', error);
    }
  };

  const filteredPosts = posts.filter((post) => {
    const matchesCollege = selectedCollege === 'all' || post.recruiterCollege === selectedCollege;
    const query = searchTerm.trim().toLowerCase();
    const matchesSearch = !query || [post.purpose, post.event, post.description, post.qualities, post.recruiterName, post.recruiterCollege].join(' ').toLowerCase().includes(query);
    return matchesCollege && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.28),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.24),_transparent_20%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#020617_100%)] flex items-center justify-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-10 h-96 w-96 rounded-full bg-pink-500/25 blur-3xl animate-pulse" />
          <div className="absolute top-24 right-12 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl animate-pulse delay-200" />
        </div>
        <div className="relative text-center bg-slate-950/90 border border-slate-800 rounded-[2rem] p-10 shadow-2xl ring-1 ring-fuchsia-500/10">
          <Users className="h-12 w-12 text-cyan-300 mx-auto mb-4" />
          <p className="text-slate-300">Loading recruitment posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.28),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(59,130,246,0.24),_transparent_20%),linear-gradient(180deg,_#020617_0%,_#0f172a_55%,_#020617_100%)] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 left-10 h-96 w-96 rounded-full bg-pink-500/25 blur-3xl animate-pulse" />
        <div className="absolute top-20 right-12 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl animate-pulse delay-200" />
        <div className="absolute bottom-10 left-10 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl animate-pulse delay-400" />
      </div>
      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="bg-slate-950/95 rounded-[2rem] shadow-2xl border border-slate-800 p-6 mb-6 ring-1 ring-fuchsia-500/10 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <BackButton toHomeFallback="/dashboard" />
              <div>
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Users className="h-8 w-8 text-cyan-300" />
                  Teammate Finder
                </h1>
                <p className="text-slate-300 mt-1">Find study partners and project teammates</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full hover:from-pink-600 hover:to-violet-600 transition-all duration-300 shadow-lg"
            >
              <Plus className="h-4 w-4" />
              Post Recruitment
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-slate-800 bg-slate-950/90 p-4 shadow-xl md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <label className="mb-2 block text-sm font-medium text-slate-300">Search posts</label>
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by purpose, skills, or college"
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-fuchsia-500"
            />
          </div>
          <div className="min-w-[220px]">
            <label className="mb-2 block text-sm font-medium text-slate-300">College filter</label>
            <select
              value={selectedCollege}
              onChange={(event) => setSelectedCollege(event.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:ring-2 focus:ring-fuchsia-500"
            >
              {collegeOptions.map((college) => (
                <option key={college} value={college}>{college === 'all' ? 'All colleges' : college}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Recruitment Form */}
        {showForm && (
          <div className="bg-slate-950/95 rounded-[2rem] shadow-2xl border border-slate-800 p-6 mb-6 ring-1 ring-cyan-500/10 transition-transform duration-300 hover:-translate-y-1">
            <h2 className="text-xl font-semibold mb-4">
              {editingPost ? 'Edit Recruitment Post' : 'Create Recruitment Post'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Purpose *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.purpose}
                    onChange={(e) => setFormData(prev => ({ ...prev, purpose: e.target.value }))}
                    placeholder="e.g., Hackathon Team, Study Group, Project Partner"
                    className="w-full px-3 py-2 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-1">
                    Maximum Students Required *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="20"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData(prev => ({ ...prev, maxStudents: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Event/Project Name
                </label>
                <input
                  type="text"
                  value={formData.event}
                  onChange={(e) => setFormData(prev => ({ ...prev, event: e.target.value }))}
                  placeholder="e.g., Smart India Hackathon, Final Year Project"
                  className="w-full px-3 py-2 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Required Qualities/Skills
                </label>
                <input
                  type="text"
                  value={formData.qualities}
                  onChange={(e) => setFormData(prev => ({ ...prev, qualities: e.target.value }))}
                  placeholder="e.g., React, Python, Good communication, Team player"
                  className="w-full px-3 py-2 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Preferred Academic Years
                </label>
                <div className="flex flex-wrap gap-2">
                  {yearOptions.map((year) => (
                    <label key={year} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.years.includes(year)}
                        onChange={() => handleYearChange(year)}
                        className="mr-2 text-pink-600 focus:ring-pink-500"
                      />
                      <span className="text-sm text-slate-200">{year}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">
                  Description *
                </label>
                <textarea
                  required
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide more details about what you're looking for, project timeline, expectations, etc."
                  className="w-full px-3 py-2 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full hover:from-pink-600 hover:to-violet-600 transition-colors"
                >
                  {editingPost ? 'Update Recruitment' : 'Post Recruitment'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 bg-slate-800 text-slate-200 rounded-full hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Recruitment Posts */}
        <div className="space-y-4">
          {filteredPosts.length === 0 ? (
            <div className="bg-slate-950/95 rounded-[2rem] shadow-2xl border border-slate-800 p-12 text-center ring-1 ring-cyan-500/10">
              <Users className="h-16 w-16 text-cyan-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No recruitment posts yet</h3>
              <p className="text-slate-300 mb-6">Be the first to post a recruitment and find your perfect teammates!</p>
              <button
                onClick={() => setShowForm(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full hover:from-pink-600 hover:to-violet-600 transition-colors"
              >
                <Plus className="h-5 w-5" />
                Create First Post
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.id} className="bg-slate-950/95 rounded-3xl border border-slate-800 shadow-2xl p-6 transition-transform duration-300 hover:-translate-y-1 hover:shadow-cyan-500/20">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/profile/${post.recruiterId}`)}
                      className="w-12 h-12 bg-pink-600 rounded-full flex items-center justify-center hover:bg-pink-700 transition-colors cursor-pointer"
                      title="View recruiter profile"
                    >
                      <User className="h-6 w-6 text-white" />
                    </button>
                    <div>
                      <button
                        onClick={() => navigate(`/profile/${post.recruiterId}`)}
                        className="font-semibold text-white hover:text-pink-400 transition-colors cursor-pointer"
                        title="View recruiter profile"
                      >
                        {post.recruiterName}
                      </button>
                      <p className="text-sm text-slate-400">{post.recruiterCollege}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="h-4 w-4 text-cyan-300" />
                      {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                    {currentUser?.uid === post.recruiterId && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEdit(post)}
                          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-900 rounded-full transition-colors"
                          title="Edit post"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => confirmDelete(post)}
                          className="p-2 text-slate-300 hover:text-pink-400 hover:bg-slate-900 rounded-full transition-colors"
                          title="Delete post"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Target className="h-5 w-5 text-pink-500" />
                    {post.purpose}
                  </h4>
                  {post.event && (
                    <p className="text-sm text-slate-300 mb-2 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-cyan-300" />
                      Event: {post.event}
                    </p>
                  )}
                  <p className="text-slate-300 mb-3">{post.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Users className="h-4 w-4 text-cyan-300" />
                    <span>Need {post.maxStudents} student{post.maxStudents > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <GraduationCap className="h-4 w-4 text-violet-300" />
                    <span>{post.years.join(', ')}</span>
                  </div>
                  {post.qualities && (
                    <div className="flex items-center gap-2 text-slate-300">
                      <Target className="h-4 w-4 text-pink-400" />
                      <span className="truncate">{post.qualities}</span>
                    </div>
                  )}
                </div>

                {currentUser?.uid !== post.recruiterId && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => handleMessage(post)}
                      className="flex items-center gap-2 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Message Recruiter
                    </button>
                  </div>
                )}
              </div>
            </div>
            ))
          )}
        </div>
      </div>

      {postToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-slate-900 border border-slate-700 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-white mb-3">Delete Recruitment Post</h2>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete the post "{postToDelete.purpose}"? This action cannot be undone.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDelete}
                className="w-full sm:w-auto px-5 py-2 rounded-full border border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(postToDelete.id)}
                className="w-full sm:w-auto px-5 py-2 rounded-full bg-pink-600 text-white hover:bg-pink-700 transition"
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
