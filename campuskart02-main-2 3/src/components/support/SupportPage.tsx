import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { SupportTicketModal } from './SupportTicketModal';
import { SupportTicketHistory } from './SupportTicketHistory';
import { MessageSquare, LifeBuoy } from 'lucide-react';

export const SupportPage: React.FC = () => {
  const { userData } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-slate-950/50">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Help & Support</p>
              <h1 className="mt-3 text-3xl font-semibold text-white">Need assistance?</h1>
              <p className="mt-4 max-w-2xl text-slate-300 leading-7">
                If you have an issue with listings, payments, access, or anything campus related, submit a support ticket and our team will follow up soon.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400"
              >
                <LifeBuoy className="h-5 w-5" />
                Open Ticket
              </button>
              <button
                onClick={() => setHistoryOpen(true)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-950/80 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900"
              >
                <MessageSquare className="h-5 w-5" />
                View Ticket History
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
              <p className="text-sm text-cyan-300 uppercase tracking-[0.3em]">Support Focus</p>
              <h2 className="mt-4 text-xl font-semibold text-white">Issues we can help with</h2>
              <ul className="mt-6 space-y-3 text-sm text-slate-300">
                <li>• Account access problems</li>
                <li>• Marketplace disputes</li>
                <li>• Placement or event queries</li>
                <li>• Technical bugs and feedback</li>
              </ul>
            </div>
            <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
              <p className="text-sm text-cyan-300 uppercase tracking-[0.3em]">Your profile</p>
              <h2 className="mt-4 text-xl font-semibold text-white">Logged in as</h2>
              <p className="mt-4 text-sm text-slate-300">{userData?.name || 'User'}</p>
              <p className="mt-2 text-sm text-slate-400">{userData?.email || 'No email available'}</p>
              <p className="mt-2 text-sm text-slate-400">{userData?.college || 'College not set'}</p>
            </div>
            <div className="rounded-[1.75rem] border border-slate-800 bg-slate-950/90 p-6 shadow-xl shadow-slate-950/20">
              <p className="text-sm text-cyan-300 uppercase tracking-[0.3em]">Need a quick fix?</p>
              <h2 className="mt-4 text-xl font-semibold text-white">Common actions</h2>
              <div className="mt-6 space-y-3 text-sm text-slate-300">
                <p>• Check your ticket status in history.</p>
                <p>• Submit details for faster response.</p>
                <p>• Keep your email and college updated.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <SupportTicketModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <SupportTicketHistory isOpen={historyOpen} onClose={() => setHistoryOpen(false)} />
    </div>
  );
};
