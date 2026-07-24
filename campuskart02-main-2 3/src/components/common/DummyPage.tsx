import React from 'react';
import { Link } from 'react-router-dom';

interface DummyPageProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
}

export const DummyPage: React.FC<DummyPageProps> = ({ title, description, buttonText, buttonLink }) => {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl rounded-[2rem] bg-white border border-slate-200 shadow-2xl p-10 text-center">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">{title}</h1>
        <p className="text-slate-600 mb-8">{description}</p>
        <Link to={buttonLink} className="inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-white font-semibold hover:bg-blue-700 transition">
          {buttonText}
        </Link>
      </div>
    </div>
  );
};
