import React, { useEffect, useState } from 'react';
import { X, ImagePlus, CheckSquare } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { ref as dbRef, set, update } from 'firebase/database';
import { database } from '../../config/firebase';
import { uploadSupabaseFile, SUPABASE_BUCKETS, sanitizeFileName } from '../../config/supabase';

export const CampusIdModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentUser, userData } = useAuth();
  const [campusId, setCampusId] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (userData?.campusProfile) {
      setCampusId(userData.campusProfile.id || '');
      setAvatarUrl(userData.campusProfile.avatarUrl || undefined);
    } else if (userData?.campusId) {
      setCampusId(userData.campusId);
      setAvatarUrl(undefined);
    } else {
      setCampusId('');
      setAvatarUrl(undefined);
    }
  }, [userData]);

  if (!isOpen) return null;

  const handleAvatar = async (file?: File) => {
    if (!file || !currentUser) return;
    setBusy(true);
    try {
      const fileName = `avatars/${currentUser.uid}/${Date.now()}-${sanitizeFileName(file.name)}`;
      const url = await uploadSupabaseFile(SUPABASE_BUCKETS.avatars, fileName, file);
      setAvatarUrl(url);
    } catch (e: any) {
      console.error('Campus ID avatar upload failed:', e);
    }
    setBusy(false);
  };

  const handleSubmit = async () => {
    if (!currentUser) return onClose();
    setBusy(true);
    try {
      const profile = {
        id: campusId || `user-${currentUser.uid.slice(0, 6)}`,
        avatarUrl: avatarUrl || null
      };
      await set(dbRef(database, `users/${currentUser.uid}/campusProfile`), profile);
      await update(dbRef(database, `users/${currentUser.uid}`), { campusId: profile.id });
    } catch (e) {
      // ignore
    }
    setBusy(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-lg bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Create your Whisper ID</h3>
          <button onClick={onClose} className="text-slate-300"><X className="h-5 w-5" /></button>
        </div>

        <div className="mt-4 space-y-4">
          <div>
            <label className="text-sm text-slate-300">Whisper ID (unique)</label>
            <input value={campusId} onChange={(e) => setCampusId(e.target.value)} placeholder="ex spidernoire" className="mt-2 w-full rounded border px-3 py-2 bg-slate-800 text-white outline-none" />
          </div>
          {/* Display name removed — only campus id is used */}

          <div>
            <label className="text-sm text-slate-300">Avatar (optional)</label>
            <div className="mt-2 flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setAvatarFile(f); handleAvatar(f); } }} />
              {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-10 w-10 rounded-full object-cover" /> : null}
            </div>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button onClick={handleSubmit} disabled={busy} className="rounded bg-violet-500 px-4 py-2 text-white">{busy ? 'Saving...' : 'Save'}</button>
            <button onClick={onClose} className="rounded border px-4 py-2 text-slate-200">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};
