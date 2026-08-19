import React, { useEffect, useMemo, useState } from 'react';
import { database } from '../../config/firebase';
import { ref, onValue, push, update } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { PlacementCompany, PlacementApplication } from '../../types';
import { PlacementCard } from './PlacementCard';
import BackButton from '../common/BackButton';
import { Search, FileCheck, Sparkles, ArrowRight } from 'lucide-react';

export const PlacementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [placements, setPlacements] = useState<PlacementCompany[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [applications, setApplications] = useState<PlacementApplication[]>([]);
  const [filter, setFilter] = useState<'All' | 'Internship' | 'Placement'>('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showSavedOnly, setShowSavedOnly] = useState(false);

  useEffect(() => {
    const placementsRef = ref(database, 'placements');
    const unsub = onValue(placementsRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      setPlacements(list);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    const bookmarkRef = ref(database, `placementBookmarks/${currentUser.uid}`);
    const unsub = onValue(bookmarkRef, (snap) => {
      if (!snap.exists()) {
        setBookmarks([]);
        return;
      }
      setBookmarks(Object.keys(snap.val()));
    });

    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const applicationRef = ref(database, `placementApplications/${currentUser.uid}`);
    const unsub = onValue(applicationRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      setApplications(list);
    });

    return () => unsub();
  }, [currentUser]);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    return placements
      .filter((placement) => filter === 'All' || placement.type === filter)
      .filter((placement) => {
        if (showSavedOnly && !bookmarks.includes(placement.id)) return false;
        if (!normalized) return true;

        const haystack = [
          placement.companyName,
          placement.description,
          placement.jobDescription,
          placement.eligibility,
          placement.location,
          placement.salary,
          ...(placement.skills || []),
          ...(placement.tags || []),
        ].join(' ').toLowerCase();

        return haystack.includes(normalized);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [placements, filter, search, showSavedOnly, bookmarks]);

  const handleApply = async (placement: PlacementCompany) => {
    if (!currentUser) return;

    const payload = {
      userId: currentUser.uid,
      placementId: placement.id,
      companyName: placement.companyName,
      status: 'applied',
      appliedAt: new Date().toISOString(),
    };

    await push(ref(database, `placementApplications/${currentUser.uid}`), payload);

    const destination = placement.applyLink || placement.website;
    if (destination) {
      window.open(destination, '_blank', 'noopener,noreferrer');
    }
  };

  const handleBookmark = async (placement: PlacementCompany) => {
    if (!currentUser) return;

    const userBookmarkPath = `placementBookmarks/${currentUser.uid}/${placement.id}`;
    const bookmarked = bookmarks.includes(placement.id);

    if (bookmarked) {
      await update(ref(database), { [userBookmarkPath]: null });
    } else {
      await update(ref(database), { [userBookmarkPath]: true });
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.55),_transparent_18%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.45),_transparent_20%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.45),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.38),_transparent_26%),linear-gradient(180deg,_#bae6fd_0%,_#93c5fd_45%,_#dbeafe_100%)] py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-96 w-96 rounded-full bg-cyan-400/45 blur-3xl opacity-95 animate-ping" />
        <div className="absolute top-8 right-12 h-80 w-80 rounded-full bg-sky-500/35 blur-3xl opacity-90 animate-pulse" />
        <div className="absolute bottom-10 left-1/4 h-72 w-72 rounded-full bg-violet-500/45 blur-3xl opacity-85 animate-pulse" />
        <div className="absolute bottom-24 right-1/4 h-60 w-60 rounded-full bg-pink-500/35 blur-3xl opacity-80 animate-pulse" />
        <div className="absolute top-1/2 left-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-300/30 blur-2xl opacity-90" />
        <div className="absolute top-24 left-1/2 h-52 w-52 -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-3xl opacity-80 animate-pulse" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-start">
          <BackButton toHomeFallback="/dashboard" className="border-slate-200 bg-slate-950/90 text-white hover:bg-slate-900" />
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-gradient-to-br from-slate-950 to-slate-900 p-8 shadow-2xl shadow-slate-950/20 mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Placements & Internships</p>
            <h1 className="mt-4 text-4xl font-semibold text-white">Discover top opportunities across campus.</h1>
            <p className="mt-3 max-w-2xl text-slate-300">Browse internships and placements with simple filters, save your favorites, and apply directly from one place.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-lg shadow-slate-950/20 ring-1 ring-sky-500/10 transition duration-300 hover:-translate-y-1">
              <p className="text-sm text-sky-200">Total companies</p>
              <p className="mt-2 text-3xl font-semibold text-white">{placements.length}</p>
            </div>
            <div className="rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 shadow-lg shadow-slate-950/20 ring-1 ring-sky-500/10 transition duration-300 hover:-translate-y-1">
              <p className="text-sm text-sky-200">Saved opportunities</p>
              <p className="mt-2 text-3xl font-semibold text-white">{bookmarks.length}</p>
            </div>
          </div>
        </div>

        {/* AI Resume Analyzer Spotlight Banner */}
        <div className="rounded-[2rem] border border-cyan-500/30 bg-gradient-to-r from-sky-950 via-slate-900 to-indigo-950 p-6 text-white shadow-xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-slate-950 font-bold shrink-0 shadow-md shadow-cyan-400/20">
              <FileCheck className="h-6 w-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">New Feature</span>
                <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-200">Gemini 2.0 AI</span>
              </div>
              <h2 className="text-lg font-bold text-white mt-0.5">AI Resume ATS & Requirements Checker</h2>
              <p className="text-xs text-slate-300 mt-0.5">Benchmark your resume directly against specific company hiring criteria and get tailored improvement points.</p>
            </div>
          </div>
          <Link
            to="/resume-analyzer"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-400 to-sky-400 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:from-cyan-300 hover:to-sky-300 transition shrink-0"
          >
            Launch Resume Analyzer <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-2xl shadow-slate-900/10 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-sky-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by company, eligibility, skills or location..."
                  className="w-full rounded-3xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {(['All', 'Internship', 'Placement'] as const).map((option) => (
                  <button
                    key={option}
                    onClick={() => setFilter(option)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition duration-300 ${filter === option ? 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <button
                onClick={() => setShowSavedOnly((value) => !value)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${showSavedOnly ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
              >
                {showSavedOnly ? 'Showing saved only' : 'Show saved opportunities'}
              </button>
              <button
                onClick={() => {
                  setSearch('');
                  setFilter('All');
                  setShowSavedOnly(false);
                }}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Clear filters
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              {loading ? (
                <div className="rounded-3xl border border-dashed border-slate-300 p-8 text-center text-slate-500">Loading placements…</div>
              ) : filtered.length === 0 ? (
                <div className="rounded-3xl border border-slate-200 p-8 text-center text-slate-500">No companies match your search yet.</div>
              ) : (
                filtered.map((placement) => (
                  <PlacementCard
                    key={placement.id}
                    placement={placement}
                    atsScore={placement.aiScore}
                    isBookmarked={bookmarks.includes(placement.id)}
                    hasApplied={applications.some((app) => app.placementId === placement.id)}
                    onViewDetails={() => window.location.href = `/placement/${placement.id}`}
                    onApply={() => handleApply(placement)}
                    onToggleBookmark={() => handleBookmark(placement)}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
