import React from 'react';
import { Link } from 'react-router-dom';
import BackButton from '../common/BackButton';

export const DownloadPage: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.12),_transparent_22%),linear-gradient(180deg,_#f8fafc_0%,_#eff6ff_45%,_#f8fafc_100%)] py-10">
      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-[2rem] shadow-2xl border border-slate-200 p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Download Mobile App</h1>
              <p className="text-sm text-slate-600 mt-1">Get the CampusKart Android APK here.</p>
            </div>
            <BackButton toHomeFallback="/dashboard" />
          </div>

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <a href="/app.apk" className="inline-flex items-center justify-center rounded-full bg-cyan-600 px-6 py-3 text-white font-semibold hover:bg-cyan-500 transition">Download APK</a>
              <Link to="/" className="text-sm text-slate-600">Or return to homepage</Link>
            </div>

            <div className="text-sm text-slate-500">
              <p>Notes:</p>
              <ul className="list-disc ml-5 mt-2">
                <li>Android devices may block installation from unknown sources — users must allow installation from your browser or file manager.</li>
                <li>For Play Store distribution consider publishing there for easier installs and automatic updates.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DownloadPage;
