import React, { useState } from 'react';
import { X, ImagePlus, Lock, CheckSquare } from 'lucide-react';
import { Poll, Whisper } from '../../types/whisper';
import { uploadSupabaseFile, SUPABASE_BUCKETS, sanitizeFileName } from '../../config/supabase';

interface CreateWhisperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    category: string;
    message: string;
    imageUrl?: string;
    imageUrls?: string[];
    allowComments: boolean;
    anonymous: boolean;
    isOpenChat?: boolean;
    poll?: Poll;
  }) => Promise<void>;
  editingWhisper?: {
    id: string;
    category: string;
    message: string;
    imageUrl?: string;
    imageUrls?: string[];
    anonymous: boolean;
    poll?: Poll;
  } | null;
  isOpenChatMode?: boolean;
}

const categories = ['Latest', 'Trending', 'Study', 'Placement', 'Confession', 'Fun', 'Hostel', 'Events', 'Questions'];

export const CreateWhisperModal: React.FC<CreateWhisperModalProps> = ({ isOpen, onClose, onSubmit, editingWhisper, isOpenChatMode }) => {
  const [category, setCategory] = useState('Fun');
  const [message, setMessage] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [pollEnabled, setPollEnabled] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  const [submitError, setSubmitError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    if (editingWhisper) {
      setCategory(editingWhisper.category || 'Fun');
      setMessage(editingWhisper.message || '');
      setAnonymous(editingWhisper.anonymous ?? false);
      setPollEnabled(!!editingWhisper.poll);
      setPollQuestion(editingWhisper.poll?.question || '');
      setPollOptions(editingWhisper.poll?.options.map((option) => option.label) || ['', '']);
      setImageUrls(editingWhisper.imageUrls || (editingWhisper.imageUrl ? [editingWhisper.imageUrl] : []));
    } else {
      setCategory('Fun');
      setMessage('');
      setAnonymous(false);
      setPollEnabled(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setImageUrls([]);
    }
  }, [editingWhisper]);

  const handleSubmit = async () => {
    setSubmitError('');
    const validOptions = pollOptions.map((opt) => opt.trim()).filter(Boolean);

    if (!pollEnabled && imageUrls.length === 0 && !message.trim()) {
      setSubmitError('Please add some content or an image for your whisper.');
      return;
    }
    if (pollEnabled && (!pollQuestion.trim() || validOptions.length < 2)) {
      setSubmitError('Polls require a question and at least two options.');
      return;
    }

    let poll;
    if (pollEnabled) {
      poll = {
        id: `poll-${Date.now()}`,
        question: pollQuestion.trim(),
        options: validOptions.map((label, index) => ({ id: `option-${index}-${Date.now()}`, label, count: 0 })),
        createdAt: new Date().toISOString(),
        totalVotes: 0,
        hasVoted: false,
        isClosed: false,
      };
      poll = {
        id: `poll-${Date.now()}`,
        question: pollQuestion.trim(),
        options: validOptions.map((label, index) => ({ id: `option-${index}-${Date.now()}`, label, count: 0 })),
        createdAt: new Date().toISOString(),
        totalVotes: 0,
        hasVoted: false,
        isClosed: false,
      };
    }

    setSubmitting(true);

    try {
      await onSubmit({ 
        category, 
        message,
        anonymous, 
        imageUrl: imageUrls[0],
        imageUrls,
        allowComments: true,
        isOpenChat: isOpenChatMode,
        poll,
      });
      setMessage('');
      setAnonymous(false);
      setPollEnabled(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setImageUrls([]);
      setFiles([]);
      onClose();
    } catch (error: any) {
      setSubmitError(error?.message || 'Failed to post whisper. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFiles = async (selectedFiles: FileList | null) => {
    if (!selectedFiles || selectedFiles.length === 0) return;

    const incomingFiles = Array.from(selectedFiles).slice(0, 4);
    setFiles((prev) => [...prev, ...incomingFiles]);
    setUploading(true);
    setUploadError('');

    try {
      const uploaded: string[] = [];
      for (const file of incomingFiles) {
        const fileName = `whispers/${Date.now()}-${sanitizeFileName(file.name)}`;
        const url = await uploadSupabaseFile(SUPABASE_BUCKETS.whispers, fileName, file);
        uploaded.push(url);
      }
      setImageUrls((prev) => [...prev, ...uploaded]);
    } catch (e: any) {
      console.error('Whisper image upload failed:', e);
      setUploadError(e?.message || 'Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40 max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-violet-300">New Whisper</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Share something anonymously.</h2>
          </div>
          <button onClick={onClose} className="rounded-full border border-white/10 bg-white/5 p-3 text-slate-300 hover:bg-white/10 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-6 space-y-5">
          <div>
            <label className="text-sm font-medium text-slate-300">Subreddit (Category)</label>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="mt-2 w-full rounded border border-white/10 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none"
            >
              {categories.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300">Content</label>
            <textarea rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Share your post..." className="mt-2 w-full rounded border border-white/10 bg-slate-950/80 px-3 py-3 text-slate-100 outline-none resize-none" />
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-3 text-sm text-slate-200">
                <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="h-4 w-4" />
                Post anonymously
              </label>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-4">
              <label className="inline-flex items-center gap-3 text-sm text-slate-200">
                <input type="checkbox" checked={pollEnabled} onChange={(event) => setPollEnabled(event.target.checked)} className="h-4 w-4" />
                Add a poll to this whisper
              </label>
              {pollEnabled && (
                <div className="mt-4 space-y-4">
                  <div>
                    <label className="text-sm font-medium text-slate-300">Poll question</label>
                    <input
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Ask your question here"
                      className="mt-2 w-full rounded border border-white/10 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none"
                    />
                  </div>
                  <div className="space-y-3">
                    {pollOptions.map((option, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="text-slate-300">{index + 1}.</span>
                        <input
                          value={option}
                          onChange={(e) => {
                            const updated = [...pollOptions];
                            updated[index] = e.target.value;
                            setPollOptions(updated);
                          }}
                          placeholder={`Option ${index + 1}`}
                          className="flex-1 rounded border border-white/10 bg-slate-950/80 px-3 py-2 text-slate-100 outline-none"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => setPollOptions((prev) => prev.filter((_, i) => i !== index))}
                            className="text-sm text-red-300 hover:text-red-200"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setPollOptions((prev) => [...prev, ''])}
                      className="text-sm text-cyan-300 hover:text-cyan-100"
                    >
                      + Add another option
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-300">Images (optional)</label>
            <div className="mt-2 flex flex-col gap-3">
              <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} />
              {uploading ? (
                <div className="text-sm text-slate-400">Uploading...</div>
              ) : imageUrls.length > 0 ? (
                <div className="grid grid-cols-3 gap-2">
                  {imageUrls.map((url, index) => (
                    <img key={`${url}-${index}`} src={url} alt={`preview-${index}`} className="h-16 w-full rounded object-cover" />
                  ))}
                </div>
              ) : null}
              {uploadError && (
                <div className="text-sm text-red-400">{uploadError}</div>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={handleSubmit}
              className="inline-flex items-center justify-center gap-2 rounded bg-violet-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
            >
              <CheckSquare className="h-4 w-4" /> Post Whisper
            </button>
            <button
              onClick={onClose}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10 transition"
            >
              <Lock className="h-4 w-4" /> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};