import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../config/firebase';
import { MapPin, School } from 'lucide-react';
import { initializeColleges } from '../../utils/initializeColleges';
import { cities as localCities } from '../../data/colleges';

export type CollegeSelectValue = {
  city: string;
  college: string;
};

type Props = {
  value: CollegeSelectValue;
  onChange: (val: CollegeSelectValue) => void;
  required?: boolean;
  labelCity?: string;
  labelCollege?: string;
  className?: string;
  showSearch?: boolean;
  // 'byCity' -> pick city then search college within, 'global' -> search across all cities
  searchMode?: 'byCity' | 'global';
  // If true, render a single-box combobox with suggestions (global search)
  comboMode?: boolean;
  darkMode?: boolean;
};

export const CollegeSelect: React.FC<Props> = ({
  value,
  onChange,
  required = false,
  labelCity = 'City',
  labelCollege = 'College',
  className,
  showSearch = true,
  searchMode = 'byCity',
  comboMode = false,
  darkMode = false,
}) => {
  const [cities, setCities] = useState<string[]>([]);
  const [colleges, setColleges] = useState<string[]>([]);
  const [allColleges, setAllColleges] = useState<{ city: string; name: string }[]>([]);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Load cities list and aggregate all colleges
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const fallbackList = Object.entries(localCities).flatMap(([city, collegeList]) =>
      collegeList.map((name) => ({ city, name }))
    );
    setCities(Object.keys(localCities));
    setAllColleges(fallbackList);

    const setup = async () => {
      await initializeColleges();
      const collegesRef = ref(database, 'colleges');
      const unsub = onValue(collegesRef, (snap) => {
        if (!mounted) return;

        let agg: { city: string; name: string }[] = [];
        let cityKeys: string[] = [];

        if (snap.exists()) {
          const data = snap.val();
          cityKeys = Object.keys(data);
          cityKeys.forEach((city) => {
            const cityObj = data[city] || {};
            Object.keys(cityObj).forEach((k) => {
              const name = cityObj[k]?.name || cityObj[k];
              if (name) agg.push({ city, name });
            });
          });
        } else {
          console.log('Firebase colleges empty, using local data');
          agg = fallbackList;
          cityKeys = Object.keys(localCities);
        }

        setCities(cityKeys);
        setAllColleges(agg);
        setLoading(false);
      });
      return unsub;
    };

    let unsubscribe: (() => void) | undefined;
    setup().then((unsub) => {
      unsubscribe = unsub;
    });

    return () => {
      mounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Load colleges when city changes
  useEffect(() => {
    if (!value.city) {
      setColleges([]);
      return;
    }
    
    // Try to get from Firebase first
    const cityRef = ref(database, `colleges/${value.city}`);
    const unsub = onValue(cityRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list = Object.keys(data).map((k) => data[k]?.name || data[k]);
        setColleges(list);
      } else {
        // Fallback to local data
        const localCollages = (localCities as any)[value.city] || [];
        setColleges(localCollages);
      }
    });
    return () => unsub();
  }, [value.city]);

  const filteredGlobal = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return allColleges;
    return allColleges.filter((c) => c.name.toLowerCase().includes(q));
  }, [allColleges, query]);

  const filteredByCity = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return colleges;
    return colleges.filter((c) => c.toLowerCase().includes(q));
  }, [colleges, query]);

  // Initialize query from value when it changes
  useEffect(() => {
    if (value.college) setQuery(value.college);
  }, [value.college]);

  // ComboBox: single input with dropdown suggestions
  if (comboMode) {
    return (
      <div className={className}>
        <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{labelCollege}{required ? ' *' : ''}</label>
        <div className="relative">
          <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>
            <School className="h-5 w-5" />
          </div>
          <input
            ref={inputRef}
            type="text"
            required={required}
            placeholder="Search college..."
            className={`block w-full pl-12 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 transition-all ${
              darkMode
                ? 'bg-white/10 border border-white/20 text-white placeholder-gray-500 focus:ring-violet-500 focus:border-transparent hover:bg-white/15'
                : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-blue-500 focus:border-transparent'
            }`}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(0);
              // Clear selection if user edits
              if (value.college !== e.target.value) onChange({ city: '', college: '' });
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) {
                setOpen(true);
                return;
              }
              const max = Math.max(filteredGlobal.length - 1, 0);
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlight((h) => Math.min(h + 1, max));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlight((h) => Math.max(h - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const picked = filteredGlobal[highlight];
                if (picked) {
                  onChange({ city: picked.city, college: picked.name });
                  setQuery(picked.name);
                  setOpen(false);
                }
              } else if (e.key === 'Escape') {
                setOpen(false);
              }
            }}
            aria-autocomplete="list"
            aria-expanded={open}
            role="combobox"
          />
          {open && (
            filteredGlobal.length > 0 ? (
              <ul
                role="listbox"
                className={`absolute z-10 mt-1 w-full max-h-56 overflow-auto rounded-lg py-1 shadow-lg focus:outline-none ${
                  darkMode
                    ? 'bg-slate-800 border border-white/20 ring-1 ring-white/10'
                    : 'bg-white ring-1 ring-black ring-opacity-5'
                }`}
              >
                {filteredGlobal.map((c, idx) => (
                  <li
                    key={`${c.city}-${c.name}`}
                    role="option"
                    aria-selected={idx === highlight}
                    className={`cursor-pointer select-none px-4 py-2 text-sm flex justify-between transition-colors ${
                      darkMode
                        ? idx === highlight
                          ? 'bg-violet-600/30 text-white'
                          : 'text-gray-200 hover:bg-white/10'
                        : idx === highlight
                        ? 'bg-blue-50 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onMouseEnter={() => setHighlight(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                    }}
                    onClick={() => {
                      onChange({ city: c.city, college: c.name });
                      setQuery(c.name);
                      setOpen(false);
                      inputRef.current?.blur();
                    }}
                  >
                    <span>{c.name}</span>
                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-400'}`}>{c.city}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                className={`absolute z-10 mt-1 w-full rounded-lg py-3 px-4 shadow-lg text-sm text-center ${
                  darkMode
                    ? 'bg-slate-800 border border-white/20 text-gray-400'
                    : 'bg-white ring-1 ring-black ring-opacity-5 text-gray-500'
                }`}
              >
                {loading ? 'Loading colleges...' : 'No colleges found'}
              </div>
            )
          )}
        </div>
      </div>
    );
  }

  if (searchMode === 'global') {
    // Global search UI: search box + select of results labeled with city
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">{labelCollege}{required ? ' *' : ''}</label>
        {showSearch && (
          <input
            type="text"
            placeholder="Search college..."
            className="mb-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        )}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <School className="h-5 w-5 text-gray-400" />
          </div>
          <select
            required={required}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={value.college}
            onChange={(e) => {
              const picked = filteredGlobal.find((c) => c.name === e.target.value);
              if (picked) onChange({ city: picked.city, college: picked.name });
              else onChange({ city: '', college: '' });
            }}
          >
            <option value="">Select College</option>
            {filteredGlobal.map((c) => (
              <option key={`${c.city}-${c.name}`} value={c.name}>{c.name} — {c.city}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Default byCity UI
  return (
    <div className={className}>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">{labelCity}{required ? ' *' : ''}</label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MapPin className="h-5 w-5 text-gray-400" />
          </div>
          <select
            required={required}
            className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            value={value.city}
            onChange={(e) => onChange({ city: e.target.value, college: '' })}
          >
            <option value="">Select City</option>
            {cities.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>

      {value.city && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{labelCollege}{required ? ' *' : ''}</label>
          {showSearch && (
            <input
              type="text"
              placeholder="Search college..."
              className="mb-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          )}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <School className="h-5 w-5 text-gray-400" />
            </div>
            <select
              required={required}
              className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={value.college}
              onChange={(e) => onChange({ city: value.city, college: e.target.value })}
            >
              <option value="">Select College</option>
              {filteredByCity.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};

export default CollegeSelect;
