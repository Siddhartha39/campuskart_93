import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { database } from '../../config/firebase';
import { ref, onValue } from 'firebase/database';
import { PlacementCompany } from '../../types';
import { ResumeAnalyzerComponent } from './ResumeAnalyzerComponent';
import BackButton from '../common/BackButton';
import { 
  FileCheck, 
  Sparkles, 
  Briefcase, 
  Building2, 
  PlusCircle, 
  CheckCircle, 
  TrendingUp, 
  Search, 
  BookOpen, 
  Lightbulb, 
  Layers 
} from 'lucide-react';

export const ResumeAnalyzerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedPlacementId = searchParams.get('placementId');

  const [placements, setPlacements] = useState<PlacementCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlacement, setSelectedPlacement] = useState<PlacementCompany | null>(null);
  
  // Custom job mode state
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customCompany, setCustomCompany] = useState({
    companyName: '',
    roleTitle: '',
    jobDescription: '',
    eligibility: '',
    skillsString: '',
    salary: 'Not specified',
    location: 'Remote / On-Campus',
    type: 'Placement',
  });

  const [searchFilter, setSearchFilter] = useState('');

  // Fetch placements from Firebase
  useEffect(() => {
    const placementsRef = ref(database, 'placements');
    const unsub = onValue(placementsRef, (snap) => {
      const data = snap.val() || {};
      const list: PlacementCompany[] = Object.keys(data).map((key) => ({ id: key, ...data[key] }));
      setPlacements(list);
      setLoading(false);

      if (requestedPlacementId) {
        const found = list.find((p) => p.id === requestedPlacementId);
        if (found) {
          setSelectedPlacement(found);
          setIsCustomMode(false);
        }
      } else if (list.length > 0 && !selectedPlacement && !isCustomMode) {
        setSelectedPlacement(list[0]);
      }
    });

    return () => unsub();
  }, [requestedPlacementId]);

  const handleSelectPlacement = (placement: PlacementCompany) => {
    setSelectedPlacement(placement);
    setIsCustomMode(false);
    setSearchParams({ placementId: placement.id });
  };

  const handleCustomJobSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCompany.companyName.trim()) return;

    const skillsArray = customCompany.skillsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setSelectedPlacement({
      id: 'custom-' + Date.now(),
      companyName: customCompany.companyName,
      description: customCompany.jobDescription,
      jobDescription: customCompany.jobDescription,
      eligibility: customCompany.eligibility || 'Open to all students',
      skills: skillsArray.length > 0 ? skillsArray : ['Engineering', 'Problem Solving'],
      location: customCompany.location || 'Campus / Remote',
      salary: customCompany.salary || 'Competitive',
      type: (customCompany.type as any) || 'Placement',
      lastDate: new Date().toISOString(),
      isHiringOpen: true,
      createdAt: new Date().toISOString(),
    });
  };

  const activePlacementData = selectedPlacement || (placements.length > 0 ? placements[0] : {
    companyName: 'General Software Engineering',
    jobDescription: 'Software engineering role requiring problem solving, web development, data structures, and algorithms.',
    eligibility: 'B.Tech/BE in CS/IT or related branches with 6.5+ CGPA',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Data Structures'],
    salary: '8 - 14 LPA',
    location: 'Bangalore / Remote',
    type: 'Placement',
  });

  const filteredPlacements = placements.filter((p) => {
    const q = searchFilter.toLowerCase();
    return p.companyName.toLowerCase().includes(q) || (p.skills || []).some((s) => s.toLowerCase().includes(q));
  });

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(56,189,248,0.30),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.30),_transparent_28%),linear-gradient(180deg,_#eff6ff_0%,_#f0fdf4_45%,_#ffffff_100%)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-8">
        
        {/* Top Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <BackButton toHomeFallback="/placement" className="border-slate-200 bg-slate-950/90 text-white hover:bg-slate-900" />
          <div className="flex items-center gap-3">
            <Link
              to="/placement"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm backdrop-blur-sm hover:bg-slate-50 transition"
            >
              <Briefcase className="h-3.5 w-3.5 text-sky-600" /> View Placements Catalog
            </Link>
          </div>
        </div>

        {/* Hero Title Card */}
        <div className="rounded-[2.25rem] border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8 text-white shadow-2xl shadow-slate-950/20">
          <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-widest text-cyan-300 ring-1 ring-cyan-400/30">
                <Sparkles className="h-3.5 w-3.5" /> AI Career Placement Accelerator
              </div>
              <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                AI Resume ATS Analyzer
              </h1>
              <p className="mt-3 text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
                Benchmark your resume directly against <strong className="text-cyan-300 font-semibold">exact company job descriptions & skill requirements</strong>. Get instant ATS compatibility scores, pinpoint skill gaps, and receive tailored action steps to land the interview.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-3xl bg-slate-900/90 p-5 border border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-cyan-300 text-xs font-semibold">
                  <CheckCircle className="h-4 w-4" /> ATS Matching
                </div>
                <p className="mt-2 text-2xl font-bold text-white">0 – 100%</p>
                <p className="text-xs text-slate-400 mt-1">Smart scoring algorithm</p>
              </div>

              <div className="rounded-3xl bg-slate-900/90 p-5 border border-slate-800 shadow-sm">
                <div className="flex items-center gap-2 text-sky-300 text-xs font-semibold">
                  <Layers className="h-4 w-4" /> Active Companies
                </div>
                <p className="mt-2 text-2xl font-bold text-white">{placements.length || '50+'}</p>
                <p className="text-xs text-slate-400 mt-1">Campus drives & internships</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          
          {/* Left Sidebar: Select Opportunity or Custom Specs */}
          <div className="space-y-6">
            
            {/* Mode Switcher */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-lg space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Building2 className="h-4 w-4 text-sky-600" /> Target Job Profile
              </h3>

              <div className="flex rounded-2xl bg-slate-100 p-1">
                <button
                  onClick={() => setIsCustomMode(false)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                    !isCustomMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Campus Drives
                </button>
                <button
                  onClick={() => setIsCustomMode(true)}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold transition ${
                    isCustomMode ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Custom Job Spec
                </button>
              </div>

              {/* Campus Drives List */}
              {!isCustomMode ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchFilter}
                      onChange={(e) => setSearchFilter(e.target.value)}
                      placeholder="Filter companies or skills..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs text-slate-900 outline-none focus:border-sky-500"
                    />
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                    {loading ? (
                      <p className="text-xs text-slate-400 text-center py-4">Loading campus drives...</p>
                    ) : filteredPlacements.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-4">No matching companies.</p>
                    ) : (
                      filteredPlacements.map((p) => {
                        const isSelected = selectedPlacement?.id === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => handleSelectPlacement(p)}
                            className={`w-full text-left p-3 rounded-2xl border transition duration-200 flex items-center justify-between gap-2 ${
                              isSelected
                                ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-200'
                                : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold truncate ${isSelected ? 'text-sky-900' : 'text-slate-800'}`}>
                                {p.companyName}
                              </p>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {p.type} • {p.salary || 'CTC not disclosed'}
                              </p>
                            </div>
                            {isSelected && <CheckCircle className="h-4 w-4 text-sky-600 shrink-0" />}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              ) : (
                /* Custom Job Form */
                <form onSubmit={handleCustomJobSubmit} className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={customCompany.companyName}
                      onChange={(e) => setCustomCompany({ ...customCompany, companyName: e.target.value })}
                      placeholder="e.g. Google, Amazon, Atlassian"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 outline-none focus:border-sky-500 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Target Role / Title</label>
                    <input
                      type="text"
                      value={customCompany.roleTitle}
                      onChange={(e) => setCustomCompany({ ...customCompany, roleTitle: e.target.value })}
                      placeholder="e.g. SDE-1 / Full Stack Intern"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 outline-none focus:border-sky-500 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Required Skills (Comma separated)</label>
                    <input
                      type="text"
                      value={customCompany.skillsString}
                      onChange={(e) => setCustomCompany({ ...customCompany, skillsString: e.target.value })}
                      placeholder="e.g. React, Node.js, Python, AWS, Docker"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 outline-none focus:border-sky-500 mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase">Job Description / Requirements</label>
                    <textarea
                      rows={4}
                      value={customCompany.jobDescription}
                      onChange={(e) => setCustomCompany({ ...customCompany, jobDescription: e.target.value })}
                      placeholder="Paste the company's job description, key responsibilities, and qualifications..."
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 p-2 text-xs text-slate-900 outline-none focus:border-sky-500 mt-1"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-gradient-to-r from-sky-600 to-cyan-500 py-2.5 text-xs font-bold text-white shadow-md hover:from-sky-500 hover:to-cyan-400 transition"
                  >
                    Set Target Requirements
                  </button>
                </form>
              )}
            </div>

            {/* ATS Pro Tips Widget */}
            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-indigo-50/50 via-sky-50/40 to-white p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-900">
                <Lightbulb className="h-4 w-4 text-indigo-600" /> ATS Resume Best Practices
              </div>
              <ul className="space-y-2 text-xs text-slate-700 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Single-column Layout:</strong> Multi-column layouts often fail automated ATS coordinate parsers.</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>XYZ Formula Bullets:</strong> "Accomplished [X] as measured by [Y] by doing [Z]."</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Standard Headers:</strong> Use standard terms like "Education", "Projects", and "Technical Skills".</span>
                </li>
              </ul>
            </div>

          </div>

          {/* Right Main Column: Active Resume Analyzer Component */}
          <div>
            <ResumeAnalyzerComponent
              key={activePlacementData.companyName + (selectedPlacement?.id || 'custom')}
              placement={{
                id: (selectedPlacement as any)?.id,
                companyName: activePlacementData.companyName,
                jobDescription: activePlacementData.jobDescription || activePlacementData.description || 'General engineering role',
                eligibility: activePlacementData.eligibility || 'Open to all students',
                skills: activePlacementData.skills || [],
                salary: activePlacementData.salary,
                location: activePlacementData.location,
                type: activePlacementData.type,
              }}
              showCompanyHeader={true}
            />
          </div>

        </div>

      </div>
    </div>
  );
};
