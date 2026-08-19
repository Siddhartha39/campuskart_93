import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type { ResumeInsight } from './gemini';

// Set worker path
try {
  GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl as unknown as string;
} catch (e) {
  console.warn('Unable to set PDF.js workerSrc URL, using default', e);
}

export const extractTextFromResume = async (file: File): Promise<string> => {
  const name = file.name.toLowerCase();
  
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let idx = 1; idx <= pdf.numPages; idx += 1) {
        const page = await pdf.getPage(idx);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => ('str' in item ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n\n';
      }
      
      const cleaned = fullText.replace(/\s+/g, ' ').trim();
      if (!cleaned || cleaned.length < 30) {
        throw new Error('PDF appears to be scanned or empty. Please ensure your PDF contains selectable text, or paste your resume content directly.');
      }
      return cleaned;
    } catch (err: any) {
      if (err.message && err.message.includes('selectable text')) {
        throw err;
      }
      console.error('PDF parsing error:', err);
      throw new Error(`Failed to extract text from PDF (${err.message || 'unknown error'}). You can paste your resume text manually.`);
    }
  }

  if (file.type.startsWith('text/') || name.endsWith('.txt') || name.endsWith('.md')) {
    return await file.text();
  }

  throw new Error('Unsupported resume format. Please upload a PDF (.pdf) or text (.txt) file.');
};

export const computeResumeInsight = (
  resumeText: string,
  placement: {
    companyName: string;
    jobDescription: string;
    eligibility: string;
    skills: string[];
  }
): ResumeInsight => {
  const resume = resumeText.toLowerCase();
  const requiredSkills = (placement.skills || []).map((s) => s.trim()).filter(Boolean);

  // Skill matching
  const matchedSkills = requiredSkills.filter((skill) => {
    const s = skill.toLowerCase();
    return resume.includes(s) || (s === 'react' && resume.includes('reactjs')) || (s === 'node' && resume.includes('nodejs'));
  });

  const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));

  // Extract company & role keywords
  const fullSpecText = [placement.companyName, placement.jobDescription, placement.eligibility, ...requiredSkills]
    .join(' ')
    .toLowerCase();

  const stopWords = new Set([
    'and', 'the', 'for', 'with', 'you', 'are', 'this', 'that', 'from', 'have', 'will', 'must',
    'should', 'about', 'role', 'team', 'work', 'good', 'year', 'years', 'plus', 'preferred',
    'seeking', 'looking', 'hiring', 'opportunity', 'company', 'candidate', 'strong', 'ability', 'skills'
  ]);

  const rawKeywords = fullSpecText
    .split(/[^a-z0-9+#]+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  const uniqueJobKeywords = Array.from(new Set(rawKeywords));

  const matchedKeywords = uniqueJobKeywords.filter((kw) => resume.includes(kw));
  const missingKeywords = uniqueJobKeywords.filter((kw) => !matchedKeywords.includes(kw)).slice(0, 8);

  // Structural and content checks
  const hasProjects = resume.includes('project') || resume.includes('github') || resume.includes('built');
  const hasExperience = resume.includes('experience') || resume.includes('intern') || resume.includes('developed');
  const hasEducation = resume.includes('education') || resume.includes('b.tech') || resume.includes('degree') || resume.includes('cgpa');
  const hasMetrics = /\b\d+%\b|\b\d+x\b|\b\d+\s*(users|clients|requests|ms|stars|downloads|latency)\b/i.test(resume);

  // Calculate scores
  const skillMatchRatio = requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) : 0.8;
  const keywordMatchRatio = uniqueJobKeywords.length > 0 ? (matchedKeywords.length / uniqueJobKeywords.length) : 0.7;

  let score = Math.round(
    35 * skillMatchRatio +
    25 * Math.min(1, keywordMatchRatio * 1.8) +
    15 * (hasProjects ? 1 : 0.3) +
    10 * (hasExperience ? 1 : 0.4) +
    10 * (hasEducation ? 1 : 0.5) +
    5 * (hasMetrics ? 1 : 0)
  );

  score = Math.max(25, Math.min(96, score));

  let matchLevel: 'High Match' | 'Good Match' | 'Moderate Match' | 'Needs Tailoring' = 'Moderate Match';
  if (score >= 80) matchLevel = 'High Match';
  else if (score >= 65) matchLevel = 'Good Match';
  else if (score >= 45) matchLevel = 'Moderate Match';
  else matchLevel = 'Needs Tailoring';

  const generalImprovements: string[] = [];
  const keywordImprovements: string[] = [];
  const experienceImprovements: string[] = [];
  const formattingImprovements: string[] = [];
  const skillImprovements: string[] = [];

  if (missingSkills.length > 0) {
    const topMissing = missingSkills.slice(0, 3).join(', ');
    const tip = `Incorporate missing core skill requirements: ${topMissing}.`;
    generalImprovements.push(tip);
    skillImprovements.push(tip);
  }

  if (missingKeywords.length > 0) {
    const kwTip = `Add high-impact keywords from ${placement.companyName}'s role spec (e.g. ${missingKeywords.slice(0, 4).join(', ')}).`;
    generalImprovements.push(kwTip);
    keywordImprovements.push(kwTip);
  }

  if (!hasMetrics) {
    const metricTip = 'Quantify your accomplishments with measurable metrics (e.g., "boosted query speed by 35%", "handled 10k+ requests").';
    generalImprovements.push(metricTip);
    experienceImprovements.push(metricTip);
  }

  if (!hasProjects) {
    const projTip = `Feature 2-3 prominent projects demonstrating ${requiredSkills[0] || 'core engineering'} skills.`;
    generalImprovements.push(projTip);
    experienceImprovements.push(projTip);
  }

  formattingImprovements.push('Use clear standard ATS section headers: Education, Experience, Projects, Technical Skills.');
  formattingImprovements.push('Maintain clean single-column formatting without tables, textboxes, or multi-column grids.');

  if (generalImprovements.length < 4) {
    generalImprovements.push('Tailor your opening summary to explicitly mention the target position at ' + placement.companyName + '.');
  }

  const primarySkill = requiredSkills[0] || 'modern tech stacks';
  const secondarySkill = requiredSkills[1] || 'backend and frontend architectures';

  const bulletPointSuggestions = [
    `Developed and deployed robust features using ${primarySkill}, improving processing efficiency and user engagement for high-traffic workflows.`,
    `Architected full-stack modules integrating ${secondarySkill}, reducing system response times and aligning with ${placement.companyName}'s engineering standards.`,
    `Collaborated with cross-functional peers to test and ship production-ready features, adhering to clean-code and CI/CD best practices.`
  ];

  return {
    atsScore: score,
    matchLevel,
    summary: `Your resume demonstrates a ${score >= 70 ? 'strong' : 'fair'} foundation for ${placement.companyName}. Incorporating the highlighted missing keywords and technical proficiencies will significantly boost your ATS interview callback rate.`,
    matchedSkills: matchedSkills.slice(0, 8),
    missingSkills: missingSkills.slice(0, 8),
    improvements: generalImprovements.slice(0, 5),
    categorizedImprovements: {
      keywords: keywordImprovements.length ? keywordImprovements : [`Include terminology from ${placement.companyName}'s job description.`],
      experience: experienceImprovements.length ? experienceImprovements : ['Highlight relevant internships and practical capstone projects.'],
      formatting: formattingImprovements,
      skills: skillImprovements.length ? skillImprovements : ['Highlight proficiency levels in all listed technical skills.']
    },
    recommendedKeywords: missingKeywords.length > 0 ? missingKeywords : uniqueJobKeywords.slice(0, 6),
    bulletPointSuggestions
  };
};
