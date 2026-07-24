import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';

GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl as unknown as string;

export const extractTextFromResume = async (file: File): Promise<string> => {
  const name = file.name.toLowerCase();
  if (file.type === 'application/pdf' || name.endsWith('.pdf')) {
    const pdf = await getDocument({ data: await file.arrayBuffer() }).promise;
    let text = '';
    for (let idx = 1; idx <= pdf.numPages; idx += 1) {
      const page = await pdf.getPage(idx);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ') + '\n';
    }
    return text;
  }

  if (file.type.startsWith('text/') || name.endsWith('.txt')) {
    return await file.text();
  }

  throw new Error('Unsupported resume format. Please upload a PDF or plain text file.');
};

export const computeResumeInsight = (resumeText: string, placement: {
  companyName: string;
  jobDescription: string;
  eligibility: string;
  skills: string[];
}) => {
  const resume = resumeText.toLowerCase();
  const requiredSkills = placement.skills || [];
  const matchedSkills = requiredSkills.filter((skill) => resume.includes(skill.toLowerCase()));
  const missingSkills = requiredSkills.filter((skill) => !matchedSkills.includes(skill));

  const jobKeywords = [placement.companyName, placement.jobDescription, placement.eligibility]
    .join(' ')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .filter((word, index, arr) => word.length > 2 && arr.indexOf(word) === index);

  const matchedKeywords = jobKeywords.filter((keyword) => resume.includes(keyword));
  const keywordScore = Math.min(30, Math.round((matchedKeywords.length / Math.max(1, jobKeywords.length)) * 30));
  const skillScore = Math.min(40, Math.round((matchedSkills.length / Math.max(1, requiredSkills.length)) * 40));
  const baseScore = 50;
  const score = Math.min(100, baseScore + skillScore + keywordScore);

  const improvements = [];
  if (missingSkills.length > 0) {
    improvements.push(`Add or highlight these skills: ${missingSkills.slice(0, 4).join(', ')}.`);
  }
  if (matchedKeywords.length === 0) {
    improvements.push('Use keywords from the job description and eligibility text in your summary and experience sections.');
  }
  if (!resume.includes('project')) {
    improvements.push('Include a brief project or accomplishment section to demonstrate practical experience.');
  }
  if (improvements.length < 4) {
    improvements.push('Keep formatting simple and ATS-friendly with clear headings and bullet points.');
  }

  return {
    atsScore: score,
    summary: `Basic ATS scanning suggests your resume has ${matchedSkills.length} matching skill${matchedSkills.length === 1 ? '' : 's'} for this role.`,
    improvements: improvements.slice(0, 4),
    matchedSkills: matchedSkills.slice(0, 4),
    missingSkills: missingSkills.slice(0, 4),
  };
};
