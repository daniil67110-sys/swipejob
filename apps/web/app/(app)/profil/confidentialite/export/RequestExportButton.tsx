'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Download, Loader2 } from 'lucide-react';
import { requestRgpdExportAction } from './actions';

export function RequestExportButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ mock?: boolean } | null>(null);

  const onClick = () => {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const res = await requestRgpdExportAction();
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setSuccess({ mock: res.data.mock });
      router.refresh();
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-info-500 to-success-500 text-white text-body-sm font-semibold shadow-md hover:shadow-lg active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all min-h-[48px]"
      >
        {pending ? (
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
        ) : (
          <Download className="w-4 h-4" aria-hidden="true" />
        )}
        Demander l&apos;export de mes données
      </button>

      {success ? (
        <p
          role="status"
          aria-live="polite"
          className="flex items-start gap-2 text-body-sm text-success-500"
        >
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>
            Demande enregistrée. Tu recevras un email avec les liens de download dès que c&apos;est
            prêt.
            {success.mock ? ' (mode dev sans worker — vérifie les logs)' : ''}
          </span>
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="flex items-start gap-2 text-body-sm text-error-500">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
