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
      setMessage("CV reçu ! On l'analyse.");
      startTransition(() => router.refresh());
    } catch {
      setState('error');
      setMessage('Erreur réseau. Réessaie.');
    }
  };

  return (
    <div className="space-y-4">
      <label
        htmlFor="cv-file"
        className="flex flex-col items-center justify-center cursor-pointer rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50 p-8 text-center transition hover:border-primary-500 hover:bg-primary-100/30 min-h-[160px]"
      >
        <span className="text-sm font-medium text-neutral-900">Clique pour choisir ton CV PDF</span>
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
              ? 'rounded-md border border-error-500/40 bg-error-100 p-3 text-sm text-error-500'
              : state === 'success'
                ? 'rounded-md border border-success-500/40 bg-success-100 p-3 text-sm text-success-500'
                : 'rounded-md border border-neutral-200 bg-neutral-100 p-3 text-sm text-neutral-700'
          }
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
