import React, { useState, useRef } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  RefreshCw, 
  TrendingUp, 
  Award, 
  ArrowRight, 
  Copy, 
  Check, 
  ChevronRight, 
  Briefcase, 
  FileCheck,
  AlertTriangle,
  Code,
  BookOpen
} from 'lucide-react';
import { extractTextFromResume } from '../../lib/resumeUtils';
import { analyzeResumeAgainstPlacement, ResumeInsight, isGeminiAvailable } from '../../lib/gemini';

export interface ResumeAnalyzerComponentProps {
  placement: {
    id?: string;
    companyName: string;
    jobDescription: string;
    eligibility: string;
    skills: string[];
    salary?: string;
    location?: string;
    type?: string;
  };
  onSwitchCompany?: () => void;
  showCompanyHeader?: boolean;
}

export const ResumeAnalyzerComponent: React.FC<ResumeAnalyzerComponentProps> = ({
  placement,
  onSwitchCompany,
  showCompanyHeader = true,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [isInputTextMode, setIsInputTextMode] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [insight, setInsight] = useState<ResumeInsight | null>(null);
  const [error, setError] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'improvements' | 'preview'>('overview');
  const [copiedBulletIndex, setCopiedBulletIndex] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (selectedFile: File) => {
    setError('');
    setFile(selectedFile);
    setAnalyzing(true);
    setInsight(null);

    try {
      setAnalysisStep('Extracting selectable text from resume...');
      const extractedText = await extractTextFromResume(selectedFile);
      setRawText(extractedText);

      setAnalysisStep(`Analyzing fit against ${placement.companyName} requirements with AI...`);
      const result = await analyzeResumeAgainstPlacement({
        resumeText: extractedText,
        placement: {
          companyName: placement.companyName,
          jobDescription: placement.jobDescription,
          eligibility: placement.eligibility,
          skills: placement.skills || [],
        },
      });

      setInsight(result);
      setActiveTab('overview');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err?.message || 'Failed to analyze resume. Please try another file or paste plain text.');
    } finally {
      setAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleAnalyzeRawText = async () => {
    if (!rawText.trim() || rawText.trim().length < 30) {
      setError('Please enter at least 30 characters of resume content.');
      return;
    }

    setError('');
    setAnalyzing(true);
    setInsight(null);

    try {
      setAnalysisStep(`Evaluating keywords & requirements for ${placement.companyName}...`);
      const result = await analyzeResumeAgainstPlacement({
        resumeText: rawText,
        placement: {
          companyName: placement.companyName,
          jobDescription: placement.jobDescription,
          eligibility: placement.eligibility,
          skills: placement.skills || [],
        },
      });

      setInsight(result);
      setActiveTab('overview');
    } catch (err: any) {
      setError(err?.message || 'Failed to analyze text content.');
    } finally {
      setAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const loadSampleResume = () => {
    const sample = `John Doe | Computer Science & Engineering (B.Tech 2026) | CGPA: 8.9/10
Email: john.doe@campus.edu | GitHub: github.com/johndoe | LinkedIn: linkedin.com/in/johndoe

TECHNICAL SKILLS:
- Languages: JavaScript, TypeScript, Python, C++, SQL
- Frameworks & Web: React, Node.js, Express, Tailwind CSS, REST APIs
- Databases & Cloud: PostgreSQL, MongoDB, Firebase, Git, Docker

PROJECTS:
1. Campus Marketplace Platform (Full Stack Web App)
   - Built an end-to-end e-commerce platform using React, TypeScript, and Firebase.
   - Implemented real-time chat, product search with indexing, and secure authentication for 1,200+ campus students.
   - Reduced database latency by 35% by optimizing state management and queries.

2. Automated Job Tracker & Placement Portal
   - Developed a responsive web application tracking 50+ company recruitment drives with automated reminders.
   - Integrated AI-based summary generation processing job listings into structured interview cards.

EDUCATION:
- B.Tech in Computer Science, University Institute of Technology (2022 - 2026) | CGPA: 8.9`;

    setRawText(sample);
    setIsInputTextMode(true);
  };

  const handleCopyBullet = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedBulletIndex(idx);
    setTimeout(() => setCopiedBulletIndex(null), 2000);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-500', text: 'text-emerald-600', ring: 'ring-emerald-500/30', border: 'border-emerald-200', gradient: 'from-emerald-500 to-teal-600' };
    if (score >= 65) return { bg: 'bg-cyan-500', text: 'text-cyan-600', ring: 'ring-cyan-500/30', border: 'border-cyan-200', gradient: 'from-cyan-500 to-blue-600' };
    if (score >= 45) return { bg: 'bg-amber-500', text: 'text-amber-600', ring: 'ring-amber-500/30', border: 'border-amber-200', gradient: 'from-amber-500 to-orange-600' };
    return { bg: 'bg-rose-500', text: 'text-rose-600', ring: 'ring-rose-500/30', border: 'border-rose-200', gradient: 'from-rose-500 to-red-600' };
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden transition-all duration-300">
      {/* Header Banner */}
      {showCompanyHeader && (
        <div className="border-b border-slate-800 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6 text-white sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-cyan-400 text-slate-950 font-bold shadow-lg shadow-sky-500/20">
              <Briefcase className="h-7 w-7 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-widest text-cyan-300 font-semibold">Target Company Requirements</span>
                {isGeminiAvailable && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-medium text-sky-300 ring-1 ring-sky-400/30">
                    <Sparkles className="h-3 w-3" /> Gemini 2.0 AI
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mt-1">{placement.companyName}</h2>
              <p className="text-xs text-slate-300 mt-0.5">{placement.type || 'Placement'} • {placement.location || 'Campus Drive'} • {placement.salary || 'Competitive'}</p>
            </div>
          </div>

          {onSwitchCompany && (
            <button
              onClick={onSwitchCompany}
              className="mt-4 sm:mt-0 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/90 px-4 py-2 text-xs font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-white"
            >
              Switch Company <ChevronRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="p-6 sm:p-8 space-y-6">
        {/* Upload / Input View */}
        {!insight && !analyzing && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Upload Your Resume for ATS Analysis</h3>
                <p className="text-sm text-slate-500">Compare your resume directly against <span className="font-semibold text-sky-600">{placement.companyName}</span> requirements to get an ATS score and improvement checklist.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInputTextMode(!isInputTextMode)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
                >
                  {isInputTextMode ? 'Switch to PDF Upload' : 'Paste Plain Text'}
                </button>
                <button
                  type="button"
                  onClick={loadSampleResume}
                  className="rounded-full border border-sky-200 bg-sky-50 px-3.5 py-1.5 text-xs font-medium text-sky-700 hover:bg-sky-100"
                >
                  Try Sample Resume
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Analysis Notice</p>
                  <p className="mt-1 text-rose-700">{error}</p>
                </div>
              </div>
            )}

            {!isInputTextMode ? (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                className={`relative flex flex-col items-center justify-center rounded-3xl border-2 border-dashed p-10 text-center transition duration-300 ${
                  dragOver ? 'border-sky-500 bg-sky-50/60 ring-4 ring-sky-100' : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-sky-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />

                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 mb-4 shadow-sm">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <h4 className="text-base font-semibold text-slate-900">Drag & drop your Resume PDF here</h4>
                <p className="mt-1.5 text-xs text-slate-500 max-w-sm">Supports PDF (.pdf) or Text (.txt). All parsing runs securely in your browser.</p>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-600 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:from-sky-500 hover:to-cyan-400"
                >
                  <FileText className="h-4 w-4" /> Browse Files
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder="Paste your full resume text here (Skills, Projects, Education, Work Experience)..."
                  rows={8}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs sm:text-sm font-mono text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAnalyzeRawText}
                    className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-sky-700"
                  >
                    <Sparkles className="h-4 w-4" /> Analyze Resume Text
                  </button>
                </div>
              </div>
            )}

            {/* Target Job Requirements Preview */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
                <Code className="h-4 w-4 text-sky-600" /> Target Skills Required by {placement.companyName}
              </div>
              <div className="flex flex-wrap gap-2">
                {Array.isArray(placement.skills) && placement.skills.length > 0 ? (
                  placement.skills.map((skill, idx) => (
                    <span key={idx} className="rounded-full border border-sky-200 bg-white px-3 py-1 text-xs font-semibold text-sky-800 shadow-sm">
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">General Technical & Analytical Skills</span>
                )}
              </div>
              {placement.eligibility && (
                <div className="text-xs text-slate-600 mt-2 border-t border-slate-200/60 pt-2">
                  <span className="font-semibold text-slate-800">Eligibility:</span> {placement.eligibility}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading / Scanning state */}
        {analyzing && (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-5">
            <div className="relative flex h-20 w-20 items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-sky-200 border-t-sky-600 animate-spin" />
              <Sparkles className="h-8 w-8 text-sky-600 animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">AI ATS Scanning in Progress</h3>
              <p className="text-sm text-slate-600 mt-1 font-medium">{analysisStep || 'Parsing content and calculating score...'}</p>
            </div>
            <div className="w-full max-w-md rounded-full bg-slate-100 h-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 animate-pulse w-3/4 rounded-full" />
            </div>
          </div>
        )}

        {/* Results View */}
        {insight && !analyzing && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Score Banner */}
            <div className="grid gap-6 md:grid-cols-[200px_1fr] items-center rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-sky-50/40 p-6 shadow-sm">
              {/* Circular score gauge */}
              <div className="flex flex-col items-center justify-center">
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white shadow-inner ring-4 ring-slate-100">
                  <div className={`text-center`}>
                    <span className={`text-4xl font-extrabold ${getScoreColor(insight.atsScore).text}`}>
                      {insight.atsScore}
                    </span>
                    <span className="text-xs font-bold text-slate-400 block -mt-1">/ 100</span>
                  </div>
                </div>
                <span className={`mt-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white ${getScoreColor(insight.atsScore).bg}`}>
                  <Award className="h-3 w-3" /> {insight.matchLevel || `${insight.atsScore}% Match`}
                </span>
              </div>

              {/* Summary and quick badges */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    ATS Match Analysis for {placement.companyName}
                  </h3>
                  <button
                    onClick={() => {
                      setInsight(null);
                      setFile(null);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" /> Re-scan Another
                  </button>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed bg-white/80 p-3.5 rounded-2xl border border-slate-200/70 shadow-xs">
                  {insight.summary}
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> {insight.matchedSkills?.length || 0} Matched Requirements
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 border border-amber-200">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600" /> {insight.missingSkills?.length || 0} Skills to Add
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800 border border-sky-200">
                    <TrendingUp className="h-3.5 w-3.5 text-sky-600" /> {insight.improvements?.length || 0} Actionable Fixes
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 gap-2 overflow-x-auto">
              {[
                { id: 'overview', label: 'Overview & Strengths', icon: Award },
                { id: 'skills', label: 'Skill Gap Matrix', icon: Code },
                { id: 'improvements', label: 'Company-Specific Fixes', icon: TrendingUp },
                { id: 'preview', label: 'Extracted Resume', icon: FileCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center gap-2 border-b-2 px-4 py-3 text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                      active ? 'border-sky-600 text-sky-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Contents */}
            {activeTab === 'overview' && (
              <div className="grid gap-6 md:grid-cols-2">
                {/* Core Strengths */}
                <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <CheckCircle2 className="h-5 w-5" /> Verified Matching Strengths
                  </div>
                  {insight.matchedSkills && insight.matchedSkills.length > 0 ? (
                    <div className="space-y-2">
                      {insight.matchedSkills.map((skill, idx) => (
                        <div key={idx} className="flex items-center gap-2 rounded-2xl bg-white p-3 border border-emerald-100 shadow-xs text-xs font-semibold text-slate-800">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-xs shrink-0">✓</span>
                          <span>Found keyword: <strong className="text-emerald-700">{skill}</strong></span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500">No direct keyword overlap was detected with the core skills. See the improvements tab to add critical terms.</p>
                  )}
                </div>

                {/* Priority Improvements */}
                <div className="rounded-3xl border border-slate-200 bg-slate-50/60 p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sky-700 font-bold text-sm">
                    <Sparkles className="h-5 w-5" /> Key Action Items for {placement.companyName}
                  </div>
                  <div className="space-y-2">
                    {(insight.improvements || []).slice(0, 4).map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 rounded-2xl bg-white p-3 border border-sky-100 shadow-xs text-xs text-slate-700">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-sky-700 text-xs font-bold shrink-0 mt-0.5">{idx + 1}</span>
                        <span className="leading-relaxed">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'skills' && (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Matched Skills */}
                  <div className="rounded-3xl border border-emerald-200 bg-emerald-50/40 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-emerald-800 text-sm">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600" /> Matched Skills & Keywords
                      </div>
                      <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                        {insight.matchedSkills?.length || 0} Found
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {insight.matchedSkills && insight.matchedSkills.length > 0 ? (
                        insight.matchedSkills.map((skill, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-emerald-700 border border-emerald-200 shadow-xs">
                            <Check className="h-3.5 w-3.5 text-emerald-600" /> {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">None detected yet.</p>
                      )}
                    </div>
                  </div>

                  {/* Missing Skills */}
                  <div className="rounded-3xl border border-amber-200 bg-amber-50/40 p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
                        <AlertTriangle className="h-5 w-5 text-amber-600" /> Missing / In-Demand Requirements
                      </div>
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800">
                        {insight.missingSkills?.length || 0} Gaps
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {insight.missingSkills && insight.missingSkills.length > 0 ? (
                        insight.missingSkills.map((skill, idx) => (
                          <span key={idx} className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold text-amber-700 border border-amber-200 shadow-xs">
                            + {skill}
                          </span>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">Great job! You have captured the required skills.</p>
                      )}
                    </div>
                    <p className="text-xs text-amber-800/80 leading-relaxed">
                      💡 <strong>Recruiter Tip:</strong> If you have hands-on experience with any of the missing skills from college labs or personal projects, add them directly to your Skills list!
                    </p>
                  </div>
                </div>

                {/* Recommended Keywords Cloud */}
                {insight.recommendedKeywords && insight.recommendedKeywords.length > 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-sky-600" /> High-Impact Keywords to sprinkle throughout your resume:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {insight.recommendedKeywords.map((kw, idx) => (
                        <span key={idx} className="rounded-xl border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-xs">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'improvements' && (
              <div className="space-y-6">
                {/* Categorized Improvements */}
                {insight.categorizedImprovements && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {insight.categorizedImprovements.keywords && insight.categorizedImprovements.keywords.length > 0 && (
                      <div className="rounded-2xl border border-sky-200 bg-sky-50/50 p-4 space-y-2">
                        <p className="text-xs font-bold text-sky-800 uppercase tracking-wider flex items-center gap-1.5">
                          🎯 Keywords & Terminology
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                          {insight.categorizedImprovements.keywords.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    {insight.categorizedImprovements.experience && insight.categorizedImprovements.experience.length > 0 && (
                      <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 space-y-2">
                        <p className="text-xs font-bold text-indigo-800 uppercase tracking-wider flex items-center gap-1.5">
                          📈 Experience & Metrics
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                          {insight.categorizedImprovements.experience.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    {insight.categorizedImprovements.formatting && insight.categorizedImprovements.formatting.length > 0 && (
                      <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-4 space-y-2">
                        <p className="text-xs font-bold text-purple-800 uppercase tracking-wider flex items-center gap-1.5">
                          📑 ATS Formatting & Layout
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                          {insight.categorizedImprovements.formatting.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}

                    {insight.categorizedImprovements.skills && insight.categorizedImprovements.skills.length > 0 && (
                      <div className="rounded-2xl border border-teal-200 bg-teal-50/50 p-4 space-y-2">
                        <p className="text-xs font-bold text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                          🛠️ Technical Competency Gaps
                        </p>
                        <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                          {insight.categorizedImprovements.skills.map((item, i) => <li key={i}>{item}</li>)}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* AI Tailored Bullet Point Rewrites */}
                {insight.bulletPointSuggestions && insight.bulletPointSuggestions.length > 0 && (
                  <div className="rounded-3xl border border-slate-200 bg-slate-950 p-6 text-white space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">Tailored Action Bullets</span>
                        <h4 className="text-base font-bold text-white mt-0.5">Sample High-Impact Bullet Points for {placement.companyName}</h4>
                      </div>
                      <span className="text-xs text-slate-400">Click to copy</span>
                    </div>

                    <div className="space-y-3">
                      {insight.bulletPointSuggestions.map((bullet, idx) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between gap-4 rounded-2xl bg-slate-900 p-4 border border-slate-800 hover:border-slate-700 transition"
                        >
                          <p className="text-xs text-slate-200 leading-relaxed font-sans">
                            • {bullet}
                          </p>
                          <button
                            type="button"
                            onClick={() => handleCopyBullet(bullet, idx)}
                            className="inline-flex items-center gap-1 rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-700 shrink-0"
                          >
                            {copiedBulletIndex === idx ? (
                              <>
                                <Check className="h-3.5 w-3.5 text-emerald-400" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="h-3.5 w-3.5" /> Copy
                              </>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'preview' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Extracted Resume Content</span>
                  <span className="text-xs text-slate-400">{rawText.length} characters</span>
                </div>
                <div className="max-h-96 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {rawText}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
