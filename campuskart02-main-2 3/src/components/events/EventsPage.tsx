import React, { useEffect, useMemo, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import CollegeSelect from '../common/CollegeSelect';
import { Event } from '../../types';
import { Calendar as CalendarIcon, MapPin, Search, Filter, X, ExternalLink } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import BackButton from '../common/BackButton';

export const EventsPage: React.FC = () => {
  const { userData } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [city, setCity] = useState('');
  const [college, setCollege] = useState('');
  const [query, setQuery] = useState('');
  const [date, setDate] = useState('');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [openToAllOnly, setOpenToAllOnly] = useState(false);

  const [showFilters, setShowFilters] = useState(true);
  const [autoCollegeApplied, setAutoCollegeApplied] = useState(false);

  useEffect(() => {
    const eventsRef = ref(database, 'events');
    const unsub = onValue(eventsRef, (snapshot) => {
      setLoading(false);
      if (!snapshot.exists()) { setEvents([]); return; }
      const data = snapshot.val();
      const list: Event[] = Object.keys(data).map((k) => ({ id: k, ...data[k] }));
      // sort by date/time desc -> newest first
      list.sort((a, b) => {
        const aDT = new Date(`${a.date} ${a.time || '00:00'}`).getTime();
        const bDT = new Date(`${b.date} ${b.time || '00:00'}`).getTime();
        return bDT - aDT;
      });
      setEvents(list);
    });
    return () => unsub();
  }, []);

  // Auto-apply user's registered college (and city) once
  useEffect(() => {
    if (!autoCollegeApplied && userData?.college) {
      setCollege(userData.college);
      if (userData.city) setCity(userData.city);
      setAutoCollegeApplied(true);
    }
  }, [userData, autoCollegeApplied]);

  const filtered = useMemo(() => {
    const now = Date.now();
    return events.filter((e) => {
      if (upcomingOnly) {
        const t = new Date(`${e.date} ${e.time || '00:00'}`).getTime();
        if (isFinite(t) && t < now) return false;
      }
      if (openToAllOnly && !(e as any).openToAllCollege) return false;
      if (city && !(e as any).openToAllCollege) {
        if ((e as any).city) {
          if ((e as any).city !== city) return false;
        } else {
          // if event lacks city but city filter is set, try to match by college text containing city
          if (!(`${e.college || ''}`.toLowerCase().includes(city.toLowerCase()))) return false;
        }
      }
      if (college && !(e as any).openToAllCollege && e.college !== college) return false;
      if (date) {
        try { if (new Date(e.date).toDateString() !== new Date(date).toDateString()) return false; } catch {}
      }
      if (query) {
        const q = query.toLowerCase();
        const text = `${e.title} ${e.description} ${e.organizer} ${e.venue} ${e.college}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  }, [events, city, college, query, date, upcomingOnly, openToAllOnly]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.36),_transparent_20%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.28),_transparent_20%),radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.28),_transparent_20%),linear-gradient(180deg,_#e0f2fe_0%,_#dbeafe_45%,_#eff6ff_100%)] py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-16 h-96 w-96 rounded-full bg-cyan-400/35 blur-3xl opacity-90 animate-pulse" />
        <div className="absolute top-16 right-12 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl opacity-80 animate-pulse delay-200" />
        <div className="absolute bottom-16 left-1/4 h-72 w-72 rounded-full bg-pink-500/25 blur-3xl opacity-75 animate-pulse delay-400" />
      </div>
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <BackButton toHomeFallback="/dashboard" />
            <h1 className="text-2xl font-bold text-white">Events & Hackathons</h1>
          </div>
          <button
            className="inline-flex items-center justify-center px-3 py-2 border border-slate-700 rounded-full text-sm text-slate-100 bg-slate-950/80 hover:bg-slate-900 w-full sm:w-auto transition-all duration-300"
            onClick={() => setShowFilters((s) => !s)}
          >
            {showFilters ? <X className="h-4 w-4 mr-2"/> : <Filter className="h-4 w-4 mr-2"/>}
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="bg-slate-950/95 border border-slate-800 rounded-3xl shadow-2xl ring-1 ring-sky-500/10 p-4 mb-6 backdrop-blur-xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-slate-200 mb-1">College</label>
                <CollegeSelect
                  value={{ city, college }}
                  onChange={(v) => { setCity(v.city); setCollege(v.college); }}
                  comboMode
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1">Search</label>
                <div className="relative">
                  <Search className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Title, organizer, venue..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-700 rounded-2xl bg-slate-900 text-slate-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center space-x-2 text-slate-200">
                  <input id="upcoming" type="checkbox" checked={upcomingOnly} onChange={(e) => setUpcomingOnly(e.target.checked)} className="text-cyan-500 focus:ring-cyan-500" />
                  <label htmlFor="upcoming" className="text-sm text-slate-200">Show only upcoming</label>
                </div>
                <div className="flex items-center space-x-2 text-slate-200">
                  <input id="openAll" type="checkbox" checked={openToAllOnly} onChange={(e) => setOpenToAllOnly(e.target.checked)} className="text-cyan-500 focus:ring-cyan-500" />
                  <label htmlFor="openAll" className="text-sm text-slate-200">Open to all colleges only</label>
                </div>
              </div>
              <div className="flex sm:justify-end">
                <button
                  className="w-full sm:w-auto text-sm px-3 py-2 rounded-full border border-slate-700 bg-slate-900 text-slate-100 hover:bg-slate-800 transition duration-300"
                  onClick={() => { setCity(''); setCollege(''); setQuery(''); setDate(''); setUpcomingOnly(true); setOpenToAllOnly(false); }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {loading ? (
          <p className="text-gray-500">Loading events...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center text-gray-600 py-16">
            <p>No events match your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((event) => (
              <div key={event.id} className="bg-slate-950/95 rounded-3xl border border-slate-800 shadow-2xl p-5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-sky-500/20">
                {event.image && (
                  <img src={event.image} alt={event.title} className="w-full h-44 object-cover rounded-3xl mb-4 border border-slate-700" />
                )}
                <h3 className="font-semibold text-white mb-2 line-clamp-1">{event.title}</h3>
                <div className="space-y-1 text-sm text-slate-300 mb-3">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-cyan-300" />
                    <span>{event.date} {event.time && `at ${event.time}`}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-violet-300" />
                    <span>{event.venue}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-300 mb-3 line-clamp-2">{event.description}</p>
                <div className="flex justify-between items-center mb-3 text-xs text-slate-400">
                  <span>{(event as any).openToAllCollege ? 'Open to all colleges' : event.college}</span>
                  <span>By {event.organizer}</span>
                </div>
                {(event as any).registrationUrl && (
                  <a
                    href={(event as any).registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-sky-500 to-cyan-500 text-white text-sm font-medium rounded-full shadow-lg hover:from-sky-400 hover:to-cyan-400 transition-all duration-300"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Register Now
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventsPage;
