'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Briefcase, Loader2, MapPin, RefreshCw, Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { CompanyLogo } from '@/components/shared/CompanyLogo';
import {
  cancelPendingReviewAction,
  regenerateCoverLetterAction,
  sendPendingReviewAction,
  type PendingReviewApplication,
} from './actions';

type Props = {
  application: PendingReviewApplication;
  open: boolean;
  onClose: () => void;
};

const MIN_CHARS = 50;
const MAX_CHARS = 8000;

export function CoverLetterEditor({ application, open, onClose }: Props) {
  const router = useRouter();
  const [text, setText] = useState(application.coverLetterText);
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [sending, startSend] = useTransition();
  const [regenerating, startRegen] = useTransition();
  const [cancelling, startCancel] = useTransition();

  useEffect(() => {
    setText(application.coverLetterText);
    setError(null);
    setConfirmCancel(false);
  }, [application.coverLetterText, application.id]);

  const wordCount = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
  }, [text]);
  const charCount = text.length;

  const isTooShort = charCount < MIN_CHARS;
  const isTooLong = charCount > MAX_CHARS;
  const isBusy = sending || regenerating || cancelling;

  const handleSend = () => {
    setError(null);
    if (isTooShort || isTooLong) {
      setError(`La lettre doit faire entre ${MIN_CHARS} et ${MAX_CHARS} caractères.`);
      return;
    }
    startSend(async () => {
      const res = await sendPendingReviewAction({
        applicationId: application.id,
        letterText: text,
      });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const handleRegenerate = () => {
    setError(null);
    startRegen(async () => {
      const res = await regenerateCoverLetterAction({ applicationId: application.id });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setText(res.data.letterText);
    });
  };

  const handleCancel = () => {
    setError(null);
    startCancel(async () => {
      const res = await cancelPendingReviewAction({ applicationId: application.id });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      router.refresh();
      onClose();
    });
  };

  const company = application.offer.companyName ?? 'Entreprise non précisée';

  return (
    <Dialog open={open} onOpenChange={(o) => (!o ? onClose() : undefined)}>
      <DialogContent
        className="max-w-2xl w-[calc(100vw-2rem)] p-0 overflow-hidden bg-white border border-neutral-100 shadow-2xl"
        aria-describedby={undefined}
      >
        <div className="h-1.5 bg-neutral-900" />

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <CompanyLogo name={application.offer.companyName} size="md" />
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-heading-md font-semibold text-neutral-900 leading-tight tracking-normal">
                {application.offer.title}
              </DialogTitle>
              <p className="text-caption tracking-wider text-neutral-500 uppercase font-semibold mt-1">
                {company}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {application.offer.locationCity ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-caption font-semibold">
                    <MapPin className="w-3 h-3" aria-hidden="true" />
                    {application.offer.locationCity}
                  </span>
                ) : null}
                {application.offer.contractType ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 text-caption font-semibold">
                    <Briefcase className="w-3 h-3" aria-hidden="true" />
                    {application.offer.contractType}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {/* Letter editor */}
        <div className="px-6 py-4 space-y-3">
          <div className="flex items-center justify-between">
            <label
              htmlFor={`letter-${application.id}`}
              className="text-body-sm font-semibold text-neutral-900"
            >
              Ta lettre de motivation
            </label>
            <span
              className={`text-caption font-medium tabular-nums ${
                isTooShort || isTooLong ? 'text-red-600' : 'text-neutral-500'
              }`}
              aria-live="polite"
            >
              {wordCount} mots · {charCount} caractères
            </span>
          </div>
          <div className="relative">
            <textarea
              id={`letter-${application.id}`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isBusy}
              rows={14}
              className="w-full min-h-[280px] max-h-[50vh] resize-y rounded-2xl border border-neutral-200 bg-[#f7f5f1] p-4 text-body-sm text-neutral-900 leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
              aria-describedby={error ? `letter-error-${application.id}` : undefined}
              aria-invalid={Boolean(error)}
              placeholder="Lettre de motivation..."
            />
            {regenerating ? (
              <div className="absolute inset-0 rounded-2xl bg-white/80 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white shadow-md border border-orange-200">
                  <Loader2 className="w-4 h-4 text-orange-500 animate-spin" aria-hidden="true" />
                  <span className="text-body-sm font-medium text-orange-700">
                    Régénération en cours…
                  </span>
                </div>
              </div>
            ) : null}
          </div>

          {error ? (
            <p
              id={`letter-error-${application.id}`}
              role="alert"
              className="flex items-start gap-2 text-body-sm text-red-600"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </p>
          ) : null}

          {application.coverLetterStatus === 'template_fallback' ? (
            <p className="text-caption text-amber-700 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
              <span>IA indisponible — lettre générique fournie. Personnalise-la avant envoi.</span>
            </p>
          ) : null}
        </div>

        {/* Footer actions */}
        <div className="px-6 py-4 border-t border-neutral-100 bg-neutral-50">
          {confirmCancel ? (
            <div className="space-y-3">
              <p className="text-body-sm text-neutral-700">
                Annuler cette candidature ? L&apos;offre restera disponible si tu changes
                d&apos;avis.
              </p>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
                <button
                  type="button"
                  onClick={() => setConfirmCancel(false)}
                  disabled={cancelling}
                  className="px-4 py-2.5 rounded-lg text-body-sm font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors min-h-[44px]"
                >
                  Garder la candidature
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-body-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 transition-colors min-h-[44px]"
                >
                  {cancelling ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <X className="w-4 h-4" aria-hidden="true" />
                  )}
                  Annuler la candidature
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                disabled={isBusy}
                className="text-body-sm font-medium text-neutral-500 hover:text-red-600 transition-colors min-h-[44px] sm:min-h-0 px-2"
              >
                Annuler la candidature
              </button>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:items-center">
                <button
                  type="button"
                  onClick={handleRegenerate}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-body-sm font-semibold text-neutral-700 bg-white border border-neutral-200 hover:border-orange-200 hover:bg-orange-50 disabled:opacity-60 transition-all min-h-[44px]"
                >
                  {regenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  )}
                  Régénérer
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={isBusy || isTooShort || isTooLong}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-body-sm font-semibold text-white bg-neutral-900 shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed transition-all min-h-[44px]"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                  ) : (
                    <Send className="w-4 h-4" aria-hidden="true" />
                  )}
                  Envoyer la candidature
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
