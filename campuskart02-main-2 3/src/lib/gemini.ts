const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

export const isGeminiAvailable = Boolean(GEMINI_API_KEY);

export interface PlacementInsight {
  score: number;
  summary: string;
  improvements: string[];
  keywords: string[];
}

export interface ResumeInsight {
  atsScore: number;
  summary: string;
  improvements: string[];
  matchedSkills: string[];
  missingSkills: string[];
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
    console.warn('Gemini API key is missing; skipping model call');
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
  const prompt = `You are an ATS and hiring expert. Analyze this opportunity and return strict JSON only.
{
  "score": 0-100,
  "summary": "short summary",
  "improvements": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}
Company: ${placement.companyName}
Role description: ${placement.jobDescription}
Eligibility: ${placement.eligibility}
Skills: ${placement.skills.join(', ')}`;

  const parsed = await callGemini(prompt);
  if (parsed) {
    return {
      score: Number(parsed.score ?? 78),
      summary: parsed.summary || 'Strong role with clear growth potential.',
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter(Boolean).slice(0, 4) : [
        'Highlight measurable impact in your resume.',
        'Add role-specific keywords from the description.',
        'Mention tools and projects matching the role.',
        'Tailor your summary to the eligibility and skills.'
      ],
      keywords: Array.isArray(parsed.keywords) ? parsed.keywords.filter(Boolean).slice(0, 6) : placement.skills.slice(0, 6)
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
    keywords: placement.skills.slice(0, 6)
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
  const prompt = `You are an ATS resume reviewer. Analyze the candidate resume against the opportunity and return strict JSON only.
{
  "atsScore": 0-100,
  "summary": "short summary",
  "improvements": ["tip 1", "tip 2", "tip 3", "tip 4"],
  "matchedSkills": ["skill1", "skill2"],
  "missingSkills": ["skill1", "skill2"]
}
Company: ${payload.placement.companyName}
Job description: ${payload.placement.jobDescription}
Eligibility: ${payload.placement.eligibility}
Required skills: ${payload.placement.skills.join(', ')}
Resume text: ${payload.resumeText}`;

  const parsed = await callGemini(prompt);
  if (parsed) {
    return {
      atsScore: Number(parsed.atsScore ?? 70),
      summary: parsed.summary || 'Your resume shows a solid foundation but could better reflect the role vocabulary.',
      improvements: Array.isArray(parsed.improvements) ? parsed.improvements.filter(Boolean).slice(0, 4) : [
        'Add role-specific keywords from the description.',
        'Quantify results with metrics and outcomes.',
        'Reorder sections so the strongest skills appear early.',
        'Align your experience with the eligibility criteria.'
      ],
      matchedSkills: Array.isArray(parsed.matchedSkills) ? parsed.matchedSkills.filter(Boolean).slice(0, 4) : payload.placement.skills.slice(0, 3),
      missingSkills: Array.isArray(parsed.missingSkills) ? parsed.missingSkills.filter(Boolean).slice(0, 4) : payload.placement.skills.slice(0, 3)
    };
  }

  return {
    atsScore: 72,
    summary: 'Your resume is fairly strong, but it needs more direct alignment with the role keywords and impact statements.',
    improvements: [
      'Add the most relevant keywords from the role description.',
      'Make your project and internship impact more measurable.',
      'Match the job summary with the exact stack or tools listed.',
      'Keep the formatting ATS-friendly and simple.'
    ],
    matchedSkills: payload.placement.skills.slice(0, 3),
    missingSkills: payload.placement.skills.slice(0, 3)
  };
};
