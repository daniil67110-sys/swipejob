'use client';

import { useState, useTransition } from 'react';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { createAccessibilityReportAction } from './actions';

export function ReportForm({ defaultUrl }: { defaultUrl?: string }) {
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<
    { kind: 'idle' } | { kind: 'success' } | { kind: 'error'; message: string }
  >({ kind: 'idle' });

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const input = {
      url: String(data.get('url') ?? ''),
      description: String(data.get('description') ?? ''),
      contactEmail: String(data.get('contactEmail') ?? ''),
    };
    startTransition(async () => {
      const res = await createAccessibilityReportAction(input);
      if (res.ok) {
        setStatus({ kind: 'success' });
        form.reset();
      } else {
        setStatus({ kind: 'error', message: res.error });
      }
    });
  }

  if (status.kind === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-neutral-200 bg-[#f7f5f1] p-4 flex items-start gap-3"
      >
        <CheckCircle2 className="w-5 h-5 text-neutral-900 mt-0.5" aria-hidden="true" />
        <div>
          <p className="font-semibold text-neutral-900">Merci, ton signalement est bien arrivé.</p>
          <p className="text-body-sm text-neutral-700 mt-1">
            Notre équipe le traite dans les meilleurs délais. Si tu as laissé un email, on reviendra
            vers toi.
          </p>
          <button
            type="button"
            onClick={() => setStatus({ kind: 'idle' })}
            className="mt-3 text-body-sm font-medium text-orange-600 hover:underline"
          >
            Envoyer un autre signalement
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div>
        <label htmlFor="url" className="block text-body-sm font-semibold text-neutral-800 mb-1">
          URL concernée <span className="text-red-600">*</span>
        </label>
        <input
          id="url"
          name="url"
          type="text"
          required
          defaultValue={defaultUrl}
          placeholder="https://swipejob.fr/…"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-body-sm placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-body-sm font-semibold text-neutral-800 mb-1"
        >
          Description du problème <span className="text-red-600">*</span>
        </label>
        <textarea
          id="description"
          name="description"
          required
          minLength={10}
          rows={5}
          placeholder="Exemple : le bouton « Postuler » n'est pas accessible au lecteur d'écran (NVDA) sur la page de détail d'une offre…"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-body-sm placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
        />
      </div>

      <div>
        <label
          htmlFor="contactEmail"
          className="block text-body-sm font-semibold text-neutral-800 mb-1"
        >
          Email de contact (facultatif)
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          placeholder="ton@email.fr"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-body-sm placeholder:text-neutral-400 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/15"
        />
        <p className="mt-1 text-caption text-neutral-500">
          Pour qu'on puisse te répondre. Non utilisé à d'autres fins.
        </p>
      </div>

      {status.kind === 'error' ? (
        <div
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-3 flex items-start gap-2 text-red-700"
        >
          <AlertCircle className="w-4 h-4 mt-0.5" aria-hidden="true" />
          <p className="text-body-sm">{status.message}</p>
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-2.5 text-body-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="w-4 h-4" aria-hidden="true" />
        {isPending ? 'Envoi…' : 'Envoyer le signalement'}
      </button>
    </form>
  );
}
