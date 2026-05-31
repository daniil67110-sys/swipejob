'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { setEducationAction } from './education-actions';

type SchoolResult = { id: string; name: string; type: string | null; city: string | null };

const EDUCATION_LEVELS = [
  'Lycée',
  'BTS/DUT',
  'Licence',
  'Bachelor',
  'Master',
  "École d'ingénieur",
  'Doctorat',
] as const;

export function SchoolEducationSection({
  initialSchool,
  initialLevel,
}: {
  initialSchool: { schoolId: string | null; name: string; unverified: boolean } | null;
  initialLevel: string | null;
}) {
  const [query, setQuery] = useState(initialSchool?.name ?? '');
  const [results, setResults] = useState<SchoolResult[]>([]);
  const [selected, setSelected] = useState<SchoolResult | null>(
    initialSchool?.schoolId
      ? { id: initialSchool.schoolId, name: initialSchool.name, type: null, city: null }
      : null,
  );
  const [unverifiedName, setUnverifiedName] = useState<string>(
    initialSchool?.unverified ? initialSchool.name : '',
  );
  const [level, setLevel] = useState<string>(initialLevel ?? '');
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 2 || (selected && query === selected.name)) {
      setResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/schools/search?q=${encodeURIComponent(query)}`);
        const json = (await res.json()) as { ok: true; data: SchoolResult[] };
        setResults(json.data ?? []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, selected]);

  const onPick = (r: SchoolResult) => {
    setSelected(r);
    setQuery(r.name);
    setResults([]);
    setUnverifiedName('');
  };

  const onSubmit = () => {
    setMessage(null);
    if (!level) {
      setMessage("Choisis ton niveau d'études.");
      return;
    }
    startTransition(async () => {
      const res = await setEducationAction({
        schoolId: selected?.id ?? null,
        schoolNameUnverified: !selected && unverifiedName ? unverifiedName : null,
        educationLevel: level,
      });
      setMessage(res.ok ? 'Enregistré !' : res.error.message);
    });
  };

  return (
    <section className="space-y-3 rounded-md border border-neutral-200 bg-white p-4">
      <h2 className="text-base font-semibold">Ton école et ton niveau</h2>

      <div className="space-y-1">
        <label htmlFor="school-search" className="block text-sm font-medium text-neutral-900">
          École
        </label>
        <input
          id="school-search"
          type="text"
          placeholder="Tape les premières lettres…"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (selected && e.target.value !== selected.name) setSelected(null);
          }}
          className="block w-full rounded-2xl border border-neutral-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15 min-h-[44px]"
        />
        {results.length > 0 ? (
          <ul className="mt-1 max-h-48 overflow-auto rounded-md border border-neutral-200 bg-white shadow-sm">
            {results.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => onPick(r)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100"
                >
                  <strong>{r.name}</strong>
                  {r.city ? <span className="text-neutral-500"> · {r.city}</span> : null}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        {!selected && query.length >= 2 && results.length === 0 ? (
          <p className="text-xs text-neutral-500">
            Pas trouvée ?{' '}
            <button
              type="button"
              onClick={() => setUnverifiedName(query)}
              className="font-medium text-orange-600 hover:underline"
            >
              Utiliser "{query}" comme nom libre (à valider par l'équipe)
            </button>
          </p>
        ) : null}
        {unverifiedName ? (
          <p className="text-xs text-neutral-600">
            École saisie en libre : <strong>{unverifiedName}</strong>. Elle sera marquée comme non
            vérifiée jusqu'à modération.
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-neutral-900">Niveau d'études</legend>
        <div className="flex flex-wrap gap-3">
          {EDUCATION_LEVELS.map((lvl) => (
            <label key={lvl} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="educationLevel"
                value={lvl}
                checked={level === lvl}
                onChange={(e) => setLevel(e.target.value)}
                className="h-4 w-4 border-neutral-200 text-orange-600 focus:ring-orange-500/40"
              />
              <span>{lvl}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending}
        className="rounded-md border border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px]"
      >
        {isPending ? 'Enregistrement…' : 'Enregistrer école et niveau'}
      </button>

      {message ? (
        <p role="status" aria-live="polite" className="text-xs text-neutral-700">
          {message}
        </p>
      ) : null}
    </section>
  );
}
