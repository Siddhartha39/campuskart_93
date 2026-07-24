import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, onValue, update, get, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, CheckCircle2, MessageCircle, Briefcase } from 'lucide-react';
import BackButton from '../common/BackButton';

  interface Notif {
  id: string;
  type: 'message' | 'offer' | 'placement' | string;
  chatId?: string;
  fromUserId?: string;
  itemId?: string;
  text?: string;
  offerPrice?: number;
  createdAt?: number;
  read?: boolean;
}

export const NotificationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [items, setItems] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentUser) return;
    const notifRef = ref(database, `notifications/${currentUser.uid}`);
    return onValue(notifRef, async (snap) => {
      if (!snap.exists()) { setNotifs([]); return; }
      const data = snap.val();
      const list: Notif[] = Object.keys(data).map(k => ({ id: k, ...data[k] }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      setNotifs(list);

      const needNames = Array.from(new Set(list.map(n => n.fromUserId).filter(Boolean))) as string[];
      for (const uid of needNames) {
        if (names[uid]) continue;
        const s = await get(ref(database, `users/${uid}`));
        if (s.exists()) setNames(prev => ({ ...prev, [uid]: s.val()?.name || uid }));
      }

      const needItems = Array.from(new Set(list.map(n => n.itemId).filter(Boolean))) as string[];
      for (const iid of needItems) {
        if (items[iid]) continue;
        const s = await get(ref(database, `items/${iid}`));
        if (s.exists()) setItems(prev => ({ ...prev, [iid]: s.val()?.productName || iid }));
      }
    });
  }, [currentUser]);

  const unread = useMemo(() => notifs.filter(n => !n.read), [notifs]);

  const markRead = async (id: string) => {
    if (!currentUser) return;
    await update(ref(database, `notifications/${currentUser.uid}/${id}`), { read: true });
  };

  const openChat = async (n: Notif) => {
    if (!currentUser) return;
    if (n.id) await markRead(n.id);
    if (n.chatId) navigate(`/messages?chatId=${encodeURIComponent(n.chatId)}`);
  };

  const deleteNotification = async (id: string) => {
    if (!currentUser) return;
    await remove(ref(database, `notifications/${currentUser.uid}/${id}`));
  };

  const markAll = async () => {
    if (!currentUser || notifs.length === 0) return;
    const updates: Record<string, any> = {};
    notifs.forEach(n => { if (!n.read) updates[`notifications/${currentUser.uid}/${n.id}/read`] = true; });
    if (Object.keys(updates).length) await update(ref(database), updates);
  };

  const clearAll = async () => {
    if (!currentUser || notifs.length === 0) return;
    if (!window.confirm('Clear all notifications?')) return;
    await remove(ref(database, `notifications/${currentUser.uid}`));
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.22),_transparent_22%),radial-gradient(circle_at_top_right,_rgba(168,85,247,0.18),_transparent_24%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_45%,_#f8fafc_100%)] py-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-1/4 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl opacity-90 animate-pulse" />
        <div className="absolute top-24 right-16 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl opacity-80 animate-pulse delay-200" />
        <div className="absolute bottom-10 left-10 h-56 w-56 rounded-full bg-pink-500/20 blur-3xl opacity-80 animate-pulse delay-400" />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-[2rem] bg-slate-950/95 border border-slate-800 shadow-2xl ring-1 ring-cyan-500/10 overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-800 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-white">
              <BackButton toHomeFallback="/dashboard" />
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-cyan-300/90">Notifications</p>
                <h1 className="text-3xl font-semibold">Campus alerts</h1>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="rounded-full bg-slate-900/90 px-4 py-2 text-sm text-slate-300 ring-1 ring-slate-700">{notifs.length} total • {unread.length} unread</div>
              {unread.length > 0 && (
                <button onClick={markAll} className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-400 transition-all duration-300">
                  Mark all as read
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-800">
            {notifs.length === 0 ? (
              <div className="p-12 text-center text-slate-300">
                <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800 text-cyan-300">
                  <Bell className="h-7 w-7" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">No notifications yet</h2>
                <p className="max-w-xl mx-auto text-sm text-slate-400">Once someone messages you or makes an offer, it will appear here with quick action buttons so you can respond instantly.</p>
              </div>
            ) : (
              notifs.map((n) => {
                const sender = names[n.fromUserId || ''] || 'Someone';
                const itemLabel = n.itemId ? items[n.itemId] : '';
                const isPlacement = n.type === 'placement';
                const isAnon = !n.fromUserId;
                const label = isPlacement ? 'New opportunity' : (n.type === 'message' ? 'Message' : (isAnon ? 'Alert' : 'Offer'));
                const accent = n.type === 'message' ? 'bg-sky-500/10 border-sky-500/20' : (isPlacement ? 'bg-violet-500/10 border-violet-500/20' : (isAnon ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'));

                return (
                  <div key={n.id} className={`group px-6 py-5 sm:px-8 sm:py-6 bg-slate-950/90 border-b border-slate-800 ${!n.read ? 'shadow-[0_30px_60px_-40px_rgba(56,189,248,0.55)]' : ''} hover:bg-slate-900 transition duration-300`}>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-4 min-w-0">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-3xl border ${accent} text-white ring-1 ring-slate-800`}>
                          {n.type === 'message' ? <MessageCircle className="h-5 w-5 text-sky-300" /> : (isPlacement ? <Briefcase className="h-5 w-5 text-violet-300" /> : <Bell className="h-5 w-5 text-amber-300" />)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
                            <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">{label}</span>
                            {!n.read && <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs text-blue-200">Unread</span>}
                            <span className="text-slate-500">{n.createdAt ? new Date(n.createdAt).toLocaleString() : ''}</span>
                          </div>

                          <p className="mt-3 text-base font-semibold text-white truncate">
                            {isPlacement ? (n.text || label) : (isAnon ? label : `${label} from ${sender}${itemLabel ? (n.type === 'message' ? ` about ${itemLabel}` : ` on ${itemLabel}`) : ''}`)}
                          </p>

                          {typeof n.offerPrice === 'number' && n.type !== 'message' && !isPlacement && !isAnon && (
                            <p className="mt-2 text-sm text-emerald-300">Offer: {n.offerPrice}</p>
                          )}

                          {n.text && <p className="mt-2 text-sm leading-6 text-slate-300 line-clamp-2">{n.text}</p>}
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <button onClick={() => markRead(n.id)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-cyan-500 hover:text-cyan-100">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Mark read
                        </button>
                        <button onClick={() => deleteNotification(n.id)} className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200 transition hover:border-red-500 hover:text-red-100">
                          Clear
                        </button>
                        {n.chatId && (
                          <button onClick={() => openChat(n)} className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-sky-500 to-cyan-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 hover:from-sky-400 hover:to-cyan-400 transition">
                            Open chat
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
