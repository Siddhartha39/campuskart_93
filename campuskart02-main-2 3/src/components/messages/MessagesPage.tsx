import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ref, onValue, push, update, get } from 'firebase/database';
import { database } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Send, IndianRupee, Users } from 'lucide-react';
import BackButton from '../common/BackButton';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export const MessagesPage: React.FC = () => {
  const navigate = useNavigate();
  const query = useQuery();
  const { currentUser } = useAuth();

  const sellerId = query.get('userId') || '';
  const itemId = query.get('itemId') || '';
  const chatIdParam = query.get('chatId') || '';
  const chatType = query.get('chatType') || '';
  const whisperAuthorIdParam = query.get('whisperAuthorId') || '';
  const whisperAuthorCampusIdParam = query.get('whisperAuthorCampusId') || '';
  const [item, setItem] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [chatMeta, setChatMeta] = useState<any | null>(null);
  const [myChats, setMyChats] = useState<{ chatId: string; meta?: any; counterpartId?: string; counterpartName?: string; itemName?: string; isSeller?: boolean; isRecruitment?: boolean; isWhisper?: boolean; recruitmentPurpose?: string }[]>([]);
  const [tab, setTab] = useState<'buying' | 'selling' | 'recruitment' | 'whisper'>(() => (chatType === 'whisper' ? 'whisper' : 'buying'));
  const [text, setText] = useState('');
  const [offer, setOffer] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  const chatId = useMemo(() => {
    if (chatIdParam) return chatIdParam;
    if (!currentUser?.uid || !sellerId) return '';
    const a = currentUser.uid < sellerId ? currentUser.uid : sellerId;
    const b = currentUser.uid < sellerId ? sellerId : currentUser.uid;
    return itemId ? `${a}_${b}_${itemId}` : `${a}_${b}`;
  }, [currentUser, sellerId, itemId, chatIdParam]);

  useEffect(() => {
    if (!itemId) return;
    const itemRef = ref(database, `items/${itemId}`);
    return onValue(itemRef, (snap) => setItem(snap.val()));
  }, [itemId]);

  // Subscribe to selected chat meta and messages
  useEffect(() => {
    if (!chatId) return;
    const metaRef = ref(database, `chats/${chatId}/meta`);
    const offMeta = onValue(metaRef, (snap) => setChatMeta(snap.val() || null));
    const messagesRef = ref(database, `chats/${chatId}/messages`);
    const offMsgs = onValue(messagesRef, (snap) => {
      if (!snap.exists()) { setMessages([]); return; }
      const data = snap.val();
      const list = Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      setMessages(list);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 0);
    });
    return () => { if (typeof offMeta === 'function') offMeta(); if (typeof offMsgs === 'function') offMsgs(); };
  }, [chatId]);

  // Mark notifications for this chat as read when viewing it
  useEffect(() => {
    const markChatNotificationsRead = async () => {
      if (!currentUser?.uid || !chatId) return;
      const notifSnap = await get(ref(database, `notifications/${currentUser.uid}`));
      if (!notifSnap.exists()) return;
      const data = notifSnap.val();
      const updates: Record<string, any> = {};
      Object.keys(data).forEach((k) => {
        const n = data[k];
        if (n?.chatId === chatId && !n?.read) {
          updates[`notifications/${currentUser.uid}/${k}/read`] = true;
        }
      });
      if (Object.keys(updates).length) await update(ref(database), updates);
    };
    markChatNotificationsRead();
  }, [currentUser?.uid, chatId]);

  // Load my chat list with meta and counterpart info
  useEffect(() => {
    if (!currentUser?.uid) return;
    const myRef = ref(database, `userChats/${currentUser.uid}`);
    return onValue(myRef, async (snap) => {
      if (!snap.exists()) { setMyChats([]); return; }
      const ids = Object.keys(snap.val());
      const rows: { chatId: string; meta?: any; counterpartId?: string; counterpartName?: string; itemName?: string; isSeller?: boolean; isRecruitment?: boolean; isWhisper?: boolean; recruitmentPurpose?: string }[] = [];
      for (const id of ids) {
        // fetch meta
        const metaSnap = await get(ref(database, `chats/${id}/meta`));
        const meta = metaSnap.exists() ? metaSnap.val() : {};
        // resolve counterpart uid
        let counterpartId: string | undefined = undefined;
        if (meta?.users) {
          const keys = Object.keys(meta.users);
          counterpartId = keys.find((k: string) => k !== currentUser.uid);
        }
        // fetch counterpart name
        let counterpartName: string | undefined = undefined;
        if (counterpartId) {
          const uSnap = await get(ref(database, `users/${counterpartId}`));
          counterpartName = uSnap.exists() ? (uSnap.val()?.name || counterpartId) : counterpartId;
        }
        // item name if present
        let itemName: string | undefined = undefined;
        let isSeller = false;
        let isRecruitment = false;
        let recruitmentPurpose: string | undefined = undefined;
        
        if (meta?.type === 'recruitment') {
          isRecruitment = true;
          recruitmentPurpose = meta?.recruitmentPurpose || 'Recruitment';
        }
        const isWhisper = meta?.type === 'whisper';
        if (!isRecruitment && !isWhisper && meta?.itemId) {
          const iSnap = await get(ref(database, `items/${meta.itemId}`));
          const iv = iSnap.exists() ? iSnap.val() : null;
          itemName = iv?.productName || '';
          if (iv?.sellerId && currentUser?.uid) {
            isSeller = iv.sellerId === currentUser.uid;
          }
        }
        rows.push({ chatId: id, meta, counterpartId, counterpartName, itemName, isSeller, isRecruitment, isWhisper, recruitmentPurpose });
      }
      // sort by updatedAt desc
      rows.sort((a, b) => (b.meta?.updatedAt || 0) - (a.meta?.updatedAt || 0));
      setMyChats(rows);
    });
  }, [currentUser?.uid]);

  const send = async (payload: any) => {
    if (!currentUser || !chatId) return;
    const msgRef = ref(database, `chats/${chatId}/messages`);
    await push(msgRef, payload);
    const usersMap = chatMeta?.users || (sellerId ? { [currentUser.uid]: true, [sellerId]: true } : { [currentUser.uid]: true });
    await update(ref(database, `chats/${chatId}/meta`), {
      itemId: itemId || null,
      updatedAt: Date.now(),
      lastMessage: payload.type === 'offer' ? `Offer: ₹${payload.offerPrice}` : payload.text || '',
      lastSender: currentUser.uid,
      users: usersMap
    });
    // index chat for all participants
    await update(ref(database, `userChats/${currentUser.uid}`), { [chatId]: true });
    const participantIds = Object.keys(usersMap).filter(u => u !== currentUser.uid);
    for (const uid of participantIds) {
      await update(ref(database, `userChats/${uid}`), { [chatId]: true });
    }
    // Notification for recipient
    let recipient: string | undefined = undefined;
    const candidateIds = usersMap ? Object.keys(usersMap) : [];
    recipient = candidateIds.find(k => k !== currentUser.uid);
    if (recipient && recipient !== currentUser.uid) {
      await push(ref(database, `notifications/${recipient}`), {
        type: payload.type === 'offer' ? 'offer' : 'message',
        chatId,
        itemId: itemId || null,
        text: payload.type === 'offer' ? `New offer: ₹${payload.offerPrice}` : (payload.text || ''),
        read: false,
        createdAt: Date.now(),
        from: currentUser.uid
      });
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    await send({ type: 'text', text: text.trim(), senderId: currentUser?.uid, createdAt: Date.now() });
    setText('');
  };

  const handleOffer = async () => {
    const price = parseInt(offer, 10);
    if (!price || price <= 0) return;
    await send({ type: 'offer', offerPrice: price, senderId: currentUser?.uid, createdAt: Date.now() });
    setOffer('');
  };

  useEffect(() => {
    const ensureWhisperMeta = async () => {
      if (!chatId || chatType !== 'whisper' || !currentUser?.uid || !sellerId) return;
      if (chatMeta?.type === 'whisper' && chatMeta?.whisperAuthorId) return;

      try {
        const authorId = whisperAuthorIdParam || sellerId;
        await update(ref(database, `chats/${chatId}/meta`), {
          type: 'whisper',
          whisperAuthorId: authorId,
          whisperAuthorCampusId: whisperAuthorCampusIdParam || '',
        });
      } catch (error) {
        console.error('Unable to save whisper chat metadata', error);
      }
    };
    ensureWhisperMeta();
  }, [chatId, chatType, whisperAuthorIdParam, whisperAuthorCampusIdParam, sellerId, chatMeta?.type, chatMeta?.whisperAuthorId, currentUser?.uid]);

  useEffect(() => {
    if (chatType === 'whisper' && tab !== 'whisper') {
      setTab('whisper');
    }
  }, [chatType, tab]);

  const cur = myChats.find(m => m.chatId === chatId);

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 via-fuchsia-50 to-slate-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-white rounded-[1.75rem] shadow-2xl border border-violet-200 overflow-hidden grid grid-cols-1 md:grid-cols-3">
          {/* Sidebar */}
          <div className="border-r md:col-span-1 bg-slate-50">
            <div className="p-4 border-b border-slate-200 flex items-center gap-3">
              <BackButton toHomeFallback="/dashboard" />
              <h2 className="font-semibold text-slate-900">Chats</h2>
            </div>
            <div className="px-3 pt-3">
              <div className="inline-flex text-sm rounded-2xl border border-violet-200 overflow-hidden shadow-sm">
                <button
                  className={`px-3 py-2 ${tab === 'buying' ? 'bg-violet-600 text-white' : 'bg-white text-violet-600'} transition-colors duration-200`}
                  onClick={() => setTab('buying')}
                >Buying</button>
                <button
                  className={`px-3 py-2 border-l ${tab === 'selling' ? 'bg-violet-600 text-white' : 'bg-white text-violet-600'} transition-colors duration-200`}
                  onClick={() => setTab('selling')}
                >Selling</button>
                <button
                  className={`px-3 py-2 border-l ${tab === 'recruitment' ? 'bg-violet-600 text-white' : 'bg-white text-violet-600'} transition-colors duration-200`}
                  onClick={() => setTab('recruitment')}
                >Recruitment</button>
                <button
                  className={`px-3 py-2 border-l ${tab === 'whisper' ? 'bg-violet-600 text-white' : 'bg-white text-violet-600'} transition-colors duration-200`}
                  onClick={() => setTab('whisper')}
                >Whisper</button>
              </div>
            </div>
            <div className="p-2 max-h-[70vh] overflow-y-auto space-y-2">
              {myChats.length === 0 ? (
                <p className="text-sm text-gray-500 px-2 py-4">No conversations yet.</p>
              ) : (
                myChats
                  .filter(c => {
                    if (tab === 'recruitment') return c.isRecruitment;
                    if (tab === 'whisper') return c.isWhisper;
                    if (tab === 'selling') return !c.isRecruitment && !c.isWhisper && c.isSeller;
                    return !c.isRecruitment && !c.isWhisper && !c.isSeller;
                  })
                  .map(c => (
                  <button
                    key={c.chatId}
                    onClick={() => navigate(`/messages?chatId=${encodeURIComponent(c.chatId)}`)}
                    className={`w-full flex items-start gap-3 px-3 py-3 rounded-lg hover:bg-gray-50 ${chatId === c.chatId ? 'bg-gray-50' : ''}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        {c.isWhisper ? (
                          <div className="font-medium truncate text-left">
                            {c.meta?.whisperAuthorCampusId || c.meta?.whisperAuthorId || 'Whisper chat'}
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); if (c.counterpartId) navigate(`/profile/${c.counterpartId}`); }}
                            className="font-medium truncate text-left hover:underline"
                            title="Open profile"
                          >
                            {c.counterpartName || c.chatId}
                          </button>
                        )}
                        {c.meta?.updatedAt && (
                          <div className="text-[10px] text-gray-500 ml-2 whitespace-nowrap">{new Date(c.meta.updatedAt).toLocaleTimeString()}</div>
                        )}
                      </div>
                      {c.itemName && (
                        <div className="text-[11px] text-gray-500 truncate">{c.isSeller ? 'Selling' : 'Buying'} · {c.itemName}</div>
                      )}
                      {c.isRecruitment && c.recruitmentPurpose && (
                        <div className="text-[11px] text-pink-600 truncate flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          Recruitment · {c.recruitmentPurpose}
                        </div>
                      )}
                      <div className="text-xs text-slate-500 truncate">{c.meta?.lastMessage || 'Start chatting'}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation */}
          <div className="md:col-span-2 flex flex-col">
            <div className="p-4 border-b">
              {(() => {
                const cur = myChats.find(m => m.chatId === chatId);
                return (
                  <div>
                    {cur?.isWhisper ? (
                      <div className="text-lg font-semibold text-slate-900">Whisper ID: <span className="font-mono text-slate-900">{cur?.meta?.whisperAuthorCampusId || cur?.meta?.whisperAuthorId || 'Unknown'}</span></div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { if (cur?.counterpartId) navigate(`/profile/${cur.counterpartId}`); }}
                        className="font-semibold hover:underline text-left"
                        title="Open profile"
                      >
                        {cur?.counterpartName || 'Chat'}
                      </button>
                    )}
                    {cur?.isRecruitment && cur?.recruitmentPurpose && (
                      <p className="text-xs text-pink-600 flex items-center gap-1 mt-1">
                        <Users className="h-3 w-3" />
                        Recruitment: {cur.recruitmentPurpose}
                      </p>
                    )}
                  </div>
                );
              })()}
              {item && !cur?.isWhisper && <p className="text-xs text-gray-500">Item: {item.productName}</p>}
            </div>
            <div className="p-4 space-y-3 flex-1 min-h-[50vh] max-h-[65vh] overflow-y-auto bg-gradient-to-b from-violet-50 via-fuchsia-50 to-white">
              {messages.map(m => (
                <div key={m.id} className={`flex ${m.senderId === currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-3xl text-sm shadow-lg transition duration-300 ${m.senderId === currentUser?.uid ? 'bg-gradient-to-br from-violet-600 via-fuchsia-500 to-cyan-500 text-white rounded-br-none shadow-violet-200/50 transform hover:-translate-y-0.5' : 'bg-white text-slate-900 rounded-bl-none shadow-slate-200/80 transform hover:-translate-y-0.5'}`}>
                    {m.type === 'offer' ? (
                      <div className="flex items-center gap-2 font-semibold"><IndianRupee className="h-4 w-4" /> Offer: ₹{m.offerPrice}</div>
                    ) : m.type === 'recruitment_inquiry' ? (
                      <div className="flex items-center gap-2"><Users className="h-4 w-4" /> {m.text}</div>
                    ) : (
                      <span>{m.text}</span>
                    )}
                    {m.createdAt && (
                      <div className="mt-1 text-[11px] text-slate-300 opacity-80">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
            <div className="p-4 border-t space-y-3 bg-white/80 backdrop-blur-sm">
              {(() => {
                const cur = myChats.find(m => m.chatId === chatId);
                return !cur?.isRecruitment && !cur?.isWhisper && (
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <input
                      type="number"
                      placeholder="Offer price (₹)"
                      className="w-full sm:w-40 px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                      value={offer}
                      onChange={(e) => setOffer(e.target.value)}
                    />
                    <button onClick={handleOffer} className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-slate-900 text-white font-semibold transition hover:bg-slate-800 shadow-lg shadow-slate-900/10">
                      Send Offer
                    </button>
                  </div>
                );
              })()}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  placeholder={cur?.isRecruitment || cur?.isWhisper ? 'Type your whisper here...' : 'Type a message'}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="flex-1 px-4 py-3 border border-slate-300 rounded-2xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSend(); } }}
                />
                <button
                  onClick={handleSend}
                  className={`w-full sm:w-auto px-5 py-3 rounded-2xl font-semibold shadow-lg transition hover:scale-[1.01] ${cur?.isRecruitment || cur?.isWhisper ? 'bg-rose-600 text-white shadow-rose-500/20 hover:bg-rose-500' : 'bg-gradient-to-r from-sky-600 to-cyan-500 text-white shadow-sky-500/20 hover:bg-sky-500'}`}
                >
                  <Send className="h-4 w-4" /> {cur?.isRecruitment || cur?.isWhisper ? 'Whisper' : 'Send'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
