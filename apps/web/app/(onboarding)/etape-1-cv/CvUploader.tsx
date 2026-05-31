'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

const MAX_BYTES = 10 * 1024 * 1024;

type State = 'idle' | 'validating' | 'uploading' | 'success' | 'error';

export function CvUploader() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const validateClient = (file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Seuls les fichiers PDF sont acceptés.';
    }
    if (file.size > MAX_BYTES) {
      return 'Le fichier dépasse 10 MB.';
    }
    return null;
  };

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState('validating');
    const err = validateClient(file);
    if (err) {
      setState('error');
      setMessage(err);
      return;
    }
    setState('uploading');
    setMessage('Envoi en cours…');
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch('/api/cv/upload', { method: 'POST', body: fd });
      const json = (await res.json()) as
        | { ok: true; data: { cvId: string; parsingStatus: string; version: number } }
        | { ok: false; error: { code: string; message: string } };
      if (!json.ok) {
        setState('error');
        setMessage(json.error.message);
        return;
      }
      setState('success');
      setMessage("CV reçu ! On l'analyse, c'est rapide…");
      // Fire-and-forget parse trigger (Story 1.7) — la page se refresh quand fini.
      const cvId = json.data.cvId;
      fetch('/api/cv/parse', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ cvId }),
      })
        .then(() => {
          startTransition(() => router.refresh());
        })
        .catch(() => {
          // Erreur silencieuse — l'utilisateur peut re-trigger depuis la page
          startTransition(() => router.refresh());
        });
    } catch {
      setState('error');
      setMessage('Erreur réseau. Réessaie.');
    }
  };

  return (
    <div className="space-y-4">
      <label
        htmlFor="cv-file"
        className="flex min-h-[160px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-300 bg-[#f7f5f1] p-8 text-center transition-all hover:border-orange-500 hover:bg-orange-50/40"
      >
        <span className="text-sm font-semibold text-neutral-900">
          Clique pour choisir ton CV PDF
        </span>
        <span className="mt-1 text-xs text-neutral-500">Format PDF · 10 MB max</span>
        <input
          ref={inputRef}
          id="cv-file"
          type="file"
          accept="application/pdf,.pdf"
          className="sr-only"
          onChange={onChange}
          disabled={state === 'uploading'}
        />
      </label>

      {message ? (
        <div
          role="status"
          aria-live="polite"
          className={
            state === 'error'
              ? 'rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700'
              : state === 'success'
                ? 'rounded-2xl border border-neutral-200 bg-[#f7f5f1] p-3 text-sm text-neutral-800'
                : 'rounded-2xl border border-neutral-200 bg-[#f7f5f1] p-3 text-sm text-neutral-700'
          }
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
