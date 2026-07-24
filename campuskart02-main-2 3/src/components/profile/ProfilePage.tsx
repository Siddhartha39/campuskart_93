import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { database } from '../../config/firebase';
import { ref, get, update, remove } from 'firebase/database';
import { Item } from '../../types';
import { Whisper } from '../../types/whisper';
import { uploadSupabaseFile, SUPABASE_BUCKETS, sanitizeFileName } from '../../config/supabase';
import { Camera, Edit3 } from 'lucide-react';
import CollegeSelect from '../common/CollegeSelect';
import { useNavigate, useLocation } from 'react-router-dom';
import BackButton from '../common/BackButton';
import { CampusIdModal } from '../campusWhisper/CampusIdModal';
import { CreateWhisperModal } from '../campusWhisper/CreateWhisperModal';

export const ProfilePage: React.FC = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userItems, setUserItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: userData?.name || '',
    bio: userData?.bio || '',
    mobile: userData?.mobile || '',
    college: userData?.college || '',
    profilePhoto: userData?.profilePhoto || ''
  });
  const [showCampusIdModal, setShowCampusIdModal] = useState(false);
  const [newProfilePhoto, setNewProfilePhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const [userWhispers, setUserWhispers] = useState<Whisper[]>([]);
  const [placementApplications, setPlacementApplications] = useState<any[]>([]);
  const [isEditWhisperOpen, setIsEditWhisperOpen] = useState(false);
  const [editingWhisper, setEditingWhisper] = useState<Whisper | null>(null);
  const [whisperToDelete, setWhisperToDelete] = useState<Whisper | null>(null);
  const [activeSection, setActiveSection] = useState<'whispers' | 'placements' | 'items' | null>(null);

  useEffect(() => {
    if (userData) {
      setProfileData({
        name: userData.name,
        bio: userData.bio || '',
        mobile: userData.mobile || '',
        college: userData.college || '',
        profilePhoto: userData.profilePhoto || ''
      });
    }

    if (currentUser) {
      fetchUserItems();
      fetchUserWhispers();
      fetchPlacementApplications();
    } else {
      setLoading(false);
    }
  }, [currentUser, userData]);

  // Open edit mode when URL contains ?edit=1
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('edit') === '1') setEditMode(true);
  }, [location.search]);

  const fetchUserItems = async () => {
    if (!currentUser) return;

    try {
      const itemsRef = ref(database, 'items');
      const snapshot = await get(itemsRef);

      if (snapshot.exists()) {
        const allItems = snapshot.val();
        const userItemsList = Object.entries(allItems)
          .filter(([_, item]: [string, any]) => item.sellerId === currentUser.uid)
          .map(([id, item]: [string, any]) => ({ id, ...item }));

        setUserItems(userItemsList as Item[]);
      }
    } catch (error) {
      console.error('Error fetching user items:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSold = async (itemId: string) => {
    if (!currentUser) return;
    if (!window.confirm('Mark this item as sold? This will hide it from marketplace.')) return;

    try {
      const itemRef = ref(database, `items/${itemId}`);
      await update(itemRef, { isActive: false, soldAt: Date.now() });
      setUserItems(prev => prev.map(item => item.id === itemId ? { ...item, isActive: false, soldAt: Date.now() } : item));
    } catch (error) {
      console.error('Error marking item as sold:', error);
      alert('Failed to mark item as sold. Please try again.');
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadProfilePhoto = async (file: File): Promise<string> => {
    if (!currentUser) throw new Error('User is not authenticated.');
    const safeName = sanitizeFileName(file.name);
    const fileName = `profiles/${currentUser.uid}/${Date.now()}-${safeName}`;
    return await uploadSupabaseFile(SUPABASE_BUCKETS.profiles, fileName, file);
  };

  const handleSaveProfile = async () => {
    if (!currentUser) return;

    try {
      let photoUrl = profileData.profilePhoto;

      if (newProfilePhoto) {
        photoUrl = await uploadProfilePhoto(newProfilePhoto);
      }

      const updatedData = {
        ...profileData,
        profilePhoto: photoUrl,
      };

      const userRef = ref(database, `users/${currentUser.uid}`);
      await update(userRef, updatedData);

      setProfileData(updatedData);
      setEditMode(false);
      setNewProfilePhoto(null);
      setPhotoPreview('');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleEditItem = (itemId: string) => {
    navigate(`/sell?edit=${itemId}`);
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const itemRef = ref(database, `items/${itemId}`);
      await remove(itemRef);
      setUserItems(prev => prev.filter(item => item.id !== itemId));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to delete item. Please try again.');
    }
  };

  const openEditWhisper = (whisper: Whisper) => {
    setEditingWhisper(whisper);
    setIsEditWhisperOpen(true);
  };

  const closeEditWhisper = () => {
    setEditingWhisper(null);
    setIsEditWhisperOpen(false);
  };

  const handleUpdateWhisper = async (payload: { category: string; message: string; imageUrl?: string; allowComments: boolean; anonymous: boolean; }) => {
    if (!editingWhisper) return;

    try {
      const whisperRef = ref(database, `whispers/${editingWhisper.id}`);
      await update(whisperRef, {
        category: payload.category,
        message: payload.message,
        imageUrl: payload.imageUrl || null,
        anonymous: payload.anonymous,
        editedAt: new Date().toISOString(),
        tags: [payload.category.toLowerCase()],
      });

      setUserWhispers(prev => prev.map(whisper => whisper.id === editingWhisper.id ? {
        ...whisper,
        category: payload.category,
        message: payload.message,
        imageUrl: payload.imageUrl,
        anonymous: payload.anonymous,
        editedAt: new Date().toISOString(),
        tags: [payload.category.toLowerCase()],
      } : whisper));
    } catch (error) {
      console.error('Error updating whisper:', error);
      alert('Failed to update whisper. Please try again.');
    } finally {
      closeEditWhisper();
    }
  };

  const handleDeleteWhisper = async (whisperId: string) => {
    try {
      const whisperRef = ref(database, `whispers/${whisperId}`);
      await remove(whisperRef);
      setUserWhispers(prev => prev.filter(whisper => whisper.id !== whisperId));
      setWhisperToDelete(null);
    } catch (error) {
      console.error('Error deleting whisper:', error);
      alert('Failed to delete whisper. Please try again.');
    }
  };

  const confirmDeleteWhisper = (whisper: Whisper) => {
    setWhisperToDelete(whisper);
  };

  const cancelDeleteWhisper = () => {
    setWhisperToDelete(null);
  };

  const fetchUserWhispers = async () => {
    if (!currentUser) return;

    try {
      const whispersRef = ref(database, 'whispers');
      const snapshot = await get(whispersRef);
      if (snapshot.exists()) {
        const allWhispers = snapshot.val();
        const userWhispersList = Object.entries(allWhispers)
          .filter(([_, whisper]: [string, any]) => whisper.authorUid === currentUser.uid)
          .map(([id, whisper]: [string, any]) => ({ id, ...whisper }));

        setUserWhispers(userWhispersList as Whisper[]);
      }
    } catch (error) {
      console.error('Error fetching user whispers:', error);
      setUserWhispers([]);
    }
  };

  const fetchPlacementApplications = async () => {
    if (!currentUser) return;

    try {
      const appsRef = ref(database, `placementApplications/${currentUser.uid}`);
      const snapshot = await get(appsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const list = Object.entries(data).map(([id, value]: [string, any]) => ({ id, ...value }));
        setPlacementApplications(list);
      } else {
        setPlacementApplications([]);
      }
    } catch (error) {
      console.error('Error fetching placement applications:', error);
      setPlacementApplications([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border p-8">
            <div className="mb-4">
              <BackButton toHomeFallback="/dashboard" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete your profile</h1>
            <p className="text-gray-600 mb-6">We couldn't find your profile details. You can add your name, bio and photo now.</p>
            {!editMode ? (
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Profile
              </button>
            ) : (
              <div className="space-y-4">
                <input
                  type="text"
                  name="name"
                  value={profileData.name}
                  onChange={handleInputChange}
                  className="w-full text-2xl font-bold bg-transparent border-b-2 border-gray-200 focus:border-blue-500 outline-none text-gray-900 placeholder:text-gray-400"
                  placeholder="Your name"
                />
                <input
                  type="tel"
                  name="mobile"
                  value={profileData.mobile}
                  onChange={handleInputChange}
                  className="w-full mt-4 px-4 py-3 rounded-2xl border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="Mobile number"
                />
                <textarea
                  name="bio"
                  value={profileData.bio}
                  onChange={handleInputChange}
                  className="w-full mt-4 p-3 border border-gray-200 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                  rows={4}
                  placeholder="Tell us about yourself..."
                />
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => { setEditMode(false); setNewProfilePhoto(null); setPhotoPreview(''); }}
                    className="px-4 py-2 bg-white/10 text-gray-700 rounded-lg border border-gray-200 hover:bg-white/20"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-violet-950 text-white rounded-3xl shadow-2xl overflow-hidden mb-10 ring-1 ring-white/10">
          <div className="h-28 bg-gradient-to-r from-violet-500 via-cyan-500 to-slate-900" />
          <div className="mb-4 -mt-12 px-8 flex justify-between items-start gap-4">
            <BackButton toHomeFallback="/dashboard" />
            <div className="rounded-full bg-white/10 px-4 py-2 text-sm text-white/80 ring-1 ring-white/10">Campus profile</div>
          </div>
          <div className="px-8 pb-8 flex flex-col lg:flex-row items-start lg:items-center gap-8">
            <div className="relative">
              <div className="w-36 h-36 rounded-full overflow-hidden bg-white/10 flex items-center justify-center ring-4 ring-white/20 shadow-2xl backdrop-blur-xl">
                {(photoPreview || profileData.profilePhoto) ? (
                  <img
                    src={photoPreview || profileData.profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-5xl font-bold text-white/80">
                    {userData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {editMode && (
                <label className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2 rounded-full cursor-pointer shadow hover:from-blue-700 hover:to-indigo-700">
                  <Camera className="h-4 w-4" />
                  <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                </label>
              )}
            </div>

            <div className="flex-1 w-full">
              {editMode ? (
                <div className="space-y-4">
                  <input
                    type="text"
                    name="name"
                    value={profileData.name}
                    onChange={handleInputChange}
                    className="w-full text-2xl font-bold bg-transparent border-b-2 border-white/30 focus:border-white outline-none text-white placeholder:text-white/60"
                    placeholder="Your name"
                  />
                  <input
                    type="tel"
                    name="mobile"
                    value={profileData.mobile}
                    onChange={handleInputChange}
                    className="w-full mt-4 px-4 py-3 rounded-2xl border border-white/20 bg-white/10 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                    placeholder="Mobile number"
                  />
                      {/* College select: allow adding college only when not already set */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-white/80 mb-2">College</label>
                        {userData?.college ? (
                          <div className="px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-white">{userData.college} <span className="ml-2 text-xs text-white/60">(College cannot be changed)</span></div>
                        ) : (
                          <CollegeSelect
                            value={{ city: '', college: profileData.college }}
                            onChange={(val) => setProfileData(prev => ({ ...prev, college: val.college }))}
                            required
                            comboMode={true}
                            darkMode={true}
                          />
                        )}
                      </div>
                  <textarea
                    name="bio"
                    value={profileData.bio}
                    onChange={handleInputChange}
                    className="w-full mt-4 p-3 border border-white/20 rounded-2xl bg-white/10 text-white placeholder:text-white/60 focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="Tell us about yourself..."
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSaveProfile}
                      className="px-4 py-2 bg-white text-slate-900 rounded-full font-semibold shadow hover:bg-slate-100 transition"
                    >
                      Save Changes
                    </button>
                    <button
                      onClick={() => {
                        setEditMode(false);
                        setNewProfilePhoto(null);
                        setPhotoPreview('');
                      }}
                      className="px-4 py-2 bg-white/10 text-white rounded-full border border-white/20 hover:bg-white/20 transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <h1 className="text-4xl font-bold tracking-tight text-white">{userData.name}</h1>
                      {userData.bio && <p className="mt-3 max-w-2xl text-sm text-slate-200">{userData.bio}</p>}
                    </div>
                    <button
                      onClick={() => navigate('/profile?edit=1')}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 hover:bg-white/15 transition"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit Profile
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-3 items-center text-sm text-slate-200">
                    {userData.campusProfile || userData.campusId ? (
                        <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2">
                          <span className="font-mono">{userData.campusProfile?.id || userData.campusId}</span>
                        </div>
                      ) : (
                      <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-orange-800">
                        Whisper ID required for Campus Whisper
                      </div>
                      )}
                    <button
                      onClick={() => setShowCampusIdModal(true)}
                      className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-sm text-white/90 hover:bg-white/15 transition"
                    >
                      {userData.campusProfile ? 'Edit Whisper ID' : 'Add Whisper ID'}
                    </button>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
                      <div className="text-xs uppercase tracking-[0.25em] text-white/70">College</div>
                      <div className="mt-2 font-semibold text-white">{userData.college || 'Not provided'}</div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
                      <div className="text-xs uppercase tracking-[0.25em] text-white/70">City</div>
                      <div className="mt-2 font-semibold text-white">{userData.city || 'Not provided'}</div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
                      <div className="text-xs uppercase tracking-[0.25em] text-white/70">Mobile</div>
                      <div className="mt-2 font-semibold text-white">{userData.mobile || 'Not provided'}</div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
                      <div className="text-xs uppercase tracking-[0.25em] text-white/70">Followers</div>
                      <div className="mt-2 font-semibold text-white">{userData.followers?.length || 0}</div>
                    </div>
                    <div className="rounded-3xl border border-white/10 bg-white/10 p-4 text-sm text-slate-200">
                      <div className="text-xs uppercase tracking-[0.25em] text-white/70">Following</div>
                      <div className="mt-2 font-semibold text-white">{userData.following?.length || 0}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <button
            onClick={() => setActiveSection((prev) => (prev === 'whispers' ? null : 'whispers'))}
            className={`rounded-3xl border p-6 text-left shadow-sm transition ${activeSection === 'whispers' ? 'border-violet-400 bg-violet-50 shadow-violet-100' : 'border-slate-200 bg-white hover:shadow-md'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm uppercase tracking-[0.2em] text-violet-600">Campus Whisper</div>
              <span className="inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-700">{userWhispers.length} posts</span>
            </div>
            <div className="mt-3 text-xl font-semibold text-slate-900">Explore all posts</div>
            <div className="mt-4 text-sm text-slate-500">View community whispers and continue sharing.</div>
          </button>
          <button
            onClick={() => setActiveSection((prev) => (prev === 'placements' ? null : 'placements'))}
            className={`rounded-3xl border p-6 text-left shadow-sm transition ${activeSection === 'placements' ? 'border-cyan-400 bg-cyan-50 shadow-cyan-100' : 'border-slate-200 bg-white hover:shadow-md'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm uppercase tracking-[0.2em] text-cyan-600">Placement History</div>
              <span className="inline-flex items-center rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold text-cyan-700">{placementApplications.length} applied</span>
            </div>
            <div className="mt-3 text-xl font-semibold text-slate-900">Review your applications</div>
            <div className="mt-4 text-sm text-slate-500">See your applied companies and placement history.</div>
          </button>
          <button
            onClick={() => setActiveSection((prev) => (prev === 'items' ? null : 'items'))}
            className={`rounded-3xl border p-6 text-left shadow-sm transition ${activeSection === 'items' ? 'border-blue-400 bg-blue-50 shadow-blue-100' : 'border-slate-200 bg-white hover:shadow-md'}`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm uppercase tracking-[0.2em] text-blue-600">Posted Items</div>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">{userItems.length} listings</span>
            </div>
            <div className="mt-3 text-xl font-semibold text-slate-900">Manage listings</div>
            <div className="mt-4 text-sm text-slate-500">View and edit your posted items.</div>
          </button>
        </div>

        {activeSection === 'whispers' && (
          <section className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">My Campus Whispers</h2>
                <p className="text-sm text-slate-500">All your whispers in one place.</p>
              </div>
              <button
                onClick={() => setActiveSection(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
            {userWhispers.length === 0 ? (
              <div className="text-center py-12 text-gray-500">You haven’t posted any whispers yet. Create one from Campus Whisper.</div>
            ) : (
              <div className="space-y-4">
                {userWhispers.map((whisper) => (
                  <div key={whisper.id} className="rounded-3xl border border-gray-200 p-5 bg-gray-50">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm uppercase tracking-[0.2em] text-violet-500">{whisper.category}</p>
                        <p className="mt-2 text-gray-900 whitespace-pre-line">{whisper.message}</p>
                      </div>
                      <div className="flex flex-col items-start gap-2 text-right text-xs text-gray-500 md:items-end">
                        <p>{new Date(whisper.createdAt).toLocaleDateString()}</p>
                        {whisper.editedAt ? <p>Edited</p> : null}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <button
                            onClick={() => openEditWhisper(whisper)}
                            className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDeleteWhisper(whisper)}
                            className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === 'placements' && (
          <section className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Placement Applications</h2>
                <p className="text-sm text-slate-500">Your applied companies and current status.</p>
              </div>
              <button
                onClick={() => setActiveSection(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
            {placementApplications.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">No placement applications yet.</div>
            ) : (
              <div className="space-y-4">
                {placementApplications.map((app) => (
                  <div key={app.id} className="rounded-3xl border border-gray-200 bg-slate-50 p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{app.companyName}</h3>
                        <p className="text-sm text-slate-600">Applied on {new Date(app.appliedAt).toLocaleDateString()}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-3 py-2 text-sm font-semibold ${app.status === 'applied' ? 'bg-blue-100 text-blue-700' : app.status === 'accepted' ? 'bg-emerald-100 text-emerald-700' : app.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'}`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {activeSection === 'items' && (
          <section className="bg-white rounded-3xl shadow-lg border border-gray-200 p-8 mb-8">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">My Posted Items</h2>
                <p className="text-sm text-slate-500">Your active listings and item management.</p>
              </div>
              <button
                onClick={() => setActiveSection(null)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition"
              >
                Close
              </button>
            </div>
            {userItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No items posted yet. Start selling by posting your first item.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-transform duration-200 hover:-translate-y-0.5 bg-white">
                    <div className="aspect-square bg-gray-100 relative">
                      {!item.isActive && (
                        <div className="absolute top-3 left-3 z-10">
                          <span className="px-2 py-1 text-[11px] font-semibold rounded-md bg-gray-900/80 text-white">Sold</span>
                        </div>
                      )}
                      <img src={item.productImage} alt={item.productName} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1">{item.productName}</h3>
                      <p className="text-sm text-gray-600 mb-2">{item.type}</p>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-lg font-bold text-blue-600">₹{item.price}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${item.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                          {item.isActive ? 'Available' : 'Sold'}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2">
                        <button
                          onClick={() => handleEditItem(item.id)}
                          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                        >
                          Edit
                        </button>
                        {item.isActive ? (
                          <button
                            onClick={() => handleMarkAsSold(item.id)}
                            className="w-full px-3 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:from-blue-700 hover:to-indigo-700 transition"
                          >
                            Mark as Sold
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      <CreateWhisperModal
        isOpen={isEditWhisperOpen}
        onClose={closeEditWhisper}
        onSubmit={handleUpdateWhisper}
        editingWhisper={editingWhisper ? {
          id: editingWhisper.id,
          category: editingWhisper.category,
          message: editingWhisper.message,
          imageUrl: editingWhisper.imageUrl,
          anonymous: editingWhisper.anonymous,
        } : null}
      />
      <CampusIdModal isOpen={showCampusIdModal} onClose={() => setShowCampusIdModal(false)} />

      {whisperToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-[2rem] bg-white border border-slate-200 p-6 shadow-2xl">
            <h2 className="text-xl font-semibold text-slate-900 mb-3">Delete Whisper</h2>
            <p className="text-slate-600 mb-6">
              Are you sure you want to delete this whisper? This action cannot be undone.
            </p>
            <p className="mb-6 text-sm text-slate-500">“{whisperToDelete.message || 'Image-only whisper'}”</p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={cancelDeleteWhisper}
                className="w-full sm:w-auto rounded-full border border-slate-300 bg-slate-100 px-5 py-2 text-slate-700 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteWhisper(whisperToDelete.id)}
                className="w-full sm:w-auto rounded-full bg-rose-600 px-5 py-2 text-white hover:bg-rose-700 transition"
              >
                Delete Whisper
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
