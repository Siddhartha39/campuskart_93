import React from 'react';
import { Link } from 'react-router-dom';
import { Bookmark, Calendar, FileText, MapPin, Sparkles, FileCheck } from 'lucide-react';
import { PlacementCompany } from '../../types';

interface PlacementCardProps {
  placement: PlacementCompany;
  atsScore?: number;
  isBookmarked: boolean;
  hasApplied: boolean;
  onViewDetails: () => void;
  onApply: () => void;
  onToggleBookmark: () => void;
}

export const PlacementCard: React.FC<PlacementCardProps> = ({
  placement,
  atsScore,
  isBookmarked,
  hasApplied,
  onViewDetails,
  onApply,
  onToggleBookmark,
}) => {
  const skillSummary = Array.isArray(placement.skills) ? placement.skills.slice(0, 3).join(', ') : 'No skills specified';

  return (
    <div className="rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 shadow-2xl shadow-sky-950/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-sky-600/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-sky-700 text-white shadow-inner shadow-sky-500/20">
            {placement.logoUrl ? (
              <img src={placement.logoUrl} alt={placement.companyName} className="h-full w-full object-contain rounded-3xl" />
            ) : (
              <span className="text-xl font-semibold">{placement.companyName.charAt(0)}</span>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
              <span className="rounded-full bg-sky-700/10 px-3 py-1 text-sky-200">{placement.type}</span>
              {placement.isFeatured && <span className="rounded-full bg-violet-700/10 px-3 py-1 text-violet-200">Featured</span>}
              {!placement.isHiringOpen && <span className="rounded-full bg-rose-700/10 px-3 py-1 text-rose-200">Closed</span>}
              {placement.isHiringOpen && <span className="rounded-full bg-emerald-700/10 px-3 py-1 text-emerald-200">Hiring</span>}
            </div>
            <h3 className="mt-2 text-xl font-semibold text-white">{placement.companyName}</h3>
            <p className="mt-1 text-sm text-slate-300 line-clamp-2">{placement.description}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3">
          {typeof atsScore === 'number' ? (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-2 text-sm font-semibold text-emerald-200 ring-1 ring-emerald-500/20">
              <FileText className="h-4 w-4" />
              ATS {atsScore}/100
            </span>
          ) : (
            <span className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-2 text-sm font-semibold text-slate-200 ring-1 ring-slate-500/10">
              <FileText className="h-4 w-4" />
              Resume checker available
            </span>
          )}
          <button
            onClick={onToggleBookmark}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition duration-300 ${
              isBookmarked ? 'bg-sky-700 text-white shadow-lg shadow-sky-700/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Bookmark className="h-4 w-4" />
            {isBookmarked ? 'Saved' : 'Bookmark'}
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-200 ring-1 ring-sky-500/10 shadow-sm">
          <div className="font-medium text-sky-200">Package / Stipend</div>
          <div className="mt-1 text-white">{placement.salary}</div>
        </div>
        <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-200 ring-1 ring-sky-500/10 shadow-sm">
          <div className="font-medium text-sky-200">Location</div>
          <div className="mt-1 text-white">{placement.location}</div>
        </div>
        <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-200 ring-1 ring-sky-500/10 shadow-sm">
          <div className="font-medium text-sky-200">Eligibility</div>
          <div className="mt-1 line-clamp-2 text-white">{placement.eligibility}</div>
        </div>
        <div className="rounded-3xl bg-slate-900/80 p-4 text-sm text-slate-200 ring-1 ring-sky-500/10 shadow-sm">
          <div className="font-medium text-sky-200">Last Date</div>
          <div className="mt-1 text-white">{new Date(placement.lastDate).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-2 text-sky-200">
            <MapPin className="h-4 w-4" />
            {placement.location}
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-2 text-sky-200">
            <Calendar className="h-4 w-4" />
            {new Date(placement.lastDate).toLocaleDateString()}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to={`/resume-analyzer?placementId=${placement.id}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/40 bg-sky-500/10 px-3.5 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-500/20 hover:text-white transition"
          >
            <FileCheck className="h-3.5 w-3.5" /> Check Resume Match
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApply();
            }}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition duration-300 ${
              hasApplied ? 'bg-emerald-100 text-emerald-700' : 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white hover:from-sky-500 hover:to-cyan-400'
            }`}
          >
            {hasApplied ? 'Applied' : 'Apply'}
          </button>
          <button
            onClick={onViewDetails}
            className="rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-sm font-semibold text-slate-200 transition duration-300 hover:-translate-y-0.5 hover:border-cyan-500 hover:text-white hover:bg-slate-900"
          >
            View Details
          </button>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
        <Sparkles className="h-4 w-4 text-sky-500" />
        <span>{skillSummary}{Array.isArray(placement.skills) && placement.skills.length > 3 ? ', ...' : ''}</span>
      </div>
    </div>
  );
};
