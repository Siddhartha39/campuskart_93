import { computeResumeInsight } from './resumeUtils';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

export const isGeminiAvailable = Boolean(GEMINI_API_KEY);

export interface PlacementInsight {
  score: number;
  summary: string;
  improvements: string[];
  keywords: string[];
}

export interface CategorizedImprovements {
  keywords?: string[];
  experience?: string[];
  formatting?: string[];
  skills?: string[];
}

export interface ResumeInsight {
  atsScore: number;
  matchLevel?: 'High Match' | 'Good Match' | 'Moderate Match' | 'Needs Tailoring';
  summary: string;
  improvements: string[];
  matchedSkills: string[];
  missingSkills: string[];
  categorizedImprovements?: CategorizedImprovements;
  recommendedKeywords?: string[];
  bulletPointSuggestions?: string[];
}

const parseJsonResponse = (raw: string): any => {
  const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1));
    } catch {
      return null;
    }
  }
  return null;
};

const callGemini = async (prompt: string) => {
  const maxRetries = 3;
  const baseDelay = 800;

  if (!GEMINI_API_KEY) {
    console.warn('Gemini API key is missing; using intelligent fallback');
    return null;
  }

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, topP: 0.9 }
        })
      });

      if (!response.ok) {
        const isRateLimited = response.status === 429;
        const isServerError = response.status >= 500 && response.status < 600;
        if ((isRateLimited || isServerError) && attempt < maxRetries) {
          const delay = baseDelay * attempt;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new Error(`Gemini request failed: ${response.status}`);
      }

      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return parseJsonResponse(text);
    } catch (error) {
      if (attempt === maxRetries) {
        console.error('Gemini request failed after retries', error);
        return null;
      }
      const delay = baseDelay * attempt;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return null;
};

export const generatePlacementInsights = async (placement: {
  companyName: string;
  jobDescription: string;
  eligibility: string;
  skills: string[];
}): Promise<PlacementInsight> => {
  const prompt = `You are an ATS and campus hiring expert. Analyze this company opportunity and return strict JSON only.
{
  "score": 0-100,
  "summary": "short summary",
  "improvements": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}
Company: ${placement.companyName}
Role description: ${placement.jobDescription}
Eligibility: ${placement.eligibility}
Skills: ${placement.skills?.join(', ') || 'General Engineering'}`;

  const parsed = await callGemini(prompt);
  if (parsed) {
    return {
      score: Number(parsed.score ?? 78),
      summary: parsed.summary || 'Strong role with clear growth potential for relevant candidate profiles.',
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter(Boolean).slice(0, 4) : [
        'Highlight measurable impact in your resume.',
        'Add role-specific keywords from the description.',
        'Mention tools and projects matching the role.',
        'Tailor your summary to the eligibility and skills.'
      ],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.filter(Boolean).slice(0, 6) : (placement.skills || []).slice(0, 6)
    };
  }

  return {
    score: 76,
    summary: 'The role appears well aligned for candidates who can connect experience to the listed skills.',
    improvements: [
      'Mention your strongest matching tools and projects first.',
      'Quantify achievements with measurable outcomes.',
      'Mirror the role language in your summary and skills.',
      'Add keywords from the job description to improve ATS readability.'
    ],
    keywords: (placement.skills || []).slice(0, 6)
  };
};

export const analyzeResumeAgainstPlacement = async (payload: {
  resumeText: string;
  placement: {
    companyName: string;
    jobDescription: string;
    eligibility: string;
    skills: string[];
  };
}): Promise<ResumeInsight> => {
  const prompt = `You are a strict ATS (Applicant Tracking System) and campus recruiter evaluating a student's resume for a specific placement/internship opening.
Analyze how well the resume matches the company requirements and return strict JSON only:
{
  "atsScore": number (0-100),
  "matchLevel": "High Match" | "Good Match" | "Moderate Match" | "Needs Tailoring",
  "summary": "Detailed 2-3 sentence assessment of candidate fit for ${payload.placement.companyName}",
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["missingSkill1", "missingSkill2"],
  "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3", "Specific improvement 4"],
  "categorizedImprovements": {
    "keywords": ["Add keyword X to experience section", "Incorporate term Y"],
    "experience": ["Highlight project demonstrating Z", "Quantify metrics in bullet points"],
    "formatting": ["Ensure clear section headings for education and technical skills"],
    "skills": ["Emphasize proficiency in missing skill A"]
  },
  "recommendedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "bulletPointSuggestions": [
    "Suggested action bullet point rewrite tailored for ${payload.placement.companyName}",
    "Another strong impact bullet point using XYZ format"
  ]
}

Target Company: ${payload.placement.companyName}
Job Description: ${payload.placement.jobDescription}
Eligibility Criteria: ${payload.placement.eligibility}
Required Technical Skills: ${payload.placement.skills?.join(', ') || 'Not specified'}

Student Resume Content:
${payload.resumeText}`;

  const parsed = await callGemini(prompt);
  if (parsed) {
    const rawScore = Number(parsed.atsScore ?? 70);
    const score = Math.max(10, Math.min(100, isNaN(rawScore) ? 70 : rawScore));
    
    let matchLevel: 'High Match' | 'Good Match' | 'Moderate Match' | 'Needs Tailoring' = 'Moderate Match';
    if (score >= 80) matchLevel = 'High Match';
    else if (score >= 65) matchLevel = 'Good Match';
    else if (score >= 45) matchLevel = 'Moderate Match';
    else matchLevel = 'Needs Tailoring';

    return {
      atsScore: score,
      matchLevel: parsed.matchLevel || matchLevel,
      summary: parsed.summary || `Your resume shows foundational capability for ${payload.placement.companyName}, but requires tighter alignment with the listed technical requirements and metrics.`,
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter(Boolean).slice(0, 6) : [
        `Add role-specific keywords from ${payload.placement.companyName}'s description.`,
        'Quantify results with metrics, percentages, and outcomes.',
        'Reorder sections so your strongest technical projects appear first.',
        'Directly address the eligibility and core skill requirements in your project summaries.'
      ],
      matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills.filter(Boolean) : (payload.placement.skills || []).slice(0, 3),
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills.filter(Boolean) : [],
      categorizedImprovements: parsed.categorizedImprovements || {
        keywords: Array.isArray(parsed.recommendedKeywords) ? parsed.recommendedKeywords.slice(0, 3) : (payload.placement.skills || []).slice(0, 3),
        experience: ['Quantify project outcomes with measurable business or technical metrics.'],
        formatting: ['Keep layout single-column with standard ATS-recognized section headers.'],
        skills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills.slice(0, 3).map((s: string) => `Build or showcase a mini-project in ${s}`) : []
      },
      recommendedKeywords: Array.isArray(parsed.recommendedKeywords) ? parsed.recommendedKeywords.filter(Boolean) : (payload.placement.skills || []),
      bulletPointSuggestions: Array.isArray(parsed.bulletPointSuggestions) ? parsed.bulletPointSuggestions.filter(Boolean) : [
        `Engineered scalable features using ${(payload.placement.skills || ['modern technologies'])[0]}, improving user efficiency and latency.`,
        `Collaborated across teams to deliver robust project components meeting ${payload.placement.companyName} performance standards.`
      ]
    };
  }

  // If Gemini API is unreachable or not configured, compute enhanced heuristic insight
  return computeResumeInsight(payload.resumeText, payload.placement);
};
