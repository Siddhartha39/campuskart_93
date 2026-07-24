import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { database } from '../../config/firebase';
import { ref, onValue, update } from 'firebase/database';
import { 
  ShoppingCart, 
  Plus, 
  Calendar, 
  Users, 
  TrendingUp,
  Package,
} from 'lucide-react';
import CollegeSelect, { CollegeSelectValue } from '../common/CollegeSelect';

export const Dashboard: React.FC = () => {
  const { userData, currentUser } = useAuth();
  const [soldCount, setSoldCount] = useState<number>(0);
  const [sellingCount, setSellingCount] = useState<number>(0);
  const [collegeModalOpen, setCollegeModalOpen] = useState(false);
  const [collegeChoice, setCollegeChoice] = useState<CollegeSelectValue>({ city: '', college: '' });
  const [collegeError, setCollegeError] = useState('');
  const [savingCollege, setSavingCollege] = useState(false);

  useEffect(() => {
    if (!currentUser?.uid) {
      setSoldCount(0);
      setSellingCount(0);
      return;
    }
    const itemsRef = ref(database, 'items');
    const off = onValue(itemsRef, (snapshot) => {
      if (!snapshot.exists()) {
        setSoldCount(0);
        setSellingCount(0);
        return;
      }
      const all = snapshot.val() as Record<string, any>;
      const soldItems = Object.values(all).filter((item: any) => item.sellerId === currentUser.uid && item.isActive === false).length;
      const activeItems = Object.values(all).filter((item: any) => item.sellerId === currentUser.uid && item.isActive === true).length;
      setSoldCount(soldItems);
      setSellingCount(activeItems);
    });
    return () => off();
  }, [currentUser?.uid]);

  useEffect(() => {
    if (currentUser && userData && !userData.college) {
      setCollegeModalOpen(true);
      setCollegeChoice({ city: userData.city || '', college: '' });
    }
  }, [currentUser, userData]);

  const saveCollegeChoice = async () => {
    if (!collegeChoice.college.trim()) {
      setCollegeError('Please select your college before continuing');
      return;
    }

    setSavingCollege(true);
    setCollegeError('');

    try {
      if (!currentUser?.uid) throw new Error('User not logged in');
      const userRef = ref(database, `users/${currentUser.uid}`);
      await update(userRef, {
        college: collegeChoice.college,
        city: collegeChoice.city || userData?.city || ''
      });
      setCollegeModalOpen(false);
    } catch (error: any) {
      setCollegeError(error?.message || 'Unable to save your college.');
    }

    setSavingCollege(false);
  };

  const menuItems = [
    {
      icon: TrendingUp,
      title: 'Campus Whisper',
      description: 'Anonymous campus community feed',
      link: '/campus-whisper',
      color: 'bg-gradient-to-br from-fuchsia-500 to-violet-500 hover:from-fuchsia-600 hover:to-violet-600',
      textColor: 'text-violet-600'
    },
    {
      icon: Package,
      title: 'Placements & Internships',
      description: 'Discover top company opportunities',
      link: '/placement',
      color: 'bg-gradient-to-br from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600',
      textColor: 'text-indigo-600'
    },
    {
      icon: Calendar,
      title: 'Events & Hackathons',
      description: 'Discover campus events and hackathons',
      link: '/events',
      color: 'bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600',
      textColor: 'text-violet-600'
    },
    {
      icon: Users,
      title: 'Teammate Finder',
      description: 'Find study partners',
      link: '/teammates',
      color: 'bg-gradient-to-br from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600',
      textColor: 'text-pink-600'
    },
    {
      icon: Plus,
      title: 'Sell Item',
      description: 'Post an item for sale',
      link: '/sell',
      color: 'bg-gradient-to-br from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600',
      textColor: 'text-emerald-600'
    },
    {
      icon: ShoppingCart,
      title: 'Buy Item',
      description: 'Browse items for sale',
      link: '/buy',
      color: 'bg-gradient-to-br from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600',
      textColor: 'text-sky-600'
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.45),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.34),_transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.32),_transparent_22%),linear-gradient(180deg,_#dbeafe_0%,_#eff6ff_45%,_#f8fafc_100%)]">
      <div className="pointer-events-none absolute -left-20 top-10 h-96 w-96 rounded-full bg-sky-400/30 blur-3xl opacity-95 animate-ping" />
      <div className="pointer-events-none absolute right-12 top-36 h-72 w-72 rounded-full bg-violet-400/30 blur-3xl opacity-90 animate-pulse delay-200" />
      <div className="pointer-events-none absolute left-1/2 top-96 h-64 w-64 -translate-x-1/2 rounded-full bg-fuchsia-400/25 blur-3xl opacity-85 animate-pulse delay-500" />
      <div className="pointer-events-none absolute bottom-16 right-24 h-52 w-52 rounded-full bg-cyan-400/25 blur-3xl opacity-85 animate-pulse" />
      <div className="pointer-events-none absolute top-40 left-20 h-44 w-44 rounded-full bg-pink-500/20 blur-3xl opacity-85 animate-pulse delay-300" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        <div className="mb-10 rounded-[2rem] bg-gradient-to-br from-slate-50 via-slate-100 to-white shadow-2xl border border-slate-200 overflow-hidden">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr] p-8">
            <div className="rounded-[1.75rem] bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-800/85 p-6 shadow-xl ring-1 ring-sky-500/20 backdrop-blur-sm">
              <p className="text-sm uppercase tracking-[0.24em] text-sky-200">Dashboard</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Welcome back, {userData?.name}!</h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-200/90">Your campus marketplace hub. Browse listings, manage your posts, and stay connected with placement and campus whisper activity.</p>
            </div>
            <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 pb-3 items-stretch">
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-2 text-center shadow-sm transition-transform duration-200 ease-out transform-gpu will-change-transform hover:-translate-y-1 hover:shadow-lg flex flex-col items-center justify-center">
                <p className="text-[0.66rem] uppercase tracking-[0.24em] text-rose-600">Followers</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{userData?.followers?.length || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-2 text-center shadow-sm transition-transform duration-200 ease-out transform-gpu will-change-transform hover:-translate-y-1 hover:shadow-lg flex flex-col items-center justify-center">
                <p className="text-[0.66rem] uppercase tracking-[0.24em] text-emerald-600">Following</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{userData?.following?.length || 0}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-2 text-center shadow-sm transition-transform duration-200 ease-out transform-gpu will-change-transform hover:-translate-y-1 hover:shadow-lg flex flex-col items-center justify-center">
                <p className="text-[0.66rem] uppercase tracking-[0.24em] text-violet-600">Active listings</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{sellingCount}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/95 p-2 text-center shadow-sm transition-transform duration-200 ease-out transform-gpu will-change-transform hover:-translate-y-1 hover:shadow-lg flex flex-col items-center justify-center">
                <p className="text-[0.66rem] uppercase tracking-[0.24em] text-cyan-600">Items sold</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">{soldCount}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-10">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              to={item.link}
              className="group relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl"
            >
              <div className="absolute inset-x-6 top-0 h-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-30" />
              <div className={`relative inline-flex items-center justify-center h-12 w-12 rounded-2xl ${item.color} text-white mb-4 shadow-lg`}>
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-2">{item.title}</h3>
              <p className="text-sm text-slate-600">{item.description}</p>
            </Link>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm transition duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Recent activity</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Dashboard overview</h2>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-700">Live</span>
            </div>
            <div className="mt-8 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-8 text-center shadow-inner">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-700 shadow-md">
                <TrendingUp className="h-8 w-8" />
              </div>
              <h3 className="mt-6 text-xl font-semibold text-slate-900">No recent activity yet</h3>
              <p className="mt-3 text-sm text-slate-500">As you engage more with listings and placements, your dashboard will reflect new activity here.</p>
              <Link
                to="/sell"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition duration-500 hover:scale-[1.01] hover:bg-blue-700"
              >
                <Plus className="h-4 w-4" />
                Create a listing
              </Link>
            </div>
          </div>

          <div className="space-y-6">
<div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-slate-50 via-sky-50 to-white p-6 shadow-sm transition duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Spotlight</p>
            <h2 className="mt-3 text-2xl font-semibold text-slate-900">Campus pulse</h2>
            <div className="mt-6 space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Placement drives</p>
                <p className="mt-2 text-sm text-slate-500">Explore the latest internships and job opportunities on campus.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-900">Campus whispers</p>
                <p className="mt-2 text-sm text-slate-500">Keep up with anonymous campus discussions and community posts.</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">Marketplace pulse</p>
                  <p className="mt-2 text-sm text-slate-500">Track top categories and activity across the marketplace.</p>
                </div>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-cyan-50 p-6 shadow-sm transition duration-500 ease-out hover:-translate-y-1 hover:shadow-2xl">
              <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Need inspiration?</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Try these next</h2>
              <div className="mt-6 grid gap-3">
                <Link className="block rounded-3xl border border-slate-200 bg-gradient-to-r from-cyan-50 to-white px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-white" to="/sell">
                  Post a new item and reach more buyers.
                </Link>
                <Link className="block rounded-3xl border border-slate-200 bg-gradient-to-r from-violet-50 to-white px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-indigo-300 hover:bg-white" to="/placement">
                  Explore placement opportunities.
                </Link>
                <Link className="block rounded-3xl border border-slate-200 bg-gradient-to-r from-pink-50 to-white px-4 py-4 text-sm font-medium text-slate-700 transition hover:border-pink-300 hover:bg-white" to="/campus-whisper">
                  Share an anonymous whisper.
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {collegeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
          <div className="w-full max-w-2xl rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-200">
            <div className="p-8">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Complete your college profile</p>
                  <h2 className="mt-2 text-3xl font-semibold text-slate-900">Choose your college to continue</h2>
                  <p className="mt-2 text-sm text-slate-500">Your dashboard is ready once we know your college.</p>
                </div>
              </div>
              <div className="space-y-5">
                <CollegeSelect
                  value={collegeChoice}
                  onChange={(val) => setCollegeChoice(val)}
                  required
                  comboMode
                  darkMode={false}
                />
                {collegeError && <p className="text-sm text-red-600">{collegeError}</p>}
                <button
                  type="button"
                  onClick={saveCollegeChoice}
                  disabled={savingCollege}
                  className="w-full rounded-3xl bg-gradient-to-r from-slate-900 to-slate-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-50"
                >
                  {savingCollege ? 'Saving college...' : 'Continue to Dashboard'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};