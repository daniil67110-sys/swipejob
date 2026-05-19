'use client';

import { useEffect, useRef, useState } from 'react';
import type { UseFormRegisterReturn, UseFormSetValue } from 'react-hook-form';

type Suggestion = { label: string; postcode: string; citycode: string };

/**
 * Autocomplete ville via l'API publique adresse.data.gouv.fr (gratuit, sans auth, EU).
 * Endpoint: https://api-adresse.data.gouv.fr/search/?q=...&type=municipality
 *
 * V1 : query simple + debounce 250ms + dropdown. Pas de cache, pas d'accessibilité combobox
 * complète (V2 — aria-activedescendant, navigation flèches).
 */
export function CityAutocomplete<TForm extends { city?: string }>({
  defaultValue,
  register,
  setValue,
  error,
}: {
  defaultValue?: string;
  register: UseFormRegisterReturn;
  setValue: UseFormSetValue<TForm>;
  error?: string;
}) {
  const [query, setQuery] = useState(defaultValue ?? '');
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
            properties?: { label?: string; postcode?: string; citycode?: string };
          }>;
        };
        const items: Suggestion[] = (data.features ?? [])
          .map((f) => ({
            label: f.properties?.label ?? '',
            postcode: f.properties?.postcode ?? '',
            citycode: f.properties?.citycode ?? '',
          }))
          .filter((s) => s.label);
        setSuggestions(items);
        setOpen(items.length > 0);
      } catch {
        // ignore abort / network errors silently
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query]);

  const pick = (s: Suggestion) => {
    setQuery(s.label);
    setValue('city' as never, s.label as never, { shouldValidate: true, shouldDirty: true });
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className="space-y-1">
      <label htmlFor="city" className="block text-sm font-medium text-neutral-900">
        Ville
      </label>
      <div className="relative">
        <input
          id="city"
          type="text"
          autoComplete="off"
          {...register}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            register.onChange(e);
          }}
          onFocus={() => setOpen(suggestions.length > 0)}
          className="block w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 min-h-[44px]"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls="city-suggestions"
        />
        {open ? (
          <ul
            id="city-suggestions"
            role="listbox"
            className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-auto rounded-md border border-neutral-200 bg-white shadow-md"
          >
            {suggestions.map((s) => (
              <li key={`${s.citycode}-${s.postcode}`}>
                <button
                  type="button"
                  role="option"
                  onClick={() => pick(s)}
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
      {error ? <p className="text-xs text-error-500">{error}</p> : null}
    </div>
  );
}
