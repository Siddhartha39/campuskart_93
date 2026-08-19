import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../../config/firebase';
import { database } from '../../config/firebase';
import { ref, onValue } from 'firebase/database';
import { 
  ShoppingBag, 
  ShoppingCart,
  Plus,
  Users,
  User, 
  Bell, 
  MessageCircle, 
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  HelpCircle,
  DownloadCloud,
  FileCheck
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { currentUser, userData, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [msgCount, setMsgCount] = useState(0);

  const sidebarItems = [
    { icon: User, title: 'Profile', link: '/profile' },
    { icon: Settings, title: 'Settings', link: '/settings' },
    { icon: TrendingUp, title: 'Placements', link: '/placement' },
    { icon: FileCheck, title: 'AI Resume Analyzer', link: '/resume-analyzer' },
    { icon: Sparkles, title: 'Campus Whisper', link: '/campus-whisper' },
    { icon: Users, title: 'Teammate Finder', link: '/teammates' },
    { icon: ShoppingCart, title: 'Buy Items', link: '/buy' },
    { icon: Plus, title: 'Sell Item', link: '/sell' },
    { icon: HelpCircle, title: 'Support', link: '/support' },
    { icon: DownloadCloud, title: 'Download App', link: '/download-app' },
  ];

  // Realtime counters from notifications
  useEffect(() => {
    if (!currentUser) { setNotifCount(0); setMsgCount(0); return; }
    const notifRef = ref(database, `notifications/${currentUser.uid}`);
    const unsub = onValue(notifRef, (snap) => {
      if (!snap.exists()) { setNotifCount(0); setMsgCount(0); return; }
      const data = snap.val();
      let total = 0;
      let msgs = 0;
      Object.keys(data).forEach((k) => {
        const n = data[k];
        if (!n?.read) {
          total += 1;
          if (n?.type === 'message') msgs += 1;
        }
      });
      setNotifCount(total);
      setMsgCount(msgs);
    });
    return () => unsub();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (isAdmin) {
    return (
      <nav className="bg-blue-50 shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/admin" className="flex items-center space-x-2">
                <ShoppingBag className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900">CampusKart Admin</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-blue-50 shadow-lg border-b border-blue-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">CampusKart</span>
            </Link>
          </div>

          <div className="flex items-center space-x-2">
            <Link to="/messages" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors" title="Messages">
              <MessageCircle className="h-6 w-6" />
              {msgCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">{msgCount}</span>
              )}
            </Link>
            <Link to="/notifications" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors" title="Notifications">
              <Bell className="h-6 w-6" />
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 min-w-[1.25rem] px-1 flex items-center justify-center">{notifCount}</span>
              )}
            </Link>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 transition-colors rounded-full p-2"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Navigation */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-900/50" onClick={() => setIsMenuOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] max-h-screen overflow-y-auto overscroll-contain border-r border-slate-900 bg-slate-950 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-4">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-6 w-6 text-cyan-400" />
                <span className="text-lg font-semibold text-white">CampusKart</span>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="rounded-full p-2 text-slate-300 hover:bg-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-4 pt-4 pb-6 space-y-2">
              <Link
                to="/profile"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <User className="h-5 w-5 text-slate-200 group-hover:text-white mr-3" />
                Profile
              </Link>
              <Link
                to="/settings"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <Settings className="h-5 w-5 text-slate-200 group-hover:text-white mr-3" />
                Settings
              </Link>
              <Link
                to="/notifications"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <Bell className="h-5 w-5 text-cyan-300 group-hover:text-white mr-3" />
                Notifications
              </Link>
              <Link
                to="/messages"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <MessageCircle className="h-5 w-5 text-sky-300 group-hover:text-white mr-3" />
                Messages
              </Link>
              <Link
                to="/placement"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <TrendingUp className="h-5 w-5 text-violet-300 group-hover:text-white mr-3" />
                Placements
              </Link>
              <Link
                to="/resume-analyzer"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <FileCheck className="h-5 w-5 text-cyan-300 group-hover:text-white mr-3" />
                AI Resume Analyzer
              </Link>
              <Link
                to="/campus-whisper"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <Sparkles className="h-5 w-5 text-fuchsia-300 group-hover:text-white mr-3" />
                Campus Whisper
              </Link>
              <Link
                to="/teammates"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="h-5 w-5 text-emerald-300 group-hover:text-white mr-3" />
                Teammate Finder
              </Link>
              <Link
                to="/buy"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="h-5 w-5 text-sky-300 group-hover:text-white mr-3" />
                Buy Items
              </Link>
              <Link
                to="/sell"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <Plus className="h-5 w-5 text-emerald-300 group-hover:text-white mr-3" />
                Sell Item
              </Link>
              <Link
                to="/support"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <HelpCircle className="h-5 w-5 text-rose-300 group-hover:text-white mr-3" />
                Help & Support
              </Link>
              <Link
                to="/download-app"
                className="group flex items-center px-3 py-3 rounded-3xl text-sm font-medium text-slate-200 transition hover:bg-slate-800"
                onClick={() => setIsMenuOpen(false)}
              >
                <DownloadCloud className="h-5 w-5 text-cyan-300 group-hover:text-white mr-3" />
                Download App
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center w-full rounded-3xl px-3 py-3 text-sm font-medium text-slate-200 transition hover:bg-slate-800"
              >
                <LogOut className="h-5 w-5 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
      {/* Complete profile banner for users who signed up via Google and haven't finished profile */}
      {currentUser && userData && !userData.college && (
        <div className="bg-red-50 border-t border-red-100 text-red-800 text-sm px-6 py-3 flex items-center justify-center">
          <div className="max-w-7xl w-full flex items-center justify-between">
            <div>
              Please complete your profile to access all features and content.
            </div>
            <div>
              <Link to="/profile?edit=1" className="ml-4 inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-white text-sm">
                Complete Profile
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};