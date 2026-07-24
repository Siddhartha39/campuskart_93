import React from 'react';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, activeCategory, onSelect }) => {
  return (
    <div className="rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur-xl">
      <p className="text-sm uppercase tracking-[0.3em] text-slate-400">Categories</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => onSelect(category)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeCategory === category ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20' : 'bg-white/5 text-slate-200 hover:bg-white/10'}`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};