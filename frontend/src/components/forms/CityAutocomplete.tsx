import { useEffect, useMemo, useRef, useState } from 'react';

export type CityOption = { id?: number; name?: string; label?: string; title?: string };

type Props = {
  label: string;
  value: string;
  cities: CityOption[];
  loading?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
};

const getCityName = (city: CityOption) => {
  const rawName = typeof city.name === 'string'
    ? city.name
    : typeof city.label === 'string'
      ? city.label
      : typeof city.title === 'string'
        ? city.title
        : '';
  return rawName.trim();
};

export default function CityAutocomplete({ label, value, cities, loading = false, placeholder = 'Casablanca', onChange }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const names = useMemo(() => cities.map(getCityName).filter(Boolean).filter((name, index, list) => list.indexOf(name) === index), [cities]);
  const filteredNames = useMemo(() => {
    const query = value.trim().toLowerCase();
    return names.filter((name) => !query || name.toLowerCase().includes(query));
  }, [names, value]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
    setHighlightedIndex(0);
  };

  return (
    <label className="flex flex-col gap-2 text-xs font-medium text-gray-700">
      {label}
      <div ref={wrapperRef} className="relative">
        <input
          className="w-full rounded-2xl border border-gray-300 px-3 py-2 text-xs outline-none focus:border-blue-500"
          value={value}
          onFocus={() => setOpen(true)}
          onChange={(event) => { onChange(event.target.value); setOpen(true); setHighlightedIndex(0); }}
          onKeyDown={(event) => {
            if (!open || filteredNames.length === 0) return;
            if (event.key === 'ArrowDown') { event.preventDefault(); setHighlightedIndex((index) => (index + 1) % filteredNames.length); }
            if (event.key === 'ArrowUp') { event.preventDefault(); setHighlightedIndex((index) => (index - 1 + filteredNames.length) % filteredNames.length); }
            if (event.key === 'Enter') { event.preventDefault(); choose(filteredNames[highlightedIndex]); }
            if (event.key === 'Escape') setOpen(false);
          }}
          placeholder={loading ? 'Loading cities...' : placeholder}
          autoComplete="off"
        />
        {open ? (
          <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
            {filteredNames.length > 0 ? filteredNames.map((name, index) => (
              <button key={name} type="button" className={`block w-full px-3 py-2 text-left text-xs ${index === highlightedIndex ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`} onMouseEnter={() => setHighlightedIndex(index)} onMouseDown={(event) => { event.preventDefault(); choose(name); }}>{name}</button>
            )) : <p className="px-3 py-2 text-xs text-gray-500">No matching cities</p>}
          </div>
        ) : null}
      </div>
    </label>
  );
}