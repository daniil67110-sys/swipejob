'use client';

import { useEffect, useRef, useState } from 'react';

type Suggestion = { label: string; postcode: string; citycode: string; lat: number; lng: number };
export type CityGeo = { label: string; lat: number; lng: number };

/**
 * Multi-villes autocomplete (préférences de recherche).
 *
 * - Source : API publique adresse.data.gouv.fr (gratuit, INSEE).
 * - Arrondissements de Paris/Lyon/Marseille exclus.
 * - Chips list + bouton × par ville.
 * - Sync vers `citiesCsv` (string CSV) pour rester compatible avec le form CSV existant.
 */
export function CitiesMultiAutocomplete({
  defaultGeo,
  onChange,
}: {
  defaultGeo: CityGeo[];
  onChange: (geo: CityGeo[]) => void;
}) {
  const [cities, setCities] = useState<CityGeo[]>(defaultGeo);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
    const handle = window.setTimeout(async () => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(
          query,
        )}&type=municipality&autocomplete=1&limit=8`;
        const res = await fetch(url, { signal: ac.signal });
        if (!res.ok) return;
        const data = (await res.json()) as {
          features?: Array<{
            geometry?: { coordinates?: [number, number] };
            properties?: { label?: string; postcode?: string; citycode?: string };
          }>;
        };
        const pickedLabels = new Set(cities.map((c) => c.label));
        const items: Suggestion[] = (data.features ?? [])
          .map((f) => ({
            label: f.properties?.label ?? '',
            postcode: f.properties?.postcode ?? '',
            citycode: f.properties?.citycode ?? '',
            lng: f.geometry?.coordinates?.[0] ?? 0,
            lat: f.geometry?.coordinates?.[1] ?? 0,
          }))
          .filter((s) => s.label && s.lat && s.lng)
          .filter((s) => !/arrondissement/i.test(s.label))
          .filter((s) => !pickedLabels.has(s.label));
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch {
        // ignore
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, cities]);

  const sync = (next: CityGeo[]) => {
    setCities(next);
    onChange(next);
  };

  const add = (s: Suggestion) => {
    if (cities.some((c) => c.label === s.label)) return;
    sync([...cities, { label: s.label, lat: s.lat, lng: s.lng }]);
    setQuery('');
    setOpen(false);
  };

  const remove = (label: string) => {
    sync(cities.filter((c) => c.label !== label));
  };

  return (
    <div ref={wrapperRef} className="space-y-2">
      {cities.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {cities.map((c) => (
            <li
              key={c.label}
              className="flex items-center gap-1 rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs"
            >
              <span>{c.label}</span>
              <button
                type="button"
                aria-label={`Retirer ${c.label}`}
                onClick={() => remove(c.label)}
                className="ml-1 rounded-full px-1 text-neutral-600 hover:bg-orange-500/20 hover:text-neutral-900"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="relative">
        <input
          type="text"
          autoComplete="off"
          placeholder="Tape une ville…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(suggestions.length > 0)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestions[0]) {
              e.preventDefault();
              add(suggestions[0]);
            }
          }}
          className="block w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15 min-h-[44px]"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="cities-suggestions"
        />
        {open ? (
          <ul
            id="cities-suggestions"
            role="listbox"
            className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-md border border-neutral-200 bg-white shadow-md"
          >
            {suggestions.map((s) => (
              <li key={`${s.citycode}-${s.postcode}`}>
                <button
                  type="button"
                  role="option"
                  onClick={() => add(s)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100"
                >
                  {s.label}
                  {s.postcode ? <span className="text-neutral-500"> · {s.postcode}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
