import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { database } from '../../config/firebase';
import { ref, get, push } from 'firebase/database';
import { useAuth } from '../../contexts/AuthContext';
import { PlacementCompany } from '../../types';
import { ExternalLink, MapPin, Calendar, Star, CheckCircle2, FileText, Sparkles } from 'lucide-react';
import BackButton from '../common/BackButton';
import { ResumeAnalyzerComponent } from './ResumeAnalyzerComponent';

export const PlacementDetailsPage: React.FC = () => {
  const { placementId } = useParams<{ placementId: string }>();
  const { currentUser } = useAuth();
  const [placement, setPlacement] = useState<PlacementCompany | null>(null);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!placementId) return;
    const fetchPlacement = async () => {
      const dataSnap = await get(ref(database, `placements/${placementId}`));
      if (dataSnap.exists()) {
        const data = { id: placementId, ...dataSnap.val() } as PlacementCompany;
        setPlacement(data);

        // Remove AI insight display from placement details until API key integration is available.
      }
    };
    fetchPlacement();
  }, [placementId]);

  useEffect(() => {
    if (!currentUser || !placementId) return;
    const check = async () => {
      const appSnap = await get(ref(database, `placementApplications/${currentUser.uid}`));
      if (appSnap.exists()) {
        const apps = appSnap.val();
        setApplied(Object.values(apps).some((app: any) => app.placementId === placementId));
      }
    };
    check();
  }, [currentUser, placementId]);

  const handleApply = async () => {
    if (!currentUser || !placement) return;
    await push(ref(database, `placementApplications/${currentUser.uid}`), {
      userId: currentUser.uid,
      placementId: placement.id,
      companyName: placement.companyName,
      status: 'applied',
      appliedAt: new Date().toISOString(),
    });
    setApplied(true);
    const destination = placement.applyLink || placement.website;
    if (destination) {
      window.open(destination, '_blank', 'noopener,noreferrer');
    }
  };


  if (!placement) {
    return (
      <div className="min-h-screen bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-slate-600">Loading placement details…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.14),_transparent_32%),linear-gradient(180deg,_#eff6ff_0%,_#f8fbff_45%,_#ffffff_100%)] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton toHomeFallback="/placement" />
        <div className="mt-6 overflow-hidden rounded-[2rem] bg-white shadow-2xl ring-1 ring-slate-200/40">
          <div className="px-6 pb-8 pt-6">
            <div className="flex flex-col gap-6 rounded-3xl bg-slate-950/95 p-6 shadow-xl ring-1 ring-white/10 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-24 w-24 overflow-hidden rounded-3xl bg-slate-800 shadow-lg">
                  {placement.logoUrl ? (
                    <img src={placement.logoUrl} alt={placement.companyName} className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl font-bold text-slate-600">{placement.companyName.charAt(0)}</div>
                  )}
                </div>
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">{placement.type}</p>
                  <h1 className="mt-2 text-4xl font-semibold text-white">{placement.companyName}</h1>
                  <p className="mt-2 text-sm text-slate-300">{placement.location} • {placement.salary}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {(placement.applyLink || placement.website) && (
                  <a href={placement.applyLink || placement.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:border-sky-400 hover:bg-slate-800">
                    <ExternalLink className="h-4 w-4" />
                    {placement.applyLink ? 'Apply Now' : 'Company Site'}
                  </a>
                )}
                <button onClick={handleApply} disabled={applied || !currentUser} className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-300 ${applied ? 'bg-emerald-100 text-emerald-700' : 'bg-sky-600 text-white hover:bg-sky-700'}`}>
                  {applied ? 'Applied' : 'Apply Now'}
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-6">
                {/* Interactive AI Resume ATS Checker tailored for this company */}
                <section>
                  <ResumeAnalyzerComponent
                    placement={{
                      id: placement.id,
                      companyName: placement.companyName,
                      jobDescription: placement.jobDescription || placement.description,
                      eligibility: placement.eligibility,
                      skills: placement.skills || [],
                      salary: placement.salary,
                      location: placement.location,
                      type: placement.type,
                    }}
                    showCompanyHeader={false}
                  />
                </section>


                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900">About the Role</h2>
                  <p className="mt-3 text-slate-700 leading-7">{placement.jobDescription}</p>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900">Company Description</h2>
                  <p className="mt-3 text-slate-700 leading-7">{placement.description}</p>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <h2 className="text-xl font-semibold text-slate-900">Skills Required</h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.isArray(placement.skills) && placement.skills.length > 0 ? placement.skills.map((skill) => <span key={skill} className="rounded-full bg-sky-50 px-3 py-1 text-sm text-sky-700">{skill}</span>) : <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-500">No skills specified</span>}
                  </div>
                </section>
              </div>

              <aside className="space-y-6">
                <div className="rounded-3xl border border-gray-200 bg-white p-6">
                  <h3 className="text-lg font-semibold text-slate-900">Opportunity details</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-slate-400" /> {placement.location}</div>
                    <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-slate-400" /> Last date: {new Date(placement.lastDate).toLocaleDateString()}</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-slate-400" /> Hiring: {placement.isHiringOpen ? 'Open' : 'Closed'}</div>
                    <div className="flex items-center gap-2"><Star className="h-4 w-4 text-slate-400" /> Featured: {placement.isFeatured ? 'Yes' : 'No'}</div>
                  </div>
                </div>

                <div className="rounded-3xl border border-gray-200 bg-slate-50 p-6">
                  <h3 className="text-lg font-semibold text-slate-900">Eligibility</h3>
                  <p className="mt-3 text-slate-700 leading-7">{placement.eligibility}</p>
                </div>

              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
